/**
 * MEMORY EVOLUTION INTELLIGENCE
 *
 * Answers: "How has this user's thinking changed over time?"
 *
 * Synthesizes from: journey-memory, career-story, future-self, insight-vault,
 *                   decision-confidence, growth-forecast, career-identity,
 *                   progress-reflection
 *
 * Outputs: thinkingShifts, identityEvolution, beliefChanges,
 *          confidenceEvolution, careerDirectionChanges, growthVelocity,
 *          majorTurningPoints, evolutionScore, timelineNarrative
 *
 * No backend. No auth. Stateless — computed fresh on each call.
 */

import { loadJourneyMemory } from "./journey-memory";
import { computeCareerStory, type CareerStoryData } from "./career-story";
import { getFutureSelf, type FutureSelfData } from "./future-self";
import { computeInsightVault, type InsightVaultData } from "./insight-vault";
import { getDecisionConfidence, type DecisionConfidenceData } from "./decision-confidence";
import { computeGrowthForecast, type GrowthForecastData } from "./growth-forecast";
import { getCareerIdentity, type CareerIdentity } from "./career-identity";
import { computeProgressReflection, type ProgressReflectionData } from "./progress-reflection";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface ConfidenceEvolution {
  before: number;
  after: number;
  trend: "rising" | "stable" | "declining" | "fluctuating";
}

