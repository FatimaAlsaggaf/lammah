import type {
  AttendanceRecord,
  LammahDatabase,
  Member,
  Opportunity,
  PointsRuleKey,
  PointsTransaction,
} from '../types/domain';

export interface MemberBadgeTier {
  level: number;
  title: string;
  minPoints: number;
  nextTierPoints: number | null;
  progressToNextPercent: number;
  pointsRemaining: number;
}

export const BADGE_TIERS = [
  { level: 1, title: 'عضو مستكشف', minPoints: 0 },
  { level: 2, title: 'مشارك فاعل', minPoints: 25 },
  { level: 3, title: 'سفير تجربة العميل', minPoints: 60 },
  { level: 4, title: 'قائد أثر مجتمعي', minPoints: 110 },
];

export function calculateMemberPoints(
  transactions: PointsTransaction[],
  memberId: string
): number {
  return transactions
    .filter((tx) => tx.memberId === memberId)
    .reduce((sum, tx) => sum + tx.points, 0);
}

export function getMemberBadgeTier(points: number): MemberBadgeTier {
  let current = BADGE_TIERS[0];
  let next: (typeof BADGE_TIERS)[number] | null = BADGE_TIERS[1];

  for (let i = 0; i < BADGE_TIERS.length; i++) {
    if (points >= BADGE_TIERS[i].minPoints) {
      current = BADGE_TIERS[i];
      next = BADGE_TIERS[i + 1] ?? null;
    }
  }

  if (!next) {
    return {
      level: current.level,
      title: current.title,
      minPoints: current.minPoints,
      nextTierPoints: null,
      progressToNextPercent: 100,
      pointsRemaining: 0,
    };
  }

  const span = next.minPoints - current.minPoints;
  const gained = Math.max(0, points - current.minPoints);
  const progressToNextPercent = Math.min(100, Math.round((gained / span) * 100));

  return {
    level: current.level,
    title: current.title,
    minPoints: current.minPoints,
    nextTierPoints: next.minPoints,
    progressToNextPercent,
    pointsRemaining: Math.max(0, next.minPoints - points),
  };
}

/**
 * Prevents duplicate point awards for the exact same member + ruleKey + activityRefId.
 */
export function hasDuplicatePointsTransaction(
  transactions: PointsTransaction[],
  memberId: string,
  ruleKey: PointsRuleKey,
  activityRefId: string
): boolean {
  return transactions.some(
    (tx) =>
      tx.memberId === memberId &&
      tx.ruleKey === ruleKey &&
      tx.activityRefId === activityRefId
  );
}

export interface OpportunityRecommendation {
  opportunity: Opportunity;
  matchScore: number;
  reasons: string[];
  isRegistered: boolean;
  isAttendanceVerified: boolean;
}

export function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractMemberInterestTokens(db: LammahDatabase, memberId: string): string[] {
  const member = db.members.find((m) => m.id === memberId);
  const goals = db.memberGoals.filter((g) => g.memberId === memberId);

  const rawPhrases: string[] = [];
  if (member) {
    rawPhrases.push(...member.interests);
  }
  for (const goal of goals) {
    rawPhrases.push(goal.title);
    if (goal.customDescription) rawPhrases.push(goal.customDescription);
    rawPhrases.push(...goal.topics);
  }

  return Array.from(new Set(rawPhrases.filter(Boolean)));
}

