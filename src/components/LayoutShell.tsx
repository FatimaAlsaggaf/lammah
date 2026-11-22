import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  Lightbulb,
  Menu,
  MessageSquareText,
  Moon,
  Settings,
  ShieldCheck,
  StickyNote,
  Sun,
  User,
  X,
} from 'lucide-react';
import { type AdminRoute, type MemberRoute, useLammah } from '../context/LammahContext';
import { calculateMemberPoints } from '../services/analytics';
import { AnimatedCounter, LAMMAH_EASE, LAMMAH_SPRING } from './motion/LammahMotion';

interface NavItem<T extends string> {
  id: T;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function LammahLogoMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="34"
          height="34"
          rx="10"
          fill="url(#lammahBg)"
        />
        <rect
          x="0.75"
          y="0.75"
          width="32.5"
          height="32.5"
          rx="9.25"
          stroke="url(#lammahBorder)"
          strokeOpacity="0.5"
          strokeWidth="1.2"
        />
        <path
          d="M17 6L23.2 14.5L17 28L10.8 14.5L17 6Z"
          fill="url(#lammahGrad)"
        />
        <path
          d="M17 11.4L20.3 15.9L17 22.4L13.7 15.9L17 11.4Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        <defs>
          <linearGradient id="lammahBg" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F1D3D" />
            <stop offset="1" stopColor="#1B1B4B" />
          </linearGradient>
          <linearGradient
            id="lammahGrad"
            x1="10.8"
            y1="6"
            x2="23.2"
            y2="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7DD3FC" />
            <stop offset="0.5" stopColor="#818CF8" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
          <linearGradient
            id="lammahBorder"
            x1="0"
            y1="0"
            x2="34"
            y2="34"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#93C5FD" />
            <stop offset="1" stopColor="#C4B5FD" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={`text-lg font-bold tracking-tight whitespace-nowrap ${
            light ? 'text-white' : 'text-[#0B152C] dark:text-white'
          }`}
        >
          لمّاح
        </span>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return name.slice(0, 2);
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const {
    db,
    role,
    theme,
    toggleTheme,
    setRole,
    memberRoute,
    setMemberRoute,
    adminRoute,
    setAdminRoute,
    activeMember,
    setActiveMemberId,
    toast,
    dismissToast,
  } = useLammah();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const memberPoints = calculateMemberPoints(db.pointsTransactions, activeMember.id);
  const newProposalsCount = db.initiativeProposals.filter(
    (p) => p.status === 'new' || p.status === 'under_review'
  ).length;

  const memberNav: NavItem<MemberRoute>[] = [
    { id: 'dashboard', label: 'الرئيسية', shortLabel: 'الرئيسية', icon: LayoutDashboard },
    { id: 'agent', label: 'وكيل لمّاح الذكي', shortLabel: 'لمّاح', icon: Bot },
    { id: 'opportunities', label: 'الفرص والفعاليات', shortLabel: 'الفرص', icon: Compass },
    { id: 'points', label: 'نقاط المشاركة', shortLabel: 'النقاط', icon: Award },
    { id: 'notes', label: 'لوحة الملاحظات', shortLabel: 'ملاحظات', icon: StickyNote },
    { id: 'renewal', label: 'تقييم التجديد', shortLabel: 'التجديد', icon: ClipboardCheck },
    { id: 'profile', label: 'الملف والأهداف', shortLabel: 'ملفي', icon: User },
  ];

  const adminNav: NavItem<AdminRoute>[] = [
    { id: 'overview', label: 'نظرة عامة', shortLabel: 'الرئيسية', icon: LayoutDashboard },
    {
      id: 'proposals',
      label: 'مقترحات الذكاء الاصطناعي',
      shortLabel: 'المقترحات',
      icon: Lightbulb,
      badge: newProposalsCount > 0 ? newProposalsCount : undefined,
    },
    { id: 'opportunities', label: 'الفعاليات والفرص', shortLabel: 'الفعاليات', icon: CalendarDays },
    { id: 'gamification', label: 'الحضور ونقاط المشاركة', shortLabel: 'النقاط', icon: Award },
    { id: 'feedback', label: 'الملاحظات والتجديد', shortLabel: 'الملاحظات', icon: MessageSquareText },
    { id: 'settings', label: 'الإعدادات الأساسية', shortLabel: 'الإعدادات', icon: Settings },
  ];

