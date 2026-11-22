import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Edit3,
  Send,
  Sparkles,
  StickyNote,
  Target,
} from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import {
  calculateMemberPoints,
  daysUntilRenewal,
  getMemberBadgeTier,
  isRenewalEvaluationDue,
  recommendOpportunitiesForMember,
} from '../../services/analytics';
import { OpportunityVisual } from '../../components/OpportunityVisual';
import {
  AnimatedCounter,
  ArchitecturalGridPattern,
  LAMMAH_EASE,
  LammahOrb,
  RadialRingProgress,
  StaggerCard,
  StaggerGrid,
} from '../../components/motion/LammahMotion';

export function MemberDashboardPage() {
  const {
    db,
    activeMember,
    setMemberRoute,
    setOnboardingOpen,
    openOpportunityById,
    askAgentWithPrompt,
  } = useLammah();

  const [quickAsk, setQuickAsk] = useState('');

  const memberGoals = db.memberGoals.filter((g) => g.memberId === activeMember.id);
  const memberPoints = calculateMemberPoints(db.pointsTransactions, activeMember.id);
  const badgeTier = getMemberBadgeTier(memberPoints);
  const recommendations = recommendOpportunitiesForMember(db, activeMember.id, 3);
  const leadRecommendation = recommendations[0];
  const secondaryRecommendations = recommendations.slice(1, 3);

  const activeRegistrations = db.registrations.filter(
    (r) => r.memberId === activeMember.id && r.status === 'registered'
  );
  const verifiedAttendanceCount = db.attendanceRecords.filter(
    (a) => a.memberId === activeMember.id && a.verified
  ).length;
  const memberNotesCount = db.stickyNotes.filter(
    (n) => n.memberId === activeMember.id
  ).length;

  const renewalDue = isRenewalEvaluationDue(
    activeMember,
    db.settings.renewalPromptDaysBefore
  );
  const daysLeft = daysUntilRenewal(activeMember.renewalDate);
  const hasSubmittedRenewal = db.renewalFeedbacks.some(
    (f) => f.memberId === activeMember.id
  );

  const firstName = activeMember.fullName.split(' ')[0] ?? activeMember.fullName;

  const handleQuickAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAsk.trim()) {
      setMemberRoute('agent');
      return;
    }
    askAgentWithPrompt(quickAsk.trim());
    setQuickAsk('');
  };

  return (
    <div className="space-y-7 sm:space-y-8">
      {/* Signature Midnight-Navy Companion Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: LAMMAH_EASE }}
        className="lammah-hero-surface rounded-[28px] relative overflow-hidden text-white shadow-xl shadow-slate-950/15"
      >
        <ArchitecturalGridPattern />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-12 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-7 p-6 sm:p-8 lg:p-9 items-center">
          {/* Right Narrative + Inline Quick-Ask Bar */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <p className="text-xs font-semibold text-sky-300/95 tracking-wide">
                {activeMember.membershipTier} · {activeMember.city} · عضو منذ{' '}
                <span className="tabular-nums">{activeMember.joinedAt}</span>
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white leading-[1.28] tracking-tight mt-2 text-balance">
                أهلًا {firstName}، رحلتك في تجربة العميل تبدأ من أهدافك
              </h2>
              <p className="text-sm sm:text-[15px] text-slate-300/90 mt-2.5 leading-relaxed max-w-xl">
                يقرأ لمّاح أهدافك النشطة ليرشّح لك الفعاليات الأنسب، ويجهّز التسجيل بعد موافقتك،
                ويرفع احتياجاتك غير الملباة مباشرة لإدارة الجمعية.
              </p>
            </div>

            {/* Inline Quick-Ask Lammah Agent Bar */}
            <form onSubmit={handleQuickAskSubmit} className="space-y-2.5 max-w-xl">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.08] border border-white/15 focus-within:border-sky-400/60 focus-within:bg-white/[0.11] transition-colors backdrop-blur-sm">
                <input
                  type="text"
                  value={quickAsk}
                  onChange={(e) => setQuickAsk(e.target.value)}
                  aria-label="اسأل وكيل لمّاح مباشرة"
                  placeholder="اسأل لمّاح: رشّح لي ورشة تناسب أهدافي أو اقترح مبادرة جديدة..."
                  className="flex-1 bg-transparent px-3.5 py-2 text-sm text-white placeholder:text-slate-300/75 focus:outline-none min-w-0"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-sky-400 via-blue-500 to-indigo-500 text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-blue-950/30 whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>اسأل لمّاح</span>
                </motion.button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={() =>
                    askAgentWithPrompt(
                      'حلّل أهدافي الحالية ورشّح لي أنسب 3 فرص متاحة مع سبب كل ترشيح.'
                    )
                  }
                  className="inline-flex items-center gap-1 text-sky-200 hover:text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>رشّح لي أنسب الفرص الآن</span>
                </button>
                <span className="text-white/25" aria-hidden="true">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() =>
                    askAgentWithPrompt(
                      'أرغب في تعلم تطبيقات الذكاء الاصطناعي في تجربة العميل، هل توجد ورشة مناسبة؟ وإذا لم توجد اقترحها للإدارة.'
                    )
                  }
                  className="inline-flex items-center gap-1 text-violet-200 hover:text-white transition-colors"
                >
                  <span>اقترح ورشة ذكاء اصطناعي للإدارة</span>
                </button>
                <span className="text-white/25" aria-hidden="true">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => setOnboardingOpen(true)}
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                  <span>تعديل أهدافي</span>
                </button>
              </div>
            </form>
          </div>

          {/* Left Signature Telemetry Glass Deck: LammahOrb + Radial Progress + 3 Hairline Stats */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white/[0.06] border border-white/12 p-5 sm:p-6 backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <LammahOrb state="idle" size="lg" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-sky-300/90">
                      المستوى التقديري (تجريبي)
                    </p>
                    <p className="text-lg font-bold text-white truncate mt-0.5">
                      {badgeTier.title}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5 tabular-nums">
                      {badgeTier.nextTierPoints
                        ? `متبقي ${badgeTier.pointsRemaining} نقطة للمستوى التالي`
                        : 'أعلى مستوى تقديري في النموذج'}
                    </p>
                  </div>
                </div>

                <RadialRingProgress
                  percent={
                    badgeTier.nextTierPoints
                      ? Math.min(100, Math.round((memberPoints / badgeTier.nextTierPoints) * 100))
                      : 100
                  }
                  size={74}
                  strokeWidth={6}
                  trackColor="rgba(255,255,255,0.14)"
                  gradientId="heroMemberPointsRing"
                  fromColor="#38BDF8"
                  toColor="#C084FC"
                  label={<AnimatedCounter value={memberPoints} />}
                  sublabel="نقطة"
                  labelClassName="text-base font-bold text-white"
                />
              </div>

              {/* Unified 3-Metric Hairline Strip inside Hero */}
              <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/12 pt-4 border-t border-white/12 text-center">
                <div className="px-2">
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    <AnimatedCounter value={memberGoals.length} />
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">أهداف نشطة</p>
                </div>
                <div className="px-2">
                  <p className="text-xl sm:text-2xl font-bold text-sky-300">
                    <AnimatedCounter value={activeRegistrations.length} />
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">تسجيلات فعّالة</p>
                </div>
                <div className="px-2">
                  <p className="text-xl sm:text-2xl font-bold text-emerald-300">
                    <AnimatedCounter value={verifiedAttendanceCount} />
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">حضور معتمد</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Renewal Prompt Strip (only when approaching renewal & not yet submitted) */}
      {renewalDue && !hasSubmittedRenewal && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: LAMMAH_EASE }}
          className="lammah-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-violet-200/90 dark:border-violet-800/60 bg-gradient-to-l from-violet-50/80 via-white to-indigo-50/50 dark:from-violet-950/35 dark:via-[#0d1527] dark:to-indigo-950/25"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600/12 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                موعد تجديد عضويتك يقترب ({daysLeft > 0 ? `بعد ${daysLeft} يومًا` : 'قريبًا'})
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                راجع ملخص إنجازاتك هذا العام وشاركنا تقييمك السريع في 5 خطوات قصيرة لتخصيص برامج العام القادم.
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMemberRoute('renewal')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 text-white text-xs sm:text-sm font-semibold hover:bg-violet-800 transition-colors whitespace-nowrap shrink-0"
          >
            <span>ابدأ تقييم التجديد</span>
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        </motion.section>
      )}

      {/* Editorial Asymmetric Opportunities Bento (Featured Lead + 2 Compact Horizontal Cards) */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              ترشيحات مخصّصة بالذكاء الاصطناعي
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              أبرز الفرص المتوافقة مع أهدافك
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setMemberRoute('opportunities')}
            className="text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>استكشاف كل الفرص</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {leadRecommendation && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Featured Lead Spotlight Card */}
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: LAMMAH_EASE }}
              className="lg:col-span-6 lammah-card rounded-[24px] overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-52 sm:h-56 bg-[#0F1B35] overflow-hidden">
                  <OpportunityVisual
                    variant={leadRecommendation.opportunity.imageVariant}
                    alt={leadRecommendation.opportunity.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081022]/90 via-[#081022]/25 to-transparent flex flex-col justify-between p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-sky-200 bg-[#0B152B]/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/15">
                        الترشيح الأبرز لأهدافك
                      </span>
                      <span className="text-[11px] font-semibold text-white bg-[#0B152B]/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 tabular-nums">
                        {leadRecommendation.opportunity.date}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-sky-200/90">
                        {leadRecommendation.opportunity.category} ·{' '}
                        {leadRecommendation.opportunity.attendanceMode}
                      </p>
                      <h4 className="text-lg sm:text-xl font-bold text-white leading-snug mt-1">
                        {leadRecommendation.opportunity.title}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {leadRecommendation.opportunity.shortDescription}
                  </p>
                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        لماذا يرشّحها لك لمّاح؟
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {leadRecommendation.reasons.join('، ')}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-4 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {leadRecommendation.isAttendanceVerified
                    ? 'تم اعتماد الحضور'
                    : leadRecommendation.isRegistered
                      ? 'مسجّل (تجريبي)'
                      : `${leadRecommendation.opportunity.location}`}
                </span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openOpportunityById(leadRecommendation.opportunity.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>التفاصيل والتسجيل</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.article>

            {/* Stacked Secondary Recommendations (Clean Editorial Cards without Duplicate Photos) */}
            <StaggerGrid className="lg:col-span-6 flex flex-col gap-5">
              {secondaryRecommendations.map((rec, index) => (
                <StaggerCard key={rec.opportunity.id} className="flex-1 flex">
                  <article className="lammah-card rounded-[24px] p-5 sm:p-6 flex flex-col justify-between w-full group hover:border-indigo-300/80 dark:hover:border-indigo-700/70 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-mono text-sm font-bold shrink-0">
                            0{index + 2}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                                {rec.opportunity.category}
                              </span>{' '}
                              · <span className="tabular-nums">{rec.opportunity.date}</span> ·{' '}
                              {rec.opportunity.attendanceMode}
                            </p>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                              {rec.opportunity.title}
                            </h4>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                          {rec.isAttendanceVerified
                            ? 'حضور معتمد'
                            : rec.isRegistered
                              ? 'مسجّل'
                              : 'متاح'}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {rec.opportunity.shortDescription}
                      </p>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1">
                        <span className="font-semibold text-violet-700 dark:text-violet-400">
                          سبب الترشيح:
                        </span>{' '}
                        {rec.reasons.join('، ')}.
                      </p>
                      <button
                        type="button"
                        onClick={() => openOpportunityById(rec.opportunity.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 whitespace-nowrap shrink-0 self-end sm:self-auto"
                      >
                        <span>عرض التفاصيل</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                </StaggerCard>
              ))}
            </StaggerGrid>
          </div>
        )}
      </section>

      {/* Goals Roadmap & Member Journey Hub */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Active Goals with Precision Radial Gauges */}
        <div className="lg:col-span-7 lammah-card rounded-[24px] p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  خارطة أهدافك الحالية
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  يتحدّث تقدّمك تلقائيًا مع مشاركاتك المعتمدة في الجمعية
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 whitespace-nowrap"
            >
              تعديل الأهداف
            </button>
          </div>

          {memberGoals.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">لم تحدد أهدافك بعد.</p>
              <button
                type="button"
                onClick={() => setOnboardingOpen(true)}
                className="mt-3 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                حدّد أهدافك الآن
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {memberGoals.map((goal, idx) => (
                <li
                  key={goal.id}
                  className="py-4 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {goal.title}
                      </p>
                      {goal.customDescription && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {goal.customDescription}
                        </p>
                      )}
                      {goal.topics.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          {goal.topics.join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <RadialRingProgress
                    percent={goal.progressPercent}
                    size={54}
                    strokeWidth={5}
                    gradientId={`goalRing-${goal.id}`}
                    fromColor="#2563EB"
                    toColor="#7C3AED"
                    label={`${goal.progressPercent}%`}
                    labelClassName="text-[11px] font-bold text-slate-800 dark:text-slate-100"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Member Journey Shortcuts Hub */}
        <div className="lg:col-span-5 lammah-card rounded-[24px] p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  محطات رحلتك التفاعلية
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  انتقال سريع لتجارب العضو داخل لمّاح
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              <button
                type="button"
                onClick={() => setMemberRoute('notes')}
                className="w-full py-3.5 flex items-center justify-between gap-3 text-right hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors rounded-xl px-2.5 -mx-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/45 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <StickyNote className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      لوحة الملاحظات الخاصة
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {memberNotesCount > 0
                        ? `لديك ${memberNotesCount} ملاحظات مرسلة لإدارة الجمعية`
                        : 'شاركنا ما أعجبك أو مقترحك عبر Sticky Notes'}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setMemberRoute('points')}
                className="w-full py-3.5 flex items-center justify-between gap-3 text-right hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors rounded-xl px-2.5 -mx-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      سجل النقاط والشارات
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      رصيدك الحالي <span className="tabular-nums">{memberPoints}</span> نقطة ·{' '}
                      {badgeTier.title}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setMemberRoute('renewal')}
                className="w-full py-3.5 flex items-center justify-between gap-3 text-right hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors rounded-xl px-2.5 -mx-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
                    {hasSubmittedRenewal ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <CalendarDays className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      تقييم التجديد السنوي
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {hasSubmittedRenewal
                        ? 'تم حفظ تقييمك — اضغط لمراجعة ملخص رحلتك'
                        : 'استعرض إنجازات العام وقيّم تجربتك في دقيقتين'}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 leading-relaxed">
            سياسة النقاط: التسجيل في الفعالية لا يمنح نقاطًا تلقائيًا؛ تُضاف النقاط فور اعتماد حضورك
            الفعلي من إدارة الجمعية.
          </p>
        </div>
      </section>
    </div>
  );
}
