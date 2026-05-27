"use client";

import { useState, useEffect, useCallback } from "react";
import {
  computeExperimentEngine,
  loadExperimentEngine,
  getExperimentEngine,
  type ExperimentEngineOutput,
  type ActiveExperiment,
  type VariantPerformance,
} from "../data/experiment-engine";

// ============================================================================
// HELPERS
// ============================================================================

function metricLabel(metric: string): string {
  const labels: Record<string, string> = {
    mission_completion_rate: "Mission Completion",
    quiz_completion_rate: "Quiz Completion",
    career_click_rate: "Career Clicks",
    workspace_creation_rate: "Workspace Creation",
    return_rate: "Return Rate",
    engagement_score: "Engagement Score",
    recommendation_acceptance: "Recommendation Acceptance",
  };
  return labels[metric] ?? metric;
}

function confidenceColor(level: number): string {
  if (level >= 70) return "bg-emerald-500";
  if (level >= 40) return "bg-amber-500";
  return "bg-core-accent/50";
}

function metricColor(value: number): string {
  if (value >= 70) return "text-emerald-400";
  if (value >= 40) return "text-amber-400";
  return "text-core-muted";
}

// ============================================================================
// SKELETON
// ============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 space-y-3">
      <div className="h-3 w-1/2 animate-skeleton" />
      <div className="h-4 w-3/4 animate-skeleton" />
      <div className="h-8 w-full animate-skeleton" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-skeleton" />
        <div className="h-3 w-2/3 animate-skeleton" />
      </div>
    </div>
  );
}

// ============================================================================
// VARIANT BAR
// ============================================================================

function VariantBar({
  variant,
  label,
  metricValue,
  sampleSize,
  isAssigned,
  isWinner,
}: VariantPerformance & { isAssigned: boolean; isWinner: boolean }) {
  return (
    <div className={`rounded-xl border p-3 transition-all ${
      isWinner
        ? "border-emerald-500/40 bg-emerald-500/5"
        : isAssigned
          ? "border-core-accent/30 bg-core-accent/5"
          : "border-core-border bg-core-bg/40"
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            variant === "A" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"
          }`}>
            {variant}
          </span>
          <span className="text-xs font-medium text-core-text">{label}</span>
          {isAssigned && (
            <span className="text-[10px] text-core-accent/70 font-medium">(you)</span>
          )}
          {isWinner && (
            <span className="text-[10px] text-emerald-400 font-semibold">★ Winner</span>
          )}
        </div>
        <span className={`text-xs font-semibold ${metricColor(metricValue)}`}>
          {metricValue}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isWinner ? "bg-emerald-500" : "bg-core-accent/60"
          }`}
          style={{ width: `${metricValue}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-core-muted/60">{sampleSize} data points</p>
    </div>
  );
}

// ============================================================================
// EXPERIMENT CARD
// ============================================================================

