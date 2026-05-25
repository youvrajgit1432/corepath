"use client";

import { useState, useCallback, useEffect } from "react";
import {
  computeLearningFriction,
  loadLearningFriction,
  type LearningFrictionData,
} from "../data/learning-friction";

// ============================================================================
// HELPERS
// ============================================================================

function severityColor(severity: "low" | "medium" | "high"): string {
  switch (severity) {
    case "high": return "text-red-400";
    case "medium": return "text-amber-400";
    case "low": return "text-emerald-400";
  }
}

function severityBg(severity: "low" | "medium" | "high"): string {
  switch (severity) {
    case "high": return "bg-red-500/10 border-red-500/20";
    case "medium": return "bg-amber-500/10 border-amber-500/20";
    case "low": return "bg-emerald-500/10 border-emerald-500/20";
  }
}

function stateBadge(state: "stuck" | "struggling" | "progressing"): {
  label: string;
  color: string;
  bg: string;
} {
  switch (state) {
    case "stuck":
      return { label: "Stuck", color: "text-red-400", bg: "bg-red-500/10" };
    case "struggling":
      return { label: "Struggling", color: "text-amber-400", bg: "bg-amber-500/10" };
    case "progressing":
      return { label: "Progressing", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  }
}

function FrictionGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 55 ? "#f87171" : score >= 30 ? "#fbbf24" : "#34d399";

  return (
    <div className="flex items-center gap-3">
      <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
        <circle cx="44" cy="44" r="36" fill="none" stroke="white" strokeOpacity={0.08} strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          className="transition-all duration-700"
        />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central" className="fill-current text-core-heading text-lg font-bold">
          {score}
        </text>
      </svg>
      <div>
        <p className="text-xs uppercase tracking-wider text-core-muted font-semibold">Friction Score</p>
        <p className={`text-sm font-medium ${color === "#34d399" ? "text-emerald-400" : color === "#fbbf24" ? "text-amber-400" : "text-red-400"}`}>
          {score >= 55 ? "Getting stuck — intervention needed" : score >= 30 ? "Some friction — light guidance" : "Low friction — progressing well"}
        </p>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-xl border border-core-border bg-core-bg/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-core-heading transition hover:bg-white/5"
      >
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-core-accent/15 px-2 py-0.5 text-[10px] font-semibold text-core-accent">
              {count}
            </span>
          )}
        </span>
        <svg
          className={`h-4 w-4 text-core-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="border-t border-core-border px-4 py-3">{children}</div>}
    </div>
  );
}

// ============================================================================
// PANEL COMPONENT
// ============================================================================

type Props = {
  className?: string;
};

export default function LearningFrictionPanel({ className = "" }: Props) {
  const [friction, setFriction] = useState<LearningFrictionData | null>(null);

  const refresh = useCallback(() => {
    const fresh = computeLearningFriction();
    setFriction(fresh);
  }, []);

  useEffect(() => {
    const existing = loadLearningFriction();
    if (existing) {
      setFriction(existing);
    } else {
      refresh();
    }
  }, [refresh]);

  if (!friction) return null;

  const badge = stateBadge(friction.stateLabel);

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-5 shadow-soft ${className}`}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted font-semibold">
            Learning Friction
          </p>
          <h3 className="mt-1 text-lg font-semibold text-core-heading">
            Where you get stuck
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.color}`}>
            {badge.label}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-core-border p-1.5 text-core-muted transition hover:border-core-accent hover:text-core-accent"
            title="Refresh"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Friction Score Gauge ── */}
      <FrictionGauge score={friction.frictionScore} />

      {/* ── Intervention Plan ── */}
      <div className={`mt-4 rounded-xl border p-4 ${friction.interventionPlan.difficulty === "easier" ? "border-red-500/20 bg-red-500/5" : "border-core-accent/20 bg-core-accent/5"}`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 text-lg ${friction.interventionPlan.difficulty === "easier" ? "text-red-400" : "text-core-accent"}`}>
            {friction.interventionPlan.difficulty === "easier" ? "⚡" : "✓"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-core-heading">Suggested Action</p>
            <p className="mt-1 text-sm text-core-text leading-snug">
              {friction.interventionPlan.action}
            </p>
            <p className="mt-1.5 text-xs text-core-muted leading-snug">
              {friction.interventionPlan.rationale}
            </p>
          </div>
        </div>
      </div>

      {/* ── Friction Areas ── */}
      {friction.frictionAreas.length > 0 && (
        <div className="mt-4 space-y-2">
          {friction.frictionAreas.map((area, i) => (
            <div
              key={`area-${i}`}
              className={`rounded-xl border px-4 py-3 ${severityBg(area.severity)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-core-heading">{area.area}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${severityColor(area.severity)}`}>
                  {area.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-core-muted leading-relaxed">{area.detail}</p>
              <p className="mt-0.5 text-[10px] text-core-muted/60">Source: {area.source}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Collapsible Sections ── */}
      <div className="mt-4 space-y-2">
        {/* Stuck Signals */}
        {friction.stuckSignals.length > 0 && (
          <CollapsibleSection title="Stuck Signals" count={friction.stuckSignals.length}>
            <div className="space-y-2">
              {friction.stuckSignals.map((signal, i) => (
                <div key={`stuck-${i}`} className="flex items-start gap-2">
                  <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    signal.severity === "high" ? "bg-red-400" : signal.severity === "medium" ? "bg-amber-400" : "bg-emerald-400"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-core-heading">{signal.signal}</p>
                    <p className="text-[11px] text-core-muted leading-snug">{signal.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Repeat Patterns */}
        {friction.repeatPatterns.length > 0 && (
          <CollapsibleSection title="Repeat Patterns" count={friction.repeatPatterns.length}>
            <div className="space-y-2">
              {friction.repeatPatterns.map((pattern, i) => (
                <div key={`pattern-${i}`} className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs text-core-muted">{i + 1}.</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-core-heading">
                      {pattern.pattern}
                      <span className="ml-1.5 text-core-muted font-normal">({pattern.count}x)</span>
                    </p>
                    <p className="text-[11px] text-core-muted leading-snug">{pattern.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Dropoff Moments */}
        {friction.dropoffMoments.length > 0 && (
          <CollapsibleSection title="Dropoff Moments" count={friction.dropoffMoments.length}>
            <div className="space-y-2">
              {friction.dropoffMoments.map((moment, i) => (
                <div key={`dropoff-${i}`} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-core-accent/60" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-core-heading">{moment.stage}</p>
                    <p className="text-[11px] text-core-muted leading-snug">{moment.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Recovery Signals */}
        {friction.recoverySignals.length > 0 && (
          <CollapsibleSection title="Recovery Signals" count={friction.recoverySignals.length}>
            <div className="grid gap-2 sm:grid-cols-2">
              {friction.recoverySignals.map((signal, i) => (
                <div key={`recovery-${i}`} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                  <p className="text-xs font-medium text-emerald-400">{signal.signal}</p>
                  <p className="mt-0.5 text-[11px] text-core-muted leading-snug">{signal.detail}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </section>
  );
}
