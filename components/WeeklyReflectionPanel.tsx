/**
 * WEEKLY REFLECTION PANEL
 *
 * Displays a weekly review of growth and learning patterns:
 * wins, slowdowns, skills improved, mission completion rate,
 * streak trend, insight, next focus, and motivation signal.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWeeklyReflection,
  type WeeklyReflection,
} from "../data/weekly-reflection";

// ============================================================================
// STREAK TREND BADGE
// ============================================================================

const TREND_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  growing: { icon: "📈", color: "text-green-400 bg-green-500/10", label: "Growing" },
  stable: { icon: "➡️", color: "text-amber-400 bg-amber-500/10", label: "Stable" },
  declining: { icon: "📉", color: "text-rose-400 bg-rose-500/10", label: "Declining" },
};

// ============================================================================
// COMPLETION RING (SVG)
// ============================================================================

function CompletionRing({ rate }: { rate: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  const color =
    rate >= 70 ? "stroke-green-500" : rate >= 40 ? "stroke-amber-500" : "stroke-rose-500";

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        className="text-core-border/50"
      />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        className={`${color} transition-all duration-700`}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="36"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-core-heading text-xs font-bold"
      >
        {rate}%
      </text>
    </svg>
  );
}

// ============================================================================
// MAIN PANEL
// ============================================================================

interface Props {
  className?: string;
}

export default function WeeklyReflectionPanel({ className = "" }: Props) {
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);

  const load = useCallback(() => {
    setReflection(getWeeklyReflection());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!reflection) return null;

  const trendConfig = TREND_CONFIG[reflection.streakTrend] ?? TREND_CONFIG.stable;

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      {/* Header with week badge */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Weekly Reflection
          </p>
          <h3 className="mt-1 text-lg font-semibold text-core-heading">
            {reflection.weekKey}
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${trendConfig.color}`}
        >
          {trendConfig.icon} {trendConfig.label}
        </span>
      </div>

      {/* Completion rate + streak trend */}
      <div className="flex items-center gap-5 mb-6 p-4 rounded-xl bg-core-bg/50 border border-core-border/50">
        <CompletionRing rate={reflection.missionCompletionRate} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-core-heading">Weekly engagement</p>
          <p className="text-xs text-core-muted mt-0.5">
            {reflection.missionCompletionRate >= 70
              ? "Strong consistency this week!"
              : reflection.missionCompletionRate >= 40
                ? "Building a steady rhythm"
                : "Room to grow next week"}
          </p>
        </div>
      </div>

      {/* Wins */}
      {reflection.wins.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-core-muted mb-3">
            This week&apos;s wins
          </p>
          <ul className="space-y-2">
            {reflection.wins.map((win, i) => (
              <li
                key={`win-${i}`}
                className="flex items-start gap-2.5 text-sm text-core-text"
              >
                <span className="mt-0.5 shrink-0 text-green-400">✓</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills Improved */}
      {reflection.skillsImproved.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-core-muted mb-3">
            Skills &amp; growth signals
          </p>
          <div className="flex flex-wrap gap-2">
            {reflection.skillsImproved.map((skill, i) => (
              <span
                key={`skill-${i}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-core-accent/10 text-xs font-medium text-core-accent border border-core-accent/20"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Slowdowns */}
      {reflection.slowdowns.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-2">
            Areas to watch
          </p>
          <ul className="space-y-2">
            {reflection.slowdowns.map((item, i) => (
              <li
                key={`slow-${i}`}
                className="flex items-start gap-2.5 text-sm text-core-text"
              >
                <span className="mt-0.5 shrink-0 text-amber-400">△</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-core-border my-4" />

      {/* Weekly Insight */}
      <p className="text-sm text-core-heading font-semibold leading-relaxed mb-4">
        &ldquo;{reflection.weeklyInsight}&rdquo;
      </p>

      {/* Next Week Focus */}
      <div className="p-4 rounded-xl bg-core-accent/5 border border-core-accent/20 mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-core-accent mb-1.5">
          Next week focus
        </p>
        <p className="text-sm text-core-heading">{reflection.nextWeekFocus}</p>
      </div>

      {/* Motivation Signal */}
      <div className="text-center py-3">
        <p className="text-sm text-core-muted italic leading-relaxed">
          {reflection.motivationSignal}
        </p>
      </div>
    </section>
  );
}
