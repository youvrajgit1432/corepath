/**
 * ADAPTIVE ROADMAP PANEL
 *
 * Displays personalized roadmap intelligence:
 * - Personalized roadmap changes (reordered phases, skipped phases)
 * - Suggested skips with reasons
 * - Adjusted timeline with visual comparison
 * - Warnings with severity levels (info, warning, critical)
 * - Why the roadmap changed — explainer section
 *
 * Integrates with CareerWorkspacePanel and career detail pages.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import type { Career } from "../data/careers";
import type { RoadmapStep } from "../data/roadmaps";
import type { EnhancedProfile } from "../data/quiz-enhanced";
import {
  computeAdaptiveRoadmap,
  loadAdaptiveRoadmap,
  shouldAdaptRoadmap,
  type AdaptiveRoadmapState,
} from "../data/adaptive-roadmap";

interface Props {
  steps: RoadmapStep[];
  career?: Career | null;
  userSkills?: string[];
  enhancedProfile?: EnhancedProfile | null;
  className?: string;
}

export default function AdaptiveRoadmapPanel({
  steps,
  career,
  userSkills: userSkillsProp,
  enhancedProfile: enhancedProfileProp,
  className = "",
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [adaptive, setAdaptive] = useState<AdaptiveRoadmapState | null>(null);

  // Stabilize default values to prevent infinite re-render loops.
  // Default values in destructuring (= []) create new references on every render,
  // which causes the useEffect below to re-run infinitely via setMounted(true).
  const userSkills = useMemo(() => userSkillsProp ?? [], [userSkillsProp]);
  const enhancedProfile = useMemo(
    () => enhancedProfileProp ?? null,
    [enhancedProfileProp]
  );

  useEffect(() => {
    setMounted(true);

    if (!shouldAdaptRoadmap()) return;

    // Try cache first
    const cached = loadAdaptiveRoadmap();
    if (cached && cached.careerId === career?.id) {
      setAdaptive(cached);
      return;
    }

    setAdaptive(
      computeAdaptiveRoadmap(steps, career, userSkills, enhancedProfile)
    );
  }, [steps, career, userSkills, enhancedProfile]);

  // During SSR and initial client hydration, both render the same skeleton
  // because adaptive is always null. After hydration, the effect runs and
  // computes the real adaptive state from localStorage.
  if (!mounted || !adaptive) {
    return (
      <section
        className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}
      >
        <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-3">
          Adaptive Roadmap
        </p>
        <p className="text-sm text-core-muted">
          Take the quiz and start tracking progress to receive a personalized
          roadmap adapted to your experience and pace.
        </p>
      </section>
    );
  }

  const hasChanges =
    adaptive.skipSuggestions.length > 0 ||
    adaptive.accelerateSignals.length > 0 ||
    adaptive.difficultyAdjustment.multiplier !== 1 ||
    adaptive.personalizedMilestones.length > 0 ||
    adaptive.estimatedTimelineAdjustment.percentChange !== 0;

  const criticalWarning = adaptive.adaptiveWarnings.find(
    (w) => w.type === "critical"
  );
  const warningCount = adaptive.adaptiveWarnings.filter(
    (w) => w.type === "warning" || w.type === "critical"
  ).length;

  return (
    <section
      className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-1">
            Adaptive Roadmap
          </p>
          <h3 className="text-lg font-semibold text-core-heading">
            {hasChanges
              ? "Your roadmap has been personalized"
              : "Roadmap ready"}
          </h3>
        </div>

        {/* Badge: adapted or not */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono font-medium ${
            hasChanges
              ? "bg-core-accent/10 text-core-accent"
              : "bg-core-border/50 text-core-muted"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              hasChanges ? "bg-core-accent" : "bg-core-muted/50"
            }`}
          />
          {hasChanges ? "Personalized" : "Default"}
        </div>
      </div>

      {/* Critical warning banner */}
      {criticalWarning && (
        <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-sm mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">
                Critical
              </p>
              <p className="text-sm text-core-text">
                {criticalWarning.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning count badge */}
      {warningCount > 0 && !criticalWarning && (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-400">
          <span>⚠️</span>
          <span>
            {warningCount} warning{warningCount > 1 ? "s" : ""} — review
            details below
          </span>
        </div>
      )}

      {/* Summary cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Timeline adjustment */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Timeline</p>
          <div className="flex items-baseline gap-1">
            {adaptive.estimatedTimelineAdjustment.percentChange !== 0 && (
              <span
                className={`text-lg font-bold ${
                  adaptive.estimatedTimelineAdjustment.percentChange < 0
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {adaptive.estimatedTimelineAdjustment.percentChange > 0
                  ? "+"
                  : ""}
                {adaptive.estimatedTimelineAdjustment.percentChange}%
              </span>
            )}
            {adaptive.estimatedTimelineAdjustment.percentChange === 0 && (
              <span className="text-lg font-bold text-core-heading">
                —
              </span>
            )}
          </div>
          <p className="text-[10px] text-core-muted mt-0.5">
            {adaptive.estimatedTimelineAdjustment.percentChange < 0
              ? "Faster"
              : adaptive.estimatedTimelineAdjustment.percentChange > 0
                ? "Slower"
                : "Standard"}
          </p>
        </div>

        {/* Skips */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Skipped phases</p>
          <p className="text-lg font-bold text-core-heading">
            {adaptive.skipSuggestions.length}
          </p>
          <p className="text-[10px] text-core-muted mt-0.5">
            {adaptive.skipSuggestions.length === 1
              ? "Phase skipped"
              : adaptive.skipSuggestions.length > 1
                ? "Phases skipped"
                : "None"}
          </p>
        </div>

        {/* Accelerate signals */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Pace signals</p>
          <p className="text-lg font-bold text-core-heading">
            {adaptive.accelerateSignals.length}
          </p>
          <p className="text-[10px] text-core-muted mt-0.5">
            {adaptive.accelerateSignals.length === 1
              ? "Accelerate signal"
              : adaptive.accelerateSignals.length > 1
                ? "Accelerate signals"
                : "Standard pace"}
          </p>
        </div>

        {/* Added milestones */}
        <div className="rounded-lg border border-core-border/50 bg-core-bg/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Extra milestones</p>
          <p className="text-lg font-bold text-core-heading">
            {adaptive.personalizedMilestones.length}
          </p>
          <p className="text-[10px] text-core-muted mt-0.5">
            {adaptive.personalizedMilestones.length === 1
              ? "Added milestone"
              : adaptive.personalizedMilestones.length > 1
                ? "Added milestones"
                : "None needed"}
          </p>
        </div>
      </div>

      {/* Warnings list */}
      {adaptive.adaptiveWarnings.length > 0 && (
        <div className="mb-5 space-y-2">
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest">
            Signals &amp; Warnings
          </p>
          <div className="space-y-2">
            {adaptive.adaptiveWarnings.map((warning, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  warning.type === "critical"
                    ? "bg-red-500/5 border border-red-500/20"
                    : warning.type === "warning"
                      ? "bg-amber-500/5 border border-amber-500/20"
                      : "bg-core-bg/50 border border-core-border/30"
                }`}
              >
                <span className="text-xs mt-0.5">
                  {warning.type === "critical"
                    ? "🔴"
                    : warning.type === "warning"
                      ? "🟡"
                      : "💡"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-core-text">{warning.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skip suggestions */}
      {adaptive.skipSuggestions.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-3">
            Suggested Skips
          </p>
          <div className="space-y-2">
            {adaptive.skipSuggestions.map((skip) => (
              <div
                key={skip.phase}
                className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
              >
                <span className="text-emerald-400 text-sm mt-0.5 flex-shrink-0">
                  ⏭️
                </span>
                <div>
                  <p className="text-sm font-medium text-core-heading">
                    Skip: {skip.title} (Phase {skip.phase})
                  </p>
                  <p className="text-xs text-core-muted mt-1">{skip.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized milestones */}
      {adaptive.personalizedMilestones.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-3">
            Personalized Milestones
          </p>
          <div className="space-y-2">
            {adaptive.personalizedMilestones.map((milestone, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-core-accent/20 bg-core-accent/5"
              >
                <span className="text-core-accent text-sm mt-0.5 flex-shrink-0">
                  🎯
                </span>
                <div>
                  <p className="text-sm font-medium text-core-heading">
                    {milestone.title}
                  </p>
                  <p className="text-xs text-core-muted mt-1">
                    {milestone.description}
                  </p>
                  <span className="inline-flex mt-2 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-core-accent/10 text-core-accent">
                    {milestone.type} — Phase {milestone.phase}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accelerate signals */}
      {adaptive.accelerateSignals.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-3">
            Acceleration Signals
          </p>
          <div className="space-y-2">
            {adaptive.accelerateSignals.map((signal, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
              >
                <span className="text-emerald-400 text-sm mt-0.5 flex-shrink-0">
                  🚀
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-core-text">{signal.reason}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-core-border overflow-hidden max-w-[120px]">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${signal.impact * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-core-muted mt-0.5">
                    Impact: {Math.round(signal.impact * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline adjustment detail */}
      {adaptive.estimatedTimelineAdjustment.percentChange !== 0 && (
        <div className="mb-5 p-4 rounded-lg border border-core-border/50 bg-core-bg/40">
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-2">
            Timeline Adjustment
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-core-muted line-through">
              {adaptive.estimatedTimelineAdjustment.originalEstimate}
            </span>
            <span className="text-core-muted">→</span>
            <span
              className={`font-semibold ${
                adaptive.estimatedTimelineAdjustment.percentChange < 0
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {adaptive.estimatedTimelineAdjustment.adjustedEstimate}
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {adaptive.estimatedTimelineAdjustment.reasons.map(
              (reason, i) => (
                <li
                  key={i}
                  className="text-xs text-core-muted flex items-start gap-2"
                >
                  <span className="text-core-muted/50">•</span>
                  {reason}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Why roadmap changed — expandable */}
      {hasChanges && (
        <div className="border-t border-core-border/30 pt-4 mt-2">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs font-mono text-core-muted hover:text-core-accent transition-colors"
          >
            <span
              className={`transition-transform duration-200 ${
                showDetails ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
            {showDetails
              ? "Hide explanation"
              : "Why did my roadmap change?"}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2 text-xs text-core-muted leading-relaxed p-3 rounded-lg bg-core-bg/50 border border-core-border/30">
              <p>
                <strong>Your roadmap was personalized based on:</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {adaptive.skipSuggestions.length > 0 && (
                  <li>
                    Portfolio evidence suggests you can skip{" "}
                    {adaptive.skipSuggestions.length} beginner phase(s).
                  </li>
                )}
                {adaptive.accelerateSignals.length > 0 && (
                  <li>
                    Your progress and engagement signals suggest you can
                    accelerate through content.
                  </li>
                )}
                {adaptive.difficultyAdjustment.multiplier > 1 && (
                  <li>
                    Skill gap analysis recommends extra time for
                    foundational skills (
                    {Math.round(
                      (adaptive.difficultyAdjustment.multiplier - 1) * 100
                    )}
                    % more time).
                  </li>
                )}
                {adaptive.personalizedMilestones.length > 0 && (
                  <li>
                    Extra milestones were added to reinforce confidence and
                    bridge skill gaps.
                  </li>
                )}
                {adaptive.estimatedTimelineAdjustment.percentChange < 0 &&
                  adaptive.accelerateSignals.length > 0 && (
                    <li>
                      Strong signals from milestones, momentum, or
                      confidence shortened the estimated timeline.
                    </li>
                  )}
                {!adaptive.skipSuggestions.length &&
                  !adaptive.accelerateSignals.length &&
                  adaptive.difficultyAdjustment.multiplier <= 1 &&
                  !adaptive.personalizedMilestones.length && (
                    <li>
                      Your profile is well-aligned. No major adjustments
                      were needed.
                    </li>
                  )}
              </ul>
              <p className="mt-2 text-core-muted/60">
                Last updated:{" "}
                {new Date(adaptive.computedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
