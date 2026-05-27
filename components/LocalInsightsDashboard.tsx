"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildLocalProductIntelligence,
  type LocalProductIntelligence,
  type RankedMetric,
  type TrendMetric,
} from "../data/local-product-intelligence";

function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value : 0}%`;
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "No events yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function trendLabel(metric: TrendMetric) {
  if (metric.direction === "flat") return "steady";
  return `${metric.change > 0 ? "+" : ""}${metric.change} recent`;
}

function MetricCard({
  label,
  value,
  detail,
  trend,
}: {
  label: string;
  value: string | number;
  detail?: string;
  trend?: TrendMetric;
}) {
  return (
    <div className="rounded-card bg-core-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-core-muted">{label}</p>
        {trend ? (
          <span
            className={`rounded-full border px-2 py-1 text-[0.65rem] font-semibold ${
              trend.direction === "up"
                ? "border-emerald-400/40 text-emerald-300"
                : trend.direction === "down"
                  ? "border-amber-400/40 text-amber-300"
                  : "border-core-border text-core-muted"
            }`}
          >
            {trendLabel(trend)}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-semibold text-core-heading">{value}</p>
      {detail ? <p className="mt-2 text-sm text-core-muted">{detail}</p> : null}
    </div>
  );
}

function RankedList({ title, items, emptyText }: { title: string; items: RankedMetric[]; emptyText: string }) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="rounded-card bg-core-surface p-6">
      <h2 className="text-lg font-semibold text-core-heading">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-0 truncate text-core-text">{item.label}</span>
                <span className="shrink-0 font-mono text-core-muted">{item.count}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-core-accent"
                  style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-core-muted">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

function ConfidenceChart({ data }: { data: LocalProductIntelligence["confidenceDistribution"] }) {
  const total = data.low + data.medium + data.high;
  const buckets = [
    { label: "Low", value: data.low, color: "bg-amber-400" },
    { label: "Medium", value: data.medium, color: "bg-sky-400" },
    { label: "High", value: data.high, color: "bg-emerald-400" },
  ];

  return (
    <section className="rounded-card bg-core-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-core-heading">Confidence Distribution</h2>
          <p className="mt-2 text-sm text-core-muted">Average confidence: {data.average}%</p>
        </div>
        <span className="rounded-full border border-core-border px-3 py-1 text-xs text-core-muted">{total} samples</span>
      </div>
      <div className="mt-6 space-y-4">
        {buckets.map((bucket) => (
          <div key={bucket.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-core-text">{bucket.label}</span>
              <span className="font-mono text-core-muted">{bucket.value}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${bucket.color}`}
                style={{ width: total ? `${Math.max(8, (bucket.value / total) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AiSignals({ data }: { data: LocalProductIntelligence["aiInterestSignals"] }) {
  const total = data.careerViews + data.compareActions + data.recommendations;
  const items = [
    { label: "Career views", value: data.careerViews },
    { label: "Compare actions", value: data.compareActions },
    { label: "Recommendations", value: data.recommendations },
  ];

  return (
    <section className="rounded-card bg-core-surface p-6">
      <h2 className="text-lg font-semibold text-core-heading">AI Interest Signals</h2>
      <p className="mt-2 text-sm text-core-muted">{total} local signals across AI-related exploration.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-core-border bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-core-muted">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-core-heading">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LocalInsightsDashboard() {
  const [snapshot, setSnapshot] = useState<LocalProductIntelligence>(() => buildLocalProductIntelligence());

  const refresh = () => {
    setSnapshot(buildLocalProductIntelligence());
  };

  useEffect(() => {
    refresh();
  }, []);

  const insightList = useMemo(() => snapshot.generatedInsights, [snapshot]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-12 pt-28">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-core-accent">Local Admin</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-core-heading md:text-5xl">
              Product intelligence dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-core-muted">
              Local-only behavior summary generated from CorePath analytics, journey memory, and feedback events.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-core-border px-4 py-2 text-sm text-core-muted">
              {snapshot.eventCount} events
            </span>
            <span className="rounded-full border border-core-border px-4 py-2 text-sm text-core-muted">
              Updated {formatDate(snapshot.lastUpdated)}
            </span>
            <button
              type="button"
              onClick={refresh}
              className="rounded-full bg-core-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Quiz starts" value={snapshot.quizStarts.value} trend={snapshot.quizStarts} />
          <MetricCard label="Quiz completions" value={snapshot.quizCompletions.value} trend={snapshot.quizCompletions} />
          <MetricCard label="Completion rate" value={formatPercent(snapshot.completionRate)} detail="Starts that reached recommendation output" />
          <MetricCard
            label="Helpful ratio"
            value={formatPercent(snapshot.recommendationHelpfulRatio)}
            detail={`${snapshot.recommendationFeedbackTotal} feedback responses`}
          />
        </section>

        <section className="mt-6 rounded-card bg-core-surface p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-core-heading">Generated insights</h2>
              <p className="mt-2 text-sm text-core-muted">Actionable patterns inferred from local product behavior.</p>
            </div>
            {snapshot.commonDropoffStage ? (
              <span className="rounded-full border border-amber-400/40 px-3 py-1 text-sm text-amber-300">
                Dropoff: {snapshot.commonDropoffStage.label}
              </span>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {insightList.map((insight) => (
              <div key={insight} className="rounded-2xl border border-core-border bg-white/5 p-4 text-sm text-core-text">
                {insight}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <RankedList title="Most Viewed Careers" items={snapshot.mostViewedCareers} emptyText="No career views tracked yet." />
          <RankedList title="Most Compared Careers" items={snapshot.mostComparedCareers} emptyText="No comparisons tracked yet." />
          <RankedList title="Favorite Categories" items={snapshot.favoriteCategories} emptyText="No category interest tracked yet." />
          <RankedList title="Top Repeated Interests" items={snapshot.topRepeatedInterests} emptyText="No repeated interests yet." />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <AiSignals data={snapshot.aiInterestSignals} />
          <ConfidenceChart data={snapshot.confidenceDistribution} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <RankedList title="Most Explored Themes" items={snapshot.mostExploredThemes} emptyText="No theme history tracked yet." />
          <section className="rounded-card bg-core-surface p-6">
            <h2 className="text-lg font-semibold text-core-heading">Dropoff Signal</h2>
            {snapshot.commonDropoffStage ? (
              <div className="mt-5 rounded-2xl border border-core-border bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-core-muted">Common stage</p>
                <p className="mt-3 text-2xl font-semibold text-core-heading">{snapshot.commonDropoffStage.label}</p>
                <p className="mt-2 text-sm text-core-muted">{snapshot.commonDropoffStage.count} recorded dropoff events</p>
              </div>
            ) : (
              <p className="mt-5 text-sm text-core-muted">No quiz dropoff events tracked yet.</p>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}
