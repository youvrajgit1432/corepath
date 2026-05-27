"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFeedbackIntelligence,
  computeFeedbackIntelligence,
  type FeedbackIntelligenceData,
  type CareerAffinityScore,
  type LikedPattern,
  type DislikedPattern,
  type FeedbackInsight,
  type RecommendationWeightAdjustment,
} from "../data/feedback-intelligence";

// ─── Helpers ─────────────────────────────────────────────────────────────

function trustColor(trust: number): string {
  if (trust >= 70) return "text-emerald-400";
  if (trust >= 40) return "text-amber-400";
  return "text-red-400";
}

function trustBgColor(trust: number): string {
  if (trust >= 70) return "bg-emerald-500/20";
  if (trust >= 40) return "bg-amber-500/20";
  return "bg-red-500/20";
}

function trustBarColor(trust: number): string {
  if (trust >= 70) return "bg-emerald-500";
  if (trust >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function affinityColor(score: number): string {
  if (score >= 50) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 20) return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";
  if (score <= -50) return "text-red-400 bg-red-500/10 border-red-500/20";
  if (score <= -20) return "text-red-300 bg-red-400/10 border-red-400/20";
  return "text-core-muted bg-core-bg/30 border-core-border";
}

function insightIcon(type: FeedbackInsight["type"]): string {
  switch (type) {
    case "positive": return "👍";
    case "negative": return "👎";
    case "suggestion": return "💡";
    default: return "ℹ️";
  }
}

// ─── Skeleton ────────────────────────────────────────────────────────────

function SkeletonPanel({ lines = 3 }: { lines?: number }) {
  const widths = ["w-3/4", "w-1/2", "w-2/3", "w-4/5", "w-3/5"];
  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 space-y-3">
      <div className="h-3 w-1/3 animate-skeleton" />
      <div className="h-5 w-1/2 animate-skeleton" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 ${widths[i % widths.length]} animate-skeleton`} />
      ))}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────

function TrustMeter({ trust, score }: { trust: number; score: number }) {
  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold">
          Recommendation Trust
        </p>
        <span className={`text-lg font-bold ${trustColor(trust)}`}>{trust}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${trustBarColor(trust)}`}
          style={{ width: `${trust}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-core-muted/70">
        <span>Low</span>
        <span>Feedback score: {score}/100</span>
        <span>High</span>
      </div>
    </div>
  );
}

function AffinityTag({ affinity }: { affinity: CareerAffinityScore }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${affinityColor(affinity.affinity)}`}
      title={`${affinity.positiveCount} likes · ${affinity.negativeCount} dislikes · ${affinity.revisitCount} revisits`}
    >
      {affinity.saved && (
        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2v13l6-3 6 3V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z" />
        </svg>
      )}
      <span>{affinity.careerTitle}</span>
      <span className="opacity-70">
        {affinity.affinity > 0 ? "+" : ""}{affinity.affinity}
      </span>
    </span>
  );
}

