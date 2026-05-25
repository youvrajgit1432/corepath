// CorePath — Decision Confidence Panel
// Visualizes "How confident should this user feel choosing this direction?"

"use client";

import { useState, useEffect, useCallback } from "react";
import { getDecisionConfidence, loadDecisionConfidence } from "@/data/decision-confidence";
import type {
  DecisionConfidenceData,
  ConfidenceDriver,
  UncertaintySignal,
} from "@/data/decision-confidence";

// ── Helpers ────────────────────────────────────────────────────────

function gaugeColor(score: number): string {
  if (score >= 65) return "text-emerald-400";
  if (score >= 45) return "text-amber-400";
  return "text-slate-400";
}

function gaugeStroke(score: number): string {
  if (score >= 65) return "stroke-emerald-400";
  if (score >= 45) return "stroke-amber-400";
  return "stroke-slate-400";
}

function stabilityColor(stability: string): string {
  switch (stability) {
    case "stable":
      return "text-emerald-400";
    case "fluctuating":
      return "text-amber-400";
    case "emerging":
      return "text-blue-400";
    default:
      return "text-white/60";
  }
}

function stabilityLabel(stability: string): string {
  switch (stability) {
    case "stable":
      return "Stable";
    case "fluctuating":
      return "Fluctuating";
    case "emerging":
      return "Still forming";
    default:
      return "Unknown";
  }
}

