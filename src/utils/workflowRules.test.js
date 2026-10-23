import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionStatus,
  getExplainableNextStep,
  evaluateRequestCompleteness,
  findPotentialDuplicates,
  calculateDashboardMetrics,
  escapeCsvCell,
  ticketsToCsv,
  MANILA_16_DISTRICTS,
  LEGISLATIVE_DISTRICTS,
} from './workflowRules.js';

test('Manila districts and legislative districts match specification', () => {
  assert.equal(LEGISLATIVE_DISTRICTS.length, 6);
  assert.equal(MANILA_16_DISTRICTS.length, 16);
  const names = MANILA_16_DISTRICTS.map((d) => d.name);
  assert.ok(names.includes('Binondo'));
  assert.ok(names.includes('Tondo'));
  assert.ok(names.includes('Sampaloc'));
  assert.ok(names.includes('Intramuros'));
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
  const incomplete = evaluateRequestCompleteness({ barangay: 'Brgy 123 SAMPLE' });
  assert.equal(incomplete.isComplete, false);
  assert.ok(incomplete.score < 100);

  const complete = evaluateRequestCompleteness({
    barangay: 'Brgy 123 SAMPLE',
    district: 'Tondo',
    streetAddress: 'Sample Street near Estero',
    requesterName: 'Juan D. Cruz',
    description: 'Accumulated silt and debris obstructing storm drain flow.',
    latitude: 14.6195,
    longitude: 120.9678,
  });
  assert.equal(complete.isComplete, true);
  assert.equal(complete.score, 100);
});

test('duplicate detection flags matching barangay and requestType', () => {
  const existing = [
    {
      ticketId: 'DEO-2026-001',
      barangay: 'Brgy 123 SAMPLE',
      streetAddress: 'Sample Street',
      requestType: 'Declogging',
      status: 'Pending Evaluation',
    },
  ];
  const dupes = findPotentialDuplicates(
    {
      barangay: 'Brgy 123 SAMPLE',
      streetAddress: 'Other Corner',
      requestType: 'Declogging',
    },
    existing
  );
  assert.equal(dupes.length, 1);
  assert.equal(dupes[0].ticketId, 'DEO-2026-001');
});

test('dashboard metrics accurately aggregate sample dataset', () => {
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
      barangay: 'Brgy 123 SAMPLE',
      district: 'Tondo',
      legislativeDistrict: '1st District',
      streetAddress: 'Sample Street',
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
  assert.ok(csv.includes('Brgy 123 SAMPLE'));
});
