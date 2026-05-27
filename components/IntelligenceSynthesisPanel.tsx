"use client";

import { useEffect, useState } from "react";
import {
  getFocusModeMeta,
  getUrgencyMeta,
} from "../data/intelligence-synthesis";
import type {
  IntelligenceSynthesisData,
  FocusMode,
  UrgencyLevel,
} from "../data/intelligence-synthesis";
import { ensurePipeline } from "../data/pipeline";
import { getStored } from "../data/shared-context";

// ============================================================================
// COLOR / STYLE HELPERS
// ============================================================================

const focusColors: Record<FocusMode, string> = {
  recover: "border-rose-200/80 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/8",
  execute: "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/8",
  focus: "border-sky-200/80 bg-sky-50/60 dark:border-sky-500/30 dark:bg-sky-500/8",
  recalibrate: "border-amber-200/80 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/8",
  explore: "border-violet-200/80 bg-violet-50/60 dark:border-violet-500/30 dark:bg-violet-500/8",
};

const urgencyColors: Record<UrgencyLevel, string> = {
  critical: "bg-red-100/80 text-red-700 border-red-200/60 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
  high: "bg-amber-100/80 text-amber-700 border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  medium: "bg-sky-100/80 text-sky-700 border-sky-200/60 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
  low: "bg-slate-100/80 text-slate-600 border-slate-200/60 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30",
};

function confidenceBarColor(score: number): string {
  if (score >= 65) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-slate-400";
}

function confidenceTextColor(score: number): string {
  if (score >= 65) return "text-emerald-700 dark:text-emerald-400";
  if (score >= 40) return "text-amber-700 dark:text-amber-400";
  return "text-slate-600 dark:text-slate-400";
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function UrgencyBadge({ level }: { level: UrgencyLevel }) {
  const meta = getUrgencyMeta(level);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${urgencyColors[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        level === "critical" ? "bg-red-600 dark:bg-red-400 animate-pulse" : 
        level === "high" ? "bg-amber-600 dark:bg-amber-400" : 
        level === "medium" ? "bg-sky-600 dark:bg-sky-400" : "bg-slate-600 dark:bg-slate-400"
      }`} />
      {meta.label}
    </span>
  );
}

function ActionStepCard({ step, index: i }: { step: string; index: number }) {
  const stepColors = [
    "border-emerald-500/30 bg-emerald-500/5",
    "border-sky-500/30 bg-sky-500/5",
    "border-violet-500/30 bg-violet-500/5",
  ];
  const stepIcons = ["1", "2", "3"];

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${stepColors[i % 3]}`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        i === 0 ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
        i === 1 ? "bg-sky-100/80 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400" :
        "bg-violet-100/80 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400"
      }`}>
        {stepIcons[i]}
      </span>
      <p className="text-sm text-core-text leading-relaxed">{step}</p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function IntelligenceSynthesisPanel({ className = "" }: { className?: string }) {
  const [data, setData] = useState<IntelligenceSynthesisData | null>(null);

  useEffect(() => {
    // Run the full data pipeline to ensure all modules are computed
    // in the correct dependency order (including the two-pass for
    // the decision-intelligence ↔ intelligence-synthesis circular pair).
    ensurePipeline();
    setData(getStored<IntelligenceSynthesisData>("intelligence-synthesis"));
  }, []);

  if (!data) return null;

  const {
    focusMode,
    urgencyLevel,
    primarySignal,
    primaryReason,
    topOpportunity,
    topRisk,
    contradictions,
    actionPlan,
    confidence,
    summaryNarrative,
  } = data;

  const meta = getFocusModeMeta(focusMode);

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-4 sm:p-6 ${className}`}>
      {/* ── HEADER ── */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Intelligence synthesis hub</p>
        <h2 className="mt-1 text-xl font-semibold text-core-heading">Your single most important need</h2>
      </div>

      {/* ── EXECUTIVE SUMMARY HERO CARD ── */}
      <div className={`rounded-2xl border p-5 ${focusColors[focusMode]}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{meta.icon}</span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Focus mode</p>
                <p className="text-lg font-bold text-core-heading">{meta.label}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-core-text leading-relaxed">{meta.description}</p>
          </div>
          <div className="shrink-0">
            <UrgencyBadge level={urgencyLevel} />
          </div>
        </div>
      </div>

      {/* ── PRIMARY SIGNAL ── */}
      <div className="mt-4 rounded-xl border border-core-accent/15 bg-core-accent/5 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Primary signal</p>
        <p className="mt-1 text-sm font-medium text-core-heading leading-snug">{primarySignal}</p>
        <p className="mt-2 text-xs text-core-muted leading-relaxed">{primaryReason}</p>
      </div>

      {/* ── TOP OPPORTUNITY & TOP RISK ── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-base">🌟</span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 font-semibold">Opportunity</p>
              <p className="mt-1 text-xs text-core-text leading-relaxed">{topOpportunity}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-base">⚠️</span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-rose-700 dark:text-rose-400 font-semibold">Risk</p>
              <p className="mt-1 text-xs text-core-text leading-relaxed">{topRisk}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTRADICTIONS ── */}
      {contradictions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Contradictions resolved ({contradictions.length})
          </p>
          <div className="space-y-2">
            {contradictions.map((c, i) => (
              <div key={`con-${i}`} className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5 p-3">
                <span className="mt-0.5 text-sm">🔄</span>
                <p className="text-xs text-core-text leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3-STEP ACTION PLAN ── */}
      <div className="mt-5">
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Action plan
        </p>
        <div className="space-y-2">
          {actionPlan.map((step, i) => (
            <ActionStepCard key={`step-${i}`} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* ── CONFIDENCE METER ── */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Synthesis confidence
          </p>
          <span className={`text-sm font-bold ${confidenceTextColor(confidence)}`}>
            {confidence}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-core-border/50 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${confidenceBarColor(confidence)}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* ── NARRATIVE SUMMARY ── */}
      <div className="mt-5 rounded-xl border border-core-border bg-core-bg/60 p-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-base">📋</span>
          <p className="text-xs text-core-muted leading-relaxed">{summaryNarrative}</p>
        </div>
      </div>
    </section>
  );
}
