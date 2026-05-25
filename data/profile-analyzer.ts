import type { Career } from "./careers";
import type { EnhancedProfile } from "./quiz-enhanced";
import type { SkillGapResult } from "./skill-gap";
import type { ProjectRecommendations } from "./project-recommendations";
import { getProjectsForCareer } from "./project-recommendations";
import { loadJourneyMemory } from "./journey-memory";

export interface GitHubProjectRecord {
  name: string;
  url?: string;
  description: string;
  skills?: string[];
}

export interface ProfilePortfolioAnalysis {
  portfolioScore: number;
  readinessScore: number;
  resumeSignalCount: number;
  githubProjectCount: number;
  strengthSignals: string[];
  missingSignals: string[];
  careerReadinessAdjustment: number;
  recommendedProjects: ProjectRecommendations | null;
  missingCoreSkills: string[];
  portfolioNarrative: string;
  priorityActions: string[];
}

interface AnalyzeProfilePortfolioParams {
  career?: Career;
  skillGap?: SkillGapResult;
  enhancedProfile?: EnhancedProfile | null;
  resumeText?: string;
  githubProjects?: GitHubProjectRecord[];
}

const DEFAULT_KEYWORDS = [
  "AI",
  "machine learning",
  "data",
  "cloud",
  "automation",
  "systems",
  "design",
  "product",
  "analytics",
  "research",
];

const LANGUAGE_TOKENS = [
  "python",
  "javascript",
  "typescript",
  "java",
  "c#",
  "go",
  "rust",
  "ruby",
  "sql",
  "scala",
  "kotlin",
  "php",
];

const FRAMEWORK_TOKENS = [
  "react",
  "next",
  "node",
  "express",
  "django",
  "flask",
  "spring",
  "angular",
  "vue",
  "tensorflow",
  "pytorch",
  "keras",
  "spark",
  "docker",
  "kubernetes",
  "serverless",
];

const COMPLEXITY_TOKENS = [
  "scalable",
  "distributed",
  "enterprise",
  "production",
  "full stack",
  "end to end",
  "microservice",
  "real time",
  "high performance",
  "complex",
];

const DEPLOYMENT_TOKENS = [
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "cloud",
  "serverless",
  "ci/cd",
  "deployed",
  "production",
  "continuous deployment",
];

const AI_TOKENS = [
  "machine learning",
  "artificial intelligence",
  "deep learning",
  "neural network",
  "nlp",
  "computer vision",
  "predictive",
  "recommendation engine",
  "model",
  "data science",
  "generative",
  "ai",
];

const DOCUMENTATION_TOKENS = [
  "readme",
  "documentation",
  "docs",
  "docstrings",
  "architecture diagram",
  "api docs",
  "specification",
  "technical design",
  "knowledge base",
];

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter(Boolean);
}

function buildPortfolioKeywords(career: Career): string[] {
  const keywords = new Set<string>(DEFAULT_KEYWORDS.map(normalize));

  if (career.coreSkill) {
    tokenize(career.coreSkill).forEach((token) => keywords.add(token));
  }

  (career.supportingSkills ?? []).forEach((skill) => tokenize(skill).forEach((token) => keywords.add(token)));
  (career.tags ?? []).forEach((tag) => tokenize(tag).forEach((token) => keywords.add(token)));
  if (career.category) tokenize(career.category).forEach((token) => keywords.add(token));
  if (career.domain) tokenize(career.domain).forEach((token) => keywords.add(token));

  return Array.from(keywords).filter(Boolean);
}

function detectPortfolioEvidence(text: string) {
  const normalized = normalize(text);

  const languages = LANGUAGE_TOKENS.filter((lang) => normalized.includes(lang));
  const frameworks = FRAMEWORK_TOKENS.filter((framework) => normalized.includes(framework));
  const hasDeployment = DEPLOYMENT_TOKENS.some((token) => normalized.includes(token));
  const hasAI = AI_TOKENS.some((token) => normalized.includes(token));
  const hasDocumentation = DOCUMENTATION_TOKENS.some((token) => normalized.includes(token));
  const complexityCount = COMPLEXITY_TOKENS.reduce(
    (count, token) => (normalized.includes(token) ? count + 1 : count),
    0
  );

  return {
    languages: Array.from(new Set(languages)).slice(0, 4),
    frameworks: Array.from(new Set(frameworks)).slice(0, 4),
    hasDeployment,
    hasAI,
    hasDocumentation,
    complexityCount,
  };
}

