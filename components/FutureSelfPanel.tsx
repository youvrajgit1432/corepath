// CorePath — Future Self Intelligence Panel
// Visualizes "Who is this user becoming?"

"use client";

import { useState, useEffect, useCallback } from "react";
import { getFutureSelf, loadFutureSelf } from "@/data/future-self";
import type {
  FutureSelfData,
  RiskFactor,
  GrowthCatalyst,
  CareerEvolutionStep,
} from "@/data/future-self";

// ── Helpers ────────────────────────────────────────────────────────

function trajectoryColor(score: number): string {
  if (score >= 65) return "text-emerald-400";
  if (score >= 40) return "text-amber-600";
  return "text-core-muted";
}

function trajectoryBg(score: number): string {
  if (score >= 65) return "bg-emerald-500/20";
  if (score >= 40) return "bg-amber-500/20";
  return "bg-core-border/30";
}

function trajectoryStroke(score: number): string {
  if (score >= 65) return "stroke-emerald-400";
  if (score >= 40) return "stroke-amber-500";
  return "stroke-core-muted";
}

function severityBorder(severity: RiskFactor["severity"]): string {
  switch (severity) {
    case "high":
      return "border-l-red-500";
    case "medium":
      return "border-l-amber-500";
    case "low":
      return "border-l-blue-400";
  }
}

function catalystBarColor(strength: number): string {
  if (strength >= 70) return "bg-violet-500";
  if (strength >= 45) return "bg-violet-500/60";
  return "bg-violet-500/30";
}

function confidenceLabel(score: number): string {
  if (score >= 70) return "High confidence";
  if (score >= 45) return "Moderate confidence";
  return "Developing confidence";
}

function confidenceBg(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-core-border";
}

// ── SVG Gauge ──────────────────────────────────────────────────────

function TrajectoryGauge({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-core-border"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={trajectoryStroke(score)}
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="50"
        y="48"
        textAnchor="middle"
        className="fill-core-heading text-lg font-bold"
        dominantBaseline="central"
      >
        {score}
      </text>
      <text
        x="50"
        y="68"
        textAnchor="middle"
        className="fill-core-muted text-[8px] uppercase tracking-wider"
        dominantBaseline="central"
      >
        trajectory
      </text>
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function RiskCard({ risk }: { risk: RiskFactor }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border-l-4 ${severityBorder(risk.severity)} bg-core-surface rounded-lg p-3 cursor-pointer transition-colors hover:bg-core-accent/5`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-core-heading">{risk.factor}</span>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
            risk.severity === "high"
              ? "bg-red-500/20 text-red-500"
              : risk.severity === "medium"
                ? "bg-amber-500/20 text-amber-600"
                : "bg-blue-500/20 text-blue-500"
          }`}
        >
          {risk.severity}
        </span>
      </div>
      {open && (
        <p className="mt-2 text-xs text-core-muted leading-relaxed">
          {risk.description}
        </p>
      )}
    </div>
  );
}

function CatalystCard({ catalyst }: { catalyst: GrowthCatalyst }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="bg-core-surface rounded-lg p-3 cursor-pointer transition-colors hover:bg-core-accent/5"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-core-heading">
          {catalyst.catalyst}
        </span>
        <span className="text-xs text-violet-500 font-medium">
          {catalyst.strength}%
        </span>
      </div>
      <div className="h-1.5 bg-core-border/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${catalystBarColor(catalyst.strength)}`}
          style={{ width: `${catalyst.strength}%` }}
        />
      </div>
      {open && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-core-muted leading-relaxed">
            {catalyst.description}
          </p>
          <p className="text-xs text-violet-500/80 italic">
            → {catalyst.action}
          </p>
        </div>
      )}
    </div>
  );
}

