/**
 * ACTION EXECUTION PANEL
 *
 * Displays the next 24-hour action plan — what the user should actually do
 * right now based on intelligence synthesis, engagement pulse, learning
 * friction, and 5 other sources.
 *
 * Features:
 *   - Hero recommendation card
 *   - Next 24h plan
 *   - Micro-action checklist
 *   - Blockers
 *   - Energy fit indicator
 *   - Fallback action
 *   - Confidence meter
 *   - Narrative summary
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { computeActionExecution } from "../data/action-execution";
import type { ExecutionMode, ActionExecutionData } from "../data/action-execution";

interface Props {
  className?: string;
}

export default function ActionExecutionPanel({ className = "" }: Props) {
  const [data, setData] = useState<ActionExecutionData | null>(null);

  const load = useCallback(() => {
    const result = computeActionExecution();
    setData(result);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) return null;

  // ── Execution mode colors ──
  const modeColors: Record<ExecutionMode, string> = {
    recovery: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    challenge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    tiny: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    simplify: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    fallback: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const modeIcons: Record<ExecutionMode, string> = {
    recovery: "🛌",
    challenge: "🚀",
    tiny: "🌱",
    simplify: "🎯",
    fallback: "⚡",
  };

  const modeLabels: Record<ExecutionMode, string> = {
    recovery: "Recovery",
    challenge: "Challenge",
    tiny: "Tiny Steps",
    simplify: "Simplify",
    fallback: "Quick Action",
  };

  // ── Urgency colors ──
  const urgencyColor: Record<string, string> = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    high: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  // ── Confidence color ──
  const confidenceColor =
    data.executionConfidence >= 70
      ? "bg-emerald-500"
      : data.executionConfidence >= 45
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* ─── Header ─── */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted font-semibold">
            Action execution
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-core-heading">
            What to do next
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Execution mode badge */}
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${modeColors[data.executionMode]}`}
          >
            {modeIcons[data.executionMode]} {modeLabels[data.executionMode]}
          </span>
          {/* Urgency badge */}
          <span
            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${urgencyColor[data.actionUrgency]}`}
          >
            {data.actionUrgency}
          </span>
        </div>
      </div>

      {/* ─── Hero Recommendation Card ─── */}
      <div className="mb-5 rounded-xl border border-core-accent/15 bg-core-accent/5 p-4">
        <p className="text-xs font-medium text-core-accent mb-1">Recommended mode</p>
        <p className="text-sm text-core-text leading-relaxed">
          Execution mode: <strong>{modeLabels[data.executionMode]}</strong> —{" "}
          {data.executionMode === "recovery"
            ? "Recovery actions to protect engagement"
            : data.executionMode === "challenge"
              ? "Stretch actions for high-momentum windows"
              : data.executionMode === "tiny"
                ? "Micro-actions to rebuild momentum"
                : data.executionMode === "simplify"
                  ? "Simplified focus to cut through mixed signals"
                  : "Quick 2-minute actions to stay engaged"}
        </p>
      </div>

      {/* ─── Next 24h Plan ─── */}
      <div className="mb-5 rounded-xl border border-core-accent/15 bg-core-accent/5 p-4">
        <p className="text-xs font-medium text-core-accent mb-1">Next 24 hours</p>
        <p className="text-sm text-core-text leading-relaxed">{data.next24HourPlan}</p>
      </div>

      {/* ─── Execution Confidence Meter ─── */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-core-muted font-medium">Execution confidence</span>
          <span className="font-semibold text-core-heading">{data.executionConfidence}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${confidenceColor}`}
            style={{ width: `${data.executionConfidence}%` }}
          />
        </div>
      </div>

      {/* ─── Micro-Actions ─── */}
      <div className="mb-5">
        <p className="mb-3 text-xs font-medium text-core-muted">
          {data.microActions.length} micro-actions
        </p>
        <div className="space-y-2">
          {data.microActions.map((action, index) => (
            <div
              key={action.id}
              className="rounded-xl border border-core-border bg-core-bg/40 p-3.5 transition hover:border-core-accent/30 hover:bg-core-accent/5"
            >
              <div className="flex items-start gap-3">
                {/* Step number */}
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-core-accent/15 text-[10px] font-bold text-core-accent">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-core-heading">{action.title}</p>
                    <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-core-muted/70">
                      {action.difficulty}
                    </span>
                    <span className="text-[10px] text-core-muted/60">⏱{action.estimatedMinutes}m</span>
                  </div>
                  <p className="mt-0.5 text-xs text-core-muted/80 leading-relaxed">
                    {action.description}
                  </p>
                  {action.why && (
                    <p className="mt-1 text-[10px] italic text-core-muted/50">{action.why}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Energy Fit ─── */}
      <div className="mb-5 rounded-xl border border-core-border bg-core-bg/40 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-sm">🔋</span>
          <div>
            <p className="text-xs font-semibold text-core-heading mb-0.5">Energy fit</p>
            <p className="text-xs text-core-muted/80 leading-relaxed">{data.energyFit}</p>
          </div>
        </div>
      </div>

      {/* ─── Blockers ─── */}
      {data.blockers.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            ⚠️ Blockers
          </p>
          <ul className="space-y-1">
            {data.blockers.map((block, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-core-muted/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400/60" />
                <span>{block}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Fallback Action ─── */}
      {data.fallbackAction && (
        <div className="mb-5 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-sm">🔄</span>
            <div>
              <p className="text-xs font-semibold text-amber-400 mb-0.5">Fallback plan</p>
              <p className="text-xs text-core-muted/80 leading-relaxed">{data.fallbackAction}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Narrative Summary ─── */}
      {data.executionNarrative && (
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1.5">
            Why this plan
          </p>
          <p className="text-xs text-core-muted/80 leading-relaxed">{data.executionNarrative}</p>
        </div>
      )}
    </section>
  );
}
