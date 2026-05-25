/**
 * DECISION ASSISTANT INTELLIGENCE
 *
 * Helps users decide between competing career paths by analyzing
 * comparison-history, quiz profile, journey-memory, market-pulse,
 * and career-identity signals.
 *
 * No backend. No external AI. Persisted locally via SafeStorage.
 */

import { getSafeStorage } from "./safe-storage";
import { loadComparisonHistory } from "./comparison-history";
import { loadJourneyMemory } from "./journey-memory";
import type { ExtendedTraitScores, EnhancedProfile } from "./quiz-enhanced";
import { buildMarketPulse } from "./market-pulse";
import { getCareerIdentity } from "./career-identity";
import { getCareerById, type Career } from "./careers";


const STORAGE_KEY = "corepath-decision-assistant";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface DecisionAnalysis {
  /** The two careers being compared */
  careerA: Career;
  careerB: Career;
  /** Confidence that one path is clearly better (0-100) */
  decisionConfidence: number;
  /** Unique strengths per career */
  careerPros: {
    careerA: string[];
    careerB: string[];
  };
  /** Key tradeoffs the user should weigh */
  careerTradeoffs: string[];
  /** Reasons each career aligns with the user's profile */
  alignmentReasons: string[];
  /** Factors that make this decision risky or uncertain */
  riskFactors: string[];
  /** Signals that break ties between close options */
  tieBreakerSignals: string[];
  /** A synthesized "if choosing between A vs B…" narrative */
  recommendationNarrative: string;
  /** Timestamp of analysis */
  computedAt: string;
}

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

const EXTENDED_TRAITS: Array<keyof ExtendedTraitScores> = [
  "systems-thinking",
  "abstraction",
  "ambiguity-tolerance",
  "deep-work",
  "experimentation",
  "optimization",
  "execution-speed",
  "research-orientation",
  "people-orientation",
  "autonomy",
  "risk-tolerance",
  "stability-preference",
  "creativity",
  "technical-depth",
  "visual-thinking",
  "operational-thinking",
  "leadership",
  "adaptability",
  "learning-velocity",
  "future-orientation",
  "AI-curiosity",
  "AI-builder",
  "AI-user",
];

interface CareerSignalVector {
  traits: Record<string, number>;
  categories: string[];
  domains: string[];
  aiRelationship: string | undefined;
  futureDemand: string | undefined;
  difficulty: string | undefined;
  timeToJob: string | undefined;
  salary: string | undefined;
}

function buildSignalVector(career: Career): CareerSignalVector {
  const traits: Record<string, number> = {};

  // Map quiz_traits to extended traits
  const t = career.quiz_traits ?? [];
  for (const trait of t) {
    switch (trait) {
      case "analytical":
        traits["systems-thinking"] = (traits["systems-thinking"] ?? 0) + 0.5;
        traits["abstraction"] = (traits["abstraction"] ?? 0) + 0.5;
        break;
      case "technical-depth":
        traits["technical-depth"] = (traits["technical-depth"] ?? 0) + 1;
        traits["deep-work"] = (traits["deep-work"] ?? 0) + 0.4;
        break;
      case "structure":
        traits["operational-thinking"] = (traits["operational-thinking"] ?? 0) + 0.6;
        traits["deep-work"] = (traits["deep-work"] ?? 0) + 0.4;
        break;
      case "creativity":
        traits["experimentation"] = (traits["experimentation"] ?? 0) + 0.7;
        traits["AI-curiosity"] = (traits["AI-curiosity"] ?? 0) + 0.3;
        break;
      case "leadership":
        traits["leadership"] = (traits["leadership"] ?? 0) + 0.8;
        traits["autonomy"] = (traits["autonomy"] ?? 0) + 0.4;
        break;
      case "social":
        traits["people-orientation"] = (traits["people-orientation"] ?? 0) + 0.8;
        traits["leadership"] = (traits["leadership"] ?? 0) + 0.2;
        break;
      case "visual":
        traits["visual-thinking"] = (traits["visual-thinking"] ?? 0) + 0.9;
        traits["creativity"] = (traits["creativity"] ?? 0) + 0.3;
        break;
      case "risk-tolerance":
        traits["risk-tolerance"] = (traits["risk-tolerance"] ?? 0) + 0.8;
        traits["adaptability"] = (traits["adaptability"] ?? 0) + 0.4;
        break;
      default:
        break;
    }
  }

  // Normalize
  const max = Math.max(...Object.values(traits), 1);
  for (const key of Object.keys(traits)) {
    traits[key] = Math.round(((traits[key] ?? 0) / max) * 100) / 100;
  }

  return {
    traits,
    categories: [career.category],
    domains: career.domain ? [career.domain] : [],
    aiRelationship: career.aiRelationship,
    futureDemand: career.futureDemand,
    difficulty: career.difficulty,
    timeToJob: career.timeToJob,
    salary: career.salary,
  };
}

