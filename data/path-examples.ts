import type { Career } from "./careers";
import type { EnhancedProfile } from "./quiz-enhanced";
import type { SkillGapResult } from "./skill-gap";
import { getRoadmapById } from "./roadmaps";
import { getProjectsForCareer } from "./project-recommendations";
import { buildMarketPulse } from "./market-pulse";

export interface PathExamples {
  beginnerJourney: string[];
  commonMistakes: string[];
  projectProgression: string[];
  careerEvolution: string[];
  successPatterns: string[];
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

function hasCareerTag(career: Career, terms: string[]): boolean {
  const text = `${career.category} ${career.coreSkill} ${career.domain ?? ""} ${(career.tags || []).join(" ")}`.toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function buildBeginnerJourney(career: Career): string[] {
  const roadmap = getRoadmapById(career.id);
  if (!roadmap?.steps?.length) {
    return [`Start with the role's core skills then layer in projects, deployment, and documentation.`];
  }

  return roadmap.steps.slice(0, 3).map((step) =>
    `Phase ${step.phase}: ${step.title} — ${step.milestone}`
  );
}

function buildCommonMistakes(career: Career): string[] {
  const mistakes: string[] = [
    "Skipping foundational phases and jumping too fast to advanced tools or frameworks.",
    "Treating the roadmap as a checklist instead of building one polished, real project.",
    "Delaying deployment, documentation, or GitHub polish until the very end.",
    "Chasing trends rather than strengthening the role's core skill.",
  ];

  if (hasCareerTag(career, ["data", "ml", "analytics", "ai"])) {
    mistakes.unshift(
      "Building models or pipelines before clearly understanding the data and business problem."
    );
  }

  if (hasCareerTag(career, ["design", "ux", "product"])) {
    mistakes.unshift(
      "Prioritizing visual polish over user research, usability, and design rationale."
    );
  }

  if (hasCareerTag(career, ["devops", "cloud", "infrastructure", "platform"])) {
    mistakes.unshift(
      "Shipping code without early deployment, monitoring, or reliability practices."
    );
  }

  return mistakes.slice(0, 5);
}

function buildProjectProgression(
  career: Career,
  skillGap?: SkillGapResult,
  enhancedProfile?: EnhancedProfile
): string[] {
  const recommendations = getProjectsForCareer(career, enhancedProfile, skillGap);
  const progression: string[] = [];

  if (recommendations.beginnerProjects.length > 0) {
    const first = recommendations.beginnerProjects[0];
    progression.push(
      `Begin with ${first.title} to demonstrate ${career.coreSkill} in a practical project.`
    );
  }
  if (recommendations.beginnerProjects.length > 1) {
    const next = recommendations.beginnerProjects[1];
    progression.push(
      `Then build ${next.title} to show consistency and broader experience with supporting skills.`
    );
  }
  if (recommendations.intermediateProjects.length > 0) {
    const mid = recommendations.intermediateProjects[0];
    progression.push(
      `Move to ${mid.title} as an intermediate showcase that adds depth and portfolio value.`
    );
  }
  if (recommendations.advancedProjects.length > 0) {
    const advanced = recommendations.advancedProjects[0];
    progression.push(
      `Finish with ${advanced.title} as an advanced portfolio piece that highlights production readiness.`
    );
  }

  if (progression.length === 0) {
    progression.push(
      `Start with a beginner-friendly project that matches ${career.coreSkill}, then step up to more robust work as you learn.`
    );
  }

  return progression.slice(0, 4);
}

function buildCareerEvolution(career: Career): string[] {
  const roadmap = getRoadmapById(career.id);
  const pulse = buildMarketPulse(career);
  const evolution: string[] = [];

  if (roadmap?.steps?.length) {
    const firstPhases = roadmap.steps.slice(0, 2).map((step) => step.title);
    const laterPhases = roadmap.steps.slice(-2).map((step) => step.title);

    if (firstPhases.length) {
      evolution.push(
        `Early growth focuses on ${firstPhases.join(" and ")} to build a strong foundation.`
      );
    }
    if (laterPhases.length) {
      evolution.push(
        `Later phases shift toward ${laterPhases.join(" and ")} for career-level impact.`
      );
    }
  }

  if (pulse.newAdjacentRoles.length > 0) {
    evolution.push(
      `This path often evolves into nearby roles like ${pulse.newAdjacentRoles.join(", ")} as your experience deepens.`
    );
  } else {
    evolution.push(
      `The career typically expands into broader responsibilities and higher-impact systems work over time.`
    );
  }

  evolution.push(
    `Market momentum is ${pulse.trendDirection}, so keep improving your core skills and adapting as the role grows.`
  );

  return evolution.slice(0, 5);
}

function buildSuccessPatterns(career: Career): string[] {
  return [
    `Build and document one meaningful project per phase, not just many small demos.`,
    `Keep your portfolio focused on ${career.coreSkill} and the supporting skills listed in the roadmap.`,
    `Share deployed work and clean GitHub READMEs instead of only code snapshots.`,
    `Use feedback cycles: iterate on a project after every milestone to learn faster.`,
  ];
}

export function buildPathExamples(
  career: Career,
  skillGap?: SkillGapResult,
  enhancedProfile?: EnhancedProfile
): PathExamples {
  return {
    beginnerJourney: buildBeginnerJourney(career),
    commonMistakes: buildCommonMistakes(career),
    projectProgression: buildProjectProgression(career, skillGap, enhancedProfile),
    careerEvolution: buildCareerEvolution(career),
    successPatterns: buildSuccessPatterns(career),
  };
}
