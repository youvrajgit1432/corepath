/**
 * PROGRESS STREAK WIDGET
 *
 * Compact streak tracking widget that shows in three locations:
 * - Home hero (top-right)
 * - CommandCenter Overview
 * - QuizResult Overview
 *
 * Features:
 * - Daily streak, weekly streak, longest streak, recovery streak
 * - Streak freeze (1 per week)
 * - Celebration animation on milestones
 * - Behavior messages based on streak length
 * - Desktop: top-right summary card
 * - Mobile: small horizontal card (max-height 120px)
 * - No guilt messaging — only positive reinforcement
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  computeStreakData,
  useStreakFreeze,
  logStreakEvents,
  type StreakData,
} from "../data/streak-intelligence";
import { logEvent } from "../data/analytics-events";

// ─── Constants ──────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  none: { dot: "bg-core-muted/40", bg: "bg-core-border/10", text: "text-core-muted" },
  building: { dot: "bg-amber-400", bg: "bg-amber-400/5", text: "text-amber-400" },
  strong: { dot: "bg-emerald-400", bg: "bg-emerald-400/5", text: "text-emerald-400" },
  consistent: { dot: "bg-purple-400", bg: "bg-purple-400/5", text: "text-purple-400" },
};

// ─── Confetti (micro) ──────────────────────────────────────────────────

function MicroConfetti() {
  const colors = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ec4899"];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color, left: `${20 + i * 15}%`, top: "50%" }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -60 - Math.random() * 40, opacity: 0, scale: 0 }}
          transition={{ duration: 0.6 + Math.random() * 0.3, ease: "easeOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

// ─── Desktop Variant ───────────────────────────────────────────────────

function DesktopCard({ data, onFreeze }: { data: StreakData; onFreeze: () => void }) {
  const colors = GRADE_COLORS[data.grade];
  const [showConfetti, setShowConfetti] = useState(false);

  // Celebrate on initial mount if building or higher
  useEffect(() => {
    if (data.currentStreak >= 1) {
      const timer = setTimeout(() => setShowConfetti(true), 300);
      return () => clearTimeout(timer);
    }
  }, [data.currentStreak]);

  return (
    <div className={`relative rounded-2xl border p-4 shadow-soft ${data.currentStreak >= 1 ? "border-core-accent/20" : "border-core-border/40"} ${colors.bg} overflow-hidden`}>
      {showConfetti && <MicroConfetti />}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Streak
        </p>
        <span className={`flex items-center gap-1.5 text-[10px] font-mono ${colors.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {data.grade === "none" ? "Inactive" : data.grade === "building" ? "Building" : data.grade === "strong" ? "Strong" : "Consistent"}
        </span>
      </div>

      {/* Main streak number */}
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-3xl font-bold ${data.currentStreak > 0 ? "text-core-heading" : "text-core-muted/50"}`}>
          {data.currentStreak}
        </span>
        <span className="text-xs text-core-muted mb-1.5">day{data.currentStreak !== 1 ? "s" : ""}</span>
        {data.currentStreak >= 3 && <span className="text-lg mb-1">🔥</span>}
      </div>

      {/* Message */}
      <p className={`text-xs font-medium mb-3 ${data.currentStreak > 0 ? "text-core-heading" : "text-core-muted"}`}>
        {data.message}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[11px] font-mono text-core-muted/60">
        <span>Weekly: {data.weeklyStreak}d</span>
        <span>Best: {data.longestStreak}d</span>
      </div>

      {/* Recovery badge */}
      {data.recoveryStreak > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-amber-400/70">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Recovery: {data.recoveryStreak}d
        </div>
      )}

      {/* Streak freeze button */}
      {data.streakFreezeAvailable > 0 && data.missedYesterday && (
        <button
          type="button"
          onClick={onFreeze}
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-core-accent/20 bg-core-accent/5 px-3 py-1.5 text-[10px] font-medium text-core-accent hover:bg-core-accent/10 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Freeze Streak ({data.streakFreezeAvailable})
        </button>
      )}
    </div>
  );
}

// ─── Mobile Variant ────────────────────────────────────────────────────

function MobileBar({ data, onFreeze }: { data: StreakData; onFreeze: () => void }) {
  const colors = GRADE_COLORS[data.grade];
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (data.currentStreak >= 1) {
      const timer = setTimeout(() => setShowConfetti(true), 400);
      return () => clearTimeout(timer);
    }
  }, [data.currentStreak]);

  return (
    <div className={`relative rounded-xl border px-4 py-3 ${data.currentStreak >= 1 ? "border-core-accent/20" : "border-core-border/40"} ${colors.bg} overflow-hidden max-h-[120px]`}>
      {showConfetti && <MicroConfetti />}

      <div className="flex items-center gap-3">
        {/* Fire icon */}
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${data.currentStreak > 0 ? "bg-core-accent/10" : "bg-core-border/10"}`}>
          <span className="text-lg">{data.currentStreak >= 3 ? "🔥" : data.currentStreak >= 1 ? "✅" : "⏳"}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${data.currentStreak > 0 ? "text-core-heading" : "text-core-muted/50"}`}>
              {data.currentStreak}
            </span>
            <span className="text-[10px] font-mono text-core-muted">day streak</span>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          </div>
          <p className={`text-xs mt-0.5 ${data.currentStreak > 0 ? "text-core-heading" : "text-core-muted"}`}>
            {data.message}
          </p>
        </div>

        {/* Right stats */}
        <div className="flex flex-col items-end gap-0.5 text-[10px] font-mono text-core-muted/60 shrink-0">
          <span>W: {data.weeklyStreak}d</span>
          <span>Best: {data.longestStreak}d</span>
          {data.recoveryStreak > 0 && <span className="text-amber-400/70">↻ {data.recoveryStreak}d</span>}
        </div>

        {/* Freeze button (compact) */}
        {data.streakFreezeAvailable > 0 && data.missedYesterday && (
          <button
            type="button"
            onClick={onFreeze}
            className="flex items-center gap-1 rounded-lg border border-core-accent/20 bg-core-accent/5 px-2 py-1 text-[9px] font-medium text-core-accent hover:bg-core-accent/10 transition-colors whitespace-nowrap shrink-0"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Freeze
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

interface ProgressStreakWidgetProps {
  /** Show mobile variant regardless of screen size */
  compact?: boolean;
}

export default function ProgressStreakWidget({ compact }: ProgressStreakWidgetProps) {
  const [data, setData] = useState<StreakData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [freezeFeedback, setFreezeFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const d = computeStreakData();
    setData(d);
    logStreakEvents(d);
    setMounted(true);
  }, []);

  const handleFreeze = useCallback(() => {
    const result = useStreakFreeze();

    if (result) {
      setData(result);
      logEvent("streak_freeze_used", { currentStreak: result.currentStreak });
      setFreezeFeedback("Streak frozen! ✅");

      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFreezeFeedback(null), 2500);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  if (!mounted || !data) return null;

  // Compact/mobile variant
  if (compact) {
    return (
      <div className="relative">
        <MobileBar data={data} onFreeze={handleFreeze} />

        <AnimatePresence>
          {freezeFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-medium text-emerald-400"
            >
              {freezeFeedback}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop variant (hidden on small screens, shown at md+)
  return (
    <div className="hidden md:block relative">
      <DesktopCard data={data} onFreeze={handleFreeze} />

      <AnimatePresence>
        {freezeFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-medium text-emerald-400"
          >
            {freezeFeedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
