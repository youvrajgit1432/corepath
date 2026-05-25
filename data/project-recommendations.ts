/**
 * PROJECT RECOMMENDATION INTELLIGENCE ENGINE
 *
 * Generates contextual project recommendations based on:
 * - Career type (backend, frontend, data, ML, etc.)
 * - Skill gaps (what they need to learn)
 * - Experience level (beginner, intermediate, advanced)
 * - Journey memory (what they've explored)
 * - Enhanced profile (their traits and strengths)
 *
 * NO hardcoded mappings. Instead, derives projects from:
 * 1. Career tags + category
 * 2. Roadmap skills
 * 3. Skill gap analysis
 * 4. Extended trait patterns
 *
 * Output: 3 project lists, each with title, difficulty, estimated time,
 * skills learned, reason recommended, AI relevance, portfolio value
 */

import type { Career } from "./careers";
import type { EnhancedProfile } from "./quiz-enhanced";
import type { SkillGapResult } from "./skill-gap";
import type { JourneyMemory } from "./journey-memory";
import { roadmaps } from "./roadmaps";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type AIRelevance = "high" | "moderate" | "low";

export interface Project {
  title: string;
  difficulty: ExperienceLevel;
  estimatedTime: string; // e.g., "4-6 weeks"
  skillsLearned: string[];
  reasonRecommended: string;
  aiRelevance: AIRelevance;
  portfolioValue: string; // e.g., "Strong portfolio piece demonstrating..."
}

