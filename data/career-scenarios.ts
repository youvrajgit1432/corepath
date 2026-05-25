/**
 * CAREER SCENARIO INTELLIGENCE
 *
 * Simulates realistic future scenarios for career choices by reading from
 * market-pulse, career-evolution, path-examples, decision-assistant, and careers.
 *
 * Generates year-1, year-3, and year-5 projections with lifestyle signals,
 * growth trajectory, risk moments, career forks, and alternate outcomes.
 *
 * No backend. No external AI. Persisted via SafeStorage.
 */

import { getCareerById, type Career } from "./careers";
import { buildMarketPulse } from "./market-pulse";
import { buildCareerEvolution } from "./career-evolution";
import { buildPathExamples } from "./path-examples";
import { getSafeStorage } from "./safe-storage";
import type { EnhancedProfile } from "./quiz-enhanced";
import type { JourneyMemory } from "./journey-memory";

const STORAGE_KEY = "corepath-career-scenarios";
const MAX_CACHED = 10;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface YearMilestone {
  title: string;
  description: string;
  keyActivities: string[];
  skillsDeveloped: string[];
  typicalRole: string;
  salaryRange: string;
  satisfactionFactors: string[];
}

export interface LifestyleSignal {
  signal: string;
  description: string;
  type: "positive" | "neutral" | "challenging";
}

export interface GrowthTrajectory {
  trajectory: "accelerating" | "steady" | "steep" | "varied";
  description: string;
  keyMilestones: string[];
}

export interface RiskMoment {
  year: number;
  risk: string;
  description: string;
  mitigationStrategy: string;
}

export interface CareerFork {
  yearRange: string;
  fork: string;
  optionA: string;
  optionB: string;
  recommendation: string;
}

export interface AlternateOutcome {
  scenario: string;
  probability: "high" | "moderate" | "low";
  description: string;
}

export interface CareerScenarioData {
  careerId: string;
  careerTitle: string;
  yearOneScenario: YearMilestone;
  yearThreeScenario: YearMilestone;
  yearFiveScenario: YearMilestone;
  lifestyleSignals: LifestyleSignal[];
  growthTrajectory: GrowthTrajectory;
  riskMoments: RiskMoment[];
  careerForks: CareerFork[];
  alternateOutcomes: AlternateOutcome[];
  computedAt: string;
}

export interface CareerScenarioComparison {
  careerA: CareerScenarioData;
  careerB: CareerScenarioData | null;
  computedAt: string;
}

// ============================================================================
// INTERNAL STORAGE
// ============================================================================

function getStorage() {
  return getSafeStorage({ silent: true });
}

function loadCachedComparison(ids: string): CareerScenarioComparison | null {
  const all = getStorage().get<Record<string, CareerScenarioComparison>>(STORAGE_KEY);
  if (all && all[ids]) return all[ids];
  return null;
}

function cacheComparison(ids: string, comparison: CareerScenarioComparison): void {
  const all = getStorage().get<Record<string, CareerScenarioComparison>>(STORAGE_KEY) || {};
  all[ids] = comparison;
  const keys = Object.keys(all);
  if (keys.length > MAX_CACHED) {
    const oldest = keys.slice(0, keys.length - MAX_CACHED);
    for (const key of oldest) delete all[key];
  }
  getStorage().set(STORAGE_KEY, all);
}

// ============================================================================
// SCENARIO BUILDERS
// ============================================================================

function computeEntrySalaryRange(career: Career): string {
  const salary = career.salary ?? "$80k–$120k";
  const base = parseInt(salary.replace(/[^0-9]/g, "").slice(0, 3), 10) || 80;
  return `$${Math.max(base - 10, 50)}k–$${Math.min(base + 20, 150)}k`;
}

function computeMidRange(career: Career): string {
  const salary = career.salary ?? "$100k–$160k";
  const base = parseInt(salary.replace(/[^0-9]/g, "").slice(0, 3), 10) || 100;
  return `$${base + 10}k–$${base + 50}k`;
}

function computeSeniorRange(career: Career): string {
  const salary = career.salary ?? "$120k–$180k";
  const base = parseInt(salary.replace(/[^0-9]/g, "").slice(0, 3), 10) || 120;
  return `$${base + 20}k–$${base + 70}k`;
}

