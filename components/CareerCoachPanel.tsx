"use client";

import type { Career } from "../data/careers";
import type { EnhancedProfile } from "../data/quiz-enhanced";
import type { SkillGapResult } from "../data/skill-gap";
import type { ProjectRecommendations } from "../data/project-recommendations";
import { buildCareerCoach } from "../data/career-coach";

interface CareerCoachPanelProps {
  career?: Career;
  enhancedProfile?: EnhancedProfile;
  skillGap?: SkillGapResult;
  projectRecommendations?: ProjectRecommendations;
}

export default function CareerCoachPanel({
  career,
  enhancedProfile,
  skillGap,
  projectRecommendations,
}: CareerCoachPanelProps) {
  const coach = buildCareerCoach({
    career,
    enhancedProfile,
    skillGap,
    projectRecommendations,
  });

  const headline = coach.weeklyAdvice[0] ?? "Keep taking small steps toward your career goal.";

  return (
    <section className="rounded-card border border-core-border bg-core-surface p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-core-muted mb-1">AI Career Coach</p>
          <h3 className="text-lg font-semibold text-core-heading">Coach Insight</h3>
        </div>
        <div className="rounded-3xl bg-core-accent/10 px-4 py-3 text-sm font-semibold text-core-accent">
          {headline}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-wider text-core-muted mb-3">Weekly Focus</p>
          <ul className="space-y-2 text-sm text-core-text">
            {coach.weeklyAdvice.map((item, index) => (
              <li key={index} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-wider text-core-muted mb-3">Warning Signals</p>
          <ul className="space-y-2 text-sm text-core-text">
            {coach.focusWarnings.map((item, index) => (
              <li key={index} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-wider text-core-muted mb-3">Suggested Next Step</p>
          <ul className="space-y-2 text-sm text-core-text">
            {coach.prioritySuggestions.map((item, index) => (
              <li key={index} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-wider text-core-muted mb-3">Momentum</p>
          <ul className="space-y-2 text-sm text-core-text">
            {coach.confidenceTrends.map((item, index) => (
              <li key={`confidence-${index}`} className="list-disc pl-4">
                {item}
              </li>
            ))}
            {coach.progressSignals.map((item, index) => (
              <li key={`progress-${index}`} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-core-accent/5 p-4 text-sm text-core-text border border-core-accent/20">
        <p className="font-semibold text-core-heading">Direction Check</p>
        <p className="mt-2">{coach.careerDriftDetection}</p>
      </div>
    </section>
  );
}
