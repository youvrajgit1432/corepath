"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getRecommendationOptimizer,
  computeRecommendationOptimizer,
  type RecommendationOptimizerData,
} from "../data/recommendation-optimizer";

// ─── Sub-components ──────────────────────────────────────────────

function QualityGauge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-600 stroke-emerald-600 dark:text-emerald-400 dark:stroke-emerald-500"
      : score >= 45
        ? "text-amber-600 stroke-amber-600 dark:text-amber-400 dark:stroke-amber-500"
        : "text-slate-500 stroke-slate-500 dark:text-slate-400 dark:stroke-slate-500";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
        <circle
          cx="48" cy="48" r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-core-border/50 dark:text-white/10"
        />
        <circle
          cx="48" cy="48" r="36"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-700`}
          transform="rotate(-90 48 48)"
        />
        <text
          x="48" y="52"
          textAnchor="middle"
          fill="currentColor"
          fontSize="20"
          fontWeight="700"
          className={color}
        >
          {score}
        </text>
      </svg>
      <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted mt-1">
        Quality
      </p>
    </div>
  );
}

function RankBadge({ direction, adjustment }: { direction: "up" | "down" | "neutral"; adjustment: number }) {
  const color =
    direction === "up"
      ? "text-emerald-700 bg-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-500/10"
      : direction === "down"
        ? "text-red-700 bg-red-100/80 dark:text-red-400 dark:bg-red-500/10"
        : "text-core-muted bg-core-border/30 dark:bg-white/5";

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
      {direction === "up" && "↑"}
      {direction === "down" && "↓"}
      {direction === "neutral" && "→"}
      {Math.abs(adjustment)}
    </span>
  );
}

function BoostBadge({ boost }: { boost: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100/80 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 text-[11px] font-medium">
      ✦ +{boost}
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 space-y-4">
      <div className="h-3 w-1/3 animate-skeleton" />
      <div className="flex justify-center">
        <div className="h-24 w-24 rounded-full animate-skeleton" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`h-3 ${["w-3/4", "w-1/2", "w-2/3"][i]} animate-skeleton`} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

type Props = {
  className?: string;
};

export default function RecommendationOptimizerPanel({ className = "" }: Props) {
  const [data, setData] = useState<RecommendationOptimizerData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const result = computeRecommendationOptimizer();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    const existing = getRecommendationOptimizer();
    if (existing) {
      setData(existing);
      setLoading(false);
    } else {
      refresh();
    }
  }, [refresh]);

  if (loading && !data) {
    return <Skeleton />;
  }

  if (!data) return null;

  // Sort rank adjustments for display
  const boostedAdjustments = data.careerRankAdjustments.filter((a) => a.direction === "up").slice(0, 4);
  const penalizedAdjustments = data.careerRankAdjustments.filter((a) => a.direction === "down").slice(0, 4);

  // Top confidence boosts
  const topBoosts = data.confidenceBoosts.slice(0, 4);

  // Top weight changes
  const topWeights = data.adaptiveRecommendationWeights.slice(0, 5);

  return (
    <div className={`rounded-2xl border border-core-border bg-core-bg/60 p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Recommendation Optimizer
          </p>
          <p className="text-xs text-core-text/60 mt-0.5">
            How the system adapts to your behavior
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full border border-core-border px-2.5 py-1 text-[10px] font-medium text-core-muted hover:border-core-accent hover:text-core-accent transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Quality Score + Exploration Bias */}
      <div className="flex items-start gap-4">
        <QualityGauge score={data.recommendationQualityScore} />
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Exploration bias
            </p>
            <p className="text-sm font-semibold text-core-text mt-0.5 capitalize">
              {data.explorationBias.type}
            </p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-core-border/50 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.explorationBias.type === "specialize"
                    ? "bg-indigo-500"
                    : data.explorationBias.type === "diversify"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                }`}
                style={{ width: `${data.explorationBias.strength}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-core-muted leading-snug line-clamp-2">
              {data.explorationBias.description}
            </p>
          </div>
        </div>
      </div>

      {/* Rank Movements */}
      {(boostedAdjustments.length > 0 || penalizedAdjustments.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {boostedAdjustments.length > 0 && (
            <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 font-semibold mb-1.5">
                Boosted careers
              </p>
              <div className="space-y-1">
                {boostedAdjustments.map((adj) => (
                  <div key={adj.careerId} className="flex items-center justify-between text-[11px]">
                    <span className="text-core-text truncate min-w-0 mr-2">{adj.careerTitle}</span>
                    <RankBadge direction="up" adjustment={adj.adjustment} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {penalizedAdjustments.length > 0 && (
            <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-red-700 dark:text-red-400 font-semibold mb-1.5">
                Penalized careers
              </p>
              <div className="space-y-1">
                {penalizedAdjustments.map((adj) => (
                  <div key={adj.careerId} className="flex items-center justify-between text-[11px]">
                    <span className="text-core-text truncate min-w-0 mr-2">{adj.careerTitle}</span>
                    <RankBadge direction="down" adjustment={adj.adjustment} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confidence Boosts */}
      {topBoosts.length > 0 && (
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-400 font-semibold mb-1.5">
            Confidence boosts
          </p>
          <div className="space-y-1">
            {topBoosts.map((b) => (
              <div key={b.careerId} className="flex items-center justify-between text-[11px]">
                <span className="text-core-text truncate min-w-0 mr-2">{b.careerTitle}</span>
                <BoostBadge boost={b.boost} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Weight Adjustments */}
      {topWeights.length > 0 && (
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1.5">
            Weight adjustments
          </p>
          <div className="space-y-1.5">
            {topWeights.map((w) => (
              <div key={w.careerId} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-core-text truncate min-w-0 mr-2">{w.careerTitle}</span>
                  <span className={`text-[11px] font-medium ${
                    w.adjustedWeight > w.baseWeight
                      ? "text-emerald-700 dark:text-emerald-400"
                      : w.adjustedWeight < w.baseWeight
                        ? "text-red-700 dark:text-red-400"
                        : "text-core-muted"
                  }`}>
                    {w.baseWeight} → {w.adjustedWeight}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-core-border/50 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      w.adjustedWeight > w.baseWeight ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.abs(w.adjustedWeight - w.baseWeight) * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specialization Strength */}
      {data.specializationStrength.length > 0 && (
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1.5">
            Specialization domains
          </p>
          <div className="space-y-1.5">
            {data.specializationStrength.slice(0, 4).map((s) => (
              <div key={s.domain} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-core-text truncate min-w-0 mr-2">{s.domain}</span>
                  <span className="text-xs text-core-muted">{s.engagement}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-core-border/50 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500/70 transition-all duration-500"
                    style={{ width: `${s.engagement}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Narrative */}
      {data.optimizationNarrative.length > 0 && (
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1">
            Optimization summary
          </p>
          <ul className="space-y-1">
            {data.optimizationNarrative.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-core-muted leading-snug">
                <span className="mt-0.5 shrink-0 text-core-accent/60">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {data.careerRankAdjustments.length === 0 && data.confidenceBoosts.length === 0 && (
        <div className="rounded-xl border border-dashed border-core-border bg-core-bg/30 p-4 text-center">
          <p className="text-xs text-core-muted">Not enough data yet.</p>
          <p className="mt-1 text-[11px] text-core-muted/60">
            Explore careers, complete quizzes, and provide feedback to build recommendation intelligence.
          </p>
        </div>
      )}
    </div>
  );
}
