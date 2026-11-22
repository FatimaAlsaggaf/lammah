import type {
  AgentActionLog,
  AgentPendingAction,
  InitiativeProposal,
  LammahDatabase,
  UserRole,
} from '../types/domain';
import {
  analyzeInterestAndUnmetNeeds,
  calculateMemberPoints,
  getOpportunityRegistrationCount,
  normalizeArabic,
  recommendOpportunitiesForMember,
} from './analytics';

export interface ToolExecutionContext {
  db: LammahDatabase;
  activeMemberId: string;
  actorRole: UserRole;
  pendingAction?: AgentPendingAction;
}

export interface ToolExecutionOutcome {
  result: Record<string, unknown>;
  updatedDb: LammahDatabase;
  pendingAction?: AgentPendingAction;
  labelAr: string;
  summary: string;
}

function appendLog(
  db: LammahDatabase,
  memberId: string,
  role: UserRole,
  toolName: string,
  summary: string,
  outcome: AgentActionLog['outcome']
): LammahDatabase {
  const entry: AgentActionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorMemberId: memberId,
    actorRole: role,
    toolName,
    summary,
    outcome,
    timestamp: new Date().toISOString(),
  };
  return {
    ...db,
    agentActionLogs: [entry, ...db.agentActionLogs].slice(0, 60),
  };
}

