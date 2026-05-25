"use client";

import { useMemo } from "react";
import type { Career } from "../data/careers";
import type { EnhancedProfile } from "../data/quiz-enhanced";
import { analyzeSkillGap, getCareerReadiness, getNextLearningPriority } from "../data/skill-gap";

interface Props {
  career: Career;
  userSkills?: string[];
  profile?: EnhancedProfile | null;
  className?: string;
}

export default function SkillGapPanel({ career, userSkills = [], profile = null, className = "" }: Props) {
  const result = useMemo(
    () => analyzeSkillGap(career, userSkills, profile),
    [career, userSkills, profile]
  );

  const readiness = useMemo(
    () => getCareerReadiness(career, userSkills, profile),
    [career, userSkills, profile]
  );

  const nextPriority = useMemo(
    () => getNextLearningPriority(career, userSkills, profile),
    [career, userSkills, profile]
  );

  // Colour coding
  const readinessColor =
    readiness >= 70
      ? "text-emerald-400"
      : readiness >= 40
      ? "text-yellow-400"
      : "text-orange-400";

  const barColor =
    readiness >= 70
      ? "bg-emerald-500"
      : readiness >= 40
      ? "bg-yellow-500"
      : "bg-orange-500";

  return (
    <div className={`rounded-card border border-core-border bg-core-surface p-5 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono text-core-muted uppercase tracking-widest">
          Skill Gap Analysis
        </p>
        <span className={`text-xs font-mono ${readinessColor}`}>
          {result.gapScore === 0
            ? "No gaps detected"
            : `${Math.round(result.gapScore * 100)}% gap`}
        </span>
      </div>

      {/* Career Readiness Gauge */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-1.5">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Career Readiness
          </p>
          <p className={`text-2xl font-semibold ${readinessColor}`}>
            {readiness}%
          </p>
        </div>
        <div className="h-2 bg-core-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${readiness}%` }}
          />
        </div>
      </div>

      {/* Existing Strengths */}
      {result.existingStrengths.length > 0 && (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">
            Skills Already Strong
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.existingStrengths.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              >
                <span className="text-emerald-400">✓</span>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      {result.missingSkills.length > 0 && (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">
            Skills to Develop
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.missingSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-core-border text-core-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Learning Priority */}
      <div className="rounded-lg border border-core-border/50 bg-core-bg/70 p-3.5 mb-3">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-1.5">
          Next Learning Priority
        </p>
        <p className="text-sm font-medium text-core-heading">{nextPriority}</p>
      </div>

      {/* Confidence Adjustment */}
      <div className="rounded-lg border border-core-border/50 bg-core-bg/70 p-3.5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Confidence Adjustment
          </p>
          <span
            className={`text-sm font-mono font-semibold ${
              result.confidenceAdjustment > 0
                ? "text-emerald-400"
                : result.confidenceAdjustment < 0
                ? "text-orange-400"
                : "text-core-muted"
            }`}
          >
            {result.confidenceAdjustment > 0 ? "+" : ""}
            {Math.round(result.confidenceAdjustment * 100)}%
          </span>
        </div>
        <p className="text-xs text-core-muted mt-1">
          {result.confidenceAdjustment > 0
            ? "Your existing skills strengthen this recommendation"
            : result.confidenceAdjustment < 0
            ? "Building core skills would increase alignment confidence"
            : "Neutral — no significant adjustment needed"}
        </p>
      </div>

      {/* Estimated Timeline */}
      <div className="mt-3.5 text-xs text-core-muted font-mono leading-relaxed">
        <span className="opacity-60">Est. timeline: </span>
        {result.estimatedTimeline}
      </div>
    </div>
  );
}
