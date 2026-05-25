"use client";

import { useState, useEffect, useCallback } from "react";
import {
  computeDecisionReadiness,
  loadDecisionReadiness,
  type DecisionReadinessData,
  type HesitationLevel,
  type RecommendedAction,
  type ClarityTrend,
  type ChoicePressure,
  type ComparisonLoop,
  type DecisionSignal,
} from "../data/decision-readiness";

type Props = {
  className?: string;
};

const HESITATION_LABELS: Record<HesitationLevel, string> = {
  low: "Low — preferences are clear",
  moderate: "Moderate — weighing options",
  high: "High — multiple paths unclear",
};

const HESITATION_COLORS: Record<HesitationLevel, string> = {
  low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  moderate: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  high: "text-red-400 border-red-500/30 bg-red-500/10",
};

const ACTION_LABELS: Record<RecommendedAction, string> = {
  explore: "Explore More",
  compare: "Compare Options",
  commit: "Ready to Commit",
  pause: "Pause & Reflect",
};

const ACTION_COLORS: Record<RecommendedAction, string> = {
  explore: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  compare: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  commit: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  pause: "border-sky-500/30 bg-sky-500/10 text-sky-400",
};

const ACTION_ICONS: Record<RecommendedAction, string> = {
  explore: "🔍",
  compare: "⚖️",
  commit: "🎯",
  pause: "💭",
};

const CLARITY_COLORS: Record<ClarityTrend, string> = {
  improving: "text-emerald-400",
  stable: "text-core-muted",
  declining: "text-red-400",
};

const PRESSURE_COLORS: Record<ChoicePressure, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

