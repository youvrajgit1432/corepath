"use client";

import { useState, useEffect, useCallback } from "react";
import { computeRecommendationEvolution, loadRecommendationEvolution, type RecommendationEvolutionData } from "../data/recommendation-evolution";

type Props = {
  className?: string;
};

function shiftColor(direction: string): string {
  switch (direction) {
    case "up":
      return "text-emerald-400";
    case "down":
      return "text-red-400";
    case "new":
      return "text-blue-400";
    case "gone":
      return "text-core-muted";
    default:
      return "text-core-muted";
  }
}

function shiftBadge(direction: string): string {
  switch (direction) {
    case "up":
      return "bg-emerald-500/15 text-emerald-400";
    case "down":
      return "bg-red-500/15 text-red-400";
    case "new":
      return "bg-blue-500/15 text-blue-400";
    case "gone":
      return "bg-white/5 text-core-muted";
    default:
      return "bg-white/5 text-core-muted";
  }
}

function confidenceColor(direction: string): string {
  return direction === "increased" ? "text-emerald-400" : "text-red-400";
}

function impactBadge(impact: "high" | "medium" | "low"): { color: string; label: string } {
  switch (impact) {
    case "high":
      return { color: "bg-rose-500/15 text-rose-400", label: "High" };
    case "medium":
      return { color: "bg-amber-500/15 text-amber-400", label: "Medium" };
    case "low":
      return { color: "bg-sky-500/15 text-sky-400", label: "Low" };
  }
}

