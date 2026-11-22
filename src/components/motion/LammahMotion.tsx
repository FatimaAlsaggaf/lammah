import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const LAMMAH_EASE = [0.16, 1, 0.3, 1] as const;

export const LAMMAH_SPRING = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 30,
  mass: 0.8,
};

/**
 * Smooth page container transition for switching routes cleanly.
 */
export function PageTransition({
  children,
  pageKey,
  className = '',
}: {
  children: React.ReactNode;
  pageKey: string;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      key={pageKey}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: LAMMAH_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Moderate stagger wrapper inspired by MagicUI / Motion patterns.
 */
export function StaggerGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.055,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      variants={
        prefersReduced
          ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
          : {
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.32, ease: LAMMAH_EASE },
              },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Smooth spring-eased numeric count-up for KPIs and points balances.
 */
export function AnimatedCounter({
  value,
  decimals = 0,
  suffix = '',
  className = '',
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const duration = 520;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
        prevRef.current = to;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, prefersReduced]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();
  return (
    <span className={`tabular-nums ${className}`}>
      {formatted}
      {suffix}
    </span>
  );
}

/**
 * Animated progress bar using transform/scaleX for smooth 60fps performance in RTL.
 */
export function AnimatedProgressBar({
  percent,
  heightClass = 'h-2',
  trackClass = 'bg-slate-200/80 dark:bg-slate-800',
  fillClass = 'bg-gradient-to-l from-blue-600 via-indigo-500 to-violet-600',
}: {
  percent: number;
  heightClass?: string;
  trackClass?: string;
  fillClass?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const prefersReduced = useReducedMotion();

  return (
    <div className={`w-full ${heightClass} rounded-full overflow-hidden ${trackClass}`}>
      <motion.div
        initial={prefersReduced ? { scaleX: clamped / 100 } : { scaleX: 0 }}
        animate={{ scaleX: clamped / 100 }}
        transition={{ duration: 0.65, ease: LAMMAH_EASE }}
        style={{ transformOrigin: 'right center' }}
        className={`h-full w-full rounded-full ${fillClass}`}
      />
    </div>
  );
}

/**
 * Precision SVG Radial Ring Progress indicator for goals, levels, and executive ratios.
 */
export function RadialRingProgress({
  percent,
  size = 64,
  strokeWidth = 6,
  trackColor = 'rgba(148,163,184,0.2)',
  gradientId = 'lammahRing',
  fromColor = '#38BDF8',
  toColor = '#8B5CF6',
  label,
  sublabel,
  labelClassName = 'text-sm font-bold text-slate-900 dark:text-white',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  gradientId?: string;
  fromColor?: string;
  toColor?: string;
  label?: React.ReactNode;
  sublabel?: string;
  labelClassName?: string;
}) {
  const prefersReduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={
            prefersReduced
              ? { strokeDashoffset: dashOffset }
              : { strokeDashoffset: circumference }
          }
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.85, ease: LAMMAH_EASE }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} />
          </linearGradient>
        </defs>
      </svg>
      {(label !== undefined || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {label !== undefined && (
            <span className={`font-mono tabular-nums leading-none ${labelClassName}`}>
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-[10px] text-slate-400 mt-0.5 leading-none">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Architectural geometric grid backdrop with soft radial fade mask (Magic UI / 21st.dev inspired).
 */
export function ArchitecturalGridPattern({
  className = '',
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{
        maskImage: 'radial-gradient(85% 85% at 50% 35%, black 35%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(85% 85% at 50% 35%, black 35%, transparent 100%)',
      }}
    >
      <defs>
        <pattern
          id={light ? 'lammah-arch-grid-light' : 'lammah-arch-grid-dark'}
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 32 0 L 0 0 0 32"
            fill="none"
            stroke={light ? 'rgba(15, 27, 53, 0.06)' : 'rgba(255, 255, 255, 0.07)'}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill={`url(#${light ? 'lammah-arch-grid-light' : 'lammah-arch-grid-dark'})`}
      />
    </svg>
  );
}

/**
 * Signature Lammah AI Orb — multi-layered luminous geometric presence with orbital ring.
 */
export function LammahOrb({
  state = 'idle',
  size = 'md',
}: {
  state?: 'idle' | 'thinking' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const prefersReduced = useReducedMotion();
  const dims =
    size === 'sm'
      ? 'w-9 h-9'
      : size === 'lg'
        ? 'w-16 h-16'
        : size === 'xl'
          ? 'w-20 h-20'
          : 'w-11 h-11';
  const radiusClass =
    size === 'sm' ? 'rounded-xl' : size === 'md' ? 'rounded-2xl' : 'rounded-[22px]';
  const innerRadius =
    size === 'sm' ? 'rounded-[10px]' : size === 'md' ? 'rounded-[14px]' : 'rounded-[20px]';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${dims}`}>
      {/* Outer luminous field */}
      <motion.span
        aria-hidden="true"
        animate={
          prefersReduced
            ? {}
            : state === 'thinking'
              ? { scale: [1, 1.32, 1], opacity: [0.45, 0.85, 0.45] }
              : { scale: [1, 1.12, 1], opacity: [0.28, 0.48, 0.28] }
        }
        transition={{
          duration: state === 'thinking' ? 1.5 : 4.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute -inset-1.5 ${radiusClass} bg-gradient-to-tr from-sky-400/50 via-indigo-500/45 to-violet-500/55 blur-md`}
      />

      {/* Precision orbital ring (visible on lg/xl) */}
      {(size === 'lg' || size === 'xl') && (
        <motion.svg
          viewBox="0 0 88 88"
          fill="none"
          aria-hidden="true"
          animate={
            prefersReduced
              ? {}
              : { rotate: 360 }
          }
          transition={{
            duration: state === 'thinking' ? 6 : 22,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none"
        >
          <circle
            cx="44"
            cy="44"
            r="41"
            stroke="url(#lammahOrbitGrad)"
            strokeWidth="1.2"
            strokeDasharray="18 10 6 10"
            strokeOpacity="0.65"
          />
          <defs>
            <linearGradient id="lammahOrbitGrad" x1="0" y1="0" x2="88" y2="88">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>
        </motion.svg>
      )}

      {/* Faceted core vessel */}
      <motion.div
        animate={
          prefersReduced
            ? {}
            : state === 'thinking'
              ? { scale: [1, 1.05, 1] }
              : { scale: 1 }
        }
        transition={
          state === 'thinking'
            ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        className={`relative ${dims} ${radiusClass} bg-gradient-to-br from-sky-400/80 via-indigo-500/80 to-violet-500/80 p-[1.5px] shadow-lg shadow-indigo-950/35`}
      >
        <div
          className={`w-full h-full ${innerRadius} bg-gradient-to-b from-[#112247] to-[#081022] flex items-center justify-center relative overflow-hidden`}
        >
          <div
            aria-hidden="true"
            className="absolute -top-3 inset-x-0 h-6 bg-sky-400/20 blur-md rounded-full"
          />
          <motion.svg
            viewBox="0 0 28 28"
            fill="none"
            className="relative w-[56%] h-[56%]"
            aria-hidden="true"
            animate={
              prefersReduced
                ? {}
                : state === 'thinking'
                  ? { rotate: [0, 180, 360] }
                  : { rotate: 0 }
            }
            transition={
              state === 'thinking'
                ? { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.4 }
            }
          >
            <path
              d="M14 2.5L19.4 11.2L14 25.5L8.6 11.2L14 2.5Z"
              fill="url(#lammahOrbCore)"
            />
            <path
              d="M14 7.8L16.8 12.1L14 19.4L11.2 12.1L14 7.8Z"
              fill="#FFFFFF"
              fillOpacity="0.95"
            />
            <defs>
              <linearGradient
                id="lammahOrbCore"
                x1="8.6"
                y1="2.5"
                x2="19.4"
                y2="25.5"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#7DD3FC" />
                <stop offset="0.5" stopColor="#818CF8" />
                <stop offset="1" stopColor="#C084FC" />
              </linearGradient>
            </defs>
          </motion.svg>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Clean skeleton state for AI processing / async feedback summaries.
 */
export function ThinkingSkeleton({ label }: { label: string }) {
  return (
    <div className="lammah-card rounded-2xl p-4 space-y-3 max-w-md w-full">
      <div className="flex items-center gap-3">
        <LammahOrb state="thinking" size="sm" />
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {label}
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-11/12 rounded-full lammah-skeleton" />
        <div className="h-2.5 w-8/12 rounded-full lammah-skeleton" />
        <div className="h-2.5 w-6/12 rounded-full lammah-skeleton" />
      </div>
    </div>
  );
}