function computeTraitAlignment(
  userTraits: ExtendedTraitScores,
  careerVector: CareerSignalVector
): number {
  let total = 0;
  let matched = 0;

  for (const trait of EXTENDED_TRAITS) {
    const userVal = userTraits[trait] ?? 0;
    const careerVal = careerVector.traits[trait] ?? 0;
    if (careerVal > 0) {
      total += userVal * careerVal;
      matched++;
    }
  }

  if (matched === 0) return 0.5;
  return Math.min(1, total / matched);
}

function computeDecisionConfidence(
  scoreA: number,
  scoreB: number,
  contradictions: number,
  comparisonCount: number
): number {
  const gap = Math.abs(scoreA - scoreB);
  let confidence = gap * 100; // 0-100 based on alignment gap

  // Penalize for contradictions (mixed signals)
  confidence -= contradictions * 8;

  // Bonus for having done multiple comparisons (more data = more confidence)
  if (comparisonCount >= 3) confidence += 5;
  if (comparisonCount >= 5) confidence += 5;

  // Cap
  return Math.max(10, Math.min(95, Math.round(confidence)));
}

function buildCareerPros(
  career: Career,
  signalVector: CareerSignalVector,
  marketPulse: ReturnType<typeof buildMarketPulse>
): string[] {
  const pros: string[] = [];

  // Core skill advantage
  pros.push(`Core skill in ${career.coreSkill} offers strong foundational leverage.`);

  // Demand signal
  if (career.futureDemand === "Exploding" || career.futureDemand === "High Growth") {
    pros.push(`Projected ${career.futureDemand.toLowerCase()} demand — strong hiring outlook.`);
  }

  // Difficulty-based
  if (career.difficulty !== "transformative") {
    pros.push(`Achievable entry path with ${career.timeToJob ?? "reasonable"} time to job.`);
  }

  // AI relationship
  if (career.aiRelationship === "AI-Augmented" || career.aiRelationship === "AI-Created") {
    pros.push(`Positioned at the AI frontier — future-proof skillset.`);
  } else if (career.aiRelationship === "Human-Centered") {
    pros.push(`Less exposed to automation risk — human-centered role.`);
  }

  // Market pulse
  if (marketPulse.futureDemandScore >= 70) {
    pros.push(`Strong market score (${marketPulse.futureDemandScore}/100) with healthy growth trajectory.`);
  }

  // Adjacent roles
  if (marketPulse.newAdjacentRoles.length >= 2) {
    pros.push(`Opens paths to adjacent roles like ${marketPulse.newAdjacentRoles.slice(0, 2).join(" and ")}.`);
  }

  return pros.slice(0, 5);
}

