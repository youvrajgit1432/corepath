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
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    accent: "text-emerald-400",
  },
  challenger: {
    border: "border-amber-500/30",
    bg: "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    accent: "text-amber-400",
  },
  protector: {
    border: "border-blue-500/30",
    bg: "bg-gradient-to-br from-blue-500/10 to-indigo-500/5",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    accent: "text-blue-400",
  },
  strategist: {
    border: "border-violet-500/30",
    bg: "bg-gradient-to-br from-violet-500/10 to-purple-500/5",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    accent: "text-violet-400",
  },
  reflective: {
    border: "border-zinc-500/30",
    bg: "bg-gradient-to-br from-zinc-500/10 to-zinc-500/5",
    badge: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
    accent: "text-zinc-400",
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
            <span className="text-[10px] text-zinc-500">{meta.description}</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{message}</p>
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs font-medium text-zinc-400 mb-1">Focus advice</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{focusAdvice}</p>
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
      <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
        ⚠ Warnings
      </h4>
      <ul className="space-y-1.5">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <span className="text-red-400 mt-0.5 shrink-0">•</span>
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
      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
        ✨ Encouragements
      </h4>
      <ul className="space-y-1.5">
        {encouragements.map((e, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
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
      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
        🕶 Blind Spots
      </h4>
      <ul className="space-y-1.5">
        {blindSpots.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <span className="text-amber-400 mt-0.5 shrink-0">◉</span>
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
      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
        🌱 Growth Opportunities
      </h4>
      <ul className="space-y-1.5">
        {opportunities.map((o, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <span className="text-emerald-400 mt-0.5 shrink-0">▸</span>
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
    <div className={`rounded-xl border ${colors.border} bg-zinc-900/50 p-4`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-xs font-semibold uppercase tracking-wider ${colors.accent}`}>
          Today's coaching
        </span>
      </div>
      <p className="text-sm text-zinc-200 leading-relaxed italic">
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
        : "bg-zinc-500";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500">Coach confidence</span>
      <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-zinc-400 w-8 text-right">
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
      <div className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-28 bg-zinc-800 rounded" />
          <div className="h-20 bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Coaching Intelligence</h3>
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
