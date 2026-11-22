import { INITIAL_DEMO_DATABASE } from '../data/seed';
import type {
  AttendanceMode,
  FeedbackSummaryResult,
  GoalCategory,
  InitiativeProposal,
  LammahDatabase,
  MemberGoal,
  Opportunity,
  OpportunityCategory,
  PointsRuleKey,
  PointsTransaction,
  ProposalStatus,
  Registration,
  RenewalFeedback,
  StickyNote,
  StickyNoteType,
} from '../types/domain';
import { hasDuplicatePointsTransaction, verifyAttendanceAndAwardPoints } from './analytics';

const STORAGE_KEY = 'lammah_cx_demo_db_v1';

/**
 * Abstract repository contract designed so a future SupabaseRepository
 * (PostgreSQL + Supabase Auth + RLS) can drop in without modifying UI components.
 */
export interface ILammahRepository {
  load(): LammahDatabase;
  save(db: LammahDatabase): LammahDatabase;
  reset(): LammahDatabase;
}

export class LocalStorageRepository implements ILammahRepository {
  load(): LammahDatabase {
    if (typeof window === 'undefined') {
      return structuredClone(INITIAL_DEMO_DATABASE);
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = structuredClone(INITIAL_DEMO_DATABASE);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw) as LammahDatabase;
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.members)) {
        return structuredClone(INITIAL_DEMO_DATABASE);
      }
      return parsed;
    } catch {
      return structuredClone(INITIAL_DEMO_DATABASE);
    }
  }

  save(db: LammahDatabase): LammahDatabase {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      } catch {
        // Ignore storage quota issues in constrained preview browsers
      }
    }
    return db;
  }

  reset(): LammahDatabase {
    const seeded = structuredClone(INITIAL_DEMO_DATABASE);
    return this.save(seeded);
  }
}

export const lammahRepository: ILammahRepository = new LocalStorageRepository();

// Pure state mutation helpers (usable on client and in tests)

export function saveMemberOnboardingAndGoals(
  db: LammahDatabase,
  memberId: string,
  selectedCategories: GoalCategory[],
  customGoalText: string,
  selectedTopics: string[]
): LammahDatabase {
  const nowIso = new Date().toISOString().slice(0, 10);
  const categoryLabels: Record<GoalCategory, string> = {
    professional_skills: 'تطوير المهارات المهنية',
    events_workshops: 'حضور الورش والفعاليات',
    networking: 'توسيع شبكة العلاقات المهنية',
    volunteering: 'الحصول على فرص تطوع',
    career_opportunities: 'اكتشاف فرص مهنية',
    knowledge_sharing: 'مشاركة الخبرات والمعرفة',
    custom: 'هدف مخصص',
  };

  const newGoals: MemberGoal[] = selectedCategories.map((category, idx) => ({
    id: `goal-${Date.now()}-${idx}`,
    memberId,
    category,
    title:
      category === 'custom' && customGoalText.trim()
        ? customGoalText.trim()
        : categoryLabels[category],
    customDescription: customGoalText.trim() || undefined,
    topics: selectedTopics.length > 0 ? selectedTopics : ['تصميم رحلة العميل'],
    status: 'active',
    progressPercent: 15,
    createdAt: nowIso,
  }));

  if (newGoals.length === 0 && customGoalText.trim()) {
    newGoals.push({
      id: `goal-${Date.now()}-custom`,
      memberId,
      category: 'custom',
      title: customGoalText.trim(),
      customDescription: customGoalText.trim(),
      topics: selectedTopics,
      status: 'active',
      progressPercent: 15,
      createdAt: nowIso,
    });
  }

  const otherGoals = db.memberGoals.filter((g) => g.memberId !== memberId);
  const updatedMembers = db.members.map((m) =>
    m.id === memberId
      ? {
          ...m,
          onboardingCompleted: true,
          interests: Array.from(new Set([...selectedTopics, ...(customGoalText.includes('ذكاء') ? ['الذكاء الاصطناعي في تجربة العميل'] : [])])),
        }
      : m
  );

  return {
    ...db,
    members: updatedMembers,
    memberGoals: [...newGoals, ...otherGoals],
  };
}