function buildTradeoffs(
  careerA: Career,
  careerB: Career,
  signalsA: CareerSignalVector,
  signalsB: CareerSignalVector
): string[] {
  const tradeoffs: string[] = [];

  // Time-to-job comparison
  if (signalsA.timeToJob !== signalsB.timeToJob) {
    tradeoffs.push(
      `${careerA.title} reaches leverage in ${signalsA.timeToJob}, while ${careerB.title} takes ${signalsB.timeToJob} — faster entry vs deeper investment.`
    );
  }

  // Difficulty comparison
  if (signalsA.difficulty !== signalsB.difficulty) {
    tradeoffs.push(
      `${careerA.title} is ${signalsA.difficulty} difficulty; ${careerB.title} is ${signalsB.difficulty} — choose based on your risk tolerance for learning curves.`
    );
  }

  // Salary comparison (rough)
  const salaryA = signalsA.salary ? parseInt(signalsA.salary.replace(/[^0-9]/g, ""), 10) || 0 : 0;
  const salaryB = signalsB.salary ? parseInt(signalsB.salary.replace(/[^0-9]/g, ""), 10) || 0 : 0;
  if (salaryA > 0 && salaryB > 0 && Math.abs(salaryA - salaryB) > 30) {
    const higher = salaryA > salaryB ? careerA.title : careerB.title;
    tradeoffs.push(`${higher} offers higher typical compensation, but may come with steeper expectations.`);
  }

  // Category/domain breadth
  if (careerA.category !== careerB.category) {
    tradeoffs.push(
      `${careerA.title} sits in ${careerA.category}, while ${careerB.title} is in ${careerB.category} — different ecosystems and network effects.`
    );
  }

  // AI relationship tradeoff
  if (signalsA.aiRelationship !== signalsB.aiRelationship) {
    const moreAI = signalsA.aiRelationship === "AI-Augmented" || signalsA.aiRelationship === "AI-Created" || signalsA.aiRelationship === "Automation-Heavy"
      ? careerA.title : careerB.title;
    const lessAI = moreAI === careerA.title ? careerB.title : careerA.title;
    tradeoffs.push(`${moreAI} is more AI-integrated; ${lessAI} retains more traditional human-centered work.`);
  }

  return tradeoffs;
}

function buildAlignmentReasons(
  careerA: Career,
  careerB: Career,
  scoreA: number,
  scoreB: number,
  userTraits: ExtendedTraitScores | null,
  userArchetype: string
): string[] {
  const reasons: string[] = [];
  const topTraits = userTraits
    ? Object.entries(userTraits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k]) => k.replace(/-/g, " "))
    : [];

  if (topTraits.length > 0) {
    reasons.push(
      `Your strongest signals (${topTraits.join(", ")}) align differently with each path.`
    );
  }

  const gap = Math.abs(scoreA - scoreB);
  if (gap > 0.15) {
    const better = scoreA > scoreB ? careerA.title : careerB.title;
    const worse = scoreA > scoreB ? careerB.title : careerA.title;
    reasons.push(
      `${better} shows stronger cognitive alignment with your profile than ${worse} by a meaningful margin.`
    );
  } else {
    reasons.push(
      `Both careers show broadly compatible alignment with your thinking style.`
    );
  }

  reasons.push(
    `Your career archetype (${userArchetype}) tends to favor paths that match your exploration pattern.`
  );

  return reasons;
}

function buildRiskFactors(
  careerA: Career,
  careerB: Career,
  userTraits: ExtendedTraitScores | null,
  contradictions: number
): string[] {
  const risks: string[] = [];

  // Contradiction-based risk
  if (contradictions >= 2) {
    risks.push("Your quiz profile shows multiple contradictory preferences, making any single career choice carry more uncertainty.");
  }

  // AI automation risk
  for (const career of [careerA, careerB]) {
    if (career.aiRelationship === "Automation-Heavy") {
      risks.push(`${career.title} has high automation exposure — focus on strategic skills to stay resilient.`);
    }
  }

  // Entry difficulty risk
  for (const career of [careerA, careerB]) {
    if (career.difficulty === "high" || career.difficulty === "transformative") {
      risks.push(`${career.title} requires significant upfront investment with longer time to mastery.`);
    }
  }

  // Declining demand risk
  for (const career of [careerA, careerB]) {
    if (career.futureDemand === "Declining") {
      risks.push(`${career.title} faces softening demand — consider the long-term trajectory carefully.`);
    }
  }

  // If too few risks, add a general one
  if (risks.length === 0) {
    risks.push("Both careers are relatively low-risk choices. Your main risk is delaying commitment by over-comparing.");
  }

  return risks;
}

