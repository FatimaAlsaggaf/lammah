import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Edit3,
  Heart,
  Lightbulb,
  Lock,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import type { StickyNote, StickyNoteType } from '../../types/domain';
import { LAMMAH_EASE, LAMMAH_SPRING } from '../../components/motion/LammahMotion';

const NOTE_META: Record<
  StickyNoteType,
  {
    label: string;
    cardClass: string;
    tapeClass: string;
    accentText: string;
    icon: React.ComponentType<{ className?: string }>;
    placeholder: string;
  }
> = {
  liked: {
    label: 'أعجبني',
    cardClass:
      'bg-[#ecfdf5] dark:bg-emerald-950/45 border-emerald-200/90 dark:border-emerald-800/70',
    tapeClass: 'bg-emerald-400/55 dark:bg-emerald-500/45',
    accentText: 'text-emerald-800 dark:text-emerald-300',
    icon: Heart,
    placeholder: 'شاركنا تجربة أو ورشة أو خدمة أعجبتك في الجمعية...',
  },
  suggest: {
    label: 'أقترح',
    cardClass:
      'bg-[#eff6ff] dark:bg-sky-950/45 border-sky-200/90 dark:border-sky-800/70',
    tapeClass: 'bg-sky-400/55 dark:bg-sky-500/45',
    accentText: 'text-sky-900 dark:text-sky-300',
    icon: Lightbulb,
    placeholder: 'ما الفكرة أو الورشة أو التحسين الذي تقترحه للجمعية؟',
  },
  issue: {
    label: 'واجهتني مشكلة',
    cardClass:
      'bg-[#fffbeb] dark:bg-amber-950/45 border-amber-200/90 dark:border-amber-800/70',
    tapeClass: 'bg-amber-400/60 dark:bg-amber-500/45',
    accentText: 'text-amber-900 dark:text-amber-300',
    icon: AlertTriangle,
    placeholder: 'صف التحدي أو نقطة الاحتكاك التي واجهتها لتعالجها الإدارة...',
  },
};