function EvolutionTimeline({ steps }: { steps: CareerEvolutionStep[] }) {
  if (steps.length === 0) return null;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? steps : steps.slice(0, 3);

  const labels: Record<string, string> = {
    "short-term": "Near term",
    "medium-term": "Medium term",
    "long-term": "Long term",
  };

  return (
    <div className="space-y-3">
      {visible.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full mt-1 ${
                step.confidence >= 70
                  ? "bg-emerald-500"
                  : step.confidence >= 50
                    ? "bg-amber-500"
                    : "bg-core-border"
              }`}
            />
            {i < steps.length - 1 && (
              <div className="w-px flex-1 bg-core-border min-h-[24px]" />
            )}
          </div>
          <div className="flex-1 pb-3 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-core-muted uppercase tracking-wider">
                {labels[step.timeframe] ?? step.timeframe}
              </span>
              <span className="text-[10px] text-core-muted/60">
                {step.confidence}% confidence
              </span>
            </div>
            <p className="text-sm text-core-text leading-relaxed break-safe">
              {step.description}
            </p>
          </div>
        </div>
      ))}
      {steps.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-core-accent hover:underline"
        >
          {expanded ? "Show less ↑" : `Show ${steps.length - 3} more steps ↓`}
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function FutureSelfPanel({ className = "" }: { className?: string }) {
  const [data, setData] = useState<FutureSelfData | null>(null);
  const [showRisks, setShowRisks] = useState(false);
  const [showCatalysts, setShowCatalysts] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  useEffect(() => {
    const cached = loadFutureSelf();
    if (cached) {
      setData(cached);
    } else {
      setData(getFutureSelf());
    }
  }, []);

  const refresh = useCallback(() => {
    setData(getFutureSelf());
  }, []);

  if (!data) {
    return (
      <div className={`${className} rounded-xl border border-core-border bg-core-surface/50 p-4 sm:p-5`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-36 bg-core-border/30 rounded" />
          <div className="h-20 bg-core-border/20 rounded" />
          <div className="h-12 bg-core-border/20 rounded" />
        </div>
      </div>
    );
  }

  const highTrajectory = data.trajectoryStrength >= 65;
  const lowTrajectory = data.trajectoryStrength < 40;

  return (
    <div className={`${className} rounded-xl border border-core-border bg-core-surface p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-core-heading uppercase tracking-wider">
            Future Self
          </h3>
          <p className="text-xs text-core-muted mt-0.5">
            {confidenceLabel(data.confidenceScore)} — {data.confidenceScore}%
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`h-2 w-2 rounded-full ${confidenceBg(data.confidenceScore)}`}
          />
          <button
            onClick={refresh}
            className="text-[10px] text-core-muted hover:text-core-heading transition-colors uppercase tracking-wider"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Gauge + Archetype */}
      <div className="flex items-center gap-4 sm:gap-5">
        <TrajectoryGauge score={data.trajectoryStrength} />
        <div className="flex-1 min-w-0">
          <div className={`text-lg font-bold ${trajectoryColor(data.trajectoryStrength)}`}>
            {data.futureArchetype}
          </div>
          <p className="text-xs text-core-muted mt-1 leading-relaxed line-clamp-3 break-safe">
            {data.futureIdentity}
          </p>
        </div>
      </div>

      {/* Behavior messaging */}
      {highTrajectory && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-500 text-sm">⚡</span>
            <span className="text-sm font-semibold text-emerald-600">
              Accelerating
            </span>
          </div>
          <p className="text-xs text-core-muted leading-relaxed">
            Your trajectory is strong. Maintain your cadence and challenge yourself with deeper milestones — your growth is compounding.
          </p>
        </div>
      )}

      {lowTrajectory && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-600 text-sm">🔧</span>
            <span className="text-sm font-semibold text-amber-600">
              Needs Attention
            </span>
          </div>
          <p className="text-xs text-core-muted leading-relaxed">
            Your trajectory is still forming. Try completing 2–3 quizzes or exploring a new career category this week to build momentum.
          </p>
        </div>
      )}

      {/* Career Evolution Timeline */}
      {data.likelyCareerEvolution.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-core-muted uppercase tracking-wider mb-3">
            Career Evolution Path
          </h4>
          <EvolutionTimeline steps={data.likelyCareerEvolution} />
        </div>
      )}

      {/* Risk Factors */}
      {data.riskFactors.length > 0 && (
        <div>
          <button
            onClick={() => setShowRisks(!showRisks)}
            className="flex items-center gap-2 text-xs font-semibold text-core-muted uppercase tracking-wider mb-3 hover:text-core-heading transition-colors"
          >
            <span>Risks ({data.riskFactors.length})</span>
            <span className="text-[10px]">{showRisks ? "▾" : "▸"}</span>
          </button>
          {showRisks && (
            <div className="space-y-2">
              {data.riskFactors.map((risk, i) => (
                <RiskCard key={i} risk={risk} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Growth Catalysts */}
      {data.growthCatalysts.length > 0 && (
        <div>
          <button
            onClick={() => setShowCatalysts(!showCatalysts)}
            className="flex items-center gap-2 text-xs font-semibold text-core-muted uppercase tracking-wider mb-3 hover:text-core-heading transition-colors"
          >
            <span>Growth Catalysts ({data.growthCatalysts.length})</span>
            <span className="text-[10px]">{showCatalysts ? "▾" : "▸"}</span>
          </button>
          {showCatalysts && (
            <div className="space-y-2">
              {data.growthCatalysts.map((c, i) => (
                <CatalystCard key={i} catalyst={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Narrative — collapsed by default with Show More */}
      <div className="bg-core-bg/50 rounded-lg p-4 border border-core-border">
        <button
          type="button"
          onClick={() => setShowNarrative(!showNarrative)}
          className="flex w-full items-center justify-between text-xs font-semibold text-core-muted uppercase tracking-wider mb-1 hover:text-core-heading transition-colors"
        >
          <span>Narrative</span>
          <span className="text-[10px]">{showNarrative ? "▾ Hide" : "▸ Show"}</span>
        </button>
        <div className={showNarrative ? "" : "max-h-[80px] overflow-hidden relative"}>
          <p className="text-xs text-core-text leading-relaxed italic break-safe">
            {data.futureNarrative}
          </p>
          {!showNarrative && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
}