const SIGNAL_ICONS: Record<string, string> = {
  positive: "✅",
  negative: "⚠️",
  neutral: "ℹ️",
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 65 ? "from-emerald-500 to-emerald-400" : score >= 35 ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400";

  return (
    <div className="flex flex-col items-center">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out bg-gradient-to-r ${color}`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            stroke: score >= 65 ? "#34d399" : score >= 35 ? "#f59e0b" : "#f87171",
          }}
        />
        <text
          x="60"
          y="56"
          textAnchor="middle"
          className="fill-core-heading text-2xl font-bold"
          transform="rotate(90, 60, 60)"
        >
          {score}
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          className="fill-core-muted text-[8px] uppercase tracking-wider"
          transform="rotate(90, 60, 60)"
        >
          out of 100
        </text>
      </svg>
    </div>
  );
}

function MiniGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg className="h-10 w-10 shrink-0 -rotate-90" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
      <circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className={score >= 65 ? "text-emerald-400" : score >= 35 ? "text-amber-400" : "text-red-400"}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
        }}
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-core-heading text-[7px] font-bold"
        transform="rotate(90, 20, 20)"
      >
        {score}
      </text>
    </svg>
  );
}

function ComparisonLoopCard({ loop }: { loop: ComparisonLoop }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-core-heading">
          {loop.careerA} vs {loop.careerB}
        </p>
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
          ×{loop.count}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-core-muted">
        First compared {new Date(loop.firstCompared).toLocaleDateString()} · Last compared{" "}
        {new Date(loop.lastCompared).toLocaleDateString()}
      </p>
    </div>
  );
}

function SignalRow({ signal }: { signal: DecisionSignal }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-core-border/50 bg-core-bg/30 p-2.5">
      <span className="mt-0.5 text-xs shrink-0">{SIGNAL_ICONS[signal.type] ?? "📌"}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-core-heading">{signal.signal}</p>
        <p className="mt-0.5 text-[10px] text-core-muted leading-relaxed">{signal.detail}</p>
        <p className="mt-0.5 text-[9px] text-core-muted/50 uppercase tracking-wider">{signal.source}</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DecisionReadinessPanel({ className = "" }: Props) {
  const [data, setData] = useState<DecisionReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignals, setShowSignals] = useState(false);
  const [showLoops, setShowLoops] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const result = computeDecisionReadiness();
      setData(result);
      setLoading(false);
    }, 0);
  }, []);

  useEffect(() => {
    const existing = loadDecisionReadiness();
    if (existing) {
      setData(existing);
      setLoading(false);
    } else {
      refresh();
    }
  }, [refresh]);

  if (loading && !data) {
    return (
      <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Decision readiness</p>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-core-accent/30 border-t-core-accent" />
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Decision readiness</p>
        <p className="mt-2 text-sm text-core-muted">Insufficient data to assess decision readiness. Continue exploring careers and taking quizzes.</p>
        <button
          type="button"
          onClick={refresh}
          className="mt-3 rounded-full bg-core-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
        >
          Assess now
        </button>
      </section>
    );
  }

  const positiveSignals = data.decisionSignals.filter((s) => s.type === "positive");
  const negativeSignals = data.decisionSignals.filter((s) => s.type === "negative");

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Decision readiness</p>
          <h2 className="mt-1 text-lg font-semibold text-core-heading">Are you ready to choose?</h2>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full border border-core-border px-3 py-1.5 text-[10px] font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Refresh
        </button>
      </div>

      {/* Main gauge + state */}
      <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-core-border bg-core-bg/60 p-5">
        <ScoreGauge score={data.decisionScore} />

        {/* Recommended action */}
        <div className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${ACTION_COLORS[data.recommendedAction]}`}>
          {ACTION_ICONS[data.recommendedAction]} {ACTION_LABELS[data.recommendedAction]}
        </div>

        {/* Decision narrative */}
        <p className="text-center text-xs text-core-muted leading-relaxed max-w-md">
          {data.decisionNarrative}
        </p>
      </div>

      {/* Key indicators row */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {/* Hesitation */}
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-core-muted font-semibold">Hesitation</p>
          <div className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${HESITATION_COLORS[data.hesitationLevel]}`}>
            {data.hesitationLevel}
          </div>
          <p className="mt-1 text-[9px] text-core-muted leading-tight">{HESITATION_LABELS[data.hesitationLevel]}</p>
        </div>

        {/* Clarity trend */}
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-core-muted font-semibold">Clarity</p>
          <p className={`mt-1.5 text-sm font-bold ${CLARITY_COLORS[data.clarityTrend]}`}>
            {data.clarityTrend === "improving" ? "↑" : data.clarityTrend === "declining" ? "↓" : "→"}
          </p>
          <p className="mt-1 text-[9px] text-core-muted leading-tight capitalize">{data.clarityTrend}</p>
        </div>

        {/* Pressure */}
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-core-muted font-semibold">Pressure</p>
          <p className={`mt-1.5 text-sm font-bold ${PRESSURE_COLORS[data.choicePressure]}`}>
            {data.choicePressure === "high" ? "⚡" : data.choicePressure === "low" ? "✓" : "~"}
          </p>
          <p className="mt-1 text-[9px] text-core-muted leading-tight capitalize">{data.choicePressure}</p>
        </div>
      </div>

      {/* Comparison loops */}
      {data.comparisonLoops.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowLoops(!showLoops)}
            className="flex w-full items-center justify-between rounded-xl border border-core-border bg-core-bg/40 p-3 text-left"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Repeated comparisons ({data.comparisonLoops.length})
            </p>
            <span className="text-xs text-core-muted">{showLoops ? "▲" : "▼"}</span>
          </button>
          {showLoops && (
            <div className="mt-2 space-y-2">
              {data.comparisonLoops.map((loop, i) => (
                <ComparisonLoopCard key={`loop-${i}`} loop={loop} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Decision signals */}
      {data.decisionSignals.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowSignals(!showSignals)}
            className="flex w-full items-center justify-between rounded-xl border border-core-border bg-core-bg/40 p-3 text-left"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Signals ({data.decisionSignals.length})
            </p>
            <span className="text-xs text-core-muted">{showSignals ? "▲" : "▼"}</span>
          </button>
          {showSignals && (
            <div className="mt-2 space-y-1.5">
              {positiveSignals.length > 0 && (
                <div>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-emerald-400/70 font-semibold">Positive</p>
                  {positiveSignals.map((s, i) => (
                    <SignalRow key={`sig-pos-${i}`} signal={s} />
                  ))}
                </div>
              )}
              {negativeSignals.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-amber-400/70 font-semibold">Concerns</p>
                  {negativeSignals.map((s, i) => (
                    <SignalRow key={`sig-neg-${i}`} signal={s} />
                  ))}
                </div>
              )}
              {data.decisionSignals.filter((s) => s.type === "neutral").length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-core-muted/50 font-semibold">Neutral</p>
                  {data.decisionSignals.filter((s) => s.type === "neutral").map((s, i) => (
                    <SignalRow key={`sig-neu-${i}`} signal={s} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p className="mt-4 text-[9px] text-core-muted/50 text-right">
        Assessed {new Date(data.computedAt).toLocaleString()}
      </p>
    </section>
  );
}
