import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Compass,
  Lightbulb,
  MapPin,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import { sendAgentChatMessage } from '../../services/agentClient';
import type { AgentChatMessage } from '../../types/domain';
import {
  ArchitecturalGridPattern,
  LAMMAH_EASE,
  LammahOrb,
  ThinkingSkeleton,
} from '../../components/motion/LammahMotion';

interface ScenarioCard {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}

const SCENARIO_CARDS: ScenarioCard[] = [
  {
    id: 'propose-ai',
    title: 'اكتشف فجوة واقترح ورشة ذكاء اصطناعي',
    subtitle: 'يبحث لمّاح في الفرص المتاحة ويرفع مقترح مبادرة للإدارة عند عدم توفرها',
    prompt:
      'أرغب في تعلم تطبيقات الذكاء الاصطناعي في تجربة العميل، هل توجد ورشة مناسبة؟ وإذا لم توجد اقترحها للإدارة.',
    icon: Lightbulb,
    accentClass: 'bg-violet-50 dark:bg-violet-950/55 text-violet-700 dark:text-violet-300',
  },
  {
    id: 'recommend-goals',
    title: 'حلّل أهدافي ورشّح لي أنسب 3 فرص',
    subtitle: 'يقرأ أهدافك النشطة ويطابقها مع الفعاليات المنشورة مع توضيح السبب',
    prompt: 'حلّل أهدافي الحالية ورشّح لي أنسب 3 فرص متاحة مع سبب كل ترشيح.',
    icon: Compass,
    accentClass: 'bg-blue-50 dark:bg-blue-950/55 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'register-consent',
    title: 'جهّز طلب تسجيل بموافقة صريحة',
    subtitle: 'يحجز لك مقعدًا في ديوانية قادة تجربة العميل فقط بعد تأكيدك المباشر',
    prompt: 'أريد التسجيل في ديوانية قادة تجربة العميل، جهّز لي طلب التسجيل بعد موافقتي.',
    icon: ShieldCheck,
    accentClass: 'bg-emerald-50 dark:bg-emerald-950/55 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'unmet-needs',
    title: 'ما أبرز الاحتياجات غير الملباة حاليًا؟',
    subtitle: 'يحلّل الاهتمامات المشتركة لأعضاء الجمعية ويكشف الفجوات غير المغطاة',
    prompt: 'ما هي أبرز الاحتياجات غير الملباة لدى أعضاء الجمعية حاليًا؟',
    icon: Sparkles,
    accentClass: 'bg-amber-50 dark:bg-amber-950/55 text-amber-700 dark:text-amber-300',
  },
];

