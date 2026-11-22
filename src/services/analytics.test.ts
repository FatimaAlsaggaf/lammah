import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DEMO_DATABASE } from '../data/seed';
import {
  analyzeInterestAndUnmetNeeds,
  calculateMemberPoints,
  computeAdminMetrics,
  getMemberBadgeTier,
  isRenewalEvaluationDue,
  recommendOpportunitiesForMember,
} from './analytics';
import {
  approveAndPublishProposalAsOpportunity,
  confirmRegistrationAttendance,
  registerMemberForOpportunity,
  saveMemberOnboardingAndGoals,
} from './repository';
import { executeLammahTool } from './agentTools';

test('member points and badge tier progress calculate accurately', () => {
  const db = structuredClone(INITIAL_DEMO_DATABASE);
  const saraPoints = calculateMemberPoints(db.pointsTransactions, 'mem-1');
  assert.equal(saraPoints, 25); // 20 event_attendance + 5 post_event_feedback

  const tier = getMemberBadgeTier(saraPoints);
  assert.equal(tier.level, 2);
  assert.equal(tier.title, 'مشارك فاعل');
  assert.equal(tier.nextTierPoints, 60);
  assert.equal(tier.pointsRemaining, 35);
});

test('registration alone does NOT award points; admin attendance verification awards once without duplicates', () => {
  let db = structuredClone(INITIAL_DEMO_DATABASE);
  const pointsBefore = calculateMemberPoints(db.pointsTransactions, 'mem-1');

  const regResult = registerMemberForOpportunity(db, 'mem-1', 'opp-2', 'portal');
  assert.equal(regResult.created, true);
  db = regResult.db;

  // Points must remain unchanged after registration only
  assert.equal(calculateMemberPoints(db.pointsTransactions, 'mem-1'), pointsBefore);

  const newReg = db.registrations.find(
    (r) => r.memberId === 'mem-1' && r.opportunityId === 'opp-2' && r.status === 'registered'
  );
  assert.ok(newReg);

  // Admin confirms attendance -> awards +20 points
  const firstVerify = confirmRegistrationAttendance(db, newReg.id);
  assert.equal(firstVerify.alreadyVerified, false);
  assert.equal(firstVerify.pointsAwarded, 20);
  db = firstVerify.db;
  assert.equal(calculateMemberPoints(db.pointsTransactions, 'mem-1'), pointsBefore + 20);

  // Second confirmation attempt must NOT award duplicate points
  const secondVerify = confirmRegistrationAttendance(db, newReg.id);
  assert.equal(secondVerify.alreadyVerified, true);
  assert.equal(secondVerify.pointsAwarded, 0);
  assert.equal(calculateMemberPoints(secondVerify.db.pointsTransactions, 'mem-1'), pointsBefore + 20);
});

