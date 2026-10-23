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

export function evaluateRequestCompleteness(input = {}) {
  const checks = [
    {
      id: 'barangay',
      label: 'Barangay Name (e.g., Brgy 123 SAMPLE)',
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
      label: 'Coordinating Barangay Official (Fictional Name & Role)',
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
  const barangay = ticket.barangay || 'Barangay 123 SAMPLE';
  const requesterName = ticket.requesterName || ticket.kagawad || 'Juan D. Cruz';
  const requesterRole = ticket.requesterRole || 'Barangay Kagawad — DUMMY NAME';
  const streetAddress = ticket.streetAddress || ticket.street || 'Sample Street';
  const requestType = ticket.requestType || ticket.drainageType || 'Declogging';
  const refNo = ticket.ticketId || 'DEO-2026-001';

  return {
    referenceNo: `REF-BRGY-${refNo}`,
    date,
    to: 'Department of Engineering Office',
    from: barangay,
    through: `${requesterName}, ${requesterRole}`,
    subject: `Request for Drainage ${requestType} at ${streetAddress}`,
    bodyTagalog:
      'Magalang po kaming humihiling ng tulong mula sa Department of Engineering Office para sa pagsasagawa ng declogging sa isang bahagi ng drainage sa aming barangay. Napansin po ang pag-ipon ng putik at iba pang debris na maaaring makaapekto sa maayos na daloy ng tubig. Hinihiling po namin ang inyong pagsusuri at koordinasyon para sa posibleng iskedyul ng operasyon. Maraming salamat po.',
    disclaimer:
      'DUMMY TEMPLATE • TRAINING DEMONSTRATION ONLY. This generated text is not an official government document and requires human review.',
  };
}

export const MANILA_DISTRICTS = MANILA_16_DISTRICTS;
export const DRAINAGE_TYPES = REQUEST_TYPES;
export const evaluateTicketCompleteness = evaluateRequestCompleteness;

