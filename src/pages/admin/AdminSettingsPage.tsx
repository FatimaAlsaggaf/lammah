import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, RotateCcw, Save, Settings } from 'lucide-react';
import { useLammah } from '../../context/LammahContext';

export function AdminSettingsPage() {
  const { db, saveSettings, resetAllDemoData } = useLammah();
  const [daysBefore, setDaysBefore] = useState<number>(db.settings.renewalPromptDaysBefore);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(daysBefore);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          الإعدادات الأساسية للجمعية
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          ضبط نافذة تقييم التجديد وإدارة بيانات العرض التجريبي.
        </p>
      </div>

      {/* Renewal Window Setting */}
      <form onSubmit={handleSave} className="lammah-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            إعدادات تجربة التقييم قبل التجديد
          </h3>
        </div>

        <div>
          <label
            htmlFor="renewal-days-input"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
          >
            إظهار تنبيه التقييم التفاعلي قبل تاريخ انتهاء العضوية بـ (أيام)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="renewal-days-input"
              type="number"
              min={7}
              max={90}
              value={daysBefore}
              onChange={(e) => setDaysBefore(Number(e.target.value))}
              className="w-28 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-white"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              يومًا قبل موعد التجديد (من 7 إلى 90 يومًا)
            </span>
          </div>
        </div>

        <div className="pt-2">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </motion.button>
        </div>
      </form>

      {/* Architecture & Future Supabase Readiness Card */}
      <section className="lammah-card rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-violet-700 dark:text-violet-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            حالة التخزين والاستعداد للربط المستقبلي مع Supabase
          </h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {db.settings.demoModeNotice}
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pr-4 leading-relaxed">
          <li>
            التخزين المحلي (LocalStorage) مؤقت داخل هذا المتصفح فقط، وليس قاعدة بيانات مشتركة أو
            آمنة للإنتاج.
          </li>
          <li>
            تبديل الحسابات في الشريط الجانبي هو أداة عرض للهاكاثون فقط؛ عند الربط بـ Supabase سيتم
            فصل صلاحيات العضو والإدارة فعليًا عبر Supabase Auth وRow Level Security (RLS).
          </li>
          <li>
            جميع استدعاءات Gemini API تتم عبر خادم Express الآمن ولا يُكشف أي مفتاح في المتصفح.
          </li>
        </ul>
      </section>

      {/* Reset Demo Data */}
      <section className="lammah-card rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            إعادة تعيين بيانات العرض التجريبي
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            يُعيد جميع الأعضاء التجريبيين والفرص والتسجيلات والملاحظات والمقترحات إلى حالتها
            الأولية الجاهزة للعرض أمام لجنة التحكيم.
          </p>
        </div>

        {!confirmReset ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تعيين بيانات DEMO</span>
          </motion.button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
            <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              هل أنت متأكد من مسح التعديلات المحلية وإعادة البيانات التجريبية؟
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetAllDemoData();
                  setConfirmReset(false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800"
              >
                نعم، أعد التعيين
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium"
              >
                تراجع
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
