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
      coordSource TEXT NOT NULL DEFAULT 'Verified GIS Pin',
      coordVerified INTEGER NOT NULL DEFAULT 0,
      inspectionChecklistJson TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId TEXT NOT NULL,
      eventType TEXT NOT NULL DEFAULT 'STATUS_TRANSITION',
      previousStatus TEXT NOT NULL,
      newStatus TEXT NOT NULL,
      actionTaken TEXT NOT NULL,
      changedFieldsJson TEXT NOT NULL DEFAULT '[]',
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

  // Safe schema evolution for ticket_history audit columns
  const cols = db.prepare(`PRAGMA table_info(ticket_history)`).all();
  const colNames = cols.map((c) => c.name);
  if (!colNames.includes('eventType')) {
    db.exec(`ALTER TABLE ticket_history ADD COLUMN eventType TEXT NOT NULL DEFAULT 'STATUS_TRANSITION'`);
  }
  if (!colNames.includes('changedFieldsJson')) {
    db.exec(`ALTER TABLE ticket_history ADD COLUMN changedFieldsJson TEXT NOT NULL DEFAULT '[]'`);
  }

  // If database is empty OR contains legacy SAMPLE/DUMMY strings, refresh with clean production-grade records
  const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  const legacyDummyRow = db
    .prepare(`SELECT COUNT(*) as count FROM tickets WHERE barangay LIKE '%SAMPLE%' OR streetAddress LIKE '%DUMMY%' OR requesterRole LIKE '%DUMMY%'`)
    .get();

  if (!countRow || countRow.count === 0 || (legacyDummyRow && legacyDummyRow.count > 0)) {
    db.exec(`
      DELETE FROM ticket_history;
      DELETE FROM schedule_events;
      DELETE FROM drainage_assets;
      DELETE FROM tickets;
    `);
    seedInitialData();
  }
}

