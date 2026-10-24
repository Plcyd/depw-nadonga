import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionStatus,
  getExplainableNextStep,
  evaluateRequestCompleteness,
  computeTicketAuditDiff,
  findPotentialDuplicates,
  calculateDashboardMetrics,
  escapeCsvCell,
  ticketsToCsv,
  MANILA_16_DISTRICTS,
  LEGISLATIVE_DISTRICTS,
  APP_THEMES,
  evaluateWaterDrainageSafety,
  FLOWCHART_STAGES,
  TUTORIAL_LESSONS,
  getWhatShouldIDoNext,
  getManilaSpatialDrainageContext,
} from './workflowRules.js';

test('Manila districts, legislative districts, and themes (including 3 distinct light themes) match specification', () => {
  assert.equal(LEGISLATIVE_DISTRICTS.length, 6);
  assert.equal(MANILA_16_DISTRICTS.length, 16);
  assert.equal(APP_THEMES.length, 7);
  const lightThemes = APP_THEMES.filter((t) => t.isLight);
  assert.equal(lightThemes.length, 3);
  const themeIds = APP_THEMES.map((t) => t.id);
  assert.ok(themeIds.includes('navy-glass'));
  assert.ok(themeIds.includes('daylight-civic'));
  assert.ok(themeIds.includes('light-sky'));
  assert.ok(themeIds.includes('light-emerald'));

  const names = MANILA_16_DISTRICTS.map((d) => d.name);
  assert.ok(names.includes('Binondo'));
  assert.ok(names.includes('Tondo'));
  assert.ok(names.includes('Sampaloc'));
  assert.ok(names.includes('Intramuros'));
});

test('flowchart stages, tutorial lessons, and next action helper provide bilingual guidance', () => {
  assert.equal(FLOWCHART_STAGES.length, 8);
  assert.equal(FLOWCHART_STAGES[0].code, 'INTAKE');
  assert.equal(FLOWCHART_STAGES[7].code, 'CLOSE');

  assert.equal(TUTORIAL_LESSONS.length, 12);
  assert.ok(TUTORIAL_LESSONS[0].titleFil.length > 5);
  assert.ok(TUTORIAL_LESSONS[0].titleEn.length > 5);

  const guideFil = getWhatShouldIDoNext({ status: 'For Verification', barangay: 'Barangay 123', streetAddress: 'Velasquez St' }, 'fil');
  assert.ok(guideFil.action.includes('Suriin'));
  const guideEn = getWhatShouldIDoNext({ status: 'For Verification', barangay: 'Barangay 123', streetAddress: 'Velasquez St' }, 'en');
  assert.ok(guideEn.action.includes('Verify'));

  const sampalocContext = getManilaSpatialDrainageContext('España Boulevard, Sampaloc, Manila');
  assert.ok(sampalocContext.summary.includes('Sampaloc'));
  assert.ok(sampalocContext.places.length > 0);
});

test('status transition validation enforces allowed transitions and locks Closed', () => {
  assert.equal(canTransitionStatus('For Verification', 'Pending Evaluation'), true);
  assert.equal(canTransitionStatus('For Verification', 'Closed'), false);
  assert.equal(canTransitionStatus('Closed', 'In Progress'), false);
  assert.equal(canTransitionStatus('Completed', 'Closed'), true);
});

test('explainable next step returns rationale and valid target status', () => {
  const step = getExplainableNextStep('Pending Evaluation');
  assert.equal(step.suggestedNextStatus, 'Inspection Scheduled');
  assert.ok(step.rationale.length > 10);
});

test('request completeness assistant detects missing and complete fields', () => {
  const incomplete = evaluateRequestCompleteness({ barangay: 'Barangay 123, Zone 10' });
  assert.equal(incomplete.isComplete, false);
  assert.ok(incomplete.score < 100);

  const complete = evaluateRequestCompleteness({
    barangay: 'Barangay 123, Zone 10',
    district: 'Tondo',
    streetAddress: 'Estero de Vitas Service Road',
    requesterName: 'Juan D. Cruz',
    description: 'Accumulated silt and debris obstructing storm drain flow.',
    latitude: 14.6195,
    longitude: 120.9678,
  });
  assert.equal(complete.isComplete, true);
  assert.equal(complete.score, 100);
});

