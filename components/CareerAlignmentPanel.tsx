"use client";

import { useState, useEffect } from "react";
import {
  getCareerAlignment,
  loadCareerAlignment,
  type CareerAlignmentData,
  type DriftSignal,
} from "@/data/career-alignment";

// ── Colour helpers ────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 65) return "text-emerald-400";
  if (score >= 45) return "text-amber-400";
  return "text-slate-400";
}

function scoreRing(score: number): string {
  if (score >= 65) return "stroke-emerald-500";
  if (score >= 45) return "stroke-amber-500";
  return "stroke-slate-500";
}

function trendColor(trend: string): string {
  switch (trend) {
    case "converging": return "text-emerald-400 bg-emerald-500/10";
    case "stable": return "text-blue-400 bg-blue-500/10";
    case "drifting": return "text-amber-400 bg-amber-500/10";
    case "diverging": return "text-red-400 bg-red-500/10";
    default: return "text-slate-400 bg-slate-500/10";
  }
}

function difficultyColor(d: string): string {
  switch (d) {
    case "easier": return "text-emerald-400 bg-emerald-500/10";
    case "moderate": return "text-amber-400 bg-amber-500/10";
    case "challenging": return "text-red-400 bg-red-500/10";
    default: return "text-slate-400 bg-slate-500/10";
  }
}

function driftBorder(s: DriftSignal["severity"]): string {
  switch (s) {
    case "high": return "border-l-red-500/50";
    case "medium": return "border-l-amber-500/50";
    case "low": return "border-l-blue-500/50";
    default: return "border-l-slate-500/50";
  }
}

// ── SVG gauge ─────────────────────────────────────────────────────────────

function AlignmentGauge({ score }: { score: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6"
          className="text-white/5" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={scoreRing(score)}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="absolute text-xl font-bold tracking-tight text-core-heading">
        {score}
      </span>
    </div>
  );
}

// ── Bar component ─────────────────────────────────────────────────────────

