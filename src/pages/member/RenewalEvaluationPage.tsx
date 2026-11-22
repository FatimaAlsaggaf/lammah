import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Star,
} from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import { calculateMemberPoints, daysUntilRenewal } from '../../services/analytics';
import type { RenewalFeedback, RenewalIntent } from '../../types/domain';
import {
  AnimatedCounter,
  ArchitecturalGridPattern,
  LAMMAH_EASE,
  LammahOrb,
} from '../../components/motion/LammahMotion';

const DESIRED_SERVICE_OPTIONS = [
  'ورش تطبيقية في الذكاء الاصطناعي وتجربة العميل',
  'لقاءات تواصل مهني حسب القطاع والمدينة',
  'برامج إرشاد مهني فردي (Mentorship)',
  'فرص تطوع ومشاريع أثر حقيقية',
  'مكتبة قوالب وأدلة عربية لتجربة العميل',
  'مجموعات تحضير للشهادات المهنية',
];

const SATISFACTION_LABELS: Record<number, string> = {
  1: 'غير راضٍ',
  2: 'دون المتوقع',
  3: 'مقبول',
  4: 'راضٍ وجيدة جدًا',
  5: 'ممتازة وتجاوزت التوقعات',
};

const INTENT_OPTIONS: { value: RenewalIntent; title: string; subtitle: string }[] = [
  {
    value: 'definitely_renew',
    title: 'سأجدد عضويتي بالتأكيد',
    subtitle: 'التجربة أضافت لي قيمة واضحة وأتطلع للعام القادم.',
  },
  {
    value: 'likely_renew',
    title: 'أميل لتجديد العضوية',
    subtitle: 'التجربة جيدة وأتمنى توفر بعض الفرص الإضافية.',
  },
  {
    value: 'unsure',
    title: 'لم أقرر بعد',
    subtitle: 'أحتاج مزيدًا من التوضيح أو الفعاليات المرتبطة بأهدافي.',
  },
  {
    value: 'not_renewing',
    title: 'لا أنوي التجديد حاليًا',
    subtitle: 'لأسباب تتعلق بمدى ملاءمة الفرص أو الأولويات الحالية.',
  },
];

const STEP_LABELS = ['الرضا', 'القيمة', 'الأهداف', 'الخدمات', 'نية التجديد'];