export function recommendOpportunitiesForMember(
  db: LammahDatabase,
  memberId: string,
  limit = 6
): OpportunityRecommendation[] {
  const member = db.members.find((m) => m.id === memberId);
  const goals = db.memberGoals.filter((g) => g.memberId === memberId);
  const memberRegistrations = db.registrations.filter(
    (r) => r.memberId === memberId && r.status === 'registered'
  );
  const verifiedAttendance = db.attendanceRecords.filter(
    (a) => a.memberId === memberId && a.verified
  );

  const memberTopics = new Set<string>([
    ...(member?.interests ?? []),
    ...goals.flatMap((g) => g.topics),
  ]);
  const goalCategories = new Set(goals.map((g) => g.category));
  const freeTextNorm = normalizeArabic(
    goals.map((g) => `${g.title} ${g.customDescription ?? ''}`).join(' ')
  );

  const published = db.opportunities.filter((opp) => opp.status === 'published');

  const scored: OpportunityRecommendation[] = published.map((opp) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Direct topic tag match
    const matchedTags = opp.tags.filter((tag) => {
      for (const topic of memberTopics) {
        if (
          normalizeArabic(topic) === normalizeArabic(tag) ||
          normalizeArabic(topic).includes(normalizeArabic(tag)) ||
          normalizeArabic(tag).includes(normalizeArabic(topic))
        ) {
          return true;
        }
      }
      return false;
    });

    if (matchedTags.length > 0) {
      score += matchedTags.length * 35;
      reasons.push(`تتوافق مع اهتمامك بمجال "${matchedTags[0]}"`);
    }

    // 2. Goal category alignment
    if (goalCategories.has('volunteering') && opp.category === 'تطوع مهني') {
      score += 30;
      reasons.push('تدعم هدفك في الحصول على فرص تطوع مهني');
    }
    if (goalCategories.has('networking') && (opp.category === 'تواصل مهني' || opp.category === 'لقاء حواري')) {
      score += 25;
      reasons.push('تساعدك في توسيع شبكة علاقاتك المهنية');
    }
    if (goalCategories.has('professional_skills') && opp.category === 'ورشة عمل') {
      score += 20;
      reasons.push('ورشة تطبيقية تدعم تطوير مهاراتك المهنية');
    }
    if (goalCategories.has('career_opportunities') && (opp.category === 'فرصة مهنية' || opp.category === 'إرشاد وتطوير')) {
      score += 28;
      reasons.push('ترتبط مباشرة بهدفك في اكتشاف فرص وتطوير مسارك المهني');
    }
    if (goalCategories.has('knowledge_sharing') && opp.category === 'إرشاد وتطوير') {
      score += 25;
      reasons.push('تتيح لك مشاركة خبرتك ومعرفتك مع مجتمع الجمعية');
    }

    // 3. Free-text keyword match against title/description
    const oppTextNorm = normalizeArabic(`${opp.title} ${opp.shortDescription} ${opp.tags.join(' ')}`);
    const keywords = [
      { kw: 'ذكاء اصطناعي', label: 'الذكاء الاصطناعي في تجربة العميل' },
      { kw: 'صحي', label: 'تجربة العميل في القطاع الصحي' },
      { kw: 'رحله', label: 'تصميم رحلة العميل' },
      { kw: 'موشرات', label: 'مؤشرات القياس' },
      { kw: 'صوت العميل', label: 'صوت العميل' },
      { kw: 'تطوع', label: 'التطوع المهني' },
    ];
    for (const item of keywords) {
      if (freeTextNorm.includes(item.kw) && oppTextNorm.includes(item.kw)) {
        score += 35;
        const reasonStr = `تغطي مباشرة موضوع "${item.label}" المذكور في أهدافك`;
        if (!reasons.includes(reasonStr)) reasons.push(reasonStr);
      }
    }

    // 4. City or remote convenience bonus
    if (member && (opp.attendanceMode === 'عن بُعد' || opp.attendanceMode === 'هجين' || opp.location.includes(member.city))) {
      score += 10;
      if (opp.attendanceMode === 'عن بُعد') {
        reasons.push('متاحة عن بُعد بمرونة كاملة');
      } else if (opp.location.includes(member.city)) {
        reasons.push(`متاحة في مدينتك (${member.city})`);
      }
    }

    if (reasons.length === 0) {
      reasons.push(`فرصة متاحة ضمن مسار ${opp.category} لمجتمع تجربة العميل`);
      score = 10;
    }

    const isRegistered = memberRegistrations.some((r) => r.opportunityId === opp.id);
    const isAttendanceVerified = verifiedAttendance.some((a) => a.opportunityId === opp.id);

    return {
      opportunity: opp,
      matchScore: Math.min(100, score),
      reasons: reasons.slice(0, 2),
      isRegistered,
      isAttendanceVerified,
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

export interface TopicDemandCluster {
  topic: string;
  memberCount: number;
  memberIds: string[];
  matchingPublishedOpportunities: number;
  isUnmetGap: boolean;
  existingProposalId?: string;
}

/**
 * Dynamically detects shared member interests and identifies real unmet gaps
 * where >= 2 members share a topic/goal that has 0 published opportunities covering it.
 */
export function analyzeInterestAndUnmetNeeds(db: LammahDatabase): TopicDemandCluster[] {
  const topicToMembers = new Map<string, Set<string>>();

  const addMemberToTopic = (topic: string, memberId: string) => {
    const clean = topic.trim();
    if (!clean) return;
    if (!topicToMembers.has(clean)) {
      topicToMembers.set(clean, new Set());
    }
    topicToMembers.get(clean)!.add(memberId);
  };

  for (const member of db.members) {
    for (const interest of member.interests) {
      addMemberToTopic(interest, member.id);
    }
  }

  for (const goal of db.memberGoals) {
    for (const topic of goal.topics) {
      addMemberToTopic(topic, goal.memberId);
    }
    const text = normalizeArabic(`${goal.title} ${goal.customDescription ?? ''}`);
    if (text.includes('ذكاء اصطناعي') || text.includes('ai')) {
      addMemberToTopic('الذكاء الاصطناعي في تجربة العميل', goal.memberId);
    }
    if (text.includes('صحي') || text.includes('مريض')) {
      addMemberToTopic('تجربة العميل في القطاع الصحي', goal.memberId);
    }
  }

  const publishedOpps = db.opportunities.filter((o) => o.status === 'published');

  const clusters: TopicDemandCluster[] = [];
  for (const [topic, memberSet] of topicToMembers.entries()) {
    const normTopic = normalizeArabic(topic);
    const matchingOpps = publishedOpps.filter((opp) => {
      const oppHaystack = normalizeArabic(`${opp.title} ${opp.shortDescription} ${opp.tags.join(' ')}`);
      if (opp.tags.some((t) => normalizeArabic(t) === normTopic)) return true;
      if (normTopic.includes('ذكاء اصطناعي')) {
        return oppHaystack.includes('ذكاء اصطناعي') || oppHaystack.includes('ai');
      }
      if (normTopic.includes('القطاع الصحي')) {
        return oppHaystack.includes('صحي') || oppHaystack.includes('مريض');
      }
      return oppHaystack.includes(normTopic);
    });

    const existingProposal = db.initiativeProposals.find(
      (p) =>
        normalizeArabic(p.suggestedTopicKey) === normTopic ||
        normalizeArabic(p.title).includes(normTopic)
    );

    clusters.push({
      topic,
      memberCount: memberSet.size,
      memberIds: Array.from(memberSet),
      matchingPublishedOpportunities: matchingOpps.length,
      isUnmetGap: memberSet.size >= 2 && matchingOpps.length === 0,
      existingProposalId: existingProposal?.id,
    });
  }

  return clusters.sort((a, b) => {
    if (a.isUnmetGap !== b.isUnmetGap) return a.isUnmetGap ? -1 : 1;
    return b.memberCount - a.memberCount;
  });
}

export function daysUntilRenewal(renewalDateIso: string, nowDate: Date = new Date()): number {
  const target = new Date(renewalDateIso);
  const diffMs = target.getTime() - nowDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isRenewalEvaluationDue(
  member: Member,
  promptDaysBefore: number,
  nowDate: Date = new Date()
): boolean {
  const daysLeft = daysUntilRenewal(member.renewalDate, nowDate);
  return daysLeft <= promptDaysBefore;
}

export interface AdminDashboardMetrics {
  totalMembers: number;
  newMembersCount: number;
  activeRegistrationsCount: number;
  verifiedAttendancesCount: number;
  participationRatePercent: number;
  publishedOpportunitiesCount: number;
  totalPointsAwarded: number;
  unmetNeedsCount: number;
  proposalsByStatus: {
    new: number;
    under_review: number;
    approved: number;
    rejected: number;
  };
  stickyNotesByType: {
    liked: number;
    suggest: number;
    issue: number;
  };
  renewalSummary: {
    totalResponses: number;
    averageSatisfaction: number;
    definitelyOrLikelyRenew: number;
    unsureOrNotRenewing: number;
  };
  topInterests: TopicDemandCluster[];
  unmetNeeds: TopicDemandCluster[];
}

export function computeAdminMetrics(db: LammahDatabase): AdminDashboardMetrics {
  const activeRegistrations = db.registrations.filter((r) => r.status === 'registered');
  const verifiedAttendances = db.attendanceRecords.filter((a) => a.verified);
  const uniqueParticipatingMembers = new Set([
    ...activeRegistrations.map((r) => r.memberId),
    ...verifiedAttendances.map((a) => a.memberId),
  ]);

  const clusters = analyzeInterestAndUnmetNeeds(db);
  const unmetNeeds = clusters.filter((c) => c.isUnmetGap);

  const proposalsByStatus = {
    new: db.initiativeProposals.filter((p) => p.status === 'new').length,
    under_review: db.initiativeProposals.filter((p) => p.status === 'under_review').length,
    approved: db.initiativeProposals.filter((p) => p.status === 'approved').length,
    rejected: db.initiativeProposals.filter((p) => p.status === 'rejected').length,
  };

  const stickyNotesByType = {
    liked: db.stickyNotes.filter((n) => n.type === 'liked').length,
    suggest: db.stickyNotes.filter((n) => n.type === 'suggest').length,
    issue: db.stickyNotes.filter((n) => n.type === 'issue').length,
  };

  const totalResponses = db.renewalFeedbacks.length;
  const averageSatisfaction =
    totalResponses > 0
      ? Number(
          (
            db.renewalFeedbacks.reduce((acc, f) => acc + f.satisfactionRating, 0) /
            totalResponses
          ).toFixed(1)
        )
      : 0;

  const definitelyOrLikelyRenew = db.renewalFeedbacks.filter(
    (f) => f.renewalIntent === 'definitely_renew' || f.renewalIntent === 'likely_renew'
  ).length;

  const unsureOrNotRenewing = totalResponses - definitelyOrLikelyRenew;

  return {
    totalMembers: db.members.length,
    newMembersCount: db.members.filter((m) => m.isNewThisMonth).length,
    activeRegistrationsCount: activeRegistrations.length,
    verifiedAttendancesCount: verifiedAttendances.length,
    participationRatePercent:
      db.members.length > 0
        ? Math.round((uniqueParticipatingMembers.size / db.members.length) * 100)
        : 0,
    publishedOpportunitiesCount: db.opportunities.filter((o) => o.status === 'published').length,
    totalPointsAwarded: db.pointsTransactions.reduce((sum, tx) => sum + tx.points, 0),
    unmetNeedsCount: unmetNeeds.length,
    proposalsByStatus,
    stickyNotesByType,
    renewalSummary: {
      totalResponses,
      averageSatisfaction,
      definitelyOrLikelyRenew,
      unsureOrNotRenewing,
    },
    topInterests: clusters.slice(0, 6),
    unmetNeeds,
  };
}

export function getOpportunityRegistrationCount(
  db: LammahDatabase,
  opportunityId: string
): number {
  return db.registrations.filter(
    (r) => r.opportunityId === opportunityId && r.status === 'registered'
  ).length;
}

export function verifyAttendanceAndAwardPoints(
  db: LammahDatabase,
  registrationId: string,
  verifiedBy = 'إدارة الجمعية (تجريبي)'
): { db: LammahDatabase; pointsAwarded: number; alreadyVerified: boolean } {
  const reg = db.registrations.find((r) => r.id === registrationId && r.status === 'registered');
  if (!reg) {
    return { db, pointsAwarded: 0, alreadyVerified: false };
  }

  const existingAtt = db.attendanceRecords.find(
    (a) => a.registrationId === registrationId && a.verified
  );
  if (existingAtt) {
    return { db, pointsAwarded: 0, alreadyVerified: true };
  }

  const opp = db.opportunities.find((o) => o.id === reg.opportunityId);
  if (!opp) {
    return { db, pointsAwarded: 0, alreadyVerified: false };
  }

  const nowIso = new Date().toISOString();
  const newAttendance: AttendanceRecord = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    registrationId: reg.id,
    memberId: reg.memberId,
    opportunityId: reg.opportunityId,
    verified: true,
    verifiedAt: nowIso,
    verifiedBy,
  };

  const ruleKey: PointsRuleKey = opp.pointsRewardType;
  const rule = db.pointsRules.find((r) => r.key === ruleKey && r.enabled);
  let pointsAwarded = 0;
  let updatedTransactions = db.pointsTransactions;

  if (
    rule &&
    rule.points > 0 &&
    !hasDuplicatePointsTransaction(db.pointsTransactions, reg.memberId, ruleKey, opp.id)
  ) {
    pointsAwarded = rule.points;
    const tx: PointsTransaction = {
      id: `pts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      memberId: reg.memberId,
      ruleKey,
      activityRefId: opp.id,
      points: rule.points,
      reason: `حضور معتمد: ${opp.title}`,
      createdAt: nowIso,
    };
    updatedTransactions = [tx, ...db.pointsTransactions];
  }

  return {
    db: {
      ...db,
      attendanceRecords: [newAttendance, ...db.attendanceRecords],
      pointsTransactions: updatedTransactions,
    },
    pointsAwarded,
    alreadyVerified: false,
  };
}