function buildResumeSignals(career: Career, resumeText?: string): string[] {
  if (!resumeText) return [];

  const keywords = buildPortfolioKeywords(career);
  const normalizedText = normalize(resumeText);
  const signals = new Set<string>();

  for (const keyword of keywords) {
    if (keyword && normalizedText.includes(keyword)) {
      signals.add(`Resume mentions ${keyword}`);
    }
  }

  const evidence = detectPortfolioEvidence(resumeText);
  if (evidence.languages.length) {
    signals.add(`Resume lists languages: ${evidence.languages.join(", ")}`);
  }
  if (evidence.frameworks.length) {
    signals.add(`Resume references frameworks: ${evidence.frameworks.join(", ")}`);
  }
  if (evidence.hasDeployment) {
    signals.add("Resume includes deployment or production experience");
  }
  if (evidence.hasAI) {
    signals.add("Resume shows AI or machine learning exposure");
  }
  if (evidence.hasDocumentation) {
    signals.add("Resume highlights documentation or collaboration practices");
  }
  if (evidence.complexityCount > 0) {
    signals.add("Resume highlights complex or scalable systems");
  }

  return Array.from(signals).slice(0, 6);
}

function buildGitHubSignals(career: Career, githubProjects?: GitHubProjectRecord[]): string[] {
  if (!githubProjects?.length) return [];

  const keywords = buildPortfolioKeywords(career);
  const signals = new Set<string>();

  githubProjects.forEach((project) => {
    const projectText = `${project.name} ${project.description} ${project.skills?.join(" ") ?? ""}`;
    const normalized = normalize(projectText);
    const evidence = detectPortfolioEvidence(projectText);

    for (const keyword of keywords) {
      if (keyword && normalized.includes(keyword)) {
        signals.add(`${project.name}: aligned with ${keyword}`);
      }
    }

    if (evidence.languages.length) {
      signals.add(`${project.name}: uses ${evidence.languages.slice(0, 2).join(", ")}`);
    }
    if (evidence.frameworks.length) {
      signals.add(`${project.name}: built with ${evidence.frameworks.slice(0, 2).join(", ")}`);
    }
    if (evidence.hasDeployment) {
      signals.add(`${project.name}: includes deployment or CI/CD evidence`);
    }
    if (evidence.hasAI) {
      signals.add(`${project.name}: contains AI or data-driven logic`);
    }
    if (evidence.hasDocumentation) {
      signals.add(`${project.name}: has documentation / README signals`);
    }
    if (evidence.complexityCount > 0) {
      signals.add(`${project.name}: demonstrates complex system work`);
    }
  });

  const filtered = Array.from(signals).slice(0, 6);
  return filtered.length
    ? filtered
    : githubProjects.map((project) => `GitHub project ${project.name} is available`).slice(0, 6);
}

function buildSignalSummary(
  career: Career,
  resumeSignals: string[],
  githubSignals: string[],
  skillGap?: SkillGapResult
): string {
  if (!skillGap) {
    return "Your portfolio can be strengthened with career-specific resume and GitHub evidence.";
  }

  const aligned = resumeSignals.length + githubSignals.length;
  if (aligned === 0) {
    return `No portfolio evidence found for ${career.coreSkill}. Add resume bullets and GitHub projects that highlight those skills.`;
  }

  return aligned > 3
    ? `Your portfolio already includes ${aligned} alignment signals for ${career.coreSkill}. Keep strengthening that narrative.`
    : `A few signals are present, but your profile can better showcase ${career.coreSkill} with stronger GitHub or deployment evidence.`;
}

function mergeEvidence(evidenceList: Array<ReturnType<typeof detectPortfolioEvidence>>) {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  let hasDeployment = false;
  let hasAI = false;
  let hasDocumentation = false;
  let complexityCount = 0;

  evidenceList.forEach((evidence) => {
    evidence.languages.forEach((lang) => languages.add(lang));
    evidence.frameworks.forEach((framework) => frameworks.add(framework));
    hasDeployment ||= evidence.hasDeployment;
    hasAI ||= evidence.hasAI;
    hasDocumentation ||= evidence.hasDocumentation;
    complexityCount += evidence.complexityCount;
  });

  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    hasDeployment,
    hasAI,
    hasDocumentation,
    complexityCount,
  };
}

