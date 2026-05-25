"use client";

import { useEffect, useMemo, useState } from "react";
import type { Career } from "../data/careers";
import type { EnhancedProfile } from "../data/quiz-enhanced";
import type { SkillGapResult } from "../data/skill-gap";
import { buildPathExamples, type PathExamples } from "../data/path-examples";
import { loadCareerWorkspace, type CareerWorkspace } from "../data/career-workspace";

interface Props {
  career?: Career;
  skillGap?: SkillGapResult;
  enhancedProfile?: EnhancedProfile | null;
  className?: string;
}

export default function PathExamplesPanel({
  career,
  skillGap,
  enhancedProfile = null,
  className = "",
}: Props) {
  const [workspace, setWorkspace] = useState<CareerWorkspace | null>(null);

  useEffect(() => {
    setWorkspace(loadCareerWorkspace());
  }, []);

  const examples: PathExamples | null = useMemo(
    () => (career ? buildPathExamples(career, skillGap, enhancedProfile) : null),
    [career, skillGap, enhancedProfile]
  );

  if (!career || !examples) {
    return null;
  }

  const isActiveCareer = workspace?.selectedCareerId === career.id;

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-core-muted mb-1">Path Examples</p>
          <h3 className="text-lg font-semibold text-core-heading">Learning Portfolio Journeys</h3>
        </div>
        <span className="rounded-3xl bg-core-accent/10 px-4 py-3 text-sm font-semibold text-core-accent">
          {career.title}
        </span>
      </div>

      {isActiveCareer && (
        <div className="mb-6 rounded-3xl border border-core-border bg-core-bg/70 p-4 text-sm text-core-muted">
          <p className="font-semibold text-core-heading mb-2">Your active path</p>
          <p>Current phase: {workspace?.activePhaseName}</p>
          <p>Completed milestones: {workspace?.completedMilestones.length}</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3 xl:grid-rows-[auto_auto]">
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Example student path</p>
          <ul className="space-y-2 text-sm text-core-text">
            {examples.beginnerJourney.map((item, index) => (
              <li key={index} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Typical mistakes</p>
          <ul className="space-y-2 text-sm text-core-text">
            {examples.commonMistakes.map((item, index) => (
              <li key={index} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">What people build first</p>
          <ul className="space-y-2 text-sm text-core-text">
            {examples.projectProgression.map((item, index) => (
              <li key={index} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="xl:col-span-2 rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">How paths evolve</p>
          <ul className="space-y-2 text-sm text-core-text">
            {examples.careerEvolution.map((item, index) => (
              <li key={index} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Success patterns</p>
          <ul className="space-y-2 text-sm text-core-text">
            {examples.successPatterns.map((item, index) => (
              <li key={index} className="list-disc pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