function buildYearOneScenario(
  career: Career,
  pulse: ReturnType<typeof buildMarketPulse>,
  evolution: ReturnType<typeof buildCareerEvolution>,
  pathExamples: ReturnType<typeof buildPathExamples>
): YearMilestone {
  const nextPaths = evolution.immediateNextPaths.slice(0, 2);
  const activities = [
    `Build foundational ${career.coreSkill} skills through structured projects`,
    `Develop proficiency in ${(career.supportingSkills ?? career.tags ?? []).slice(0, 2).join(" and ")}`,
    ...(nextPaths.length > 0
      ? [`Explore adjacent paths like ${nextPaths.join(" and ")}`]
      : ["Complete a portfolio project that demonstrates core competence"]),
    `Learn industry tools and best practices for ${career.category}`,
  ];

  const skills = [
    career.coreSkill,
    ...(career.supportingSkills ?? career.tags ?? []).slice(0, 3),
  ];

  return {
    title: "Building the foundation",
    description: `Year 1 is about acquiring the core ${career.coreSkill} skills needed for ${career.title}. Focus on practical projects, learning the ecosystem, and building a portfolio that demonstrates real competence.${
      pulse.trendDirection === "exploding" || pulse.trendDirection === "rising"
        ? ` Market momentum is ${pulse.trendDirection}, so early specialization can pay off quickly.`
        : ""
    }`,
    keyActivities: activities.slice(0, 4),
    skillsDeveloped: skills.slice(0, 5),
    typicalRole: `Junior ${career.title}`,
    salaryRange: computeEntrySalaryRange(career),
    satisfactionFactors: [
      `Rapid skill acquisition in ${career.coreSkill}`,
      "Building first portfolio projects",
      "Exploring the career landscape",
      pathExamples.beginnerJourney.length > 0
        ? pathExamples.beginnerJourney[0]
        : "Establishing a learning routine",
    ],
  };
}

function buildYearThreeScenario(
  career: Career,
  pulse: ReturnType<typeof buildMarketPulse>,
  evolution: ReturnType<typeof buildCareerEvolution>,
  pathExamples: ReturnType<typeof buildPathExamples>
): YearMilestone {
  const midPaths = evolution.midCareerEvolution.slice(0, 2);
  const activities = [
    `Deepen expertise in ${career.coreSkill} with production-level experience`,
    `Take ownership of moderately complex systems and projects`,
    ...(midPaths.length > 0
      ? [`Shift focus toward ${midPaths.join(" or ")}`]
      : [`Lead small-to-medium technical initiatives independently`]),
    `Mentor junior team members and contribute to cross-team planning`,
  ];

  const evolvedSkills = [
    `${career.coreSkill} (advanced)`,
    "System design & architecture",
    "Cross-functional collaboration",
    "Technical decision-making",
  ];

  return {
    title: "Growing into independence",
    description: `By year 3, you have moved past the beginner phase and are operating with reasonable autonomy. Your focus shifts from learning fundamentals to delivering reliable, well-architected work.${
      pulse.AITransformationLevel.includes("reshaping") || pulse.AITransformationLevel.includes("significantly")
        ? ` AI is transforming this role — stay adaptable by building AI-complementary skills.`
        : ""
    }`,
    keyActivities: activities.slice(0, 4),
    skillsDeveloped: evolvedSkills,
    typicalRole: `Mid-level ${career.title}`,
    salaryRange: computeMidRange(career),
    satisfactionFactors: [
      "Greater autonomy and ownership",
      "Seeing your work have real impact",
      "Building deeper technical confidence",
      pathExamples.careerEvolution.length > 1
        ? pathExamples.careerEvolution[1]
        : "Growing professional network",
    ],
  };
}

function buildYearFiveScenario(
  career: Career,
  pulse: ReturnType<typeof buildMarketPulse>,
  evolution: ReturnType<typeof buildCareerEvolution>
): YearMilestone {
  const leadership = evolution.leadershipTrack.slice(0, 2);
  const specialization = evolution.advancedSpecializationRoutes.slice(0, 2);
  const founder = evolution.founderTrack.slice(0, 1);

  const activities = [
    `Lead complex projects and influence technical or product strategy`,
    ...(specialization.length > 0
      ? [`Pursue specialization in ${specialization.join(" or ")}`]
      : [`Develop expertise in a high-demand niche within ${career.category}`]),
    ...(leadership.length > 0
      ? [`Transition toward ${leadership.join(" or ")} roles`]
      : [`Mentor teams and drive cross-functional initiatives`]),
    ...(founder.length > 0
      ? [`Consider entrepreneurial paths like ${founder[0]}`]
      : [`Build a strong professional brand through speaking, writing, or open source`]),
  ];

  const seniorSkills = [
    "Strategic technical decision-making",
    "Cross-team leadership & mentoring",
    "Architecture and systems thinking",
    "Business and product acumen",
    `${career.coreSkill} (expert-level)`,
  ];

  return {
    title: "Achieving leverage",
    description: `Year 5 marks a transition from execution to leverage. You are expected to make architectural decisions, influence roadmaps, and help others grow.${
      pulse.fiveYearOutlook.includes("strong demand")
        ? ` The outlook remains strong — the skills you have built position you well for continued growth.`
        : pulse.fiveYearOutlook.includes("hold steady")
          ? ` The outlook is steady — deepening your niche will help maintain your edge.`
          : ""
    }`,
    keyActivities: activities.slice(0, 4),
    skillsDeveloped: seniorSkills,
    typicalRole: `Senior ${career.title} / Lead`,
    salaryRange: computeSeniorRange(career),
    satisfactionFactors: [
      "Influencing technical direction and team culture",
      "Deep expertise in a meaningful domain",
      "Higher compensation and professional recognition",
      "Ability to choose problems that matter to you",
    ],
  };
}

