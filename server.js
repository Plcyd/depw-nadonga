import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { GoogleGenAI, Modality } from '@google/genai';
import { db, runMigrationsAndSeed } from './src/db/database.js';
import {
  TICKET_STATUSES,
  REQUEST_TYPES,
  PRIORITY_LEVELS,
  canTransitionStatus,
  getExplainableNextStep,
  evaluateRequestCompleteness,
  computeTicketAuditDiff,
  findPotentialDuplicates,
  calculateDashboardMetrics,
  ticketsToCsv,
  generateSampleRequestLetter,
  getManilaSpatialDrainageContext,
} from './src/utils/workflowRules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

runMigrationsAndSeed();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const CreateTicketSchema = z.object({
  dateReceived: z.string().min(4).max(32).optional(),
  barangay: z.string().min(2, 'Barangay name is required').max(100),
  district: z.string().min(2, 'Manila district is required').max(60),
  legislativeDistrict: z.string().min(2).max(40),
  streetAddress: z.string().min(3, 'Street or canal location is required').max(200),
  requestType: z.enum(REQUEST_TYPES),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(PRIORITY_LEVELS).optional(),
  actionTaken: z.string().min(2).max(300).optional(),
  nextStep: z.string().min(2).max(300).optional(),
  requesterName: z.string().min(2, 'Coordinating official name is required').max(120),
  requesterRole: z.string().min(2).max(80).optional(),
  description: z.string().min(5, 'Please provide at least 5 characters of description').max(1500),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  coordSource: z.string().max(60).optional(),
  coordVerified: z.boolean().optional(),
});

const UpdateTicketSchema = CreateTicketSchema.partial().extend({
  actorName: z.string().max(120).optional(),
  actorRole: z.string().max(80).optional(),
  inspectionChecklist: z
    .array(
      z.object({
        item: z.string(),
        done: z.boolean(),
      })
    )
    .optional(),
});

const StatusTransitionSchema = z.object({
  newStatus: z.enum(TICKET_STATUSES),
  actionTaken: z.string().min(2, 'Action taken is required').max(300),
  nextStep: z.string().min(2, 'Next step is required').max(300),
  actorName: z.string().min(2).max(120).optional(),
  actorRole: z.string().min(2).max(80).optional(),
});

function formatTicketRow(row) {
  if (!row) return null;
  let checklist = [];
  try {
    checklist = JSON.parse(row.inspectionChecklistJson || '[]');
  } catch {
    checklist = [];
  }
  return {
    ...row,
    coordVerified: Boolean(row.coordVerified),
    inspectionChecklist: checklist,
    explainableSuggestion: getExplainableNextStep(row.status),
  };
}

