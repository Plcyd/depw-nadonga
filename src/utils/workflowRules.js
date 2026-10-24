/**
 * Shared Pure Domain Logic for DEPW Assist — Manila Barangay Declogging & Smart Tracker
 * Used by both Express backend (server.js) and React frontend components.
 */

export const TICKET_STATUSES = [
  'For Verification',
  'Returned for Clarification',
  'Pending Evaluation',
  'Inspection Scheduled',
  'Scheduled for Implementation',
  'In Progress',
  'Completed',
  'Closed',
];

export const REQUEST_TYPES = [
  'Declogging',
  'Desilting',
  'Manhole Repair',
  'Gutter Clearance',
  'Drainage Inspection',
];

export const PRIORITY_LEVELS = ['Routine', 'Elevated', 'High Priority'];

export const LEGISLATIVE_DISTRICTS = [
  {
    id: '1st District',
    name: '1st District',
    coverage: 'Covers the western portion of Tondo and the northern Port Area.',
    districts: ['Tondo', 'Port Area'],
  },
  {
    id: '2nd District',
    name: '2nd District',
    coverage: 'Covers the eastern inland portion of Tondo, including the Gagalangin neighborhood.',
    districts: ['Tondo'],
  },
  {
    id: '3rd District',
    name: '3rd District',
    coverage: 'Comprises Binondo, Quiapo, San Nicolas, and Santa Cruz.',
    districts: ['Binondo', 'Quiapo', 'San Nicolas', 'Santa Cruz'],
  },
  {
    id: '4th District',
    name: '4th District',
    coverage: 'Covers Sampaloc and parts of Santa Mesa.',
    districts: ['Sampaloc', 'Santa Mesa'],
  },
  {
    id: '5th District',
    name: '5th District',
    coverage: 'Includes Ermita, Malate, Intramuros, San Andres Bukid, Port Area, and parts of Paco.',
    districts: ['Ermita', 'Malate', 'Intramuros', 'San Andres Bukid', 'Port Area', 'Paco'],
  },
  {
    id: '6th District',
    name: '6th District',
    coverage: 'Covers Pandacan, San Miguel, Santa Ana, Santa Mesa, and the remainder of Paco.',
    districts: ['Pandacan', 'San Miguel', 'Santa Ana', 'Santa Mesa', 'Paco'],
  },
];

export const MANILA_16_DISTRICTS = [
  { name: 'Binondo', legislativeDistrict: '3rd District', lat: 14.6010, lng: 120.9745 },
  { name: 'Ermita', legislativeDistrict: '5th District', lat: 14.5826, lng: 120.9822 },
  { name: 'Intramuros', legislativeDistrict: '5th District', lat: 14.5896, lng: 120.9747 },
  { name: 'Malate', legislativeDistrict: '5th District', lat: 14.5685, lng: 120.9912 },
  { name: 'Paco', legislativeDistrict: '5th District', lat: 14.5805, lng: 120.9964 },
  { name: 'Pandacan', legislativeDistrict: '6th District', lat: 14.5882, lng: 121.0058 },
  { name: 'Port Area', legislativeDistrict: '1st District', lat: 14.5889, lng: 120.9642 },
  { name: 'Quiapo', legislativeDistrict: '3rd District', lat: 14.5994, lng: 120.9848 },
  { name: 'Sampaloc', legislativeDistrict: '4th District', lat: 14.6110, lng: 120.9955 },
  { name: 'San Andres Bukid', legislativeDistrict: '5th District', lat: 14.5718, lng: 121.0044 },
  { name: 'San Miguel', legislativeDistrict: '6th District', lat: 14.5955, lng: 120.9942 },
  { name: 'San Nicolas', legislativeDistrict: '3rd District', lat: 14.6012, lng: 120.9675 },
  { name: 'Santa Ana', legislativeDistrict: '6th District', lat: 14.5801, lng: 121.0135 },
  { name: 'Santa Cruz', legislativeDistrict: '3rd District', lat: 14.6152, lng: 120.9825 },
  { name: 'Santa Mesa', legislativeDistrict: '4th District', lat: 14.6018, lng: 121.0124 },
  { name: 'Tondo', legislativeDistrict: '1st District', lat: 14.6195, lng: 120.9678 },
];

export const ALLOWED_STATUS_TRANSITIONS = {
  'For Verification': ['Pending Evaluation', 'Returned for Clarification'],
  'Returned for Clarification': ['For Verification', 'Pending Evaluation', 'Closed'],
  'Pending Evaluation': ['Inspection Scheduled', 'Returned for Clarification', 'Scheduled for Implementation'],
  'Inspection Scheduled': ['Scheduled for Implementation', 'Pending Evaluation', 'Returned for Clarification'],
  'Scheduled for Implementation': ['In Progress', 'Inspection Scheduled'],
  'In Progress': ['Completed', 'Scheduled for Implementation'],
  'Completed': ['Closed', 'In Progress'],
  'Closed': [],
};

export const WORKFLOW_STAGES = [
  {
    step: '01',
    code: 'RECEIVE',
    title: 'Receive Request',
    description: 'Receive the request and record the date and available supporting documents.',
    responsibleRole: 'Receiving Liaison Desk (DEO)',
    sampleStatus: 'For Verification',
    expectedNextAction: 'Log physical or digital letter and assign preliminary intake timestamp.',
  },
  {
    step: '02',
    code: 'VERIFY',
    title: 'Verify Completeness',
    description: 'Check whether the letter, location description, request details, and necessary coordination information are complete.',
    responsibleRole: 'Records & Intake Verifier',
    sampleStatus: 'For Verification',
    expectedNextAction: 'Confirm street landmarks and Barangay contact person or return for clarification.',
  },
  {
    step: '03',
    code: 'REGISTER',
    title: 'Register in Smart Tracker',
    description: 'Create a unique ticket ID and enter the request in the Smart Tracker.',
    responsibleRole: 'Smart Tracker Coordinator',
    sampleStatus: 'Pending Evaluation',
    expectedNextAction: 'Assign DEO-YYYY-NNN reference number and pin location on street map.',
  },
  {
    step: '04',
    code: 'ENDORSE',
    title: 'Endorse for Evaluation',
    description: 'Forward the request to the authorized Engineering Evaluation Team.',
    responsibleRole: 'Engineering Evaluation Team',
    sampleStatus: 'Pending Evaluation',
    expectedNextAction: 'Review drainage asset profile, siltation severity, and district workload.',
  },
  {
    step: '05',
    code: 'INSPECT',
    title: 'Coordinate Site Inspection',
    description: 'Coordinate a site inspection when necessary.',
    responsibleRole: 'Field Inspection Engineers & Barangay Kagawad',
    sampleStatus: 'Inspection Scheduled',
    expectedNextAction: 'Conduct joint ocular inspection of canal, manhole, or storm drain.',
  },
  {
    step: '06',
    code: 'SCHEDULE',
    title: 'Await Operations Schedule',
    description: 'Await confirmation from the responsible operations personnel.',
    responsibleRole: 'Drainage Maintenance Operations Unit',
    sampleStatus: 'Scheduled for Implementation',
    expectedNextAction: 'Queue declogging crew, vacuum truck, or desilting tools per approved schedule.',
  },
  {
    step: '07',
    code: 'IMPLEMENT',
    title: 'Track Authorized Operation',
    description: 'Track the operation once it has been officially scheduled and authorized.',
    responsibleRole: 'Field Declogging Team & Barangay Liaison',
    sampleStatus: 'In Progress',
    expectedNextAction: 'Monitor debris extraction, haulage safety, and post-clearing drainage flow.',
  },
  {
    step: '08',
    code: 'CLOSE',
    title: 'Document Outcome & Close',
    description: 'Record the outcome, document feedback, and close the ticket according to the office\'s approved procedure.',
    responsibleRole: 'Authorized DEO Supervisor & Records Officer',
    sampleStatus: 'Closed',
    expectedNextAction: 'Archive completion report, Barangay acknowledgment, and audit history.',
  },
];

