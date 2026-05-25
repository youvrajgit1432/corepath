"use client";

import { useEffect, useState } from "react";
import { computeProgressReflection, type ProgressReflectionData, type ReflectionTheme, type MomentumSignal } from "../data/progress-reflection";

// ============================================================================
// THEME CONFIG
// ============================================================================

const THEME_CONFIG: Record<ReflectionTheme, { label: string; color: string; icon: string }> = {
  accelerating: { label: "Accelerating", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: "🚀" },
  consistent: { label: "Consistent", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: "📊" },
  rebuilding: { label: "Rebuilding", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: "🔨" },
  discovering: { label: "Discovering", color: "text-violet-400 border-violet-500/30 bg-violet-500/10", icon: "🔍" },
  plateaued: { label: "Plateaued", color: "text-core-muted border-core-border bg-white/5", icon: "⛰️" },
  misaligned: { label: "Misaligned", color: "text-rose-400 border-rose-500/30 bg-rose-500/10", icon: "⚠️" },
};

const MOMENTUM_CONFIG: Record<MomentumSignal, { label: string; color: string; icon: string }> = {
  rising: { label: "Rising", color: "text-emerald-400", icon: "📈" },
  steady: { label: "Steady", color: "text-blue-400", icon: "➡️" },
  slipping: { label: "Slipping", color: "text-amber-400", icon: "📉" },
};

// ============================================================================
// PROGRESS RATE COLOR
// ============================================================================

function rateColor(rate: number): string {
  if (rate >= 70) return "bg-emerald-500";
  if (rate >= 45) return "bg-blue-500";
  if (rate >= 25) return "bg-amber-500";
  return "bg-core-accent/60";
}

// ============================================================================
// COMPONENT
// ============================================================================

type Props = {
  className?: string;
};

export default function ProgressReflectionPanel({ className = "" }: Props) {
  const [data, setData] = useState<ProgressReflectionData | null>(null);

  useEffect(() => {
    setData(computeProgressReflection());
  }, []);

  if (!data) return null;

  const theme = THEME_CONFIG[data.reflectionTheme];
  const momentum = MOMENTUM_CONFIG[data.momentumSignal];

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-5 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted font-semibold">
          Progress reflection
        </p>
        <p className="mt-0.5 text-[11px] text-core-muted/70">
          How your career journey is progressing
        </p>
      </div>

      {/* Progress rate + theme row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-core-muted">Progress rate</span>
            <span className="text-sm font-bold text-core-heading">{data.progressRate}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${rateColor(data.progressRate)}`}
              style={{ width: `${data.progressRate}%` }}
            />
          </div>
        </div>

        {/* Theme badge */}
        <div className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${theme.color}`}>
          <span className="mr-1">{theme.icon}</span>
          {theme.label}
        </div>

        {/* Momentum signal */}
        <div className={`shrink-0 text-xs font-medium ${momentum.color}`}>
          <span className="mr-1">{momentum.icon}</span>
          {momentum.label}
        </div>
      </div>

      {/* Wins summary */}
      {data.winsSummary.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1.5">
            Wins
          </p>
          <ul className="space-y-1">
            {data.winsSummary.map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-emerald-400/90">
                <span className="mt-0.5 shrink-0">✓</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Growth areas */}
      {data.growthAreas.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1.5">
            Areas to develop
          </p>
          <ul className="space-y-1">
            {data.growthAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
                <span className="mt-0.5 shrink-0 text-amber-400/70">○</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key metric */}
      <div className="mb-3 rounded-xl border border-core-border bg-core-bg/50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Key metric
            </p>
            <p className="mt-0.5 text-xs text-core-muted">{data.keyMetric.label}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-core-heading">{data.keyMetric.value}</span>
            <span
              className={`text-xs ${
                data.keyMetric.change === "up"
                  ? "text-emerald-400"
                  : data.keyMetric.change === "down"
                    ? "text-amber-400"
                    : "text-core-muted"
              }`}
            >
              {data.keyMetric.change === "up" ? "↑" : data.keyMetric.change === "down" ? "↓" : "→"}
            </span>
          </div>
        </div>
      </div>

      {/* Next milestone */}
      {data.nextMilestone && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1">
            Next milestone
          </p>
          <p className="text-xs text-core-text leading-snug">{data.nextMilestone}</p>
        </div>
      )}

      {/* Reflection prompt */}
      <div className="mb-3 rounded-xl border border-core-accent/15 bg-core-accent/5 p-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent/70 font-semibold mb-1">
          Reflect on this
        </p>
        <p className="text-xs text-core-text leading-relaxed">{data.reflectionPrompt}</p>
      </div>

      {/* One-line summary */}
      <p className="text-xs text-core-muted italic leading-relaxed">&ldquo;{data.oneLineReflection}&rdquo;</p>
    </section>
  );
}
