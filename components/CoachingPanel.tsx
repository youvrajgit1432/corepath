"use client";

import { useEffect, useState } from "react";
import { computeCoachingIntelligence, getCoachingModeMeta } from "@/data/coaching-intelligence";
import type { CoachingData, CoachingMode } from "@/data/coaching-intelligence";

// ── Mode color config ─────────────────────────────────────────────────────

const MODE_COLORS: Record<CoachingMode, {
  border: string;
  bg: string;
  badge: string;
  accent: string;
}> = {
  mentor: {
    border: "border-emerald-500/30",
    bg: "bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
    badge: "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  challenger: {
    border: "border-amber-500/30",
    bg: "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
    badge: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
    accent: "text-amber-600 dark:text-amber-400",
  },
  protector: {
    border: "border-blue-500/30",
    bg: "bg-gradient-to-br from-blue-500/10 to-indigo-500/5",
    badge: "bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
    accent: "text-blue-600 dark:text-blue-400",
  },
  strategist: {
    border: "border-violet-500/30",
    bg: "bg-gradient-to-br from-violet-500/10 to-purple-500/5",
    badge: "bg-violet-100/80 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30",
    accent: "text-violet-600 dark:text-violet-400",
  },
  reflective: {
    border: "border-core-border",
    bg: "bg-core-surface",
    badge: "bg-core-border/50 text-core-muted border-core-border",
    accent: "text-core-muted",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────

function CoachMessageCard({
  mode,
  message,
  focusAdvice,
}: {
  mode: CoachingMode;
  message: string;
  focusAdvice: string;
}) {
  const meta = getCoachingModeMeta(mode);
  const colors = MODE_COLORS[mode];

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${colors.badge}`}>
              {meta.label}
            </span>
            <span className="text-[10px] text-core-muted">{meta.description}</span>
          </div>
          <p className="text-sm text-core-text leading-relaxed">{message}</p>
          <div className="mt-3 pt-3 border-t border-core-border/50">
            <p className="text-xs font-medium text-core-muted mb-1">Focus advice</p>
            <p className="text-xs text-core-muted leading-relaxed">{focusAdvice}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
        ⚠ Warnings
      </h4>
      <ul className="space-y-1.5">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-core-text">
            <span className="text-red-600 dark:text-red-400 mt-0.5 shrink-0">•</span>
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EncouragementList({ encouragements }: { encouragements: string[] }) {
  if (encouragements.length === 0) return null;
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
        ✨ Encouragements
      </h4>
      <ul className="space-y-1.5">
        {encouragements.map((e, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-core-text">
            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">+</span>
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BlindSpotsCard({ blindSpots }: { blindSpots: string[] }) {
  if (blindSpots.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
        🕶 Blind Spots
      </h4>
      <ul className="space-y-1.5">
        {blindSpots.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-core-text">
            <span className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">◉</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GrowthOpportunitiesCard({ opportunities }: { opportunities: string[] }) {
  if (opportunities.length === 0) return null;
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
        🌱 Growth Opportunities
      </h4>
      <ul className="space-y-1.5">
        {opportunities.map((o, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-core-text">
            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">▸</span>
            {o}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TodayCoachingCard({
  todayCoaching,
  mode,
}: {
  todayCoaching: string;
  mode: CoachingMode;
}) {
  const colors = MODE_COLORS[mode];
  return (
    <div className={`rounded-xl border ${colors.border} bg-core-surface p-4`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-xs font-semibold uppercase tracking-wider ${colors.accent}`}>
          Today's coaching
        </span>
      </div>
      <p className="text-sm text-core-text leading-relaxed italic">
        "{todayCoaching}"
      </p>
    </div>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const color =
    confidence >= 70
      ? "bg-emerald-500"
      : confidence >= 40
        ? "bg-amber-500"
        : "bg-core-border";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-core-muted">Coach confidence</span>
      <div className="flex-1 h-1 rounded-full bg-core-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-core-muted w-8 text-right">
        {confidence}%
      </span>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────

interface Props {
  className?: string;
}

export default function CoachingPanel({ className = "" }: Props) {
  const [data, setData] = useState<CoachingData | null>(null);

  useEffect(() => {
    const coaching = computeCoachingIntelligence();
    setData(coaching);
  }, []);

  if (!data) {
    return (
      <div className={`rounded-xl border border-core-border bg-core-surface p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-28 bg-core-border rounded" />
          <div className="h-20 bg-core-border/50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-core-heading">Coaching Intelligence</h3>
        <ConfidenceIndicator confidence={data.coachConfidence} />
      </div>

      {/* Coach Message */}
      <CoachMessageCard
        mode={data.coachingMode}
        message={data.coachMessage}
        focusAdvice={data.focusAdvice}
      />

      {/* Warning + Encouragement row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WarningList warnings={data.warnings} />
        <EncouragementList encouragements={data.encouragements} />
      </div>

      {/* Blind Spots + Growth Opportunities row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BlindSpotsCard blindSpots={data.blindSpots} />
        <GrowthOpportunitiesCard opportunities={data.growthOpportunities} />
      </div>

      {/* Today's coaching */}
      <TodayCoachingCard todayCoaching={data.todayCoaching} mode={data.coachingMode} />
    </div>
  );
}