export function canTransitionStatus(currentStatus, targetStatus) {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

export function getExplainableNextStep(status) {
  const explanations = {
    'For Verification': {
      suggestedNextStatus: 'Pending Evaluation',
      suggestedActionTaken: 'Verified request letter completeness and street landmarks',
      suggestedNextStep: 'Endorse to Engineering Evaluation Team for technical review',
      rationale: 'Stage 02 (VERIFY) requires checking that the Barangay letter, street location, and contact person are complete before technical endorsement.',
    },
    'Returned for Clarification': {
      suggestedNextStatus: 'For Verification',
      suggestedActionTaken: 'Supplemental location details received from Barangay',
      suggestedNextStep: 'Re-verify completeness of updated request documents',
      rationale: 'Clarified requests return to intake verification so the liaison officer can confirm all missing details are resolved.',
    },
    'Pending Evaluation': {
      suggestedNextStatus: 'Inspection Scheduled',
      suggestedActionTaken: 'Inspection coordination initiated with Barangay official',
      suggestedNextStep: 'Conduct ocular site assessment of drainage line',
      rationale: 'Stage 04/05 (ENDORSE -> INSPECT) recommends joint site verification to assess silt depth, manhole access, and equipment needed.',
    },
    'Inspection Scheduled': {
      suggestedNextStatus: 'Scheduled for Implementation',
      suggestedActionTaken: 'Site assessment completed; recommended for operational queuing',
      suggestedNextStep: 'Await schedule confirmation from authorized Operations supervisor',
      rationale: 'Stage 06 (SCHEDULE) requires field assessment findings before operations personnel assign a declogging crew.',
    },
    'Scheduled for Implementation': {
      suggestedNextStatus: 'In Progress',
      suggestedActionTaken: 'Authorized field crew mobilized to site',
      suggestedNextStep: 'Monitor declogging and silt removal operation',
      rationale: 'Stage 07 (IMPLEMENT) tracks active field work once officially scheduled and authorized.',
    },
    'In Progress': {
      suggestedNextStatus: 'Completed',
      suggestedActionTaken: 'Declogging operation completed; water flow restored',
      suggestedNextStep: 'Verify post-operation site cleanliness and Barangay sign-off',
      rationale: 'Before closing the ticket, field completion and site clean-up must be documented.',
    },
    'Completed': {
      suggestedNextStatus: 'Closed',
      suggestedActionTaken: 'Outcome documented and archived in Smart Tracker',
      suggestedNextStep: 'Ticket closed per demonstration workflow procedure',
      rationale: 'Stage 08 (CLOSE) locks the record once outcome documentation and acknowledgment are complete.',
    },
    'Closed': {
      suggestedNextStatus: 'Closed',
      suggestedActionTaken: 'Record archived',
      suggestedNextStep: 'No further action required (Terminal State)',
      rationale: 'Closed tickets are locked against non-admin modifications to preserve audit integrity.',
    },
  };

  return (
    explanations[status] || {
      suggestedNextStatus: 'Pending Evaluation',
      suggestedActionTaken: 'Recorded in Smart Tracker',
      suggestedNextStep: 'Awaiting review',
      rationale: 'Standard intake progression.',
    }
  );
}

export const APP_THEMES = [
  {
    id: 'navy-glass',
    name: 'Manila Navy Glass',
    badge: 'Dark Glass',
    isLight: false,
    swatch: '#0284c7',
  },
  {
    id: 'daylight-civic',
    name: 'Daylight Civic Pearl',
    badge: 'Light Glass (Civic)',
    isLight: true,
    swatch: '#2563eb',
  },
  {
    id: 'light-sky',
    name: 'Manila Bay Azure Sky',
    badge: 'Light Glass (Sky)',
    isLight: true,
    swatch: '#0284c7',
  },
  {
    id: 'light-emerald',
    name: 'Clean Water Eco Park',
    badge: 'Light Glass (Eco)',
    isLight: true,
    swatch: '#059669',
  },
  {
    id: 'emerald-hydro',
    name: 'Emerald Hydro Command',
    badge: 'Bio-Engineering',
    isLight: false,
    swatch: '#10b981',
  },
  {
    id: 'amber-ops',
    name: 'Midnight Amber Ops',
    badge: 'Field Tactical',
    isLight: false,
    swatch: '#f59e0b',
  },
  {
    id: 'royal-violet',
    name: 'Executive Cobalt & Iris',
    badge: 'Presentation',
    isLight: false,
    swatch: '#8b5cf6',
  },
];

export function evaluateRequestCompleteness(input = {}) {
  const checks = [
    {
      id: 'barangay',
      label: 'Barangay Name (e.g., Barangay 123, Zone 10)',
      passed: Boolean(input.barangay && String(input.barangay).trim().length >= 3),
    },
    {
      id: 'district',
      label: 'Manila District & Legislative District',
      passed: Boolean(input.district && String(input.district).trim().length >= 2),
    },
    {
      id: 'streetAddress',
      label: 'Specific Street / Canal Segment Description',
      passed: Boolean(input.streetAddress && String(input.streetAddress).trim().length >= 5),
    },
    {
      id: 'requesterName',
      label: 'Coordinating Barangay Official (Name & Role)',
      passed: Boolean(input.requesterName && String(input.requesterName).trim().length >= 3),
    },
    {
      id: 'description',
      label: 'Drainage Obstruction Details (>= 15 chars)',
      passed: Boolean(input.description && String(input.description).trim().length >= 15),
    },
    {
      id: 'coordinates',
      label: 'Map Coordinates Pinned in Manila',
      passed:
        typeof input.latitude === 'number' &&
        !Number.isNaN(input.latitude) &&
        typeof input.longitude === 'number' &&
        !Number.isNaN(input.longitude),
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.passed).map((c) => c.label);

  return {
    score,
    isComplete: missing.length === 0,
    checks,
    missing,
  };
}

export function computeTicketAuditDiff(existing = {}, updated = {}) {
  const trackedFields = [
    { key: 'status', label: 'Workflow Status' },
    { key: 'priority', label: 'Priority Level' },
    { key: 'barangay', label: 'Barangay' },
    { key: 'district', label: 'Manila District' },
    { key: 'legislativeDistrict', label: 'Legislative District' },
    { key: 'streetAddress', label: 'Street / Canal Location' },
    { key: 'requestType', label: 'Request Type' },
    { key: 'actionTaken', label: 'Action Taken' },
    { key: 'nextStep', label: 'Next Step' },
    { key: 'requesterName', label: 'Coordinating Official' },
    { key: 'requesterRole', label: 'Official Designation' },
    { key: 'description', label: 'Scope & Obstruction Description' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'coordVerified', label: 'Coordinate Verification' },
  ];

  const changes = [];
  for (const field of trackedFields) {
    const oldVal = existing[field.key];
    const newVal = updated[field.key];
    if (newVal !== undefined && String(oldVal ?? '') !== String(newVal ?? '')) {
      changes.push({
        field: field.key,
        label: field.label,
        before: String(oldVal ?? 'None'),
        after: String(newVal ?? 'None'),
      });
    }
  }

  // Check inspection checklist changes
  const oldChecklist = typeof existing.inspectionChecklistJson === 'string'
    ? existing.inspectionChecklistJson
    : JSON.stringify(existing.inspectionChecklist || []);
  const newChecklist = typeof updated.inspectionChecklistJson === 'string'
    ? updated.inspectionChecklistJson
    : updated.inspectionChecklist
    ? JSON.stringify(updated.inspectionChecklist)
    : oldChecklist;

  if (oldChecklist !== newChecklist) {
    try {
      const oldArr = JSON.parse(oldChecklist);
      const newArr = JSON.parse(newChecklist);
      const oldDone = oldArr.filter((i) => i.done).length;
      const newDone = newArr.filter((i) => i.done).length;
      changes.push({
        field: 'inspectionChecklist',
        label: 'Inspection Checklist',
        before: `${oldDone}/${oldArr.length} completed`,
        after: `${newDone}/${newArr.length} completed`,
      });
    } catch {
      changes.push({
        field: 'inspectionChecklist',
        label: 'Inspection Checklist',
        before: 'Previous checklist',
        after: 'Updated checklist items',
      });
    }
  }

  let eventType = 'FIELD_EDIT';
  if (changes.some((c) => c.field === 'status')) {
    eventType = 'STATUS_TRANSITION';
  } else if (changes.some((c) => c.field === 'inspectionChecklist')) {
    eventType = 'CHECKLIST_UPDATE';
  } else if (changes.some((c) => c.field === 'latitude' || c.field === 'longitude' || c.field === 'coordVerified')) {
    eventType = 'COORD_UPDATE';
  }

  const summary =
    changes.length > 0
      ? `Modified ${changes.map((c) => `${c.label} (${c.before} → ${c.after})`).join('; ')}`
      : 'Updated ticket record metadata';

  return {
    eventType,
    changes,
    summary,
  };
}

export function findPotentialDuplicates(candidate = {}, existingTickets = []) {
  if (!candidate.barangay && !candidate.streetAddress) return [];
  const candBrgy = String(candidate.barangay || '').toLowerCase().trim();
  const candStreet = String(candidate.streetAddress || '').toLowerCase().trim();
  const candType = String(candidate.requestType || '').toLowerCase().trim();

  return existingTickets.filter((ticket) => {
    if (candidate.ticketId && ticket.ticketId === candidate.ticketId) return false;
    if (ticket.status === 'Closed') return false;

    const tBrgy = String(ticket.barangay || '').toLowerCase().trim();
    const tStreet = String(ticket.streetAddress || '').toLowerCase().trim();
    const tType = String(ticket.requestType || '').toLowerCase().trim();

    const sameBrgy = candBrgy && tBrgy && (tBrgy.includes(candBrgy) || candBrgy.includes(tBrgy));
    const sameStreet =
      candStreet &&
      tStreet &&
      candStreet.length >= 4 &&
      (tStreet.includes(candStreet) || candStreet.includes(tStreet));
    const sameType = !candType || tType === candType;

    return (sameBrgy && sameType) || sameStreet;
  });
}

export function calculateTicketAge(dateString, referenceDate = new Date('2026-10-23T00:00:00Z'), slaDays = 3) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return { daysElapsed: 0, isAging: false, label: 'Recent' };
  }
  const diffMs = Math.max(0, referenceDate.getTime() - parsed.getTime());
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isAging = daysElapsed >= slaDays;
  return {
    daysElapsed,
    isAging,
    label: daysElapsed === 0 ? 'Today' : `${daysElapsed}d in queue`,
  };
}

export function calculateDashboardMetrics(tickets = []) {
  const totalRequests = tickets.length;
  const pendingVerification = tickets.filter(
    (t) => t.status === 'For Verification' || t.status === 'Returned for Clarification'
  ).length;
  const pendingEvaluation = tickets.filter((t) => t.status === 'Pending Evaluation').length;
  const inspectionScheduled = tickets.filter(
    (t) => t.status === 'Inspection Scheduled' || t.status === 'Scheduled for Implementation'
  ).length;
  const inProgress = tickets.filter((t) => t.status === 'In Progress').length;
  const completedRequests = tickets.filter(
    (t) => t.status === 'Completed' || t.status === 'Closed'
  ).length;
  const returnedRequests = tickets.filter((t) => t.status === 'Returned for Clarification').length;

  const byStatus = {};
  for (const status of TICKET_STATUSES) {
    byStatus[status] = tickets.filter((t) => t.status === status).length;
  }

  const byType = {};
  for (const rType of REQUEST_TYPES) {
    byType[rType] = tickets.filter((t) => t.requestType === rType).length;
  }

  const byDistrict = {};
  for (const t of tickets) {
    const d = t.district || 'Unspecified';
    byDistrict[d] = (byDistrict[d] || 0) + 1;
  }

  return {
    totalRequests,
    pendingVerification,
    pendingEvaluation,
    inspectionScheduled,
    inProgress,
    completedRequests,
    returnedRequests,
    byStatus,
    byType,
    byDistrict,
  };
}

