"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAdminIntelligence,
  computeAdminIntelligence,
  clearAdminIntelligence,
  type AdminIntelligenceData,
  type DropoffFunnelStage,
  type PanelUsageSummary,
  type ExperimentWinner,
  type RetentionHealthIndicators,
  type RecommendationHealth,
  type SystemAlert,
  type BusinessNarrativeLine,
} from "../data/admin-intelligence";

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OverviewMetricCard({
  label,
  value,
  subtitle,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-core-border bg-core-surface p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color ?? "text-core-heading"}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-core-muted">{subtitle}</p>}
      {trend && (
        <span
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
            trend === "up"
              ? "bg-emerald-500/15 text-emerald-400"
              : trend === "down"
                ? "bg-amber-500/15 text-amber-400"
                : "bg-white/10 text-core-muted"
          }`}
        >
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          {trend === "up" ? " Growing" : trend === "down" ? " Declining" : " Stable"}
        </span>
      )}
    </div>
  );
}

function EngagementGauge({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 70 ? "#34d399" : value >= 40 ? "#f59e0b" : "#f87171";

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-white/10"
          strokeWidth="10"
        />
        {/* Value arc */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute mt-[30px] flex flex-col items-center">
        <span className="text-3xl font-bold text-core-heading">{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-core-muted">/ 100</span>
      </div>
    </div>
  );
}

function DropoffFunnel({ stages }: { stages: DropoffFunnelStage[] }) {
  const maxUsers = Math.max(...stages.map((s) => s.users), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const barWidth = (stage.users / maxUsers) * 100;
        const isHighDropoff = stage.dropoffRate > 60;
        return (
          <div key={stage.stage}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate text-core-text">{stage.stage}</span>
              <span className="shrink-0 font-mono text-core-muted">{stage.users} users</span>
            </div>
            <div className="relative h-5 overflow-hidden rounded-full bg-white/10">
              {/* Total bar */}
              <div
                className="h-full rounded-full bg-core-accent/30 transition-all"
                style={{ width: `${barWidth}%` }}
              />
              {/* Dropoff indicator */}
              {isHighDropoff && (
                <div
                  className="absolute inset-y-0 right-0 rounded-r-full bg-amber-500/40"
                  style={{ width: `${Math.min(100, stage.dropoffRate)}%` }}
                />
              )}
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-[10px] text-core-muted">{stage.description}</span>
              <span
                className={`text-[10px] font-semibold ${
                  isHighDropoff ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {stage.dropoffRate}% dropoff
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PanelUsageChart({ data }: { data: PanelUsageSummary[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2.5">
      {data.slice(0, 8).map((item) => (
        <div key={item.panel}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate text-core-text">{item.panel}</span>
            <span className="shrink-0 font-mono text-core-muted">{item.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-core-accent to-indigo-400 transition-all"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RetentionDashboard({ data }: { data: RetentionHealthIndicators }) {
  const churnColors: Record<string, string> = {
    low: "bg-emerald-500 text-white",
    moderate: "bg-amber-500 text-white",
    elevated: "bg-orange-500 text-white",
    high: "bg-red-500 text-white",
  };

  return (
    <div className="space-y-4">
      {/* Main retention gauge */}
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" className="text-white/10" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={data.overallRetention >= 60 ? "#34d399" : data.overallRetention >= 30 ? "#f59e0b" : "#f87171"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - data.overallRetention / 100)}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute text-sm font-bold text-core-heading">{data.overallRetention}%</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-core-heading">Overall Retention</p>
          <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${churnColors[data.churnRisk] ?? "bg-white/10 text-core-muted"}`}>
            {data.churnRisk === "low" ? "🛡️ Low Risk" : data.churnRisk === "moderate" ? "⚡ Moderate" : data.churnRisk === "elevated" ? "⚠️ Elevated" : "🚨 High Risk"}
          </span>
        </div>
      </div>

      {/* Sub-metrics grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-core-border bg-core-bg/60 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-core-muted">Daily Eng.</p>
          <p className="text-sm font-bold text-core-heading">{data.dailyEngagement}%</p>
        </div>
        <div className="rounded-xl border border-core-border bg-core-bg/60 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-core-muted">Active Days</p>
          <p className="text-sm font-bold text-core-heading">{data.weeklyActiveDays}/7</p>
        </div>
        <div className="rounded-xl border border-core-border bg-core-bg/60 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-core-muted">Streak</p>
          <p className="text-sm font-bold text-core-heading">{data.sessionStreak}d</p>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-1.5">
          {data.insights.map((insight, i) => (
            <p key={i} className="flex items-start gap-1.5 text-xs text-core-muted">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-core-accent/50" />
              {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationHealthCard({ data }: { data: RecommendationHealth }) {
  return (
    <div className="space-y-4">
      {/* Score bars */}
      <div className="space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-core-text">Quality Score</span>
            <span className="font-mono text-core-muted">{data.qualityScore}/100</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${
                data.qualityScore >= 70 ? "bg-emerald-500" : data.qualityScore >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${data.qualityScore}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-core-text">Trust Score</span>
            <span className="font-mono text-core-muted">{data.trustScore}/100</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${
                data.trustScore >= 70 ? "bg-emerald-500" : data.trustScore >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${data.trustScore}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-core-text">Feedback Score</span>
            <span className="font-mono text-core-muted">{data.feedbackScore}/100</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${
                data.feedbackScore >= 70 ? "bg-emerald-500" : data.feedbackScore >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${data.feedbackScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meta stats */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-core-border px-2.5 py-1 text-[0.65rem] text-core-muted">
          {data.explorationBias}
        </span>
        <span className="rounded-full border border-core-border px-2.5 py-1 text-[0.65rem] text-core-muted">
          {data.specializationDomains} domains
        </span>
        <span className="rounded-full border border-core-border px-2.5 py-1 text-[0.65rem] text-core-muted">
          {data.adjustedCareers} adjusted
        </span>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-1.5">
          {data.insights.map((insight, i) => (
            <p key={i} className="flex items-start gap-1.5 text-xs text-core-muted">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-core-accent/50" />
              {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperimentWinnersList({ winners }: { winners: ExperimentWinner[] }) {
  if (winners.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="text-2xl">🔬</span>
        <p className="mt-2 text-sm text-core-muted">No experiment winners yet</p>
        <p className="mt-1 text-xs text-core-muted">Experiments are still gathering data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {winners.map((winner) => (
        <div
          key={winner.experimentId}
          className="rounded-2xl border border-core-border bg-core-bg/60 p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-core-heading">{winner.experimentName}</p>
              <p className="text-xs text-core-muted mt-0.5">
                Metric: {winner.metric}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
                winner.improvementPct > 0
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white/10 text-core-muted"
              }`}
            >
              {winner.improvementPct > 0 ? `+${winner.improvementPct}%` : "0%"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="rounded-md bg-core-accent/15 px-2 py-0.5 text-xs font-medium text-core-accent">
              {winner.winningLabel}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-core-muted">
              <span className="h-2 w-16 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full bg-emerald-500"
                  style={{ width: `${winner.confidenceLevel}%` }}
                />
              </span>
              <span>{winner.confidenceLevel}% confident</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertCard({ alert }: { alert: SystemAlert }) {
  const severityColors: Record<string, string> = {
    critical: "border-red-500/40 bg-red-500/10",
    warning: "border-amber-500/40 bg-amber-500/10",
    info: "border-core-accent/20 bg-core-accent/5",
  };

  const severityIcons: Record<string, string> = {
    critical: "🔴",
    warning: "⚠️",
    info: "ℹ️",
  };

  const labelColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400",
    warning: "bg-amber-500/20 text-amber-400",
    info: "bg-core-accent/15 text-core-accent",
  };

  return (
    <div className={`rounded-2xl border p-4 ${severityColors[alert.severity] ?? severityColors.info}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-base">{severityIcons[alert.severity] ?? "ℹ️"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-core-heading">{alert.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase ${labelColors[alert.severity] ?? labelColors.info}`}>
              {alert.severity}
            </span>
          </div>
          <p className="mt-1 text-xs text-core-muted">{alert.description}</p>
          {alert.actionLabel && (
            <a
              href={alert.actionHref ?? "#"}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-core-accent hover:text-core-accent/80 transition-colors"
            >
              {alert.actionLabel} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function NarrativeSummary({ lines }: { lines: BusinessNarrativeLine[] }) {
  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">{line.icon}</span>
          <p className="text-sm text-core-text leading-relaxed">{line.text}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminDashboardPanel() {
  const [data, setData] = useState<AdminIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const fresh = computeAdminIntelligence();
      setData(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to compute admin intelligence");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const existing = getAdminIntelligence();
    if (existing) {
      setData(existing);
      setLoading(false);
    } else {
      refresh();
    }
  }, [refresh]);

  const handleClear = () => {
    clearAdminIntelligence();
    refresh();
  };

  // ── Loading State ──
  if (loading && !data) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 animate-pulse">
            <div className="h-4 w-36 rounded-full bg-white/10" />
            <div className="mt-3 h-8 w-72 rounded-full bg-white/10" />
            <div className="mt-2 h-4 w-56 rounded-full bg-white/10" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error && !data) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 p-12 text-center">
            <span className="text-4xl">⚠️</span>
            <h2 className="mt-4 text-xl font-semibold text-core-heading">Failed to load dashboard</h2>
            <p className="mt-2 text-sm text-core-muted">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-6 rounded-full bg-core-accent px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-core-border p-12 text-center">
            <span className="text-4xl">📊</span>
            <h2 className="mt-4 text-xl font-semibold text-core-heading">No data yet</h2>
            <p className="mt-2 text-sm text-core-muted">
              Start exploring careers and using CorePath features to populate the dashboard.
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-6 rounded-full bg-core-accent px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-12 pt-28">
      <div className="mx-auto max-w-7xl">
        {/* ───── HEADER ───── */}
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-core-accent">Admin</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-core-heading md:text-5xl">
              Intelligence Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-core-muted">
              Complete platform behavior visibility. Data sourced from user analytics, feedback, recommendations, experiments, and journey memory.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-core-border px-4 py-2 text-sm text-core-muted">
              Updated {new Date(data.lastComputed).toLocaleTimeString()}
            </span>
            <button
              type="button"
              onClick={refresh}
              className="rounded-full bg-core-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-red-500/40 px-5 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              Clear cache
            </button>
          </div>
        </header>

        {/* ───── OVERVIEW METRICS ───── */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewMetricCard
            label="Total Users (Est.)"
            value={data.totalUsersEstimate}
            subtitle="Current platform users"
            trend="neutral"
          />
          <OverviewMetricCard
            label="Active Users (7d)"
            value={data.activeUsers}
            subtitle="Users active in last 7 days"
            trend={data.activeUsers > 1 ? "up" : "neutral"}
            color="text-emerald-400"
          />
          <OverviewMetricCard
            label="Engagement Score"
            value={data.retentionHealth.dailyEngagement}
            subtitle="Daily engagement rate"
            trend={data.retentionHealth.dailyEngagement >= 50 ? "up" : "down"}
            color={
              data.retentionHealth.dailyEngagement >= 70
                ? "text-emerald-400"
                : data.retentionHealth.dailyEngagement >= 40
                  ? "text-amber-400"
                  : "text-red-400"
            }
          />
          <OverviewMetricCard
            label="Churn Risk"
            value={
              data.retentionHealth.churnRisk === "low"
                ? "🛡️ Low"
                : data.retentionHealth.churnRisk === "moderate"
                  ? "⚡ Moderate"
                  : data.retentionHealth.churnRisk === "elevated"
                    ? "⚠️ Elevated"
                    : "🚨 High"
            }
            subtitle={`Retention: ${data.retentionHealth.overallRetention}%`}
            trend={
              data.retentionHealth.churnRisk === "low"
                ? "up"
                : data.retentionHealth.churnRisk === "high"
                  ? "down"
                  : "neutral"
            }
          />
        </section>

        {/* ───── MAIN GRID ───── */}
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* Engagement Gauge */}
          <div className="rounded-2xl border border-core-border bg-core-surface p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
              Engagement Score
            </p>
            <div className="relative flex justify-center py-4">
              <EngagementGauge value={data.retentionHealth.dailyEngagement} />
            </div>
            <p className="text-center text-xs text-core-muted mt-2">
              {data.retentionHealth.dailyEngagement >= 70
                ? "Strong engagement — user is actively exploring."
                : data.retentionHealth.dailyEngagement >= 40
                  ? "Moderate engagement — consistent usage detected."
                  : "Low engagement — encourage feature adoption."}
            </p>
          </div>

          {/* Top Careers */}
          <div className="rounded-2xl border border-core-border bg-core-surface p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-4">
              Top Careers by Engagement
            </p>
            {data.topCareers.length > 0 ? (
              <div className="space-y-3">
                {data.topCareers.map((career, i) => {
                  const maxEngagement = Math.max(...data.topCareers.map((c) => c.engagement), 1);
                  return (
                    <div key={career.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 truncate text-core-text">
                          <span className="text-base">{career.icon}</span>
                          <span className="truncate">{career.title}</span>
                        </span>
                        <span className="shrink-0 font-mono text-xs text-core-muted">
                          {career.engagement}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-core-accent to-indigo-400"
                          style={{
                            width: `${(career.engagement / maxEngagement) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-core-muted">No career engagement data yet.</p>
            )}
          </div>

          {/* Dropoff Funnel */}
          <div className="rounded-2xl border border-core-border bg-core-surface p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-4">
              Dropoff Funnels
            </p>
            <DropoffFunnel stages={data.dropoffFunnels} />
          </div>

          {/* Panel Usage */}
          <div className="rounded-2xl border border-core-border bg-core-surface p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-4">
              Feature Usage
            </p>
            {data.panelUsage.length > 0 ? (
              <PanelUsageChart data={data.panelUsage} />
            ) : (
              <p className="text-sm text-core-muted">No panel usage data yet.</p>
            )}
          </div>

          {/* Retention Health */}
          <div className="rounded-2xl border border-core-border bg-core-surface p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-4">
              Retention Health
            </p>
            <RetentionDashboard data={data.retentionHealth} />
          </div>

          {/* Recommendation Health */}
          <div className="rounded-2xl border border-core-border bg-core-surface p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-4">
              Recommendation Health
            </p>
            <RecommendationHealthCard data={data.recommendationHealth} />
          </div>
        </section>

        {/* ───── EXPERIMENT WINNERS ───── */}
        <section className="mt-6 rounded-2xl border border-core-border bg-core-surface p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-4">
            Experiment Winners
          </p>
          <ExperimentWinnersList winners={data.experimentWinners} />
        </section>

        {/* ───── SYSTEM ALERTS ───── */}
        <section className="mt-6 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            System Alerts
          </p>
          {data.systemAlerts.length > 0 ? (
            <div className="grid gap-3">
              {data.systemAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-core-border bg-core-surface p-6 text-center">
              <span className="text-2xl">✅</span>
              <p className="mt-2 text-sm text-core-muted">No alerts at this time.</p>
            </div>
          )}
        </section>

        {/* ───── BUSINESS NARRATIVE ───── */}
        <section className="mt-6 rounded-2xl border border-core-accent/15 bg-core-accent/5 p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-4">
            Business Narrative
          </p>
          <NarrativeSummary lines={data.businessNarrative} />
        </section>

        {/* ───── FOOTER ───── */}
        <footer className="mt-8 border-t border-core-border pt-4">
          <p className="text-xs text-core-muted">
            Data computed from local analytics, feedback, recommendations, experiments, and journey memory.
            Refreshing recomputes all metrics.{" "}
            <button
              type="button"
              onClick={handleClear}
              className="text-red-400 hover:text-red-300 underline underline-offset-2"
            >
              Clear cached data
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}