  const mobileQuickMemberNav = memberNav.slice(0, 4);
  const mobileQuickAdminNav = adminNav.slice(0, 4);

  const currentTitle =
    role === 'member'
      ? memberNav.find((n) => n.id === memberRoute)?.label ?? 'الرئيسية'
      : adminNav.find((n) => n.id === adminRoute)?.label ?? 'نظرة عامة';

  const handleSelectRole = (nextRole: 'member' | 'admin') => {
    setRole(nextRole);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#091021] text-slate-900 dark:text-slate-100 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200/80 dark:border-slate-800/80">
        <LammahLogoMark />
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="إغلاق القائمة الجانبية"
          className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Switcher (Demo Only) — Clean Studio Segmented Control */}
      <div className="px-4 pt-4 pb-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>مساحة العرض التجريبي</span>
          <span>DEMO</span>
        </div>
        <div
          role="group"
          aria-label="تبديل نوع الحساب التجريبي"
          className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0F192E] border border-slate-200/70 dark:border-slate-800"
        >
          <button
            type="button"
            onClick={() => handleSelectRole('member')}
            className={`px-2.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              role === 'member'
                ? 'bg-[#0B152C] dark:bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            بوابة العضو
          </button>
          <button
            type="button"
            onClick={() => handleSelectRole('admin')}
            className={`px-2.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              role === 'admin'
                ? 'bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            إدارة الجمعية
          </button>
        </div>

        {role === 'member' && (
          <div>
            <label
              htmlFor="demo-member-select"
              className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
            >
              العضو التجريبي النشط
            </label>
            <select
              id="demo-member-select"
              value={activeMember.id}
              onChange={(e) => setActiveMemberId(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#0F192E] border border-slate-200 dark:border-slate-700/80 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {db.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} — {m.city}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Links with smooth spring indicator */}
      <nav aria-label="التنقل الرئيسي" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {role === 'member'
          ? memberNav.map((item) => {
              const Icon = item.icon;
              const active = memberRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMemberRoute(item.id);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`relative w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-right ${
                    active
                      ? 'text-[#0B152C] dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="member-nav-indicator"
                      transition={LAMMAH_SPRING}
                      className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-indigo-500/15 border border-indigo-200/80 dark:border-indigo-400/25"
                    />
                  )}
                  <span className="relative flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                </button>
              );
            })
          : adminNav.map((item) => {
              const Icon = item.icon;
              const active = adminRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAdminRoute(item.id);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`relative w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-right ${
                    active
                      ? 'text-[#0B152C] dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav-indicator"
                      transition={LAMMAH_SPRING}
                      className="absolute inset-0 rounded-xl bg-violet-50/90 dark:bg-violet-500/15 border border-violet-200/80 dark:border-violet-400/25"
                    />
                  )}
                  <span className="relative flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active
                          ? 'text-violet-700 dark:text-violet-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="relative text-xs font-mono tabular-nums font-bold text-violet-700 dark:text-violet-200 bg-violet-100 dark:bg-violet-600/40 px-2 py-0.5 rounded-md shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
      </nav>

      {/* Account Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070C18]/80">
        {role === 'member' ? (
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B152C] to-indigo-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {getInitials(activeMember.fullName)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {activeMember.fullName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {activeMember.jobTitle}
                </p>
              </div>
            </div>
            <div className="text-left shrink-0">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                <AnimatedCounter value={memberPoints} />
              </p>
              <p className="text-[10px] text-slate-400">نقطة</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                فريق إدارة الجمعية
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                لوحة القرار التنفيذية
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex lammah-workspace-bg text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Fixed Studio Sidebar */}
      <aside className="hidden lg:block w-[262px] shrink-0 sticky top-0 h-screen border-l border-slate-200/90 dark:border-slate-800/80">
        {sidebarContent}
      </aside>

      {/* Mobile Animated Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: LAMMAH_EASE }}
              className="relative w-[284px] max-w-[85vw] h-full z-10 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Bar (Compact 56px mobile, 64px desktop) */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 bg-white/80 dark:bg-[#081021]/85 backdrop-blur-md border-b border-slate-200/75 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="فتح القائمة الجانبية"
              className="lg:hidden p-2 -mr-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap">
                {role === 'member' ? 'بوابة العضو' : 'لوحة إدارة الجمعية'}
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="text-sm sm:text-base font-bold text-[#0B152C] dark:text-white truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#0E1830] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {role === 'member' ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setMemberRoute('agent')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#0B152C] dark:bg-indigo-600 text-white hover:bg-[#152548] dark:hover:bg-indigo-500 transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                <Bot className="w-4 h-4 shrink-0 text-sky-300 dark:text-white" />
                <span>اسأل لمّاح</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setAdminRoute('proposals')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white hover:brightness-110 transition-all shadow-sm whitespace-nowrap shrink-0"
              >
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>مقترحات الوكيل ({newProposalsCount})</span>
              </motion.button>
            )}
          </div>
        </header>

        {/* Animated Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.22, ease: LAMMAH_EASE }}
              className="fixed bottom-18 lg:bottom-5 left-4 right-4 sm:right-auto sm:left-5 z-50 max-w-md bg-[#0B152C] text-white px-4 py-3.5 rounded-2xl shadow-xl border border-white/15 flex items-center gap-3"
            >
              <CheckCircle2
                className={`w-5 h-5 shrink-0 ${
                  toast.tone === 'error'
                    ? 'text-rose-400'
                    : toast.tone === 'info'
                      ? 'text-sky-400'
                      : 'text-emerald-400'
                }`}
              />
              <p className="text-sm leading-relaxed flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={dismissToast}
                aria-label="إغلاق الإشعار"
                className="text-slate-400 hover:text-white p-1 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewport Body */}
        <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-10">
          {children}
        </main>

        {/* Quiet Demo Attribution Footer */}
        <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#081021]/60 px-4 sm:px-6 lg:px-8 py-4 mt-auto mb-14 lg:mb-0">
          <div className="max-w-[1220px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <p>
              لمّاح | Lammah — نموذج أولي لجمعية تجربة العميل السعودية · جميع الفعاليات والنقاط والحسابات بيانات عرض تجريبية (DEMO).
            </p>
            <p className="whitespace-nowrap">
              حفظ محلي مؤقت · بنية جاهزة للربط مع Supabase
            </p>
          </div>
        </footer>

        {/* Mobile Bottom Quick Navigation (56px height -> total mobile sticky 112px / 844px = 13.2%) */}
        <nav
          aria-label="التنقل السريع للجوال"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white/95 dark:bg-[#091021]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 px-2"
        >
          {role === 'member'
            ? mobileQuickMemberNav.map((item) => {
                const Icon = item.icon;
                const active = memberRoute === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMemberRoute(item.id)}
                    className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                      active
                        ? 'text-indigo-700 dark:text-indigo-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {active && (
                      <span className="absolute top-0 w-8 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                    <Icon className="w-4 h-4" />
                    <span className="truncate max-w-[76px]">{item.shortLabel ?? item.label}</span>
                  </button>
                );
              })
            : mobileQuickAdminNav.map((item) => {
                const Icon = item.icon;
                const active = adminRoute === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAdminRoute(item.id)}
                    className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                      active
                        ? 'text-violet-700 dark:text-violet-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {active && (
                      <span className="absolute top-0 w-8 h-0.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                    )}
                    <Icon className="w-4 h-4" />
                    <span className="truncate max-w-[76px]">{item.shortLabel ?? item.label}</span>
                  </button>
                );
              })}
        </nav>
      </div>
    </div>
  );
}