function ExperimentCard({ experiment }: { experiment: ActiveExperiment }) {
  const [perfA, perfB] = experiment.performance;
  const winningVariant = experiment.winnerPrediction !== "none" ? experiment.winnerPrediction : null;

  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-core-text">{experiment.name}</p>
          <p className="text-[11px] text-core-muted/70 mt-0.5">{experiment.description}</p>
        </div>
        <span className="shrink-0 text-[10px] text-core-muted/60 bg-core-bg/60 px-2 py-0.5 rounded-full whitespace-nowrap">
          {experiment.daysRunning}d
        </span>
      </div>

      {/* Metric label */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          {metricLabel(experiment.successMetric)}
        </p>
        {experiment.winnerPrediction !== "none" && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-emerald-400">
              {experiment.confidenceLevel}% confident
            </span>
          </div>
        )}
      </div>

      {/* Variant comparison */}
      <div className="space-y-2">
        <VariantBar
          {...perfA}
          isAssigned={experiment.variantAssignment === "A"}
          isWinner={winningVariant === "A"}
        />
        <VariantBar
          {...perfB}
          isAssigned={experiment.variantAssignment === "B"}
          isWinner={winningVariant === "B"}
        />
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-core-muted/70">Confidence</p>
          <p className="text-[10px] font-medium text-core-muted">{experiment.confidenceLevel}%</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${confidenceColor(experiment.confidenceLevel)}`}
            style={{ width: `${experiment.confidenceLevel}%` }}
          />
        </div>
      </div>

      {/* Winner prediction */}
      {experiment.winnerPrediction !== "none" && (
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
          <p className="text-[10px] font-semibold text-emerald-400">
            Winner: {experiment.winnerPrediction === "A" ? experiment.variantA : experiment.variantB}
          </p>
          <p className="text-[10px] text-emerald-300/70 mt-0.5">
            {experiment.confidenceLevel >= 70
              ? "Strong signal — consider rolling out this variant."
              : experiment.confidenceLevel >= 40
                ? "Moderate signal — continue monitoring."
                : "Early signal — more data needed."}
          </p>
        </div>
      )}

      {/* No winner yet */}
      {experiment.winnerPrediction === "none" && (
        <div className="rounded-lg bg-core-bg/40 border border-dashed border-core-border p-2.5">
          <p className="text-[10px] text-core-muted/60 text-center">
            {experiment.confidenceLevel > 0
              ? "Too close to call — keep engaging to determine the winner."
              : "Gathering data..."}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type Props = {
  className?: string;
};

export default function ExperimentPanel({ className = "" }: Props) {
  const [data, setData] = useState<ExperimentEngineOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setLoading(true);
      const result = computeExperimentEngine();
      setData(result);
      setError(null);
    } catch (err) {
      console.error("[ExperimentPanel] Failed to compute:", err);
      setError("Failed to compute experiment intelligence.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try loading cached data first for instant display
    const cached = loadExperimentEngine();
    if (cached) {
      setData(cached);
      setLoading(false);
    }
    // Then compute fresh
    refresh();
  }, [refresh]);

  // ── Skeleton loading ──
  if (loading && !data) {
    return (
      <div className={`space-y-4 ${className}`}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className={`rounded-2xl border border-red-500/20 bg-red-500/5 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-sm">⚠</span>
          <p className="text-xs text-red-400">{error}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="mt-2 rounded-full border border-red-500/30 px-3 py-1 text-[10px] font-medium text-red-400 transition hover:bg-red-500/10"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ──
  if (!data || data.activeExperiments.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-core-border bg-core-bg/30 p-6 text-center ${className}`}>
        <p className="text-xs text-core-muted">No active experiments.</p>
        <p className="mt-1 text-[10px] text-core-muted/60">
          Experiments will start as you use CorePath.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-3 rounded-full border border-core-border px-3 py-1.5 text-[10px] font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Sort: experiments with winner predictions first, then by confidence
  const sorted = [...data.activeExperiments].sort((a, b) => {
    if (a.winnerPrediction !== "none" && b.winnerPrediction === "none") return -1;
    if (a.winnerPrediction === "none" && b.winnerPrediction !== "none") return 1;
    return b.confidenceLevel - a.confidenceLevel;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-core-muted font-semibold">
            A/B Experiments
          </p>
          <p className="text-xs text-core-muted/60 mt-0.5">
            {data.activeExperiments.length} active · {data.activeExperiments.filter((e) => e.winnerPrediction !== "none").length} decisive
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full border border-core-border px-2.5 py-1 text-[10px] font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Refresh
        </button>
      </div>

      {/* Recommended action banner */}
      <div className="rounded-xl border border-core-accent/20 bg-core-accent/5 p-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent font-semibold">
          Recommendation
        </p>
        <p className="text-xs text-core-text mt-0.5">{data.recommendedAction}</p>
      </div>

      {/* Experiment cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((experiment) => (
          <ExperimentCard key={experiment.id} experiment={experiment} />
        ))}
      </div>

      {/* Narrative */}
      {data.experimentNarrative.length > 0 && (
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1.5">
            Experiment Insights
          </p>
          <ul className="space-y-1">
            {data.experimentNarrative.map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-[10px] text-core-accent/60">•</span>
                <span className="text-[11px] text-core-muted leading-snug">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