function buildLifestyleSignals(
  career: Career,
  pulse: ReturnType<typeof buildMarketPulse>
): LifestyleSignal[] {
  const signals: LifestyleSignal[] = [];

  // Remote potential
  if (career.remotePotential === "High") {
    signals.push({
      signal: "Remote-friendly",
      description: "This career offers strong remote work options, giving you geographic flexibility.",
      type: "positive",
    });
  } else if (career.remotePotential === "Medium") {
    signals.push({
      signal: "Hybrid potential",
      description: "Some remote flexibility, but regular in-person collaboration is common.",
      type: "neutral",
    });
  } else {
    signals.push({
      signal: "On-site preference",
      description: "This role typically requires on-site presence for hardware, lab, or team coordination.",
      type: "challenging",
    });
  }

  // Salary & stability
  const salaryNum = parseInt((career.salary ?? "$100k").replace(/[^0-9]/g, ""), 10) || 100;
  if (salaryNum >= 130) {
    signals.push({
      signal: "High earning potential",
      description: `Typical compensation ranges ${career.salary} with potential for rapid growth as you specialize.`,
      type: "positive",
    });
  } else if (salaryNum >= 90) {
    signals.push({
      signal: "Solid earning potential",
      description: `Competitive compensation around ${career.salary} with steady growth potential.`,
      type: "positive",
    });
  }

  // AI risk / transformation
  if (career.aiRelationship === "Automation-Heavy") {
    signals.push({
      signal: "AI transformation risk",
      description: "Routine aspects may automate — focus on strategic, human-centered skills to stay resilient.",
      type: "challenging",
    });
  } else if (career.aiRelationship === "Human-Centered") {
    signals.push({
      signal: "AI-resilient",
      description: "This role is grounded in human judgment and is less exposed to automation.",
      type: "positive",
    });
  }

  // Market demand
  if (pulse.trendDirection === "exploding" || pulse.trendDirection === "rising") {
    signals.push({
      signal: "Growing demand",
      description: "Hiring demand is increasing, giving you strong job security and negotiation leverage.",
      type: "positive",
    });
  } else if (pulse.trendDirection === "declining") {
    signals.push({
      signal: "Softening demand",
      description: "Demand may decrease — consider developing adjacent skills for flexibility.",
      type: "challenging",
    });
  }

  // Difficulty reflection
  if (career.difficulty === "high" || career.difficulty === "transformative") {
    signals.push({
      signal: "Steep learning curve",
      description: "The initial years require significant investment before reaching comfortable competence.",
      type: "challenging",
    });
  } else if (career.difficulty === "low") {
    signals.push({
      signal: "Fast entry",
      description: "You can enter this field relatively quickly, with tangible progress within months.",
      type: "positive",
    });
  }

  return signals;
}