function DriverBar({ label, value, source }: { label: string; value: number; source: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const barColor = pct >= 65 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-500" : "bg-slate-500";

  return (
    <div className="group">
      <div className="flex items-center justify-between text-xs">
        <span className="text-core-text truncate">{label}</span>
        <span className="text-core-muted shrink-0 ml-2">{pct}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-0.5 text-[10px] text-core-muted/60 truncate opacity-0 group-hover:opacity-100 transition-opacity">
        {source}
      </p>
    </div>
  );
}

// ============================================================================
// PANEL COMPONENT
// ============================================================================

export default function CareerAlignmentPanel({ className = "" }: { className?: string }) {
  const [data, setData] = useState<CareerAlignmentData | null>(null);
  const [expandedAlignments, setExpandedAlignments] = useState(false);
  const [expandedDrifts, setExpandedDrifts] = useState(true);
  const [expandedDrivers, setExpandedDrivers] = useState(false);
  const [expandedActions, setExpandedActions] = useState(true);

  useEffect(() => {
    const cached = loadCareerAlignment();
    if (cached) {
      setData(cached);
    }
    const fresh = getCareerAlignment();
    setData(fresh);
  }, []);

  if (!data) {
    return (
      <div className={`rounded-2xl border border-core-border bg-core-surface p-6 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-white/5" />
          <div className="h-6 w-48 rounded bg-white/5" />
          <div className="h-20 w-full rounded bg-white/5" />
        </div>
      </div>
    );
  }

  const {
    alignmentScore,
    alignmentTrend,
    alignmentSignals,
    driftSignals,
    careerFitDirection,
    alignmentDrivers,
    correctionActions,
    alignmentNarrative,
  } = data;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 ${className}`}>
      {/* Header */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted font-semibold">
          Career alignment
        </p>
        <h2 className="mt-1 text-lg font-semibold text-core-heading leading-snug">
          Am I on the right path?
        </h2>
      </div>

      {/* Score + Trend row */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <AlignmentGauge score={alignmentScore} />
        </div>
        <div className="min-w-0">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${trendColor(alignmentTrend)}`}>
            {alignmentTrend}
          </span>
          <p className="mt-2 text-sm text-core-text leading-relaxed">
            {careerFitDirection.length > 120
              ? careerFitDirection.slice(0, careerFitDirection.indexOf(".", 80) + 1)
              : careerFitDirection}
          </p>
        </div>
      </div>

      {/* Narrative */}
      <p className="mt-4 text-sm text-core-muted italic leading-relaxed">
        {alignmentNarrative}
      </p>

      {/* ── Drift signals ── */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setExpandedDrifts(!expandedDrifts)}
          className="flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-core-muted font-semibold"
        >
          <span>Drift signals ({driftSignals.length})</span>
          <span className={`transition-transform ${expandedDrifts ? "rotate-180" : ""}`}>▾</span>
        </button>
        {expandedDrifts && (
          <div className="mt-3 space-y-2">
            {driftSignals.length === 0 ? (
              <p className="text-xs text-core-muted/60 italic">
                No drift signals detected — your path is well-aligned.
              </p>
            ) : (
              driftSignals.map((ds, i) => {
                const severityLabel =
                  ds.severity === "high" ? "High" : ds.severity === "medium" ? "Medium" : "Low";
                return (
                  <div
                    key={`drift-${i}`}
                    className={`border-l-2 pl-3 py-1.5 ${driftBorder(ds.severity)}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-core-heading">{ds.label}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        ds.severity === "high" ? "text-red-400 bg-red-500/10" :
                        ds.severity === "medium" ? "text-amber-400 bg-amber-500/10" :
                        "text-blue-400 bg-blue-500/10"
                      }`}>
                        {severityLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-core-muted">{ds.detail}</p>
                    <p className="mt-0.5 text-[10px] text-core-muted/50">{ds.source}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Alignment signals ── */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setExpandedAlignments(!expandedAlignments)}
          className="flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-core-muted font-semibold"
        >
          <span>Strong alignment areas ({alignmentSignals.length})</span>
          <span className={`transition-transform ${expandedAlignments ? "rotate-180" : ""}`}>▾</span>
        </button>
        {expandedAlignments && (
          <div className="mt-3 space-y-2">
            {alignmentSignals.length === 0 ? (
              <p className="text-xs text-core-muted/60 italic">
                No strong alignment signals yet — building data will reveal them.
              </p>
            ) : (
              alignmentSignals.map((sig, i) => (
                <div key={`align-${i}`} className="flex items-center justify-between py-1.5">
                  <div className="min-w-0">
                    <p className="text-sm text-core-heading truncate">{sig.label}</p>
                    <p className="text-[10px] text-core-muted/50">{sig.source}</p>
                  </div>
                  <span className={`shrink-0 ml-3 text-xs font-semibold ${scoreColor(sig.value)}`}>
                    {sig.value}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Alignment drivers ── */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setExpandedDrivers(!expandedDrivers)}
          className="flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-core-muted font-semibold"
        >
          <span>Alignment drivers</span>
          <span className={`transition-transform ${expandedDrivers ? "rotate-180" : ""}`}>▾</span>
        </button>
        {expandedDrivers && (
          <div className="mt-3 space-y-2.5">
            {alignmentDrivers.slice(0, 5).map((d, i) => (
              <DriverBar key={`driver-${i}`} label={d.label} value={d.value} source={d.source} />
            ))}
          </div>
        )}
      </div>

      {/* ── Correction actions ── */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setExpandedActions(!expandedActions)}
          className="flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-core-muted font-semibold"
        >
          <span>Correction actions ({correctionActions.length})</span>
          <span className={`transition-transform ${expandedActions ? "rotate-180" : ""}`}>▾</span>
        </button>
        {expandedActions && (
          <div className="mt-3 space-y-2">
            {correctionActions.length === 0 ? (
              <p className="text-xs text-core-muted/60 italic">
                No correction actions needed — alignment is strong.
              </p>
            ) : (
              correctionActions.map((ca, i) => (
                <div
                  key={`action-${i}`}
                  className="rounded-xl border border-core-border bg-core-bg/40 p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-emerald-400 text-sm">✦</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-core-heading">{ca.action}</p>
                      <p className="mt-0.5 text-xs text-core-muted">{ca.reason}</p>
                      <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${difficultyColor(ca.difficulty)}`}>
                        {ca.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