function LikedDislikedSection({
  patterns,
  type,
}: {
  patterns: LikedPattern[] | DislikedPattern[];
  type: "liked" | "disliked";
}) {
  if (patterns.length === 0) return null;

  const colors = type === "liked"
    ? { border: "border-emerald-500/20", bg: "bg-emerald-500/5", dot: "bg-emerald-500", text: "text-emerald-400" }
    : { border: "border-red-500/20", bg: "bg-red-500/5", dot: "bg-red-500", text: "text-red-400" };

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-4`}>
      <p className={`text-xs uppercase tracking-[0.2em] font-semibold ${colors.text}`}>
        {type === "liked" ? "👍 Liked Patterns" : "👎 Disliked Patterns"}
      </p>
      <div className="mt-2 space-y-2">
        {patterns.slice(0, 3).map((p) => (
          <div key={p.category} className="flex items-start gap-2 text-sm">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
            <div>
              <span className="font-medium text-core-text">{p.category}</span>
              <span className="text-core-muted text-xs ml-1">({p.count} signals)</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {p.careers.slice(0, 3).map((c) => (
                  <span key={c} className="text-[10px] text-core-muted/70 bg-core-bg/40 px-1.5 py-0.5 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeightAdjustmentsCard({ adjustments }: { adjustments: RecommendationWeightAdjustment[] }) {
  if (adjustments.length === 0) return null;

  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold">
        ⚖️ Recommendation Adjustments
      </p>
      <div className="mt-2 space-y-1.5">
        {adjustments.slice(0, 4).map((adj) => (
          <div key={adj.careerId} className="flex items-center justify-between text-xs">
            <span className="text-core-text truncate max-w-[180px]">{adj.careerTitle}</span>
            <span
              className={`shrink-0 font-medium ${
                adj.adjustment > 1.0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {adj.adjustment > 1.0 ? "×" : "×"}{adj.adjustment.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsList({ insights }: { insights: FeedbackInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
        💬 Learning Insights
      </p>
      <div className="space-y-2">
        {insights.slice(0, 4).map((insight, i) => (
          <div key={i} className="flex gap-2 text-sm">
            <span className="shrink-0 mt-0.5">{insightIcon(insight.type)}</span>
            <span className="text-core-text leading-snug">{insight.insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NarrativeSummary({ narrative }: { narrative: string[] }) {
  if (narrative.length === 0) return null;

  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
        📝 What CorePath Has Learned
      </p>
      <div className="space-y-2">
        {narrative.map((line, i) => (
          <p key={i} className="text-sm text-core-muted leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function AffinityCloud({ affinities }: { affinities: CareerAffinityScore[] }) {
  if (affinities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-core-border bg-core-bg/30 p-4 text-center">
        <p className="text-xs text-core-muted/60">No career feedback yet. Like or save careers to build your affinity profile.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
        🏷️ Career Affinities
      </p>
      <div className="flex flex-wrap gap-1.5">
        {affinities.slice(0, 8).map((a) => (
          <AffinityTag key={a.careerId} affinity={a} />
        ))}
        {affinities.length > 8 && (
          <span className="text-[10px] text-core-muted/50 self-center ml-1">
            +{affinities.length - 8} more
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-core-border bg-core-bg/30 p-6 text-center space-y-3">
      <p className="text-lg">🧠</p>
      <p className="text-sm font-medium text-core-text">No feedback data yet</p>
      <p className="text-xs text-core-muted/60 max-w-xs mx-auto">
        CorePath learns from your actions. Like careers, save favorites, or
        provide feedback to build your learning profile.
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="rounded-full border border-core-border px-4 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
      >
        Refresh
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

interface FeedbackLearningPanelProps {
  className?: string;
}

export default function FeedbackLearningPanel({ className = "" }: FeedbackLearningPanelProps) {
  const [data, setData] = useState<FeedbackIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      const result = getFeedbackIntelligence();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    const fresh = computeFeedbackIntelligence();
    setData(fresh);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <SkeletonPanel lines={2} />
        <SkeletonPanel lines={3} />
        <SkeletonPanel lines={2} />
      </div>
    );
  }

  // ── Empty state ──
  if (!data || data.feedbackScore === 0) {
    return (
      <div className={className}>
        <EmptyState onRefresh={refresh} />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header + Refresh */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Feedback Learning
        </p>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full border border-core-border px-3 py-1 text-[10px] font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Refresh
        </button>
      </div>

      {/* Trust Meter */}
      <TrustMeter trust={data.recommendationTrust} score={data.feedbackScore} />

      {/* Career Affinities */}
      <AffinityCloud affinities={data.careerAffinities} />

      {/* Liked / Disliked Patterns */}
      <div className="grid gap-3 sm:grid-cols-2">
        <LikedDislikedSection patterns={data.likedPatterns} type="liked" />
        <LikedDislikedSection patterns={data.dislikedPatterns} type="disliked" />
      </div>

      {/* Weight Adjustments */}
      <WeightAdjustmentsCard adjustments={data.weightAdjustments} />

      {/* Insights */}
      <InsightsList insights={data.feedbackInsights} />

      {/* Narrative */}
      <NarrativeSummary narrative={data.learningNarrative} />
    </div>
  );
}