export interface ProjectRecommendations {
  beginnerProjects: Project[];
  intermediateProjects: Project[];
  advancedProjects: Project[];
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Get the roadmap for a career ID
 */
function getCareerRoadmap(careerId: string) {
  return roadmaps.find((r) => r.careerId === careerId);
}

/**
 * Extract project domains from career metadata
 * Returns thematic domains for project generation
 */
function extractProjectDomains(career: Career): string[] {
  const domains: string[] = [];

  // Add category-based domain
  if (career.category) {
    domains.push(career.category);
  }

  // Add tag-based domains
  if (career.tags) {
    career.tags.forEach((tag) => {
      if (tag && !domains.includes(tag)) {
        domains.push(tag);
      }
    });
  }

  // Add domain if available
  if (career.domain && !domains.includes(career.domain)) {
    domains.push(career.domain);
  }

  return domains.length > 0 ? domains : [career.category || "general"];
}

/**
 * Get core and supporting skills from roadmap
 */
function extractCareerSkills(careerId: string): { core: string[]; supporting: string[] } {
  const roadmap = getCareerRoadmap(careerId);
  if (!roadmap) {
    return { core: [], supporting: [] };
  }

  const core: string[] = [];
  const supporting: string[] = [];

  // Extract from skill tree
  roadmap.skillTree.forEach((node) => {
    if (node.type === "core") {
      core.push(node.label);
    } else if (node.type === "supporting") {
      supporting.push(node.label);
    }
  });

  return { core, supporting };
}

/**
 * Determine which skills are most important based on gap analysis
 */
function getPrioritySkills(
  allSkills: string[],
  missingSkills: string[],
  _existingStrengths: string[],
  limit: number = 3
): string[] {
  // Prioritize missing skills (what they need to learn)
  const prioritized = missingSkills.length > 0 ? missingSkills : allSkills;

  return prioritized.slice(0, limit);
}

/**
 * Determine AI relevance based on career's AI impact + traits
 */
function deriveAIRelevance(career: Career, enhancedProfile: EnhancedProfile | undefined): AIRelevance {
  let relevance: AIRelevance = "low";

  // Check career AI impact
  if (career.aiImpact === "transformative") {
    relevance = "high";
  } else if (career.aiImpact === "high") {
    relevance = "high";
  } else if (career.aiImpact === "moderate") {
    relevance = "moderate";
  }

  // Adjust based on user's AI traits
  if (enhancedProfile) {
    const aiCuriosity = enhancedProfile.extended["AI-curiosity"] ?? 0;
    const aiBuilder = enhancedProfile.extended["AI-builder"] ?? 0;
    const aiUser = enhancedProfile.extended["AI-user"] ?? 0;
    const aiScoreAvg = (aiCuriosity + aiBuilder + aiUser) / 3;

    if (aiScoreAvg > 0.7 && relevance !== "high") {
      relevance = "moderate";
    }
  }

  return relevance;
}

/**
 * Generate project title based on career, domain, and difficulty
 */
function generateProjectTitle(
  domains: string[],
  difficulty: ExperienceLevel,
  coreSkill: string,
  index: number
): string {
  const domain = domains[index % domains.length] || domains[0];

  const templates: Record<ExperienceLevel, string[]> = {
    beginner: [
      `Build a ${domain} CLI Tool`,
      `Create a ${domain} TODO App`,
      `Simple ${domain} Calculator`,
      `${domain} Data Processor`,
    ],
    intermediate: [
      `Build a ${domain} API`,
      `Create a ${domain} Dashboard`,
      `${domain} Analytics Platform`,
      `Full-stack ${domain} App`,
    ],
    advanced: [
      `Scalable ${domain} Architecture`,
      `${coreSkill} System Design`,
      `Production ${domain} Platform`,
      `${coreSkill} at Scale`,
    ],
  };

  const templates_list = templates[difficulty];
  return templates_list[index % templates_list.length];
}

/**
 * Estimate time to completion based on difficulty and career complexity
 */
function estimateTime(
  difficulty: ExperienceLevel,
  careerDifficulty: string | undefined
): string {
  const baseTimings: Record<ExperienceLevel, [number, number]> = {
    beginner: [2, 4],
    intermediate: [4, 8],
    advanced: [8, 12],
  };

  let [minWeeks, maxWeeks] = baseTimings[difficulty];

  // Adjust for career difficulty
  if (careerDifficulty === "transformative") {
    minWeeks += 2;
    maxWeeks += 4;
  } else if (careerDifficulty === "high") {
    minWeeks += 1;
    maxWeeks += 2;
  }

  return `${minWeeks}–${maxWeeks} weeks`;
}

/**
 * Generate a project recommendation at a specific difficulty level
 */
function generateProject(
  career: Career,
  skillGap: SkillGapResult | undefined,
  enhancedProfile: EnhancedProfile | undefined,
  journey: JourneyMemory | undefined,
  difficulty: ExperienceLevel,
  index: number
): Project {
  const domains = extractProjectDomains(career);
  const { core: coreSkills, supporting: supportingSkills } = extractCareerSkills(career.id);

  // Determine which skills this project should teach
  let skillsForProject: string[] = [];
  if (difficulty === "beginner") {
    skillsForProject = coreSkills.slice(0, 2);
  } else if (difficulty === "intermediate") {
    skillsForProject = [...coreSkills.slice(0, 3), ...supportingSkills.slice(0, 2)];
  } else {
    skillsForProject = [...coreSkills, ...supportingSkills.slice(0, 2)];
  }

  // Prioritize missing skills if available
  if (skillGap && skillGap.missingSkills.length > 0) {
    const maxToUse = difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 3 : 4;
    skillsForProject = getPrioritySkills(
      skillsForProject,
      skillGap.missingSkills,
      skillGap.existingStrengths,
      maxToUse
    );
  }

  const title = generateProjectTitle(domains, difficulty, career.coreSkill, index);
  const aiRelevance = deriveAIRelevance(career, enhancedProfile);

  // Build reason recommended
  let reasonRecommended = "";
  if (skillGap && difficulty === "beginner") {
    reasonRecommended = `Start here to build foundational ${career.coreSkill.toLowerCase()} skills. Perfect for learning the basics without overwhelming complexity.`;
  } else if (difficulty === "intermediate") {
    reasonRecommended = `Take the next step in your ${career.title} journey. This project combines multiple skills and closer to real-world scenarios.`;
  } else {
    reasonRecommended = `This advanced project mirrors real production systems. You'll tackle the core skill of ${career.coreSkill} at scale.`;
  }

  // Add journey-aware context
  if (journey && journey.completedQuizzes > 1 && difficulty === "advanced") {
    reasonRecommended += ` Based on your exploration history, you're ready for this challenge.`;
  }

  // Build portfolio value
  let portfolioValue = "";
  if (difficulty === "beginner") {
    portfolioValue = `Demonstrates ability to understand fundamentals and build working prototypes.`;
  } else if (difficulty === "intermediate") {
    portfolioValue = `Shows intermediate proficiency in ${career.category}. Employers see you can integrate multiple technologies.`;
  } else {
    portfolioValue = `Employers recognize this as a significant engineering achievement demonstrating ${career.coreSkill} mastery.`;
  }

  return {
    title,
    difficulty,
    estimatedTime: estimateTime(difficulty, career.difficulty),
    skillsLearned: skillsForProject,
    reasonRecommended,
    aiRelevance,
    portfolioValue,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate project recommendations for a user based on their profile
 *
 * @param career The target career
 * @param enhancedProfile User's extended trait profile
 * @param skillGap Analysis of skill gaps
 * @param experienceLevel User's current experience (beginner/intermediate/advanced)
 * @param journeyMemory User's career exploration history
 * @returns 3 lists of projects (beginner, intermediate, advanced)
 */
export function generateProjectRecommendations(
  career: Career,
  enhancedProfile: EnhancedProfile | undefined,
  skillGap: SkillGapResult | undefined,
  experienceLevel: ExperienceLevel,
  journeyMemory: JourneyMemory | undefined
): ProjectRecommendations {
  const beginnerProjects: Project[] = [];
  const intermediateProjects: Project[] = [];
  const advancedProjects: Project[] = [];

  // Generate 2–3 projects at each level for variety
  const projectsPerLevel = experienceLevel === "beginner" ? 2 : 3;

  for (let i = 0; i < projectsPerLevel; i++) {
    beginnerProjects.push(
      generateProject(career, skillGap, enhancedProfile, journeyMemory, "beginner", i)
    );
    intermediateProjects.push(
      generateProject(career, skillGap, enhancedProfile, journeyMemory, "intermediate", i)
    );
    advancedProjects.push(
      generateProject(career, skillGap, enhancedProfile, journeyMemory, "advanced", i)
    );
  }

  // Ensure uniqueness by deduplicating titles
  const seen = new Set<string>();
  const dedupe = (projects: Project[]) =>
    projects.filter((p) => {
      if (seen.has(p.title)) return false;
      seen.add(p.title);
      return true;
    });

  return {
    beginnerProjects: dedupe(beginnerProjects),
    intermediateProjects: dedupe(intermediateProjects),
    advancedProjects: dedupe(advancedProjects),
  };
}

/**
 * Simpler API: Get project recommendations with defaults
 * Useful for quick UI integration
 */
export function getProjectsForCareer(
  career: Career,
  enhancedProfile?: EnhancedProfile,
  skillGap?: SkillGapResult,
  journey?: JourneyMemory
): ProjectRecommendations {
  // Infer experience level from skill gap
  let experienceLevel: ExperienceLevel = "beginner";
  if (skillGap) {
    if (skillGap.gapScore < 0.3) {
      experienceLevel = "advanced";
    } else if (skillGap.gapScore < 0.6) {
      experienceLevel = "intermediate";
    }
  }

  return generateProjectRecommendations(career, enhancedProfile, skillGap, experienceLevel, journey);
}
