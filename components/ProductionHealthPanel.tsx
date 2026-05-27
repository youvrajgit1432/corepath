"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getProductionHealth,
  computeProductionHealth,
  clearProductionHealth,
  logErrorEvent,
  type ProductionHealthData,
  type HealthAlert,
  type SlowComponent,
  type PerformanceInsight,
  type StabilityTrend,
  type RecommendedFix,
  type FailurePattern,
  type RiskLevel,
} from "../data/production-health";

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function HealthGauge({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 70 ? "#34d399" : value >= 50 ? "#f59e0b" : value >= 30 ? "#f97316" : "#f87171";

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle
          cx="70" cy="70" r={radius}
          fill="none" stroke="currentColor"
          className="text-white/10"
          strokeWidth="10"
        />
        <circle
          cx="70" cy="70" r={radius}
          fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
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

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const colors: Record<string, string> = {
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    moderate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    elevated: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    high: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const icons: Record<string, string> = {
    low: "🛡️",
    moderate: "⚡",
    elevated: "⚠️",
    high: "🚨",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${colors[risk] ?? "bg-white/10 text-core-muted"}`}>
      {icons[risk] ?? "❓"} {risk.charAt(0).toUpperCase() + risk.slice(1)}
    </span>
  );
}

function SlowComponentCard({ component }: { component: SlowComponent }) {
  const severityColors: Record<string, string> = {
    low: "bg-emerald-500/15 text-emerald-400",
    medium: "bg-amber-500/15 text-amber-400",
    high: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-core-border bg-core-bg/60 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-core-heading truncate">{component.component}</p>
        <p className="text-xs text-core-muted mt-0.5">
          {component.renderCount} renders
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="text-right">
          <p className="text-sm font-mono text-core-heading">{component.avgRenderMs}ms</p>
          <p className="text-[10px] text-core-muted">avg</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase ${severityColors[component.severity]}`}>
          {component.severity}
        </span>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: HealthAlert }) {
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
            <p className="mt-2 text-xs font-medium text-core-accent">
              {alert.actionLabel} →
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StabilityChart({ trend }: { trend: StabilityTrend[] }) {
  const maxScore = 100;

  return (
    <div className="space-y-2">
      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-24">
        {trend.map((day) => (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center justify-end h-full"
          >
            <div
              className={`w-full rounded-t ${
                day.healthScore >= 70
                  ? "bg-emerald-500/60"
                  : day.healthScore >= 50
                    ? "bg-amber-500/60"
                    : day.healthScore >= 30
                      ? "bg-orange-500/60"
                      : "bg-red-500/60"
              } transition-all`}
              style={{
                height: `${(day.healthScore / maxScore) * 100}%`,
                minHeight: "4px",
              }}
            />
          </div>
        ))}
      </div>
      {/* Labels */}
      <div className="flex gap-1.5">
        {trend.map((day) => {
          const date = new Date(day.date);
          const label = date.toLocaleDateString(undefined, { weekday: "short" });
          return (
            <div key={day.date} className="flex-1 text-center">
              <p className="text-[0.55rem] text-core-muted">{label}</p>
              <p className="text-[0.55rem] font-mono text-core-muted mt-0.5">
                {day.issues > 0 ? `${day.issues}e` : "—"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FixCard({ fix }: { fix: RecommendedFix }) {
  const priorityColors: Record<string, string> = {
    critical: "border-red-500/30 bg-red-500/5",
    high: "border-amber-500/30 bg-amber-500/5",
    medium: "border-core-accent/20 bg-core-accent/5",
    low: "border-core-border bg-core-surface",
  };
  const priorityLabels: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400",
    high: "bg-amber-500/20 text-amber-400",
    medium: "bg-core-accent/15 text-core-accent",
    low: "bg-white/10 text-core-muted",
  };
  const effortIcons: Record<string, string> = {
    quick: "⚡",
    moderate: "🛠️",
    significant: "🏗️",
  };

  return (
    <div className={`rounded-2xl border p-4 ${priorityColors[fix.priority] ?? priorityColors.low}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-core-heading">{fix.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase ${priorityLabels[fix.priority] ?? priorityLabels.low}`}>
              {fix.priority}
            </span>
          </div>
          <p className="mt-1 text-xs text-core-muted">{fix.description}</p>
        </div>
        <span className="shrink-0 text-xs text-core-muted flex items-center gap-1">
          {effortIcons[fix.effort] ?? "•"} {fix.effort}
        </span>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: PerformanceInsight }) {
  const typeIcons: Record<string, string> = {
    positive: "✅",
    warning: "⚠️",
    suggestion: "💡",
  };

  const typeColors: Record<string, string> = {
    positive: "border-emerald-500/20 bg-emerald-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
    suggestion: "border-core-accent/15 bg-core-accent/5",
  };

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${typeColors[insight.type] ?? "border-core-border bg-core-bg/60"}`}>
      <span className="text-base shrink-0 mt-0.5">{typeIcons[insight.type] ?? "💡"}</span>
      <p className="text-xs text-core-text leading-relaxed">{insight.insight}</p>
    </div>
  );
}

function FailurePatternCard({ pattern }: { pattern: FailurePattern }) {
  const impactColors: Record<string, string> = {
    high: "bg-red-500/15 text-red-400",
    medium: "bg-amber-500/15 text-amber-400",
    low: "bg-white/10 text-core-muted",
  };

  return (
    <div className="rounded-xl border border-core-border bg-core-bg/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-core-heading truncate">{pattern.pattern}</p>
          <p className="text-[10px] text-core-muted mt-0.5">
            {pattern.count} occurrence{pattern.count !== 1 ? "s" : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase ${impactColors[pattern.impact]}`}>
          {pattern.impact}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductionHealthPanel() {
  const [data, setData] = useState<ProductionHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const fresh = computeProductionHealth();
      setData(fresh);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to compute production health";
      setError(message);
      logErrorEvent("computation", "ProductionHealthPanel", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const existing = getProductionHealth();
    if (existing) {
      setData(existing);
      setLoading(false);
    } else {
      refresh();
    }
  }, [refresh]);

  const handleClear = () => {
    clearProductionHealth();
    refresh();
  };

  // ── Loading ──
  if (loading && !data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/10" />
          <div className="h-5 w-48 rounded-full bg-white/10" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-white/5" />
      </div>
    );
  }

  // ── Error ──
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <span className="text-3xl">⚠️</span>
        <h3 className="mt-3 text-lg font-semibold text-core-heading">Health check failed</h3>
        <p className="mt-1 text-sm text-core-muted">{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 rounded-full bg-core-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty ──
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-core-border p-8 text-center">
        <span className="text-3xl">🩺</span>
        <h3 className="mt-3 text-lg font-semibold text-core-heading">No health data yet</h3>
        <p className="mt-1 text-sm text-core-muted">
          Start exploring the platform to build system health intelligence.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 rounded-full bg-core-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          Run health check
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* ───── HEADER ───── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🩺</span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent font-semibold">System Health</p>
            <h2 className="text-lg font-semibold text-core-heading">Production Health Intelligence</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge risk={data.riskLevel} />
          <span className="text-xs text-core-muted">
            Updated {new Date(data.lastComputed).toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="rounded-full bg-core-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-red-500/40 px-4 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ───── OVERVIEW GRID ───── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Health Gauge */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5 flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">Health Score</p>
          <div className="relative flex justify-center py-2">
            <HealthGauge value={data.healthScore} />
          </div>
          <p className="text-[10px] text-core-muted mt-1 text-center">
            {data.healthScore >= 70
              ? "System operating normally"
              : data.healthScore >= 50
                ? "Some subsystems need attention"
                : data.healthScore >= 30
                  ? "Multiple subsystems degraded"
                  : "Immediate intervention required"}
          </p>
        </div>

        {/* Metrics */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">Metrics</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-core-text">Risk Level</span>
              <RiskBadge risk={data.riskLevel} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-core-text">Active Alerts</span>
              <span className={`text-sm font-mono font-bold ${data.criticalAlerts.filter((a) => a.severity === "critical").length > 0 ? "text-red-400" : "text-core-heading"}`}>
                {data.criticalAlerts.filter((a) => a.severity !== "info").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-core-text">Slow Components</span>
              <span className={`text-sm font-mono font-bold ${data.slowComponents.filter((s) => s.severity === "high").length > 0 ? "text-amber-400" : "text-core-heading"}`}>
                {data.slowComponents.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-core-text">Tracked Errors</span>
              <span className="text-sm font-mono font-bold text-core-heading">{data.errorLog.length}</span>
            </div>
          </div>
        </div>

        {/* Stability Trend */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5 md:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">7-Day Stability Trend</p>
          <StabilityChart trend={data.stabilityTrend} />
        </div>
      </div>

      {/* ───── ALERTS ───── */}
      <div className="rounded-2xl border border-core-border bg-core-surface p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
          Alerts ({data.criticalAlerts.length})
        </p>
        {data.criticalAlerts.length > 0 ? (
          <div className="space-y-3">
            {data.criticalAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-center">
            <p className="text-sm text-core-muted">✅ No alerts — all systems nominal.</p>
          </div>
        )}
      </div>

      {/* ───── MAIN GRID ───── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Slow Components */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
            Slow Components ({data.slowComponents.length})
          </p>
          {data.slowComponents.length > 0 ? (
            <div className="space-y-2">
              {data.slowComponents.map((comp) => (
                <SlowComponentCard key={comp.component} component={comp} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-core-muted py-6 text-center">No slow components detected.</p>
          )}
        </div>

        {/* Performance Insights */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
            Performance Insights
          </p>
          {data.performanceInsights.length > 0 ? (
            <div className="space-y-2">
              {data.performanceInsights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-core-muted py-6 text-center">No insights available yet.</p>
          )}
        </div>

        {/* Failure Patterns */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
            Failure Patterns ({data.failurePatterns.length})
          </p>
          {data.failurePatterns.length > 0 ? (
            <div className="space-y-2">
              {data.failurePatterns.map((pattern, i) => (
                <FailurePatternCard key={i} pattern={pattern} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-core-muted py-6 text-center">No failure patterns detected.</p>
          )}
        </div>
      </div>

      {/* ───── RECOMMENDED FIXES ───── */}
      <div className="rounded-2xl border border-core-border bg-core-surface p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
          Recommended Fixes ({data.recommendedFixes.length})
        </p>
        {data.recommendedFixes.length > 0 ? (
          <div className="space-y-3">
            {data.recommendedFixes.map((fix) => (
              <FixCard key={fix.id} fix={fix} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-core-muted py-6 text-center">No fixes recommended.</p>
        )}
      </div>

      {/* ───── SYSTEM NARRATIVE ───── */}
      <div className="rounded-2xl border border-core-accent/15 bg-core-accent/5 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
          System Narrative
        </p>
        <div className="space-y-2.5">
          {data.systemNarrative.map((line, i) => (
            <p key={i} className="flex items-start gap-2 text-sm text-core-text leading-relaxed">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-core-accent/50" />
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