test('unmet needs analyzer detects AI in CX gap and resolves it once admin publishes approved proposal', () => {
  let db = structuredClone(INITIAL_DEMO_DATABASE);
  const initialClusters = analyzeInterestAndUnmetNeeds(db);
  const aiGap = initialClusters.find((c) => c.topic === 'الذكاء الاصطناعي في تجربة العميل');

  assert.ok(aiGap, 'Expected AI in CX topic cluster in seed data');
  assert.equal(aiGap.isUnmetGap, true);
  assert.ok(aiGap.memberCount >= 5);
  assert.equal(aiGap.matchingPublishedOpportunities, 0);

  // Agent creates a real proposal via tool execution
  const createOutcome = executeLammahTool(
    'createInitiativeProposal',
    {
      title: 'ورشة تطبيقات الذكاء الاصطناعي في تجربة العميل',
      shortDescription: 'تطبيق عملي لأدوات الذكاء الاصطناعي في تحليل صوت العميل وتصميم الرحلات.',
      suggestedTopicKey: 'الذكاء الاصطناعي في تجربة العميل',
      targetAudience: 'ممارسو تجربة العميل وأبحاث المستخدمين',
      objectives: ['تحليل صوت العميل بالذكاء الاصطناعي', 'بناء حالات استخدام مسؤولة'],
    },
    { db, activeMemberId: 'mem-1', actorRole: 'member' }
  );
  assert.equal(createOutcome.result.created, true);
  db = createOutcome.updatedDb;

  const createdProposal = db.initiativeProposals.find(
    (p) => p.suggestedTopicKey === 'الذكاء الاصطناعي في تجربة العميل'
  );
  assert.ok(createdProposal);
  assert.equal(createdProposal.status, 'new');
  assert.equal(createdProposal.interestedMemberCount, aiGap.memberCount);

  // Admin reviews, approves, and publishes the proposal with event details
  const publishRes = approveAndPublishProposalAsOpportunity(db, createdProposal.id, {
    title: createdProposal.title,
    shortDescription: createdProposal.shortDescription,
    category: 'ورشة عمل',
    date: '2026-12-28',
    time: '06:30 مساءً — 09:00 مساءً',
    location: 'الرياض — حضور مباشر وبث رقمي',
    attendanceMode: 'هجين',
    capacity: 50,
  });
  assert.ok(publishRes.opportunity);
  db = publishRes.db;

  // Now the gap should be resolved and recommended to Sara
  const afterClusters = analyzeInterestAndUnmetNeeds(db);
  const aiClusterAfter = afterClusters.find((c) => c.topic === 'الذكاء الاصطناعي في تجربة العميل');
  assert.ok(aiClusterAfter);
  assert.equal(aiClusterAfter.isUnmetGap, false);
  assert.equal(aiClusterAfter.matchingPublishedOpportunities, 1);

  const recs = recommendOpportunitiesForMember(db, 'mem-1', 6);
  assert.ok(recs.some((r) => r.opportunity.id === publishRes.opportunity!.id));
});

test('requestEventRegistration prepares pending confirmation without executing registration prematurely', () => {
  const db = structuredClone(INITIAL_DEMO_DATABASE);
  const beforeRegCount = db.registrations.length;

  const outcome = executeLammahTool(
    'requestEventRegistration',
    { memberId: 'mem-1', opportunityId: 'opp-2', reason: 'تدعم هدف التواصل المهني' },
    { db, activeMemberId: 'mem-1', actorRole: 'member' }
  );

  assert.equal(outcome.result.status, 'awaiting_member_confirmation');
  assert.equal(outcome.result.executed, false);
  assert.ok(outcome.pendingAction);
  assert.equal(outcome.pendingAction.opportunityId, 'opp-2');
  // Registration list must NOT have mutated before explicit confirmation
  assert.equal(outcome.updatedDb.registrations.length, beforeRegCount);
});

test('admin metrics compute dynamically from live data and renewal due window respects settings', () => {
  let db = structuredClone(INITIAL_DEMO_DATABASE);
  const metrics = computeAdminMetrics(db);
  assert.equal(metrics.totalMembers, 10);
  assert.equal(metrics.publishedOpportunitiesCount, 12);
  assert.ok(metrics.unmetNeedsCount >= 2);

  // Sara's renewalDate is 2026-12-05; testing with reference date 2026-11-21 (14 days left)
  const sara = db.members.find((m) => m.id === 'mem-1')!;
  const refNow = new Date('2026-11-21T12:00:00Z');
  assert.equal(isRenewalEvaluationDue(sara, 30, refNow), true);
  assert.equal(isRenewalEvaluationDue(sara, 7, refNow), false);

  // Onboarding updates goals and interests cleanly
  db = saveMemberOnboardingAndGoals(
    db,
    'mem-1',
    ['professional_skills', 'custom'],
    'تعلم تطبيقات الذكاء الاصطناعي في تجربة العميل',
    ['الذكاء الاصطناعي في تجربة العميل']
  );
  const updatedSara = db.members.find((m) => m.id === 'mem-1')!;
  assert.equal(updatedSara.onboardingCompleted, true);
});
