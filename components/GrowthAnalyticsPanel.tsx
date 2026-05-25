"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getGrowthAnalytics,
  formatConfidenceTrend,
  formatSpecializationTrend,
  formatXpTrend,
  formatGoalVelocity,
  generateGrowthInsights,
  type GrowthAnalytics,
} from "../data/growth-analytics";

type Props = {
  className?: string;
};

export default function GrowthAnalyticsPanel({ className = "" }: Props) {
  const [analytics, setAnalytics] = useState<GrowthAnalytics | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const load = useCallback(() => {
    setAnalytics(getGrowthAnalytics());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (!analytics || analytics.xpTrend === 0 && analytics.progressHistory.length <= 1) {
    return null;
  }

  const insights = generateGrowthInsights(analytics);
  const recentSnapshots = analytics.progressHistory.slice(0, 14).reverse(); // last 14 days, chronological
  const maxProgress = Math.max(
    100,
    ...recentSnapshots.map((s) => s.overallProgress)
  );

  // Bar chart dimensions
  const barHeight = 80;
  const barWidth = recentSnapshots.length > 1
    ? Math.max(8, Math.min(28, Math.floor(280 / recentSnapshots.length)))
    : 24;
  const gap = Math.max(2, Math.min(6, Math.floor(20 / Math.max(1, recentSnapshots.length - 1))));
  const chartWidth = Math.max(80, recentSnapshots.length * (barWidth + gap));

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Growth analytics</p>
          <h2 className="mt-1 text-xl font-semibold text-core-heading">How you&apos;re evolving</h2>
        </div>
        {analytics.progressHistory.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-xs font-medium text-core-accent transition hover:text-indigo-400"
          >
            {showAllHistory ? "Show less" : "Show all"}
          </button>
        )}
      </div>

      {/* ───── 2×2 METRIC GRID ───── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* ── PROGRESS CHART ── */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Progress over time
          </p>
          {recentSnapshots.length >= 2 ? (
            <div className="mt-3 overflow-x-auto">
              <svg
                width={chartWidth}
                height={barHeight + 24}
                viewBox={`0 0 ${chartWidth} ${barHeight + 24}`}
                className="min-w-[80px]"
              >
                {/* Y-axis reference lines */}
                <line
                  x1="0"
                  y1={barHeight}
                  x2={chartWidth}
                  y2={barHeight}
                  stroke="currentColor"
                  className="text-white/10"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1={barHeight * 0.5}
                  x2={chartWidth}
                  y2={barHeight * 0.5}
                  stroke="currentColor"
                  className="text-white/5"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />

                {/* Bars */}
                {recentSnapshots.map((snap, i) => {
                  const x = i * (barWidth + gap);
                  const pct = snap.overallProgress / maxProgress;
                  const h = Math.max(2, pct * barHeight);
                  const y = barHeight - h;
                  const color =
                    snap.overallProgress >= 60
                      ? "#34d399"
                      : snap.overallProgress >= 30
                        ? "#f59e0b"
                        : "#818cf8";
                  return (
                    <g key={snap.date}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={h}
                        rx="3"
                        fill={color}
                        opacity="0.8"
                      >
                        <title>
                          {new Date(snap.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                          : {snap.overallProgress}%
                        </title>
                      </rect>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <p className="mt-3 text-xs text-core-muted">
              More data needed to show progress trend.
            </p>
          )}
        </div>

        {/* ── CONFIDENCE TREND ── */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Confidence trend
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            {/* Direction arrow */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                analytics.confidenceTrend > 2
                  ? "bg-emerald-500/15 text-emerald-400"
                  : analytics.confidenceTrend < -2
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-white/5 text-core-muted"
              }`}
            >
              {analytics.confidenceTrend > 2
                ? "↑"
                : analytics.confidenceTrend < -2
                  ? "↓"
                  : "→"}
            </div>
            <div>
              <p className="text-sm font-semibold text-core-heading">
                {formatConfidenceTrend(analytics.confidenceTrend)}
              </p>
              <p className="text-[11px] text-core-muted">
                {analytics.specializationTrend === "deepening"
                  ? "Growing more decisive"
                  : analytics.specializationTrend === "broadening"
                    ? "Exploring wider range"
                    : "Holding steady"}
              </p>
            </div>
          </div>
        </div>

        {/* ── XP TREND ── */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            XP growth
          </p>
          <p className="mt-1.5 text-2xl font-bold text-core-heading">
            {formatXpTrend(analytics.xpTrend)}
          </p>
          {/* Mini XP bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-core-accent to-indigo-400 transition-all duration-500"
              style={{
                width: `${Math.min(100, (analytics.xpTrend / 500) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* ── SPECIALIZATION TREND ── */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Specialization
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                analytics.specializationTrend === "deepening"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : analytics.specializationTrend === "broadening"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-white/10 text-core-muted"
              }`}
            >
              {analytics.specializationTrend === "deepening"
                ? "🎯"
                : analytics.specializationTrend === "broadening"
                  ? "🧭"
                  : "⚖️"}
              <span>{formatSpecializationTrend(analytics.specializationTrend)}</span>
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-core-muted">
            {analytics.specializationTrend === "deepening"
              ? "Your interests are converging — a strong career direction signal."
              : analytics.specializationTrend === "broadening"
                ? "You're sampling broadly — great for discovering unexpected fits."
                : "Your exploration range is consistent and measured."}
          </p>
        </div>

        {/* ── GOAL VELOCITY ── */}
        {analytics.goalVelocity !== null && (
          <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Goal velocity
            </p>
            <p className="mt-1.5 text-2xl font-bold text-core-heading">
              {formatGoalVelocity(analytics.goalVelocity)}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  analytics.goalVelocity > 0
                    ? "bg-emerald-500"
                    : "bg-amber-500/60"
                }`}
                style={{
                  width: `${Math.min(100, (analytics.goalVelocity / 20) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── CAREER SHIFT SIGNALS ── */}
        {analytics.careerShiftSignals.length > 0 && (
          <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Career evolution
            </p>
            <ul className="mt-2 space-y-1.5">
              {analytics.careerShiftSignals.map((signal, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-core-text"
                >
                  <span className="mt-0.5 text-core-accent/70">~</span>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ───── INSIGHTS SUMMARY ───── */}
      {insights.length > 0 && (
        <div className="mt-4 rounded-2xl border border-core-accent/15 bg-core-accent/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
            Insights
          </p>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-core-text leading-relaxed"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-core-accent/50" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
