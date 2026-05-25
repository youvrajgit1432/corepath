/**
 * CAREER PROGRESS PANEL
 *
 * Displays computed career progress intelligence:
 * - Overall progress %
 * - Learning momentum (streak + weekly activity)
 * - Readiness trend (increasing / stable / declining)
 * - Milestones & projects completed
 * - Quiz consistency score
 * - Exploration focus
 */

"use client";

import { useEffect, useState } from "react";
import {
  computeCareerProgress,
  loadCareerProgress,
  type CareerProgressData,
} from "../data/career-progress";
import { loadCareerWorkspace } from "../data/career-workspace";

interface Props {
  className?: string;
}

export default function CareerProgressPanel({ className = "" }: Props) {
  const [progress, setProgress] = useState<CareerProgressData | null>(null);

  useEffect(() => {
    // Try cache first, recompute if stale (1 hour)
    const cached = loadCareerProgress();
    if (cached) {
      setProgress(cached);
      return;
    }

    const fresh = computeCareerProgress();
    setProgress(fresh);
  }, []);

  // If no workspace exists and no quiz data, still show — will be 0 / stable
  const data = progress ?? {
    careerReadinessTrend: "stable" as const,
    milestonesCompleted: 0,
    projectsCompleted: 0,
    learningMomentum: 0,
    quizConsistency: 0,
    explorationFocus: 0,
    overallProgressScore: 0,
    computedAt: new Date().toISOString(),
  };

  const momentumLabel =
    data.learningMomentum >= 70
      ? "High"
      : data.learningMomentum >= 40
        ? "Medium"
        : "Low";

  const momentumColor =
    data.learningMomentum >= 70
      ? "text-green-400"
      : data.learningMomentum >= 40
        ? "text-amber-400"
        : "text-core-muted";

  const trendIcon =
    data.careerReadinessTrend === "increasing"
      ? "📈"
      : data.careerReadinessTrend === "declining"
        ? "📉"
        : "➡️";

  const trendColor =
    data.careerReadinessTrend === "increasing"
      ? "text-green-400"
      : data.careerReadinessTrend === "declining"
        ? "text-red-400"
        : "text-amber-400";

  const progressColor =
    data.overallProgressScore >= 60
      ? "from-green-500 to-emerald-400"
      : data.overallProgressScore >= 30
        ? "from-amber-500 to-yellow-400"
        : "from-core-accent to-indigo-400";

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Career Progress</p>
        <h3 className="mt-1.5 text-xl font-display text-core-heading">How you&rsquo;re tracking</h3>
      </div>

      {/* Overall Progress % */}
      <div className="mb-6 text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-core-border"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - data.overallProgressScore / 100)}`}
              className={`drop-shadow-glow transition-all duration-700`}
              style={{ stroke: `url(#progress-grad)` }}
            />
            <defs>
              <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={data.overallProgressScore >= 60 ? "#22c55e" : data.overallProgressScore >= 30 ? "#f59e0b" : "#6366f1"} />
                <stop offset="100%" stopColor={data.overallProgressScore >= 60 ? "#34d399" : data.overallProgressScore >= 30 ? "#fbbf24" : "#818cf8"} />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute text-3xl font-bold text-core-heading">
            {data.overallProgressScore}%
          </span>
        </div>
        <p className="mt-2 text-xs text-core-muted">Overall progress</p>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Momentum */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-core-muted">Momentum</p>
            <span className={`text-xs font-semibold ${momentumColor}`}>{momentumLabel}</span>
          </div>
          <div className="h-1.5 rounded-full bg-core-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.learningMomentum >= 70
                  ? "bg-green-400"
                  : data.learningMomentum >= 40
                    ? "bg-amber-400"
                    : "bg-core-muted"
              }`}
              style={{ width: `${data.learningMomentum}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-core-muted">{data.learningMomentum}/100</p>
        </div>

        {/* Readiness Trend */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Readiness trend</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">{trendIcon}</span>
            <span className={`text-sm font-semibold capitalize ${trendColor}`}>
              {data.careerReadinessTrend}
            </span>
          </div>
        </div>

        {/* Milestones */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Milestones completed</p>
          <p className="text-2xl font-bold text-core-heading">{data.milestonesCompleted}</p>
        </div>

        {/* Projects */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Projects completed</p>
          <p className="text-2xl font-bold text-core-heading">{data.projectsCompleted}</p>
        </div>

        {/* Quiz Consistency */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Quiz consistency</p>
          <p className="text-2xl font-bold text-core-heading">{data.quizConsistency}</p>
          <div className="mt-1.5 h-1 rounded-full bg-core-border overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all duration-500"
              style={{ width: `${data.quizConsistency}%` }}
            />
          </div>
        </div>

        {/* Exploration Focus */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Exploration focus</p>
          <p className="text-2xl font-bold text-core-heading">{data.explorationFocus}</p>
          <div className="mt-1.5 h-1 rounded-full bg-core-border overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-400 transition-all duration-500"
              style={{ width: `${data.explorationFocus}%` }}
            />
          </div>
        </div>
      </div>

      {/* Insight Summary */}
      <div className="mt-4 rounded-lg bg-core-bg/50 border border-core-border/40 p-3.5">
        <p className="text-xs text-core-muted leading-relaxed">
          {data.overallProgressScore === 0
            ? "Take the quiz and select a career workspace to start tracking your progress."
            : data.overallProgressScore >= 60
              ? "Strong progress. Keep building momentum through consistent milestones and study sessions."
              : data.overallProgressScore >= 30
                ? "Making good headway. Regular milestones and quiz retakes will accelerate your readiness."
                : "Getting started. Complete a few milestones and take the quiz to build your progress baseline."}
        </p>
      </div>
    </section>
  );
}
