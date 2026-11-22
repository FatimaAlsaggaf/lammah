import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  ClipboardCheck,
  Heart,
  Lightbulb,
  Loader2,
  Sparkles,
  Star,
} from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import { requestFeedbackSummary } from '../../services/agentClient';
import type { RenewalIntent, StickyNoteType } from '../../types/domain';
import {
  LAMMAH_EASE,
  LAMMAH_SPRING,
  ThinkingSkeleton,
} from '../../components/motion/LammahMotion';

const INTENT_LABELS: Record<RenewalIntent, { label: string; tone: string }> = {
  definitely_renew: { label: 'سيجدد بالتأكيد', tone: 'text-emerald-700 dark:text-emerald-400' },
  likely_renew: { label: 'يميل للتجديد', tone: 'text-blue-700 dark:text-blue-400' },
  unsure: { label: 'لم يقرر بعد', tone: 'text-amber-700 dark:text-amber-400' },
  not_renewing: { label: 'لا ينوي التجديد', tone: 'text-rose-700 dark:text-rose-400' },
};

const NOTE_STYLES: Record<
  StickyNoteType,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  liked: {
    label: 'أعجبني',
    bg: 'bg-emerald-50/95 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800/70',
    text: 'text-emerald-800 dark:text-emerald-300',
    icon: Heart,
  },
  suggest: {
    label: 'أقترح',
    bg: 'bg-sky-50/95 dark:bg-sky-950/35 border-sky-200 dark:border-sky-800/70',
    text: 'text-sky-900 dark:text-sky-300',
    icon: Lightbulb,
  },
  issue: {
    label: 'واجهتني مشكلة',
    bg: 'bg-amber-50/95 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800/70',
    text: 'text-amber-900 dark:text-amber-300',
    icon: AlertTriangle,
  },
};