export function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ticketsToCsv(tickets = []) {
  const headers = [
    'Date Received',
    'Ticket ID',
    'Barangay',
    'District',
    'Legislative District',
    'Street Address',
    'Request Type',
    'Status',
    'Priority',
    'Action Taken',
    'Next Step',
    'Requester Name',
    'Latitude',
    'Longitude',
  ];
  const rows = tickets.map((t) =>
    [
      t.dateReceived,
      t.ticketId,
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
      t.latitude,
      t.longitude,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}

export function generateSampleRequestLetter(ticket = {}) {
  const date = ticket.dateReceived || ticket.date || 'October 20, 2026';
  const barangay = ticket.barangay || 'Barangay 123, Zone 10';
  const requesterName = ticket.requesterName || ticket.kagawad || 'Juan D. Cruz';
  const requesterRole = ticket.requesterRole || 'Barangay Kagawad';
  const streetAddress = ticket.streetAddress || ticket.street || 'Estero de Vitas Service Road';
  const requestType = ticket.requestType || ticket.drainageType || 'Declogging';
  const refNo = ticket.ticketId || 'DEO-2026-001';

  return {
    referenceNo: `REF-BRGY-${refNo}`,
    date,
    to: 'Department of Engineering and Public Works (DEPW)',
    from: barangay,
    through: `${requesterName}, ${requesterRole}`,
    subject: `Request for Drainage ${requestType} at ${streetAddress}`,
    bodyTagalog:
      'Magalang po kaming humihiling ng tulong mula sa Department of Engineering Office para sa pagsasagawa ng declogging sa isang bahagi ng drainage sa aming barangay. Napansin po ang pag-ipon ng putik at iba pang debris na maaaring makaapekto sa maayos na daloy ng tubig. Hinihiling po namin ang inyong pagsusuri at koordinasyon para sa posibleng iskedyul ng operasyon. Maraming salamat po.',
    disclaimer:
      'OFFICIAL LIAISON TRANSMITTAL FORMAT • Subject to Engineering Verification and Field Inspection Scheduling.',
  };
}

export const MANILA_DISTRICTS = MANILA_16_DISTRICTS;
export const DRAINAGE_TYPES = REQUEST_TYPES;
export const evaluateTicketCompleteness = evaluateRequestCompleteness;

export const WATER_DRAINAGE_THRESHOLDS = {
  h2sPpm: {
    key: 'h2sPpm',
    label: 'H2S Culvert Gas',
    unit: 'ppm',
    safeRange: '< 3.0 ppm',
    warn: 5.0,
    crit: 10.0,
    direction: 'high_bad',
    normalDesc: 'Safe respiratory level for field crews',
    warnDesc: 'Elevated gas detected; ventilate culvert before entry',
    critDesc: 'HAZARDOUS CONCENTRATION EXCEEDED: evacuate culvert immediately',
  },
  dissolvedOxygen: {
    key: 'dissolvedOxygen',
    label: 'Dissolved Oxygen',
    unit: 'mg/L',
    safeRange: '>= 5.0 mg/L',
    warn: 5.0,
    crit: 3.0,
    direction: 'low_bad',
    normalDesc: 'Optimal aerobic water conveyance',
    warnDesc: 'Hypoxic flow risk; organic silt decomposition detected',
    critDesc: 'ACUTE ANOXIA EXCEEDED: stagnant sewer backwater detected',
  },
  turbidityNtu: {
    key: 'turbidityNtu',
    label: 'Suspended Turbidity',
    unit: 'NTU',
    safeRange: '<= 50 NTU',
    warn: 50.0,
    crit: 80.0,
    direction: 'high_bad',
    normalDesc: 'Normal sediment clarity',
    warnDesc: 'Elevated silt sediment buildup',
    critDesc: 'HEAVY SILT CLOGGING EXCEEDED: imminent culvert choke point',
  },
  ammoniaMgL: {
    key: 'ammoniaMgL',
    label: 'Ammonia (NH3)',
    unit: 'mg/L',
    safeRange: '<= 2.0 mg/L',
    warn: 2.0,
    crit: 3.0,
    direction: 'high_bad',
    normalDesc: 'Within permissible discharge guidelines',
    warnDesc: 'Elevated organic leachate entering waterway',
    critDesc: 'TOXIC EFFLUENT EXCEEDED: investigate upstream discharge',
  },
  flowIndex: {
    key: 'flowIndex',
    label: 'Hydraulic Flow Efficiency',
    unit: '%',
    safeRange: '>= 75%',
    warn: 70.0,
    crit: 50.0,
    direction: 'low_bad',
    normalDesc: 'Unimpeded storm drainage conveyance',
    warnDesc: 'Constricted culvert capacity (debris accumulation)',
    critDesc: 'CRITICAL BACKFLOW HAZARD: culvert cross-section choked',
  },
};

export function evaluateWaterDrainageSafety(readings = {}) {
  const evaluatedItems = [];
  let worstSeverity = 'NORMAL';

  for (const [key, rule] of Object.entries(WATER_DRAINAGE_THRESHOLDS)) {
    const rawVal = readings[key];
    const val = typeof rawVal === 'number' ? rawVal : (rawVal !== undefined && rawVal !== null ? Number(rawVal) : null);
    if (val === null || Number.isNaN(val)) continue;

    let status = 'NORMAL';
    let message = rule.normalDesc;

    if (rule.direction === 'high_bad') {
      if (val >= rule.crit) {
        status = 'CRITICAL';
        message = rule.critDesc;
      } else if (val >= rule.warn) {
        status = 'WARNING';
        message = rule.warnDesc;
      }
    } else if (rule.direction === 'low_bad') {
      if (val <= rule.crit) {
        status = 'CRITICAL';
        message = rule.critDesc;
      } else if (val <= rule.warn) {
        status = 'WARNING';
        message = rule.warnDesc;
      }
    }

    if (status === 'CRITICAL') {
      worstSeverity = 'CRITICAL';
    } else if (status === 'WARNING' && worstSeverity !== 'CRITICAL') {
      worstSeverity = 'WARNING';
    }

    evaluatedItems.push({
      key,
      label: rule.label,
      value: val,
      unit: rule.unit,
      safeRange: rule.safeRange,
      status,
      message,
    });
  }

  const breaches = evaluatedItems.filter((item) => item.status !== 'NORMAL');
  const criticalCount = evaluatedItems.filter((item) => item.status === 'CRITICAL').length;
  const warningCount = evaluatedItems.filter((item) => item.status === 'WARNING').length;

  return {
    overallStatus: worstSeverity,
    criticalCount,
    warningCount,
    breaches,
    items: evaluatedItems,
    timestamp: readings.timestamp || new Date().toISOString(),
  };
}

/**
 * 8-Stage Interactive Workflow Flowchart Specifications
 * Complete with Tagalog/English titles, responsible units, required inputs, and plain explanations.
 */
export const FLOWCHART_STAGES = [
  {
    step: '01',
    code: 'INTAKE',
    titleEn: 'Receive Request',
    titleFil: 'Pagtanggap ng Kahilingan',
    statusBadge: 'For Verification',
    responsibleRoleEn: 'Receiving Liaison Desk (DEO)',
    responsibleRoleFil: 'Opisyal sa Tanggapan ng DEO',
    requiredInputsEn: ['Barangay Official Endorsement Letter', 'Signatory Name & Contact Number', 'Receiving Date Stamp'],
    requiredInputsFil: ['Opisyal na Liham mula sa Barangay', 'Pangalan at Numero ng Opisyal', 'Tatak ng Petsa ng Pagtanggap'],
    plainDescriptionEn: 'The office receives the barangay request letter and logs the intake date, checking initial legibility.',
    plainDescriptionFil: 'Tinatanggap ng tanggapan ang sulat-kahilingan mula sa barangay at inilalagay ang opisyal na petsa ng pagkatanggap.',
    expectedNextActionEn: 'Log physical/email transmission and forward to intake verifier.',
    expectedNextActionFil: 'Itala ang sulat at ipasa sa tagasuri ng dokumento.',
    officialNoteEn: 'Pre-requisite for all processing. Prevents untracked verbal or backdoor requests.',
    officialNoteFil: 'Kailangan upang matiyak na opisyal at may talaan ang bawat reklamo o hiling.',
  },
  {
    step: '02',
    code: 'VERIFY',
    titleEn: 'Verify Completeness',
    titleFil: 'Pagsusuri ng Dokumento',
    statusBadge: 'For Verification',
    responsibleRoleEn: 'Records & Intake Verifier',
    responsibleRoleFil: 'Tagasuri ng Dokumento at Rekord',
    requiredInputsEn: ['Barangay & Zone Identification', 'Street / Canal Segment Description', 'Valid Drainage Obstruction Issue'],
    requiredInputsFil: ['Numero ng Barangay at Zone', 'Eksaktong Kalye o Bahagi ng Kanal', 'Malinaw na Paglalarawan ng Bara'],
    plainDescriptionEn: 'Confirm all required location landmarks and contact details are complete. If incomplete, return for clarification.',
    plainDescriptionFil: 'Sinusuri kung buo ang impormasyon: anong kalye, sinong opisyal, at ano ang nakabara. Kung kulang, ibinabalik sa barangay.',
    expectedNextActionEn: 'Pass 6-point verification checklist or issue return notification.',
    expectedNextActionFil: 'Ipasa sa checklist o humingi ng karagdagang detalye.',
    officialNoteEn: 'Protects engineering resources from unlocatable or ambiguous requests.',
    officialNoteFil: 'Naiiwasan ang pagkaantala ng mga inhinyero dahil sa maling address o kulang na impormasyon.',
  },
  {
    step: '03',
    code: 'REGISTER',
    titleEn: 'Register in Smart Tracker',
    titleFil: 'Pagtala sa Smart Tracker',
    statusBadge: 'Pending Evaluation',
    responsibleRoleEn: 'Smart Tracker Coordinator',
    responsibleRoleFil: 'Tagapamahala ng Digital Tracker',
    requiredInputsEn: ['Assigned DEO-YYYY-NNN ID', 'Manila Street Map Coordinates', 'Priority Level Classification'],
    requiredInputsFil: ['Opisyal na Reference Number (DEO)', 'GPS Coordinates o Lokasyon sa Mapa', 'Antas ng Pangangailangan (Priority)'],
    plainDescriptionEn: 'The request is assigned a unique tracking number, pinned on the Manila GIS map, and entered into the digital database.',
    plainDescriptionFil: 'Binibigyan ng opisyal na Reference Number (tulad ng DEO-2026-001) at inilalagay ang lokasyon sa mapa ng Maynila.',
    expectedNextActionEn: 'Assign reference code and publish to evaluation queue.',
    expectedNextActionFil: 'Ipasok sa listahan para masuri ng technical team.',
    officialNoteEn: 'Establishes immutable digital tracking and transparency across city districts.',
    officialNoteFil: 'Nagbibigay ng malinaw na tracking number para madaling masubaybayan ng barangay.',
  },
  {
    step: '04',
    code: 'ENDORSE',
    titleEn: 'Endorse for Evaluation',
    titleFil: 'Pagpasa sa Technical Team',
    statusBadge: 'Pending Evaluation',
    responsibleRoleEn: 'Engineering Evaluation Team',
    responsibleRoleFil: 'Koponan ng mga Inhinyero (Technical Evaluation)',
    requiredInputsEn: ['Historical Siltation Profile', 'Culvert / Storm Drain Diameter', 'Tidal & Flood Basin Context'],
    requiredInputsFil: ['Kasaysayan ng Pagbaha sa Lugar', 'Laki ng Tubo o Box Culvert', 'Daloy papuntang Estero o Ilog'],
    plainDescriptionEn: 'Civil and sanitary engineers examine drainage blueprints to determine if standard desilting or heavy equipment is required.',
    plainDescriptionFil: 'Sinusuri ng mga inhinyero ang laki ng kanal at kung kakayanin ng manu-manong paglilinis o kailangan ng vacuum truck.',
    expectedNextActionEn: 'Issue engineering recommendation and determine if site inspection is mandatory.',
    expectedNextActionFil: 'Maglabas ng rekomendasyon kung kailangan ng ocular inspection.',
    officialNoteEn: 'Technical evaluation prevents improper machinery deployment in narrow alleys.',
    officialNoteFil: 'Tinitiyak na angkop na makinarya at paraan ang gagamitin sa laki ng kanal.',
  },
  {
    step: '05',
    code: 'INSPECT',
    titleEn: 'Coordinate Site Inspection',
    titleFil: 'Aktwal na Pagsusuri sa Lugar',
    statusBadge: 'Inspection Scheduled',
    responsibleRoleEn: 'Field Inspection Engineers & Barangay Kagawad',
    responsibleRoleFil: 'Field Engineer at Kagawad ng Barangay',
    requiredInputsEn: ['Joint Ocular Assessment', 'Manhole Depth Measurement', 'Gas & Hydrogen Sulfide (H2S) Safety Reading'],
    requiredInputsFil: ['Sabay na Pagsusuri sa Lugar', 'Lalim ng Putik sa Manhole', 'Pagsukat sa Lason o Mabahong Gas (H2S)'],
    plainDescriptionEn: 'Engineers meet barangay officials on-site to inspect manholes, check silt depth, and verify worker safety.',
    plainDescriptionFil: 'Pumupunta ang mga inhinyero kasama ang barangay sa mismong kalsada para sukatin ang putik at tiyakin ang kaligtasan.',
    expectedNextActionEn: 'Complete site inspection report and certify operational readiness.',
    expectedNextActionFil: 'Kumpletuhin ang inspection checklist at isumite sa Operations.',
    officialNoteEn: 'Safety protocols require atmospheric gas testing before any worker enters confined culverts.',
    officialNoteFil: 'Mahigpit na ipinagbabawal ang pagpasok sa imburnal nang walang pagsusuri sa gas.',
  },
  {
    step: '06',
    code: 'SCHEDULE',
    titleEn: 'Await Operations Schedule',
    titleFil: 'Pagtatakda ng Iskedyul',
    statusBadge: 'Scheduled for Implementation',
    responsibleRoleEn: 'Drainage Maintenance Operations Unit',
    responsibleRoleFil: 'Tanggapan ng Operasyon at Iskedyul',
    requiredInputsEn: ['Vacuum Truck / Jetting Availability', 'Crew Roster & Traffic Marshall Advisory', 'Operational Date Slot'],
    requiredInputsFil: ['Bakanteng Trak (Vacuum/Jetting)', 'Listahan ng Tauhan at Abiso sa Trapiko', 'Petsa at Oras ng Paglilinis'],
    plainDescriptionEn: 'Operations supervisors assign the specific crew, vehicle, and date slot, coordinating traffic advisories with Manila MTPB if needed.',
    plainDescriptionFil: 'Inilalagay sa opisyal na kalendaryo ang araw ng operasyon at inihahanda ang mga makinarya at koordinasyon sa trapiko.',
    expectedNextActionEn: 'Notify Barangay of scheduled operational date and mobilize crew.',
    expectedNextActionFil: 'Ipaalam sa Barangay ang itinakdang petsa ng paglilinis.',
    officialNoteEn: 'Prevents vehicular bottlenecks on primary Manila thoroughfares.',
    officialNoteFil: 'Iniiwasan ang matinding trapiko sa pamamagitan ng maayos na pag-iskedyul.',
  },
  {
    step: '07',
    code: 'IMPLEMENT',
    titleEn: 'Track Authorized Operation',
    titleFil: 'Pagsasagawa ng Declogging',
    statusBadge: 'In Progress',
    responsibleRoleEn: 'Field Declogging Team & Barangay Liaison',
    responsibleRoleFil: 'Koponan sa Paglilinis at Barangay Liaison',
    requiredInputsEn: ['On-Site Safety Perimeter', 'High-Pressure Water Jetting / Silt Extraction', 'Waste Hauling Manifest'],
    requiredInputsFil: ['Harang at Tanda ng Kaligtasan sa Kalsada', 'Pagsipsip ng Putik at Debris', 'Dokumento ng Paghakot ng Basura'],
    plainDescriptionEn: 'The authorized field crew cleans the drainage, unclogs the culverts, sucks out the silt, and hauls away debris safely.',
    plainDescriptionFil: 'Aktwal na nililinis ang imburnal, sinisipsip ang naipong putik, at hinahakot ang mga basurang nakabara.',
    expectedNextActionEn: 'Complete water flow verification and restore roadway covers.',
    expectedNextActionFil: 'Subukan ang daloy ng tubig at ibalik nang maayos ang takip ng manhole.',
    officialNoteEn: 'Requires continuous tracking from equipment departure to site departure.',
    officialNoteFil: 'May opisyal na talaan ng oras ng pagsisimula at pagtatapos ng trabaho sa kalsada.',
  },
  {
    step: '08',
    code: 'CLOSE',
    titleEn: 'Document Outcome & Close',
    titleFil: 'Pagtatapos at Pag-archive',
    statusBadge: 'Closed',
    responsibleRoleEn: 'Authorized DEO Supervisor & Records Officer',
    responsibleRoleFil: 'Superbisor ng DEO at Tagapamahala ng Rekord',
    requiredInputsEn: ['Signed Barangay Acknowledgment Receipt', 'Post-Declogging Flow Photo', 'Immutable Server Audit Entry'],
    requiredInputsFil: ['Nilagdaang Katibayan mula sa Barangay', 'Litrato ng Malinis at Dumadaloy na Kanal', 'Opisyal na Audit Log'],
    plainDescriptionEn: 'The Barangay signs off confirming the water is flowing freely. The ticket is sealed and archived in the immutable audit log.',
    plainDescriptionFil: 'Pumipirma ang opisyal ng barangay na maayos na ang daloy ng tubig. Isinasara ang rekord at ligtas na itinatago.',
    expectedNextActionEn: 'Record locked; audit history permanently preserved.',
    expectedNextActionFil: 'Naka-archive na ang buong rekord para sa transparency at ulat sa publiko.',
    officialNoteEn: 'Closed records cannot be modified without supervisor audit authorization.',
    officialNoteFil: 'Hindi na mababago ang rekord nang walang pahintulot upang mapanatili ang integridad.',
  },
];

/**
 * Step-by-Step Beginner Tutorial Lessons (Bilingual: Simple Tagalog & Simple English)
 * Designed specifically for first-time users and staff wanting gentle, clear, step-by-step instruction.
 */
export const TUTORIAL_LESSONS = [
  {
    id: 1,
    interactiveType: 'welcome',
    titleEn: 'Welcome to DEPW Assist',
    titleFil: 'Maligayang Pagdating sa DEPW Assist',
    badgeEn: 'Lesson 1 of 12 • DEPW Mandate',
    badgeFil: 'Aralin 1 ng 12 • Tungkulin ng DEPW',
    summaryEn: 'DEPW Assist is the official public works declogging management platform for the City of Manila, tracking drainage maintenance requests from intake to completion.',
    summaryFil: 'Ang DEPW Assist ay ang opisyal na plataporma ng Department of Engineering and Public Works ng Lungsod ng Maynila para sa maayos na pagsubaybay sa mga kahilingan sa paglilinis ng drainage.',
    numberedInstructionsEn: [
      'Learn the mission: Unimpeded storm drainage across 16 Manila districts.',
      'Understand the Citizen\'s Charter standards for public infrastructure maintenance.',
      'Operate with complete accountability and zero untracked paper requests.',
    ],
    numberedInstructionsFil: [
      'Alamin ang layunin: Malinis at maayos na daloy ng tubig sa 16 na distrito ng Maynila.',
      'Ipatupad ang mga pamantayan ng Citizen\'s Charter sa serbisyo-publiko.',
      'Maging tapat at tiyaking may malinaw na talaan ang bawat reklamo o hiling.',
    ],
    highlightsEn: [
      'Directly supports Manila City Hall\'s anti-flooding operations.',
      'Zero paper loss: Every barangay transmittal is digitally logged.',
      'Complies with Republic Act 6713 transparency guidelines.',
    ],
    highlightsFil: [
      'Direktang sumusuporta sa mga operasyon laban sa baha sa Maynila.',
      'Walang nawawalang papel: Bawat liham ng barangay ay may digital na rekord.',
      'Sumusunod sa mga panuntunan ng Republic Act 6713 sa etika ng serbisyo.',
    ],
    tipEn: 'You do not need prior technical expertise to use this system. Every step is clearly explained.',
    tipFil: 'Hindi kailangang maging eksperto sa computer upang magamit ang system. May malinaw na gabay sa bawat yugto.',
  },
  {
    id: 2,
    interactiveType: 'navigation',
    titleEn: 'Interface & Navigation',
    titleFil: 'Ang Interface at Pag-navigate sa Sistema',
    badgeEn: 'Lesson 2 of 12 • System Layout',
    badgeFil: 'Aralin 2 ng 12 • Ayos ng Sistema',
    summaryEn: 'Explore the modern glassmorphism workspace, visual themes, Easy Mode toggle, and navigation tabs.',
    summaryFil: 'Alamin kung paano gamitin ang mga navigation tab, pagpalit ng visual theme, at ang Easy Mode toggle para sa mas malalaking teksto.',
    numberedInstructionsEn: [
      'Locate the primary navigation tabs at the top (or mobile menu on phones).',
      'Try the Easy Mode toggle to increase contrast and button sizes.',
      'Use the visual theme switcher to pick daylight or night glass modes.',
    ],
    numberedInstructionsFil: [
      'Tingnan ang mga pangunahing navigation tab sa itaas (o sa mobile drawer kung nasa cellphone).',
      'Subukan ang Easy Mode toggle para mas lumaki ang mga letra at pindutan.',
      'Gamitin ang Theme Selector upang pumili ng maliwanag (Daylight) o panggabing tema.',
    ],
    highlightsEn: [
      'Tabs: Command Center, Smart Tracker, Flowchart, GIS Map, 3D Twin, and Lab.',
      'Easy Mode provides 110% font scaling and enlarged touch buttons.',
      'Supports 7 custom themes including 3 high-visibility daylight modes.',
    ],
    highlightsFil: [
      'Mga Tab: Command Center, Smart Tracker, Flowchart, Mapa GIS, 3D Twin, at Lab.',
      'Ang Easy Mode ay nagbibigay ng mas malalaking letra para madaling mabasa.',
      'May 7 visual theme kabilang ang 3 daylight civic mode para sa maliwanag na opisina.',
    ],
    tipEn: 'On smartphones, tap the "More" hamburger icon to access all operational sections.',
    tipFil: 'Sa smartphone, pindutin ang "More" icon sa ibaba upang makita ang lahat ng seksyon.',
  },
  {
    id: 3,
    interactiveType: 'kpi_thresholds',
    titleEn: 'Dashboard & Safety Threshold Alerts',
    titleFil: 'Dashboard at Abiso sa Ligtas na Antas (Threshold Alerts)',
    badgeEn: 'Lesson 3 of 12 • Metrics & Safety',
    badgeFil: 'Aralin 3 ng 12 • Sukat at Kaligtasan',
    summaryEn: 'The Command Center displays active declogging projects, average turnaround times, and automated alerts when environmental metrics exceed safety limits.',
    summaryFil: 'Ipinapakita sa Command Center ang bilang ng aktibong declogging, bilis ng pag-aksyon, at mga awtomatikong abiso kapag mapanganib ang antas ng tubig o gas.',
    numberedInstructionsEn: [
      'Inspect the top KPI cards: Total Requests, Active Field Work, and Turnaround.',
      'Review the Recharts trend graphs for quarterly declogging volume.',
      'Notice the Threshold Notification box: It turns Amber for warnings and Red for critical hazards.',
    ],
    numberedInstructionsFil: [
      'Suriin ang mga KPI card sa itaas: Kabuuang Hiling, Aktibong Operasyon, at Araw ng Aksyon.',
      'Tingnan ang graph ng dami ng nalinis na kanal bawat buwan.',
      'Pansinin ang Kahon ng Abiso (Threshold): Nagiging Dilaw kapag babala, at Pula kapag mapanganib.',
    ],
    highlightsEn: [
      'Safety Alerts monitor H2S confined culvert gas (< 3.0 ppm safe threshold).',
      'Dissolved oxygen alerts flag stagnant, hypoxic water buildup.',
      'Color coding: Green = Normal, Amber = Warning, Crimson = Critical Hazard.',
    ],
    highlightsFil: [
      'Binabantayan ang H2S gas sa imburnal upang hindi mapahamak ang mga manggagawa.',
      'Nagbibigay-babala kapag barado at mabaho na ang naipong tubig sa culvert.',
      'Kulay: Berde = Ligtas, Dilaw = Mag-ingat, Pula = Mapanganib.',
    ],
    tipEn: 'Always check the Safety Alert banner before approving personnel entry into deep culverts.',
    tipFil: 'Laging suriin ang babala sa gas bago pumasok ang tauhan sa malalim na imburnal.',
  },
  {
    id: 4,
    interactiveType: 'search_filter',
    titleEn: 'Smart Tracker Search & Filtering',
    titleFil: 'Paghahanap at Pagsala sa Smart Tracker',
    badgeEn: 'Lesson 4 of 12 • Search & Filters',
    badgeFil: 'Aralin 4 ng 12 • Paghahanap ng Rekord',
    summaryEn: 'Quickly find any barangay declogging request across Manila using real-time search, district filters, and workflow status pills.',
    summaryFil: 'Madaling hanapin ang anumang rekord ng barangay gamit ang search bar, pagsala ayon sa distrito, at mga filter sa katayuan.',
    numberedInstructionsEn: [
      'Type keywords into the Search Box (e.g., street name, barangay number, or ticket ID).',
      'Filter by Manila District (e.g. Tondo, Sampaloc, Binondo, Ermita, Paco).',
      'Select a status filter (e.g., "For Verification" or "In Progress") to narrow down records.',
    ],
    numberedInstructionsFil: [
      'Mag-type ng pangalan ng kalye, numero ng barangay, o ticket ID sa Search Box.',
      'Piliin ang Distrito ng Maynila (hal. Tondo, Sampaloc, Binondo, Paco).',
      'Pindutin ang filter ng katayuan (hal. "For Verification" o "In Progress").',
    ],
    highlightsEn: [
      'Instant filtering with zero delay.',
      'Identifies duplicate requests across the same canal line.',
      'Export matching tickets to official spreadsheet CSV anytime.',
    ],
    highlightsFil: [
      'Mabilisang paglabas ng resulta nang walang pagkaantala.',
      'Awtomatikong napapansin kung may kaparehong reklamo sa iisang kalye.',
      'Maaaring i-export sa Excel CSV ang listahan para sa opisyal na ulat.',
    ],
    tipEn: 'You can search by just a street corner (e.g., "Maceda") or barangay number (e.g., "123").',
    tipFil: 'Maaari kang maghanap sa pamamagitan lamang ng kanto ng kalye o numero ng barangay.',
  },
  {
    id: 5,
    interactiveType: 'ticket_details',
    titleEn: 'Ticket Details & Immutable Audit Trail',
    titleFil: 'Mga Detalye ng Ticket at Immutable Audit Trail',
    badgeEn: 'Lesson 5 of 12 • Inspector & Audit',
    badgeFil: 'Aralin 5 ng 12 • Detalye at Audit Log',
    summaryEn: 'Clicking any ticket opens the detail inspector, featuring request metadata, coordinates, engineering notes, and the tamper-proof audit history.',
    summaryFil: 'Sa pagpindot ng ticket, bubukas ang detalye nito: address, contact person, mapa, at ang opisyal na kasaysayan ng bawat pagbabago (Audit Log).',
    numberedInstructionsEn: [
      'Switch between the Overview, Confined Space Checklist, and Audit Log tabs.',
      'Review the Coordinating Official name, contact, and street description.',
      'Open the Audit Log tab to see timestamps, previous values, and who authorized changes.',
    ],
    numberedInstructionsFil: [
      'Magpalipat-lipat sa Overview, Safety Checklist, at Audit Log tab.',
      'Tingnan ang pangalan ng Kagawad, contact number, at eksaktong lokasyon.',
      'Buksan ang Audit Log tab upang makita ang petsa, oras, at sinong kawani ang nag-edit.',
    ],
    highlightsEn: [
      'Every status transition is logged with cryptographic certainty.',
      'Field diff displays exact BEFORE and AFTER values for full transparency.',
      'Closed records are archived and protected against retroactive tampering.',
    ],
    highlightsFil: [
      'Bawat pagpalit ng katayuan ay may permanenteng talaan sa server.',
      'Ipinapakita ang dating nakasulat at ang bagong binago (Diff).',
      'Hindi mabubura o mababago ang mga naisara nang rekord nang walang pahintulot.',
    ],
    tipEn: 'The audit log protects both the citizen and the engineering staff by preserving an undisputed record of events.',
    tipFil: 'Pinoprotektahan ng audit log ang mamamayan at kawani sa pamamagitan ng tapat at malinaw na talaan.',
  },
  {
    id: 6,
    interactiveType: 'workflow_stages',
    titleEn: 'The 8-Stage Declogging Pipeline',
    titleFil: 'Ang 8 Yugto ng Daloy ng Trabaho (Pipeline)',
    badgeEn: 'Lesson 6 of 12 • 8-Stage Pipeline',
    badgeFil: 'Aralin 6 ng 12 • 8 Hakbang sa Trabaho',
    summaryEn: 'Every request advances through an 8-stage engineering pipeline designed to prevent skipped safety checks and unauthorized operations.',
    summaryFil: 'Bawat kahilingan ay dumadaan sa 8 sunod-sunod na yugto upang matiyak na ligtas, may pirma, at dokumentado ang bawat operasyon.',
    numberedInstructionsEn: [
      'Stage 01 (INTAKE): Receive and stamp the barangay letter.',
      'Stage 02 (VERIFY): Confirm completeness of street landmarks and signatory.',
      'Stage 03–04 (REGISTER & ENDORSE): Assign ticket ID and route to civil engineers.',
      'Stage 05–08 (INSPECT, SCHEDULE, IMPLEMENT, CLOSE): Field ocular visit, crew scheduling, jetting/cleaning, and signed closure.',
    ],
    numberedInstructionsFil: [
      'Yugto 01 (INTAKE): Tanggapin at tatakan ang opisyal na sulat ng barangay.',
      'Yugto 02 (VERIFY): Tiyaking kumpleto ang address at impormasyon ng opisyal.',
      'Yugto 03–04 (REGISTER & ENDORSE): Bigyan ng Reference ID at ipasa sa mga inhinyero.',
      'Yugto 05–08 (INSPECT, SCHEDULE, IMPLEMENT, CLOSE): Ocular visit, iskedyul ng trak, paglinis ng kanal, at nilagdaang pagtatapos.',
    ],
    highlightsEn: [
      'Prevents arbitrary skipping of engineering inspection.',
      'Clearly separates receiving desk responsibilities from field operations.',
      'Distinguishes proposed operations from officially approved procedures.',
    ],
    highlightsFil: [
      'Iniiwasan ang paglaktaw sa kinakailangang ocular inspection.',
      'Malinaw ang pagkakahati ng tungkulin ng desk staff at field engineers.',
      'Maliwanag ang kaibahan ng mungkahi sa opisyal nang naaprubahang iskedyul.',
    ],
    tipEn: 'You can view the full visual flowchart by clicking the "Workflow Flowchart" tab at any time.',
    tipFil: 'Maaari mong buksan ang "Workflow Flowchart" tab anumang oras para makita ang buong proseso.',
  },
  {
    id: 7,
    interactiveType: 'inspection_protocols',
    titleEn: 'Verification & Safety Protocols',
    titleFil: 'Pagsusuri at Panuntunan sa Kaligtasan (Protocols)',
    badgeEn: 'Lesson 7 of 12 • Field Protocols',
    badgeFil: 'Aralin 7 ng 12 • Kaligtasan sa Trabaho',
    summaryEn: 'Confined drainage culverts contain hazardous sewer gases. Strict inspection protocols protect both personnel and the community before equipment deploys.',
    summaryFil: 'Ang mga imburnal ay may mapanganib na gas. Mahigpit na pagsusuri ang kailangan bago buksan o pasukin ang manhole upang matiyak ang kaligtasan.',
    numberedInstructionsEn: [
      'Atmospheric Gas Check: Verify H2S is below 3.0 ppm before opening manhole covers.',
      'Barangay Presence: Ensure a Barangay Kagawad or tanod is on-site as an official witness.',
      'Traffic Marshall Advisory: Coordinate with Manila Traffic and Parking Bureau (MTPB) for major road lanes.',
    ],
    numberedInstructionsFil: [
      'Suriin ang Gas: Siguraduhing mababa sa 3.0 ppm ang H2S bago buksan ang manhole.',
      'Saksi mula sa Barangay: Tiyaking naroroon ang Kagawad o tanod habang nag-iinspeksyon.',
      'Abiso sa Trapiko: Makipag-ugnayan sa MTPB kung sasakupin ang daanan ng sasakyan.',
    ],
    highlightsEn: [
      'Never dispatch declogging crews without verified site access.',
      'Confined space entry requires calibrated multigas detection.',
      'Checklist items must be ticked off in the ticket inspector before advancing.',
    ],
    highlightsFil: [
      'Huwag magpadala ng trak kung hindi pa nasusuri ang daanan at manhole.',
      'Kailangang may detector bago bumaba ang tao sa ilalim ng kalsada.',
      'Lagyan ng tsek ang checklist sa ticket bago mag-iskedyul ng clearing.',
    ],
    tipEn: 'Safety protocols protect workers from asphyxiation, toxic hydrogen sulfide, and road traffic incidents.',
    tipFil: 'Ang mga safety protocol ay nagliligtas ng buhay ng ating mga manggagawa sa kalsada.',
  },
  {
    id: 8,
    interactiveType: 'create_practice',
    titleEn: 'Creating a Practice Request',
    titleFil: 'Paggawa ng Praktis na Kahilingan (Practice Request)',
    badgeEn: 'Lesson 8 of 12 • Hands-on Intake',
    badgeFil: 'Aralin 8 ng 12 • Pagsasanay sa Pag-encode',
    summaryEn: 'Practice logging a new declogging request using our safe simulation form. All practice records are clearly marked [DEMO DATA - SIMULATED].',
    summaryFil: 'Subukang mag-encode ng bagong hiling sa ating simulation form. Lahat ng praktis na rekord ay may markang [DEMO DATA - SIMULATED] para ligtas.',
    numberedInstructionsEn: [
      'Fill in the Barangay number, Manila District, and specific street location.',
      'Provide the coordinating Barangay official\'s name and contact number.',
      'Click the "Quick Fill Practice Data" button to auto-populate sample details safely.',
      'Submit the practice ticket and see it registered in your practice queue.',
    ],
    numberedInstructionsFil: [
      'Ilagay ang numero ng Barangay, Distrito ng Maynila, at kanto ng kalye.',
      'Isulat ang pangalan ng Kagawad at kanyang contact number.',
      'Pindutin ang "Quick Fill Practice Data" para awtomatikong malagyan ng halimbawa.',
      'Pindutin ang Submit para mairehistro ang praktis na ticket.',
    ],
    highlightsEn: [
      '100% isolated simulation: Will NOT modify live Manila DEPW databases.',
      'Interactive form completeness checker guides you to 100% required details.',
      'Automatically checks for duplicate submissions along the same street.',
    ],
    highlightsFil: [
      'Ligtas na pagsasanay: Walang mababago sa totoong database ng Maynila.',
      'May gabay na nagsasabi kung may nakalimutan kang punan bago isumite.',
      'May awtomatikong pagsusuri kung may kaparehong hiling sa naturang kalye.',
    ],
    tipEn: 'Complete street descriptions (e.g., "cor. Velasquez St., beside Health Center") prevent lost crews.',
    tipFil: 'Ang detalyadong lokasyon (hal. "kanto ng Velasquez, tapat ng Health Center") ay nakakatulong sa mabilisang pagdating ng trak.',
  },
  {
    id: 9,
    interactiveType: 'update_practice',
    titleEn: 'Updating a Ticket & Reviewing History',
    titleFil: 'Pagpalit ng Katayuan at Pagsuri ng Kasaysayan',
    badgeEn: 'Lesson 9 of 12 • Practice Lifecycle',
    badgeFil: 'Aralin 9 ng 12 • Pagsulong ng Katayuan',
    summaryEn: 'Advance your practice ticket through the workflow stages and observe how the system generates an audit record for each transition.',
    summaryFil: 'Subukang iabante ang iyong praktis ticket at tingnan kung paano awtomatikong lumilikha ang system ng audit record sa bawat hakbang.',
    numberedInstructionsEn: [
      'Click the "Advance Practice Ticket" button to move from "For Verification" to "Pending Evaluation".',
      'Watch how the "What Should I Do Next?" helper automatically updates its guidance.',
      'Observe the simulated audit entry showing user role, timestamp, and field diff.',
    ],
    numberedInstructionsFil: [
      'Pindutin ang "Advance Practice Ticket" para iabante ang katayuan sa susunod na hakbang.',
      'Pansinin kung paano awtomatikong nagbabago ang payo ng "Ano ang Gagawin Ko Ngayon?".',
      'Tingnan ang nalikhang audit record na may oras, papel ng kawani, at pagbabago.',
    ],
    highlightsEn: [
      'Follows allowed transition rules: Cannot jump straight to Closed without intermediate steps.',
      'Shows the explainable rationale behind every required transition.',
      'Builds confidence before operating on real City of Manila requests.',
    ],
    highlightsFil: [
      'Sumusunod sa tamang patakaran: Hindi maaring laktawan ang mga gitnang hakbang.',
      'May malinaw na paliwanag kung bakit ito ang tamang susunod na aksyon.',
      'Nagbibigay ng kumpiyansa bago humawak ng totoong mga rekord sa opisina.',
    ],
    tipEn: 'If a ticket needs additional documentation, you can choose "Returned for Clarification" safely.',
    tipFil: 'Kung may kulang na papel, ligtas itong mapapalitan sa "Returned for Clarification".',
  },
  {
    id: 10,
    interactiveType: 'letter_template',
    titleEn: 'Official Letter & Transmittal Templates',
    titleFil: 'Opisyal na Liham at Format ng Transmittal',
    badgeEn: 'Lesson 10 of 12 • Documentation',
    badgeFil: 'Aralin 10 ng 12 • Mga Opisyal na Liham',
    summaryEn: 'DEPW Assist provides standard Tagalog and English transmittal letters, barangay resolutions, and engineering endorsement templates.',
    summaryFil: 'May nakahandang opisyal na format ng liham sa Tagalog at Ingles ang DEPW Assist para sa barangay endorsement at transmittal sa pamunuan.',
    numberedInstructionsEn: [
      'Preview the generated Barangay Declogging Request letter in formal Filipino.',
      'Notice the formal reference number (REF-BRGY-DEO-...), date, and recipient.',
      'Understand how formal documentation satisfies ARTA and COA audit requirements.',
    ],
    numberedInstructionsFil: [
      'Silipin ang awtomatikong nagagawang sulat sa magalang at pormal na Filipino.',
      'Pansinin ang opisyal na reference number, petsa, at mga lalagdaang bahagi.',
      'Unawain kung paano pinoprotektahan ng opisyal na liham ang rekord sa COA at ARTA.',
    ],
    highlightsEn: [
      'Includes formal transmittal body acknowledging debris accumulation.',
      'Formatted to match Manila City Hall inter-office correspondence norms.',
      'Easily printed or converted into PDF transmittals.',
    ],
    highlightsFil: [
      'May pormal na pananalita na humihiling ng pagsusuri at paglilinis.',
      'Umaayon sa pamantayan ng komunikasyon sa Manila City Hall.',
      'Madaling mai-print o maipasa bilang opisyal na kalakip ng dokumento.',
    ],
    tipEn: 'Standardized letters ensure that every barangay receives equal, prompt, and documented attention.',
    tipFil: 'Tinitiyak ng pare-parehong liham na patas at mabilis na naaasikaso ang bawat barangay.',
  },
  {
    id: 11,
    interactiveType: 'privacy_ethics',
    titleEn: 'Data Privacy, Ethics & Responsible AI',
    titleFil: 'Data Privacy (RA 10173), Etika at Responsableng AI',
    badgeEn: 'Lesson 11 of 12 • Privacy & AI',
    badgeFil: 'Aralin 11 ng 12 • Proteksyon sa Datos',
    summaryEn: 'Understand how citizen data is protected under RA 10173, and how AI features act solely as drafting assistants with mandatory human approval.',
    summaryFil: 'Alamin ang proteksyon sa impormasyon ng mamamayan sa ilalim ng RA 10173, at kung bakit ang AI ay tagatulong lamang at laging may pagsusuri ng tao bago magpadala.',
    numberedInstructionsEn: [
      'Data Privacy Act of 2012 (RA 10173): Citizen phone numbers and addresses are stored securely and never made public.',
      'Code of Conduct (RA 6713): Public officials must act on requests with promptness and integrity.',
      'Human-in-the-Loop AI: The AI drafting assistant only prepares suggestions; an authorized human officer MUST review and click Send.',
    ],
    numberedInstructionsFil: [
      'Data Privacy Act (RA 10173): Ang numero at personal na datos ng mamamayan ay ligtas at hindi isinasapubliko.',
      'Batas sa Etika (RA 6713): Mabilis, maagap, at may integridad na pagtugon sa bawat hiling ng tao.',
      'AI na May Pagsubaybay ng Tao: Ang AI ay nagbabalangkas lamang ng sulat; tao pa rin ang kailangang mag-apruba at magpadala.',
    ],
    highlightsEn: [
      'Zero automated approvals: Critical decisions remain strictly with civil engineers.',
      'Audit log tracks AI interactions to ensure accountable public service.',
      'Protects personal contact numbers from unauthorized disclosure.',
    ],
    highlightsFil: [
      'Walang awtomatikong desisyon ang makina: Tanging mga inhinyero lamang ang may kapangyarihang mag-apruba.',
      'May talaan sa audit log kung ginamit ang AI drafting assistant.',
      'Ligtas ang mga cellphone number laban sa pagsasamantala o spam.',
    ],
    tipEn: 'Always verify generated draft text before transmitting it to external barangay officials.',
    tipFil: 'Laging basahin at suriin ang nilalaman ng draft bago tuluyang ipadala sa barangay.',
  },
  {
    id: 12,
    interactiveType: 'completion',
    titleEn: 'Tutorial Complete & Workspace Entry',
    titleFil: 'Tapos Na ang Gabay! Handa Nang Magtrabaho',
    badgeEn: 'Lesson 12 of 12 • Ready to Operate',
    badgeFil: 'Aralin 12 ng 12 • Ganap na Handa',
    summaryEn: 'Congratulations! You have completed all 12 lessons of the DEPW Assist guide and are ready to manage barangay declogging operations.',
    summaryFil: 'Binabati kita! Natapos mo ang lahat ng 12 aralin sa DEPW Assist at handa ka nang maglingkod para sa Lungsod ng Maynila.',
    numberedInstructionsEn: [
      'Enter the live Command Center workspace.',
      'Remember you can replay this tutorial anytime using the "Step-by-Step Guide" button in the top bar.',
      'If you need larger text, simply toggle Easy Mode at the top right.',
    ],
    numberedInstructionsFil: [
      'Pumasok sa live Command Center workspace.',
      'Tandaan: Maaari mong muling panoorin ang gabay na ito anumang oras gamit ang "Step-by-Step Guide" button sa itaas.',
      'Kung nais ng mas malalaking letra, pindutin lamang ang Easy Mode button.',
    ],
    highlightsEn: [
      'You are equipped to handle intake, search, status transitions, and audit records.',
      'City of Manila DEPW standards are at your fingertips.',
      'Access help, maps, 3D culvert models, and lab tests whenever needed.',
    ],
    highlightsFil: [
      'Handa ka nang mag-encode, maghanap, magpalit ng katayuan, at sumuri ng audit log.',
      'Nasa iyong mga kamay ang mataas na pamantayan ng serbisyo sa Maynila.',
      'Buksan ang mapa, 3D culvert model, o lab test anumang oras.',
    ],
    tipEn: 'Thank you for serving the City of Manila with dedication, transparency, and technical excellence!',
    tipFil: 'Maraming salamat sa tapat at maagap na paglilingkod sa Mamamayan ng Maynila!',
  },
];

/**
 * Friendly Plain-Language "What Should I Do Next?" Guidance Generator
 */
export function getWhatShouldIDoNext(ticket, language = 'fil') {
  if (!ticket) {
    return {
      action: language === 'fil' ? 'Pumili muna ng ticket sa listahan.' : 'Select a ticket from the list.',
      detail: language === 'fil' ? 'Pindutin ang alinmang row sa Smart Tracker para makita ang detalye.' : 'Click any row in the Smart Tracker to inspect its status.',
      role: 'DEPW Staff',
    };
  }

  const status = ticket.status || 'For Verification';
  const street = ticket.streetAddress || 'sa kalsada';
  const brgy = ticket.barangay || 'sa barangay';

  const guides = {
    'For Verification': {
      en: {
        action: `Verify request documents for ${brgy}`,
        detail: `Check if the official letter from the Barangay is signed, the street address (${street}) is specific, and contact details are valid. If complete, advance to "Pending Evaluation". If lacking, click "Returned for Clarification".`,
        role: 'Intake Verifier',
      },
      fil: {
        action: `Suriin ang dokumento ng ${brgy}`,
        detail: `Tingnan kung may pirma ang liham mula sa Barangay, kung malinaw ang lokasyon sa ${street}, at kung may contact number. Kung kumpleto, iabante sa "Pending Evaluation". Kung may kulang, pindutin ang "Returned for Clarification".`,
        role: 'Tagasuri ng Dokumento',
      },
    },
    'Returned for Clarification': {
      en: {
        action: `Contact Barangay official for supplemental details`,
        detail: `Reach out to the coordinating official for ${brgy} to get the missing landmarks or signed letter. Once received, return status to "For Verification".`,
        role: 'Liaison Desk',
      },
      fil: {
        action: `Kontakin ang opisyal ng ${brgy}`,
        detail: `Tawagan ang Kagawad o Kapitan upang hingin ang kulang na detalye o karagdagang landmark. Kapag natanggap na, ibalik ang katayuan sa "For Verification".`,
        role: 'Liaison Desk',
      },
    },
    'Pending Evaluation': {
      en: {
        action: `Endorse to Engineering Evaluation Team`,
        detail: `Have the civil engineer review the drainage profile along ${street}. If an ocular visit is required to check silt depth or manhole access, set status to "Inspection Scheduled".`,
        role: 'Engineering Evaluator',
      },
      fil: {
        action: `Ipa-review sa Inhinyero ang drainage sa ${street}`,
        detail: `Ipa-evaluate sa engineer ang sukat ng tubo o imburnal. Kung kailangang puntahan sa mismong lugar, palitan ang status sa "Inspection Scheduled".`,
        role: 'Technical Evaluator',
      },
    },
    'Inspection Scheduled': {
      en: {
        action: `Conduct site assessment with Barangay Kagawad`,
        detail: `Field engineers must meet the barangay representative on-site. Measure silt depth, check for hazardous gases (H2S), and fill the checklist before endorsing to Operations.`,
        role: 'Field Inspection Team',
      },
      fil: {
        action: `Magtungo sa ${street} para sa aktwal na ocular inspection`,
        detail: `Puntahan ang kanto kasama ang barangay. Sukatin ang kapal ng putik, suriin ang kaligtasan sa gas bago buksan ang manhole, at lagyan ng tsek ang inspection checklist.`,
        role: 'Field Engineer',
      },
    },
    'Scheduled for Implementation': {
      en: {
        action: `Prepare equipment and crew for scheduled cleaning`,
        detail: `Confirm availability of the vacuum truck / jetter and coordinate with field crew for ${brgy}. Once the team arrives on-site, switch status to "In Progress".`,
        role: 'Operations Coordinator',
      },
      fil: {
        action: `Ihanda ang vacuum truck at tauhan para sa ${street}`,
        detail: `Siguraduhing handa ang kagamitan at abisuhan ang barangay sa araw ng pagdating. Pagdating ng crew sa lugar, pindutin ang "In Progress".`,
        role: 'Operations Unit',
      },
    },
    'In Progress': {
      en: {
        action: `Monitor declogging and post-clearing water flow`,
        detail: `Declogging crew is actively clearing silt and obstructions. Verify debris is safely loaded onto hauling dump trucks. When water flows freely, set status to "Completed".`,
        role: 'Field Supervisor',
      },
      fil: {
        action: `Subaybayan ang paglilinis at paghigop ng putik`,
        detail: `Kasalukuyang nagtatrabaho ang mga tauhan sa ${street}. Tiyaking nahahakot ang mga putik at basura. Kapag mabilis na ang daloy ng tubig, palitan sa "Completed".`,
        role: 'Field Supervisor',
      },
    },
    'Completed': {
      en: {
        action: `Secure Barangay signed acknowledgment receipt`,
        detail: `Take photos of the restored drainage line and have the Barangay Chairman or Kagawad sign the acknowledgment. Once verified, officially close the ticket.`,
        role: 'Records Officer',
      },
      fil: {
        action: `Humingi ng pirma ng pasasalamat mula sa ${brgy}`,
        detail: `Kumuha ng patunay na litrato na malinis na ang kanal sa ${street}. Papirmahan ang resibo sa Barangay bago tuluyang pindutin ang "Closed".`,
        role: 'Tagapamahala ng Rekord',
      },
    },
    'Closed': {
      en: {
        action: `Record is complete and archived`,
        detail: `All operations and acknowledgments for ${brgy} (${street}) have been fulfilled. The complete audit log is securely archived. No further action needed.`,
        role: 'DEPW Records',
      },
      fil: {
        action: `Tapos na ang trabaho at ligtas na naka-archive`,
        detail: `Ganap nang natapos ang paglilinis sa ${street}. Naka-save ang kumpletong kasaysayan ng ticket. Wala nang kailangang gawin.`,
        role: 'DEPW Records',
      },
    },
  };

  const entry = guides[status] || guides['For Verification'];
  return language === 'fil' ? entry.fil : entry.en;
}

/**
 * Curated DEPW Manila Drainage Spatial Context Dataset
 * Used as reliable offline reconnaissance fallback when live Google Maps API encounters quota (429) or offline states.
 */
export function getManilaSpatialDrainageContext(query = '') {
  const q = String(query).toLowerCase();

  const curatedEntries = [
    {
      keywords: ['españa', 'sampaloc', 'maceda', 'antipolo', 'ust'],
      summary: `[DEPW Manila GIS Reconnaissance • Sampaloc District / 4th Legislative District]\n• Primary Arterial Drainage: España Boulevard Lateral Box Culvert System discharging eastward toward Estero de Valencia and Estero de Alix.\n• Known Flood Vulnerability: High vulnerability during intense convective rainfall compounded by high-tide backup from the Pasig River.\n• Nearby DEPW/MMDA Facilities: Valencia Pumping Station, Sulucan Interceptor Canal, and UST Retention Basin.\n• Field Advisory: Ensure manholes along Maceda St. and Blumentritt Rd. are inspected for heavy commercial silt and construction debris accumulation.`,
      places: [
        { title: 'Valencia Pumping Station (Sampaloc)', uri: 'https://maps.google.com/?q=Valencia+Pumping+Station+Manila' },
        { title: 'Estero de Alix Waterway (Sampaloc)', uri: 'https://maps.google.com/?q=Estero+de+Alix+Manila' },
        { title: 'España Blvd cor. Maceda St Drainage Junction', uri: 'https://maps.google.com/?q=Espana+Blvd+Maceda+Manila' },
      ],
    },
    {
      keywords: ['tondo', 'vitas', 'velasquez', 'moriones', 'gagalangin'],
      summary: `[DEPW Manila GIS Reconnaissance • Tondo District / 1st & 2nd Legislative Districts]\n• Primary Arterial Drainage: Estero de Vitas and Estero de Sunog Apog trunk drainage corridors discharging directly into Manila Bay.\n• Known Flood Vulnerability: Coastal tidal inundation and dense residential sediment accumulation along service roads.\n• Nearby DEPW/MMDA Facilities: Vitas Pumping Station, Binondo-San Nicolas Outfall, and Moriones Siphon.\n• Field Advisory: Deploy heavy vacuum trucks for deep silt removal in trunk culverts; monitor tidal schedules prior to opening sluice gates.`,
      places: [
        { title: 'Vitas Pumping Station (Tondo)', uri: 'https://maps.google.com/?q=Vitas+Pumping+Station+Tondo+Manila' },
        { title: 'Estero de Vitas Outfall (Tondo)', uri: 'https://maps.google.com/?q=Estero+de+Vitas+Manila' },
        { title: 'Moriones St Trunk Storm Line', uri: 'https://maps.google.com/?q=Moriones+Street+Tondo+Manila' },
      ],
    },
    {
      keywords: ['quiapo', 'binondo', 'hidalgo', 'ongpin', 'carriedo', 'quinta'],
      summary: `[DEPW Manila GIS Reconnaissance • Quiapo & Binondo / 3rd Legislative District]\n• Primary Arterial Drainage: Estero de Quiapo, Estero de Binondo, and Estero de la Reina interconnected network discharging to Pasig River.\n• Known Flood Vulnerability: Commercial market grease and solid waste entrapment; low elevation relative to high water spring tide.\n• Nearby DEPW/MMDA Facilities: Quiapo Pumping Station (Carlos Palanca St), Binondo Pumping Station, and Quinta Market Interceptor.\n• Field Advisory: High-pressure water jetting recommended to clear hardened grease deposits in underground conduit laterals.`,
      places: [
        { title: 'Quiapo Pumping Station (Carlos Palanca)', uri: 'https://maps.google.com/?q=Quiapo+Pumping+Station+Manila' },
        { title: 'Estero de Binondo Tidal Canal', uri: 'https://maps.google.com/?q=Estero+de+Binondo+Manila' },
        { title: 'Quinta Market Drainage Interceptor', uri: 'https://maps.google.com/?q=Quinta+Market+Quiapo+Manila' },
      ],
    },
    {
      keywords: ['paco', 'pandacan', 'santa ana', 'san miguel', 'malacañang'],
      summary: `[DEPW Manila GIS Reconnaissance • Paco, Pandacan & San Miguel / 5th & 6th Districts]\n• Primary Arterial Drainage: Estero de Paco linear rehabilitation corridor, Estero de Pandacan, and Estero de San Miguel.\n• Known Flood Vulnerability: Overflow from upstream San Juan River junction and local gutter siltation.\n• Nearby DEPW/MMDA Facilities: Paco Pumping Station, Pandacan Siphon, and San Miguel Flood Control Gates.\n• Field Advisory: Verify bio-retention filtration along linear park sections; inspect interceptor connections for free gravity discharge.`,
      places: [
        { title: 'Paco Pumping Station & Linear Park', uri: 'https://maps.google.com/?q=Paco+Pumping+Station+Manila' },
        { title: 'Estero de San Miguel (Near Malacañang)', uri: 'https://maps.google.com/?q=Estero+de+San+Miguel+Manila' },
        { title: 'Pandacan Storm Conduit Outfall', uri: 'https://maps.google.com/?q=Pandacan+Manila+Drainage' },
      ],
    },
  ];

  for (const entry of curatedEntries) {
    if (entry.keywords.some(k => q.includes(k))) {
      return entry;
    }
  }

  // General Manila Drainage Baseline
  return {
    summary: `[DEPW Manila GIS Reconnaissance • General City of Manila Drainage System]\n• Network Architecture: 16 recognized districts connected through 33 esteros, 12 major box culvert corridors, and 17 pumping stations draining into the Pasig River and Manila Bay.\n• Seasonal Monitoring: Monitored during Habagat (Southwest Monsoon) and typhoon season with coordinated sluice gate operations.\n• Operational Recommendation: Check nearest estero outfall elevation, inspect manhole covers for structural integrity, and coordinate with barangay desk for localized debris clearance.`,
    places: [
      { title: 'City of Manila DEPW Central Operations Base', uri: 'https://maps.google.com/?q=Manila+City+Hall+DEPW' },
      { title: 'Estero de Vitas Regional Outfall', uri: 'https://maps.google.com/?q=Estero+de+Vitas+Manila' },
      { title: 'Valencia Flood Control & Pumping Station', uri: 'https://maps.google.com/?q=Valencia+Pumping+Station+Manila' },
    ],
  };
}



