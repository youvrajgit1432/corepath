"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLaunchAudit,
  computeLaunchAudit,
  clearLaunchAudit,
  type LaunchAuditData,
  type AuditIssue,
  type FixChecklistItem,
  type ReadinessLevel,
  type ReleaseRisk,
} from "../data/launch-audit";

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LaunchGauge({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 85 ? "#34d399" : value >= 65 ? "#f59e0b" : value >= 40 ? "#f97316" : "#f87171";

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

function ReadinessBadge({ level }: { level: ReadinessLevel }) {
  const colors: Record<string, string> = {
    ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    almost_ready: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    needs_work: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    not_ready: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const icons: Record<string, string> = {
    ready: "✅",
    almost_ready: "⚠️",
    needs_work: "🔧",
    not_ready: "🚫",
  };
  const labels: Record<string, string> = {
    ready: "Ready for Launch",
    almost_ready: "Almost Ready",
    needs_work: "Needs Work",
    not_ready: "Not Ready",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${colors[level]}`}>
      {icons[level]} {labels[level]}
    </span>
  );
}

function RiskBadge({ risk }: { risk: ReleaseRisk }) {
  const colors: Record<string, string> = {
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    high: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const icons: Record<string, string> = {
    low: "🛡️",
    medium: "⚡",
    high: "🚨",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${colors[risk]}`}>
      {icons[risk]} {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
    </span>
  );
}

function IssueCard({ issue }: { issue: AuditIssue }) {
  const typeIcons: Record<string, string> = {
    critical: "🔴",
    warning: "⚠️",
    info: "ℹ️",
  };
  const typeColors: Record<string, string> = {
    critical: "border-red-500/40 bg-red-500/10",
    warning: "border-amber-500/40 bg-amber-500/10",
    info: "border-core-accent/20 bg-core-accent/5",
  };
  const labelColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400",
    warning: "bg-amber-500/20 text-amber-400",
    info: "bg-core-accent/15 text-core-accent",
  };
  const effortIcons: Record<string, string> = {
    quick: "⚡",
    moderate: "🛠️",
    significant: "🏗️",
  };

  return (
    <div className={`rounded-2xl border p-4 ${typeColors[issue.type] ?? "border-core-border bg-core-bg/60"}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-base">{typeIcons[issue.type] ?? "ℹ️"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-core-heading">{issue.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase ${labelColors[issue.type]}`}>
              {issue.type}
            </span>
            <span className="text-[0.6rem] text-core-muted flex items-center gap-1">
              {effortIcons[issue.effort]} {issue.effort}
            </span>
          </div>
          <p className="mt-1 text-xs text-core-muted">{issue.description}</p>
          <p className="mt-1.5 text-xs font-medium text-core-accent">
            💡 {issue.suggestion}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ item, onToggle }: { item: FixChecklistItem; onToggle: (id: string) => void }) {
  const priorityColors: Record<string, string> = {
    critical: "text-red-400 bg-red-500/15",
    high: "text-amber-400 bg-amber-500/15",
    medium: "text-core-accent bg-core-accent/10",
    low: "text-core-muted bg-white/10",
  };
  const effortIcons: Record<string, string> = {
    quick: "⚡",
    moderate: "🛠️",
    significant: "🏗️",
  };

  return (
    <div className={`flex items-start gap-3 rounded-xl border border-core-border bg-core-bg/60 p-3 transition ${item.done ? "opacity-50" : ""}`}>
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          item.done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-core-border hover:border-core-accent"
        }`}
      >
        {item.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${item.done ? "text-core-muted line-through" : "text-core-text"}`}>
          {item.label}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase ${priorityColors[item.priority]}`}>
            {item.priority}
          </span>
          <span className="text-[0.6rem] text-core-muted flex items-center gap-1">
            {effortIcons[item.effort]} {item.effort}
          </span>
          <span className="text-[0.55rem] text-core-muted capitalize">{item.category.replace(/_/g, " ")}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LaunchAuditPanel() {
  const [data, setData] = useState<LaunchAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<FixChecklistItem[]>([]);
  const [activeTab, setActiveTab] = useState<"issues" | "checklist">("issues");

  const refresh = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const fresh = computeLaunchAudit();
      setData(fresh);
      setChecklist(fresh.fixChecklist);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to compute launch audit");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const existing = getLaunchAudit();
    if (existing) {
      setData(existing);
      setChecklist(existing.fixChecklist);
      setLoading(false);
    } else {
      refresh();
    }
  }, [refresh]);

  const handleClear = () => {
    clearLaunchAudit();
    refresh();
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const doneCount = checklist.filter((i) => i.done).length;
  const criticalCount = data?.criticalIssues.length ?? 0;
  const warningCount = data?.warningIssues.length ?? 0;
  const infoCount = data?.infoIssues.length ?? 0;
  const totalIssueCount = criticalCount + warningCount + infoCount;

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
        <h3 className="mt-3 text-lg font-semibold text-core-heading">Launch audit failed</h3>
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
        <span className="text-3xl">🚀</span>
        <h3 className="mt-3 text-lg font-semibold text-core-heading">No audit data yet</h3>
        <p className="mt-1 text-sm text-core-muted">
          Run a launch readiness audit to check the platform before deployment.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 rounded-full bg-core-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          Run audit
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* ───── HEADER ───── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent font-semibold">Launch Readiness</p>
            <h2 className="text-lg font-semibold text-core-heading">Deployment Audit</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ReadinessBadge level={data.readinessLevel} />
          <RiskBadge risk={data.releaseRisk} />
          <span className="text-xs text-core-muted">
            {data.totalScanned} components scanned
          </span>
          <button
            type="button"
            onClick={refresh}
            className="rounded-full bg-core-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            Re-audit
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Score Gauge */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5 flex flex-col items-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">Launch Score</p>
          <div className="relative flex justify-center py-2">
            <LaunchGauge value={data.launchScore} />
          </div>
          <p className="text-[10px] text-core-muted mt-1 text-center">
            {data.launchScore >= 85
              ? "All criteria met — ready to deploy"
              : data.launchScore >= 65
                ? "Close to ready — resolve remaining issues"
                : data.launchScore >= 40
                  ? "Significant work needed before launch"
                  : "Not ready — critical issues blocking"}
          </p>
        </div>

        {/* Issue Counts */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">Issue Summary</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-core-text">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Critical
              </span>
              <span className={`text-sm font-mono font-bold ${criticalCount > 0 ? "text-red-400" : "text-core-heading"}`}>
                {criticalCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-core-text">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Warnings
              </span>
              <span className={`text-sm font-mono font-bold ${warningCount > 0 ? "text-amber-400" : "text-core-heading"}`}>
                {warningCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-core-text">
                <span className="h-2 w-2 rounded-full bg-core-accent/60" />
                Info
              </span>
              <span className="text-sm font-mono font-bold text-core-heading">{infoCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-core-text">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Checked ({doneCount}/{checklist.length})
              </span>
              <span className="text-sm font-mono font-bold text-core-heading">
                {checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-core-text">Total Scanned</span>
              <span className="text-sm font-mono font-bold text-core-heading">{data.totalScanned}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("issues")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "issues"
                  ? "bg-core-accent text-white"
                  : "text-core-muted hover:text-core-heading bg-white/5"
              }`}
            >
              Issues ({criticalCount + warningCount + infoCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "checklist"
                  ? "bg-core-accent text-white"
                  : "text-core-muted hover:text-core-heading bg-white/5"
              }`}
            >
              Fix Checklist ({doneCount}/{checklist.length})
            </button>
          </div>

          {activeTab === "issues" && (
            <div className="space-y-2">
              {criticalCount > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/5 p-3">
                  <span className="text-xs text-core-text font-medium">Critical issues blocking launch</span>
                  <span className="text-sm font-bold text-red-400">{criticalCount}</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <span className="text-xs text-core-text font-medium">Warnings to review</span>
                  <span className="text-sm font-bold text-amber-400">{warningCount}</span>
                </div>
              )}
              {infoCount > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-core-accent/20 bg-core-accent/5 p-3">
                  <span className="text-xs text-core-text font-medium">Informational items</span>
                  <span className="text-sm font-bold text-core-accent">{infoCount}</span>
                </div>
              )}
              {criticalCount + warningCount + infoCount === 0 && (
                <div className="flex items-center justify-center py-6">
                  <p className="text-sm text-emerald-400 font-medium">✅ No issues found — clean audit!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-core-muted shrink-0">
                {doneCount}/{checklist.length} done
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ───── ISSUES (if tab active) ───── */}
      {activeTab === "issues" && totalIssueCount > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            {criticalCount > 0 ? `${criticalCount} Critical · ` : ""}
            {warningCount > 0 ? `${warningCount} Warnings · ` : ""}
            {infoCount > 0 ? `${infoCount} Informational` : ""}
          </p>
          {criticalCount > 0 && (
            <div className="space-y-2">
              {data.criticalIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
          {warningCount > 0 && (
            <div className="space-y-2">
              {data.warningIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
          {infoCount > 0 && (
            <div className="space-y-2">
              {data.infoIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───── FIX CHECKLIST (if tab active) ───── */}
      {activeTab === "checklist" && (
        <div className="rounded-2xl border border-core-border bg-core-surface p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
            Fix Checklist ({doneCount}/{checklist.length})
          </p>
          {checklist.length > 0 ? (
            <div className="space-y-2">
              {checklist.map((item) => (
                <ChecklistItem key={item.id} item={item} onToggle={handleToggleChecklist} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-core-muted py-6 text-center">No items in checklist — clean audit!</p>
          )}
        </div>
      )}

      {/* ───── DEPLOYMENT NARRATIVE ───── */}
      <div className="rounded-2xl border border-core-accent/15 bg-core-accent/5 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
          Deployment Narrative
        </p>
        <div className="space-y-2.5">
          {data.deploymentNarrative.map((line, i) => (
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