export function registerMemberForOpportunity(
  db: LammahDatabase,
  memberId: string,
  opportunityId: string,
  source: 'portal' | 'agent_confirmed' = 'portal'
): { db: LammahDatabase; created: boolean; message: string } {
  const opp = db.opportunities.find((o) => o.id === opportunityId && o.status === 'published');
  if (!opp) {
    return { db, created: false, message: 'الفرصة غير متاحة للتسجيل حاليًا.' };
  }

  const existing = db.registrations.find(
    (r) => r.memberId === memberId && r.opportunityId === opportunityId && r.status === 'registered'
  );
  if (existing) {
    return { db, created: false, message: 'أنت مسجل مسبقًا في هذه الفعالية.' };
  }

  const newReg: Registration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    memberId,
    opportunityId,
    status: 'registered',
    registeredAt: new Date().toISOString(),
    source,
  };

  return {
    db: {
      ...db,
      registrations: [newReg, ...db.registrations],
      agentActionLogs:
        source === 'agent_confirmed'
          ? [
              {
                id: `log-${Date.now()}`,
                actorMemberId: memberId,
                actorRole: 'member',
                toolName: 'confirmEventRegistration',
                summary: `أكّد العضو تسجيله التجريبي في "${opp.title}" وتم حفظ التسجيل بنجاح.`,
                outcome: 'executed',
                timestamp: new Date().toISOString(),
              },
              ...db.agentActionLogs,
            ]
          : db.agentActionLogs,
    },
    created: true,
    message: `تم تأكيد تسجيلك التجريبي في "${opp.title}". تُحتسب نقاط المشاركة بعد اعتماد الحضور الفعلي.`,
  };
}

export function cancelMemberRegistration(
  db: LammahDatabase,
  registrationId: string
): LammahDatabase {
  return {
    ...db,
    registrations: db.registrations.map((r) =>
      r.id === registrationId ? { ...r, status: 'cancelled' } : r
    ),
  };
}

export function confirmRegistrationAttendance(
  db: LammahDatabase,
  registrationId: string
): { db: LammahDatabase; pointsAwarded: number; alreadyVerified: boolean } {
  return verifyAttendanceAndAwardPoints(db, registrationId);
}

export function updatePointsRuleValue(
  db: LammahDatabase,
  ruleKey: PointsRuleKey,
  points: number,
  enabled: boolean
): LammahDatabase {
  const safePoints = Math.max(0, Math.min(500, Math.round(points)));
  return {
    ...db,
    pointsRules: db.pointsRules.map((rule) =>
      rule.key === ruleKey ? { ...rule, points: safePoints, enabled } : rule
    ),
  };
}

