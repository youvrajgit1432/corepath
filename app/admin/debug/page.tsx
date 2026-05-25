"use client";

import { useState, useEffect, useCallback } from "react";
import { checkStorageHealth, logStorageHealth } from "../../../data/storage-health";
import { loadJourneyMemory, buildJourneyProfile, clearJourneyMemory } from "../../../data/journey-memory";
import { generateConfidenceMetrics } from "../../../data/confidence-engine";
import { getAllEvents, clearAnalyticsData, getEventStats } from "../../../data/analytics-events";
import { getRenderCounts, resetRenderCounts } from "../../../data/performance-debug";
import type { StorageHealthReport } from "../../../data/storage-health";
import type { JourneyMemory, JourneyProfile } from "../../../data/journey-memory";
import type { ConfidenceMetrics } from "../../../data/confidence-engine";

type DebugTab = "storage" | "journey" | "confidence" | "analytics" | "perf";

export default function AdminDebugPage() {
  const [activeTab, setActiveTab] = useState<DebugTab>("storage");
  const [health, setHealth] = useState<StorageHealthReport | null>(null);
  const [memory, setMemory] = useState<JourneyMemory | null>(null);
  const [profile, setProfile] = useState<JourneyProfile | null>(null);
  const [metrics, setMetrics] = useState<ConfidenceMetrics | null>(null);
  const [analyticsStats, setAnalyticsStats] = useState<ReturnType<typeof getEventStats> | null>(null);
  const [renderCounts, setRenderCounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string>("");

  const refresh = useCallback(() => {
    setHealth(checkStorageHealth());
    logStorageHealth();

    const mem = loadJourneyMemory();
    setMemory(mem);
    setProfile(buildJourneyProfile(mem));
    setMetrics(generateConfidenceMetrics(mem));
    setAnalyticsStats(getEventStats());
    setRenderCounts(getRenderCounts());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const tabs: Array<{ id: DebugTab; label: string }> = [
    { id: "storage", label: "Storage Health" },
    { id: "journey", label: "Journey State" },
    { id: "confidence", label: "Confidence" },
    { id: "analytics", label: "Analytics" },
    { id: "perf", label: "Render Perf" },
  ];

  const handleClearMemory = () => {
    clearJourneyMemory();
    clearAnalyticsData();
    setMessage("Memory cleared!");
    refresh();
    setTimeout(() => setMessage(""), 2000);
  };

  const handleResetCounts = () => {
    resetRenderCounts();
    setRenderCounts({});
    setMessage("Render counts reset!");
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Debug Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Development-only diagnostics. Refresh data to see latest state.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-80 transition-opacity"
          >
            Refresh
          </button>
          <button
            onClick={handleClearMemory}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:opacity-80 transition-opacity"
          >
            Clear Memory
          </button>
          <button
            onClick={handleResetCounts}
            className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:opacity-80 transition-opacity"
          >
            Reset Counts
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-sm">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "storage" && health && <StoragePanel report={health} />}
        {activeTab === "journey" && memory && profile && (
          <JourneyPanel memory={memory} profile={profile} />
        )}
        {activeTab === "confidence" && metrics && <ConfidencePanel metrics={metrics} />}
        {activeTab === "analytics" && analyticsStats && <AnalyticsPanel stats={analyticsStats} />}
        {activeTab === "perf" && <PerfPanel counts={renderCounts} />}
      </div>
    </div>
  );
}

// ============ Panel Components ============

function StoragePanel({ report }: { report: StorageHealthReport }) {
  const statusColor =
    report.status === "critical"
      ? "text-red-500"
      : report.status === "warning"
      ? "text-yellow-500"
      : "text-green-500";

  const statusIcon =
    report.status === "critical"
      ? "🔴"
      : report.status === "warning"
      ? "🟡"
      : "🟢";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          label="Status"
          value={`${statusIcon} ${report.status.toUpperCase()}`}
          className={statusColor}
        />
        <MetricCard label="Fallback Active" value={report.usingFallback ? "⚠️ Yes" : "No"} />
        <MetricCard
          label="Estimated Usage"
          value={`${(report.estimatedUsageBytes / 1000).toFixed(1)} KB`}
        />
        <MetricCard
          label="Usage %"
          value={`${report.usagePercent.toFixed(1)}%`}
        />
        <MetricCard label="Keys Stored" value={String(report.keyCount)} />
        <MetricCard
          label="Corrupted Keys"
          value={report.corruptedKeys.length > 0 ? report.corruptedKeys.join(", ") : "None"}
        />
        <MetricCard label="Recent Errors" value={String(report.recentErrorCount)} />
      </div>

      {report.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Warnings</h3>
          <ul className="list-disc list-inside space-y-1">
            {report.warnings.map((w, i) => (
              <li key={i} className="text-sm text-yellow-800 dark:text-yellow-200">{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function JourneyPanel({
  memory,
  profile,
}: {
  memory: JourneyMemory;
  profile: JourneyProfile;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Sessions" value={String(memory.completedQuizzes)} />
        <MetricCard label="Careers Viewed" value={String(Object.keys(memory.viewedCareers).length)} />
        <MetricCard label="Comparisons" value={String(Object.keys(memory.comparedCareerPairs).length)} />
        <MetricCard
          label="Confidence History"
          value={`[${memory.confidenceHistory.join(", ")}]`}
        />
        <MetricCard
          label="Specialization Depth"
          value={String(memory.specializationDepthHistory.join(", "))}
        />
        <MetricCard label="Top Themes" value={profile.topThemes.join(", ") || "None"} />
      </div>

      {profile.careerInterestProfile.length > 0 && (
        <Section title="Career Interest Profile">
          {profile.careerInterestProfile.map((item, i) => (
            <p key={i} className="text-sm">{item}</p>
          ))}
        </Section>
      )}

      {profile.recommendationAdjustments.length > 0 && (
        <Section title="Recommendation Adjustments">
          {profile.recommendationAdjustments.map((item, i) => (
            <p key={i} className="text-sm">{item}</p>
          ))}
        </Section>
      )}

      {profile.confidenceTrends.length > 0 && (
        <Section title="Confidence Trends">
          {profile.confidenceTrends.map((item, i) => (
            <p key={i} className="text-sm">{item}</p>
          ))}
        </Section>
      )}
    </div>
  );
}

function ConfidencePanel({ metrics }: { metrics: ConfidenceMetrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard label="Confidence Level" value={metrics.confidenceLevel} />
        <MetricCard label="Confidence Score" value={(metrics.confidenceScore * 100).toFixed(0) + "%"} />
        <MetricCard label="Uncertainty Level" value={metrics.uncertaintyLevel} />
        <MetricCard label="Exploration Status" value={metrics.explorationStatus} />
        <MetricCard label="Stability" value={metrics.recommendationStability} />
        <MetricCard label="Profile Maturity" value={metrics.profileMaturity} />
        <MetricCard label="Trend Direction" value={metrics.trendDirection} />
      </div>

      <Section title="Narratives">
        <p className="text-sm mb-2"><strong>Confidence:</strong> {metrics.confidenceNarrative}</p>
        <p className="text-sm mb-2"><strong>Uncertainty:</strong> {metrics.uncertaintyNarrative}</p>
        <p className="text-sm mb-2"><strong>Exploration:</strong> {metrics.explorationNarrative}</p>
        <p className="text-sm mb-2"><strong>Recommendation:</strong> {metrics.recommendationNarrative}</p>
        <p className="text-sm"><strong>Evolution:</strong> {metrics.evolutionNarrative}</p>
      </Section>

      {metrics.nextSteps.length > 0 && (
        <Section title="Next Steps">
          <ul className="list-disc list-inside space-y-1">
            {metrics.nextSteps.map((step, i) => (
              <li key={i} className="text-sm">{step}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Signals (${metrics.signals.length} total)`}>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {metrics.signals.map((s, i) => (
            <div key={i} className="text-xs p-2 bg-[var(--bg-subtle)] rounded">
              <span className="font-mono">{s.signal}</span>
              {" — "}
              <span className={s.impact === "positive" ? "text-green-600" : s.impact === "negative" ? "text-red-600" : ""}>
                {s.impact}
              </span>
              {" (v={s.value.toFixed(2)}) "}
              <span className="text-[var(--text-muted)]">{s.explanation}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AnalyticsPanel({ stats }: { stats: ReturnType<typeof getEventStats> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Session ID" value={stats.sessionId.slice(0, 20) + "..."} />
        <MetricCard label="Total Events" value={String(stats.totalEvents)} />
        <MetricCard
          label="Session Duration"
          value={`${(stats.sessionDuration / 1000).toFixed(0)}s`}
        />
        <MetricCard label="Feedback Count" value={String(stats.totalFeedback)} />
        <MetricCard label="Helpful" value={String(stats.helpfulCount)} />
        <MetricCard label="Unhelpful" value={String(stats.unhelpfulCount)} />
      </div>

      {Object.keys(stats.eventBreakdown).length > 0 && (
        <Section title="Event Breakdown">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(stats.eventBreakdown).map(([type, count]) => (
              <div key={type} className="text-xs p-2 bg-[var(--bg-subtle)] rounded flex justify-between">
                <span className="font-mono">{type}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function PerfPanel({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Tracks render counts for components using <code className="text-xs bg-[var(--bg-subtle)] px-1 py-0.5 rounded">useRenderCount</code>. Reset counters to start fresh.
      </p>

      {entries.length === 0 ? (
        <div className="p-8 text-center text-[var(--text-muted)]">
          <p className="text-lg mb-2">No render data yet</p>
          <p className="text-sm">
            Render counts appear here once components with <code className="text-xs bg-[var(--bg-subtle)] px-1 py-0.5 rounded">useRenderCount</code> are mounted.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {entries.map(([name, count]) => (
            <div
              key={name}
              className="flex justify-between items-center p-3 bg-[var(--bg-subtle)] rounded-lg"
            >
              <span className="font-mono text-sm">{name}</span>
              <span className={`font-bold text-lg ${count > 10 ? "text-yellow-500" : "text-green-500"}`}>
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Shared UI Components ============

function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="p-4 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border)]">
      <div className="text-xs text-[var(--text-muted)] mb-1">{label}</div>
      <div className={`font-mono text-sm break-all ${className ?? ""}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border)]">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
