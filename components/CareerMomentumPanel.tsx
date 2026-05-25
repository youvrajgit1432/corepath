"use client";

import { useEffect, useState } from "react";
import {
  getCareerMomentum,
  loadCareerMomentum,
  type CareerMomentumData,
} from "@/data/career-momentum";

// ============================================================================
// COLOR TOKENS
// ============================================================================

const GAUGE_COLORS = {
  accelerated: { stroke: "#10b981", ring: "#d1fae5" },
  steady: { stroke: "#f59e0b", ring: "#fef3c7" },
  slowing: { stroke: "#f97316", ring: "#ffedd5" },
  stalled: { stroke: "#6b7280", ring: "#f3f4f6" },
} as const;

// ============================================================================
// PANEL
// ============================================================================

type Props = {
  className?: string;
};

export default function CareerMomentumPanel({ className = "" }: Props) {
  const [data, setData] = useState<CareerMomentumData | null>(null);

  useEffect(() => {
    const cached = loadCareerMomentum();
    if (cached) setData(cached);
    setData(getCareerMomentum());
  }, []);

  const handleRefresh = () => {
    setData(getCareerMomentum());
  };

  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  const {
    momentumScore,
    momentumTrend,
    accelerationSignals,
    slowdownSignals,
    momentumDrivers,
    recoveryActions,
    momentumNarrative,
  } = data;

  // ── Gauge color ───────────────────────────────────────────────────────
  const gaugeColor =
    momentumTrend === "accelerating"
      ? GAUGE_COLORS.accelerated
      : momentumTrend === "steady"
        ? GAUGE_COLORS.steady
        : momentumTrend === "slowing"
          ? GAUGE_COLORS.slowing
          : GAUGE_COLORS.stalled;

  // ── SVG gauge ─────────────────────────────────────────────────────────
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (momentumScore / 100) * circumference;

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md ${className}`}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Career Momentum
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Accelerating or slowing down?
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Refresh"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Gauge + Trend */}
      <div className="mb-5 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" className="-rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={gaugeColor.ring}
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={gaugeColor.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight" style={{ color: gaugeColor.stroke }}>
              {momentumScore}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              /100
            </span>
          </div>
        </div>
        <div className="flex-1">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{
              backgroundColor: gaugeColor.ring,
              color: gaugeColor.stroke,
            }}
          >
            {momentumTrend}
          </span>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            {momentumNarrative}
          </p>
        </div>
      </div>

      {/* Acceleration Signals */}
      {accelerationSignals.length > 0 && (
        <details className="group mb-3">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-emerald-700">
            <svg
              className="h-4 w-4 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {accelerationSignals.length} Acceleration Signal{accelerationSignals.length > 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2">
            {accelerationSignals.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2"
              >
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-800">{s.label}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{s.source.replace("-", " ")}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{s.value}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Slowdown Signals */}
      {slowdownSignals.length > 0 && (
        <details className="group mb-3">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-amber-700">
            <svg
              className="h-4 w-4 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {slowdownSignals.length} Slowdown Signal{slowdownSignals.length > 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2">
            {slowdownSignals.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2"
              >
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-800">{s.label}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{s.source.replace("-", " ")}</p>
                </div>
                <span className="text-xs font-semibold text-amber-600">{s.value}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Momentum Drivers */}
      {momentumDrivers.length > 0 && (
        <details className="group mb-3">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600">
            <svg
              className="h-4 w-4 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Momentum Drivers
          </summary>
          <div className="mt-2 space-y-1.5">
            {momentumDrivers.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-1">
                <span className="w-20 flex-shrink-0 text-xs text-gray-500">{d.label}</span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${d.value}%`,
                        background:
                          d.value >= 65
                            ? "linear-gradient(90deg, #10b981, #34d399)"
                            : d.value >= 40
                              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                              : "linear-gradient(90deg, #6b7280, #9ca3af)",
                      }}
                    />
                  </div>
                </div>
                <span className="w-8 text-right text-xs font-medium text-gray-600">{d.value}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Recovery Actions */}
      {recoveryActions.length > 0 && (
        <details className="group" defaultChecked={momentumScore < 45}>
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600">
            <svg
              className="h-4 w-4 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {momentumScore >= 65 ? "Challenge Recommendations" : "Recovery Actions"}
          </summary>
          <div className="mt-2 space-y-2">
            {recoveryActions.map((ra, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 px-3 py-2.5 transition-colors hover:border-gray-300"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      ra.difficulty === "easier"
                        ? "bg-emerald-100 text-emerald-700"
                        : ra.difficulty === "moderate"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {ra.difficulty}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800">{ra.action}</p>
                    <p className="mt-0.5 text-[10px] italic text-gray-400">{ra.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
