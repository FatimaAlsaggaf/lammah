import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, MapPin, Plus, Users, X } from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import { getOpportunityRegistrationCount } from '../../services/analytics';
import type { AttendanceMode, OpportunityCategory } from '../../types/domain';
import { TOPIC_SUGGESTIONS } from '../../data/seed';
import { LAMMAH_EASE } from '../../components/motion/LammahMotion';

export function AdminOpportunitiesPage() {
  const { db, addOpportunity } = useLammah();
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState<OpportunityCategory>('ورشة عمل');
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>('هجين');
  const [date, setDate] = useState('2027-01-25');
  const [time, setTime] = useState('07:00 مساءً — 09:00 مساءً');
  const [location, setLocation] = useState('الرياض — حضور مباشر وعن بُعد');
  const [capacity, setCapacity] = useState(40);
  const [selectedTag, setSelectedTag] = useState(TOPIC_SUGGESTIONS[0]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortDescription.trim()) return;

    addOpportunity({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullDetails: shortDescription.trim(),
      category,
      tags: [selectedTag],
      date,
      time,
      location: location.trim(),
      attendanceMode,
      capacity: Math.max(5, Number(capacity) || 40),
      requirements: 'فرصة عرض تجريبية (DEMO) لأعضاء الجمعية.',
      imageVariant: category === 'تطوع مهني' ? 'volunteering' : 'workshop',
      pointsRewardType: category === 'تطوع مهني' ? 'volunteer_activity' : 'event_attendance',
    });

    setTitle('');
    setShortDescription('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            إدارة الفعاليات والفرص التجريبية
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            استعراض جميع الفرص المنشورة في بوابة العضو، بما فيها المبادرات المنشورة من مقترحات
            وكيل لمّاح.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-600/20 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فعالية تجريبية</span>
        </motion.button>
      </div>

      {/* High-density SaaS Table */}
      <div className="lammah-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">الفعالية / الفرصة</th>
                <th className="py-3.5 px-4 font-semibold">التصنيف والحضور</th>
                <th className="py-3.5 px-4 font-semibold">التاريخ والمكان</th>
                <th className="py-3.5 px-4 font-semibold">التسجيلات</th>
                <th className="py-3.5 px-4 font-semibold">الحضور المعتمد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {db.opportunities.map((opp) => {
                const regs = getOpportunityRegistrationCount(db, opp.id);
                const verified = db.attendanceRecords.filter(
                  (a) => a.opportunityId === opp.id && a.verified
                ).length;

                return (
                  <tr
                    key={opp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">{opp.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {opp.sourceProposalId ? 'مبادرة من مقترح لمّاح · ' : ''}
                        {opp.tags.join(' · ')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700 dark:text-slate-200">
                      <p className="font-medium">{opp.category}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {opp.attendanceMode}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-1 font-mono tabular-nums">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {opp.date}
                      </p>
                      <p className="flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {opp.location}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-xs text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {regs} / {opp.capacity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {verified}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Opportunity Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="add-opp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-opp-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: LAMMAH_EASE }}
              className="bg-white dark:bg-[#0e172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg my-8 overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 id="add-opp-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  نشر فعالية أو فرصة تجريبية جديدة
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="إغلاق نافذة إضافة فعالية"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="new-opp-title"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    عنوان الفرصة
                  </label>
                  <input
                    id="new-opp-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: ورشة تصميم تجربة المستفيد في التطبيقات الحكومية"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-opp-desc"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    وصف مختصر
                  </label>
                  <textarea
                    id="new-opp-desc"
                    rows={3}
                    required
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="new-opp-cat"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      التصنيف
                    </label>
                    <select
                      id="new-opp-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="ورشة عمل">ورشة عمل</option>
                      <option value="لقاء حواري">لقاء حواري</option>
                      <option value="تطوع مهني">تطوع مهني</option>
                      <option value="تواصل مهني">تواصل مهني</option>
                      <option value="إرشاد وتطوير">إرشاد وتطوير</option>
                      <option value="فرصة مهنية">فرصة مهنية</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="new-opp-mode"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      طريقة الحضور
                    </label>
                    <select
                      id="new-opp-mode"
                      value={attendanceMode}
                      onChange={(e) => setAttendanceMode(e.target.value as AttendanceMode)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="هجين">هجين</option>
                      <option value="حضوري">حضوري</option>
                      <option value="عن بُعد">عن بُعد</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="new-opp-topic"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      المجال المرتبط
                    </label>
                    <select
                      id="new-opp-topic"
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      {TOPIC_SUGGESTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="new-opp-date"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      التاريخ
                    </label>
                    <input
                      id="new-opp-date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-opp-location"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      المكان
                    </label>
                    <input
                      id="new-opp-location"
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-opp-cap"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      السعة
                    </label>
                    <input
                      id="new-opp-cap"
                      type="number"
                      min={5}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    إلغاء
                  </button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                  >
                    نشر الفرصة التجريبية
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
