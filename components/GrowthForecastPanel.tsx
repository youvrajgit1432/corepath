"use client";

import { useEffect, useState } from "react";
import {
  computeGrowthForecast,
  getForecastStateMeta,
} from "@/data/growth-forecast";
import type {
  GrowthForecastData,
  ForecastState,
} from "@/data/growth-forecast";

// ============================================================================
// STATE CONFIG
// ============================================================================

const STATE_CONFIG: Record<
  ForecastState,
  { bg: string; border: string; text: string; accent: string }
> = {
  accelerating: {
    bg: "bg-emerald-100/50 dark:bg-emerald-900/30",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    accent: "bg-emerald-100/80 dark:bg-emerald-500/20",
  },
  compounding: {
    bg: "bg-blue-100/50 dark:bg-blue-900/30",
    border: "border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    accent: "bg-blue-100/80 dark:bg-blue-500/20",
  },
  stalled: {
    bg: "bg-rose-100/50 dark:bg-rose-900/30",
    border: "border-rose-500/30",
    text: "text-rose-700 dark:text-rose-300",
    accent: "bg-rose-100/80 dark:bg-rose-500/20",
  },
  unstable: {
    bg: "bg-amber-100/50 dark:bg-amber-900/30",
    border: "border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
    accent: "bg-amber-100/80 dark:bg-amber-500/20",
  },
  recovering: {
    bg: "bg-violet-100/50 dark:bg-violet-900/30",
    border: "border-violet-500/30",
    text: "text-violet-700 dark:text-violet-300",
    accent: "bg-violet-100/80 dark:bg-violet-500/20",
  },
};

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

function TrajectoryMeter({ value }: { value: number }) {
  const color =
    value >= 65
      ? "bg-emerald-500"
      : value >= 40
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-core-muted">Trajectory Strength</span>
        <span className="font-medium text-core-text">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-core-border/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color =
    value >= 70
      ? "bg-indigo-500"
      : value >= 45
        ? "bg-blue-500"
        : "bg-core-border";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-core-muted">Forecast Confidence</span>
        <span className="font-medium text-core-text">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-core-border/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function TimeCard({
  prediction,
}: {
  prediction: GrowthForecastData["days30Prediction"];
}) {
  const growthColor =
    prediction.growthProjection >= 15
      ? "text-emerald-600 dark:text-emerald-400"
      : prediction.growthProjection >= 0
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  return (
    <div className="rounded-lg border border-core-border bg-core-surface p-4 transition-colors hover:border-core-border/80">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-core-border/50 px-2 py-0.5 text-[11px] font-medium text-core-text">
          {prediction.horizon} Days
        </span>
        <span className={`text-xs font-medium ${growthColor}`}>
          {prediction.growthProjection >= 0 ? "+" : ""}
          {prediction.growthProjection}
        </span>
      </div>

      <p className="mb-2 text-xs font-medium text-core-heading">
        {prediction.projectedMetric}
      </p>

      <p className="mb-3 text-xs leading-relaxed text-core-muted">
        {prediction.narrative}
      </p>

      <div className="rounded-md bg-core-surface/80 px-3 py-2 border border-core-border/30">
        <p className="text-[11px] font-medium text-core-muted/70">Challenge</p>
        <p className="text-xs text-core-text">{prediction.keyChallenge}</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Props {
  className?: string;
}

export default function GrowthForecastPanel({ className = "" }: Props) {
  const [data, setData] = useState<GrowthForecastData | null>(null);

  useEffect(() => {
    setData(computeGrowthForecast());
  }, []);

  if (!data) {
    return (
      <div
        className={`rounded-xl border border-core-border bg-core-surface p-5 ${className}`}
      >
        <p className="text-sm text-core-muted">Loading growth forecast…</p>
      </div>
    );
  }

  const meta = getForecastStateMeta(data.forecastState);
  const config = STATE_CONFIG[data.forecastState];

  return (
    <div
      className={`rounded-xl border border-core-border bg-core-surface p-5 ${className}`}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-core-heading">
            Growth Forecast
          </h3>
          <p className="text-xs text-core-muted">
            Where you&apos;ll likely be in 30–90 days
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.border} ${config.bg} ${config.text}`}
        >
          <span className="text-sm">{meta.icon}</span>
          {meta.label}
        </span>
      </div>

      {/* ── State Description ────────────────────────────────────────── */}
      <p className="mb-4 text-xs leading-relaxed text-core-muted">
        {meta.description}
      </p>

      {/* ── Trajectory Meter ─────────────────────────────────────────── */}
      <div className="mb-4">
        <TrajectoryMeter value={data.trajectoryStrength} />
      </div>

      {/* ── Time Cards ───────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TimeCard prediction={data.days30Prediction} />
        <TimeCard prediction={data.days60Prediction} />
        <TimeCard prediction={data.days90Prediction} />
      </div>

      {/* ── Risks & Opportunities ────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Risks */}
        {data.forecastRisks.length > 0 && (
          <div className="rounded-lg border border-rose-200/60 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/10 p-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-rose-600/70 dark:text-rose-400/70">
              Risks
            </p>
            <ul className="space-y-1">
              {data.forecastRisks.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-core-muted"
                >
                  <span className="mt-0.5 text-rose-500/60">◈</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities */}
        {data.forecastOpportunities.length > 0 && (
          <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10 p-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">
              Opportunities
            </p>
            <ul className="space-y-1">
              {data.forecastOpportunities.map((o, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-core-muted"
                >
                  <span className="mt-0.5 text-emerald-500/60">✦</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Confidence ───────────────────────────────────────────────── */}
      <div className="mb-4">
        <ConfidenceMeter value={data.confidenceScore} />
      </div>

      {/* ── Levers ───────────────────────────────────────────────────── */}
      {data.recommendedLevers.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-core-muted">
            Levers to Change the Outcome
          </p>
          <div className="space-y-1.5">
            {data.recommendedLevers.map((lever, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md bg-core-surface/80 px-3 py-2 border border-core-border/30"
              >
                <span className="mt-0.5 text-xs text-core-muted/70">
                  {i + 1}.
                </span>
                <span className="text-xs leading-relaxed text-core-text">
                  {lever}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
