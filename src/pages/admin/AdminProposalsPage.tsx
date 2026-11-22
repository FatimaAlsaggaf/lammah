import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Sparkles,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import { analyzeInterestAndUnmetNeeds } from '../../services/analytics';
import { requestAdminUnmetNeedsDiscovery } from '../../services/agentClient';
import type {
  AttendanceMode,
  InitiativeProposal,
  OpportunityCategory,
  ProposalStatus,
} from '../../types/domain';
import {
  AnimatedProgressBar,
  ArchitecturalGridPattern,
  LAMMAH_EASE,
  LAMMAH_SPRING,
  LammahOrb,
  ThinkingSkeleton,
} from '../../components/motion/LammahMotion';

const STATUS_LABELS: Record<ProposalStatus, { text: string; tone: string }> = {
  new: { text: 'جديد', tone: 'text-indigo-700 dark:text-indigo-400' },
  under_review: { text: 'قيد المراجعة', tone: 'text-amber-700 dark:text-amber-400' },
  approved: { text: 'معتمد ومنشور', tone: 'text-emerald-700 dark:text-emerald-400' },
  rejected: { text: 'مرفوض', tone: 'text-rose-700 dark:text-rose-400' },
};

export function AdminProposalsPage() {
  const { db, commitDb, setProposalStatus, publishProposal, showToast } = useLammah();

  const [statusFilter, setStatusFilter] = useState<'all' | ProposalStatus>('all');
  const [discovering, setDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryNote, setDiscoveryNote] = useState<string | null>(null);

  // Modal state for reviewing, editing details, and publishing an approved proposal
  const [publishingProposal, setPublishingProposal] = useState<InitiativeProposal | null>(null);
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubCategory, setPubCategory] = useState<OpportunityCategory>('ورشة عمل');
  const [pubDate, setPubDate] = useState('2026-12-28');
  const [pubTime, setPubTime] = useState('06:30 مساءً — 09:00 مساءً');
  const [pubLocation, setPubLocation] = useState('الرياض — حضور مباشر وبث رقمي');
  const [pubMode, setPubMode] = useState<AttendanceMode>('هجين');
  const [pubCapacity, setPubCapacity] = useState(50);
  const [pubRequirements, setPubRequirements] = useState('');

  const unmetNeeds = useMemo(
    () => analyzeInterestAndUnmetNeeds(db).filter((c) => c.isUnmetGap),
    [db]
  );

  const visibleProposals = useMemo(() => {
    if (statusFilter === 'all') return db.initiativeProposals;
    return db.initiativeProposals.filter((p) => p.status === statusFilter);
  }, [db.initiativeProposals, statusFilter]);

  const totalMembers = Math.max(1, db.members.length);

  const openPublishModal = (proposal: InitiativeProposal) => {
    setPublishingProposal(proposal);
    setPubTitle(proposal.title);
    setPubDesc(proposal.shortDescription);
    setPubCategory('ورشة عمل');
    setPubDate('2026-12-28');
    setPubTime('06:30 مساءً — 09:00 مساءً');
    setPubLocation('الرياض — مركز الابتكار وبث رقمي');
    setPubMode('هجين');
    setPubCapacity(50);
    setPubRequirements('مفتوحة لأعضاء الجمعية المهتمين (نموذج عرض تجريبي).');
  };

  const handleConfirmPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingProposal) return;
    publishProposal(publishingProposal.id, {
      title: pubTitle,
      shortDescription: pubDesc,
      category: pubCategory,
      date: pubDate,
      time: pubTime,
      location: pubLocation,
      attendanceMode: pubMode,
      capacity: Number(pubCapacity) || 40,
      requirements: pubRequirements,
    });
    setPublishingProposal(null);
  };

  const handleRunAiDiscovery = async () => {
    setDiscovering(true);
    setDiscoveryError(null);
    setDiscoveryNote(null);
    try {
      const res = await requestAdminUnmetNeedsDiscovery(db);
      commitDb(res.updatedDb);
      setDiscoveryNote(res.reply);
      showToast('أكمل وكيل لمّاح فحص الاحتياجات غير الملباة وتحديث المقترحات.');
    } catch (err) {
      setDiscoveryError(
        err instanceof Error ? err.message : 'تعذر تشغيل التحليل الذكي حاليًا.'
      );
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Discovery Header */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: LAMMAH_EASE }}
        className="lammah-hero-surface rounded-[26px] relative overflow-hidden text-white p-6 sm:p-7 shadow-lg shadow-slate-950/15"
      >
        <ArchitecturalGridPattern />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 max-w-2xl">
            <LammahOrb state={discovering ? 'thinking' : 'idle'} size="md" />
            <div>
              <p className="text-xs font-semibold text-sky-300">
                اكتشاف الفجوات بالذكاء الاصطناعي · حوكمة الاعتماد قبل النشر
              </p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">
                مقترحات المبادرات والورش الجديدة
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                يحوّل لمّاح الاهتمامات المتكررة غير المغطاة إلى ملفات قرار واضحة. لا يُنشر أي مقترح
                للأعضاء إلا بعد مراجعة الإدارة وتحديد موعده ومقره.
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunAiDiscovery}
            disabled={discovering}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-sky-400 via-blue-500 to-indigo-500 text-white text-sm font-semibold hover:brightness-110 disabled:opacity-60 shadow-md shadow-blue-950/30 transition-all whitespace-nowrap shrink-0"
          >
            {discovering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {discovering ? 'جاري التحليل عبر Gemini...' : 'اكتشاف احتياجات جديدة بـ لمّاح'}
            </span>
          </motion.button>
        </div>
      </motion.section>

      {discovering && (
        <ThinkingSkeleton label="وكيل لمّاح يحلل اهتمامات الأعضاء ويرصد الفجوات غير المغطاة..." />
      )}

      {discoveryError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{discoveryError}</span>
        </div>
      )}

      {discoveryNote && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lammah-card rounded-2xl p-5 border-violet-200 dark:border-violet-800/70 bg-violet-50/70 dark:bg-violet-950/30 text-slate-800 dark:text-slate-200 text-sm space-y-1.5"
        >
          <p className="text-xs font-bold text-violet-800 dark:text-violet-300">
            نتيجة تحليل وكيل لمّاح:
          </p>
          <p className="leading-relaxed whitespace-pre-line">{discoveryNote}</p>
        </motion.div>
      )}

      {/* Compact Unmet Gaps Strip */}
      {unmetNeeds.length > 0 && (
        <section className="lammah-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              فجوات الاهتمام غير الملباة حاليًا ({unmetNeeds.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              0 فعاليات منشورة تغطي هذه المجالات
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unmetNeeds.map((gap) => (
              <div
                key={gap.topic}
                className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {gap.topic}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 tabular-nums">
                    {gap.memberCount} أعضاء مهتمون في بيانات العرض
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 whitespace-nowrap shrink-0">
                  {gap.existingProposalId ? 'له مقترح أدناه' : 'بحاجة لمقترح'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Status Segmented Filter */}
      <div
        role="group"
        aria-label="تصفية المقترحات حسب الحالة"
        className="flex items-center gap-1 p-1 bg-slate-200/75 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl w-fit max-w-full overflow-x-auto"
      >
        {(
          [
            { id: 'all', label: `الكل (${db.initiativeProposals.length})` },
            {
              id: 'new',
              label: `جديد (${db.initiativeProposals.filter((p) => p.status === 'new').length})`,
            },
            {
              id: 'under_review',
              label: `قيد المراجعة (${db.initiativeProposals.filter((p) => p.status === 'under_review').length})`,
            },
            {
              id: 'approved',
              label: `معتمد (${db.initiativeProposals.filter((p) => p.status === 'approved').length})`,
            },
            {
              id: 'rejected',
              label: `مرفوض (${db.initiativeProposals.filter((p) => p.status === 'rejected').length})`,
            },
          ] as const
        ).map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="proposals-status-pill"
                  transition={LAMMAH_SPRING}
                  className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Executive Decision Dossier Cards */}
      {visibleProposals.length === 0 ? (
        <div className="lammah-card rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            لا توجد مقترحات ضمن هذا التصنيف.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visibleProposals.map((proposal) => {
              const st = STATUS_LABELS[proposal.status];
              const isActionable = proposal.status === 'new' || proposal.status === 'under_review';
              const demandPercent = Math.min(
                100,
                Math.round((proposal.interestedMemberCount / totalMembers) * 100)
              );

              return (
                <motion.article
                  key={proposal.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: LAMMAH_EASE }}
                  className={`lammah-card rounded-[24px] overflow-hidden ${
                    isActionable ? 'ring-1 ring-indigo-500/20 dark:ring-indigo-400/25' : ''
                  }`}
                >
                  <div className="p-6 space-y-5">
                    {/* Top Header + Demand Meter */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                          <span className={`font-bold ${st.tone}`}>{st.text}</span>
                          <span aria-hidden="true">·</span>
                          <span>المجال: {proposal.suggestedTopicKey}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {new Date(proposal.createdAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                          {proposal.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                          {proposal.shortDescription}
                        </p>
                      </div>

                      {/* Visual Demand Signal Box */}
                      <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-800 p-4 min-w-[210px] shrink-0 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>حجم الطلب المرصود</span>
                          </span>
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">
                            {proposal.interestedMemberCount} / {totalMembers}
                          </span>
                        </div>
                        <AnimatedProgressBar
                          percent={demandPercent}
                          heightClass="h-2"
                          trackClass="bg-slate-200/80 dark:bg-slate-800"
                          fillClass="bg-gradient-to-l from-indigo-600 to-violet-500"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          يمثل {demandPercent}% من الأعضاء التجريبيين
                        </p>
                      </div>
                    </div>

                    {/* Structured Dossier Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div className="space-y-3">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                            سبب اقتراح وكيل لمّاح
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {proposal.rationale}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                            الفئة المستهدفة
                          </p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {proposal.targetAudience}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          الأهداف والمخرجات المقترحة
                        </p>
                        <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 list-disc pr-4 leading-relaxed">
                          {proposal.objectives.map((obj, idx) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Decision Footer */}
                  <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/55 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    {proposal.status === 'approved' ? (
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          تم اعتماد هذا المقترح ونشره كفعالية متاحة للأعضاء ضمن قائمة الفرص.
                        </span>
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openPublishModal(proposal)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>مراجعة التفاصيل والاعتماد والنشر</span>
                        </motion.button>

                        {proposal.status === 'new' && (
                          <button
                            type="button"
                            onClick={() => setProposalStatus(proposal.id, 'under_review')}
                            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            تحويل لقيد المراجعة
                          </button>
                        )}

                        {proposal.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => setProposalStatus(proposal.id, 'rejected')}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رفض المقترح</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Mandatory Review & Publish Modal */}
      <AnimatePresence>
        {publishingProposal && (
          <motion.div
            key="publish-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: LAMMAH_EASE }}
              className="bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-[24px] w-full max-w-xl my-8 overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-5 lammah-hero-surface text-white flex items-center justify-between relative overflow-hidden">
                <ArchitecturalGridPattern />
                <div className="relative">
                  <p className="text-xs text-sky-300 font-medium">خطوة الاعتماد والنشر من الإدارة</p>
                  <h3 id="publish-modal-title" className="text-base font-bold mt-0.5">
                    مراجعة بيانات الفعالية قبل نشرها للأعضاء
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishingProposal(null)}
                  aria-label="إغلاق نافذة الاعتماد"
                  className="relative p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmPublish} className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="pub-title"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    عنوان الفعالية
                  </label>
                  <input
                    id="pub-title"
                    type="text"
                    required
                    value={pubTitle}
                    onChange={(e) => setPubTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pub-desc"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    الوصف المختصر
                  </label>
                  <textarea
                    id="pub-desc"
                    rows={2}
                    required
                    value={pubDesc}
                    onChange={(e) => setPubDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="pub-category"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      التصنيف
                    </label>
                    <select
                      id="pub-category"
                      value={pubCategory}
                      onChange={(e) => setPubCategory(e.target.value as OpportunityCategory)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="ورشة عمل">ورشة عمل</option>
                      <option value="لقاء حواري">لقاء حواري</option>
                      <option value="تطوع مهني">تطوع مهني</option>
                      <option value="تواصل مهني">تواصل مهني</option>
                      <option value="إرشاد وتطوير">إرشاد وتطوير</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="pub-mode"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      طريقة الحضور
                    </label>
                    <select
                      id="pub-mode"
                      value={pubMode}
                      onChange={(e) => setPubMode(e.target.value as AttendanceMode)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="هجين">هجين</option>
                      <option value="حضوري">حضوري</option>
                      <option value="عن بُعد">عن بُعد</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="pub-date"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      التاريخ
                    </label>
                    <input
                      id="pub-date"
                      type="date"
                      required
                      value={pubDate}
                      onChange={(e) => setPubDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pub-time"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      الوقت
                    </label>
                    <input
                      id="pub-time"
                      type="text"
                      required
                      value={pubTime}
                      onChange={(e) => setPubTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pub-location"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      المكان أو رابط الحضور
                    </label>
                    <input
                      id="pub-location"
                      type="text"
                      required
                      value={pubLocation}
                      onChange={(e) => setPubLocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pub-capacity"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      السعة التجريبية
                    </label>
                    <input
                      id="pub-capacity"
                      type="number"
                      min={5}
                      max={500}
                      value={pubCapacity}
                      onChange={(e) => setPubCapacity(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="pub-reqs"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    شروط المشاركة (اختياري)
                  </label>
                  <input
                    id="pub-reqs"
                    type="text"
                    value={pubRequirements}
                    onChange={(e) => setPubRequirements(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPublishingProposal(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    إلغاء
                  </button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
                  >
                    اعتماد ونشر في فرص الأعضاء
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
