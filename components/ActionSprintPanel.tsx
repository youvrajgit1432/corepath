/**
 * ACTION SPRINT PANEL
 *
 * Displays the user's daily action sprint — a set of personalized,
 * context-adapted actions derived from all available intelligence engines.
 *
 * Features:
 *   - Today's actions with checkable items and estimated time
 *   - This week's mission with progress indicator
 *   - Micro goals (3 small wins)
 *   - Blocking signals & momentum boosters
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  loadActionSprint,
  computeActionSprint,
  toggleActionCompletion,
} from "../data/action-sprints";

interface Props {
  className?: string;
}

export default function ActionSprintPanel({ className = "" }: Props) {
  const [sprint, setSprint] = useState<ReturnType<typeof loadActionSprint> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    const data = loadActionSprint();
    setSprint(data);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleToggle = (actionId: string) => {
    const updated = toggleActionCompletion(actionId);
    setSprint(updated);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    const fresh = computeActionSprint();
    setSprint(fresh);
    setTimeout(() => setRefreshing(false), 400);
  };

  if (!sprint) return null;

  const completedCount = sprint.todayActions.filter((a) =>
    sprint.completedActionIds.includes(a.id)
  ).length;
  const totalCount = sprint.todayActions.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ── Priority color ──
  const priorityColor =
    sprint.priorityScore >= 70
      ? "text-red-400"
      : sprint.priorityScore >= 45
        ? "text-amber-400"
        : "text-emerald-400";

  // ── Category badge helpers ──
  const categoryLabel: Record<string, string> = {
    quick_win: "Quick win",
    consistency: "Consistency",
    stretch: "Stretch",
    reinforcement: "Reinforcement",
    exploration: "Exploration",
  };
  const categoryColor: Record<string, string> = {
    quick_win: "bg-emerald-500/10 text-emerald-400",
    consistency: "bg-blue-500/10 text-blue-400",
    stretch: "bg-purple-500/10 text-purple-400",
    reinforcement: "bg-amber-500/10 text-amber-400",
    exploration: "bg-core-accent/10 text-core-accent",
  };

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* ─── Header ─── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted font-semibold">
            Action sprint
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-core-heading">
            Today&apos;s plan
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Priority badge */}
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${priorityColor}`}>
            {sprint.priorityScore >= 70
              ? "🔴 High priority"
              : sprint.priorityScore >= 45
                ? "🟡 Medium priority"
                : "🟢 Good momentum"}
          </span>
          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full border border-core-border px-2.5 py-1 text-[10px] font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent disabled:opacity-50"
          >
            {refreshing ? "…" : "↻"}
          </button>
        </div>
      </div>

      {/* ─── Today's Actions ─── */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-core-muted">
            {completedCount}/{totalCount} done · ~{sprint.estimatedMinutes} min
          </p>
          <span className="text-[10px] text-core-muted/70">
            {progressPct}%
          </span>
        </div>
        <div className="mb-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPct === 100
                ? "bg-emerald-500"
                : progressPct >= 50
                  ? "bg-core-accent"
                  : "bg-core-accent/60"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="space-y-2">
          {sprint.todayActions.map((action) => {
            const isDone = sprint.completedActionIds.includes(action.id);
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleToggle(action.id)}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  isDone
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-core-border bg-core-bg/40 hover:border-core-accent/40 hover:bg-core-accent/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Check indicator */}
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-core-border bg-transparent"
                    }`}
                  >
                    {isDone && <span className="text-[10px]">✓</span>}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium ${
                          isDone ? "text-core-muted line-through" : "text-core-heading"
                        }`}
                      >
                        {action.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                          categoryColor[action.category] ?? "bg-core-border/50 text-core-muted"
                        }`}
                      >
                        {categoryLabel[action.category] ?? action.category}
                      </span>
                    </div>
                    {!isDone && (
                      <p className="mt-0.5 text-xs text-core-muted/80 leading-relaxed">
                        {action.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-core-muted/60">
                      <span>⏱ {action.estimatedMinutes} min</span>
                      <span>·</span>
                      <span className="italic">{action.rationale}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── This Week's Mission ─── */}
      <div className="mb-5 rounded-xl border border-core-accent/15 bg-core-accent/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent font-semibold">
              This week&apos;s mission
            </p>
            <p className="mt-1 text-sm font-semibold text-core-heading">
              {sprint.thisWeekMission.title}
            </p>
            <p className="mt-1 text-xs text-core-muted/80 leading-relaxed">
              {sprint.thisWeekMission.description}
            </p>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-core-muted/60">
              <span>⏱ ~{sprint.thisWeekMission.estimatedMinutesTotal} min total</span>
              <span className="italic">{sprint.thisWeekMission.rationale}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Micro Goals ─── */}
      {sprint.microGoals.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-core-muted">Micro goals</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {sprint.microGoals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-core-border bg-core-bg/40 p-3"
              >
                <p className="text-xs font-semibold text-core-heading">{goal.title}</p>
                <p className="mt-0.5 text-[10px] text-core-muted/70 leading-relaxed">
                  {goal.description}
                </p>
                <span className="mt-1.5 inline-block text-[9px] text-core-muted/50">
                  ⏱ {goal.effortMinutes} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Blocking Signals ─── */}
      {sprint.blockingSignals.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            ⚠️ Watch for
          </p>
          <ul className="space-y-1">
            {sprint.blockingSignals.map((signal, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-core-muted/80">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Momentum Boosters ─── */}
      {sprint.momentumBoosters.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            🚀 Momentum boosters
          </p>
          <ul className="space-y-1">
            {sprint.momentumBoosters.map((booster, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-core-muted/80">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60" />
                <span>{booster}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