test('computeTicketAuditDiff accurately detects status transitions, field edits, and checklist updates', () => {
  const before = {
    status: 'For Verification',
    priority: 'Routine',
    streetAddress: 'Old Street',
    inspectionChecklistJson: JSON.stringify([{ item: 'Check 1', done: false }]),
  };
  const afterEdit = {
    status: 'For Verification',
    priority: 'High Priority',
    streetAddress: 'España Blvd cor. Maceda St.',
    inspectionChecklistJson: JSON.stringify([{ item: 'Check 1', done: false }]),
  };
  const diffEdit = computeTicketAuditDiff(before, afterEdit);
  assert.equal(diffEdit.eventType, 'FIELD_EDIT');
  assert.equal(diffEdit.changes.length, 2);

  const afterStatus = {
    ...before,
    status: 'Pending Evaluation',
  };
  const diffStatus = computeTicketAuditDiff(before, afterStatus);
  assert.equal(diffStatus.eventType, 'STATUS_TRANSITION');
  assert.equal(diffStatus.changes[0].before, 'For Verification');
  assert.equal(diffStatus.changes[0].after, 'Pending Evaluation');
});

test('duplicate detection flags matching barangay and requestType', () => {
  const existing = [
    {
      ticketId: 'DEO-2026-001',
      barangay: 'Barangay 123, Zone 10',
      streetAddress: 'Estero de Vitas Service Road',
      requestType: 'Declogging',
      status: 'Pending Evaluation',
    },
  ];
  const dupes = findPotentialDuplicates(
    {
      barangay: 'Barangay 123, Zone 10',
      streetAddress: 'Other Corner',
      requestType: 'Declogging',
    },
    existing
  );
  assert.equal(dupes.length, 1);
  assert.equal(dupes[0].ticketId, 'DEO-2026-001');
});

test('dashboard metrics accurately aggregate dataset', () => {
  const sample = [
    { status: 'Pending Evaluation', requestType: 'Declogging', district: 'Tondo' },
    { status: 'For Verification', requestType: 'Declogging', district: 'Sampaloc' },
    { status: 'Inspection Scheduled', requestType: 'Declogging', district: 'Ermita' },
    { status: 'Completed', requestType: 'Desilting', district: 'Tondo' },
  ];
  const metrics = calculateDashboardMetrics(sample);
  assert.equal(metrics.totalRequests, 4);
  assert.equal(metrics.pendingVerification, 1);
  assert.equal(metrics.pendingEvaluation, 1);
  assert.equal(metrics.inspectionScheduled, 1);
  assert.equal(metrics.completedRequests, 1);
  assert.equal(metrics.byDistrict.Tondo, 2);
});

test('CSV export escapes special characters and formula prefixes', () => {
  assert.equal(escapeCsvCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
  assert.equal(escapeCsvCell('Brgy 123, "Zone 1"'), '"Brgy 123, ""Zone 1"""');
  const csv = ticketsToCsv([
    {
      dateReceived: '10/20/2026',
      ticketId: 'DEO-2026-001',
      barangay: 'Barangay 123, Zone 10',
      district: 'Tondo',
      legislativeDistrict: '1st District',
      streetAddress: 'Estero de Vitas Service Road',
      requestType: 'Declogging',
      status: 'Pending Evaluation',
      priority: 'Elevated',
      actionTaken: 'Endorsed to DEO',
      nextStep: 'Awaiting review',
      requesterName: 'Juan D. Cruz',
      latitude: 14.6195,
      longitude: 120.9678,
    },
  ]);
  assert.ok(csv.includes('DEO-2026-001'));
  assert.ok(csv.includes('Barangay 123, Zone 10'));
});

test('evaluateWaterDrainageSafety flags NORMAL, WARNING, and CRITICAL thresholds with visual status', () => {
  const normalReadings = {
    h2sPpm: 2.1,
    dissolvedOxygen: 6.4,
    turbidityNtu: 28,
    ammoniaMgL: 1.2,
    flowIndex: 92,
  };
  const normalResult = evaluateWaterDrainageSafety(normalReadings);
  assert.equal(normalResult.overallStatus, 'NORMAL');
  assert.equal(normalResult.criticalCount, 0);
  assert.equal(normalResult.warningCount, 0);

  const warnReadings = {
    h2sPpm: 6.5, // > 5.0 warn
    dissolvedOxygen: 6.0,
    turbidityNtu: 30,
    ammoniaMgL: 1.0,
    flowIndex: 85,
  };
  const warnResult = evaluateWaterDrainageSafety(warnReadings);
  assert.equal(warnResult.overallStatus, 'WARNING');
  assert.equal(warnResult.warningCount, 1);
  assert.equal(warnResult.criticalCount, 0);
  assert.equal(warnResult.breaches[0].key, 'h2sPpm');

  const critReadings = {
    h2sPpm: 12.4, // >= 10.0 crit
    dissolvedOxygen: 2.1, // <= 3.0 crit
    turbidityNtu: 88, // >= 80 crit
    ammoniaMgL: 3.8, // >= 3.0 crit
    flowIndex: 35, // <= 50 crit
  };
  const critResult = evaluateWaterDrainageSafety(critReadings);
  assert.equal(critResult.overallStatus, 'CRITICAL');
  assert.equal(critResult.criticalCount, 5);
});