export function analyzeProfilePortfolio({
  career,
  skillGap,
  enhancedProfile = null,
  resumeText,
  githubProjects,
}: AnalyzeProfilePortfolioParams): ProfilePortfolioAnalysis {
  const journey = loadJourneyMemory();
  const recommendedProjects = career ? getProjectsForCareer(career, enhancedProfile ?? undefined, skillGap, journey) : null;

  const resumeSignals = career ? buildResumeSignals(career, resumeText) : [];
  const githubSignals = career ? buildGitHubSignals(career, githubProjects) : [];
  const signalCount = resumeSignals.length + githubSignals.length;
  const githubCount = githubProjects?.length ?? 0;
  const resumeEvidence = resumeText ? detectPortfolioEvidence(resumeText) : null;
  const githubEvidence = githubProjects?.length
    ? mergeEvidence(githubProjects.map((project) => detectPortfolioEvidence(`${project.name} ${project.description} ${project.skills?.join(" ") ?? ""}`)) )
    : null;

  const gapScore = skillGap?.gapScore ?? 0.5;
  const careerStrength = Math.round((1 - gapScore) * 65 + 15);
  const signalBoost = Math.min(20, signalCount * 4);
  const evidenceBoost = Math.min(
    15,
    (resumeEvidence?.languages.length ?? 0) +
      (resumeEvidence?.frameworks.length ?? 0) +
      (githubEvidence?.languages.length ?? 0) +
      (githubEvidence?.frameworks.length ?? 0)
  );
  const deploymentBoost = Number(resumeEvidence?.hasDeployment || githubEvidence?.hasDeployment) * 4;
  const aiBoost = Number(resumeEvidence?.hasAI || githubEvidence?.hasAI) * 4;
  const docsBoost = Number(resumeEvidence?.hasDocumentation || githubEvidence?.hasDocumentation) * 3;
  const complexityBoost = Math.min(10, (resumeEvidence?.complexityCount ?? 0) + (githubEvidence?.complexityCount ?? 0));
  const experienceBonus = enhancedProfile
    ? Math.round(
        Math.min(
          10,
          Object.values(enhancedProfile.extended).reduce((sum, value) => sum + value, 0) /
            Object.keys(enhancedProfile.extended).length
        )
      )
    : 0;

  const portfolioScore = Math.min(
    100,
    Math.max(18, careerStrength + signalBoost + evidenceBoost + deploymentBoost + aiBoost + docsBoost + complexityBoost + experienceBonus)
  );
  const readinessScore = career ? Math.round(portfolioScore) : 0;

  const baseAdjustment = skillGap ? Math.round(skillGap.confidenceAdjustment * 100) : 0;
  const signalAdjustment = signalCount >= 3 ? 10 : signalCount >= 1 ? 6 : 0;
  const careerReadinessAdjustment = Math.max(-50, Math.min(50, baseAdjustment + signalAdjustment));

  const missingCoreSkills = skillGap?.missingSkills ?? [];
  const missingSignals = [] as string[];

  if (!resumeText) {
    missingSignals.push(`No resume evidence for ${career?.coreSkill ?? "this career"}`);
  } else if (resumeEvidence && !resumeEvidence.hasDeployment) {
    missingSignals.push("Resume could better show deployment, cloud, or production delivery.");
  }

  if (!githubProjects?.length) {
    missingSignals.push("No GitHub portfolio projects detected.");
  } else if (githubEvidence && !githubEvidence.hasDeployment) {
    missingSignals.push("GitHub work should include deployment, CI/CD, or cloud evidence.");
  }

  if (missingCoreSkills.length > 0) {
    missingSignals.push(`Portfolio should better showcase ${missingCoreSkills.slice(0, 3).join(", ")}`);
  }

  if (resumeEvidence && !resumeEvidence.hasAI && !githubEvidence?.hasAI) {
    missingSignals.push("No AI or machine learning exposure found in portfolio evidence.");
  }

  const priorityActions = [] as string[];
  if (career) {
    if (!resumeText) {
      priorityActions.push(
        `Add resume bullets that highlight ${career.coreSkill} and supporting skills like ${missingCoreSkills.slice(0, 2).join(", ")}`
      );
    }

    if (!githubProjects?.length) {
      priorityActions.push(
        `Publish a GitHub project demonstrating ${career.coreSkill} and ${missingCoreSkills.slice(0, 2).join(", ")}`
      );
    }

    if (skillGap && skillGap.missingSkills.length > 0) {
      priorityActions.push(`Build portfolio work around ${skillGap.missingSkills[0]}`);
    }

    if (resumeEvidence?.hasDeployment && githubEvidence?.hasDeployment) {
      priorityActions.push(`Emphasize deployment and production impact in your next project or bullet point`);
    }

    if (signalCount > 0 && resumeText && githubProjects?.length) {
      priorityActions.push(`Refine your GitHub README and resume bullets to call out ${career.coreSkill} impact clearly`);
    }
  }

  if (priorityActions.length === 0) {
    priorityActions.push(`Collect resume and GitHub evidence that supports your fit for ${career?.title ?? "this career"}`);
  }

  const portfolioNarrative = career
    ? buildSignalSummary(career, resumeSignals, githubSignals, skillGap)
    : "Add a target career to see how your resume and GitHub portfolio compare.";

  const strengthSignals = [...new Set([...(skillGap?.existingStrengths ?? []), ...resumeSignals, ...githubSignals])].slice(0, 6);

  return {
    portfolioScore,
    readinessScore,
    resumeSignalCount: resumeSignals.length,
    githubProjectCount: githubCount,
    strengthSignals,
    missingSignals: missingSignals.slice(0, 4),
    careerReadinessAdjustment,
    recommendedProjects,
    missingCoreSkills: missingCoreSkills.slice(0, 5),
    portfolioNarrative,
    priorityActions: Array.from(new Set(priorityActions)).slice(0, 4),
  };
}