function seedInitialData() {
  const initialTickets = [
    {
      ticketId: 'DEO-2026-001',
      dateReceived: '10/20/2026',
      barangay: 'Barangay 123, Zone 10',
      district: 'Tondo',
      legislativeDistrict: '1st District',
      streetAddress: 'Estero de Vitas Service Road cor. Velasquez St.',
      requestType: 'Declogging',
      status: 'Pending Evaluation',
      priority: 'Elevated',
      actionTaken: 'Endorsed to DEPW District 1 Evaluation Team',
      nextStep: 'Conduct technical review and drainage profile check',
      requesterName: 'Juan D. Cruz',
      requesterRole: 'Barangay Kagawad',
      description:
        'Magalang po kaming humihiling ng tulong mula sa Department of Engineering Office para sa pagsasagawa ng declogging sa isang bahagi ng drainage sa aming barangay. Napansin po ang pag-ipon ng putik at iba pang debris na maaaring makaapekto sa maayos na daloy ng tubig.',
      latitude: 14.6195,
      longitude: 120.9678,
      coordSource: 'Verified DEPW GIS Benchmark Pin',
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
      barangay: 'Barangay 456, Zone 45',
      district: 'Sampaloc',
      legislativeDistrict: '4th District',
      streetAddress: 'España Boulevard cor. Maceda St. Lateral Gutter',
      requestType: 'Declogging',
      status: 'For Verification',
      priority: 'Routine',
      actionTaken: 'Documents received at Receiving Liaison Desk',
      nextStep: 'Verify completeness of location sketch and contact details',
      requesterName: 'Maria L. Santos',
      requesterRole: 'Barangay Secretary',
      description:
        'Requesting assistance to clear accumulated leaf litter and silt sediment along the secondary lateral curb inlet and gutter.',
      latitude: 14.6110,
      longitude: 120.9955,
      coordSource: 'Barangay Submitted Pin',
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
      barangay: 'Barangay 668, Zone 72',
      district: 'Ermita',
      legislativeDistrict: '5th District',
      streetAddress: 'Padre Faura St. cor. Taft Ave. Storm Drain',
      requestType: 'Declogging',
      status: 'Inspection Scheduled',
      priority: 'High Priority',
      actionTaken: 'Joint ocular inspection scheduled with Barangay Kagawad',
      nextStep: 'Complete field assessment of box culvert inlets',
      requesterName: 'Roberto M. Reyes',
      requesterRole: 'Barangay Kagawad',
      description:
        'Slow stormwater runoff observed after heavy rain; requesting technical inspection and vacuum declogging of reinforced concrete box culvert inlets.',
      latitude: 14.5826,
      longitude: 120.9822,
      coordSource: 'Verified DEPW GIS Benchmark Pin',
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
      barangay: 'Barangay 310, Zone 31',
      district: 'Quiapo',
      legislativeDistrict: '3rd District',
      streetAddress: 'Hidalgo St. Covered Drainage Channel',
      requestType: 'Desilting',
      status: 'Completed',
      priority: 'Elevated',
      actionTaken: 'Desilting and debris haulage completed by Crew 2',
      nextStep: 'Archive Barangay completion acknowledgment and close ticket',
      requesterName: 'Elena P. Mendoza',
      requesterRole: 'Punong Barangay',
      description:
        'Desilting of covered masonry drainage channel and clearing of 3 primary street catch basins.',
      latitude: 14.5994,
      longitude: 120.9848,
      coordSource: 'Verified DEPW GIS Benchmark Pin',
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
      barangay: 'Barangay 602, Zone 60',
      district: 'Santa Mesa',
      legislativeDistrict: '6th District',
      streetAddress: 'Old Sta. Mesa St. cor. Teresa St. Drainage Line',
      requestType: 'Manhole Repair',
      status: 'In Progress',
      priority: 'Routine',
      actionTaken: 'Field crew clearing silted manhole chamber and collar',
      nextStep: 'Complete cast-iron frame resetting and hydraulic flow check',
      requesterName: 'Carlos V. Bautista',
      requesterRole: 'Barangay Kagawad',
      description:
        'Silted manhole chamber and displaced concrete collar along high-foot-traffic commuter corridor.',
      latitude: 14.6018,
      longitude: 121.0124,
      coordSource: 'Verified DEPW GIS Benchmark Pin',
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
      barangay: 'Barangay 204, Zone 19',
      district: 'Tondo',
      legislativeDistrict: '2nd District',
      streetAddress: 'Gagalangin Pampanga St. Interior Drainage Alley',
      requestType: 'Gutter Clearance',
      status: 'Returned for Clarification',
      priority: 'Routine',
      actionTaken: 'Returned to Barangay for exact street corner sketch',
      nextStep: 'Await updated location sketch from Barangay Secretary',
      requesterName: 'Noel G. Villanueva',
      requesterRole: 'Barangay Kagawad',
      description:
        'Request for lateral gutter declogging; requires clarification on exact interior alley intersection and manhole access.',
      latitude: 14.6260,
      longitude: 120.9730,
      coordSource: 'Approximate District Pin',
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
      ticketId, eventType, previousStatus, newStatus, actionTaken,
      changedFieldsJson, actorName, actorRole, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      'TICKET_CREATED',
      'Intake',
      'For Verification',
      `Initial Barangay request logged in DEPW Smart Tracker (${t.barangay})`,
      JSON.stringify([
        { field: 'status', label: 'Workflow Status', before: 'Intake', after: 'For Verification' },
        { field: 'streetAddress', label: 'Street / Canal Location', before: 'None', after: t.streetAddress },
      ]),
      'Engr. Camille R. Aquino',
      'DEPW Receiving Liaison Officer',
      t.createdAt
    );

    if (t.coordVerified) {
      insertHistory.run(
        t.ticketId,
        'COORD_UPDATE',
        'For Verification',
        'For Verification',
        `Verified Manila GIS coordinates (${t.latitude}, ${t.longitude})`,
        JSON.stringify([
          { field: 'coordVerified', label: 'Coordinate Verification', before: 'Unverified', after: 'Verified GIS Pin' },
        ]),
        'Engr. Marco P. Del Rosario',
        'DEPW GIS Mapping Specialist',
        t.createdAt
      );
    }

    if (t.status !== 'For Verification') {
      insertHistory.run(
        t.ticketId,
        'STATUS_TRANSITION',
        'For Verification',
        t.status,
        t.actionTaken,
        JSON.stringify([
          { field: 'status', label: 'Workflow Status', before: 'For Verification', after: t.status },
          { field: 'actionTaken', label: 'Action Taken', before: 'Documents received at Receiving Liaison Desk', after: t.actionTaken },
          { field: 'nextStep', label: 'Next Step', before: 'Verify completeness', after: t.nextStep },
        ]),
        'Engr. Lorenzo T. Macapagal',
        'DEPW Area Evaluation Engineer',
        t.updatedAt
      );
    }
  }

  const assets = [
    {
      assetId: 'DRN-MNL-101',
      name: 'Estero de Vitas Lateral Box Culvert',
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
      name: 'España-Sampaloc Interceptor Line B',
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
      name: 'Padre Faura Storm Drain Outfall',
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
      name: 'Binondo-San Nicolas Tidal Gate Channel',
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
      title: 'Joint Site Inspection — Barangay 668, Zone 72',
      scheduledDate: '2026-10-25',
      scheduleType: 'Site Inspection',
      confirmationStatus: 'Proposed (Awaiting Confirmation)',
      assignedUnit: 'DEPW Field Assessment Team B',
      notes: 'Verify catch basin silt level with Brgy Kagawad Roberto M. Reyes at Padre Faura St.',
    },
    {
      eventId: 'SCH-2026-02',
      ticketId: 'DEO-2026-005',
      title: 'Manhole Desilting & Collar Reset — Barangay 602, Zone 60',
      scheduledDate: '2026-10-24',
      scheduleType: 'Field Implementation',
      confirmationStatus: 'Confirmed Operations Schedule',
      assignedUnit: 'Drainage Maintenance Crew 3',
      notes: 'Vacuum declogger unit & safety traffic cones deployed along Old Sta. Mesa St.',
    },
    {
      eventId: 'SCH-2026-03',
      ticketId: 'DEO-2026-001',
      title: 'Engineering Review & Ocular Coordination — Barangay 123, Zone 10',
      scheduledDate: '2026-10-26',
      scheduleType: 'Engineering Evaluation',
      confirmationStatus: 'Proposed (Awaiting Confirmation)',
      assignedUnit: 'DEPW District 1 Evaluation Engineers',
      notes: 'Coordinate with Kagawad Juan D. Cruz at Estero de Vitas Service Road.',
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
