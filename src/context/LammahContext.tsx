import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AgentChatMessage,
  AttendanceMode,
  FeedbackSummaryResult,
  GoalCategory,
  LammahDatabase,
  Member,
  Opportunity,
  OpportunityCategory,
  PointsRuleKey,
  ProposalStatus,
  RenewalFeedback,
  StickyNoteType,
  UserRole,
} from '../types/domain';
import {
  addMemberStickyNote,
  approveAndPublishProposalAsOpportunity,
  cancelMemberRegistration,
  confirmRegistrationAttendance,
  createManualOpportunity,
  editMemberStickyNote,
  lammahRepository,
  registerMemberForOpportunity,
  removeMemberStickyNote,
  saveFeedbackSummary,
  saveMemberOnboardingAndGoals,
  saveMemberRenewalFeedback,
  updateAppSettings,
  updatePointsRuleValue,
  updateProposalDecision,
} from '../services/repository';

export type MemberRoute =
  | 'dashboard'
  | 'opportunities'
  | 'agent'
  | 'points'
  | 'notes'
  | 'renewal'
  | 'profile';

export type AdminRoute =
  | 'overview'
  | 'opportunities'
  | 'proposals'
  | 'gamification'
  | 'feedback'
  | 'settings';

export interface ToastNotice {
  id: string;
  tone: 'success' | 'info' | 'error';
  message: string;
}

export type ThemeMode = 'light' | 'dark';

interface LammahContextValue {
  db: LammahDatabase;
  role: UserRole;
  theme: ThemeMode;
  memberRoute: MemberRoute;
  adminRoute: AdminRoute;
  activeMember: Member;
  onboardingOpen: boolean;
  focusedOpportunityId: string | null;
  pendingAgentPrompt: string | null;
  chatMessages: AgentChatMessage[];
  toast: ToastNotice | null;
  setRole: (role: UserRole) => void;
  toggleTheme: () => void;
  setMemberRoute: (route: MemberRoute) => void;
  setAdminRoute: (route: AdminRoute) => void;
  setActiveMemberId: (memberId: string) => void;
  setOnboardingOpen: (open: boolean) => void;
  setFocusedOpportunityId: (id: string | null) => void;
  openOpportunityById: (opportunityId: string) => void;
  setPendingAgentPrompt: (prompt: string | null) => void;
  askAgentWithPrompt: (prompt: string) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<AgentChatMessage[]>>;
  showToast: (message: string, tone?: ToastNotice['tone']) => void;
  dismissToast: () => void;
  commitDb: (nextDb: LammahDatabase) => void;
  saveGoals: (
    categories: GoalCategory[],
    customGoalText: string,
    topics: string[]
  ) => void;
  registerOpportunity: (
    opportunityId: string,
    source?: 'portal' | 'agent_confirmed'
  ) => { created: boolean; message: string };
  cancelRegistration: (registrationId: string) => void;
  verifyAttendance: (registrationId: string) => { pointsAwarded: number; alreadyVerified: boolean };
  updatePointsRule: (ruleKey: PointsRuleKey, points: number, enabled: boolean) => void;
  addStickyNote: (type: StickyNoteType, topic: string, content: string) => void;
  updateStickyNote: (noteId: string, type: StickyNoteType, topic: string, content: string) => void;
  deleteStickyNote: (noteId: string) => void;
  submitRenewalEvaluation: (
    payload: Omit<RenewalFeedback, 'id' | 'submittedAt' | 'isActualRenewalCompleted'>
  ) => number;
  setProposalStatus: (proposalId: string, status: ProposalStatus, notes?: string) => void;
  publishProposal: (
    proposalId: string,
    details: {
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
  ) => Opportunity | null;
  addOpportunity: (payload: Omit<Opportunity, 'id' | 'isDemoData' | 'status'>) => void;
  saveSettings: (renewalPromptDaysBefore: number) => void;
  storeFeedbackSummary: (summary: FeedbackSummaryResult) => void;
  resetAllDemoData: () => void;
}

const LammahContext = createContext<LammahContextValue | null>(null);

const INITIAL_ASSISTANT_MESSAGE: AgentChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content:
    'مرحبًا بك في لمّاح! أنا وكيلك الذكي لإدارة رحلتك داخل الجمعية. أستطيع تحليل أهدافك، البحث في الفرص التجريبية المتاحة وترشيح الأنسب لك مع توضيح السبب، تجهيز طلبات التسجيل بعد موافقتك، واكتشاف الاحتياجات غير الملباة لرفع مقترحات ورش جديدة لإدارة الجمعية.\n\nكيف أقدر أساعدك اليوم؟',
  timestamp: new Date().toISOString(),
};