function actionBadge(type: string): { color: string; label: string } {
  switch (type) {
    case "reinforce":
      return { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Reinforce" };
    case "explore":
      return { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Explore" };
    case "pause":
      return { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Pause & Reflect" };
    default:
      return { color: "bg-white/10 text-white/60 border-white/10", label: type };
  }
}

function driverBarColor(impact: number): string {
  if (impact >= 15) return "bg-emerald-500";
  if (impact >= 5) return "bg-emerald-500/50";
  if (impact >= 0) return "bg-white/20";
  if (impact >= -10) return "bg-amber-500/50";
  return "bg-red-500/50";
}

function severityBorder(severity: UncertaintySignal["severity"]): string {
  switch (severity) {
    case "high":
      return "border-l-red-500";
    case "medium":
      return "border-l-amber-500";
    case "low":
      return "border-l-blue-400";
  }
}

// ── SVG Gauge ──────────────────────────────────────────────────────

function ConfidenceGauge({ score }: { score: number }) {
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-white/10"
      />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={gaugeStroke(score)}
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="48"
        y="44"
        textAnchor="middle"
        className="fill-white text-lg font-bold"
        dominantBaseline="central"
      >
        {score}
      </text>
      <text
        x="48"
        y="64"
        textAnchor="middle"
        className="fill-white/40 text-[7px] uppercase tracking-wider"
        dominantBaseline="central"
      >
        confidence
      </text>
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function DriverBar({ driver }: { driver: ConfidenceDriver }) {
  const absImpact = Math.abs(driver.impact);
  const barWidth = Math.min(100, absImpact * 2.5);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-white/80 truncate">{driver.driver}</span>
          <span
            className={`text-[10px] font-medium shrink-0 ml-2 ${
              driver.impact >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {driver.impact >= 0 ? "+" : ""}{driver.impact}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${driverBarColor(driver.impact)}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function UncertaintyCard({ signal }: { signal: UncertaintySignal }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border-l-4 ${severityBorder(signal.severity)} bg-white/5 rounded-lg p-3 cursor-pointer transition-colors hover:bg-white/10`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/90 truncate">{signal.signal}</span>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ml-2 ${
            signal.severity === "high"
              ? "bg-red-500/20 text-red-400"
              : signal.severity === "medium"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-blue-500/20 text-blue-400"
          }`}
        >
          {signal.severity}
        </span>
      </div>
      {open && (
        <p className="mt-2 text-xs text-white/60 leading-relaxed">{signal.description}</p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function DecisionConfidencePanel({ className = "" }: { className?: string }) {
  const [data, setData] = useState<DecisionConfidenceData | null>(null);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showUncertainty, setShowUncertainty] = useState(false);

  useEffect(() => {
    const cached = loadDecisionConfidence();
    if (cached) {
      setData(cached);
    } else {
      setData(getDecisionConfidence());
    }
  }, []);

  const refresh = useCallback(() => {
    setData(getDecisionConfidence());
  }, []);

  if (!data) {
    return (
      <div className={`${className} rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-44 bg-white/10 rounded" />
          <div className="h-20 bg-white/5 rounded" />
          <div className="h-12 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  const posDrivers = data.confidenceDrivers.filter((d) => d.impact > 0);
  const negDrivers = data.confidenceDrivers.filter((d) => d.impact < 0);
  const badge = actionBadge(data.recommendedAction.type);
  const useGaugeColor = gaugeColor(data.confidenceScore);

  return (
    <div className={`${className} rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5 space-y-5`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
            Decision Confidence
          </h3>
          <p className="text-xs text-white/40 mt-0.5">
            Stability:{" "}
            <span className={stabilityColor(data.decisionStability)}>
              {stabilityLabel(data.decisionStability)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              data.decisionStability === "stable"
                ? "bg-emerald-500"
                : data.decisionStability === "fluctuating"
                  ? "bg-amber-500"
                  : "bg-blue-500"
            }`}
          />
          <button
            onClick={refresh}
            className="text-[10px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-wider"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Gauge + Readiness */}
      <div className="flex items-center gap-5">
        <ConfidenceGauge score={data.confidenceScore} />
        <div className="flex-1 min-w-0 space-y-2">
          {/* Exploration readiness */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/60">Exploration readiness</span>
              <span className={useGaugeColor}>{data.explorationReadiness}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${data.explorationReadiness}%`,
                  background: data.explorationReadiness >= 60
                    ? "linear-gradient(90deg, #34d399, #60a5fa)"
                    : data.explorationReadiness >= 35
                      ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                      : "linear-gradient(90deg, #94a3b8, #64748b)",
                }}
              />
            </div>
          </div>

          {/* Driver count summary */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-400">+{posDrivers.length} drivers</span>
            {negDrivers.length > 0 && (
              <span className="text-red-400">{negDrivers.length} concerns</span>
            )}
            <span className="text-white/40">
              {data.uncertaintySignals.length} uncertainty signals
            </span>
          </div>
        </div>
      </div>

      {/* Recommended action badge */}
      <div className={`border ${badge.color} rounded-lg px-4 py-3`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">{badge.label}</span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">{data.recommendedAction.description}</p>
      </div>

      {/* Confidence Drivers */}
      {data.confidenceDrivers.length > 0 && (
        <div>
          <button
            onClick={() => setShowDrivers(!showDrivers)}
            className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 hover:text-white/80 transition-colors"
          >
            <span>Confidence Drivers ({data.confidenceDrivers.length})</span>
            <span className="text-[10px]">{showDrivers ? "▾" : "▸"}</span>
          </button>
          {showDrivers && (
            <div className="space-y-2.5">
              {/* Positive drivers sorted by impact descending */}
              {posDrivers.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1.5">
                    Positive
                  </p>
                  {posDrivers.sort((a, b) => b.impact - a.impact).map((d, i) => (
                    <DriverBar key={`pos-${i}`} driver={d} />
                  ))}
                </div>
              )}
              {/* Negative drivers sorted by impact ascending */}
              {negDrivers.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-red-400/70 mb-1.5">
                    Concerns
                  </p>
                  {negDrivers.sort((a, b) => a.impact - b.impact).map((d, i) => (
                    <DriverBar key={`neg-${i}`} driver={d} />
                  ))}
                </div>
              )}
              {/* Neutral drivers */}
              {data.confidenceDrivers.filter((d) => d.impact === 0).map((d, i) => (
                <DriverBar key={`neu-${i}`} driver={d} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Uncertainty Signals */}
      {data.uncertaintySignals.length > 0 && (
        <div>
          <button
            onClick={() => setShowUncertainty(!showUncertainty)}
            className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 hover:text-white/80 transition-colors"
          >
            <span>Uncertainty Signals ({data.uncertaintySignals.length})</span>
            <span className="text-[10px]">{showUncertainty ? "▾" : "▸"}</span>
          </button>
          {showUncertainty && (
            <div className="space-y-2">
              {data.uncertaintySignals.map((s, i) => (
                <UncertaintyCard key={i} signal={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Narrative */}
      <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
        <p className="text-xs text-white/60 leading-relaxed italic">
          {data.decisionNarrative}
        </p>
      </div>
    </div>
  );
}