function buildGrowthTrajectory(
  career: Career,
  evolution: ReturnType<typeof buildCareerEvolution>,
  pulse: ReturnType<typeof buildMarketPulse>
): GrowthTrajectory {
  const hasClearPaths = evolution.immediateNextPaths.length > 0;
  const hasSpecialization = evolution.advancedSpecializationRoutes.length > 0;
  const hasLeadership = evolution.leadershipTrack.length > 0;

  let trajectory: GrowthTrajectory["trajectory"];
  if (pulse.trendDirection === "exploding" || (pulse.trendDirection === "rising" && hasClearPaths)) {
    trajectory = "accelerating";
  } else if (hasSpecialization && hasLeadership) {
    trajectory = "steep";
  } else if (hasClearPaths) {
    trajectory = "steady";
  } else {
    trajectory = "varied";
  }

  const milestones: string[] = [
    `Year 0–1: Learn ${career.coreSkill} and build a portfolio`,
  ];
  if (evolution.immediateNextPaths.length > 0) {
    milestones.push(`Year 1–3: Move into ${evolution.immediateNextPaths.slice(0, 2).join(" or ")}`);
  } else {
    milestones.push("Year 1–3: Gain independence and ship production-quality work");
  }
  if (evolution.advancedSpecializationRoutes.length > 0) {
    milestones.push(`Year 3–5: Specialize into ${evolution.advancedSpecializationRoutes.slice(0, 2).join(" or ")}`);
  } else if (evolution.leadershipTrack.length > 0) {
    milestones.push(`Year 3–5: Move toward ${evolution.leadershipTrack.slice(0, 2).join(" or ")}`);
  } else {
    milestones.push("Year 3–5: Lead projects and develop organizational influence");
  }
  milestones.push("Year 5+: Define your niche and mentor the next wave");

  const descriptions: Record<string, string> = {
    accelerating:
      "The market is moving fast in this field. Early momentum compounds quickly — each year builds on the last with growing opportunities.",
    steady:
      "A predictable, reliable growth path. Progress is consistent and the next steps are well-understood.",
    steep:
      "Growth is concentrated in specific phases. The first years require heavy investment, but the payoff accelerates sharply once you specialize.",
    varied:
      "Growth depends heavily on which paths you take and how you navigate forks. Some years will feel faster than others.",
  };

  return {
    trajectory,
    description: descriptions[trajectory],
    keyMilestones: milestones,
  };
}

function buildRiskMoments(
  career: Career,
  pulse: ReturnType<typeof buildMarketPulse>
): RiskMoment[] {
  const risks: RiskMoment[] = [];

  // Year 1 risk
  risks.push({
    year: 1,
    risk: "Learning curve overwhelm",
    description: `The initial learning phase for ${career.coreSkill} can feel slow, especially if progress is not visible early on.`,
    mitigationStrategy: "Set small weekly milestones and build one complete project rather than jumping between tutorials.",
  });

  // Year 2-3 risk based on difficulty
  if (career.difficulty === "high" || career.difficulty === "transformative") {
    risks.push({
      year: 2,
      risk: "Plateau without mentorship",
      description: "Without experienced guidance, intermediate growth can stall as problems become more complex.",
      mitigationStrategy: "Seek a mentor or join a community where you can get feedback on architecture and design decisions.",
    });
  }

  // AI disruption risk
  if (career.aiRelationship === "Automation-Heavy") {
    risks.push({
      year: 3,
      risk: "AI-driven role shift",
      description: "Automation of routine tasks may change the nature of this role faster than expected.",
      mitigationStrategy: "Deliberately build strategic, human-centered skills that complement AI rather than compete with it.",
    });
  }

  // Mid-career burn-out risk
  risks.push({
    year: 4,
    risk: "Mid-career stall",
    description: "After the initial growth phase, progress can feel slower and routine work may lead to dissatisfaction.",
    mitigationStrategy: "Take on stretch projects, explore side initiatives, or consider a specialization pivot to re-engage.",
  });

  // Market decline risk
  if (pulse.trendDirection === "declining") {
    risks.push({
      year: 3,
      risk: "Softening market demand",
      description: "Hiring demand is declining in this area, which may make job transitions harder mid-career.",
      mitigationStrategy: "Develop adjacent skills in growing areas to remain flexible and diversify your options.",
    });
  }

  return risks;
}

function buildCareerForks(
  career: Career,
  evolution: ReturnType<typeof buildCareerEvolution>
): CareerFork[] {
  const forks: CareerFork[] = [];

  // Year 1–2 fork: generalist vs focused
  forks.push({
    yearRange: "Year 1–2",
    fork: "Generalist exploration vs. focused specialization",
    optionA: "Explore multiple adjacent areas broadly to find what fits",
    optionB: "Double down on a specific niche within the career early",
    recommendation: "Spend the first 6 months exploring broadly, then commit to a focused path once you have context.",
  });

  // Year 2–4 fork: technical depth vs breadth
  if (evolution.leadershipTrack.length > 0 || evolution.advancedSpecializationRoutes.length > 0) {
    forks.push({
      yearRange: "Year 2–4",
      fork: "Technical depth vs. leadership track",
      optionA: `Specialize as ${evolution.advancedSpecializationRoutes[0] ?? "a technical expert"}`,
      optionB: `Move toward ${evolution.leadershipTrack[0] ?? "team leadership"}`,
      recommendation: "Let your natural energy guide this choice — if you enjoy mentoring and strategy, lean leadership; if you enjoy deep problem-solving, lean specialization.",
    });
  }

  // Year 3–5 fork: stability vs risk
  forks.push({
    yearRange: "Year 3–5",
    fork: "Stability vs. high-risk / high-reward",
    optionA: "Stay in a stable mid-level role with predictable growth",
    optionB: `Pursue ${evolution.founderTrack[0] ?? "an entrepreneurial or high-growth opportunity"}`,
    recommendation: "Build savings and optionality first, then take the risk when you can absorb the downside.",
  });

  return forks;
}