function formatAuditRow(row) {
  if (!row) return null;
  let changedFields = [];
  try {
    changedFields = JSON.parse(row.changedFieldsJson || '[]');
  } catch {
    changedFields = [];
  }
  return {
    ...row,
    eventType: row.eventType || 'STATUS_TRANSITION',
    changedFields,
  };
}

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health Check
  app.get('/api/health', (_req, res) => {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
    res.json({
      status: 'ok',
      mode: 'DEPW MANILA COMMAND CENTER',
      database: 'SQLite (WAL mode)',
      ticketCount: countRow ? countRow.count : 0,
      aiConfigured: Boolean(getGeminiClient()),
      timestamp: new Date().toISOString(),
    });
  });

  // Dashboard Metrics, Quarterly Command Center Series & Global Audit Stream
  app.get('/api/metrics', (_req, res, next) => {
    try {
      const rows = db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all();
      const tickets = rows.map(formatTicketRow);
      const metrics = calculateDashboardMetrics(tickets);
      const recentHistory = db
        .prepare('SELECT * FROM ticket_history ORDER BY id DESC LIMIT 20')
        .all()
        .map(formatAuditRow);

      // Current Quarter (Q4 2026) Resolution Time Averages & Water Quality Trends
      const quarterlyResolutionTrends = [
        { week: 'Oct W1', avgResolutionDays: 4.6, slaTargetDays: 3.5, completedCount: 11, activeProjects: 18 },
        { week: 'Oct W2', avgResolutionDays: 4.1, slaTargetDays: 3.5, completedCount: 15, activeProjects: 21 },
        { week: 'Oct W3', avgResolutionDays: 3.4, slaTargetDays: 3.5, completedCount: 19, activeProjects: 16 },
        { week: 'Oct W4', avgResolutionDays: 2.8, slaTargetDays: 3.5, completedCount: 23, activeProjects: 14 },
        { week: 'Nov W1 (Proj)', avgResolutionDays: 2.5, slaTargetDays: 3.5, completedCount: 26, activeProjects: 12 },
        { week: 'Nov W2 (Proj)', avgResolutionDays: 2.3, slaTargetDays: 3.5, completedCount: 28, activeProjects: 10 },
      ];

      const waterQualityTrends = [
        { period: 'Oct 01', dissolvedOxygen: 4.2, h2sPpm: 8.4, turbidityNtu: 68, ammoniaMgL: 3.1, flowIndex: 62 },
        { period: 'Oct 05', dissolvedOxygen: 4.6, h2sPpm: 7.2, turbidityNtu: 61, ammoniaMgL: 2.8, flowIndex: 68 },
        { period: 'Oct 10', dissolvedOxygen: 5.1, h2sPpm: 5.9, turbidityNtu: 52, ammoniaMgL: 2.4, flowIndex: 74 },
        { period: 'Oct 15', dissolvedOxygen: 5.5, h2sPpm: 4.5, turbidityNtu: 44, ammoniaMgL: 1.9, flowIndex: 81 },
        { period: 'Oct 20', dissolvedOxygen: 6.1, h2sPpm: 3.2, turbidityNtu: 36, ammoniaMgL: 1.5, flowIndex: 88 },
        { period: 'Oct 23', dissolvedOxygen: 6.4, h2sPpm: 2.4, turbidityNtu: 29, ammoniaMgL: 1.2, flowIndex: 92 },
      ];

      res.json({
        ...metrics,
        recentHistory,
        quarterlyResolutionTrends,
        waterQualityTrends,
        quarterSummary: {
          quarter: 'Q4 2026 (Oct – Dec)',
          avgResolutionDays: 3.1,
          previousQuarterAvgDays: 4.8,
          improvementPercent: 35.4,
          waterQualityCompliance: 92.4,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // Global Server-Side Audit Log Endpoint
  app.get('/api/audit-logs', (req, res, next) => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
      const rows = db
        .prepare('SELECT * FROM ticket_history ORDER BY id DESC LIMIT ?')
        .all(limit)
        .map(formatAuditRow);
      res.json({ auditLogs: rows, total: rows.length });
    } catch (err) {
      next(err);
    }
  });

  // List Tickets with Search, Filtering, Sorting & Pagination
  app.get('/api/tickets', (req, res, next) => {
    try {
      const {
        search = '',
        status = '',
        requestType = '',
        district = '',
        legislativeDistrict = '',
        sortBy = 'ticketId',
        sortOrder = 'asc',
        page = '1',
        pageSize = '25',
      } = req.query;

      let rows = db.prepare('SELECT * FROM tickets').all().map(formatTicketRow);

      const q = String(search).toLowerCase().trim();
      if (q) {
        rows = rows.filter(
          (t) =>
            t.ticketId.toLowerCase().includes(q) ||
            t.barangay.toLowerCase().includes(q) ||
            t.district.toLowerCase().includes(q) ||
            t.streetAddress.toLowerCase().includes(q) ||
            t.requesterName.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        );
      }

      if (status && status !== 'ALL') {
        rows = rows.filter((t) => t.status === status);
      }
      if (requestType && requestType !== 'ALL') {
        rows = rows.filter((t) => t.requestType === requestType);
      }
      if (district && district !== 'ALL') {
        rows = rows.filter((t) => t.district === district);
      }
      if (legislativeDistrict && legislativeDistrict !== 'ALL') {
        rows = rows.filter((t) => t.legislativeDistrict === legislativeDistrict);
      }

      const validSortFields = ['ticketId', 'dateReceived', 'barangay', 'status', 'district', 'priority', 'updatedAt'];
      const field = validSortFields.includes(String(sortBy)) ? String(sortBy) : 'ticketId';
      const dir = String(sortOrder).toLowerCase() === 'desc' ? -1 : 1;

      rows.sort((a, b) => {
        const valA = String(a[field] || '');
        const valB = String(b[field] || '');
        return valA.localeCompare(valB, undefined, { numeric: true }) * dir;
      });

      const total = rows.length;
      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(String(pageSize), 10) || 25));
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = rows.slice(startIndex, startIndex + limitNum);

      res.json({
        tickets: paginated,
        allFilteredCount: total,
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      });
    } catch (err) {
      next(err);
    }
  });

  // Export CSV of Filtered Tickets
  app.get('/api/tickets/export/csv', (req, res, next) => {
    try {
      const { status = '', requestType = '', search = '' } = req.query;
      let rows = db.prepare('SELECT * FROM tickets ORDER BY ticketId ASC').all().map(formatTicketRow);
      const q = String(search).toLowerCase().trim();
      if (q) {
        rows = rows.filter(
          (t) =>
            t.ticketId.toLowerCase().includes(q) ||
            t.barangay.toLowerCase().includes(q) ||
            t.district.toLowerCase().includes(q)
        );
      }
      if (status && status !== 'ALL') {
        rows = rows.filter((t) => t.status === status);
      }
      if (requestType && requestType !== 'ALL') {
        rows = rows.filter((t) => t.requestType === requestType);
      }

      const csv = ticketsToCsv(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="depw-smart-tracker-register.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  });

  // Dedicated Ticket Audit History Endpoint
  app.get('/api/tickets/:ticketId/audit', (req, res, next) => {
    try {
      const row = db
        .prepare('SELECT ticketId, barangay, district, status FROM tickets WHERE ticketId = ?')
        .get(req.params.ticketId);
      if (!row) {
        return res.status(404).json({ error: 'Ticket not found in Smart Tracker.' });
      }
      const history = db
        .prepare('SELECT * FROM ticket_history WHERE ticketId = ? ORDER BY id DESC')
        .all(req.params.ticketId)
        .map(formatAuditRow);

      res.json({
        ticketId: row.ticketId,
        currentStatus: row.status,
        totalEvents: history.length,
        auditLogs: history,
      });
    } catch (err) {
      next(err);
    }
  });

  // Get Single Ticket + Audit History
  app.get('/api/tickets/:ticketId', (req, res, next) => {
    try {
      const row = db
        .prepare('SELECT * FROM tickets WHERE ticketId = ?')
        .get(req.params.ticketId);
      if (!row) {
        return res.status(404).json({ error: 'Ticket not found in Smart Tracker.' });
      }
      const history = db
        .prepare('SELECT * FROM ticket_history WHERE ticketId = ? ORDER BY id DESC')
        .all(req.params.ticketId)
        .map(formatAuditRow);
      const allTickets = db.prepare('SELECT * FROM tickets').all();
      const duplicates = findPotentialDuplicates(row, allTickets);

      res.json({
        ticket: formatTicketRow(row),
        history,
        potentialDuplicates: duplicates.map((d) => ({
          ticketId: d.ticketId,
          barangay: d.barangay,
          streetAddress: d.streetAddress,
          status: d.status,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  // Create New Ticket (with transaction & initial audit history)
  app.post('/api/tickets', (req, res, next) => {
    try {
      const parsed = CreateTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;
      const existingRows = db.prepare('SELECT ticketId, barangay, streetAddress, requestType, status FROM tickets').all();

      // Generate next DEO-2026-NNN ID safely
      let maxNum = 0;
      for (const r of existingRows) {
        const m = String(r.ticketId).match(/DEO-2026-(\d+)/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      const nextNum = String(maxNum + 1).padStart(3, '0');
      const ticketId = `DEO-2026-${nextNum}`;
      const nowIso = new Date().toISOString();
      const todayFormatted =
        data.dateReceived ||
        new Intl.DateTimeFormat('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        }).format(new Date());

      const status = data.status || 'For Verification';
      const priority = data.priority || 'Routine';
      const actionTaken = data.actionTaken || 'Documents received at DEPW Liaison Desk';
      const nextStep = data.nextStep || 'Verify completeness of Barangay letter and street sketch';
      const requesterRole = data.requesterRole || 'Barangay Kagawad';
      const coordSource = data.coordSource || (data.latitude ? 'Barangay Submitted GIS Pin' : 'Location pending pin');
      const coordVerified = data.coordVerified ? 1 : 0;

      const defaultChecklist = JSON.stringify([
        { item: 'Request letter signed by Barangay official', done: true },
        { item: 'Street segment and nearest landmark identified', done: Boolean(data.streetAddress) },
        { item: 'Joint ocular site inspection completed', done: false },
        { item: 'Silt depth and manhole access measured', done: false },
      ]);

      const initialChanges = [
        { field: 'status', label: 'Workflow Status', before: 'Intake', after: status },
        { field: 'barangay', label: 'Barangay', before: 'None', after: data.barangay },
        { field: 'streetAddress', label: 'Street / Canal Location', before: 'None', after: data.streetAddress },
        { field: 'priority', label: 'Priority Level', before: 'None', after: priority },
      ];

      db.exec('BEGIN');
      try {
        db.prepare(`
          INSERT INTO tickets (
            ticketId, dateReceived, barangay, district, legislativeDistrict,
            streetAddress, requestType, status, priority, actionTaken, nextStep,
            requesterName, requesterRole, description, latitude, longitude,
            coordSource, coordVerified, inspectionChecklistJson, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          ticketId,
          todayFormatted,
          data.barangay,
          data.district,
          data.legislativeDistrict,
          data.streetAddress,
          data.requestType,
          status,
          priority,
          actionTaken,
          nextStep,
          data.requesterName,
          requesterRole,
          data.description,
          data.latitude ?? null,
          data.longitude ?? null,
          coordSource,
          coordVerified,
          defaultChecklist,
          nowIso,
          nowIso
        );

        db.prepare(`
          INSERT INTO ticket_history (
            ticketId, eventType, previousStatus, newStatus, actionTaken,
            changedFieldsJson, actorName, actorRole, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          ticketId,
          'TICKET_CREATED',
          'Intake',
          status,
          actionTaken,
          JSON.stringify(initialChanges),
          data.requesterName,
          'Receiving Liaison Officer',
          nowIso
        );

        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      const created = db.prepare('SELECT * FROM tickets WHERE ticketId = ?').get(ticketId);
      const duplicates = findPotentialDuplicates(created, existingRows);

      res.status(201).json({
        ticket: formatTicketRow(created),
        potentialDuplicates: duplicates,
      });
    } catch (err) {
      next(err);
    }
  });

  // Update Ticket Fields / Coordinates / Checklist with Full Server-Side Audit Diff
  app.patch('/api/tickets/:ticketId', (req, res, next) => {
    try {
      const existing = db
        .prepare('SELECT * FROM tickets WHERE ticketId = ?')
        .get(req.params.ticketId);
      if (!existing) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      const parsed = UpdateTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const updates = parsed.data;
      if (updates.status && updates.status !== existing.status) {
        if (!canTransitionStatus(existing.status, updates.status)) {
          return res.status(400).json({
            error: `Invalid status transition from "${existing.status}" to "${updates.status}".`,
          });
        }
      }

      const nowIso = new Date().toISOString();
      const nextStatus = updates.status ?? existing.status;
      const nextAction = updates.actionTaken ?? existing.actionTaken;
      const nextStep = updates.nextStep ?? existing.nextStep;
      const checklistJson = updates.inspectionChecklist
        ? JSON.stringify(updates.inspectionChecklist)
        : existing.inspectionChecklistJson;

      const candidateUpdated = {
        barangay: updates.barangay ?? existing.barangay,
        district: updates.district ?? existing.district,
        legislativeDistrict: updates.legislativeDistrict ?? existing.legislativeDistrict,
        streetAddress: updates.streetAddress ?? existing.streetAddress,
        requestType: updates.requestType ?? existing.requestType,
        status: nextStatus,
        priority: updates.priority ?? existing.priority,
        actionTaken: nextAction,
        nextStep: nextStep,
        requesterName: updates.requesterName ?? existing.requesterName,
        requesterRole: updates.requesterRole ?? existing.requesterRole,
        description: updates.description ?? existing.description,
        latitude: updates.latitude !== undefined ? updates.latitude : existing.latitude,
        longitude: updates.longitude !== undefined ? updates.longitude : existing.longitude,
        coordSource: updates.coordSource ?? existing.coordSource,
        coordVerified: updates.coordVerified !== undefined ? (updates.coordVerified ? 1 : 0) : existing.coordVerified,
        inspectionChecklistJson: checklistJson,
      };

      const auditDiff = computeTicketAuditDiff(existing, candidateUpdated);

      db.exec('BEGIN');
      try {
        db.prepare(`
          UPDATE tickets SET
            barangay = ?,
            district = ?,
            legislativeDistrict = ?,
            streetAddress = ?,
            requestType = ?,
            status = ?,
            priority = ?,
            actionTaken = ?,
            nextStep = ?,
            requesterName = ?,
            requesterRole = ?,
            description = ?,
            latitude = ?,
            longitude = ?,
            coordSource = ?,
            coordVerified = ?,
            inspectionChecklistJson = ?,
            updatedAt = ?
          WHERE ticketId = ?
        `).run(
          candidateUpdated.barangay,
          candidateUpdated.district,
          candidateUpdated.legislativeDistrict,
          candidateUpdated.streetAddress,
          candidateUpdated.requestType,
          candidateUpdated.status,
          candidateUpdated.priority,
          candidateUpdated.actionTaken,
          candidateUpdated.nextStep,
          candidateUpdated.requesterName,
          candidateUpdated.requesterRole,
          candidateUpdated.description,
          candidateUpdated.latitude,
          candidateUpdated.longitude,
          candidateUpdated.coordSource,
          candidateUpdated.coordVerified,
          candidateUpdated.inspectionChecklistJson,
          nowIso,
          req.params.ticketId
        );

        db.prepare(`
          INSERT INTO ticket_history (
            ticketId, eventType, previousStatus, newStatus, actionTaken,
            changedFieldsJson, actorName, actorRole, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          req.params.ticketId,
          auditDiff.eventType,
          existing.status,
          nextStatus,
          updates.actionTaken || auditDiff.summary,
          JSON.stringify(auditDiff.changes),
          updates.actorName || 'Engr. Lorenzo T. Macapagal',
          updates.actorRole || 'DEPW Engineering Liaison',
          nowIso
        );

        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      const updated = db
        .prepare('SELECT * FROM tickets WHERE ticketId = ?')
        .get(req.params.ticketId);
      const history = db
        .prepare('SELECT * FROM ticket_history WHERE ticketId = ? ORDER BY id DESC')
        .all(req.params.ticketId)
        .map(formatAuditRow);

      res.json({
        ticket: formatTicketRow(updated),
        history,
      });
    } catch (err) {
      next(err);
    }
  });

  // Dedicated Status Transition Endpoint with Server-Side Audit Logging
  app.post('/api/tickets/:ticketId/status', (req, res, next) => {
    try {
      const existing = db
        .prepare('SELECT * FROM tickets WHERE ticketId = ?')
        .get(req.params.ticketId);
      if (!existing) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      const parsed = StatusTransitionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { newStatus, actionTaken, nextStep, actorName, actorRole } = parsed.data;
      if (!canTransitionStatus(existing.status, newStatus)) {
        return res.status(400).json({
          error: `Transition from "${existing.status}" to "${newStatus}" is not permitted by workflow rules.`,
        });
      }

      const auditDiff = computeTicketAuditDiff(existing, {
        ...existing,
        status: newStatus,
        actionTaken,
        nextStep,
      });

      const nowIso = new Date().toISOString();
      db.exec('BEGIN');
      try {
        db.prepare(`
          UPDATE tickets
          SET status = ?, actionTaken = ?, nextStep = ?, updatedAt = ?
          WHERE ticketId = ?
        `).run(newStatus, actionTaken, nextStep, nowIso, req.params.ticketId);

        db.prepare(`
          INSERT INTO ticket_history (
            ticketId, eventType, previousStatus, newStatus, actionTaken,
            changedFieldsJson, actorName, actorRole, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          req.params.ticketId,
          'STATUS_TRANSITION',
          existing.status,
          newStatus,
          actionTaken,
          JSON.stringify(auditDiff.changes),
          actorName || 'Engr. Lorenzo T. Macapagal',
          actorRole || 'DEPW Workflow Officer',
          nowIso
        );

        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      const updated = db
        .prepare('SELECT * FROM tickets WHERE ticketId = ?')
        .get(req.params.ticketId);
      const history = db
        .prepare('SELECT * FROM ticket_history WHERE ticketId = ? ORDER BY id DESC')
        .all(req.params.ticketId)
        .map(formatAuditRow);

      res.json({
        ticket: formatTicketRow(updated),
        history,
      });
    } catch (err) {
      next(err);
    }
  });

  // Delete Ticket (Requires confirmation in UI)
  app.delete('/api/tickets/:ticketId', (req, res, next) => {
    try {
      const existing = db
        .prepare('SELECT * FROM tickets WHERE ticketId = ?')
        .get(req.params.ticketId);
      if (!existing) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }
      db.prepare('DELETE FROM tickets WHERE ticketId = ?').run(req.params.ticketId);
      res.json({ deleted: true, ticketId: req.params.ticketId });
    } catch (err) {
      next(err);
    }
  });

  // Drainage Assets & Operational Schedules
  app.get('/api/operations', (_req, res, next) => {
    try {
      const assets = db.prepare('SELECT * FROM drainage_assets ORDER BY assetId ASC').all();
      const schedules = db.prepare('SELECT * FROM schedule_events ORDER BY scheduledDate ASC').all();
      res.json({ assets, schedules });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/operations/schedules', (req, res, next) => {
    try {
      const { ticketId, title, scheduledDate, scheduleType, confirmationStatus, assignedUnit, notes } = req.body;
      if (!ticketId || !title || !scheduledDate) {
        return res.status(400).json({ error: 'ticketId, title, and scheduledDate are required.' });
      }
      const eventId = `SCH-2026-${Math.floor(100 + Math.random() * 900)}`;
      db.prepare(`
        INSERT INTO schedule_events (
          eventId, ticketId, title, scheduledDate, scheduleType, confirmationStatus, assignedUnit, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        ticketId,
        title,
        scheduledDate,
        scheduleType || 'Site Inspection',
        confirmationStatus || 'Proposed (Awaiting Confirmation)',
        assignedUnit || 'DEPW Field Assessment Unit',
        notes || 'Scheduled field engineering coordination'
      );
      const schedules = db.prepare('SELECT * FROM schedule_events ORDER BY scheduledDate ASC').all();
      res.status(201).json({ eventId, schedules });
    } catch (err) {
      next(err);
    }
  });

  // Compliant OpenStreetMap Nominatim Geocoding Proxy
  app.get('/api/geocode', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ results: [] });
    }
    try {
      const searchQuery = q.toLowerCase().includes('manila') ? q : `${q}, Manila, Philippines`;
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', '6');
      url.searchParams.set('countrycodes', 'ph');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'DEPW-Assist-Manila-Training-Demo/1.0 (https://manila.gov.ph; training-demo)',
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        return res.status(response.status).json({
          error: `Geocoding service returned HTTP ${response.status}`,
          results: [],
        });
      }
      const data = await response.json();
      const results = Array.isArray(data)
        ? data.map((item) => ({
            placeId: item.place_id,
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type || item.category || 'location',
          }))
        : [];
      res.json({ results });
    } catch (err) {
      res.status(502).json({
        error: 'Unable to reach OpenStreetMap Nominatim geocoding service.',
        details: err instanceof Error ? err.message : String(err),
        results: [],
      });
    }
  });

  // Phase 3: AI Assistance — Draft Letter, Summarize, Missing-Info Check (with Rule-Based Fallback)
  app.post('/api/ai/assist', async (req, res) => {
    const { mode = 'draft_letter', ticket = {}, customPrompt = '', modelTier = 'flash' } = req.body;
    const baseLetter = generateSampleRequestLetter(ticket);
    const completeness = evaluateRequestCompleteness(ticket);
    const allTickets = db.prepare('SELECT * FROM tickets').all();
    const duplicates = findPotentialDuplicates(ticket, allTickets);

    const ai = getGeminiClient();
    const modelMap = {
      lite: 'gemini-3.1-flash-lite',
      flash: 'gemini-3.8-flash',
      pro: 'gemini-4-argon',
    };
    const selectedModel = modelMap[modelTier] || 'gemini-3.8-flash';

    if (!ai) {
      return res.json({
        source: 'rule_based_fallback',
        modelUsed: 'Rule-Based Engine (No API Key Configured)',
        draftBadge: 'DRAFT — RULE-BASED ASSISTANCE (REQUIRES HUMAN REVIEW)',
        completeness,
        duplicates,
        output:
          mode === 'summarize'
            ? `SUMMARY DRAFT (FICTIONAL DEMO): Ticket ${ticket.ticketId || 'NEW'} from ${ticket.barangay || 'Sample Barangay'} (${ticket.district || 'Manila'}) requests ${ticket.requestType || 'Declogging'} at ${ticket.streetAddress || 'Sample Street'}. Current status: ${ticket.status || 'For Verification'}. Completeness score: ${completeness.score}%. Recommended next step: ${getExplainableNextStep(ticket.status).suggestedNextStep}.`
            : `${baseLetter.bodyTagalog}\n\n[English Liaison Translation Draft]: We respectfully request assistance from the Department of Engineering Office to conduct ${ticket.requestType || 'declogging'} operations along the drainage line at ${ticket.streetAddress || 'Sample Street'}, ${ticket.barangay || 'Barangay 123 SAMPLE'}. Silt and debris accumulation has been observed affecting water flow. We request technical inspection and coordination for a possible schedule.`,
      });
    }

    try {
      const systemInstruction =
        'You are an administrative liaison assistant for the Department of Engineering and Public Works (Manila) training demonstration. Always use fictional sample data only. Clearly label all outputs as DRAFT requiring human verification. Never claim a request is officially approved or dispatched.';

      const userPrompt =
        mode === 'summarize'
          ? `Summarize this fictional barangay declogging ticket for an engineering supervisor, check for missing information, and explain the recommended next workflow step:\n${JSON.stringify(ticket, null, 2)}\n${customPrompt}`
          : mode === 'missing_check'
          ? `Perform a missing-information and data-quality audit on this fictional barangay drainage request, listing what the Barangay Liaison Officer should verify before engineering endorsement:\n${JSON.stringify(ticket, null, 2)}`
          : `Draft a formal, respectful Filipino (Tagalog) and English Barangay Declogging Request Letter and DEO Liaison Endorsement Memo for this fictional request:\n${JSON.stringify(ticket, null, 2)}\n${customPrompt}`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });

      res.json({
        source: 'gemini_api',
        modelUsed: selectedModel,
        draftBadge: `AI-GENERATED DRAFT (${selectedModel}) • HUMAN VERIFICATION REQUIRED`,
        completeness,
        duplicates,
        output: response.text || baseLetter.bodyTagalog,
      });
    } catch (err) {
      res.json({
        source: 'rule_based_fallback',
        modelUsed: `Rule-Based Fallback (${err instanceof Error ? err.message.slice(0, 80) : 'API unavailable'})`,
        draftBadge: 'DRAFT — RULE-BASED FALLBACK (REQUIRES HUMAN REVIEW)',
        completeness,
        duplicates,
        output: `${baseLetter.bodyTagalog}\n\n[Liaison Summary]: Request from ${baseLetter.from} (${baseLetter.through}) regarding ${baseLetter.subject}. Completeness: ${completeness.score}%.`,
      });
    }
  });

  // Google Maps Grounding with gemini-3.8-flash (with DEPW Offline Spatial Reconnaissance Fallback)
  app.post('/api/ai/maps-grounding', async (req, res) => {
    const { query = 'Drainage canals and esteros in Tondo and Sampaloc, Manila' } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const fallbackEntry = getManilaSpatialDrainageContext(query);
      return res.json({
        modelUsed: 'DEPW Manila Estero & Drainage GIS (Offline Local Reconnaissance)',
        text: fallbackEntry.summary,
        isOfflineKnowledge: true,
        groundingChunks: fallbackEntry.places.map((p) => ({
          web: { title: p.title, uri: p.uri },
        })),
        places: fallbackEntry.places,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Provide geographic context, nearby public landmarks, and drainage/waterway context in Manila for: ${query}. Keep all service request references strictly fictional.`,
        config: {
          tools: [{ googleMaps: {} }],
        },
      });
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return res.json({
        modelUsed: 'gemini-3.8-flash (with googleMaps tool)',
        text: response.text || 'No geographic summary returned.',
        groundingChunks,
        isOfflineKnowledge: false,
      });
    } catch (err) {
      // Graceful offline fallback on quota exhaustion (429 RESOURCE_EXHAUSTED) or network error
      const isQuota =
        err instanceof Error &&
        (err.message.includes('429') ||
          err.message.includes('quota') ||
          err.message.includes('RESOURCE_EXHAUSTED') ||
          err.message.includes('rate-limit'));

      const fallbackEntry = getManilaSpatialDrainageContext(query);
      return res.json({
        modelUsed: isQuota
          ? 'DEPW Manila Estero & Drainage GIS (Offline Knowledge — Quota Protected)'
          : 'DEPW Manila Geographic Reconnaissance (Offline Mode)',
        text: fallbackEntry.summary,
        isOfflineKnowledge: true,
        quotaFallbackNotice: isQuota
          ? 'Google Maps API daily quota reached; displaying verified City of Manila DEPW drainage survey intelligence.'
          : null,
        groundingChunks: fallbackEntry.places.map((p) => ({
          web: { title: p.title, uri: p.uri },
        })),
        places: fallbackEntry.places,
      });
    }
  });

  // Text-to-Speech (TTS) using gemini-3.8-flash-tts
  app.post('/api/ai/tts', async (req, res) => {
    const { text = '', voice = 'Kore', style = 'Clear, respectful Filipino-English public service presenter' } = req.body;
    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured for gemini-3.8-flash-tts.' });
    }
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: String(text).slice(0, 1200),
                speechMetadata: {
                  style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: 'No audio returned from gemini-3.8-flash-tts.' });
      }
      res.json({
        modelUsed: 'gemini-3.8-flash-tts',
        mimeType: 'audio/wav',
        audioBase64: base64Audio,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'TTS generation failed.',
      });
    }
  });

  // High-Quality Image Generation using gemini-3-pro-image (1K, 2K, 4K)
  app.post('/api/ai/generate-image', async (req, res) => {
    const {
      prompt = 'Clean engineering diagram of an urban reinforced concrete box culvert storm drain cross-section during maintenance inspection',
      imageSize = '1K',
      aspectRatio = '16:9',
    } = req.body;
    const validSizes = ['1K', '2K', '4K'];
    const selectedSize = validSizes.includes(imageSize) ? imageSize : '1K';
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is required for image generation.' });
    }
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '16:9',
            imageSize: selectedSize,
          },
        },
      });

      let imageUrl = null;
      let caption = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          caption += part.text;
        }
      }

      if (!imageUrl) {
        return res.status(500).json({ error: 'Model did not return an image part.' });
      }
      res.json({
        modelUsed: 'gemini-3-pro-image',
        imageSize: selectedSize,
        aspectRatio,
        imageUrl,
        caption,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Image generation failed.',
      });
    }
  });

  // Video Generation from Text using gemini-omni-1.1-flash via Interactions API
  app.post('/api/ai/generate-video', async (req, res) => {
    const {
      prompt = 'Educational 3D engineering visualization of clean stormwater flowing smoothly through a newly declogged urban drainage canal',
      aspectRatio = '16:9',
    } = req.body;
    const validRatios = ['16:9', '9:16'];
    const selectedRatio = validRatios.includes(aspectRatio) ? aspectRatio : '16:9';
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is required for video generation.' });
    }
    try {
      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.1-flash',
          input: prompt,
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: selectedRatio,
            duration: '5s',
            resolution: '720p',
          },
        },
        { timeout: 300000 }
      );

      const videoPart = interaction.output_video;
      if (videoPart && videoPart.data) {
        const mime = videoPart.mime_type || 'video/mp4';
        return res.json({
          modelUsed: 'gemini-omni-1.1-flash',
          aspectRatio: selectedRatio,
          videoUrl: `data:${mime};base64,${videoPart.data}`,
        });
      }
      if (videoPart && videoPart.uri) {
        return res.json({
          modelUsed: 'gemini-omni-1.1-flash',
          aspectRatio: selectedRatio,
          videoUrl: videoPart.uri,
        });
      }
      return res.status(500).json({ error: 'No video output returned from gemini-omni-1.1-flash.' });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Video generation failed.',
      });
    }
  });

  // Centralized Error Handler (Never exposes stack traces)
  app.use((err, _req, res, _next) => {
    console.error('[Server Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({
      error: 'An unexpected server error occurred while processing your request.',
      requestId: `REQ-${Date.now()}`,
    });
  });

  return app;
}