export interface MemoryEvolutionData {
  /** Detected shifts in how the user thinks about careers */
  thinkingShifts: string[];
  /** How the user's identity has evolved over time */
  identityEvolution: string[];
  /** Changes in core beliefs about career direction */
  beliefChanges: string[];
  /** Confidence trajectory — before vs after */
  confidenceEvolution: ConfidenceEvolution;
  /** Notable changes in career direction preference */
  careerDirectionChanges: string[];
  /** Speed/velocity of growth and change (0–100) */
  growthVelocity: number;
  /** Key turning points identified across journey */
  majorTurningPoints: string[];
  /** Overall evolution score (0–100) */
  evolutionScore: number;
  /** Narrative summary of evolution */
  timelineNarrative: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface EvolutionContext {
  memory: ReturnType<typeof loadJourneyMemory>;
  story: CareerStoryData;
  futureSelf: FutureSelfData;
  vault: InsightVaultData;
  confidence: DecisionConfidenceData;
  forecast: GrowthForecastData;
  identity: CareerIdentity;
  progress: ProgressReflectionData;
}

function gatherContext(): EvolutionContext {
  return {
    memory: loadJourneyMemory(),
    story: computeCareerStory(),
    futureSelf: getFutureSelf(),
    vault: computeInsightVault(),
    confidence: getDecisionConfidence(),
    forecast: computeGrowthForecast(),
    identity: getCareerIdentity(),
    progress: computeProgressReflection(),
  };
}

// ============================================================================
// DETECTION HELPERS
// ============================================================================

function detectThinkingShifts(ctx: EvolutionContext): string[] {
  const shifts: string[] = [];
  const { vault, story, confidence } = ctx;

  // Belief shifts from insight vault
  if (vault.beliefShifts && vault.beliefShifts.length > 0) {
    shifts.push(...vault.beliefShifts.slice(0, 2));
  }

  // Identity changes
  if (vault.identityChanges && vault.identityChanges.length > 0) {
    shifts.push(...vault.identityChanges.slice(0, 2));
  }

  // Story arc indicates progression in thinking
  if (story.storyArc === "transition" || story.storyArc === "breakthrough") {
    shifts.push(`Career story moving through a ${story.storyArc} phase — thinking patterns are actively evolving.`);
  }

  // Stability from decision confidence reflects thinking maturity
  if (confidence.decisionStability === "stable") {
    shifts.push("Decision confidence has stabilized — thinking patterns are consolidating.");
  } else if (confidence.decisionStability === "fluctuating") {
    shifts.push("Confidence fluctuations suggest active re-evaluation of career assumptions.");
  }

  // Growth theme from career story
  if (story.growthTheme) {
    shifts.push(`Dominant growth theme: "${story.growthTheme}" — this shapes current thinking patterns.`);
  }

  return [...new Set(shifts)].slice(0, 6);
}

function detectIdentityEvolution(ctx: EvolutionContext): string[] {
  const evolutions: string[] = [];
  const { identity, vault, story, futureSelf } = ctx;

  // Career identity archetype
  evolutions.push(
    `Career archetype identified as "${identity.careerArchetype}" — ${identity.careerPersonaSummary.split(".")[0]}.`
  );

  // Growth style
  const styleLabels: Record<string, string> = {
    "focused-deep-diver": "focused deep-diver — concentrating on depth in chosen areas",
    "broad-explorer": "broad explorer — spanning multiple domains for wide coverage",
    "balanced-navigator": "balanced navigator — maintaining breadth with targeted depth",
  };
  evolutions.push(
    `Growth style: ${styleLabels[identity.growthStyle] ?? identity.growthStyle}.`
  );

  // Vault identity changes
  if (vault.identityChanges && vault.identityChanges.length > 0) {
    evolutions.push(...vault.identityChanges.slice(0, 2));
  }

  // Story arc signalling identity shift
  if (story.storyArc === "transition" || story.storyArc === "breakthrough") {
    evolutions.push("Identity is undergoing active change — career story arc shows fundamental evolution.");
  }

  // Future self — projected identity
  if (futureSelf.futureIdentity) {
    evolutions.push(`Projected future identity: "${futureSelf.futureIdentity}".`);
  }

  return [...new Set(evolutions)].slice(0, 6);
}

function detectBeliefChanges(ctx: EvolutionContext): string[] {
  const changes: string[] = [];
  const { vault, story, forecast } = ctx;

  // From insight vault
  if (vault.majorInsights && vault.majorInsights.length > 0) {
    const topInsights = vault.majorInsights
      .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
      .slice(0, 3);
    for (const insight of topInsights) {
      changes.push(insight.title ?? "Major insight recorded.");
    }
  }

  if (vault.beliefShifts && vault.beliefShifts.length > 0) {
    changes.push(...vault.beliefShifts.slice(0, 2));
  }

  // Story signals can indicate belief evolution
  if (story.storySignals && story.storySignals.length > 0) {
    const beliefRelated = story.storySignals.filter(
      (s) => s.toLowerCase().includes("belief") || s.toLowerCase().includes("realiz") || s.toLowerCase().includes("shift")
    );
    if (beliefRelated.length > 0) {
      changes.push(...beliefRelated.slice(0, 2));
    }
  }

  // Forecast trajectory influences belief outlook
  if (forecast.trajectoryStrength >= 60) {
    changes.push("Growing confidence in career trajectory — beliefs about future possibilities are expanding.");
  } else if (forecast.trajectoryStrength < 30) {
    changes.push("Uncertain trajectory may be challenging existing beliefs about career direction.");
  }

  return [...new Set(changes)].slice(0, 5);
}

function computeConfidenceEvolution(ctx: EvolutionContext): ConfidenceEvolution {
  const { memory, confidence } = ctx;
  const history = memory.confidenceHistory;

  if (history.length < 2) {
    return {
      before: confidence.confidenceScore,
      after: confidence.confidenceScore,
      trend: "stable",
    };
  }

  const before = history[0];
  const after = history[history.length - 1];
  const diff = after - before;

  // Determine trend
  const isFluctuating = confidence.decisionStability === "fluctuating";
  const threshold = 8;

  let trend: "rising" | "stable" | "declining" | "fluctuating";
  if (isFluctuating) {
    trend = "fluctuating";
  } else if (diff > threshold) {
    trend = "rising";
  } else if (diff < -threshold) {
    trend = "declining";
  } else {
    trend = "stable";
  }

  return { before, after, trend };
}

function detectCareerDirectionChanges(ctx: EvolutionContext): string[] {
  const changes: string[] = [];
  const { vault, story, futureSelf, memory, identity } = ctx;

  // Viewed career count changes suggest exploration breadth
  const viewedCount = Object.keys(memory.viewedCareers).length;
  if (viewedCount >= 10) {
    changes.push(`Explored ${viewedCount} careers — wide exploration suggests evolving preferences.`);
  } else if (viewedCount >= 5) {
    changes.push(`Explored ${viewedCount} careers — direction is narrowing with exposure.`);
  }

  // Career story turning points
  if (story.turningPoints && story.turningPoints.length > 0) {
    const recentPoints = story.turningPoints.slice(-2);
    for (const point of recentPoints) {
      changes.push(`Turning point: ${point.title ?? point.description ?? "Significant career event"}.`);
    }
  }

  // Decision breakthroughs from vault
  if (vault.decisionBreakthroughs && vault.decisionBreakthroughs.length > 0) {
    changes.push(...vault.decisionBreakthroughs.slice(0, 2));
  }

  // Future self — likely career evolution
  if (futureSelf.likelyCareerEvolution && futureSelf.likelyCareerEvolution.length > 0) {
    const nextStep = futureSelf.likelyCareerEvolution[0];
    changes.push(`Projected next evolution: ${nextStep.description ?? "Career progression step"}.`);
  }

  // Focus pattern from career identity
  const focusLabels: Record<string, string> = {
    "niche-specialist": "Direction is narrowing toward specialization.",
    "focused-explorer": "Direction is focused but still exploratory.",
    "broad-generalist": "Direction remains broad with wide career exploration.",
  };
  if (focusLabels[identity.focusPattern]) {
    changes.push(focusLabels[identity.focusPattern]);
  }

  return [...new Set(changes)].slice(0, 5);
}

function computeGrowthVelocity(ctx: EvolutionContext): number {
  const { memory, identity, progress, confidence, forecast, vault } = ctx;
  let velocity = 30; // baseline

  // Confidence trend (0–20)
  const confHistory = memory.confidenceHistory;
  if (confHistory.length >= 2) {
    const first = confHistory[0];
    const last = confHistory[confHistory.length - 1];
    const confGrowth = Math.max(0, last - first);
    velocity += Math.min(20, confGrowth);
  }

  // Progress rate (0–20)
  velocity += Math.min(20, progress.progressRate * 0.2);

  // Forecast trajectory (0–15)
  velocity += Math.min(15, forecast.trajectoryStrength * 0.15);

  // Identity evolution — higher level = more velocity (0–15)
  const level = parseInt(identity.identityTitle.match(/\d+/)?.[0] ?? "1", 10);
  velocity += Math.min(15, (level - 1) * 5);

  // Vault score (0–10)
  velocity += Math.min(10, vault.vaultScore * 0.1);

  // Confidence score adjustment (0–10)
  velocity += Math.min(10, confidence.confidenceScore * 0.1);

  // Decision stability bonus
  if (confidence.decisionStability === "stable") velocity += 5;
  else if (confidence.decisionStability === "emerging") velocity -= 5;

  return Math.round(Math.max(0, Math.min(100, velocity)));
}

function detectMajorTurningPoints(ctx: EvolutionContext): string[] {
  const points: string[] = [];
  const { story, vault, memory, progress } = ctx;

  // Career story turning points
  if (story.turningPoints && story.turningPoints.length > 0) {
    for (const point of story.turningPoints.slice(0, 3)) {
      const label = point.title ?? point.description ?? "Significant moment";
      points.push(label);
    }
  }

  // Major moments from career story
  if (story.majorMoments && story.majorMoments.length > 0) {
    for (const moment of story.majorMoments.slice(0, 2)) {
      points.push(moment.title);
    }
  }

  // Decision breakthroughs
  if (vault.decisionBreakthroughs && vault.decisionBreakthroughs.length > 0) {
    points.push(...vault.decisionBreakthroughs.slice(0, 2));
  }

  // Milestone completions
  const milestones = progress.winsSummary.length;
  if (milestones > 0) {
    points.push(`Achieved ${milestones} milestone${milestones > 1 ? "s" : ""} in recent progress.`);
  }

  return [...new Set(points)].slice(0, 6);
}

function computeEvolutionScore(ctx: EvolutionContext): number {
  const { confidence, forecast, progress, identity, vault } = ctx;
  let score = 30; // baseline

  // Confidence score contribution (0–20)
  score += Math.min(20, confidence.confidenceScore * 0.2);

  // Growth velocity contribution (0–15) — already computed
  const velocity = computeGrowthVelocity(ctx);
  score += Math.min(15, velocity * 0.15);

  // Forecast trajectory (0–15)
  score += Math.min(15, forecast.trajectoryStrength * 0.15);

  // Progress rate (0–15)
  score += Math.min(15, progress.progressRate * 0.15);

  // Vault score — depth of insights (0–15)
  score += Math.min(15, vault.vaultScore * 0.15);

  // Identity level bonus (0–10)
  const level = parseInt(identity.identityTitle.match(/\d+/)?.[0] ?? "1", 10);
  score += Math.min(10, (level - 1) * 3);

  // Future self confidence (0–10)
  score += Math.min(10, ctx.futureSelf.confidenceScore * 0.1);

  return Math.round(Math.max(0, Math.min(100, score)));
}

function buildTimelineNarrative(ctx: EvolutionContext): string {
  const parts: string[] = [];
  const { story, identity, confidence, progress, vault } = ctx;

  // Opening — current state
  const evalScore = computeEvolutionScore(ctx);
  if (evalScore >= 65) {
    parts.push("Your career thinking has evolved significantly.");
  } else if (evalScore >= 40) {
    parts.push("Your career thinking is in active evolution.");
  } else {
    parts.push("Your career thinking is just beginning to take shape.");
  }

  // Story arc context
  parts.push(
    `You are in a ${story.storyArc} phase, with a "${story.growthTheme}" theme guiding your growth.`
  );

  // Identity evolution
  parts.push(
    `Your identity is forming as a ${identity.careerArchetype}, with a ${identity.growthStyle.replace(/-/g, " ")} approach.`
  );

  // Confidence trajectory
  const confEvo = computeConfidenceEvolution(ctx);
  if (confEvo.trend === "rising") {
    parts.push(`Confidence has grown from ${confEvo.before}% to ${confEvo.after}% — a clear upward trend.`);
  } else if (confEvo.trend === "declining") {
    parts.push(`Confidence has eased from ${confEvo.before}% to ${confEvo.after}% — a period of recalibration.`);
  } else if (confEvo.trend === "fluctuating") {
    parts.push("Confidence has fluctuated — reflecting active exploration and evolving self-assessment.");
  } else {
    parts.push(`Confidence has remained steady at ${confEvo.after}%.`);
  }

  // Major insight highlight
  if (vault.topInsight) {
    parts.push(`Key insight: "${vault.topInsight.title ?? vault.topInsight.description}".`);
  }

  // Progress momentum
  if (progress.momentumSignal === "rising") {
    parts.push("Your progress momentum is rising — evolution is accelerating.");
  } else if (progress.momentumSignal === "slipping") {
    parts.push("Momentum has dipped — this may be a natural pause before the next evolution phase.");
  }

  // Turning point count
  const turningPoints = detectMajorTurningPoints(ctx);
  if (turningPoints.length > 0) {
    parts.push(`${turningPoints.length} major turning point${turningPoints.length > 1 ? "s" : ""} identified across your journey.`);
  }

  // Closing — future projection
  if (ctx.futureSelf.trajectoryStrength >= 55) {
    parts.push("Your trajectory suggests continued evolution toward a more defined career identity.");
  } else {
    parts.push("Continued exploration will further clarify your evolving career identity.");
  }

  return parts.join(" ");
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full memory evolution intelligence from all available data sources.
 */
export function computeMemoryEvolution(): MemoryEvolutionData {
  const ctx = gatherContext();

  const thinkingShifts = detectThinkingShifts(ctx);
  const identityEvolution = detectIdentityEvolution(ctx);
  const beliefChanges = detectBeliefChanges(ctx);
  const confidenceEvolution = computeConfidenceEvolution(ctx);
  const careerDirectionChanges = detectCareerDirectionChanges(ctx);
  const growthVelocity = computeGrowthVelocity(ctx);
  const majorTurningPoints = detectMajorTurningPoints(ctx);
  const evolutionScore = computeEvolutionScore(ctx);
  const timelineNarrative = buildTimelineNarrative(ctx);

  return {
    thinkingShifts,
    identityEvolution,
    beliefChanges,
    confidenceEvolution,
    careerDirectionChanges,
    growthVelocity,
    majorTurningPoints,
    evolutionScore,
    timelineNarrative,
  };
}
