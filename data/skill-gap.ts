/**
 * SKILL GAP INTELLIGENCE ENGINE
 *
 * Analyzes the gap between user's existing skills and career requirements.
 * Transforms CorePath from a recommendation tool into a career execution system.
 *
 * Inputs:
 *  - Career (with coreSkill, supportingSkills, tags, difficulty)
 *  - User skills (string[] — from profile, journey memory, or manual entry)
 *  - Enhanced profile (ExtendedTraitScores for signal-based skill inference)
 *
 * Outputs:
 *  - existing strengths
 *  - missing skills
 *  - gap score (0–1, higher = more to learn)
 *  - estimated timeline (human-readable)
 *  - learning priorities (ordered)
 *  - confidence adjustment (-1 to 1)
 */

import type { Career } from "./careers";
import type { EnhancedProfile } from "./quiz-enhanced";
import { loadJourneyMemory } from "./journey-memory";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface SkillGapResult {
  /** Skills the user already has that map to this career */
  existingStrengths: string[];
  /** Skills the user needs to acquire */
  missingSkills: string[];
  /** 0–1 where 0 = no gap (all skills covered), 1 = full gap (nothing covered) */
  gapScore: number;
  /** Human-readable timeline estimate */
  estimatedTimeline: string;
  /** Ordered list of what to learn first */
  learningPriorities: string[];
  /** Confidence adjustment: -1 (reduce) to +1 (increase). Applied externally. */
  confidenceAdjustment: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Map extended trait spikes to inferred skill labels */
const TRAIT_TO_SKILL: Record<string, string[]> = {
  "systems-thinking": ["System Design", "Architecture", "Distributed Systems"],
  abstraction: ["API Design", "Data Modeling", "Abstraction Patterns"],
  "ambiguity-tolerance": ["Experimentation", "Research", "Product Discovery"],
  "deep-work": ["Focus", "Deep Technical Analysis", "Code Quality"],
  experimentation: ["Prototyping", "A/B Testing", "Iterative Development"],
  optimization: ["Performance Tuning", "Cost Optimization", "Algorithms"],
  "execution-speed": ["Agile Delivery", "CI/CD", "Rapid Prototyping"],
  "research-orientation": ["Literature Review", "Data Analysis", "Hypothesis Testing"],
  "people-orientation": ["Teamwork", "Mentoring", "Stakeholder Management"],
  autonomy: ["Self-Direction", "Independent Project Execution", "Ownership"],
  "risk-tolerance": ["Innovation", "Entrepreneurship", "Decision Making Under Uncertainty"],
  "stability-preference": ["Reliability Engineering", "Process Design", "Quality Assurance"],
  creativity: ["Creative Problem Solving", "Ideation", "Visual Communication"],
  "technical-depth": ["Deep Technical Expertise", "Advanced Patterns", "Code Review"],
  "visual-thinking": ["UI Design", "Data Visualization", "Information Design"],
  "operational-thinking": ["Process Automation", "Operations", "Monitoring"],
  leadership: ["Team Leadership", "Mentoring", "Strategic Planning"],
  adaptability: ["Cross-Functional Skills", "Learning Agility", "Context Switching"],
  "learning-velocity": ["Rapid Skill Acquisition", "Knowledge Transfer", "Self-Learning"],
  "AI-curiosity": ["AI Literacy", "Prompt Engineering", "AI Tool Evaluation"],
  "AI-builder": ["Model Integration", "ML Pipelines", "AI Product Development"],
  "AI-user": ["AI Workflow Automation", "AI-Assisted Development", "Tool Proficiency"],
};

/** Timeline buckets by gap score range */
const TIMELINE_BY_GAP: Array<[number, string]> = [
  [0, "Already well-aligned — focus on depth and real-world projects"],
  [0.2, "1–3 months to close minor gaps"],
  [0.4, "3–6 months to build missing skills"],
  [0.6, "6–12 months to develop core competencies"],
  [0.8, "12–18 months — structured learning plan recommended"],
];

/** Difficulty multiplier for timeline */
const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  low: 0.7,
  moderate: 1,
  high: 1.5,
  transformative: 2,
};

// ============================================================================
// HELPERS
// ============================================================================

/** Normalize a skill string for comparison */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Get the required skills for a career (core + supporting + tags) */
function getCareerRequiredSkills(career: Career): string[] {
  const skills = new Set<string>();

  if (career.coreSkill) {
    // Split core skill into constituent parts
    career.coreSkill.split(/[/,&]/).forEach((s) => skills.add(s.trim()));
  }

  (career.supportingSkills ?? []).forEach((s) => skills.add(s));
  (career.tags ?? []).forEach((s) => skills.add(s));

  return Array.from(skills);
}

/** Derive inferred skills from an enhanced profile's top extended traits */
function inferSkillsFromProfile(profile: EnhancedProfile | null): string[] {
  if (!profile) return [];

  const skills = new Set<string>();
  const sorted = Object.entries(profile.extended)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 traits

  for (const [trait, value] of sorted) {
    if (value >= 0.4) {
      const mapped = TRAIT_TO_SKILL[trait] ?? [];
      mapped.forEach((s) => skills.add(s));
    }
  }

  return Array.from(skills);
}

