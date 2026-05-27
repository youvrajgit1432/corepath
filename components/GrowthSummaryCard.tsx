/**
 * GROWTH SUMMARY CARD
 *
 * Merged panel consolidating three previously separate intelligence sources:
 *   1. Weekly Reflection — mission completion rate, wins, streak trend, insight
 *   2. AI Coaching — coaching mode, message, focus advice, confidence
 *   3. Engagement Pulse — pulse score, energy forecast, fatigue signals, booster
 *
 * Data engines remain active in background; this is a UI consolidation only.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getWeeklyReflection, type WeeklyReflection } from "../data/weekly-reflection";
import { computeCoachingIntelligence, getCoachingModeMeta, type CoachingData } from "../data/coaching-intelligence";
import { computeEngagementPulse, loadEngagementPulse, type EngagementPulseData } from "../data/engagement-pulse";

// ============================================================================
// TYPES
// ============================================================================

interface GrowthSummaryData {
  weekly: WeeklyReflection | null;
  coaching: CoachingData | null;
  pulse: EngagementPulseData | null;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function safePct(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
}

function MiniRing({ rate, size = 36 }: { rate: number; size?: number }) {
  const pct = safePct(rate);
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = pct >= 70 ? "#34d399" : pct >= 40 ? "#f59e0b" : "#f87171";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-core-border/40" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} className="transition-all duration-700" />
    </svg>
  );
}

function PulseDot({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : score >= 30 ? "bg-amber-500" : "bg-red-400";
  return <span className={`inline-flex h-2 w-2 rounded-full ${color}`} />;
}

function CoachingBadge({ mode }: { mode: string }) {
  const meta = getCoachingModeMeta(mode as any);
  const colorMap: Record<string, string> = {
    mentor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    challenger: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    protector: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    strategist: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    reflective: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  };
  const cls = colorMap[mode] ?? colorMap.reflective;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls}`}>
      {meta?.icon ?? "🧠"} {meta?.label ?? mode}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Props {
  className?: string;
}

export default function GrowthSummaryCard({ className = "" }: Props) {
  const [data, setData] = useState<GrowthSummaryData | null>(null);

  const load = useCallback(() => {
    setData({
      weekly: getWeeklyReflection(),
      coaching: computeCoachingIntelligence(),
      pulse: loadEngagementPulse() ?? computeEngagementPulse(),
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <section className={`rounded-2xl border border-core-border bg-core-surface p-5 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-28 bg-core-border/50 rounded" />
          <div className="h-4 w-48 bg-core-border/50 rounded" />
          <div className="flex gap-4">
            <div className="h-9 w-9 rounded-full bg-core-border/50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-core-border/50 rounded" />
              <div className="h-3 w-1/2 bg-core-border/50 rounded" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { weekly, coaching, pulse } = data;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-core-muted font-semibold">
            Growth Summary
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-core-heading">
            Weekly pulse & coaching
          </h3>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-core-border px-2.5 py-1 text-[9px] font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          ↻
        </button>
      </div>

      {/* ── Row 1: Key Metrics ── */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {/* Weekly completion ring */}
        {weekly && (
          <div className="flex items-center gap-2.5 rounded-xl border border-core-border/50 bg-core-bg/40 p-2.5">
            <MiniRing rate={weekly.missionCompletionRate} size={36} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-core-heading">{weekly.missionCompletionRate}%</p>
              <p className="text-[9px] text-core-muted">Weekly rate</p>
            </div>
          </div>
        )}

        {/* Pulse score */}
        {pulse && (
          <div className="flex items-center gap-2.5 rounded-xl border border-core-border/50 bg-core-bg/40 p-2.5">
            <PulseDot score={pulse.pulseScore} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-core-heading">{pulse.pulseScore}</p>
              <p className="text-[9px] text-core-muted capitalize">{pulse.energyForecast} energy</p>
            </div>
          </div>
        )}

        {/* Coach mode badge */}
        {coaching && (
          <div className="shrink-0">
            <CoachingBadge mode={coaching.coachingMode} />
          </div>
        )}
      </div>

      {/* ── Row 2: Single priority insight (reduced from 5 competing cards) ── */}
      <div className="mb-3">
        {/* Priority 1: Weekly wins — always show if available */}
        {weekly && weekly.wins.length > 0 && (
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-400 font-semibold mb-1.5">
              This week
            </p>
            <ul className="space-y-1">
              {weekly.wins.slice(0, 2).map((win, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-core-text">
                  <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                  <span className="leading-snug">{win}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Priority 2: Fatigue warning (only if no wins) */}
        {(!weekly || weekly.wins.length === 0) && pulse && pulse.fatigueSignals.length > 0 && (
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-amber-400 font-semibold mb-1.5">
              Watch for
            </p>
            <p className="text-[11px] text-core-text leading-snug">{pulse.fatigueSignals[0].detail}</p>
          </div>
        )}

        {/* Priority 3: Coaching signal (only if neither wins nor fatigue) */}
        {(!weekly || weekly.wins.length === 0) && (!pulse || pulse.fatigueSignals.length === 0) && coaching && (
          <div className="rounded-xl border border-core-accent/10 bg-core-accent/[0.02] p-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-core-accent font-semibold mb-1">
              {coaching.warnings.length > 0 ? "Signal" : "Note"}
            </p>
            <p className="text-[11px] text-core-text leading-snug">
              {coaching.warnings.length > 0 ? coaching.warnings[0] : coaching.encouragements[0]}
            </p>
          </div>
        )}
      </div>

      {/* ── Row 3: Key Narrative (condensed to 1 message) ── */}
      <div className="space-y-2">
        {/* Single narrative: weekly insight (preferred) or coaching message */}
        {weekly && (
          <div className="rounded-xl border border-core-accent/10 bg-core-accent/[0.02] p-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-core-accent font-semibold mb-1">
              This week&rsquo;s insight
            </p>
            <p className="text-[11px] text-core-text leading-relaxed">&ldquo;{weekly.weeklyInsight}&rdquo;</p>
          </div>
        )}

        {/* Next focus (always shown if weekly available) */}
        {weekly && (
          <p className="text-[10px] text-core-muted italic leading-relaxed">
            Focus: {weekly.nextWeekFocus}
          </p>
        )}
      </div>
    </section>
  );
}
