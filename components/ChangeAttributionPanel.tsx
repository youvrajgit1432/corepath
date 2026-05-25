"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getChangeAttribution,
  type ChangeAttributionData,
  type MajorChange,
  type AttributedCause,
} from "../data/change-attribution";

type Props = {
  className?: string;
};

type SortOption = "magnitude" | "domain" | "date";

export default function ChangeAttributionPanel({ className = "" }: Props) {
  const [data, setData] = useState<ChangeAttributionData | null>(null);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [showingAllCauses, setShowingAllCauses] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("magnitude");

  const refresh = useCallback(() => {
    const fresh = getChangeAttribution();
    setData(fresh);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!data) return null;

  const { majorChanges, possibleCauses, positiveDrivers, negativeDrivers, confidenceImpact, behaviorImpact, attributionNarrative } = data;

  // ── Sort changes ──
  const sortedChanges = [...majorChanges].sort((a, b) => {
    switch (sortBy) {
      case "domain":
        return a.domain.localeCompare(b.domain);
      case "date":
        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      case "magnitude":
      default:
        return b.magnitude - a.magnitude;
    }
  });

  // ── Helpers ──
  const directionIcon = (d: MajorChange["direction"]) =>
    d === "increase" ? "▲" : d === "decrease" ? "▼" : "◆";
  const directionColor = (d: MajorChange["direction"]) =>
    d === "increase"
      ? "text-emerald-400"
      : d === "decrease"
        ? "text-amber-400"
        : "text-core-muted";

  const domainIcon: Record<string, string> = {
    confidence: "🎯",
    exploration: "🧭",
    streak: "🔥",
    achievement: "🏆",
    comparison: "⚖️",
    specialization: "🎓",
  };

  const impactBadge = (influence: "positive" | "negative") =>
    influence === "positive"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20";

  const toggleChange = (id: string) => {
    setExpandedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCauseClick = (cause: AttributedCause) => {
    // Dispatch a custom event to allow parent components to scroll to related content
    window.dispatchEvent(
      new CustomEvent("corepath:scroll-to-attribution", {
        detail: { source: cause.source, cause: cause.cause },
      })
    );
  };

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* ── HEADER ── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Change attribution
          </p>
          <h3 className="mt-1 text-lg font-semibold text-core-heading">
            What&apos;s driving your progress
          </h3>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Refresh
        </button>
      </div>

      {/* ── NARRATIVE ── */}
      <div className="mb-5 rounded-xl border border-core-border bg-core-bg/60 p-4">
        <p className="text-sm leading-relaxed text-core-text">
          {attributionNarrative}
        </p>
      </div>

      {/* ── DRIVER BALANCE ── */}
      <div className="mb-5 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2">
          <span className="text-lg">👍</span>
          <span className="text-sm font-medium text-emerald-400">
            +{positiveDrivers.positiveCount}
          </span>
          <span className="text-xs text-core-muted">positive drivers</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-red-500/5 px-3 py-2">
          <span className="text-lg">👎</span>
          <span className="text-sm font-medium text-red-400">
            -{negativeDrivers.negativeCount}
          </span>
          <span className="text-xs text-core-muted">negative drivers</span>
        </div>
        {confidenceImpact.trendingUp ? (
          <div className="flex items-center gap-2 rounded-lg bg-indigo-500/5 px-3 py-2">
            <span className="text-lg">📈</span>
            <span className="text-xs text-core-muted">Confidence trending up</span>
          </div>
        ) : confidenceImpact.segments.length > 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2">
            <span className="text-lg">📉</span>
            <span className="text-xs text-core-muted">Confidence moderating</span>
          </div>
        ) : null}
      </div>

      {/* ── MAJOR CHANGES ── */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-core-muted">
            Major changes ({sortedChanges.length})
          </p>
          <div className="flex items-center gap-2">
            {(["magnitude", "domain", "date"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition ${
                  sortBy === s
                    ? "bg-core-accent/15 text-core-accent"
                    : "text-core-muted hover:text-core-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {sortedChanges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-core-border bg-core-bg/40 p-6 text-center">
            <p className="text-sm text-core-muted">
              Not enough data to detect major changes yet. Complete a few quizzes and career comparisons to build your change profile.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedChanges.map((change, i) => {
              const isExpanded = expandedChanges.has(change.id);
              const relatedCauses = possibleCauses.filter((c) => c.relatedChangeId === change.id);
              const positiveCauses = relatedCauses.filter((c) => c.influence === "positive");
              const negativeCauses = relatedCauses.filter((c) => c.influence === "negative");

              return (
                <div
                  key={change.id}
                  className={`rounded-xl border transition-all ${
                    change.direction === "increase"
                      ? "border-emerald-500/15 bg-emerald-500/[0.02]"
                      : "border-amber-500/15 bg-amber-500/[0.02]"
                  }`}
                >
                  {/* ── Change header (always visible) ── */}
                  <button
                    type="button"
                    onClick={() => toggleChange(change.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="text-lg">{domainIcon[change.domain] ?? "📌"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold text-core-heading`}>
                          {change.label}
                        </span>
                        <span className={`text-xs font-medium ${directionColor(change.direction)}`}>
                          {directionIcon(change.direction)} {change.direction === "increase" ? "Up" : change.direction === "decrease" ? "Down" : "Stable"}
                        </span>
                      </div>
                      <p className="text-xs text-core-muted line-clamp-1">
                        {change.domain.replace(/^\w/, (c) => c.toUpperCase())} · {change.detail.slice(0, 80)}…
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {/* Magnitude bar */}
                      <div className="hidden sm:flex h-6 w-16 items-center overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            change.direction === "increase"
                              ? "bg-emerald-500/50"
                              : "bg-amber-500/50"
                          }`}
                          style={{ width: `${change.magnitude}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-core-muted tabular-nums w-8 text-right">
                        {change.magnitude}%
                      </span>
                      <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* ── Expanded details ── */}
                  {isExpanded && (
                    <div className="border-t border-core-border/50 px-4 py-3 space-y-3">
                      <p className="text-sm leading-relaxed text-core-text">{change.detail}</p>

                      {/* Causes grouped by influence */}
                      {positiveCauses.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <span>👍</span> Positive causes
                          </p>
                          <div className="space-y-1.5">
                            {positiveCauses.map((cause, ci) => (
                              <button
                                key={ci}
                                type="button"
                                onClick={() => handleCauseClick(cause)}
                                className="flex w-full items-start gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] px-3 py-2 text-left text-xs transition hover:bg-emerald-500/[0.08]"
                              >
                                <span className="mt-0.5 shrink-0 text-emerald-400">+</span>
                                <div className="min-w-0">
                                  <span className="font-medium text-core-text">{cause.cause}</span>
                                  <span className="ml-1 text-core-muted">— {cause.detail}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {negativeCauses.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-semibold text-red-400 flex items-center gap-1.5">
                            <span>👎</span> Negative causes
                          </p>
                          <div className="space-y-1.5">
                            {negativeCauses.map((cause, ci) => (
                              <button
                                key={ci}
                                type="button"
                                onClick={() => handleCauseClick(cause)}
                                className="flex w-full items-start gap-2 rounded-lg border border-red-500/10 bg-red-500/[0.03] px-3 py-2 text-left text-xs transition hover:bg-red-500/[0.08]"
                              >
                                <span className="mt-0.5 shrink-0 text-red-400">−</span>
                                <div className="min-w-0">
                                  <span className="font-medium text-core-text">{cause.cause}</span>
                                  <span className="ml-1 text-core-muted">— {cause.detail}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DRIVER LISTS ── */}
      {(positiveDrivers.positive.length > 0 || negativeDrivers.negative.length > 0) && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {/* Positive drivers */}
          {positiveDrivers.positive.length > 0 && (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.02] p-3">
              <p className="mb-2 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span>👍</span> Positive drivers
              </p>
              <ul className="space-y-1">
                {positiveDrivers.positive.slice(0, showingAllCauses ? undefined : 4).map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-core-text">
                    <span className="mt-1 shrink-0 h-1 w-1 rounded-full bg-emerald-400" />
                    {d}
                  </li>
                ))}
              </ul>
              {positiveDrivers.positive.length > 4 && !showingAllCauses && (
                <button
                  type="button"
                  onClick={() => setShowingAllCauses(true)}
                  className="mt-2 text-[10px] font-medium text-core-accent hover:underline"
                >
                  +{positiveDrivers.positive.length - 4} more
                </button>
              )}
            </div>
          )}

          {/* Negative drivers */}
          {negativeDrivers.negative.length > 0 && (
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.02] p-3">
              <p className="mb-2 text-xs font-semibold text-red-400 flex items-center gap-1.5">
                <span>👎</span> Negative drivers
              </p>
              <ul className="space-y-1">
                {negativeDrivers.negative.slice(0, showingAllCauses ? undefined : 4).map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-core-text">
                    <span className="mt-1 shrink-0 h-1 w-1 rounded-full bg-red-400" />
                    {d}
                  </li>
                ))}
              </ul>
              {negativeDrivers.negative.length > 4 && !showingAllCauses && (
                <button
                  type="button"
                  onClick={() => setShowingAllCauses(true)}
                  className="mt-2 text-[10px] font-medium text-core-accent hover:underline"
                >
                  +{negativeDrivers.negative.length - 4} more
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CONFIDENCE IMPACT ── */}
      {confidenceImpact.segments.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-core-muted">
            Confidence impact
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {confidenceImpact.segments.map((seg, i) => (
              <div
                key={i}
                className="rounded-xl border border-core-border bg-core-bg/40 p-3"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted">
                  {seg.label}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={`text-lg font-bold ${
                      seg.direction === "increase"
                        ? "text-emerald-400"
                        : seg.direction === "decrease"
                          ? "text-amber-400"
                          : "text-core-muted"
                    }`}
                  >
                    {seg.change > 0 ? "+" : ""}{seg.change}
                  </span>
                  <span className="text-xs text-core-muted">points</span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      seg.direction === "increase"
                        ? "bg-emerald-500"
                        : seg.direction === "decrease"
                          ? "bg-amber-500"
                          : "bg-core-muted/30"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(seg.change) * 5)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BEHAVIOR IMPACT ── */}
      <div className="mb-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-core-muted">
          Behavior shifts
        </p>
        <div className="space-y-2">
          {[behaviorImpact.specializationShift, behaviorImpact.explorationShift, behaviorImpact.consistencyShift].map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg border border-core-border/60 bg-core-bg/30 px-3 py-2">
              <span className="mt-0.5 text-xs">
                {i === 0 ? "🎯" : i === 1 ? "🧭" : "🔥"}
              </span>
              <p className="text-xs leading-relaxed text-core-text">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