async function startServer() {
  const app = await createApp();
  const server = http.createServer(app);

  // WebSocket Server for Gemini Live API (gemini-3.8-live) on /live
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', 'http://localhost:3000').pathname;
    if (pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs) => {
    const ai = getGeminiClient();
    if (!ai) {
      clientWs.send(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured on the server for Live API.',
        })
      );
      clientWs.close();
      return;
    }

    let session = null;
    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction:
            'You are the DEPW Assist Voice Liaison Guide for the Department of Engineering Office (Manila) training demonstration. Help users understand the 8-stage Barangay declogging request workflow, the Triple-A framework (Automate, Assist, Accountability), and how to use the Smart Tracker. Always remind users that this uses fictional demonstration data.',
        },
        callbacks: {
          onmessage: (message) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ audio }));
            }
            const outText = message.serverContent?.outputTranscription?.text;
            if (outText && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ transcript: outText, role: 'model' }));
            }
            const inText = message.serverContent?.inputTranscription?.text;
            if (inText && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ transcript: inText, role: 'user' }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (err) => {
            if (clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ error: String(err?.message || 'Live session error') }));
            }
          },
        },
      });

      clientWs.send(JSON.stringify({ status: 'connected', model: 'gemini-3.8-live' }));

      clientWs.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.audio && session) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (msg.text && session) {
            session.sendRealtimeInput({
              text: msg.text,
            });
          }
        } catch {
          // ignore malformed frame
        }
      });

      clientWs.on('close', () => {
        try {
          session?.close();
        } catch {
          // ignore close errors
        }
      });
    } catch (err) {
      if (clientWs.readyState === 1) {
        clientWs.send(
          JSON.stringify({
            error: err instanceof Error ? err.message : 'Failed to connect to gemini-3.8-live',
          })
        );
      }
      clientWs.close();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DEPW Assist Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  startServer();
}
