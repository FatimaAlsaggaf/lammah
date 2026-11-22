import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, CheckCircle2, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import {
  BADGE_TIERS,
  calculateMemberPoints,
  getMemberBadgeTier,
} from '../../services/analytics';
import {
  AnimatedCounter,
  ArchitecturalGridPattern,
  LAMMAH_EASE,
  LammahOrb,
  RadialRingProgress,
} from '../../components/motion/LammahMotion';

export function PointsGamificationPage() {
  const { db, activeMember, setRole, setAdminRoute } = useLammah();

  const memberTransactions = db.pointsTransactions.filter(
    (tx) => tx.memberId === activeMember.id
  );
  const totalPoints = calculateMemberPoints(db.pointsTransactions, activeMember.id);
  const currentTier = getMemberBadgeTier(totalPoints);

  const prevPointsRef = useRef(totalPoints);
  const [recentDelta, setRecentDelta] = useState<number>(0);

  useEffect(() => {
    const diff = totalPoints - prevPointsRef.current;
    prevPointsRef.current = totalPoints;
    if (diff > 0) {
      setRecentDelta(diff);
      const t = window.setTimeout(() => setRecentDelta(0), 4000);
      return () => window.clearTimeout(t);
    }
  }, [totalPoints]);

  const pendingRegistrations = db.registrations.filter(
    (r) =>
      r.memberId === activeMember.id &&
      r.status === 'registered' &&
      !db.attendanceRecords.some((a) => a.registrationId === r.id && a.verified)
  );

  return (
    <div className="space-y-7 sm:space-y-8">
      {/* Signature Midnight Membership Crest Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: LAMMAH_EASE }}
        className="lammah-hero-surface rounded-[28px] relative overflow-hidden text-white p-6 sm:p-8 shadow-xl shadow-slate-950/15"
      >
        <ArchitecturalGridPattern />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-3">
              <LammahOrb state="idle" size="sm" />
              <p className="text-xs font-semibold text-sky-300">
                برنامج تقدير المشاركة الرمزي · {activeMember.membershipTier}
              </p>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold">
                رصيدك الموثق:{' '}
                <span className="font-mono text-sky-300">
                  <AnimatedCounter value={totalPoints} />
                </span>{' '}
                نقطة
              </h2>
              <AnimatePresence>
                {recentDelta > 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{recentDelta} نقطة جديدة</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              مستواك التقديري الحالي: <strong className="text-white">{currentTier.title}</strong>.
              تعكس النقاط حضورك الفعلي المعتمد ومساهماتك التطوعية وملاحظاتك التطويرية، وهي للتقدير
              الرمزي فقط ولا تمثل مكافآت مالية أو خصومات معتمدة.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white/[0.06] border border-white/12 p-5 backdrop-blur-md flex items-center gap-5">
              <RadialRingProgress
                percent={
                  currentTier.nextTierPoints
                    ? Math.min(100, Math.round((totalPoints / currentTier.nextTierPoints) * 100))
                    : 100
                }
                size={92}
                strokeWidth={7}
                trackColor="rgba(255,255,255,0.14)"
                gradientId="gamificationCrestRing"
                fromColor="#38BDF8"
                toColor="#C084FC"
                label={`${
                  currentTier.nextTierPoints
                    ? Math.min(100, Math.round((totalPoints / currentTier.nextTierPoints) * 100))
                    : 100
                }%`}
                sublabel="للمستوى التالي"
                labelClassName="text-base font-bold text-white"
              />
              <div className="min-w-0 space-y-1.5">
                <p className="text-xs font-semibold text-sky-300">مسار التقدم الحالي</p>
                <p className="text-base font-bold text-white">{currentTier.title}</p>
                <p className="text-xs text-slate-300 leading-relaxed tabular-nums">
                  {currentTier.nextTierPoints
                    ? `تحتاج ${currentTier.pointsRemaining} نقطة إضافية للوصول إلى ${currentTier.nextTierPoints} نقطة.`
                    : 'تهانينا! حققت أعلى مستوى تقديري متاح في النموذج الأولي.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pending Attendance Clarification Banner */}
      {pendingRegistrations.length > 0 && (
        <section className="lammah-card rounded-2xl p-5 border-indigo-200/90 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-700 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                لديك {pendingRegistrations.length} تسجيلات تجريبية بانتظار اعتماد الحضور
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                التسجيل في فعالية لا يمنح نقاطًا تلقائيًا. يمكنك الانتقال إلى حساب الإدارة التجريبي
                واعتماد الحضور لمشاهدة تحديث رصيدك فورًا.
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setRole('admin');
              setAdminRoute('gamification');
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 whitespace-nowrap shrink-0"
          >
            اعتماد الحضور من لوحة الإدارة
          </motion.button>
        </section>
      )}

      {/* Connected Milestone Tier Rail */}
      <section className="lammah-card rounded-[24px] p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              مسار مستويات وشارات التقدير الرمزية
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              يتدرّج تقدير مشاركتك تلقائيًا عبر 4 مستويات مع كل نشاط معتمد
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-400 tabular-nums">
            {totalPoints} نقطة
          </span>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BADGE_TIERS.map((tier, idx) => {
            const achieved = totalPoints >= tier.minPoints;
            const isCurrent = currentTier.level === tier.level;
            return (
              <div
                key={tier.level}
                className={`relative rounded-2xl p-5 border transition-all ${
                  isCurrent
                    ? 'bg-indigo-50/75 dark:bg-indigo-950/45 border-indigo-400 dark:border-indigo-600 shadow-sm'
                    : achieved
                      ? 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-50/70 dark:bg-slate-900/35 border-slate-200/70 dark:border-slate-800/70 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : achieved
                          ? 'bg-emerald-50 dark:bg-emerald-950/55 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                    0{idx + 1} · {tier.minPoints}+
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{tier.title}</p>
                <p
                  className={`text-xs mt-1 font-medium tabular-nums ${
                    isCurrent
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : achieved
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCurrent
                    ? 'مستواك الحالي'
                    : achieved
                      ? 'تم تحقيق المستوى'
                      : `متبقي ${tier.minPoints - totalPoints} نقطة`}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ledger & Active Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 lammah-card rounded-[24px] p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            سجل اكتساب النقاط الموثق
          </h3>
          {memberTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
              لا توجد نقاط مكتسبة بعد. ستظهر هنا فور اعتماد حضورك للفعاليات أو مشاركتك التطوعية.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {memberTransactions.map((tx) => (
                <li
                  key={tx.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {tx.reason}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                      {new Date(tx.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 shrink-0">
                    +{tx.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-5 lammah-card rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-700 dark:text-violet-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              قواعد النقاط التجريبية الحالية
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            القيم أدناه قابلة للتعديل من لوحة الإدارة، مع منع احتساب النقاط المكررة لنفس النشاط.
          </p>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {db.pointsRules.map((rule) => (
              <li
                key={rule.key}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {rule.enabled && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    <span>{rule.label}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
                <span className="text-xs font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400 shrink-0">
                  {rule.enabled ? `${rule.points} نقطة` : 'معطّل'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
