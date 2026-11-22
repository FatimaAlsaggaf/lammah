import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useLammah } from '../../context/LammahContext';
import {
  getOpportunityRegistrationCount,
  normalizeArabic,
  recommendOpportunitiesForMember,
} from '../../services/analytics';
import type { AttendanceMode, Opportunity, OpportunityCategory } from '../../types/domain';
import { OpportunityVisual } from '../../components/OpportunityVisual';
import {
  ArchitecturalGridPattern,
  LAMMAH_EASE,
  LAMMAH_SPRING,
  StaggerCard,
  StaggerGrid,
} from '../../components/motion/LammahMotion';

const CATEGORY_FILTERS: ('الكل' | OpportunityCategory)[] = [
  'الكل',
  'ورشة عمل',
  'لقاء حواري',
  'تطوع مهني',
  'تواصل مهني',
  'إرشاد وتطوير',
  'فرصة مهنية',
];

const MODE_FILTERS: ('الكل' | AttendanceMode)[] = ['الكل', 'حضوري', 'عن بُعد', 'هجين'];

export function OpportunitiesPage() {
  const {
    db,
    activeMember,
    focusedOpportunityId,
    setFocusedOpportunityId,
    registerOpportunity,
    cancelRegistration,
  } = useLammah();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'الكل' | OpportunityCategory>('الكل');
  const [selectedMode, setSelectedMode] = useState<'الكل' | AttendanceMode>('الكل');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [confirmingRegistration, setConfirmingRegistration] = useState(false);

  // Open detail modal automatically when navigated from Dashboard or AI Agent cards
  useEffect(() => {
    if (!focusedOpportunityId) return;
    const match = db.opportunities.find((o) => o.id === focusedOpportunityId);
    if (match) {
      setSelectedOpp(match);
      setConfirmingRegistration(false);
    }
    setFocusedOpportunityId(null);
  }, [focusedOpportunityId, db.opportunities, setFocusedOpportunityId]);

  const allRecommendations = useMemo(
    () => recommendOpportunitiesForMember(db, activeMember.id, db.opportunities.length),
    [db, activeMember.id]
  );

  const isUnfiltered =
    !searchQuery.trim() && selectedCategory === 'الكل' && selectedMode === 'الكل';

  const filtered = useMemo(() => {
    const q = normalizeArabic(searchQuery);
    return allRecommendations.filter((rec) => {
      const opp = rec.opportunity;
      if (selectedCategory !== 'الكل' && opp.category !== selectedCategory) return false;
      if (selectedMode !== 'الكل' && opp.attendanceMode !== selectedMode) return false;
      if (!q) return true;
      const hay = normalizeArabic(
        `${opp.title} ${opp.shortDescription} ${opp.location} ${opp.tags.join(' ')}`
      );
      return hay.includes(q);
    });
  }, [allRecommendations, searchQuery, selectedCategory, selectedMode]);

  const topSpotlight = isUnfiltered ? filtered[0] : undefined;
  const gridItems = topSpotlight ? filtered.slice(1) : filtered;

  const getActiveRegistrationForOpp = (opportunityId: string) =>
    db.registrations.find(
      (r) =>
        r.memberId === activeMember.id &&
        r.opportunityId === opportunityId &&
        r.status === 'registered'
    );

  const isVerifiedForOpp = (opportunityId: string) =>
    db.attendanceRecords.some(
      (a) => a.memberId === activeMember.id && a.opportunityId === opportunityId && a.verified
    );

  const handleConfirmRegister = () => {
    if (!selectedOpp) return;
    registerOpportunity(selectedOpp.id, 'portal');
    setConfirmingRegistration(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Intro */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            مرتّبة ذكيًا حسب أهدافك واهتماماتك
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            الفرص والفعاليات التجريبية
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            جميع الفعاليات المعروضة أدناه بيانات عرض تجريبية (DEMO) ولا تمثل جدولًا رسميًا معتمدًا.
          </p>
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
          إجمالي الفرص المتاحة: {filtered.length}
        </p>
      </div>

      {/* Featured Top-Match Spotlight Banner (when unfiltered) */}
      {topSpotlight && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: LAMMAH_EASE }}
          className="lammah-hero-surface rounded-[26px] overflow-hidden text-white shadow-xl shadow-slate-950/15 grid grid-cols-1 lg:grid-cols-12 items-stretch relative"
        >
          <ArchitecturalGridPattern />
          <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between gap-5 relative">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-sky-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>الأعلى توافقًا مع أهدافك · {topSpotlight.opportunity.category}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold leading-snug">
                {topSpotlight.opportunity.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                {topSpotlight.opportunity.shortDescription}
              </p>
              <p className="text-xs text-sky-200/90 pt-1">
                سبب ترشيح لمّاح: {topSpotlight.reasons.join('، ')}.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/12">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 tabular-nums">
                <span>{topSpotlight.opportunity.date}</span>
                <span aria-hidden="true">·</span>
                <span>{topSpotlight.opportunity.attendanceMode}</span>
                <span aria-hidden="true">·</span>
                <span>{topSpotlight.opportunity.location}</span>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedOpp(topSpotlight.opportunity);
                  setConfirmingRegistration(false);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-l from-sky-400 via-blue-500 to-indigo-500 text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition-all whitespace-nowrap shrink-0"
              >
                <span>التفاصيل والتسجيل</span>
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[210px] bg-[#0B152B]">
            <OpportunityVisual
              variant={topSpotlight.opportunity.imageVariant}
              alt={topSpotlight.opportunity.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#0B1426]/70 via-transparent to-transparent lg:block hidden" />
          </div>
        </motion.section>
      )}

      {/* Search & Filter Controls */}
      <div className="lammah-card rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="ابحث في الفرص والفعاليات"
              placeholder="ابحث بالعنوان أو المجال مثل: رحلة العميل، الذكاء الاصطناعي، تطوع..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 pr-10 pl-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div
            role="group"
            aria-label="تصفية حسب طريقة الحضور"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shrink-0 overflow-x-auto"
          >
            {MODE_FILTERS.map((mode) => {
              const active = selectedMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="opp-mode-active"
                      transition={LAMMAH_SPRING}
                      className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{mode}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="group"
          aria-label="تصفية حسب التصنيف"
          className="flex items-center gap-1.5 flex-wrap"
        >
          {CATEGORY_FILTERS.map((cat) => (
            <motion.button
              key={cat}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="lammah-card rounded-2xl p-10 text-center">
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            لا توجد فرص مطابقة لمعايير البحث الحالية
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            جرّب إزالة بعض الفلاتر أو اطلب من وكيل لمّاح فحص الاحتياج واقتراح ورشة جديدة للإدارة.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('الكل');
              setSelectedMode('الكل');
            }}
            className="mt-4 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 dark:bg-indigo-600 text-white hover:bg-indigo-700"
          >
            إعادة ضبط البحث
          </button>
        </div>
      ) : (
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridItems.map((rec) => {
            const opp = rec.opportunity;
            const regCount = getOpportunityRegistrationCount(db, opp.id);
            const activeReg = getActiveRegistrationForOpp(opp.id);
            const verified = isVerifiedForOpp(opp.id);

            return (
              <StaggerCard key={opp.id} className="flex">
                <article className="lammah-card rounded-[22px] overflow-hidden flex flex-col justify-between w-full group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:border-slate-700">
                  <div>
                    <div className="overflow-hidden h-36 bg-[#0F1B35]">
                      <OpportunityVisual
                        variant={opp.imageVariant}
                        alt={opp.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-5">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mb-2">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                          {opp.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{opp.attendanceMode}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{opp.date}</span>
                        {opp.sourceProposalId && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-violet-700 dark:text-violet-400">
                              مقترحة من لمّاح
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {opp.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">
                        {opp.shortDescription}
                      </p>

                      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{opp.location}</span>
                        </p>
                        <p className="flex items-center gap-1.5 tabular-nums">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            المسجلون تجريبيًا: {regCount} / {opp.capacity}
                          </span>
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>سبب ترشيح الوكيل:</span>
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {rec.reasons.join('، ')}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        verified
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : activeReg
                            ? 'text-indigo-700 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {verified
                        ? 'تم اعتماد حضورك'
                        : activeReg
                          ? 'مسجّل (تجريبي)'
                          : 'متاح للتسجيل'}
                    </span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedOpp(opp);
                        setConfirmingRegistration(false);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                      {activeReg ? 'عرض التفاصيل' : 'التفاصيل والتسجيل'}
                    </motion.button>
                  </div>
                </article>
              </StaggerCard>
            );
          })}
        </StaggerGrid>
      )}

      {/* Opportunity Detail & Explicit Confirmation Modal */}
      <AnimatePresence>
        {selectedOpp && (
          <motion.div
            key="opp-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="opp-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              key={selectedOpp.id}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.26, ease: LAMMAH_EASE }}
              className="bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-[24px] w-full max-w-xl my-8 overflow-hidden shadow-2xl"
            >
              <div className="relative h-44 bg-[#0F1B35]">
                <OpportunityVisual
                  variant={selectedOpp.imageVariant}
                  alt={selectedOpp.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
                <button
                  type="button"
                  onClick={() => setSelectedOpp(null)}
                  aria-label="إغلاق تفاصيل الفعالية"
                  className="absolute top-3 left-3 p-2 rounded-xl bg-slate-950/60 text-white hover:bg-slate-950/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 right-5 left-5 text-white">
                  <p className="text-xs text-sky-200">
                    {selectedOpp.category} · {selectedOpp.attendanceMode} · بيانات DEMO
                  </p>
                  <h3 id="opp-modal-title" className="text-lg font-bold mt-1">
                    {selectedOpp.title}
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedOpp.fullDetails}
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="tabular-nums">{selectedOpp.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{selectedOpp.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{selectedOpp.location}</span>
                  </div>
                </dl>

                {selectedOpp.requirements && (
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                      شروط وملاحظات المشاركة:
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {selectedOpp.requirements}
                    </p>
                  </div>
                )}

                {/* Registration State & Explicit Consent Step */}
                {(() => {
                  const activeReg = getActiveRegistrationForOpp(selectedOpp.id);
                  const verified = isVerifiedForOpp(selectedOpp.id);

                  if (verified) {
                    return (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>تم اعتماد حضورك لهذه الفعالية واحتساب نقاطها في رصيدك.</span>
                      </div>
                    );
                  }

                  if (activeReg) {
                    return (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 text-indigo-950 dark:text-indigo-100 text-sm">
                          <p className="font-semibold">أنت مسجّل تجريبيًا في هذه الفعالية</p>
                          <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-1">
                            تُضاف نقاط المشاركة إلى رصيدك بعد اعتماد الحضور الفعلي من لوحة إدارة الجمعية.
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              cancelRegistration(activeReg.id);
                              setSelectedOpp(null);
                            }}
                            className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300"
                          >
                            إلغاء التسجيل التجريبي
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOpp(null)}
                            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-700"
                          >
                            إغلاق
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (confirmingRegistration) {
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800/70 space-y-3"
                      >
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          تأكيد التسجيل التجريبي
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          هل تؤكد رغبتك في التسجيل التجريبي في &quot;{selectedOpp.title}&quot;؟ هذا
                          التسجيل محلي لأغراض العرض ولا يمثل حجزًا رسميًا خارجيًا، ولن تُحتسب نقاط
                          حضور إلا بعد تأكيد حضورك من الإدارة.
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleConfirmRegister}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                          >
                            نعم، أؤكد التسجيل التجريبي
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingRegistration(false)}
                            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            تراجع
                          </button>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedOpp(null)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        إغلاق
                      </button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setConfirmingRegistration(true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-600/20 transition-all"
                      >
                        التسجيل التجريبي في الفعالية
                      </motion.button>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