export function addMemberStickyNote(
  db: LammahDatabase,
  memberId: string,
  type: StickyNoteType,
  topic: string,
  content: string
): { db: LammahDatabase; pointsAwarded: number } {
  const member = db.members.find((m) => m.id === memberId);
  if (!member || !content.trim()) return { db, pointsAwarded: 0 };

  const nowIso = new Date().toISOString();
  const note: StickyNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    memberId,
    memberName: member.fullName,
    type,
    topic: topic.trim() || 'تجربة العضوية',
    content: content.trim(),
    isPrivateToAdmin: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Optional 1-time points for constructive feedback note if rule enabled
  const rule = db.pointsRules.find((r) => r.key === 'post_event_feedback' && r.enabled);
  let pointsAwarded = 0;
  let updatedTransactions = db.pointsTransactions;

  if (
    rule &&
    rule.points > 0 &&
    !hasDuplicatePointsTransaction(db.pointsTransactions, memberId, 'post_event_feedback', note.id)
  ) {
    pointsAwarded = rule.points;
    const tx: PointsTransaction = {
      id: `pts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      memberId,
      ruleKey: 'post_event_feedback',
      activityRefId: note.id,
      points: rule.points,
      reason: `إضافة ملاحظة تطويرية (${note.topic})`,
      createdAt: nowIso,
    };
    updatedTransactions = [tx, ...db.pointsTransactions];
  }

  return {
    db: {
      ...db,
      stickyNotes: [note, ...db.stickyNotes],
      pointsTransactions: updatedTransactions,
    },
    pointsAwarded,
  };
}

export function editMemberStickyNote(
  db: LammahDatabase,
  noteId: string,
  memberId: string,
  type: StickyNoteType,
  topic: string,
  content: string
): LammahDatabase {
  return {
    ...db,
    stickyNotes: db.stickyNotes.map((n) =>
      n.id === noteId && n.memberId === memberId
        ? {
            ...n,
            type,
            topic: topic.trim() || n.topic,
            content: content.trim() || n.content,
            updatedAt: new Date().toISOString(),
          }
        : n
    ),
  };
}

export function removeMemberStickyNote(
  db: LammahDatabase,
  noteId: string,
  memberId: string
): LammahDatabase {
  return {
    ...db,
    stickyNotes: db.stickyNotes.filter((n) => !(n.id === noteId && n.memberId === memberId)),
  };
}

export function saveMemberRenewalFeedback(
  db: LammahDatabase,
  payload: Omit<RenewalFeedback, 'id' | 'submittedAt' | 'isActualRenewalCompleted'>
): { db: LammahDatabase; pointsAwarded: number } {
  const nowIso = new Date().toISOString();
  const feedback: RenewalFeedback = {
    ...payload,
    id: `ren-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    submittedAt: nowIso,
    isActualRenewalCompleted: false,
  };

  // Replace previous draft/response by same member for clean demo metrics
  const otherFeedbacks = db.renewalFeedbacks.filter((f) => f.memberId !== payload.memberId);

  const rule = db.pointsRules.find((r) => r.key === 'renewal_feedback' && r.enabled);
  let pointsAwarded = 0;
  let updatedTransactions = db.pointsTransactions;
  const activityRef = `renewal-cycle-${payload.memberId}`;

  if (
    rule &&
    rule.points > 0 &&
    !hasDuplicatePointsTransaction(db.pointsTransactions, payload.memberId, 'renewal_feedback', activityRef)
  ) {
    pointsAwarded = rule.points;
    updatedTransactions = [
      {
        id: `pts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        memberId: payload.memberId,
        ruleKey: 'renewal_feedback',
        activityRefId: activityRef,
        points: rule.points,
        reason: 'إكمال تقييم تجربة العضوية قبل التجديد',
        createdAt: nowIso,
      },
      ...db.pointsTransactions,
    ];
  }

  return {
    db: {
      ...db,
      renewalFeedbacks: [feedback, ...otherFeedbacks],
      pointsTransactions: updatedTransactions,
    },
    pointsAwarded,
  };
}

export function updateProposalDecision(
  db: LammahDatabase,
  proposalId: string,
  status: ProposalStatus,
  adminNotes?: string
): LammahDatabase {
  return {
    ...db,
    initiativeProposals: db.initiativeProposals.map((p) =>
      p.id === proposalId ? { ...p, status, adminNotes: adminNotes ?? p.adminNotes } : p
    ),
  };
}

export function approveAndPublishProposalAsOpportunity(
  db: LammahDatabase,
  proposalId: string,
  publishDetails: {
    title: string;
    shortDescription: string;
    category: OpportunityCategory;
    date: string;
    time: string;
    location: string;
    attendanceMode: AttendanceMode;
    capacity: number;
    requirements?: string;
  }
): { db: LammahDatabase; opportunity: Opportunity | null } {
  const proposal = db.initiativeProposals.find((p) => p.id === proposalId);
  if (!proposal) return { db, opportunity: null };

  const newOppId = `opp-pub-${Date.now()}`;
  const newOpportunity: Opportunity = {
    id: newOppId,
    title: publishDetails.title.trim() || proposal.title,
    shortDescription: publishDetails.shortDescription.trim() || proposal.shortDescription,
    fullDetails: `${publishDetails.shortDescription.trim() || proposal.shortDescription}\n\nأهداف الفعالية:\n${proposal.objectives.map((o) => `• ${o}`).join('\n')}`,
    category: publishDetails.category,
    tags: Array.from(new Set([proposal.suggestedTopicKey, 'مبادرة مقترحة من لمّاح'])),
    date: publishDetails.date,
    time: publishDetails.time,
    location: publishDetails.location,
    attendanceMode: publishDetails.attendanceMode,
    requirements: publishDetails.requirements?.trim() || 'مفتوحة لأعضاء الجمعية (نموذج عرض تجريبي).',
    capacity: Math.max(5, publishDetails.capacity || 40),
    status: 'published',
    isDemoData: true,
    imageVariant: publishDetails.category === 'تطوع مهني' ? 'volunteering' : 'workshop',
    sourceProposalId: proposal.id,
    pointsRewardType:
      publishDetails.category === 'تطوع مهني' ? 'volunteer_activity' : 'event_attendance',
  };

  const updatedProposals: InitiativeProposal[] = db.initiativeProposals.map((p) =>
    p.id === proposalId
      ? {
          ...p,
          title: newOpportunity.title,
          shortDescription: newOpportunity.shortDescription,
          status: 'approved',
          publishedOpportunityId: newOppId,
        }
      : p
  );

  return {
    db: {
      ...db,
      opportunities: [newOpportunity, ...db.opportunities],
      initiativeProposals: updatedProposals,
    },
    opportunity: newOpportunity,
  };
}

export function createManualOpportunity(
  db: LammahDatabase,
  payload: Omit<Opportunity, 'id' | 'isDemoData' | 'status'>
): LammahDatabase {
  const newOpp: Opportunity = {
    ...payload,
    id: `opp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    isDemoData: true,
    status: 'published',
  };
  return {
    ...db,
    opportunities: [newOpp, ...db.opportunities],
  };
}

export function updateAppSettings(
  db: LammahDatabase,
  renewalPromptDaysBefore: number
): LammahDatabase {
  const clamped = Math.max(7, Math.min(90, Math.round(renewalPromptDaysBefore)));
  return {
    ...db,
    settings: {
      ...db.settings,
      renewalPromptDaysBefore: clamped,
    },
  };
}

export function saveFeedbackSummary(
  db: LammahDatabase,
  summary: FeedbackSummaryResult
): LammahDatabase {
  return {
    ...db,
    lastFeedbackSummary: summary,
  };
}