function buildTieBreakerSignals(
  careerA: Career,
  careerB: Career,
  scoreA: number,
  scoreB: number,
  comparisonCount: number,
  userTraits: ExtendedTraitScores | null
): string[] {
  const signals: string[] = [];

  // Profile alignment gap as tiebreaker
  const gap = Math.abs(scoreA - scoreB);
  if (gap > 0.2) {
    const better = scoreA > scoreB ? careerA.title : careerB.title;
    signals.push(`Your profile alignment score favors ${better} — trust the data if both options feel equally attractive.`);
  } else if (gap > 0.05) {
    const slightBetter = scoreA > scoreB ? careerA.title : careerB.title;
    signals.push(`Slight edge for ${slightBetter} based on thinking-style alignment, but the difference is small.`);
  }

  // Future demand as tiebreaker
  const demandOrder: Record<string, number> = { Exploding: 4, "High Growth": 3, Stable: 2, Declining: 1 };
  const demandA = demandOrder[careerA.futureDemand ?? "Stable"] ?? 2;
  const demandB = demandOrder[careerB.futureDemand ?? "Stable"] ?? 2;
  if (demandA !== demandB) {
    const higher = demandA > demandB ? careerA.title : careerB.title;
    const lower = demandA > demandB ? careerB.title : careerA.title;
    signals.push(`${higher} has stronger future demand projections than ${lower} — a practical tiebreaker.`);
  }

  // Comparison history — if user has compared these before
  if (comparisonCount > 0) {
    signals.push(`You've compared careers ${comparisonCount} time${comparisonCount === 1 ? "" : "s"} before — review your past comparisons for patterns.`);
  }

  // Time-to-job as tiebreaker
  if (gap < 0.15 && careerA.timeToJob !== careerB.timeToJob) {
    const faster = careerA.timeToJob && careerB.timeToJob
      ? (parseInt(careerA.timeToJob) < parseInt(careerB.timeToJob) ? careerA.title : careerB.title)
      : null;
    if (faster) {
      signals.push(`If speed matters, ${faster} has a faster typical time to job.`);
    }
  }

  // Archetype-based tiebreaker
  if (userTraits) {
    const aiCuriosity = userTraits["AI-curiosity"] ?? 0;
    const stabilityPref = userTraits["stability-preference"] ?? 0;
    if (aiCuriosity > 0.6) {
      const moreAI = (careerA.aiRelationship === "AI-Augmented" || careerA.aiRelationship === "AI-Created") ? careerA.title :
                     (careerB.aiRelationship === "AI-Augmented" || careerB.aiRelationship === "AI-Created") ? careerB.title : null;
      if (moreAI) {
        signals.push(`Your high AI curiosity suggests ${moreAI} could be more engaging day-to-day.`);
      }
    }
    if (stabilityPref > 0.6) {
      const moreStable = (careerA.futureDemand === "Stable" || careerA.futureDemand === "High Growth") ? careerA.title :
                         (careerB.futureDemand === "Stable" || careerB.futureDemand === "High Growth") ? careerB.title : null;
      if (moreStable) {
        signals.push(`${moreStable} aligns with your stability preference — a safer long-term bet.`);
      }
    }
  }

  return signals.slice(0, 5);
}

