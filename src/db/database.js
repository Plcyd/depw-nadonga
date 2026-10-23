import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(DATA_DIR, 'depw_assist.sqlite');
export const db = new DatabaseSync(DB_PATH);

export function runMigrationsAndSeed() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tickets (
      ticketId TEXT PRIMARY KEY,
      dateReceived TEXT NOT NULL,
      barangay TEXT NOT NULL,
      district TEXT NOT NULL,
      legislativeDistrict TEXT NOT NULL,
      streetAddress TEXT NOT NULL,
      requestType TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Routine',
      actionTaken TEXT NOT NULL,
      nextStep TEXT NOT NULL,
      requesterName TEXT NOT NULL,
      requesterRole TEXT NOT NULL,
      description TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      coordSource TEXT NOT NULL DEFAULT 'Sample Demonstration Pin',
      coordVerified INTEGER NOT NULL DEFAULT 0,
      inspectionChecklistJson TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId TEXT NOT NULL,
      previousStatus TEXT NOT NULL,
      newStatus TEXT NOT NULL,
      actionTaken TEXT NOT NULL,
      actorName TEXT NOT NULL,
      actorRole TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (ticketId) REFERENCES tickets(ticketId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS drainage_assets (
      assetId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      legislativeDistrict TEXT NOT NULL,
      assetType TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      conditionStatus TEXT NOT NULL,
      lastInspected TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_events (
      eventId TEXT PRIMARY KEY,
      ticketId TEXT NOT NULL,
      title TEXT NOT NULL,
      scheduledDate TEXT NOT NULL,
      scheduleType TEXT NOT NULL,
      confirmationStatus TEXT NOT NULL,
      assignedUnit TEXT NOT NULL,
      notes TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_district ON tickets(district);
    CREATE INDEX IF NOT EXISTS idx_history_ticket ON ticket_history(ticketId);
  `);

  const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  if (countRow && countRow.count === 0) {
    seedInitialDemoData();
  }
}

function seedInitialDemoData() {
  const initialTickets = [
    {
      ticketId: 'DEO-2026-001',
      dateReceived: '10/20/2026',
      barangay: 'Brgy 123 SAMPLE',
      district: 'Tondo',
      legislativeDistrict: '1st District',
      streetAddress: 'Sample Street near Estero de Vitas (DUMMY LOCATION)',
      requestType: 'Declogging',
      status: 'Pending Evaluation',
      priority: 'Elevated',
      actionTaken: 'Endorsed to DEO',
      nextStep: 'Awaiting review',
      requesterName: 'Juan D. Cruz',
      requesterRole: 'Barangay Kagawad — DUMMY NAME',
      description:
        'Fictional demonstration request: Magalang po kaming humihiling ng tulong mula sa Department of Engineering Office para sa pagsasagawa ng declogging sa isang bahagi ng drainage sa aming barangay. Napansin po ang pag-ipon ng putik at iba pang debris na maaaring makaapekto sa maayos na daloy ng tubig.',
      latitude: 14.6195,
      longitude: 120.9678,
      coordSource: 'Verified Demo Benchmark Pin',
      coordVerified: 1,
      inspectionChecklistJson: JSON.stringify([
        { item: 'Request letter signed by Barangay official', done: true },
        { item: 'Street segment and nearest landmark identified', done: true },
        { item: 'Joint ocular site inspection completed', done: false },
        { item: 'Silt depth and manhole access measured', done: false },
      ]),
      createdAt: '2026-10-20T08:30:00.000Z',
      updatedAt: '2026-10-20T14:15:00.000Z',
    },
    {
      ticketId: 'DEO-2026-002',
      dateReceived: '10/21/2026',
      barangay: 'Brgy 456 SAMPLE',
      district: 'Sampaloc',
      legislativeDistrict: '4th District',
      streetAddress: 'Sample Street España Side Gutter (DUMMY LOCATION)',
      requestType: 'Declogging',
      status: 'For Verification',
      priority: 'Routine',
      actionTaken: 'Documents received',
      nextStep: 'Check completeness',
      requesterName: 'Maria L. Santos',
      requesterRole: 'Barangay Secretary — DUMMY NAME',
      description:
        'Fictional training entry: Requesting assistance to clear accumulated leaf litter and sediment along the secondary lateral gutter.',
      latitude: 14.6110,
      longitude: 120.9955,
      coordSource: 'User-Selected Demo Pin',
      coordVerified: 0,
      inspectionChecklistJson: JSON.stringify([
        { item: 'Request letter signed by Barangay official', done: true },
        { item: 'Street segment and nearest landmark identified', done: false },
        { item: 'Joint ocular site inspection completed', done: false },
      ]),
      createdAt: '2026-10-21T09:10:00.000Z',
      updatedAt: '2026-10-21T09:10:00.000Z',
    },
    {
      ticketId: 'DEO-2026-003',
      dateReceived: '10/22/2026',
      barangay: 'Brgy 789 SAMPLE',
      district: 'Ermita',
      legislativeDistrict: '5th District',
      streetAddress: 'Sample Padre Faura Storm Drain (DUMMY LOCATION)',
      requestType: 'Declogging',
      status: 'Inspection Scheduled',
      priority: 'High Priority',
      actionTaken: 'Inspection coordination initiated',
      nextStep: 'Await site assessment',
      requesterName: 'Roberto M. Reyes',
      requesterRole: 'Barangay Kagawad — DUMMY NAME',
      description:
        'Fictional training entry: Slow stormwater runoff observed after heavy rain; requesting technical inspection of concrete box culvert inlets.',
      latitude: 14.5826,
      longitude: 120.9822,
      coordSource: 'Verified Demo Benchmark Pin',
      coordVerified: 1,
      inspectionChecklistJson: JSON.stringify([
        { item: 'Request letter signed by Barangay official', done: true },
        { item: 'Street segment and nearest landmark identified', done: true },
        { item: 'Joint ocular site inspection completed', done: false },
      ]),
      createdAt: '2026-10-22T10:00:00.000Z',
      updatedAt: '2026-10-22T15:45:00.000Z',
    },
    {
      ticketId: 'DEO-2026-004',
      dateReceived: '10/18/2026',
      barangay: 'Brgy 310 SAMPLE',
      district: 'Quiapo',
      legislativeDistrict: '3rd District',
      streetAddress: 'Sample Hidalgo Canal Segment (DUMMY LOCATION)',
      requestType: 'Desilting',
      status: 'Completed',
      priority: 'Elevated',
      actionTaken: 'Desilting and debris haulage completed',
      nextStep: 'Archive acknowledgment and close ticket',
      requesterName: 'Elena P. Mendoza',
      requesterRole: 'Barangay Chairperson — DUMMY NAME',
      description:
        'Fictional training entry: Desilting of covered drainage channel and clearing of 3 catch basins.',
      latitude: 14.5994,
      longitude: 120.9848,
      coordSource: 'Verified Demo Benchmark Pin',
      coordVerified: 1,
      inspectionChecklistJson: JSON.stringify([
        { item: 'Request letter signed by Barangay official', done: true },
        { item: 'Street segment and nearest landmark identified', done: true },
        { item: 'Joint ocular site inspection completed', done: true },
        { item: 'Post-operation haulage & flow verified', done: true },
      ]),
      createdAt: '2026-10-18T08:00:00.000Z',
      updatedAt: '2026-10-22T17:00:00.000Z',
    },
    {
      ticketId: 'DEO-2026-005',
      dateReceived: '10/19/2026',
      barangay: 'Brgy 602 SAMPLE',
      district: 'Santa Mesa',
      legislativeDistrict: '6th District',
      streetAddress: 'Sample Old Sta. Mesa Drainage Line (DUMMY LOCATION)',
      requestType: 'Manhole Repair',
      status: 'In Progress',
      priority: 'Routine',
      actionTaken: 'Authorized crew clearing silted manhole collar',
      nextStep: 'Complete frame resetting and flow check',
      requesterName: 'Carlos V. Bautista',
      requesterRole: 'Barangay Kagawad — DUMMY NAME',
      description:
        'Fictional training entry: Silted manhole chamber and damaged concrete cover along secondary street.',
      latitude: 14.6018,
      longitude: 121.0124,
      coordSource: 'Verified Demo Benchmark Pin',
      coordVerified: 1,
      inspectionChecklistJson: JSON.stringify([
        { item: 'Request letter signed by Barangay official', done: true },
        { item: 'Street segment and nearest landmark identified', done: true },
        { item: 'Joint ocular site inspection completed', done: true },
      ]),
      createdAt: '2026-10-19T11:20:00.000Z',
      updatedAt: '2026-10-22T13:10:00.000Z',
    },
    {
      ticketId: 'DEO-2026-006',
      dateReceived: '10/22/2026',
      barangay: 'Brgy 204 SAMPLE',
      district: 'Tondo',
      legislativeDistrict: '2nd District',
      streetAddress: 'Sample Gagalangin Interior Alley (DUMMY LOCATION)',
      requestType: 'Gutter Clearance',
      status: 'Returned for Clarification',
      priority: 'Routine',
      actionTaken: 'Returned to Barangay for exact street corner sketch',
      nextStep: 'Await updated location sketch from Barangay',
      requesterName: 'Noel G. Villanueva',
      requesterRole: 'Barangay Kagawad — DUMMY NAME',
      description:
        'Fictional training entry: Request for gutter declogging; requires clarification on exact alley intersection.',
      latitude: 14.6260,
      longitude: 120.9730,
      coordSource: 'Unverified Approximate Pin',
      coordVerified: 0,
      inspectionChecklistJson: JSON.stringify([
        { item: 'Request letter signed by Barangay official', done: true },
        { item: 'Street segment and nearest landmark identified', done: false },
      ]),
      createdAt: '2026-10-22T14:00:00.000Z',
      updatedAt: '2026-10-22T16:30:00.000Z',
    },
  ];

  const insertTicket = db.prepare(`
    INSERT INTO tickets (
      ticketId, dateReceived, barangay, district, legislativeDistrict,
      streetAddress, requestType, status, priority, actionTaken, nextStep,
      requesterName, requesterRole, description, latitude, longitude,
      coordSource, coordVerified, inspectionChecklistJson, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertHistory = db.prepare(`
    INSERT INTO ticket_history (
      ticketId, previousStatus, newStatus, actionTaken, actorName, actorRole, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of initialTickets) {
    insertTicket.run(
      t.ticketId,
      t.dateReceived,
      t.barangay,
      t.district,
      t.legislativeDistrict,
      t.streetAddress,
      t.requestType,
      t.status,
      t.priority,
      t.actionTaken,
      t.nextStep,
      t.requesterName,
      t.requesterRole,
      t.description,
      t.latitude,
      t.longitude,
      t.coordSource,
      t.coordVerified,
      t.inspectionChecklistJson,
      t.createdAt,
      t.updatedAt
    );

    insertHistory.run(
      t.ticketId,
      'Intake',
      'For Verification',
      'Initial request logged in Smart Tracker (SAMPLE DATA)',
      'Receiving Liaison Officer (Demo)',
      'Intake Desk',
      t.createdAt
    );

    if (t.status !== 'For Verification') {
      insertHistory.run(
        t.ticketId,
        'For Verification',
        t.status,
        t.actionTaken,
        'Engineering Liaison Coordinator (Demo)',
        'DEO Evaluation Unit',
        t.updatedAt
      );
    }
  }

  const assets = [
    {
      assetId: 'DRN-MNL-101',
      name: 'Estero de Vitas Lateral Box Culvert (Demo Asset)',
      district: 'Tondo',
      legislativeDistrict: '1st District',
      assetType: 'Reinforced Concrete Box Culvert (RCBC)',
      dimensions: '1.8m x 1.5m • 420m span',
      conditionStatus: 'Needs Periodic Desilting',
      lastInspected: '2026-10-15',
      latitude: 14.6195,
      longitude: 120.9678,
    },
    {
      assetId: 'DRN-MNL-204',
      name: 'España-Sampaloc Interceptor Line B (Demo Asset)',
      district: 'Sampaloc',
      legislativeDistrict: '4th District',
      assetType: 'High-Density Concrete Pipe (HDCP)',
      dimensions: '1.2m dia • 680m span',
      conditionStatus: 'Under Monitoring',
      lastInspected: '2026-10-18',
      latitude: 14.6110,
      longitude: 120.9955,
    },
    {
      assetId: 'DRN-MNL-309',
      name: 'Padre Faura Storm Drain Outfall (Demo Asset)',
      district: 'Ermita',
      legislativeDistrict: '5th District',
      assetType: 'Curb Inlet & Catch Basin Network',
      dimensions: '0.9m dia • 18 catch basins',
      conditionStatus: 'Inspection Scheduled',
      lastInspected: '2026-10-20',
      latitude: 14.5826,
      longitude: 120.9822,
    },
    {
      assetId: 'DRN-MNL-412',
      name: 'Binondo-San Nicolas Tidal Gate Channel (Demo Asset)',
      district: 'Binondo',
      legislativeDistrict: '3rd District',
      assetType: 'Masonry Canal & Silt Trap',
      dimensions: '2.2m x 1.8m • 310m span',
      conditionStatus: 'Operational / Clear',
      lastInspected: '2026-10-19',
      latitude: 14.6010,
      longitude: 120.9745,
    },
  ];

  const insertAsset = db.prepare(`
    INSERT INTO drainage_assets (
      assetId, name, district, legislativeDistrict, assetType,
      dimensions, conditionStatus, lastInspected, latitude, longitude
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of assets) {
    insertAsset.run(
      a.assetId,
      a.name,
      a.district,
      a.legislativeDistrict,
      a.assetType,
      a.dimensions,
      a.conditionStatus,
      a.lastInspected,
      a.latitude,
      a.longitude
    );
  }

  const schedules = [
    {
      eventId: 'SCH-2026-01',
      ticketId: 'DEO-2026-003',
      title: 'Joint Site Inspection — Brgy 789 SAMPLE',
      scheduledDate: '2026-10-25',
      scheduleType: 'Site Inspection',
      confirmationStatus: 'Proposed (Awaiting Confirmation)',
      assignedUnit: 'DEO Field Assessment Team B',
      notes: 'Verify catch basin silt level with Brgy Kagawad Roberto M. Reyes (DUMMY)',
    },
    {
      eventId: 'SCH-2026-02',
      ticketId: 'DEO-2026-005',
      title: 'Manhole Desilting & Collar Reset — Brgy 602 SAMPLE',
      scheduledDate: '2026-10-24',
      scheduleType: 'Field Implementation',
      confirmationStatus: 'Confirmed Demo Schedule',
      assignedUnit: 'Drainage Maintenance Crew 3',
      notes: 'Vacuum declogger unit & safety cones deployed (TRAINING DEMO)',
    },
    {
      eventId: 'SCH-2026-03',
      ticketId: 'DEO-2026-001',
      title: 'Engineering Review & Ocular Coordination — Brgy 123 SAMPLE',
      scheduledDate: '2026-10-26',
      scheduleType: 'Engineering Evaluation',
      confirmationStatus: 'Proposed (Awaiting Confirmation)',
      assignedUnit: 'DEO District 1 Evaluation Engineers',
      notes: 'Coordinate with Kagawad Juan D. Cruz at Sample Street',
    },
  ];

  const insertSchedule = db.prepare(`
    INSERT INTO schedule_events (
      eventId, ticketId, title, scheduledDate, scheduleType,
      confirmationStatus, assignedUnit, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of schedules) {
    insertSchedule.run(
      s.eventId,
      s.ticketId,
      s.title,
      s.scheduledDate,
      s.scheduleType,
      s.confirmationStatus,
      s.assignedUnit,
      s.notes
    );
  }
}
