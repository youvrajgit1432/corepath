"use client";

import { useState, useEffect, useCallback } from "react";
import {
  computeEngagementPulse,
  loadEngagementPulse,
  type EngagementPulseData,
  type PulseDimension,
  type FatigueSignal,
} from "../data/engagement-pulse";

// ── Helpers ──

function statusColor(status: PulseDimension["status"]): string {
  switch (status) {
    case "positive": return "text-emerald-400";
    case "neutral": return "text-core-muted";
    case "caution": return "text-amber-400";
    case "critical": return "text-red-400";
  }
}

function severityColor(severity: FatigueSignal["severity"]): string {
  switch (severity) {
    case "high": return "text-red-400 border-red-500/30 bg-red-500/10";
    case "medium": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "low": return "text-core-muted border-core-border/50 bg-core-bg/40";
  }
}

function forecastIcon(forecast: string): string {
  switch (forecast) {
    case "sustained": return "→";
    case "declining": return "↓";
    case "recovering": return "↑";
    default: return "→";
  }
}

function difficultyLabel(d: string): string {
  switch (d) {
    case "easier": return "Easier tasks recommended";
    case "maintain": return "Maintain current difficulty";
    case "challenge": return "Challenge tasks recommended";
    default: return d;
  }
}

// ── Mini Gauge ──

function MiniGauge({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70 ? "#34d399" : score >= 50 ? "#a3a3a3" : score >= 30 ? "#fbbf24" : "#f87171";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        className="text-white/10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
    </svg>
  );
}

// ── Component ──

interface Props {
  className?: string;
}

export default function EngagementPulsePanel({ className = "" }: Props) {
  const [pulse, setPulse] = useState<EngagementPulseData | null>(null);

  const refresh = useCallback(() => {
    const fresh = computeEngagementPulse();
    setPulse(fresh);
  }, []);

  useEffect(() => {
    const cached = loadEngagementPulse();
    if (cached) {
      setPulse(cached);
    } else {
      refresh();
    }
  }, [refresh]);

  if (!pulse) return null;

  const gaugeColor =
    pulse.pulseScore >= 70
      ? "text-emerald-400"
      : pulse.pulseScore >= 50
        ? "text-core-muted"
        : pulse.pulseScore >= 30
          ? "text-amber-400"
          : "text-red-400";

  const gaugeFill =
    pulse.pulseScore >= 70
      ? "#34d399"
      : pulse.pulseScore >= 50
        ? "#a3a3a3"
        : pulse.pulseScore >= 30
          ? "#fbbf24"
          : "#f87171";

  // Main gauge
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pulse.pulseScore / 100) * circumference;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Engagement Pulse</p>
          <h2 className="mt-1 text-lg font-semibold text-core-heading">Energy & Fatigue Check</h2>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Refresh
        </button>
      </div>

      {/* ─── Pulse Score Gauge ─── */}
      <div className="flex flex-col items-center py-4">
        <div className="relative">
          <svg width={140} height={140} className="transform -rotate-90">
            <circle
              cx={70}
              cy={70}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={8}
              className="text-white/10"
            />
            <circle
              cx={70}
              cy={70}
              r={radius}
              fill="none"
              stroke={gaugeFill}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${gaugeColor}`}>{pulse.pulseScore}</span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-core-muted mt-0.5">
              / 100
            </span>
          </div>
        </div>

        {/* Energy forecast */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-lg">{forecastIcon(pulse.energyForecast)}</span>
          <span className="font-medium text-core-heading capitalize">{pulse.energyForecast}</span>
          <span className="text-core-muted">energy</span>
        </div>
      </div>

      {/* ─── Fatigue Signals ─── */}
      {pulse.fatigueSignals.length > 0 && (
        <div className="mb-5 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Fatigue Signals ({pulse.fatigueSignals.length})
          </p>
          {pulse.fatigueSignals.map((signal, idx) => (
            <div
              key={idx}
              className={`rounded-xl border px-3.5 py-2.5 text-xs ${severityColor(signal.severity)}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold capitalize">{signal.type.replace("_", " ")}</span>
                <span className="text-[10px] uppercase opacity-70">{signal.severity}</span>
              </div>
              <p className="leading-relaxed">{signal.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Dimensions ─── */}
      <div className="mb-5 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Dimensions
        </p>
        {pulse.dimensions.map((dim) => (
          <div key={dim.name} className="flex items-center gap-3 rounded-xl border border-core-border bg-core-bg/50 p-3">
            <MiniGauge score={dim.score} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-core-heading truncate">{dim.label}</p>
                <span className={`text-xs font-semibold ${statusColor(dim.status)}`}>
                  {dim.score}
                </span>
              </div>
              {dim.signals.length > 0 && (
                <p className="text-[11px] text-core-muted leading-tight mt-0.5 truncate">
                  {dim.signals[0]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Load Assessment Row ─── */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-core-muted">Notif. Load</p>
          <p className={`mt-1 text-lg font-bold capitalize ${
            pulse.notificationLoad === "high" ? "text-red-400" : pulse.notificationLoad === "medium" ? "text-amber-400" : "text-emerald-400"
          }`}>
            {pulse.notificationLoad}
          </p>
        </div>
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-core-muted">Mission Load</p>
          <p className={`mt-1 text-lg font-bold capitalize ${
            pulse.missionLoad === "high" ? "text-red-400" : pulse.missionLoad === "medium" ? "text-amber-400" : "text-emerald-400"
          }`}>
            {pulse.missionLoad}
          </p>
        </div>
        <div className="rounded-xl border border-core-border bg-core-bg/40 p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-core-muted">Difficulty</p>
          <p className="mt-1 text-lg font-bold capitalize text-core-heading">
            {pulse.recommendedDifficulty}
          </p>
        </div>
      </div>

      {/* ─── Difficulty Recommendation ─── */}
      <div className="mb-5 rounded-xl border border-core-accent/20 bg-core-accent/5 p-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-core-accent font-semibold">
          Recommendation
        </p>
        <p className="mt-1 text-sm font-medium text-core-heading">
          {difficultyLabel(pulse.recommendedDifficulty)}
        </p>
      </div>

      {/* ─── Rest Recommendations ─── */}
      <div className="mb-5">
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Rest Recommendations
        </p>
        <ul className="space-y-1.5">
          {pulse.restRecommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-core-text">
              <span className="mt-0.5 text-core-muted">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ─── Boosters ─── */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Momentum Boosters
        </p>
        <ul className="space-y-1.5">
          {pulse.boosters.map((booster, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-core-text">
              <span className="mt-0.5 text-emerald-400">⚡</span>
              <span>{booster}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