/** Derive skills from journey memory (quiz engagement and general exposure) */
function inferSkillsFromJourney(): string[] {
  const memory = loadJourneyMemory();
  const skills = new Set<string>();

  // Quiz completions indicate engagement and self-assessment maturity
  if (memory.completedQuizzes >= 2) {
    skills.add("Career Self-Assessment");
    skills.add("Self-Directed Learning");
  }

  return Array.from(skills);
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

/**
 * Analyze the gap between a user's existing skills and a career's requirements.
 *
 * @param career  - The target career
 * @param userSkills  - Explicitly stated user skills (can be empty array)
 * @param profile  - Enhanced profile for trait-based skill inference (optional)
 * @returns SkillGapResult with strengths, gaps, timeline, and priorities
 */
export function analyzeSkillGap(
  career: Career,
  userSkills: string[],
  profile: EnhancedProfile | null = null
): SkillGapResult {
  // 1. Gather all known user skills
  const inferredFromProfile = inferSkillsFromProfile(profile);
  const inferredFromJourney = inferSkillsFromJourney();

  const allUserSkills = new Set([
    ...userSkills.map((s) => normalize(s)),
    ...inferredFromProfile.map((s) => normalize(s)),
    ...inferredFromJourney.map((s) => normalize(s)),
  ]);

  // 2. Get required skills for the career
  const requiredSkills = getCareerRequiredSkills(career);
  const normalizedRequired = requiredSkills.map((s) => normalize(s));

  // 3. Compute existing strengths and missing skills
  const existingStrengths: string[] = [];
  const missingSkills: string[] = [];

  for (let i = 0; i < requiredSkills.length; i++) {
    const original = requiredSkills[i];
    const normalized = normalizedRequired[i];

    // Check for direct match or partial overlap
    const isMatch = [...allUserSkills].some((userSkill) => {
      if (userSkill === normalized) return true;
      // Partial match: e.g., "system design" matches "systems-thinking" derived skills
      if (userSkill.includes(normalized) || normalized.includes(userSkill)) return true;
      return false;
    });

    if (isMatch) {
      existingStrengths.push(original);
    } else {
      missingSkills.push(original);
    }
  }

  // 4. Calculate gap score (0–1)
  const totalRequired = requiredSkills.length;
  const covered = existingStrengths.length;
  const gapScore = totalRequired > 0
    ? Math.round(((totalRequired - covered) / totalRequired) * 100) / 100
    : 0.5;

  // 5. Estimate timeline
  const difficulty = career.difficulty ?? "moderate";
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1;

  let estimatedTimeline = TIMELINE_BY_GAP[0][1];
  for (let i = TIMELINE_BY_GAP.length - 1; i >= 0; i--) {
    const [threshold, label] = TIMELINE_BY_GAP[i];
    if (gapScore >= threshold) {
      // Scale timeline by difficulty
      if (multiplier > 1 && gapScore >= 0.4) {
        const baseMonths = threshold === 0 ? 0 : threshold <= 0.2 ? 3 : threshold <= 0.4 ? 6 : threshold <= 0.6 ? 12 : 18;
        const adjusted = Math.round(baseMonths * multiplier);
        estimatedTimeline = `${adjusted}+ months — ${difficulty} difficulty path`;
      } else {
        estimatedTimeline = label;
      }
      break;
    }
  }

  // 6. Compute learning priorities (core skill first, then missing supporting)
  const coreSkill = career.coreSkill ?? "";
  const priorities: string[] = [];

  // Core skill is always first priority
  if (coreSkill && missingSkills.some((s) => normalize(s).includes(normalize(coreSkill)))) {
    priorities.push(coreSkill);
  }

  // Then other missing skills
  missingSkills.forEach((skill) => {
    if (!priorities.includes(skill)) {
      priorities.push(skill);
    }
  });

  // If user already has the core skill, suggest depth expansion
  if (existingStrengths.some((s) => normalize(s).includes(normalize(coreSkill)))) {
    priorities.unshift(`${coreSkill} — Deepen Expertise`);
  }

  // 7. Confidence adjustment
  // Positive if user covers core skill, negative if core is missing entirely
  let confidenceAdjustment = 0;
  if (existingStrengths.some((s) => normalize(s).includes(normalize(coreSkill)))) {
    confidenceAdjustment = Math.min(1, 0.3 + covered * 0.1);
  } else if (coreSkill && missingSkills.some((s) => normalize(s).includes(normalize(coreSkill)))) {
    confidenceAdjustment = -Math.min(0.5, 0.2 + (totalRequired - covered) * 0.05);
  } else {
    confidenceAdjustment = covered > totalRequired / 2 ? 0.15 : -0.15;
  }

  return {
    existingStrengths: [...new Set(existingStrengths)],
    missingSkills: [...new Set(missingSkills)],
    gapScore,
    estimatedTimeline,
    learningPriorities: priorities.slice(0, 5),
    confidenceAdjustment,
  };
}

/**
 * Quick readiness percentage — convenience wrapper.
 */
export function getCareerReadiness(career: Career, userSkills: string[], profile?: EnhancedProfile | null): number {
  const result = analyzeSkillGap(career, userSkills, profile);
  return Math.round((1 - result.gapScore) * 100);
}

/**
 * Get next learning priority as a single human-readable string.
 */
export function getNextLearningPriority(career: Career, userSkills: string[], profile?: EnhancedProfile | null): string {
  const result = analyzeSkillGap(career, userSkills, profile);
  if (result.learningPriorities.length === 0) {
    return "All core skills covered — focus on real-world projects";
  }
  return result.learningPriorities[0];
}
