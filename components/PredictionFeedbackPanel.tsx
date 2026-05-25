"use client";

import { useState, useEffect, useCallback } from "react";
import {
  computePredictionFeedback,
  loadPredictionFeedback,
  type PredictionFeedbackData,
} from "../data/prediction-feedback";

type Props = {
  className?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function accuracyColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-core-accent/60";
}

function accuracyTextColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-core-muted";
}

function verdictIcon(verdict: string): string {
  switch (verdict) {
    case "correct":
      return "✅";
    case "partial":
      return "🟡";
    case "incorrect":
      return "❌";
    default:
      return "⏳";
  }
}

function driftIcon(shift: string): string {
  switch (shift) {
    case "improving":
    case "rising":
      return "📈";
    case "declining":
    case "falling":
    case "worsening":
      return "📉";
    case "stable":
      return "➡️";
    default:
      return "❓";
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PredictionFeedbackPanel({ className = "" }: Props) {
  const [data, setData] = useState<PredictionFeedbackData | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(() => {
    // Try loading existing first, then compute fresh
    const existing = loadPredictionFeedback();
    if (existing) {
      setData(existing);
    }
    // Compute fresh (evaluates pending predictions)
    const fresh = computePredictionFeedback();
    setData(fresh);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) return null;

  const {
    accuracyScore,
    predictionDrift,
    successfulPredictions,
    failedPredictions,
    learningSignals,
    predictionHistory,
  } = data;

  const pendingCount = predictionHistory.filter((r) => r.verdict === "pending").length;
  const evaluatedCount = accuracyScore.totalEvaluated;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* ───── HEADER ───── */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Prediction feedback</p>
          <h2 className="mt-1 text-xl font-semibold text-core-heading">Learning from predictions</h2>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
              {pendingCount} pending
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-medium text-core-accent transition hover:text-indigo-400"
          >
            {showHistory ? "Show less" : "Show all"}
          </button>
        </div>
      </div>

      {/* ───── PREDICTION ACCURACY ───── */}
      <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">🎯</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Prediction accuracy</p>
          </div>
          <span className={`text-lg font-bold ${accuracyTextColor(accuracyScore.overall)}`}>
            {accuracyScore.overall}%
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${accuracyColor(accuracyScore.overall)}`}
            style={{ width: `${accuracyScore.overall}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-core-muted">
          Based on {evaluatedCount} evaluated prediction{evaluatedCount !== 1 ? "s" : ""}
          {accuracyScore.totalEvaluated > 0 && ` · ${accuracyScore.totalCorrect} dimension${accuracyScore.totalCorrect !== 1 ? "s" : ""} correct`}
        </p>

        {/* Per-dimension breakdown */}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <DimensionScore label="Momentum" score={accuracyScore.byDimension.momentum} />
          <DimensionScore label="Dropoff" score={accuracyScore.byDimension.dropoff} />
          <DimensionScore
            label="Goal"
            score={accuracyScore.byDimension.goal ?? null}
            fallback="N/A"
          />
          <DimensionScore label="Direction" score={accuracyScore.byDimension.direction} />
        </div>
      </div>

      {/* ───── TWO COLUMN: What we learned + Improving Areas ───── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* What the system learned */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-xs">🧠</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">What the system learned</p>
          </div>
          {learningSignals.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {learningSignals.slice(0, showHistory ? undefined : 3).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-core-text">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      s.confidence === "strong" ? "bg-emerald-500"
                        : s.confidence === "moderate" ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <span className="leading-snug">{s.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-core-muted">
              No learning signals yet. Predictions will be evaluated after 1 hour.
            </p>
          )}
        </div>

        {/* Improving / Prediction drift */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs">📊</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Prediction drift</p>
          </div>
          {predictionDrift.momentumShift !== "insufficient_data" ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-core-muted">Momentum outlook</span>
                <span className="flex items-center gap-1.5 text-core-text">
                  <span>{driftIcon(predictionDrift.momentumShift)}</span>
                  <span className="capitalize">{predictionDrift.momentumShift}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-core-muted">Dropoff risk</span>
                <span className="flex items-center gap-1.5 text-core-text">
                  <span>{driftIcon(predictionDrift.dropoffShift)}</span>
                  <span className="capitalize">{predictionDrift.dropoffShift}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-core-muted">Direction confidence</span>
                <span className="flex items-center gap-1.5 text-core-text">
                  <span>{driftIcon(predictionDrift.directionTrend)}</span>
                  <span className="capitalize">{predictionDrift.directionTrend}</span>
                </span>
              </div>
              <p className="text-xs text-core-muted leading-relaxed">{predictionDrift.summary}</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-core-muted">
              Need at least 2 prediction snapshots to detect drift.
            </p>
          )}
        </div>
      </div>

      {/* ───── SUCCESSES & FAILURES (showDetails) ───── */}
      {showHistory && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Successful predictions */}
          {successfulPredictions.length > 0 && (
            <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs">✅</span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Successful predictions ({successfulPredictions.length})
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {successfulPredictions.map((s, i) => (
                  <li key={i} className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-2.5">
                    <p className="text-xs font-medium text-emerald-400">{s.dimension}</p>
                    <p className="mt-0.5 text-xs text-core-muted">{s.actualOutcome}</p>
                    <p className="mt-0.5 text-[10px] text-core-muted/70 italic">{s.whatWorked}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Failed predictions */}
          {failedPredictions.length > 0 && (
            <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-xs">🔧</span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Improving areas ({failedPredictions.length})
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {failedPredictions.map((f, i) => (
                  <li key={i} className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-2.5">
                    <p className="text-xs font-medium text-amber-400">{f.dimension}</p>
                    <p className="mt-0.5 text-xs text-core-muted">
                      Predicted: {f.predictedValue} · Actual: {f.actualOutcome}
                    </p>
                    <p className="mt-0.5 text-[10px] text-core-muted/70 italic">{f.adjustment}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ───── PREDICTION HISTORY (showDetails) ───── */}
      {showHistory && predictionHistory.length > 0 && (
        <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">📜</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Prediction history ({predictionHistory.length})
            </p>
          </div>
          <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
            {predictionHistory.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-core-border/50 p-2 text-xs text-core-muted"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">{verdictIcon(r.verdict)}</span>
                  <span className="truncate">
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="shrink-0 ml-2 font-medium capitalize">
                  {r.verdict === "pending"
                    ? "⏳ Pending"
                    : r.verdict === "correct"
                      ? "✅ Correct"
                      : r.verdict === "partial"
                        ? "🟡 Partial"
                        : "❌ Incorrect"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── LEARNING SUMMARY ───── */}
      <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">📋</span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Learning summary</p>
        </div>
        <p className="mt-2 text-sm text-core-text leading-relaxed">
          {evaluatedCount === 0
            ? "No predictions have been evaluated yet. Predictions are automatically evaluated 1 hour after they are made. Keep using the platform to build prediction feedback."
            : `After ${evaluatedCount} evaluated prediction${evaluatedCount !== 1 ? "s" : ""}, ` +
              `the system has ${accuracyScore.overall >= 60 ? "reliable" : "developing"} accuracy at ${accuracyScore.overall}%. ` +
              (learningSignals.length > 0 && learningSignals[0].confidence === "strong"
                ? "The prediction model is well-calibrated for this user's behavior patterns."
                : learningSignals.length > 0
                  ? "The model is learning and will improve as more prediction feedback is collected."
                  : "More data will improve prediction accuracy over time.")}
        </p>
      </div>
    </section>
  );
}

// ── Sub-component: Dimension score pill ────────────────────────────────────────

function DimensionScore({ label, score, fallback }: { label: string; score: number | null; fallback?: string }) {
  if (score === null) {
    return (
      <div className="rounded-lg border border-core-border/50 bg-white/5 p-2 text-center">
        <p className="text-[10px] uppercase tracking-wider text-core-muted">{label}</p>
        <p className="mt-0.5 text-xs text-core-muted/60">{fallback ?? "—"}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-core-border/50 bg-white/5 p-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-core-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${accuracyTextColor(score)}`}>{score}%</p>
    </div>
  );
}