export function executeLammahTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolExecutionContext
): ToolExecutionOutcome {
  const db = ctx.db;

  switch (toolName) {
    case 'getMemberGoals': {
      const memberId =
        typeof args.memberId === 'string' && args.memberId.trim()
          ? args.memberId.trim()
          : ctx.activeMemberId;
      const member = db.members.find((m) => m.id === memberId);
      if (!member) {
        return {
          result: { found: false, message: 'لم يتم العثور على العضو في بيانات النموذج.' },
          updatedDb: db,
          labelAr: 'قراءة أهداف العضو',
          summary: 'تعذر العثور على ملف العضو.',
        };
      }
      const goals = db.memberGoals.filter((g) => g.memberId === member.id);
      const points = calculateMemberPoints(db.pointsTransactions, member.id);
      const registrations = db.registrations
        .filter((r) => r.memberId === member.id && r.status === 'registered')
        .map((r) => {
          const opp = db.opportunities.find((o) => o.id === r.opportunityId);
          return {
            registrationId: r.id,
            opportunityId: r.opportunityId,
            title: opp?.title ?? 'فعالية غير معروفة',
            date: opp?.date ?? '',
          };
        });

      const updatedDb = appendLog(
        db,
        ctx.activeMemberId,
        ctx.actorRole,
        'getMemberGoals',
        `اطلع الوكيل على أهداف واهتمامات ${member.fullName} (${goals.length} أهداف).`,
        'info'
      );

      return {
        result: {
          found: true,
          member: {
            id: member.id,
            fullName: member.fullName,
            jobTitle: member.jobTitle,
            city: member.city,
            interests: member.interests,
            renewalDate: member.renewalDate,
            pointsBalance: points,
          },
          goals,
          activeRegistrations: registrations,
        },
        updatedDb,
        labelAr: 'تحليل ملف وأهداف العضو',
        summary: `تمت قراءة ${goals.length} أهداف و${member.interests.length} اهتمامات للعضو ${member.fullName}.`,
      };
    }

    case 'searchOpportunities': {
      const query = typeof args.query === 'string' ? args.query.trim() : '';
      const category = typeof args.category === 'string' ? args.category.trim() : '';
      const mode = typeof args.attendanceMode === 'string' ? args.attendanceMode.trim() : '';

      const normQuery = normalizeArabic(query);
      const queryTokens = normQuery.split(' ').filter((w) => w.length > 1);

      const published = db.opportunities.filter((o) => o.status === 'published');
      const matched = published.filter((opp) => {
        if (category && opp.category !== category) return false;
        if (mode && opp.attendanceMode !== mode) return false;
        if (!normQuery) return true;

        const haystack = normalizeArabic(
          `${opp.title} ${opp.shortDescription} ${opp.fullDetails} ${opp.category} ${opp.tags.join(' ')} ${opp.location}`
        );
        if (haystack.includes(normQuery)) return true;
        if (queryTokens.length > 0) {
          const hitCount = queryTokens.filter((tok) => haystack.includes(tok)).length;
          return hitCount >= Math.max(1, Math.ceil(queryTokens.length * 0.6));
        }
        return false;
      });

      const formatted = matched.map((opp) => ({
        id: opp.id,
        title: opp.title,
        category: opp.category,
        shortDescription: opp.shortDescription,
        date: opp.date,
        time: opp.time,
        location: opp.location,
        attendanceMode: opp.attendanceMode,
        tags: opp.tags,
        registeredCount: getOpportunityRegistrationCount(db, opp.id),
        capacity: opp.capacity,
        isDemoData: true,
      }));

      const updatedDb = appendLog(
        db,
        ctx.activeMemberId,
        ctx.actorRole,
        'searchOpportunities',
        `بحث في الفرص المتاحة بالكلمة "${query || 'الكل'}" ووجد ${formatted.length} نتيجة.`,
        'info'
      );

      return {
        result: {
          query,
          totalFound: formatted.length,
          opportunities: formatted,
          note:
            formatted.length === 0
              ? 'لا توجد حاليًا فرصة منشورة تطابق هذا البحث بدقة في قاعدة الفرص التجريبية. يمكنك فحص الاحتياجات غير الملباة عبر analyzeUnmetNeeds.'
              : 'جميع النتائج من قاعدة البيانات التجريبية للنموذج الأولي.',
        },
        updatedDb,
        labelAr: 'البحث في الفرص المتاحة',
        summary:
          formatted.length > 0
            ? `عثر الوكيل على ${formatted.length} فرصة منشورة مطابقة.`
            : `لم تُعثر على فرصة منشورة تطابق "${query}" — قد تكون هناك فجوة غير ملباة.`,
      };
    }

    case 'recommendOpportunities': {
      const memberId =
        typeof args.memberId === 'string' && args.memberId.trim()
          ? args.memberId.trim()
          : ctx.activeMemberId;
      const limit =
        typeof args.limit === 'number' && args.limit > 0 && args.limit <= 10 ? args.limit : 4;

      const recommendations = recommendOpportunitiesForMember(db, memberId, limit);
      const updatedDb = appendLog(
        db,
        ctx.activeMemberId,
        ctx.actorRole,
        'recommendOpportunities',
        `رشّح الوكيل ${recommendations.length} فرص مخصصة مع أسباب الترشيح.`,
        'info'
      );

      return {
        result: {
          memberId,
          recommendations: recommendations.map((rec) => ({
            id: rec.opportunity.id,
            title: rec.opportunity.title,
            category: rec.opportunity.category,
            date: rec.opportunity.date,
            location: rec.opportunity.location,
            attendanceMode: rec.opportunity.attendanceMode,
            matchScore: rec.matchScore,
            reasons: rec.reasons,
            isRegistered: rec.isRegistered,
          })),
        },
        updatedDb,
        labelAr: 'ترشيح فرص مخصصة',
        summary: `تمت مطابقة ${recommendations.length} فرص مع أهداف واهتمامات العضو.`,
      };
    }

    case 'requestEventRegistration': {
      const memberId =
        typeof args.memberId === 'string' && args.memberId.trim()
          ? args.memberId.trim()
          : ctx.activeMemberId;
      const opportunityId = typeof args.opportunityId === 'string' ? args.opportunityId.trim() : '';
      const reason =
        typeof args.reason === 'string' && args.reason.trim()
          ? args.reason.trim()
          : 'ترشيح مناسب لأهداف العضو';

      const opp = db.opportunities.find((o) => o.id === opportunityId && o.status === 'published');
      if (!opp) {
        return {
          result: {
            status: 'not_found',
            message: 'الفعالية المطلوبة غير موجودة أو غير منشورة حاليًا.',
          },
          updatedDb: db,
          labelAr: 'التحقق من طلب التسجيل',
          summary: 'الفعالية المطلوبة غير متاحة للتسجيل.',
        };
      }

      const already = db.registrations.find(
        (r) => r.memberId === memberId && r.opportunityId === opp.id && r.status === 'registered'
      );
      if (already) {
        return {
          result: {
            status: 'already_registered',
            opportunityId: opp.id,
            opportunityTitle: opp.title,
            message: 'العضو مسجل مسبقًا في هذه الفعالية التجريبية.',
          },
          updatedDb: db,
          labelAr: 'التحقق من حالة التسجيل',
          summary: `العضو مسجّل مسبقًا في "${opp.title}".`,
        };
      }

      const currentCount = getOpportunityRegistrationCount(db, opp.id);
      if (currentCount >= opp.capacity) {
        return {
          result: {
            status: 'full',
            opportunityId: opp.id,
            message: 'اكتمل العدد التجريبي لهذه الفعالية.',
          },
          updatedDb: db,
          labelAr: 'التحقق من المقاعد',
          summary: `اكتملت المقاعد لفعالية "${opp.title}".`,
        };
      }

      const pendingAction: AgentPendingAction = {
        type: 'EVENT_REGISTRATION',
        memberId,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        opportunityDate: opp.date,
        opportunityLocation: opp.location,
        attendanceMode: opp.attendanceMode,
        reason,
      };

      const updatedDb = appendLog(
        db,
        ctx.activeMemberId,
        ctx.actorRole,
        'requestEventRegistration',
        `جهّز الوكيل طلب تسجيل تجريبي في "${opp.title}" بانتظار موافقة العضو الصريحة.`,
        'awaiting_confirmation'
      );

      return {
        result: {
          status: 'awaiting_member_confirmation',
          executed: false,
          opportunityId: opp.id,
          opportunityTitle: opp.title,
          date: opp.date,
          location: opp.location,
          message:
            'تم تجهيز طلب التسجيل التجريبي وهو الآن بانتظار موافقة العضو من بطاقة التأكيد الظاهرة في المحادثة. لم يتم التسجيل فعليًا بعد.',
        },
        updatedDb,
        pendingAction,
        labelAr: 'تجهيز طلب تسجيل (بانتظار الموافقة)',
        summary: `طُلب تأكيد العضو قبل إتمام التسجيل في "${opp.title}".`,
      };
    }

    case 'analyzeUnmetNeeds': {
      const clusters = analyzeInterestAndUnmetNeeds(db);
      const unmet = clusters.filter((c) => c.isUnmetGap);

      const updatedDb = appendLog(
        db,
        ctx.activeMemberId,
        ctx.actorRole,
        'analyzeUnmetNeeds',
        `حلّل الوكيل اهتمامات ${db.members.length} أعضاء واكتشف ${unmet.length} احتياجًا غير ملبى.`,
        'info'
      );

      return {
        result: {
          totalMembersAnalyzed: db.members.length,
          unmetNeedsCount: unmet.length,
          unmetNeeds: unmet.map((u) => ({
            topic: u.topic,
            interestedMemberCount: u.memberCount,
            interestedMemberIds: u.memberIds,
            matchingPublishedOpportunities: u.matchingPublishedOpportunities,
            alreadyHasProposal: Boolean(u.existingProposalId),
            existingProposalId: u.existingProposalId ?? null,
          })),
          topCoveredInterests: clusters
            .filter((c) => !c.isUnmetGap)
            .slice(0, 4)
            .map((c) => ({
              topic: c.topic,
              memberCount: c.memberCount,
              matchingPublishedOpportunities: c.matchingPublishedOpportunities,
            })),
        },
        updatedDb,
        labelAr: 'تحليل الاحتياجات غير الملباة',
        summary: `رُصدت ${unmet.length} فجوات اهتمام مشترك بدون فعاليات حالية في بيانات النموذج.`,
      };
    }

    case 'createInitiativeProposal': {
      const title = typeof args.title === 'string' ? args.title.trim() : '';
      const shortDescription =
        typeof args.shortDescription === 'string' ? args.shortDescription.trim() : '';
      const rationale = typeof args.rationale === 'string' ? args.rationale.trim() : '';
      const targetAudience =
        typeof args.targetAudience === 'string' ? args.targetAudience.trim() : 'أعضاء الجمعية المهتمون';
      const suggestedTopicKey =
        typeof args.suggestedTopicKey === 'string' && args.suggestedTopicKey.trim()
          ? args.suggestedTopicKey.trim()
          : title;
      const objectives = Array.isArray(args.objectives)
        ? args.objectives.filter((o): o is string => typeof o === 'string' && o.trim().length > 0)
        : ['تمكين الأعضاء بمهارات تطبيقية حديثة', 'معالجة فجوة الاحتياج المرصودة في بيانات الأعضاء'];

      if (!title || !shortDescription) {
        return {
          result: {
            created: false,
            message: 'يجب توفير عنوان ووصف مختصر للمقترح.',
          },
          updatedDb: db,
          labelAr: 'إنشاء مقترح مبادرة',
          summary: 'بيانات المقترح غير مكتملة.',
        };
      }

      // Compute exact grounded member count from actual demo data!
      const clusters = analyzeInterestAndUnmetNeeds(db);
      const normTopic = normalizeArabic(suggestedTopicKey);
      const matchingCluster = clusters.find(
        (c) =>
          normalizeArabic(c.topic) === normTopic ||
          normalizeArabic(c.topic).includes(normTopic) ||
          normTopic.includes(normalizeArabic(c.topic))
      );

      // Avoid duplicating an identical active proposal
      const existing = db.initiativeProposals.find(
        (p) =>
          p.status !== 'rejected' &&
          (normalizeArabic(p.suggestedTopicKey) === normTopic ||
            normalizeArabic(p.title) === normalizeArabic(title))
      );

      if (existing) {
        return {
          result: {
            created: false,
            alreadyExists: true,
            proposalId: existing.id,
            proposalTitle: existing.title,
            status: existing.status,
            interestedMemberCount: existing.interestedMemberCount,
            message: 'يوجد مقترح مسبق يغطي نفس الاحتياج ومرفوع حاليًا في لوحة الإدارة.',
          },
          updatedDb: db,
          labelAr: 'التحقق من مقترحات المبادرات',
          summary: `المقترح "${existing.title}" مرفوع مسبقًا في لوحة الإدارة.`,
        };
      }

      const interestedIds = matchingCluster?.memberIds ?? [ctx.activeMemberId];
      const newProposal: InitiativeProposal = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        shortDescription,
        rationale:
          rationale ||
          `رصد لمّاح اهتمام ${interestedIds.length} أعضاء في بيانات النموذج بموضوع "${suggestedTopicKey}" مع عدم توفر ورشة حالية تغطيه.`,
        interestedMemberCount: interestedIds.length,
        interestedMemberIds: interestedIds,
        targetAudience,
        objectives: objectives.slice(0, 5),
        suggestedTopicKey: matchingCluster?.topic ?? suggestedTopicKey,
        status: 'new',
        createdBy: 'lammah_agent',
        createdAt: new Date().toISOString(),
      };

      const withProposal: LammahDatabase = {
        ...db,
        initiativeProposals: [newProposal, ...db.initiativeProposals],
      };

      const updatedDb = appendLog(
        withProposal,
        ctx.activeMemberId,
        ctx.actorRole,
        'createInitiativeProposal',
        `أنشأ الوكيل مقترحًا جديدًا للإدارة: "${newProposal.title}" (${newProposal.interestedMemberCount} أعضاء مهتمين).`,
        'executed'
      );

      return {
        result: {
          created: true,
          proposal: newProposal,
          message:
            'تم حفظ المقترح بنجاح في لوحة إدارة الجمعية بحالة "جديد" لمراجعته واعتماده ونشره.',
        },
        updatedDb,
        labelAr: 'رفع مقترح مبادرة للإدارة',
        summary: `تم إنشاء مقترح "${newProposal.title}" ورفعه للوحة الإدارة (${newProposal.interestedMemberCount} أعضاء مهتمين).`,
      };
    }

    case 'summarizeMemberFeedback': {
      const notes = db.stickyNotes;
      const renewals = db.renewalFeedbacks;
      const liked = notes.filter((n) => n.type === 'liked');
      const suggest = notes.filter((n) => n.type === 'suggest');
      const issues = notes.filter((n) => n.type === 'issue');

      const updatedDb = appendLog(
        db,
        ctx.activeMemberId,
        ctx.actorRole,
        'summarizeMemberFeedback',
        `استعرض الوكيل ${notes.length} ملاحظة و${renewals.length} تقييم تجديد لتلخيصها للإدارة.`,
        'info'
      );

      return {
        result: {
          totalStickyNotes: notes.length,
          counts: {
            liked: liked.length,
            suggest: suggest.length,
            issue: issues.length,
          },
          notes: notes.map((n) => ({
            type: n.type,
            topic: n.topic,
            content: n.content,
          })),
          renewalFeedbackCount: renewals.length,
          renewalFeedbacks: renewals.map((r) => ({
            satisfactionRating: r.satisfactionRating,
            valuePerceived: r.valuePerceived,
            goalProgressRating: r.goalProgressRating,
            renewalIntent: r.renewalIntent,
            desiredServices: r.desiredServices,
            openComment: r.openComment,
          })),
        },
        updatedDb,
        labelAr: 'جمع ملاحظات وتقييمات الأعضاء',
        summary: `تم استرجاع ${notes.length} ملاحظة تفاعلية و${renewals.length} تقييم تجديد للتلخيص.`,
      };
    }

    default:
      return {
        result: { error: `الأداة ${toolName} غير معروفة.` },
        updatedDb: db,
        labelAr: 'أداة غير معروفة',
        summary: `لم يتم التعرف على الأداة ${toolName}.`,
      };
  }
}