function buildRecommendationNarrative(
  careerA: Career,
  careerB: Career,
  scoreA: number,
  scoreB: number,
  confidence: number,
  tieBreakers: string[]
): string {
  const gap = Math.abs(scoreA - scoreB);
  const prefix = `Choosing between ${careerA.title} and ${careerB.title}`;

  if (confidence >= 70) {
    const winner = scoreA > scoreB ? careerA.title : careerB.title;
    const loser = scoreA > scoreB ? careerB.title : careerA.title;
    return `${prefix}: Your profile leans toward ${winner}. ${winner} maps better to your thinking style and career signals than ${loser}. ${tieBreakers.length > 0 ? tieBreakers[0] : ""}`;
  }

  if (confidence >= 45) {
    const lean = scoreA > scoreB ? careerA.title : careerB.title;
    const alt = scoreA > scoreB ? careerB.title : careerA.title;
    return `${prefix}: Your profile shows a moderate lean toward ${lean}, but ${alt} remains a strong alternative. Consider the tiebreakers: ${tieBreakers.slice(0, 2).join(" ")}`;
  }

  if (gap > 0.05) {
    const slight = scoreA > scoreB ? careerA.title : careerB.title;
    return `${prefix}: The signals are close. ${slight} has a slight edge, but either path could work well. Focus on which daily work style appeals more.`;
  }

  return `${prefix}: The analysis shows very similar alignment for both careers. Your personal preference for day-to-day work style and risk tolerance should guide the final decision.`;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Analyze a decision between two career paths.
 * Requires the user's quiz profile for personalized analysis.
 */
export function analyzeDecision(
  careerAId: string,
  careerBId: string,
  enhancedProfile?: EnhancedProfile
): DecisionAnalysis | null {
  const careerA = getCareerById(careerAId);
  const careerB = getCareerById(careerBId);
  if (!careerA || !careerB) return null;

  const userTraits = enhancedProfile?.extended ?? null;
  const contradictions = enhancedProfile?.contradictions.length ?? 0;

  // Build signal vectors
  const signalsA = buildSignalVector(careerA);
  const signalsB = buildSignalVector(careerB);

  // Market pulse for each career
  const marketPulseA = buildMarketPulse(careerA);
  const marketPulseB = buildMarketPulse(careerB);

  // Trait alignment scores
  const scoreA = userTraits ? computeTraitAlignment(userTraits, signalsA) : 0.5;
  const scoreB = userTraits ? computeTraitAlignment(userTraits, signalsB) : 0.5;

  // Journey context
  const memory = loadJourneyMemory();
  const comparisonHistory = loadComparisonHistory();
  const comparisonCount = comparisonHistory.length;

  // Career identity
  const identity = getCareerIdentity();
  const userArchetype = identity.careerArchetype;

  // Build analysis
  const decisionConfidence = computeDecisionConfidence(scoreA, scoreB, contradictions, comparisonCount);
  const careerTradeoffs = buildTradeoffs(careerA, careerB, signalsA, signalsB);
  const alignmentReasons = buildAlignmentReasons(careerA, careerB, scoreA, scoreB, userTraits, userArchetype);
  const riskFactors = buildRiskFactors(careerA, careerB, userTraits, contradictions);
  const tieBreakerSignals = buildTieBreakerSignals(careerA, careerB, scoreA, scoreB, comparisonCount, userTraits);
  const recommendationNarrative = buildRecommendationNarrative(careerA, careerB, scoreA, scoreB, decisionConfidence, tieBreakerSignals);

  const analysis: DecisionAnalysis = {
    careerA,
    careerB,
    decisionConfidence,
    careerPros: {
      careerA: buildCareerPros(careerA, signalsA, marketPulseA),
      careerB: buildCareerPros(careerB, signalsB, marketPulseB),
    },
    careerTradeoffs,
    alignmentReasons,
    riskFactors,
    tieBreakerSignals,
    recommendationNarrative,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, analysis);

  return analysis;
}

/**
 * Load the most recent decision analysis from cache.
 */
export function loadLastDecisionAnalysis(): DecisionAnalysis | null {
  try {
    const storage = getSafeStorage({ silent: true });
    const cached = storage.get<DecisionAnalysis>(STORAGE_KEY);
    if (!cached) return null;
    // Stale after 24 hours
    const elapsed = Date.now() - new Date(cached.computedAt).getTime();
    if (elapsed > 24 * 60 * 60 * 1000) return null;
    return cached;
  } catch {
    return null;
  }
}

/**
 * Format decision confidence as label + color class.
 */
export function formatDecisionConfidence(confidence: number): {
  label: string;
  color: string;
} {
  if (confidence >= 70) return { label: "Strong signal", color: "text-emerald-400" };
  if (confidence >= 45) return { label: "Moderate signal", color: "text-yellow-400" };
  if (confidence >= 25) return { label: "Weak signal", color: "text-orange-400" };
  return { label: "Inconclusive", color: "text-core-muted" };
}
