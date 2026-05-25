"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadGoalState,
  type GoalState,
  formatPaceSignal,
  formatRiskSignal,
} from "../data/career-goals";
import { getCareerById } from "../data/careers";

type Props = {
  className?: string;
};

export default function GoalTrackerPanel({ className = "" }: Props) {
  const [goalState, setGoalState] = useState<GoalState | null>(null);

  useEffect(() => {
    setGoalState(loadGoalState());
  }, []);

  if (!goalState?.goal || !goalState?.signals) {
    return null;
  }

  const { goal, signals } = goalState;
  const career = getCareerById(goal.selectedCareerGoal);
  const careerTitle = career?.title ?? goal.selectedCareerGoal;

  // Color & icon for pace
  const paceColors: Record<string, string> = {
    ahead: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    on_track: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    behind: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };
  const paceColor = paceColors[signals.paceSignal] ?? paceColors.on_track;

  // Color for risk
  const riskColors: Record<string, string> = {
    low: "bg-emerald-500/10 text-emerald-400",
    medium: "bg-amber-500/10 text-amber-400",
    high: "bg-rose-500/10 text-rose-400",
  };
  const riskColor = riskColors[signals.riskSignal] ?? riskColors.low;

  const progressBarColor =
    goal.goalProgress >= 66
      ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
      : goal.goalProgress >= 33
        ? "bg-gradient-to-r from-amber-500 to-amber-400"
        : "bg-gradient-to-r from-core-accent to-core-accent/70";

  return (
    <section
      className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Goal tracker
          </p>
          <h3 className="mt-1 text-lg font-display text-core-heading">
            Target: {careerTitle}
          </h3>
        </div>
        <Link
          href={`/careers/${goal.selectedCareerGoal}`}
          className="text-xs text-core-accent hover:underline"
        >
          Open career →
        </Link>
      </div>

      {/* Timeline Progress */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-core-muted">
            Progress toward goal
          </span>
          <span className="text-sm font-semibold text-core-heading">
            {goal.goalProgress}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-core-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressBarColor}`}
            style={{ width: `${goal.goalProgress}%` }}
          />
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid gap-3 sm:grid-cols-2 mb-5">
        {/* Estimated completion */}
        <div className="rounded-lg bg-core-bg/40 border border-core-border/50 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-core-muted mb-1">
            Est. completion
          </p>
          <p className="text-sm font-semibold text-core-heading">
            {signals.estimatedCompletion}
          </p>
        </div>

        {/* Target timeline */}
        <div className="rounded-lg bg-core-bg/40 border border-core-border/50 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-core-muted mb-1">
            Target timeline
          </p>
          <p className="text-sm font-semibold text-core-heading">
            {goal.targetMonths} months
            <span className="text-xs font-normal text-core-muted ml-1">
              · {goal.weeklyTimeCommitment}h/wk
            </span>
          </p>
        </div>
      </div>

      {/* Pace & Risk badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${paceColor}`}
        >
          {formatPaceSignal(signals.paceSignal)}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${riskColor}`}
        >
          {formatRiskSignal(signals.riskSignal)}
        </span>
      </div>

      {/* Next critical step */}
      <div className="rounded-lg bg-core-accent/5 border border-core-accent/20 p-4">
        <p className="text-[10px] uppercase tracking-wider text-core-accent mb-1.5">
          Next critical action
        </p>
        <p className="text-sm text-core-heading leading-relaxed">
          {signals.nextCriticalStep}
        </p>
      </div>
    </section>
  );
}
