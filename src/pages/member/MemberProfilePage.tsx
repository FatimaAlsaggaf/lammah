import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays, CheckCircle2, Edit3, Mail, MapPin, Target, User } from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import { calculateMemberPoints, getMemberBadgeTier } from '../../services/analytics';
import {
  AnimatedCounter,
  LAMMAH_EASE,
  StaggerCard,
  StaggerGrid,
} from '../../components/motion/LammahMotion';

export function MemberProfilePage() {
  const { db, activeMember, setOnboardingOpen, cancelRegistration } = useLammah();

  const memberGoals = db.memberGoals.filter((g) => g.memberId === activeMember.id);
  const memberRegistrations = db.registrations.filter(
    (r) => r.memberId === activeMember.id && r.status === 'registered'
  );
  const memberAttendances = db.attendanceRecords.filter(
    (a) => a.memberId === activeMember.id && a.verified
  );
  const points = calculateMemberPoints(db.pointsTransactions, activeMember.id);
  const tier = getMemberBadgeTier(points);

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: LAMMAH_EASE }}
        className="lammah-card rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F1B35] to-[#1E3A8A] text-white flex items-center justify-center shrink-0 shadow-sm">
            <User className="w-7 h-7 text-blue-300" />
          </div>
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
              {activeMember.membershipTier}
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {activeMember.fullName}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {activeMember.jobTitle} · {activeMember.organization}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {activeMember.city}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Mail className="w-3.5 h-3.5" />
                {activeMember.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">تاريخ الانضمام</p>
            <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white mt-0.5">
              {activeMember.joinedAt}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">تاريخ التجديد القادم</p>
            <p className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white mt-0.5">
              {activeMember.renewalDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">المستوى والنقاط</p>
            <p className="font-semibold text-blue-700 dark:text-blue-400 mt-0.5">
              {tier.title} (<AnimatedCounter value={points} /> نقطة)
            </p>
          </div>
        </div>
      </motion.section>

      <StaggerGrid className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Goals & Interests */}
        <StaggerCard className="lg:col-span-6 lammah-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                الأهداف والاهتمامات
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              المجالات المختارة:
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {activeMember.interests.length > 0
                ? activeMember.interests.join(' · ')
                : 'لم يتم تحديد مجالات بعد.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              الأهداف التفصيلية:
            </p>
            {memberGoals.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                لا توجد أهداف مسجلة بعد.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {memberGoals.map((goal) => (
                  <li key={goal.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {goal.title}
                    </p>
                    {goal.customDescription && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {goal.customDescription}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </StaggerCard>

        {/* Registrations & Verified Attendance */}
        <StaggerCard className="lg:col-span-6 lammah-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-violet-700 dark:text-violet-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              سجل التسجيلات والحضور التجريبي
            </h3>
          </div>

          {memberRegistrations.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              لا توجد تسجيلات نشطة في الفعاليات حتى الآن.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {memberRegistrations.map((reg) => {
                const opp = db.opportunities.find((o) => o.id === reg.opportunityId);
                const verified = memberAttendances.some((a) => a.registrationId === reg.id);
                return (
                  <li
                    key={reg.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {opp?.title ?? 'فعالية'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {opp?.date} · {opp?.attendanceMode} ·{' '}
                        {verified ? 'تم اعتماد الحضور' : 'بانتظار اعتماد الحضور'}
                      </p>
                    </div>
                    {verified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>معتمد</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => cancelRegistration(reg.id)}
                        className="text-xs font-medium text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 whitespace-nowrap shrink-0"
                      >
                        إلغاء
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </StaggerCard>
      </StaggerGrid>
    </div>
  );
}