function renderFormattedText(text: string): React.ReactNode {
  const cleaned = text.replace(/(^|\n)\s*\*\s+/g, '$1• ');
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="not-italic text-slate-600 dark:text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function AgentChatPage() {
  const {
    db,
    role,
    activeMember,
    chatMessages,
    setChatMessages,
    pendingAgentPrompt,
    setPendingAgentPrompt,
    commitDb,
    registerOpportunity,
    openOpportunityById,
    setRole,
    setAdminRoute,
  } = useLammah();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedToolsByMsg, setExpandedToolsByMsg] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const memberGoals = db.memberGoals.filter((g) => g.memberId === activeMember.id);
  const firstName = activeMember.fullName.split(' ')[0] ?? activeMember.fullName;

  const isWelcomeCanvas = chatMessages.length <= 1 && !loading;

  useEffect(() => {
    if (!isWelcomeCanvas) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, loading, isWelcomeCanvas]);

  const toggleToolsTrace = (msgId: string) => {
    setExpandedToolsByMsg((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = useCallback(
    async (promptText?: string) => {
      const text = (promptText ?? input).trim();
      if (!text || loading) return;

      setErrorMsg(null);
      setInput('');

      const userMessage: AgentChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      const nextHistory = [...chatMessages, userMessage];
      setChatMessages(nextHistory);
      setLoading(true);

      try {
        const response = await sendAgentChatMessage({
          db,
          activeMemberId: activeMember.id,
          actorRole: role,
          history: chatMessages.map((m) => ({ role: m.role, content: m.content })),
          message: text,
        });

        commitDb(response.updatedDb);

        const assistantMessage: AgentChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date().toISOString(),
          executedTools: response.executedTools,
          recommendedOpportunityIds: response.recommendedOpportunityIds,
          pendingAction: response.pendingAction,
          pendingActionStatus: response.pendingAction ? 'pending' : undefined,
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'تعذر التواصل مع وكيل لمّاح الذكي حاليًا. يرجى المحاولة مجددًا.'
        );
      } finally {
        setLoading(false);
      }
    },
    [activeMember.id, chatMessages, commitDb, db, input, loading, role, setChatMessages]
  );

  // Consume prompts launched from Member Dashboard Quick-Ask Hero
  useEffect(() => {
    if (pendingAgentPrompt && !loading) {
      const promptToRun = pendingAgentPrompt;
      setPendingAgentPrompt(null);
      void handleSend(promptToRun);
    }
  }, [pendingAgentPrompt, loading, setPendingAgentPrompt, handleSend]);

  const handleConfirmPendingAction = (messageId: string, opportunityId: string) => {
    const res = registerOpportunity(opportunityId, 'agent_confirmed');
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, pendingActionStatus: 'confirmed' } : m
      )
    );
    const followUp: AgentChatMessage = {
      id: `sys-${Date.now()}`,
      role: 'assistant',
      content: res.created
        ? `تم تنفيذ تسجيلك التجريبي بنجاح بعد موافقتك! ${res.message}`
        : res.message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, followUp]);
  };

  const handleCancelPendingAction = (messageId: string) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, pendingActionStatus: 'cancelled' } : m
      )
    );
  };

  const handleResetChatView = () => {
    setErrorMsg(null);
    setChatMessages((prev) => (prev.length > 0 ? [prev[0]] : prev));
  };

  const recentProposalCreated = chatMessages.some((m) =>
    m.executedTools?.some((t) => t.name === 'createInitiativeProposal')
  );

  // ── SIGNATURE STUDIO WELCOME CANVAS (Before First User Turn) ─────────────────────────
  if (isWelcomeCanvas) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: LAMMAH_EASE }}
        className="lammah-card rounded-[28px] relative overflow-hidden min-h-[640px] flex flex-col justify-between p-6 sm:p-10"
      >
        <ArchitecturalGridPattern light className="dark:opacity-20" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[540px] h-[260px] rounded-full bg-gradient-to-b from-indigo-500/12 via-sky-400/8 to-transparent dark:from-indigo-500/20 dark:via-violet-500/12 blur-3xl"
        />

        {/* Top Meta Bar */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-indigo-700 dark:text-indigo-400">
            وكيل لمّاح الذكي · Gemini Function Calling
          </span>
          <span>
            مرتبط بأهدافك النشطة ({memberGoals.length}) وبيانات الفرص الحالية
          </span>
        </div>

        {/* Centerpiece Studio Greeting + 2×2 Interactive Scenario Cards */}
        <div className="relative max-w-3xl mx-auto w-full my-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <LammahOrb state="idle" size="xl" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
                كيف أساعدك في رحلتك اليوم، {firstName}؟
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                أحلّل أهدافك، أرشّح لك الفعاليات المتوافقة معها، أجهّز تسجيلك بعد موافقتك الصريحة،
                وأرفع الفجوات غير المغطاة كمقترحات لإدارة الجمعية.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SCENARIO_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  disabled={loading}
                  onClick={() => handleSend(card.prompt)}
                  className="text-right p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-slate-900/75 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md hover:shadow-indigo-950/5 transition-all flex items-start gap-3.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.accentClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors leading-snug">
                      {card.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sleek Floating Prompt Composer + Governance Footnote */}
        <div className="relative max-w-3xl mx-auto w-full space-y-3">
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2 rounded-2xl bg-white dark:bg-[#0b1324] border border-slate-300/90 dark:border-slate-700 shadow-lg shadow-slate-900/5 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-colors flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              aria-label="اكتب رسالتك لوكيل لمّاح"
              placeholder="اكتب هدفك أو اسأل لمّاح عن أي فعالية أو مبادرة جديدة..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-w-0"
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              disabled={loading || !input.trim()}
              aria-label="إرسال الرسالة"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:opacity-45 shadow-sm shadow-indigo-700/20 transition-all whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>إرسال</span>
            </motion.button>
          </form>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            حوكمة لمّاح: لا تسجيل تلقائي بدون موافقتك الصريحة · يعتمد فقط على بيانات النموذج الفعلية ·
            المقترحات تُراجع من الإدارة قبل النشر
          </p>
        </div>
      </motion.section>
    );
  }

  // ── ACTIVE CONVERSATION STUDIO WORKSPACE ──────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Conversational Stream */}
      <section className="lg:col-span-9 lammah-card rounded-[24px] flex flex-col min-h-[620px] max-h-[80vh] overflow-hidden">
        {/* Refined Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <LammahOrb state={loading ? 'thinking' : 'idle'} size="sm" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                وكيل لمّاح الذكي
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {loading
                  ? 'يحلّل أهدافك ويبحث في قاعدة الفرص عبر الأدوات الفعلية...'
                  : 'جلسة تفاعلية متصلة بقاعدة بيانات الفرص والأهداف'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {recentProposalCreated && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => {
                  setRole('admin');
                  setAdminRoute('proposals');
                }}
                className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/70 inline-flex items-center gap-1 whitespace-nowrap transition-colors"
              >
                <span>معاينة المقترح في الإدارة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </motion.button>
            )}
            <button
              type="button"
              onClick={handleResetChatView}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">محادثة جديدة</span>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <AnimatePresence initial={false}>
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const recommendedOpps = (msg.recommendedOpportunityIds ?? [])
                .map((id) => db.opportunities.find((o) => o.id === id))
                .filter((o): o is NonNullable<typeof o> => Boolean(o))
                .slice(0, 3);
              const isToolsExpanded = Boolean(expandedToolsByMsg[msg.id]);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: LAMMAH_EASE }}
                  className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5 px-1">
                    {isUser ? activeMember.fullName : 'وكيل لمّاح الذكي'}
                  </span>
                  <div
                    className={`max-w-[94%] sm:max-w-[84%] rounded-2xl px-4 sm:px-5 py-3.5 text-sm leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-gradient-to-l from-[#0B152C] to-[#1D3B82] text-white shadow-sm'
                        : 'bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {renderFormattedText(msg.content)}

                    {/* Interactive In-Chat Opportunity Recommendation Cards */}
                    {!isUser && recommendedOpps.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>الفرص المرشّحة المرتبطة برد الوكيل:</span>
                        </p>
                        <div className="space-y-2.5">
                          {recommendedOpps.map((opp) => {
                            const isReg = db.registrations.some(
                              (r) =>
                                r.memberId === activeMember.id &&
                                r.opportunityId === opp.id &&
                                r.status === 'registered'
                            );
                            return (
                              <div
                                key={`${msg.id}-rec-${opp.id}`}
                                className="rounded-xl bg-white dark:bg-[#0b1324] border border-slate-200/90 dark:border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                                      {opp.category}
                                    </span>{' '}
                                    · <span className="tabular-nums">{opp.date}</span> ·{' '}
                                    {opp.attendanceMode}
                                  </p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                                    {opp.title}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    {opp.location}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openOpportunityById(opp.id)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                                  >
                                    عرض التفاصيل
                                  </button>
                                  {!isReg ? (
                                    <button
                                      type="button"
                                      disabled={loading}
                                      onClick={() =>
                                        handleSend(
                                          `جهّز لي طلب التسجيل التجريبي في "${opp.title}" بعد موافقتي.`
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                                    >
                                      تجهيز التسجيل
                                    </button>
                                  ) : (
                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                      مسجّل
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explicit Consent Action Card for requestEventRegistration */}
                    {!isUser && msg.pendingAction && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-xl bg-white dark:bg-[#0b1324] border border-indigo-200 dark:border-indigo-800/80 space-y-3 shadow-sm"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                              طلب موافقة صريحة قبل التنفيذ — تسجيل تجريبي
                            </p>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {msg.pendingAction.opportunityTitle}
                            </h4>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          <p className="flex items-center gap-1.5 tabular-nums">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            <span>{msg.pendingAction.opportunityDate}</span>
                            <span>·</span>
                            <span>{msg.pendingAction.attendanceMode}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{msg.pendingAction.opportunityLocation}</span>
                          </p>
                        </div>

                        {msg.pendingActionStatus === 'pending' && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={() =>
                                handleConfirmPendingAction(
                                  msg.id,
                                  msg.pendingAction!.opportunityId
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>أوافق على التسجيل التجريبي</span>
                            </motion.button>
                            <button
                              type="button"
                              onClick={() => handleCancelPendingAction(msg.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>إلغاء الطلب</span>
                            </button>
                          </div>
                        )}

                        {msg.pendingActionStatus === 'confirmed' && (
                          <motion.p
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-1"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>تم تنفيذ التسجيل التجريبي بعد موافقتك.</span>
                          </motion.p>
                        )}

                        {msg.pendingActionStatus === 'cancelled' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                            تم إلغاء الطلب بناءً على رغبتك ولم يتم التسجيل.
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Collapsible Executed Tools Trace */}
                    {!isUser && msg.executedTools && msg.executedTools.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => toggleToolsTrace(msg.id)}
                          className="w-full flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                            <span>
                              نفّذ الوكيل {msg.executedTools.length} أدوات فعلية على البيانات
                            </span>
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isToolsExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isToolsExpanded && (
                            <motion.ul
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden mt-2 space-y-1.5"
                            >
                              {msg.executedTools.map((tool, idx) => (
                                <li
                                  key={`${msg.id}-tool-${idx}`}
                                  className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                                >
                                  <span className="font-mono text-[11px] text-violet-700 dark:text-violet-400 shrink-0">
                                    {tool.name}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{tool.summary}</span>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end justify-end"
            >
              <ThinkingSkeleton label="لمّاح يحلّل البيانات ويستدعي الأدوات المناسبة..." />
            </motion.div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">تعذر إكمال طلب الوكيل الذكي</p>
                <p className="text-xs mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Floating-style Composer Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d1527] flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            aria-label="اكتب رسالتك لوكيل لمّاح"
            placeholder="اكتب متابعتك أو اطلب من لمّاح تنفيذ خطوة أخرى..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 min-w-0"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.96 }}
            disabled={loading || !input.trim()}
            aria-label="إرسال الرسالة"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 shadow-sm shadow-indigo-700/20 transition-all whitespace-nowrap shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">إرسال</span>
          </motion.button>
        </form>
      </section>

      {/* Compact Context Rail */}
      <aside className="lg:col-span-3 space-y-4">
        <div className="lammah-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              سياقك النشط لدى لمّاح
            </h3>
          </div>
          {memberGoals.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">لا توجد أهداف مسجلة بعد.</p>
          ) : (
            <ul className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/80">
              {memberGoals.map((g) => (
                <li key={g.id} className="pt-2 first:pt-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {g.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {g.topics.join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lammah-card rounded-2xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">أوامر سريعة</h3>
          <div className="space-y-1.5">
            {SCENARIO_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                disabled={loading}
                onClick={() => handleSend(card.prompt)}
                className="w-full text-right p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-relaxed transition-colors disabled:opacity-50"
              >
                {card.title}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
