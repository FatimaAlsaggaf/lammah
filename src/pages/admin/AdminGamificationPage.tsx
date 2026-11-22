import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle2, ShieldCheck, Sliders } from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import { calculateMemberPoints } from '../../services/analytics';
import type { PointsRuleKey } from '../../types/domain';
import { AnimatedCounter } from '../../components/motion/LammahMotion';

export function AdminGamificationPage() {
  const { db, verifyAttendance, updatePointsRule } = useLammah();
  const [editingRuleValues, setEditingRuleValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const r of db.pointsRules) {
      map[r.key] = r.points;
    }
    return map;
  });

  const activeRegistrations = db.registrations.filter((r) => r.status === 'registered');

  const isRegistrationVerified = (registrationId: string) =>
    db.attendanceRecords.some((a) => a.registrationId === registrationId && a.verified);

  const handleSaveRule = (ruleKey: PointsRuleKey, enabled: boolean) => {
    const val = editingRuleValues[ruleKey] ?? 0;
    updatePointsRule(ruleKey, val, enabled);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          اعتماد الحضور وقواعد نقاط المشاركة
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          لا تُحتسب نقاط حضور لأي عضو بمجرد التسجيل؛ تُمنح النقاط فقط بعد اعتماد الإدارة لحضوره
          الفعلي هنا، مع منع التكرار تلقائيًا.
        </p>
      </div>

      {/* Attendance Verification Table */}
      <section className="lammah-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              قائمة التسجيلات واعتماد الحضور التجريبي
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {activeRegistrations.length} تسجيل نشط
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">العضو</th>
                <th className="py-3.5 px-4 font-semibold">الفعالية</th>
                <th className="py-3.5 px-4 font-semibold">نوع النقاط</th>
                <th className="py-3.5 px-4 font-semibold">رصيد العضو الحالي</th>
                <th className="py-3.5 px-4 font-semibold">حالة الحضور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {activeRegistrations.map((reg) => {
                const member = db.members.find((m) => m.id === reg.memberId);
                const opp = db.opportunities.find((o) => o.id === reg.opportunityId);
                const verified = isRegistrationVerified(reg.id);
                const rule = db.pointsRules.find(
                  (r) => r.key === (opp?.pointsRewardType ?? 'event_attendance')
                );
                const memberPts = calculateMemberPoints(db.pointsTransactions, reg.memberId);

                return (
                  <tr
                    key={reg.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {member?.fullName ?? reg.memberId}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{member?.city}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {opp?.title ?? reg.opportunityId}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {opp?.date}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {rule?.label} ({rule?.enabled ? `${rule.points} نقطة` : 'معطّل'})
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      <AnimatedCounter value={memberPts} /> نقطة
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {verified ? (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تم اعتماد الحضور</span>
                        </motion.span>
                      ) : (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => verifyAttendance(reg.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>اعتماد الحضور ومنح النقاط</span>
                        </motion.button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Configurable Demo Points Rules */}
      <section className="lammah-card rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-violet-700 dark:text-violet-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                قواعد احتساب النقاط القابلة للتعديل (إعدادات DEMO)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                هذه القيم إعدادات عرض تجريبية للتقدير الرمزي وليست سياسة رسمية معتمدة من الجمعية.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {db.pointsRules.map((rule) => (
            <div
              key={rule.key}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{rule.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {rule.description}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => handleSaveRule(rule.key, e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>مفعّل</span>
                </label>

                <input
                  type="number"
                  min={0}
                  max={200}
                  aria-label={`قيمة نقاط ${rule.label}`}
                  value={editingRuleValues[rule.key] ?? rule.points}
                  onChange={(e) =>
                    setEditingRuleValues((prev) => ({
                      ...prev,
                      [rule.key]: Number(e.target.value),
                    }))
                  }
                  className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono tabular-nums text-center text-slate-900 dark:text-white"
                />

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSaveRule(rule.key, rule.enabled)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-blue-700 whitespace-nowrap"
                >
                  حفظ القاعدة
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