export function AdminFeedbackPage() {
  const { db, commitDb, showToast } = useLammah();
  const [noteFilter, setNoteFilter] = useState<'all' | StickyNoteType>('all');
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const visibleNotes =
    noteFilter === 'all'
      ? db.stickyNotes
      : db.stickyNotes.filter((n) => n.type === noteFilter);

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await requestFeedbackSummary(db);
      commitDb(res.updatedDb);
      showToast('تم تلخيص ملاحظات الأعضاء واقتراح جوانب التحسين عبر Gemini بنجاح.');
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : 'تعذر تلخيص الملاحظات حاليًا.'
      );
    } finally {
      setSummarizing(false);
    }
  };

  const summary = db.lastFeedbackSummary;

  return (
    <div className="space-y-8">
      {/* Header + Gemini Summary Trigger */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            مراجعة ملاحظات الأعضاء وتقييمات التجديد
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            تصل جميع بطاقات Sticky Notes الخاصة إلى لوحة الإدارة هنا، مع إمكانية تلخيصها واكتشاف
            جوانب التحسين المتكررة عبر Gemini.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSummarize}
          disabled={summarizing || (db.stickyNotes.length === 0 && db.renewalFeedbacks.length === 0)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-violet-700 to-indigo-600 text-white text-sm font-semibold hover:from-violet-800 hover:to-indigo-700 disabled:opacity-60 shadow-sm shadow-violet-700/20 transition-all whitespace-nowrap shrink-0"
        >
          {summarizing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{summarizing ? 'جاري التلخيص عبر Gemini...' : 'تلخيص الملاحظات بذكاء لمّاح'}</span>
        </motion.button>
      </div>

      {summarizing && (
        <ThinkingSkeleton label="لمّاح يقرأ جميع ملاحظات الأعضاء ويستخلص الأنماط المتكررة..." />
      )}

      {summaryError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{summaryError}</span>
        </div>
      )}

      {/* Gemini Executive Summary Panel */}
      {summary && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: LAMMAH_EASE }}
          className="lammah-card border-violet-200 dark:border-violet-800/80 rounded-2xl p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-700 dark:text-violet-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ملخص لمّاح الذكي لملاحظات الأعضاء (Gemini)
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              بناءً على {summary.totalNotesAnalyzed} ملاحظة ·{' '}
              {new Date(summary.generatedAt).toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {summary.executiveSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/70 space-y-2">
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                نقاط قوة أعجبت الأعضاء
              </p>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pr-4">
                {summary.likedHighlights.length > 0 ? (
                  summary.likedHighlights.map((item, i) => <li key={i}>{item}</li>)
                ) : (
                  <li>لا توجد عناصر كافية بعد.</li>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-sky-50/80 dark:bg-sky-950/35 border border-sky-200 dark:border-sky-800/70 space-y-2">
              <p className="text-xs font-bold text-sky-900 dark:text-sky-300">
                فرص ومقترحات التحسين
              </p>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pr-4">
                {summary.improvementSuggestions.length > 0 ? (
                  summary.improvementSuggestions.map((item, i) => <li key={i}>{item}</li>)
                ) : (
                  <li>لا توجد مقترحات مسجلة بعد.</li>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/85 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800/70 space-y-2">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                مشكلات تحتاج معالجة
              </p>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pr-4">
                {summary.issuesToAddress.length > 0 ? (
                  summary.issuesToAddress.map((item, i) => <li key={i}>{item}</li>)
                ) : (
                  <li>لم تُرصد مشكلات متكررة حاليًا.</li>
                )}
              </ul>
            </div>
          </div>
        </motion.section>
      )}

      {/* Sticky Notes Review Board */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            ملاحظات الأعضاء الخاصة ({db.stickyNotes.length})
          </h3>
          <div
            role="group"
            aria-label="تصفية ملاحظات الأعضاء"
            className="flex items-center gap-1 p-1 bg-slate-200/75 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl w-fit"
          >
            {(
              [
                { id: 'all', label: 'الكل' },
                { id: 'liked', label: 'أعجبني' },
                { id: 'suggest', label: 'أقترح' },
                { id: 'issue', label: 'مشكلة' },
              ] as const
            ).map((tab) => {
              const active = noteFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setNoteFilter(tab.id)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-feedback-filter"
                      transition={LAMMAH_SPRING}
                      className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleNotes.map((note) => {
            const st = NOTE_STYLES[note.type];
            const Icon = st.icon;
            return (
              <article
                key={note.id}
                className={`${st.bg} border rounded-2xl p-5 flex flex-col justify-between gap-3 transition-transform duration-200 hover:-translate-y-0.5`}
              >
                <div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${st.text}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{st.label}</span>
                    <span aria-hidden="true" className="opacity-40">
                      ·
                    </span>
                    <span className="truncate">{note.topic}</span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-100 mt-3 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/6 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{note.memberName}</span>
                  <span className="tabular-nums">
                    {new Date(note.createdAt).toLocaleDateString('ar-SA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Renewal Feedback Table */}
      <section className="lammah-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                نتائج تقييمات العضوية ونوايا التجديد
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تُعرض هنا نوايا التجديد المسجلة من الأعضاء بوضوح منفصل عن إتمام التجديد الفعلي.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {db.renewalFeedbacks.length} استجابة
          </span>
        </div>

        {db.renewalFeedbacks.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            لم تُسجل تقييمات تجديد حتى الآن.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">العضو</th>
                  <th className="py-3.5 px-4 font-semibold">الرضا</th>
                  <th className="py-3.5 px-4 font-semibold">الاستفادة والأهداف</th>
                  <th className="py-3.5 px-4 font-semibold">نية التجديد المسجلة</th>
                  <th className="py-3.5 px-4 font-semibold">التجديد الفعلي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {db.renewalFeedbacks.map((fb) => {
                  const intentMeta = INTENT_LABELS[fb.renewalIntent];
                  return (
                    <tr
                      key={fb.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {fb.memberName}
                        </p>
                        {fb.openComment && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs line-clamp-2">
                            &quot;{fb.openComment}&quot;
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          {fb.satisfactionRating} / 5
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        <p>الاستفادة: {fb.valuePerceived}</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                          {fb.goalProgressRating}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold">
                        <span className={intentMeta.tone}>{intentMeta.label}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        غير منفّذ (نية فقط)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
