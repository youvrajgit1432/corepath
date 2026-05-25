"use client";

import { useState, useEffect, useCallback } from "react";
import {
  computePredictiveInsights,
  type PredictiveInsightsData,
} from "../data/predictive-insights";
import PredictionFeedbackPanel from "./PredictionFeedbackPanel";

type Props = {
  className?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function momentumColor(direction: string): string {
  switch (direction) {
    case "accelerating":
      return "bg-emerald-500";
    case "stable":
      return "bg-blue-500";
    case "declining":
      return "bg-amber-500";
    default:
      return "bg-core-accent/60";
  }
}

function dropoffColor(level: string): string {
  switch (level) {
    case "low":
      return "bg-emerald-500";
    case "moderate":
      return "bg-amber-500";
    case "elevated":
      return "bg-orange-500";
    case "high":
      return "bg-red-500";
    default:
      return "bg-core-accent/60";
  }
}

function directionColor(level: string): string {
  switch (level) {
    case "strong":
      return "bg-emerald-500";
    case "moderate":
      return "bg-blue-500";
    case "unclear":
      return "bg-amber-500";
    case "early":
      return "bg-core-accent/60";
    default:
      return "bg-core-accent/60";
  }
}

function activityIcon(level: string): string {
  switch (level) {
    case "high":
      return "📊";
    case "moderate":
      return "📈";
    case "low":
      return "📉";
    default:
      return "📋";
  }
}

function priorityBadge(priority: string): { label: string; className: string } {
  switch (priority) {
    case "critical":
      return { label: "Critical", className: "bg-red-500/15 text-red-400" };
    case "high":
      return { label: "High priority", className: "bg-orange-500/15 text-orange-400" };
    case "medium":
      return { label: "Suggestion", className: "bg-amber-500/15 text-amber-400" };
    case "low":
      return { label: "On track", className: "bg-emerald-500/15 text-emerald-400" };
    default:
      return { label: "Info", className: "bg-core-accent/15 text-core-accent" };
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PredictiveInsightsPanel({ className = "" }: Props) {
  const [data, setData] = useState<PredictiveInsightsData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(() => {
    setData(computePredictiveInsights());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) return null;

  const {
    momentumForecast,
    dropoffRisk,
    goalCompletionProbability,
    careerDirectionConfidence,
    nextWeekPrediction,
    recommendedIntervention,
    futureSignals,
  } = data;

  const badge = priorityBadge(recommendedIntervention.priority);

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* ───── HEADER ───── */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Predictive insights</p>
          <h2 className="mt-1 text-xl font-semibold text-core-heading">Where your path is heading</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-medium text-core-accent transition hover:text-indigo-400"
        >
          {showDetails ? "Show less" : "Show all"}
        </button>
      </div>

      {/* ───── NEXT WEEK FORECAST ───── */}
      <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">
              {activityIcon(nextWeekPrediction.expectedActivity)}
            </span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Next week forecast
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              nextWeekPrediction.expectedActivity === "high"
                ? "bg-emerald-500/15 text-emerald-400"
                : nextWeekPrediction.expectedActivity === "moderate"
                  ? "bg-blue-500/15 text-blue-400"
                  : "bg-amber-500/15 text-amber-400"
            }`}
          >
            {nextWeekPrediction.expectedActivity} activity
          </span>
        </div>
        <p className="mt-2 text-sm text-core-text leading-relaxed">
          {nextWeekPrediction.forecast}
        </p>
        {showDetails && (
          <div className="mt-3 space-y-2 border-t border-core-border/40 pt-3">
            {nextWeekPrediction.likelyActions.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted/70 font-semibold mb-1">
                  Likely actions
                </p>
                <ul className="space-y-1">
                  {nextWeekPrediction.likelyActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-core-accent/60" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {nextWeekPrediction.watchFor.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted/70 font-semibold mb-1">
                  Watch for
                </p>
                <ul className="space-y-1">
                  {nextWeekPrediction.watchFor.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-400/80">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───── METRICS GRID ───── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {/* Dropoff risk */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Dropoff risk
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-core-heading">{dropoffRisk.score}</span>
            <span className="text-[10px] text-core-muted">/ 100</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${dropoffColor(dropoffRisk.level)}`}
              style={{ width: `${dropoffRisk.score}%` }}
            />
          </div>
          <p className={`mt-1 text-[11px] font-medium ${
            dropoffRisk.level === "high" || dropoffRisk.level === "elevated"
              ? "text-amber-400"
              : "text-emerald-400"
          }`}>
            {dropoffRisk.level === "low" ? "Low risk"
              : dropoffRisk.level === "moderate" ? "Moderate"
              : dropoffRisk.level === "elevated" ? "Elevated"
              : "High risk"}
          </p>
          {showDetails && dropoffRisk.factors.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-core-border/40 pt-2">
              {dropoffRisk.factors.slice(0, 2).map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] text-core-muted leading-tight">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-core-muted/50" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Goal probability */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Goal probability
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-core-heading">{goalCompletionProbability.percentage}</span>
            <span className="text-[10px] text-core-muted">%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                goalCompletionProbability.percentage >= 60
                  ? "bg-emerald-500"
                  : goalCompletionProbability.percentage >= 30
                    ? "bg-amber-500"
                    : "bg-core-accent/60"
              }`}
              style={{ width: `${goalCompletionProbability.percentage}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-core-muted">
            {goalCompletionProbability.estimatedMonthsRemaining !== null
              ? `~${goalCompletionProbability.estimatedMonthsRemaining} months remaining`
              : "No goal set"}
          </p>
        </div>

        {/* Direction confidence */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Direction confidence
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-core-heading">{careerDirectionConfidence.score}</span>
            <span className="text-[10px] text-core-muted">/ 100</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${directionColor(careerDirectionConfidence.level)}`}
              style={{ width: `${careerDirectionConfidence.score}%` }}
            />
          </div>
          <p className={`mt-1 text-[11px] font-medium ${
            careerDirectionConfidence.level === "strong"
              ? "text-emerald-400"
              : careerDirectionConfidence.level === "moderate"
                ? "text-blue-400"
                : "text-amber-400"
          }`}>
            {careerDirectionConfidence.level === "strong" ? "Strong"
              : careerDirectionConfidence.level === "moderate" ? "Moderate"
              : careerDirectionConfidence.level === "unclear" ? "Unclear"
              : "Early"}
          </p>
          {showDetails && careerDirectionConfidence.supportingSignals.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-core-border/40 pt-2">
              {careerDirectionConfidence.supportingSignals.slice(0, 2).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] text-core-muted leading-tight">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-core-muted/50" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ───── MOMENTUM FORECAST ───── */}
      <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">🚀</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Momentum forecast</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${momentumColor(momentumForecast.direction)}`} />
            <span className="text-xs font-medium text-core-heading capitalize">{momentumForecast.direction}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-core-text leading-relaxed">{momentumForecast.summary}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-core-muted">
          <span>Range: {momentumForecast.predictedRange[0]}% – {momentumForecast.predictedRange[1]}%</span>
          <span>Confidence: {momentumForecast.confidence}%</span>
        </div>
      </div>

      {/* ───── SUGGESTED INTERVENTION ───── */}
      <div className="mt-4 rounded-2xl border border-core-accent/15 bg-core-accent/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">💡</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Suggested intervention</p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-core-heading">{recommendedIntervention.title}</p>
        <p className="mt-1 text-sm text-core-text leading-relaxed">{recommendedIntervention.description}</p>
        <p className="mt-2 text-xs text-core-muted italic">
          Expected impact: {recommendedIntervention.expectedImpact}
        </p>
      </div>

      {/* ───── FUTURE SIGNALS (showDetails) ───── */}
      {showDetails && futureSignals.length > 0 && (
        <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-xs">🔮</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Forward signals</p>
          </div>
          <div className="mt-3 space-y-2">
            {futureSignals.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm text-core-text"
              >
                <span className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${
                  s.likelihood === "high" ? "bg-emerald-500"
                  : s.likelihood === "moderate" ? "bg-blue-500"
                  : "bg-amber-500"
                }`} />
                <div>
                  <span className="font-medium text-core-heading capitalize">{s.likelihood}:</span>{" "}
                  {s.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── PREDICTION FEEDBACK ───── */}
      {showDetails && <PredictionFeedbackPanel className="mt-4" />}

      {/* ───── SUMMARY TEXT ───── */}
      <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">📋</span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Summary</p>
        </div>
        <p className="mt-2 text-sm text-core-text leading-relaxed">
          {careerDirectionConfidence.summary}{" "}
          {dropoffRisk.summary}{" "}
          {goalCompletionProbability.summary !== "No active career goal set. Setting a target career will enable progress tracking and predictions."
            ? goalCompletionProbability.summary
            : ""}
        </p>
      </div>
    </section>
  );
}