export function LammahProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<LammahDatabase>(() => lammahRepository.load());
  const [role, setRoleState] = useState<UserRole>('member');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('lammah_theme_mode');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [memberRoute, setMemberRoute] = useState<MemberRoute>('dashboard');
  const [adminRoute, setAdminRoute] = useState<AdminRoute>('overview');
  const [focusedOpportunityId, setFocusedOpportunityId] = useState<string | null>(null);
  const [pendingAgentPrompt, setPendingAgentPrompt] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lammah_theme_mode', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const openOpportunityById = useCallback((opportunityId: string) => {
    setRoleState('member');
    setFocusedOpportunityId(opportunityId);
    setMemberRoute('opportunities');
  }, []);

  const askAgentWithPrompt = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setRoleState('member');
    setPendingAgentPrompt(trimmed);
    setMemberRoute('agent');
  }, []);

  const activeMember = useMemo(() => {
    return db.members.find((m) => m.id === db.activeMemberId) ?? db.members[0];
  }, [db.members, db.activeMemberId]);

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return false;
    }
    const loaded = lammahRepository.load();
    const current = loaded.members.find((m) => m.id === loaded.activeMemberId) ?? loaded.members[0];
    return !current.onboardingCompleted;
  });

  const showToast = useCallback((message: string, tone: ToastNotice['tone'] = 'success') => {
    const id = `toast-${Date.now()}`;
    setToast({ id, tone, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const commitDb = useCallback((nextDb: LammahDatabase) => {
    lammahRepository.save(nextDb);
    setDb(nextDb);
  }, []);

  const setRole = useCallback((nextRole: UserRole) => {
    setRoleState(nextRole);
  }, []);

  const setActiveMemberId = useCallback(
    (memberId: string) => {
      const next = { ...db, activeMemberId: memberId };
      commitDb(next);
      const chosen = next.members.find((m) => m.id === memberId);
      if (chosen) {
        showToast(`تم التبديل إلى حساب العضو التجريبي: ${chosen.fullName}`, 'info');
      }
    },
    [db, commitDb, showToast]
  );

  const saveGoals = useCallback(
    (categories: GoalCategory[], customGoalText: string, topics: string[]) => {
      const next = saveMemberOnboardingAndGoals(
        db,
        activeMember.id,
        categories,
        customGoalText,
        topics
      );
      commitDb(next);
      setOnboardingOpen(false);
      showToast('تم حفظ أهدافك واهتماماتك وتحديث توصيات لمّاح بنجاح.');
    },
    [db, activeMember.id, commitDb, showToast]
  );

  const registerOpportunity = useCallback(
    (opportunityId: string, source: 'portal' | 'agent_confirmed' = 'portal') => {
      const res = registerMemberForOpportunity(db, activeMember.id, opportunityId, source);
      if (res.created) {
        commitDb(res.db);
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'info');
      }
      return { created: res.created, message: res.message };
    },
    [db, activeMember.id, commitDb, showToast]
  );

  const cancelRegistration = useCallback(
    (registrationId: string) => {
      const next = cancelMemberRegistration(db, registrationId);
      commitDb(next);
      showToast('تم إلغاء التسجيل التجريبي.', 'info');
    },
    [db, commitDb, showToast]
  );

  const verifyAttendance = useCallback(
    (registrationId: string) => {
      const res = confirmRegistrationAttendance(db, registrationId);
      if (res.alreadyVerified) {
        showToast('تم اعتماد حضور هذا التسجيل مسبقًا (يُمنع احتساب نقاط مكررة).', 'info');
      } else {
        commitDb(res.db);
        showToast(
          res.pointsAwarded > 0
            ? `تم اعتماد الحضور وإضافة ${res.pointsAwarded} نقطة لرصيد العضو.`
            : 'تم اعتماد الحضور بنجاح.',
          'success'
        );
      }
      return { pointsAwarded: res.pointsAwarded, alreadyVerified: res.alreadyVerified };
    },
    [db, commitDb, showToast]
  );

  const updatePointsRule = useCallback(
    (ruleKey: PointsRuleKey, points: number, enabled: boolean) => {
      const next = updatePointsRuleValue(db, ruleKey, points, enabled);
      commitDb(next);
      showToast('تم تحديث قاعدة النقاط التجريبية بنجاح.');
    },
    [db, commitDb, showToast]
  );

  const addStickyNote = useCallback(
    (type: StickyNoteType, topic: string, content: string) => {
      const res = addMemberStickyNote(db, activeMember.id, type, topic, content);
      commitDb(res.db);
      showToast(
        res.pointsAwarded > 0
          ? `تمت إضافة ملاحظتك الخاصة للإدارة (+${res.pointsAwarded} نقاط مشاركة).`
          : 'تمت إضافة ملاحظتك الخاصة للإدارة بنجاح.'
      );
    },
    [db, activeMember.id, commitDb, showToast]
  );

  const updateStickyNote = useCallback(
    (noteId: string, type: StickyNoteType, topic: string, content: string) => {
      const next = editMemberStickyNote(db, noteId, activeMember.id, type, topic, content);
      commitDb(next);
      showToast('تم تحديث الملاحظة.');
    },
    [db, activeMember.id, commitDb, showToast]
  );

  const deleteStickyNote = useCallback(
    (noteId: string) => {
      const next = removeMemberStickyNote(db, noteId, activeMember.id);
      commitDb(next);
      showToast('تم حذف الملاحظة.', 'info');
    },
    [db, activeMember.id, commitDb, showToast]
  );

  const submitRenewalEvaluation = useCallback(
    (payload: Omit<RenewalFeedback, 'id' | 'submittedAt' | 'isActualRenewalCompleted'>) => {
      const res = saveMemberRenewalFeedback(db, payload);
      commitDb(res.db);
      showToast(
        res.pointsAwarded > 0
          ? `شكرًا لمشاركتك! تم حفظ تقييم العضوية وإضافة ${res.pointsAwarded} نقاط.`
          : 'شكرًا لمشاركتك! تم حفظ تقييم العضوية بنجاح.'
      );
      return res.pointsAwarded;
    },
    [db, commitDb, showToast]
  );

  const setProposalStatus = useCallback(
    (proposalId: string, status: ProposalStatus, notes?: string) => {
      const next = updateProposalDecision(db, proposalId, status, notes);
      commitDb(next);
      showToast('تم تحديث حالة المقترح.');
    },
    [db, commitDb, showToast]
  );

  const publishProposal = useCallback(
    (
      proposalId: string,
      details: {
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
    ) => {
      const res = approveAndPublishProposalAsOpportunity(db, proposalId, details);
      if (res.opportunity) {
        commitDb(res.db);
        showToast(
          `تم اعتماد المقترح ونشر "${res.opportunity.title}" في قائمة فرص الأعضاء.`
        );
      }
      return res.opportunity;
    },
    [db, commitDb, showToast]
  );

  const addOpportunity = useCallback(
    (payload: Omit<Opportunity, 'id' | 'isDemoData' | 'status'>) => {
      const next = createManualOpportunity(db, payload);
      commitDb(next);
      showToast(`تم نشر الفرصة التجريبية "${payload.title}" بنجاح.`);
    },
    [db, commitDb, showToast]
  );

  const saveSettings = useCallback(
    (renewalPromptDaysBefore: number) => {
      const next = updateAppSettings(db, renewalPromptDaysBefore);
      commitDb(next);
      showToast('تم حفظ الإعدادات الأساسية.');
    },
    [db, commitDb, showToast]
  );

  const storeFeedbackSummary = useCallback(
    (summary: FeedbackSummaryResult) => {
      const next = saveFeedbackSummary(db, summary);
      commitDb(next);
    },
    [db, commitDb]
  );

  const resetAllDemoData = useCallback(() => {
    const fresh = lammahRepository.reset();
    setDb(fresh);
    setChatMessages([INITIAL_ASSISTANT_MESSAGE]);
    showToast('تمت إعادة تعيين جميع بيانات النموذج التجريبي إلى حالتها الأولية.', 'info');
  }, [showToast]);

  const value = useMemo<LammahContextValue>(
    () => ({
      db,
      role,
      theme,
      memberRoute,
      adminRoute,
      activeMember,
      onboardingOpen,
      focusedOpportunityId,
      pendingAgentPrompt,
      chatMessages,
      toast,
      setRole,
      toggleTheme,
      setMemberRoute,
      setAdminRoute,
      setActiveMemberId,
      setOnboardingOpen,
      setFocusedOpportunityId,
      openOpportunityById,
      setPendingAgentPrompt,
      askAgentWithPrompt,
      setChatMessages,
      showToast,
      dismissToast,
      commitDb,
      saveGoals,
      registerOpportunity,
      cancelRegistration,
      verifyAttendance,
      updatePointsRule,
      addStickyNote,
      updateStickyNote,
      deleteStickyNote,
      submitRenewalEvaluation,
      setProposalStatus,
      publishProposal,
      addOpportunity,
      saveSettings,
      storeFeedbackSummary,
      resetAllDemoData,
    }),
    [
      db,
      role,
      theme,
      memberRoute,
      adminRoute,
      activeMember,
      onboardingOpen,
      focusedOpportunityId,
      pendingAgentPrompt,
      chatMessages,
      toast,
      setRole,
      toggleTheme,
      setActiveMemberId,
      openOpportunityById,
      askAgentWithPrompt,
      showToast,
      dismissToast,
      commitDb,
      saveGoals,
      registerOpportunity,
      cancelRegistration,
      verifyAttendance,
      updatePointsRule,
      addStickyNote,
      updateStickyNote,
      deleteStickyNote,
      submitRenewalEvaluation,
      setProposalStatus,
      publishProposal,
      addOpportunity,
      saveSettings,
      storeFeedbackSummary,
      resetAllDemoData,
    ]
  );

  return <LammahContext.Provider value={value}>{children}</LammahContext.Provider>;
}

export function useLammah() {
  const ctx = useContext(LammahContext);
  if (!ctx) throw new Error('useLammah must be used inside LammahProvider');
  return ctx;
}