function buildAlternateOutcomes(
  career: Career,
  pulse: ReturnType<typeof buildMarketPulse>
): AlternateOutcome[] {
  const outcomes: AlternateOutcome[] = [];

  // Optimistic outcome
  outcomes.push({
    scenario: "Fast-track growth",
    probability: pulse.trendDirection === "exploding" ? "high" : "moderate",
    description: `You accelerate faster than expected by landing in a high-growth environment early. By year 3 you are operating at a senior level with strong compensation growth.${
      pulse.trendDirection === "exploding"
        ? " Market tailwinds make this a realistic scenario."
        : ""
    }`,
  });

  // Pivot outcome
  outcomes.push({
    scenario: "Mid-course pivot",
    probability: "moderate",
    description: `After 2–3 years, you discover a related path that fits you better and make a lateral shift. The skills you built in ${career.coreSkill} transfer well, and the pivot adds valuable breadth.`,
  });

  // Challenging outcome
  outcomes.push({
    scenario: "Slow-burn trajectory",
    probability: "low",
    description: `Progress is slower than expected due to market conditions or difficulty finding the right fit. You may need multiple attempts to land the first role, but persistence pays off by year 5.`,
  });

  // AI-disruption outcome
  if (career.aiRelationship === "Automation-Heavy" || career.aiImpact === "transformative") {
    outcomes.push({
      scenario: "AI-driven transformation",
      probability: "high",
      description: `AI significantly changes how this role operates within 3–5 years. Early adopters of AI tools in this field gain a major advantage, while those who resist adaptation face narrowing opportunities.`,
    });
  }

  return outcomes;
}

// ============================================================================
// MAIN PUBLIC API
// ============================================================================

/**
 * Compute career scenarios for one or two careers.
 * Uses market-pulse, career-evolution, path-examples, and decision-assistant
 * to generate realistic year projections and signals.
 *
 * Provide `enhancedProfile` or `journeyMemory` for more personalized scenarios.
 */
export function computeCareerScenarios(
  careerAId: string,
  careerBId?: string,
  enhancedProfile?: EnhancedProfile,
  journeyMemory?: JourneyMemory
): CareerScenarioComparison | null {
  const careerA = getCareerById(careerAId);
  if (!careerA) return null;

  const careerB = careerBId ? getCareerById(careerBId) : undefined;

  const scenarioA = buildScenarioForCareer(careerA, enhancedProfile, journeyMemory);
  const scenarioB = careerB ? buildScenarioForCareer(careerB, enhancedProfile, journeyMemory) : null;

  const comparison: CareerScenarioComparison = {
    careerA: scenarioA,
    careerB: scenarioB,
    computedAt: new Date().toISOString(),
  };

  // Cache for fast reload
  const ids = careerBId ? `${careerAId},${careerBId}` : careerAId;
  cacheComparison(ids, comparison);

  return comparison;
}

function buildScenarioForCareer(
  career: Career,
  enhancedProfile?: EnhancedProfile,
  journeyMemory?: JourneyMemory
): CareerScenarioData {
  const pulse = buildMarketPulse(career);
  const evolution = buildCareerEvolution(career, enhancedProfile);
  const pathExamples = buildPathExamples(career, undefined, enhancedProfile);

  return {
    careerId: career.id,
    careerTitle: career.title,
    yearOneScenario: buildYearOneScenario(career, pulse, evolution, pathExamples),
    yearThreeScenario: buildYearThreeScenario(career, pulse, evolution, pathExamples),
    yearFiveScenario: buildYearFiveScenario(career, pulse, evolution),
    lifestyleSignals: buildLifestyleSignals(career, pulse),
    growthTrajectory: buildGrowthTrajectory(career, evolution, pulse),
    riskMoments: buildRiskMoments(career, pulse),
    careerForks: buildCareerForks(career, evolution),
    alternateOutcomes: buildAlternateOutcomes(career, pulse),
    computedAt: new Date().toISOString(),
  };
}

/**
 * Load the last computed career scenarios for a given career or comparison.
 * Returns null if no cached data exists.
 */
export function loadCareerScenarios(
  careerAId: string,
  careerBId?: string
): CareerScenarioComparison | null {
  const ids = careerBId ? `${careerAId},${careerBId}` : careerAId;
  return loadCachedComparison(ids);
}
