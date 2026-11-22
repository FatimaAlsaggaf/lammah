import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { GOAL_CATEGORY_OPTIONS, TOPIC_SUGGESTIONS } from '../data/seed';
import { useLammah } from '../context/LammahContext';
import type { GoalCategory } from '../types/domain';
import { AnimatedProgressBar, LAMMAH_EASE, LammahOrb } from './motion/LammahMotion';

export function OnboardingModal() {
  const { db, activeMember, onboardingOpen, setOnboardingOpen, saveGoals } = useLammah();

  const existingGoals = db.memberGoals.filter((g) => g.memberId === activeMember.id);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategories, setSelectedCategories] = useState<GoalCategory[]>(() =>
    existingGoals.length > 0
      ? Array.from(new Set(existingGoals.map((g) => g.category)))
      : ['professional_skills']
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() =>
    activeMember.interests.length > 0
      ? activeMember.interests
      : ['الذكاء الاصطناعي في تجربة العميل', 'تصميم رحلة العميل']
  );
  const [customGoalText, setCustomGoalText] = useState<string>(
    existingGoals[0]?.customDescription ?? ''
  );
  const [validationError, setValidationError] = useState('');

  const toggleCategory = (cat: GoalCategory) => {
    setValidationError('');
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleNext = () => {
    if (selectedCategories.length === 0) {
      setValidationError('اختر هدفًا واحدًا على الأقل لنخصص لك رحلتك.');
      return;
    }
    setValidationError('');
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0 && !customGoalText.trim()) {
      setValidationError('اختر هدفًا واحدًا على الأقل أو اكتب هدفك الخاص لنخصص لك التجربة.');
      return;
    }
    saveGoals(selectedCategories, customGoalText, selectedTopics);
    setStep(1);
  };

  return (
    <AnimatePresence>
      {onboardingOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.26, ease: LAMMAH_EASE }}
            className="bg-white dark:bg-[#0e172a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-[#0F1B35] via-[#132347] to-[#1E1B4B] text-white px-6 py-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <LammahOrb state="idle" size="md" />
                <div>
                  <p className="text-xs text-blue-300 font-medium">
                    أهلًا بك يا {activeMember.fullName} · الخطوة {step} من 2
                  </p>
                  <h2 id="onboarding-title" className="text-xl font-bold text-balance mt-0.5">
                    وش هدفك من الانضمام للجمعية؟
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    اختيارك يوجّه وكيل لمّاح لترشيح الفرص الأنسب واقتراح مبادرات جديدة تلبي اهتماماتك.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOnboardingOpen(false)}
                aria-label="إغلاق نافذة تحديد الأهداف"
                className="p-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-4">
              <AnimatedProgressBar percent={step === 1 ? 50 : 100} heightClass="h-1.5" />
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22, ease: LAMMAH_EASE }}
                    className="space-y-4"
                  >
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">
                      1. اختر أهدافك الأساسية (يمكنك اختيار أكثر من هدف)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {GOAL_CATEGORY_OPTIONS.map((option) => {
                        const selected = selectedCategories.includes(option.key);
                        return (
                          <motion.button
                            key={option.key}
                            whileTap={{ scale: 0.985 }}
                            type="button"
                            onClick={() => toggleCategory(option.key)}
                            aria-pressed={selected}
                            className={`flex items-start gap-3 p-3.5 rounded-2xl border text-right transition-colors ${
                              selected
                                ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 dark:border-blue-500 text-slate-900 dark:text-white'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <span
                              className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                                selected
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                              }`}
                            >
                              {selected && <Check className="w-3.5 h-3.5" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{option.label}</span>
                              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                {option.description}
                              </span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22, ease: LAMMAH_EASE }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2.5">
                        2. المجالات التي تهمك في تجربة العميل
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TOPIC_SUGGESTIONS.map((topic) => {
                          const active = selectedTopics.includes(topic);
                          return (
                            <motion.button
                              key={topic}
                              whileTap={{ scale: 0.96 }}
                              type="button"
                              onClick={() => toggleTopic(topic)}
                              aria-pressed={active}
                              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                                active
                                  ? 'bg-violet-700 border-violet-700 text-white shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              {topic}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="custom-goal-input"
                        className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5"
                      >
                        3. أضف وصفًا حرًا لهدفك (اختياري)
                      </label>
                      <textarea
                        id="custom-goal-input"
                        rows={3}
                        value={customGoalText}
                        onChange={(e) => {
                          setValidationError('');
                          setCustomGoalText(e.target.value);
                        }}
                        placeholder="مثال: أرغب في تعلم تطبيقات الذكاء الاصطناعي في تجربة العميل وبناء مشروع عملي مع ممارسين..."
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {validationError && (
                <p
                  role="alert"
                  className="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-2.5"
                >
                  {validationError}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    تخطي الآن
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>
                )}

                {step === 1 ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <span>متابعة وتحديد المجالات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-l from-blue-600 to-violet-600 text-white hover:brightness-110 transition-all shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>حفظ الأهداف وتفعيل توصيات لمّاح</span>
                  </motion.button>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