export function RenewalEvaluationPage() {
  const { db, activeMember, submitRenewalEvaluation } = useLammah();

  const existingFeedback = db.renewalFeedbacks.find(
    (f) => f.memberId === activeMember.id
  );

  // Step 0 = Personal Summary, Steps 1..5 = Interactive Questions, Step 6 = Done
  const [step, setStep] = useState<number>(existingFeedback ? 6 : 0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [satisfactionRating, setSatisfactionRating] = useState<number>(
    existingFeedback?.satisfactionRating ?? 4
  );
  const [valuePerceived, setValuePerceived] = useState<RenewalFeedback['valuePerceived']>(
    existingFeedback?.valuePerceived ?? 'جيدة'
  );
  const [goalProgressRating, setGoalProgressRating] = useState<
    RenewalFeedback['goalProgressRating']
  >(existingFeedback?.goalProgressRating ?? 'تقدمت جزئيًا');
  const [desiredServices, setDesiredServices] = useState<string[]>(
    existingFeedback?.desiredServices ?? []
  );
  const [renewalIntent, setRenewalIntent] = useState<RenewalIntent>(
    existingFeedback?.renewalIntent ?? 'likely_renew'
  );
  const [openComment, setOpenComment] = useState<string>(existingFeedback?.openComment ?? '');
  const [awardedPoints, setAwardedPoints] = useState<number>(0);

  const goToStep = (nextStep: number) => {
    setDirection(nextStep >= step ? 1 : -1);
    setStep(nextStep);
  };

  // Real data summary for active member
  const memberPoints = calculateMemberPoints(db.pointsTransactions, activeMember.id);
  const memberGoals = db.memberGoals.filter((g) => g.memberId === activeMember.id);
  const memberRegistrations = db.registrations.filter(
    (r) => r.memberId === activeMember.id && r.status === 'registered'
  );
  const verifiedAttendances = db.attendanceRecords.filter(
    (a) => a.memberId === activeMember.id && a.verified
  );
  const daysLeft = daysUntilRenewal(activeMember.renewalDate);

  const toggleService = (srv: string) => {
    setDesiredServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const handleFinish = () => {
    const pts = submitRenewalEvaluation({
      memberId: activeMember.id,
      memberName: activeMember.fullName,
      satisfactionRating,
      valuePerceived,
      goalProgressRating,
      desiredServices,
      renewalIntent,
      openComment: openComment.trim() || undefined,
    });
    setAwardedPoints(pts);
    goToStep(6);
  };

  const stepVariants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, x: dir === 1 ? -18 : 18 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 1 | -1) => ({ opacity: 0, x: dir === 1 ? 18 : -18 }),
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            استبيان تفاعلي قصير قبل التجديد
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            تقييم تجربة العضوية
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            تاريخ التجديد التجريبي:{' '}
            <span className="font-mono tabular-nums">{activeMember.renewalDate}</span> (
            {daysLeft > 0 ? `متبقي ${daysLeft} يومًا` : 'مستحق قريبًا'}) · نافذة التذكير:{' '}
            {db.settings.renewalPromptDaysBefore} يومًا.
          </p>
        </div>
      </div>

      {/* Numbered 01–05 Visual Step Rail */}
      {step > 0 && step < 6 && (
        <div className="lammah-card rounded-2xl px-4 py-3.5">
          <div className="grid grid-cols-5 gap-2">
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              const isCompleted = num < step;
              const isCurrent = num === step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => goToStep(num)}
                  className="flex flex-col items-center gap-1.5 text-center group"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : `0${num}`}
                  </div>
                  <span
                    className={`text-[11px] font-medium truncate max-w-full ${
                      isCurrent
                        ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        {/* Step 0: Midnight Executive Journey Recap */}
        {step === 0 && (
          <motion.section
            key="renewal-step-0"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.26, ease: LAMMAH_EASE }}
            className="lammah-card rounded-[26px] overflow-hidden"
          >
            <div className="lammah-hero-surface text-white p-6 sm:p-8 relative overflow-hidden">
              <ArchitecturalGridPattern />
              <div className="relative flex items-start gap-4">
                <LammahOrb state="idle" size="md" />
                <div>
                  <p className="text-xs font-semibold text-sky-300">
                    ملخص رحلتك الفعلي من بياناتك المسجلة
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1">
                    إنجازاتك خلال فترة عضويتك، {activeMember.fullName}
                  </h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    قبل أن تشاركنا رأيك، إليك ملخصًا حقيقيًا لمشاركاتك وأهدافك المسجلة لدينا حتى
                    اليوم:
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200/80 dark:divide-slate-800 text-center">
                <div className="p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">الأهداف</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    <AnimatedCounter value={memberGoals.length} />
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">التسجيلات</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    <AnimatedCounter value={memberRegistrations.length} />
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">حضور معتمد</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    <AnimatedCounter value={verifiedAttendances.length} />
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">النقاط</p>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
                    <AnimatedCounter value={memberPoints} />
                  </p>
                </div>
              </div>

              {memberGoals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    أهدافك التي عملت عليها:
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
                    {memberGoals.map((g) => (
                      <li key={g.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>{g.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  يستغرق التقييم أقل من دقيقتين ويساعد الجمعية على تحسين تجربتك.
                </p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => goToStep(1)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 whitespace-nowrap shrink-0"
                >
                  <span>بدء التقييم التفاعلي</span>
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.section>
        )}

        {/* Step 1: Satisfaction Rating */}
        {step === 1 && (
          <motion.section
            key="renewal-step-1"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: LAMMAH_EASE }}
            className="lammah-card rounded-[24px] p-6 sm:p-8 space-y-6"
          >
            <div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                السؤال 01 من 05
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                ما مدى رضاك العام عن تجربتك مع الجمعية خلال هذه الفترة؟
              </h3>
            </div>

            <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
              {[1, 2, 3, 4, 5].map((rating) => {
                const selected = satisfactionRating === rating;
                return (
                  <motion.button
                    key={rating}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSatisfactionRating(rating)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl border transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Star
                      className={`w-6 h-6 transition-transform ${
                        rating <= satisfactionRating
                          ? 'fill-amber-400 text-amber-500 scale-110'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span className="text-base font-bold font-mono tabular-nums">{rating}</span>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-center text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              {SATISFACTION_LABELS[satisfactionRating]}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => goToStep(0)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowRight className="w-4 h-4" />
                <span>ملخص رحلتي</span>
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => goToStep(2)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Step 2: Perceived Value */}
        {step === 2 && (
          <motion.section
            key="renewal-step-2"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: LAMMAH_EASE }}
            className="lammah-card rounded-[24px] p-6 sm:p-8 space-y-6"
          >
            <div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                السؤال 02 من 05
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                كيف تقيّم مدى استفادتك الفعلية من العضوية والفعاليات؟
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['مرتفعة جدًا', 'جيدة', 'متوسطة', 'محدودة'] as const).map((option) => {
                const selected = valuePerceived === option;
                return (
                  <motion.button
                    key={option}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setValuePerceived(option)}
                    aria-pressed={selected}
                    className={`p-4 rounded-2xl border text-right font-semibold text-sm flex items-center justify-between gap-2 transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{option}</span>
                    {selected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => goToStep(3)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Step 3: Goal Achievement */}
        {step === 3 && (
          <motion.section
            key="renewal-step-3"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: LAMMAH_EASE }}
            className="lammah-card rounded-[24px] p-6 sm:p-8 space-y-6"
          >
            <div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                السؤال 03 من 05
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                ما مدى اقترابك من تحقيق الأهداف التي انضممت لأجلها؟
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  'حققت معظم أهدافي',
                  'تقدمت جزئيًا',
                  'لا زلت في البداية',
                  'لم أجد ما يناسبني',
                ] as const
              ).map((option) => {
                const selected = goalProgressRating === option;
                return (
                  <motion.button
                    key={option}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setGoalProgressRating(option)}
                    aria-pressed={selected}
                    className={`p-4 rounded-2xl border text-right font-semibold text-sm flex items-center justify-between gap-2 transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{option}</span>
                    {selected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => goToStep(4)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Step 4: Desired Future Services */}
        {step === 4 && (
          <motion.section
            key="renewal-step-4"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: LAMMAH_EASE }}
            className="lammah-card rounded-[24px] p-6 sm:p-8 space-y-6"
          >
            <div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                السؤال 04 من 05
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                ما الخدمات أو الفرص التي تتمنى توفرها في الفترة القادمة؟
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                يمكنك اختيار أكثر من خيار
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DESIRED_SERVICE_OPTIONS.map((srv) => {
                const active = desiredServices.includes(srv);
                return (
                  <motion.button
                    key={srv}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleService(srv)}
                    aria-pressed={active}
                    className={`p-4 rounded-2xl border text-right text-sm font-medium flex items-center justify-between gap-2 transition-all ${
                      active
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/50 text-violet-950 dark:text-violet-200 ring-1 ring-violet-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{srv}</span>
                    {active && <Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => goToStep(5)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Step 5: Renewal Intent + Optional Open Comment */}
        {step === 5 && (
          <motion.section
            key="renewal-step-5"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: LAMMAH_EASE }}
            className="lammah-card rounded-[24px] p-6 sm:p-8 space-y-6"
          >
            <div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                السؤال 05 من 05
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                ما نيتك الحالية بخصوص تجديد العضوية للعام القادم؟
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                هذا السؤال يقيس نية التجديد لأغراض تطوير التجربة ولا يُعد تنفيذًا فعليًا لعملية دفع أو
                تجديد.
              </p>
            </div>

            <div className="space-y-2.5">
              {INTENT_OPTIONS.map((opt) => {
                const selected = renewalIntent === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setRenewalIntent(opt.value)}
                    aria-pressed={selected}
                    className={`w-full p-4 rounded-2xl border text-right flex items-start justify-between gap-3 transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{opt.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {opt.subtitle}
                      </p>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="renewal-open-comment"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                هل تود إضافة رسالة أو مقترح أخير لإدارة الجمعية؟ (اختياري)
              </label>
              <textarea
                id="renewal-open-comment"
                rows={3}
                value={openComment}
                onChange={(e) => setOpenComment(e.target.value)}
                placeholder="أي ملاحظة تساعدنا على تقديم تجربة أفضل في عامك القادم..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleFinish}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-700/20"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>إرسال تقييم العضوية</span>
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Step 6: Confirmation & Clear Intent vs Actual Renewal Distinction */}
        {step === 6 && (
          <motion.section
            key="renewal-step-6"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: LAMMAH_EASE }}
            className="lammah-card rounded-[26px] overflow-hidden"
          >
            <div className="lammah-hero-surface text-white p-6 sm:p-8 relative overflow-hidden">
              <ArchitecturalGridPattern />
              <div className="relative flex items-start gap-4">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: LAMMAH_EASE }}
                  className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0"
                >
                  <CheckCircle2 className="w-6 h-6" />
                </motion.div>
                <div>
                  <p className="text-xs font-semibold text-emerald-300">تم حفظ التقييم بنجاح</p>
                  <h3 className="text-xl font-bold mt-1">
                    شكرًا لك يا {activeMember.fullName}
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    أصبحت نتيجتك متاحة الآن ضمن ملخص نتائج تقييم العضوية في لوحة إدارة الجمعية.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {awardedPoints > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>تمت إضافة {awardedPoints} نقاط مشاركة إلى رصيدك لإكمال التقييم.</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200/70 dark:divide-slate-800 text-sm">
                <div className="py-2.5 first:pt-0 flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">مستوى الرضا المسجل:</span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                    {satisfactionRating} / 5
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">نية التجديد المسجلة:</span>
                  <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                    {INTENT_OPTIONS.find((o) => o.value === renewalIntent)?.title}
                  </span>
                </div>
                <div className="py-2.5 last:pb-0 flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">
                    حالة التجديد الفعلي للعضوية:
                  </span>
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    غير منفّذ بعد (بانتظار إجراء التجديد الرسمي)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/35 border border-indigo-200/80 dark:border-indigo-800/70 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-700 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  توضيح مهم: تسجيل نيتك في التجديد هنا يساعد الجمعية على قياس الرضا والتخطيط المسبق،
                  ولا يعني إتمام عملية التجديد أو السداد الفعلي عبر بوابة دفع.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => goToStep(0)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  إعادة استعراض أو تحديث التقييم
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