export function StickyNotesBoardPage() {
  const { db, activeMember, addStickyNote, updateStickyNote, deleteStickyNote } = useLammah();

  const [filterType, setFilterType] = useState<'all' | StickyNoteType>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StickyNote | null>(null);

  const [noteType, setNoteType] = useState<StickyNoteType>('suggest');
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');

  // Privacy by default: member only sees their own sticky notes
  const myNotes = db.stickyNotes.filter((n) => n.memberId === activeMember.id);
  const visibleNotes =
    filterType === 'all' ? myNotes : myNotes.filter((n) => n.type === filterType);

  const openNewComposer = (presetType: StickyNoteType = 'suggest') => {
    setEditingNote(null);
    setNoteType(presetType);
    setTopic('');
    setContent('');
    setFormError('');
    setComposerOpen(true);
  };

  const openEditComposer = (note: StickyNote) => {
    setEditingNote(note);
    setNoteType(note.type);
    setTopic(note.topic);
    setContent(note.content);
    setFormError('');
    setComposerOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      setFormError('يرجى كتابة ملاحظة واضحة (5 أحرف على الأقل).');
      return;
    }

    if (editingNote) {
      updateStickyNote(editingNote.id, noteType, topic, content);
    } else {
      addStickyNote(noteType, topic, content);
    }
    setComposerOpen(false);
    setEditingNote(null);
    setTopic('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            مساحة تعبير خاصة ومباشرة مع إدارة الجمعية
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            لوحة الملاحظات التفاعلية (Sticky Notes)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              خصوصية افتراضية: ملاحظاتك خاصة بينك وبين الإدارة فقط، ولا تظهر لبقية الأعضاء.
            </span>
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openNewComposer('suggest')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-600/20 transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ملاحظة جديدة</span>
        </motion.button>
      </div>

      {/* Studio Whiteboard Frame with Integrated Toolbar */}
      <section
        aria-label="مساحة بطاقات الملاحظات"
        className="lammah-card rounded-[26px] overflow-hidden"
      >
        {/* Integrated Board Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/65 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div
            role="group"
            aria-label="تصفية ملاحظاتك حسب النوع"
            className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 rounded-xl w-fit max-w-full overflow-x-auto"
          >
            {(
              [
                { id: 'all', label: `الكل (${myNotes.length})` },
                {
                  id: 'liked',
                  label: `أعجبني (${myNotes.filter((n) => n.type === 'liked').length})`,
                },
                {
                  id: 'suggest',
                  label: `أقترح (${myNotes.filter((n) => n.type === 'suggest').length})`,
                },
                {
                  id: 'issue',
                  label: `مشكلة (${myNotes.filter((n) => n.type === 'issue').length})`,
                },
              ] as const
            ).map((tab) => {
              const active = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sticky-filter-pill"
                      transition={LAMMAH_SPRING}
                      className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(['liked', 'suggest', 'issue'] as StickyNoteType[]).map((t) => {
              const meta = NOTE_META[t];
              const Icon = meta.icon;
              return (
                <motion.button
                  key={t}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => openNewComposer(t)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${meta.cardClass} ${meta.accentText} hover:brightness-95 dark:hover:brightness-110`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>+ {meta.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Dotted Canvas Area */}
        <div className="whiteboard-canvas min-h-[400px] p-5 sm:p-8 overflow-hidden">
          {visibleNotes.length === 0 ? (
            <div className="h-[320px] flex flex-col items-center justify-center text-center">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                لوحتك جاهزة لأول بطاقة ملاحظة
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                أضف ما أعجبك في فعاليات الجمعية، أو اقترح موضوعًا جديدًا، أو بلّغ عن أي نقطة احتكاك
                بسرعة.
              </p>
              <button
                type="button"
                onClick={() => openNewComposer('suggest')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                <span>أضف أول Sticky Note</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {visibleNotes.map((note, index) => {
                  const meta = NOTE_META[note.type];
                  const Icon = meta.icon;
                  const initialTilt = index % 3 === 0 ? -0.8 : index % 3 === 1 ? 0.7 : 0;

                  return (
                    <motion.article
                      key={note.id}
                      layout
                      initial={{ opacity: 0, scale: 0.92, y: 12, rotate: initialTilt }}
                      animate={{ opacity: 1, scale: 1, y: 0, rotate: initialTilt }}
                      exit={{ opacity: 0, scale: 0.9, y: -8 }}
                      whileHover={{ y: -4, rotate: 0 }}
                      transition={LAMMAH_SPRING}
                      className={`${meta.cardClass} relative border rounded-2xl p-5 pt-6 shadow-sm hover:shadow-lg hover:shadow-slate-950/10 flex flex-col justify-between min-h-[220px]`}
                    >
                      {/* Tactile Top Adhesive Tape Strip */}
                      <span
                        aria-hidden="true"
                        className={`absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-sm ${meta.tapeClass} backdrop-blur-xs shadow-xs`}
                      />

                      <div>
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/8 dark:border-white/10">
                          <div
                            className={`flex items-center gap-1.5 text-xs font-bold min-w-0 ${meta.accentText}`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="shrink-0">{meta.label}</span>
                            <span aria-hidden="true" className="opacity-40">
                              ·
                            </span>
                            <span className="font-medium opacity-90 truncate">{note.topic}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditComposer(note)}
                              aria-label={`تعديل ملاحظة ${note.topic}`}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteStickyNote(note.id)}
                              aria-label={`حذف ملاحظة ${note.topic}`}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-slate-800 dark:text-slate-100 mt-3.5 leading-relaxed whitespace-pre-line">
                          {note.content}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-black/6 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>خاصة للإدارة</span>
                        </span>
                        <span className="tabular-nums">
                          {new Date(note.updatedAt).toLocaleDateString('ar-SA', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Sticky Note Composer / Editor Modal */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            key="sticky-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sticky-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: LAMMAH_EASE }}
              className="bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3
                  id="sticky-modal-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  {editingNote ? 'تعديل بطاقة الملاحظة' : 'إضافة Sticky Note جديدة'}
                </h3>
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  aria-label="إغلاق نافذة الملاحظة"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="p-6 space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    نوع الملاحظة
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['liked', 'suggest', 'issue'] as StickyNoteType[]).map((t) => {
                      const meta = NOTE_META[t];
                      const Icon = meta.icon;
                      const active = noteType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNoteType(t)}
                          aria-pressed={active}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                            active
                              ? `${meta.cardClass} ${meta.accentText} ring-2 ring-slate-900/15 dark:ring-white/20`
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="sticky-topic-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    الموضوع أو الفعالية المرتبطة
                  </label>
                  <input
                    id="sticky-topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثال: الورش التطبيقية، التواصل المهني، تجربة البوابة..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sticky-content-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    نص الملاحظة
                  </label>
                  <textarea
                    id="sticky-content-input"
                    rows={4}
                    value={content}
                    onChange={(e) => {
                      setFormError('');
                      setContent(e.target.value);
                    }}
                    placeholder={NOTE_META[noteType].placeholder}
                    className={`w-full rounded-xl border px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${NOTE_META[noteType].cardClass}`}
                  />
                </div>

                {formError && (
                  <p
                    role="alert"
                    className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2"
                  >
                    {formError}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>تُحفظ بشكل خاص للإدارة</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      إلغاء
                    </button>
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.97 }}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                    >
                      {editingNote ? 'حفظ التعديل' : 'تثبيت على اللوحة'}
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
