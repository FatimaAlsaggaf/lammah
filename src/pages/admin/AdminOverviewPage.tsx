import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Lightbulb,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import { computeAdminMetrics } from '../../services/analytics';
import {
  AnimatedCounter,
  AnimatedProgressBar,
  ArchitecturalGridPattern,
  LAMMAH_EASE,
  LammahOrb,
  RadialRingProgress,
} from '../../components/motion/LammahMotion';

export function AdminOverviewPage() {
  const { db, setAdminRoute } = useLammah();
  const metrics = useMemo(() => computeAdminMetrics(db), [db]);

  const maxInterestCount = Math.max(
    1,
    ...metrics.topInterests.map((item) => item.memberCount)
  );

  const topUnmetNeed = metrics.unmetNeeds[0];
  const pendingProposals = db.initiativeProposals.filter(
    (p) => p.status === 'new' || p.status === 'under_review'
  );
  const featuredProposal = pendingProposals[0] ?? db.initiativeProposals[0];

  return (
    <div className="space-y-7 sm:space-y-8">
      {/* Executive AI Intelligence Command Banner */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: LAMMAH_EASE }}
        className="lammah-hero-surface rounded-[28px] relative overflow-hidden text-white shadow-xl shadow-slate-950/15"
      >
        <ArchitecturalGridPattern />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-20 w-80 h-80 rounded-full bg-violet-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-10 w-72 h-72 rounded-full bg-sky-400/15 blur-3xl"
        />

        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <LammahOrb state="idle" size="lg" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-sky-300/95 tracking-wide">
                مركز ذكاء الأعضاء · لوحة قيادة إدارة الجمعية
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug text-balance">
                {topUnmetNeed
                  ? `فجوة احتياج نشطة في "${topUnmetNeed.topic}" لدى ${topUnmetNeed.memberCount} أعضاء`
                  : 'نظرة تنفيذية حية على رحلة الأعضاء وتغطية الفعاليات'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {topUnmetNeed
                  ? `يرصد وكيل لمّاح ${metrics.unmetNeedsCount} احتياجات مشتركة غير مغطاة بفعاليات منشورة، مع ${pendingProposals.length} مقترحات مبادرات جاهزة لمراجعة واعتماد الإدارة.`
                  : 'جميع الاهتمامات المشتركة الحالية مغطاة بفعاليات منشورة مع متابعة مستمرة لمؤشرات المشاركة.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAdminRoute('proposals')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-sky-400 via-blue-500 to-indigo-500 text-white text-sm font-semibold hover:brightness-110 shadow-md shadow-blue-950/30 transition-all whitespace-nowrap"
            >
              <Lightbulb className="w-4 h-4" />
              <span>مراجعة المقترحات ({pendingProposals.length})</span>
            </motion.button>
            <button
              type="button"
              onClick={() => setAdminRoute('opportunities')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-medium hover:bg-white/15 transition-colors whitespace-nowrap"
            >
              <CalendarDays className="w-4 h-4" />
              <span>إدارة الفعاليات</span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* Unified Architectural 4-Column Hairline KPI Bar (NOT 4 generic floating boxes) */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.05, ease: LAMMAH_EASE }}
        className="lammah-card rounded-[24px] overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200/80 dark:divide-slate-800"
      >
        <div className="p-5 sm:p-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            إجمالي الأعضاء التجريبيين
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            <AnimatedCounter value={metrics.totalMembers} />
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5 font-medium tabular-nums">
            +{metrics.newMembersCount} أعضاء جدد هذا الشهر
          </p>
        </div>

        <div className="p-5 sm:p-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              المشاركة والاعتماد
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              <AnimatedCounter value={metrics.activeRegistrationsCount} />
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
              حضور معتمد: {metrics.verifiedAttendancesCount}
            </p>
          </div>
          <RadialRingProgress
            percent={metrics.participationRatePercent}
            size={58}
            strokeWidth={5}
            gradientId="adminParticipationRing"
            fromColor="#2563EB"
            toColor="#10B981"
            label={`${metrics.participationRatePercent}%`}
            labelClassName="text-[11px] font-bold text-slate-900 dark:text-white"
          />
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            الاحتياجات غير الملباة
          </p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            <AnimatedCounter value={metrics.unmetNeedsCount} />
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
            بانتظار الاعتماد: {pendingProposals.length} مقترحات
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            متوسط رضا التجديد
          </p>
          <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 mt-2">
            {metrics.renewalSummary.totalResponses > 0 ? (
              <AnimatedCounter
                value={metrics.renewalSummary.averageSatisfaction}
                decimals={1}
                suffix="/5"
              />
            ) : (
              '—'
            )}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
            {metrics.renewalSummary.totalResponses} استجابات · نية إيجابية:{' '}
            {metrics.renewalSummary.definitelyOrLikelyRenew}
          </p>
        </div>
      </motion.section>

      {/* Primary Intelligence Grid: Demand vs Coverage + Actionable AI Proposal Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Demand vs Event Coverage Chart */}
        <section className="lg:col-span-7 lammah-card rounded-[24px] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تحليل الطلب مقابل تغطية الفعاليات
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                عدد الأعضاء المهتمين بكل مجال مقارنة بعدد الفرص المنشورة حاليًا
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>فجوة احتياج</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                <span>مغطى بفرص</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {metrics.topInterests.map((cluster) => {
              const widthPct = Math.round((cluster.memberCount / maxInterestCount) * 100);
              return (
                <div key={cluster.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {cluster.topic}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      {cluster.memberCount} أعضاء ·{' '}
                      <span
                        className={
                          cluster.isUnmetGap
                            ? 'text-amber-700 dark:text-amber-400 font-semibold'
                            : 'text-emerald-700 dark:text-emerald-400 font-medium'
                        }
                      >
                        {cluster.matchingPublishedOpportunities === 0
                          ? 'فجوة غير مغطاة'
                          : `${cluster.matchingPublishedOpportunities} فرص منشورة`}
                      </span>
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percent={widthPct}
                    heightClass="h-2.5"
                    trackClass="bg-slate-100 dark:bg-slate-800"
                    fillClass={
                      cluster.isUnmetGap
                        ? 'bg-gradient-to-l from-amber-500 to-orange-500'
                        : 'bg-gradient-to-l from-blue-600 via-indigo-500 to-violet-600'
                    }
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Actionable AI Proposal Spotlight + Pipeline Status */}
        <section className="lg:col-span-5 lammah-card rounded-[24px] p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  أبرز مقترح جاهز للقرار
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminRoute('proposals')}
                className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 inline-flex items-center gap-1"
              >
                <span>كل المقترحات</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {featuredProposal ? (
              <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-violet-700 dark:text-violet-400">
                    {featuredProposal.suggestedTopicKey}
                  </span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                    {featuredProposal.interestedMemberCount} أعضاء مهتمون
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {featuredProposal.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {featuredProposal.rationale}
                </p>
                <button
                  type="button"
                  onClick={() => setAdminRoute('proposals')}
                  className="w-full py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors"
                >
                  فتح بطاقة الاعتماد والنشر
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                لا توجد مقترحات مسجلة بعد.
              </p>
            )}

            {/* Unmet Gaps Summary */}
            {metrics.unmetNeeds.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  الفجوات المرصودة حاليًا
                </p>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {metrics.unmetNeeds.slice(0, 3).map((gap) => (
                    <li
                      key={gap.topic}
                      className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {gap.topic}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 font-semibold tabular-nums whitespace-nowrap">
                        {gap.memberCount} أعضاء
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Compact 4-Status Proposal Pipeline */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800 text-center">
            <div>
              <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
                <AnimatedCounter value={metrics.proposalsByStatus.new} />
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">جديد</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                <AnimatedCounter value={metrics.proposalsByStatus.under_review} />
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">مراجعة</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                <AnimatedCounter value={metrics.proposalsByStatus.approved} />
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">معتمد</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-400">
                <AnimatedCounter value={metrics.proposalsByStatus.rejected} />
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">مرفوض</p>
            </div>
          </div>
        </section>
      </div>

      {/* Operations Bottom Row: Member Feedback Pulse & Agent Governance Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 lammah-card rounded-[24px] p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  نبض ملاحظات الأعضاء
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminRoute('feedback')}
                className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
              >
                فتح لوحة التحليل
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-200/80 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 py-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  <AnimatedCounter value={metrics.stickyNotesByType.liked} />
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">أعجبني</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-700 dark:text-sky-400">
                  <AnimatedCounter value={metrics.stickyNotesByType.suggest} />
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">أقترح</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  <AnimatedCounter value={metrics.stickyNotesByType.issue} />
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">مشكلة</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 pt-3.5 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
            إجمالي النقاط الموثقة في النظام التجريبي:{' '}
            <strong className="text-slate-900 dark:text-white tabular-nums">
              {metrics.totalPointsAwarded}
            </strong>{' '}
            نقطة عبر <span className="tabular-nums">{db.pointsTransactions.length}</span> عملية معتمدة.
          </p>
        </section>

        <section className="lg:col-span-7 lammah-card rounded-[24px] p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-700 dark:text-violet-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                سجل حوكمة وإجراءات وكيل لمّاح
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
              آخر {Math.min(5, db.agentActionLogs.length)} عمليات
            </span>
          </div>

          {db.agentActionLogs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              لا توجد إجراءات مسجلة للوكيل بعد.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {db.agentActionLogs.slice(0, 5).map((log) => (
                <li
                  key={log.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-violet-700 dark:text-violet-400 font-semibold">
                      {log.toolName}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {log.summary}
                    </p>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