export default function RecommendationEvolutionPanel({ className = "" }: Props) {
  const [data, setData] = useState<RecommendationEvolutionData | null>(null);
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(() => {
    // First load existing data, then compute fresh snapshot
    const existing = loadRecommendationEvolution();
    if (existing && existing.totalSnapshots > 0) {
      setData(existing);
    }
    const fresh = computeRecommendationEvolution();
    setData(fresh);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) return null;

  const hasShifts = data.rankingShifts.length > 0;
  const hasChanges = data.confidenceChanges.length > 0;
  const hasSignals = data.whyChangedSignals.length > 0;
  const hasIdentity = data.identityInfluences.length > 0;
  const hasBehavior = data.behaviorInfluences.length > 0;

  const visibleShifts = showAllShifts ? data.rankingShifts : data.rankingShifts.slice(0, 5);

  const topNew = data.rankingShifts.filter((s) => s.direction === "new").length;
  const topUp = data.rankingShifts.filter((s) => s.direction === "up").length;
  const topDown = data.rankingShifts.filter((s) => s.direction === "down").length;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Recommendation evolution</p>
          <h3 className="mt-1 text-lg font-semibold text-core-heading">
            How your matches are changing
          </h3>
        </div>
        {data.totalSnapshots > 0 && (
          <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-core-muted">
            {data.totalSnapshots} snapshot{data.totalSnapshots !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Empty state */}
      {!hasShifts && data.totalSnapshots <= 1 && (
        <div className="rounded-2xl border border-dashed border-core-border bg-core-bg/40 p-6 text-center">
          <p className="text-sm text-core-muted">
            {data.totalSnapshots === 0
              ? "No recommendation snapshots yet. Complete the quiz to generate career matches, and changes will be tracked here."
              : "First snapshot recorded. Changes will appear as you retake the quiz or your behavior evolves."}
          </p>
        </div>
      )}

      {/* Timeline narrative */}
      {data.timelineNarrative.keyEvents.length > 0 && (
        <div className="mb-4 rounded-2xl bg-core-accent/5 border border-core-accent/15 p-4">
          <p className="text-xs font-medium text-core-accent mb-2">📋 Timeline summary</p>
          <p className="text-sm text-core-text leading-relaxed">{data.timelineNarrative.summary}</p>
        </div>
      )}

      {/* Shift counts */}
      {hasShifts && (
        <div className="mb-4 flex flex-wrap gap-2">
          {topUp > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
              ↑ {topUp} moved up
            </span>
          )}
          {topDown > 0 && (
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
              ↓ {topDown} moved down
            </span>
          )}
          {topNew > 0 && (
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">
              ✦ {topNew} new
            </span>
          )}
        </div>
      )}

      {/* Ranking shifts */}
      {hasShifts && visibleShifts.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-core-heading uppercase tracking-[0.12em]">Ranking shifts</p>
          <div className="space-y-1.5">
            {visibleShifts.map((shift) => (
              <div
                key={`${shift.careerId}-${shift.direction}-${shift.currentRank}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-core-bg/50 px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-core-heading truncate">{shift.careerTitle}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${shiftBadge(shift.direction)}`}>
                      {shift.direction === "up" && `#${shift.currentRank} ↑`}
                      {shift.direction === "down" && `#${shift.currentRank} ↓`}
                      {shift.direction === "new" && "New ✦"}
                      {shift.direction === "gone" && "Dropped"}
                      {shift.direction === "unchanged" && `#${shift.currentRank} —`}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-core-muted">{shift.reason}</p>
                </div>
                {shift.previousScore !== null && (
                  <span className={`shrink-0 text-xs font-medium tabular-nums ${shiftColor(shift.direction)}`}>
                    {shift.scoreDelta > 0 ? "+" : ""}{shift.scoreDelta}
                  </span>
                )}
              </div>
            ))}
          </div>
          {data.rankingShifts.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllShifts(!showAllShifts)}
              className="mt-2 text-xs font-medium text-core-accent transition hover:text-indigo-400"
            >
              {showAllShifts ? "Show fewer" : `Show all ${data.rankingShifts.length} shifts`}
            </button>
          )}
        </div>
      )}

      {/* Confidence changes */}
      {hasChanges && data.confidenceChanges.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-core-heading uppercase tracking-[0.12em]">Confidence changes</p>
          <div className="space-y-1.5">
            {data.confidenceChanges.map((cc) => (
              <div
                key={`conf-${cc.careerId}`}
                className="flex items-center justify-between rounded-xl bg-core-bg/50 px-3.5 py-2"
              >
                <span className="text-sm text-core-text truncate">{cc.careerTitle}</span>
                <span className={`shrink-0 text-xs font-medium tabular-nums ${confidenceColor(cc.direction)}`}>
                  {cc.direction === "increased" ? "↑" : "↓"} {cc.previousScore} → {cc.currentScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why changed signals */}
      {hasSignals && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-core-heading uppercase tracking-[0.12em]">Why rankings changed</p>
          <div className="space-y-1.5">
            {data.whyChangedSignals.map((signal, i) => {
              const badge = impactBadge(signal.impact);
              return (
                <div
                  key={`signal-${i}`}
                  className="rounded-xl bg-core-bg/50 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs font-medium text-core-heading capitalize">
                      {signal.dimension.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-core-muted leading-relaxed">{signal.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details toggle */}
      {(hasIdentity || hasBehavior) && (
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="mb-3 w-full rounded-xl bg-core-bg/40 px-4 py-2 text-xs font-medium text-core-accent transition hover:bg-core-bg/60"
        >
          {showDetails ? "Hide influences" : "Show identity & behavior influences"}
        </button>
      )}

      {showDetails && (
        <div className="space-y-4">
          {/* Identity influences */}
          {hasIdentity && (
            <div>
              <p className="mb-2 text-xs font-semibold text-core-heading uppercase tracking-[0.12em]">Identity influences</p>
              <div className="space-y-1.5">
                {data.identityInfluences.map((inf, i) => (
                  <div
                    key={`identity-${i}`}
                    className="rounded-xl bg-core-bg/50 px-3.5 py-2.5"
                  >
                    <p className="text-xs font-medium text-core-heading">{inf.trait}</p>
                    <p className="mt-0.5 text-[11px] text-core-muted">{inf.impact}</p>
                    {inf.careersInfluenced.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-core-accent">
                        Influenced: {inf.careersInfluenced.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavior influences */}
          {hasBehavior && (
            <div>
              <p className="mb-2 text-xs font-semibold text-core-heading uppercase tracking-[0.12em]">Behavior influences</p>
              <div className="space-y-1.5">
                {data.behaviorInfluences.map((b, i) => (
                  <div
                    key={`behavior-${i}`}
                    className="rounded-xl bg-core-bg/50 px-3.5 py-2.5"
                  >
                    <p className="text-xs font-medium text-core-heading capitalize">
                      {b.pattern.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-core-muted">{b.description}</p>
                    <p className="mt-0.5 text-[11px] text-core-text/70 italic">{b.effect}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last updated */}
      <p className="mt-4 text-[10px] text-core-muted/50 tabular-nums">
        Updated {new Date(data.computedAt).toLocaleTimeString()}
      </p>
    </section>
  );
}
