"use client";

import { useEffect, useState, useCallback } from "react";
import { getUserAnalytics, computeUserAnalytics } from "../data/user-analytics";
import type { UserAnalyticsData } from "../data/user-analytics";

// ─── Color helpers ───────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function scoreRing(score: number): string {
  if (score >= 70) return "border-emerald-500/30";
  if (score >= 40) return "border-amber-500/30";
  return "border-red-500/30";
}

function heatmapIntensity(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-white/5";
  const ratio = value / max;
  if (ratio >= 0.75) return "bg-core-accent/50";
  if (ratio >= 0.5) return "bg-core-accent/30";
  if (ratio >= 0.25) return "bg-core-accent/15";
  return "bg-white/10";
}

// ─── Mini Bar ────────────────────────────────────────────────────────────

function MiniBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-core-muted truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-core-accent/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium text-core-text tabular-nums">{value}</span>
    </div>
  );
}

// ─── Engagement Gauge ────────────────────────────────────────────────────

function EngagementGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width="96" height="96" className="-rotate-90">
          <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="48"
            cy="48"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className={`transition-all duration-700 ease-out ${scoreColor(score)}`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute text-2xl font-bold tabular-nums">{score}</span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted">Engagement</p>
    </div>
  );
}

// ─── Dropoff Alert ───────────────────────────────────────────────────────

function DropoffAlert({ point }: { point: string | null }) {
  if (!point) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
        No dropoff points detected — flow is clean
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
      <span className="font-semibold">Dropoff detected:</span> {point}
    </div>
  );
}

// ─── Retention Card ──────────────────────────────────────────────────────

function RetentionCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-core-border bg-core-bg/60 p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-core-heading tabular-nums">{value}</p>
      {subtitle && <p className="text-[10px] text-core-muted/60 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ─── Session Heatmap ─────────────────────────────────────────────────────

function SessionHeatmap({ data }: { data: UserAnalyticsData["sessionHeatmap"] }) {
  // Group by day, show only last 7 days
  const days = Array.from(new Set(data.map((d) => d.date))).slice(-7);
  const maxEvents = Math.max(1, ...data.map((d) => d.events));

  if (days.length === 0) {
    return <p className="text-xs text-core-muted">No session data yet.</p>;
  }

  return (
    <div className="space-y-1">
      {days.map((day) => {
        const dayData = data.filter((d) => d.date === day);
        const dayLabel = new Date(day + "T12:00:00").toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        return (
          <div key={day} className="flex items-center gap-2">
            <span className="w-28 text-[10px] text-core-muted shrink-0">{dayLabel}</span>
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: 24 }).map((_, hour) => {
                const events = dayData.find((d) => d.hour === hour)?.events ?? 0;
                return (
                  <div
                    key={hour}
                    className={`flex-1 h-3 rounded-sm ${heatmapIntensity(events, maxEvents)}`}
                    title={`${hour}:00 — ${events} events`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Usage Card ──────────────────────────────────────────────────────────

function UsageCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-core-border bg-core-bg/60 p-4">
        <p className="text-xs font-semibold text-core-heading mb-2">{title}</p>
        <p className="text-xs text-core-muted">No data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-core-border bg-core-bg/60 p-4">
      <p className="text-xs font-semibold text-core-heading mb-3">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <MiniBar
            key={item.label}
            label={item.label}
            value={item.value}
            max={items[0].value}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Top Features Grid ───────────────────────────────────────────────────

function FeatureCard({
  name,
  count,
  icon,
}: {
  name: string;
  count: number;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-core-border bg-core-bg/60 p-3">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-core-heading truncate">{name}</p>
        <p className="text-[10px] text-core-muted tabular-nums">{count} interactions</p>
      </div>
    </div>
  );
}

// ─── Journey Summary ─────────────────────────────────────────────────────

function JourneySummary({ points }: { points: string[] }) {
  if (points.length === 0) {
    return <p className="text-xs text-core-muted">Not enough data for a summary yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {points.map((point, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-core-text">
          <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-core-accent/60" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

interface UserAnalyticsPanelProps {
  className?: string;
}

export default function UserAnalyticsPanel({ className = "" }: UserAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<UserAnalyticsData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    const data = getUserAnalytics();
    setAnalytics(data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!loaded) {
    return (
      <div className={`rounded-2xl border border-core-border bg-core-bg/60 p-4 space-y-3 ${className}`}>
        <div className="h-3 w-24 animate-skeleton" />
        <div className="h-5 w-40 animate-skeleton" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 animate-skeleton rounded-xl" />
          <div className="h-16 animate-skeleton rounded-xl" />
          <div className="h-16 animate-skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`rounded-2xl border border-core-border bg-core-bg/60 p-4 ${className}`}>
        <p className="text-xs font-semibold text-core-heading">User Analytics</p>
        <p className="mt-2 text-xs text-core-muted">No analytics data yet. Start using CorePath to generate insights.</p>
      </div>
    );
  }

  // Top 5 features by usage
  const featureEntries = [
    { name: "Quizzes", count: analytics.featureUsageMap.quizzes, icon: "📝" },
    { name: "Careers", count: analytics.featureUsageMap.careers, icon: "💼" },
    { name: "Comparisons", count: analytics.featureUsageMap.comparisons, icon: "⚖️" },
    { name: "Workspace", count: analytics.featureUsageMap.workspace, icon: "🛠️" },
    { name: "Missions", count: analytics.featureUsageMap.missions, icon: "🎯" },
    { name: "Notifications", count: analytics.featureUsageMap.notifications, icon: "🔔" },
    { name: "Timeline", count: analytics.featureUsageMap.timeline, icon: "📅" },
    { name: "Panels", count: analytics.featureUsageMap.panels, icon: "🧩" },
    { name: "Command Center", count: analytics.featureUsageMap.commandCenter, icon: "🎛️" },
    { name: "Recommendations", count: analytics.featureUsageMap.recommendations, icon: "💡" },
  ]
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className={`rounded-2xl border border-core-border bg-core-bg/60 p-4 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            User Analytics
          </p>
          <p className="text-sm font-semibold text-core-heading">
            Your engagement intelligence
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const fresh = computeUserAnalytics();
            setAnalytics(fresh);
          }}
          className="rounded-full border border-core-border px-3 py-1 text-[10px] font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Refresh
        </button>
      </div>

      {/* Engagement Gauge + Dropoff */}
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <EngagementGauge score={analytics.engagementScore} />
        <DropoffAlert point={analytics.dropoffPoint} />
      </div>

      {/* Retention Cards */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
          Retention &amp; Sessions
        </p>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          <RetentionCard label="Sessions" value={analytics.retentionSignals.totalSessions} />
          <RetentionCard
            label="Streak"
            value={`${analytics.retentionSignals.sessionStreak}d`}
            subtitle={analytics.retentionSignals.returningUser ? "Returning user" : "First visit"}
          />
          <RetentionCard
            label="Avg Events/Session"
            value={analytics.retentionSignals.averageSessionEvents}
          />
          <RetentionCard
            label="Days Active/Week"
            value={analytics.retentionSignals.daysActiveThisWeek}
            subtitle={
              analytics.retentionSignals.daysSinceLastVisit === 0
                ? "Active today"
                : `${analytics.retentionSignals.daysSinceLastVisit}d since last`
            }
          />
        </div>
      </div>

      {/* Top Features */}
      {featureEntries.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
            Feature Usage
          </p>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {featureEntries.slice(0, 10).map((f) => (
              <FeatureCard key={f.name} name={f.name} count={f.count} icon={f.icon} />
            ))}
          </div>
        </div>
      )}

      {/* Most / Least Used Panels */}
      <div className="grid gap-4 sm:grid-cols-2">
        <UsageCard
          title="Most Used Panels"
          items={analytics.mostUsedPanels.map((p) => ({
            label: p.panel,
            value: p.count,
          }))}
        />
        <UsageCard
          title="Least Used Panels"
          items={analytics.leastUsedPanels.map((p) => ({
            label: p.panel,
            value: p.count,
          }))}
        />
      </div>

      {/* Session Heatmap */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
          Session Heatmap (7 days)
        </p>
        <div className="rounded-xl border border-core-border bg-core-bg/60 p-3 overflow-x-auto">
          <SessionHeatmap data={analytics.sessionHeatmap} />
        </div>
      </div>

      {/* Journey Summary */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
          Your Journey Summary
        </p>
        <div className="rounded-xl border border-core-border bg-core-bg/60 p-3">
          <JourneySummary points={analytics.userJourneySummary} />
        </div>
      </div>
    </div>
  );
}
