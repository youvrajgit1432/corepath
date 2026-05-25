"use client";

import { useEffect, useMemo, useState } from "react";
import type { Career } from "../data/careers";
import type { EnhancedProfile } from "../data/quiz-enhanced";
import type { SkillGapResult } from "../data/skill-gap";
import { analyzeProfilePortfolio } from "../data/profile-analyzer";
import type { GitHubProjectRecord } from "../data/profile-analyzer";

interface Props {
  career?: Career;
  skillGap?: SkillGapResult;
  enhancedProfile?: EnhancedProfile | null;
  resumeText?: string;
  githubProjects?: GitHubProjectRecord[];
  className?: string;
}

const parseGitHubProjects = (input: string): GitHubProjectRecord[] => {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const url = line.split(" ")[0];
      const pathParts = url.replace(/\?.*$/, "").split("/").filter(Boolean);
      const rawName = pathParts.length >= 2 ? `${pathParts[pathParts.length - 2]}/${pathParts[pathParts.length - 1]}` : line;
      const description = `GitHub repo ${rawName} demonstrating relevant work for ${rawName.split("/").pop()}`;
      const skills = rawName
        .replace(/[-_.]/g, " ")
        .split(" ")
        .filter(Boolean)
        .slice(0, 4);

      return {
        name: rawName,
        url,
        description,
        skills,
      };
    });
};

export default function ProfileAnalyzerPanel({
  career,
  skillGap,
  enhancedProfile = null,
  resumeText,
  githubProjects,
  className = "",
}: Props) {
  const [resumeInput, setResumeInput] = useState(resumeText ?? "");
  const [githubInput, setGithubInput] = useState(
    githubProjects?.map((project) => project.url ?? project.name).join("\n") ?? ""
  );

  useEffect(() => {
    setResumeInput(resumeText ?? "");
  }, [resumeText]);

  useEffect(() => {
    setGithubInput(githubProjects?.map((project) => project.url ?? project.name).join("\n") ?? "");
  }, [githubProjects]);

  const githubProjectRecords = useMemo(() => parseGitHubProjects(githubInput), [githubInput]);

  const analysis = useMemo(
    () =>
      analyzeProfilePortfolio({
        career,
        skillGap,
        enhancedProfile,
        resumeText: resumeInput,
        githubProjects: githubProjectRecords,
      }),
    [career, skillGap, enhancedProfile, resumeInput, githubProjectRecords]
  );

  if (!career) {
    return null;
  }

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-core-muted mb-1">Resume & GitHub Signals</p>
          <h3 className="text-lg font-semibold text-core-heading">Portfolio Alignment</h3>
        </div>
        <div className="rounded-3xl bg-core-accent/10 px-4 py-3 text-sm font-semibold text-core-accent">
          Score: {analysis.portfolioScore}%
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-core-heading mb-2 block">Paste resume / experience notes</label>
            <textarea
              value={resumeInput}
              onChange={(event) => setResumeInput(event.target.value)}
              placeholder="Include bullets, technologies, systems, projects, AI or deployment references."
              className="min-h-[164px] w-full rounded-3xl border border-core-border bg-core-bg/70 p-4 text-sm text-core-text placeholder:text-core-muted focus:border-core-accent focus:outline-none"
            />
            <p className="text-xs text-core-muted mt-2">Use your resume bullets, project summaries, and AI/production keywords.</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-core-heading mb-2 block">GitHub repo URLs</label>
            <textarea
              value={githubInput}
              onChange={(event) => setGithubInput(event.target.value)}
              placeholder="Enter repo links, one per line."
              className="min-h-[164px] w-full rounded-3xl border border-core-border bg-core-bg/70 p-4 text-sm text-core-text placeholder:text-core-muted focus:border-core-accent focus:outline-none"
            />
            <p className="text-xs text-core-muted mt-2">Repository links help detect code, deployment, documentation, and AI evidence.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Portfolio input summary</p>
          <div className="space-y-3 text-sm text-core-text">
            <div>
              <p className="font-medium">Resume length</p>
              <p className="text-core-muted text-xs">{resumeInput.trim().length} characters</p>
            </div>
            <div>
              <p className="font-medium">GitHub repositories</p>
              <p className="text-core-muted text-xs">{githubProjectRecords.length} detected</p>
            </div>
            <div>
              <p className="font-medium">Career target</p>
              <p className="text-core-muted text-xs">{career.title}</p>
            </div>
            <div>
              <p className="font-medium">Core skill</p>
              <p className="text-core-muted text-xs">{career.coreSkill}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-core-muted mb-6">{analysis.portfolioNarrative}</p>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Readiness</p>
          <p className="text-2xl font-semibold text-core-heading">{analysis.readinessScore}%</p>
          <p className="mt-2 text-core-muted text-xs">Includes career and portfolio fit</p>
        </div>
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Resume signals</p>
          <p className="text-2xl font-semibold text-core-heading">{analysis.resumeSignalCount}</p>
          <p className="mt-2 text-core-muted text-xs">Keywords matched from resume text</p>
        </div>
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">GitHub portfolio</p>
          <p className="text-2xl font-semibold text-core-heading">{analysis.githubProjectCount}</p>
          <p className="mt-2 text-core-muted text-xs">Projects mapped to career signals</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {analysis.strengthSignals.length > 0 && (
          <div className="rounded-3xl border border-core-border bg-core-accent/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Strength signals</p>
            <ul className="space-y-2 text-sm text-core-text">
              {analysis.strengthSignals.map((signal, index) => (
                <li key={index} className="list-disc pl-4">
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.missingSignals.length > 0 && (
          <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Missing signals</p>
            <ul className="space-y-2 text-sm text-core-text">
              {analysis.missingSignals.map((signal, index) => (
                <li key={index} className="list-disc pl-4">
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Portfolio actions</p>
          <ul className="space-y-2 text-sm text-core-text">
            {analysis.priorityActions.map((action, index) => (
              <li key={index} className="list-disc pl-4">
                {action}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Confidence adjustment</p>
          <p className="text-sm font-semibold text-core-heading">
            {analysis.careerReadinessAdjustment > 0 ? "+" : ""}
            {analysis.careerReadinessAdjustment}%
          </p>
          <p className="mt-2 text-xs text-core-muted">
            {analysis.careerReadinessAdjustment >= 0
              ? "Portfolio signals are supporting your fit."
              : "More targeted experience will increase confidence."
            }
          </p>
        </div>
      </div>

      {analysis.recommendedProjects?.beginnerProjects.length ? (
        <div className="rounded-3xl border border-core-border bg-core-border/30 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Suggested portfolio projects</p>
          <div className="space-y-3">
            {analysis.recommendedProjects.beginnerProjects.slice(0, 2).map((project, index) => (
              <div key={index} className="rounded-2xl bg-core-surface p-3 border border-core-border/50">
                <p className="font-medium text-core-heading">{project.title}</p>
                <p className="text-xs text-core-muted mt-1">{project.estimatedTime} • {project.aiRelevance} AI relevance</p>
                <p className="text-sm text-core-text mt-2">{project.portfolioValue}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
