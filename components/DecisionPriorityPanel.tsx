"use client";

import { useState, useEffect, useCallback } from "react";
import {
  computeDecisionPriority,
  loadDecisionPriority,
  type DecisionPriorityData,
  type FocusMode,
  type UrgencyLevel,
} from "../data/decision-priority";

// ── Helpers ──

function urgencyColor(level: UrgencyLevel): string {
  switch (level) {
    case "critical": return "text-red-400 border-red-500/30 bg-red-500/10";
    case "high": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "medium": return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    case "low": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  }
}

function focusIcon(mode: FocusMode): string {
  switch (mode) {
    case "reduce_workload": return "🧘";
    case "recover": return "📋";
    case "intervention": return "⚡";
    case "challenge": return "🚀";
    case "maintain": return "✅";
  }
}

function focusLabel(mode: FocusMode): string {
  switch (mode) {
    case "reduce_workload": return "Reduce Workload";
    case "recover": return "Recover";
    case "intervention": return "Intervention";
    case "challenge": return "Challenge";
    case "maintain": return "Maintain";
  }
}

function urgencyLabel(level: UrgencyLevel): string {
  switch (level) {
    case "critical": return "Critical";
    case "high": return "High";
    case "medium": return "Medium";
    case "low": return "Low";
  }
}

// ── Mini confidence bar ──

function ConfidenceBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-core-muted w-8 text-right">{score}%</span>
    </div>
  );
}

// ── Component ──

interface Props {
  className?: string;
}

export default function DecisionPriorityPanel({ className = "" }: Props) {
  const [priority, setPriority] = useState<DecisionPriorityData | null>(null);

  const refresh = useCallback(() => {
    const fresh = computeDecisionPriority();
    setPriority(fresh);
  }, []);

  useEffect(() => {
    const cached = loadDecisionPriority();
    if (cached) {
      setPriority(cached);
    } else {
      refresh();
    }
  }, [refresh]);

  if (!priority) return null;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Priority Decision</p>
          <h2 className="mt-1 text-lg font-semibold text-core-heading">What matters most now</h2>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Reassess
        </button>
      </div>

      {/* ─── Urgency badge ─── */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold mb-4 ${urgencyColor(priority.urgencyLevel)}`}
      >
        <span className="text-sm">{focusIcon(priority.focusMode)}</span>
        <span>{focusLabel(priority.focusMode)}</span>
        <span className="opacity-60 mx-0.5">·</span>
        <span className="uppercase tracking-wider">{urgencyLabel(priority.urgencyLevel)}</span>
      </div>

      {/* ─── Top Priority ─── */}
      <div className="mb-5">
        <h3 className="text-base font-bold text-core-heading leading-snug">{priority.topPriority}</h3>
        <p className="mt-2 text-sm text-core-text leading-relaxed">{priority.priorityReason}</p>
      </div>

      {/* ─── Today's Decision ─── */}
      <div className="rounded-xl border border-core-accent/20 bg-core-accent/5 p-4 mb-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent font-semibold mb-1.5">
          Today's Decision
        </p>
        <p className="text-sm text-core-text leading-relaxed">{priority.todayDecision}</p>
      </div>

      {/* ─── Confidence ─── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-core-muted">Confidence</p>
          <span className="text-[10px] uppercase tracking-wider text-core-muted/60">
            {priority.confidenceScore >= 80 ? "Strong" : priority.confidenceScore >= 60 ? "Moderate" : "Low"}
          </span>
        </div>
        <ConfidenceBar score={priority.confidenceScore} />
      </div>

      {/* ─── Ignored Signals ─── */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-core-muted hover:text-core-text transition">
          <span className="inline-block transition-transform group-open:rotate-90">›</span>
          Ignored Signals ({priority.ignoredSignals.length})
        </summary>
        <ul className="mt-2 space-y-1.5 pl-4">
          {priority.ignoredSignals.map((signal, idx) => (
            <li key={idx} className="text-xs text-core-muted/70 leading-relaxed list-disc">
              {signal}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
