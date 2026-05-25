/**
 * CAREER STORY INTELLIGENCE
 *
 * Answers: "How is the user's journey story evolving?"
 *
 * Synthesizes career-momentum, future-self, journey-memory, achievement-engine,
 * career-identity, mission-intelligence, and decision-confidence into a
 * narrative arc with chapters, turning points, and next-chapter predictions.
 *
 * Sources:
 *   - future-self          → trajectoryStrength, risk/catalyst ratio
 *   - career-momentum      → momentumScore, momentumTrend, accelerationSignals
 *   - journey-memory       → completedQuizzes, retakes, viewedCareers, confidenceHistory
 *   - achievement-engine   → level, XP, unlockedAchievements, milestones
 *   - career-identity      → archetype, growthStyle, identityTitle
 *   - mission-intelligence → missionScore, missionBlocks
 *   - decision-confidence  → confidenceScore, decisionStability
 *
 * Detection areas:
 *   - First breakthrough     → crossing milestone thresholds
 *   - Confidence jumps       → confidenceHistory deltas
 *   - Identity changes       → archetype/growthStyle patterns
 *   - Streak milestones      → momentum/consistency
 *   - Career pivots          → switching/retake patterns
 *   - Mission shifts         → missionScore trends
 *
 * Behavior:
 *   - momentumScore >= 60 → "Momentum Chapter"
 *   - momentumScore < 40  → "Rebuilding Chapter"
 *
 * No backend. No auth. Pure client-side computation.
 */

import { getFutureSelf } from "./future-self";
import { getCareerMomentum } from "./career-momentum";
import { loadJourneyMemory } from "./journey-memory";
import { loadAchievements, computeAchievements } from "./achievement-engine";
import { getCareerIdentity } from "./career-identity";
import { getMissionIntelligence } from "./mission-intelligence";
import { getDecisionConfidence } from "./decision-confidence";
import type { JourneyMemory } from "./journey-memory";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type StoryStage = "early" | "building" | "accelerating" | "established";
export type StoryArc = "discovery" | "growth" | "breakthrough" | "mastery" | "transition";

export interface TurningPoint {
  type: "first_breakthrough" | "confidence_jump" | "identity_change" | "streak_milestone" | "career_pivot" | "mission_shift";
  title: string;
  description: string;
}

export interface MajorMoment {
  type: "milestone" | "achievement" | "insight" | "completion" | "change";
  title: string;
  impact: "low" | "medium" | "high";
}

export interface CareerStoryData {
  /** Current narrative stage */
  storyStage: StoryStage;
  /** Overarching story arc direction */
  storyArc: StoryArc;
  /** Key turning points that shaped the journey */
  turningPoints: TurningPoint[];
  /** Major moments of significance */
  majorMoments: MajorMoment[];
  /** Dominant growth theme */
  growthTheme: string;
  /** Observable story signals */
  storySignals: string[];
  /** Current chapter title */
  chapterTitle: string;
  /** Momentum score for display/chapter coloring */
  momentumScore: number;
  /** Prediction for the next chapter */
  nextChapterPrediction: string;
  /** Full narrative summary */
  narrativeSummary: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function computeStoryStage(level: number, momentumScore: number, completedQuizzes: number): StoryStage {
  if (level <= 1 && momentumScore < 30 && completedQuizzes <= 2) return "early";
  if (momentumScore >= 60 && level >= 3 && completedQuizzes >= 10) return "established";
  if (momentumScore >= 50 || level >= 2 || completedQuizzes >= 5) return "accelerating";
  if (momentumScore >= 25 || completedQuizzes >= 1) return "building";
  return "early";
}

function computeStoryArc(
  momentumTrend: string,
  momentumScore: number,
  trajectoryStrength: number
): StoryArc {
  if (momentumTrend === "accelerating" && momentumScore >= 60 && trajectoryStrength >= 50) return "breakthrough";
  if (momentumTrend === "accelerating" && momentumScore >= 40) return "growth";
  if (momentumTrend === "steady" && trajectoryStrength >= 40) return "growth";
  if (momentumTrend === "slowing") return "transition";
  if (momentumTrend === "stalled" || momentumScore < 25) return "discovery";
  if (trajectoryStrength >= 60) return "mastery";
  return "discovery";
}

function detectConfidenceJumps(
  confidenceHistory: number[]
): { jumps: number; avgDelta: number } {
  if (confidenceHistory.length < 2) return { jumps: 0, avgDelta: 0 };
  let jumps = 0;
  let totalDelta = 0;
  for (let i = 1; i < confidenceHistory.length; i++) {
    const delta = confidenceHistory[i] - confidenceHistory[i - 1];
    if (delta >= 15) jumps++;
    totalDelta += delta;
  }
  return { jumps, avgDelta: Math.round(totalDelta / (confidenceHistory.length - 1)) };
}

function computeGrowthTheme(
  storyArc: StoryArc,
  archetype: string,
  momentumScore: number
): string {
  if (momentumScore >= 60) return "Rapid growth & forward momentum";
  if (momentumScore < 30) return "Foundational rebuilding & exploration";

  const themes: Record<string, string[]> = {
    architect: ["Systematic career design", "Building structural expertise", "Deepening technical foundations"],
    innovator: ["Frontier exploration & AI adoption", "Experimentation-driven growth", "Pioneering new capabilities"],
    researcher: ["Curiosity-led discovery", "Evidence-based career building", "Analytical depth & insight"],
    strategist: ["Strategic career positioning", "Big-picture navigation", "Leadership & vision development"],
    builder: ["Hands-on skill accumulation", "Execution-focused mastery", "Craftsmanship & depth"],
    navigator: ["Balanced multi-domain growth", "Versatile skill weaving", "Intentional exploration"],
    explorer: ["Foundational career discovery", "Building awareness & direction", "Early pathfinding"],
  };

  const arcThemes: Record<StoryArc, string> = {
    discovery: "Early exploration & pathfinding",
    growth: "Active skill & confidence building",
    breakthrough: "Accelerating momentum & capability",
    mastery: "Deepening expertise & consistency",
    transition: "Course correction & realignment",
  };

  const archetypeThemes = themes[archetype];
  if (archetypeThemes && momentumScore >= 40) {
    // Deterministic selection based on story arc index to ensure stability
    const arcIndex = ["discovery", "growth", "breakthrough", "mastery", "transition"].indexOf(storyArc);
    return archetypeThemes[Math.max(0, Math.min(arcIndex, archetypeThemes.length - 1))];
  }

  return arcThemes[storyArc];
}

function computeChapterTitle(
  momentumScore: number,
  storyArc: StoryArc,
  storyStage: StoryStage
): string {
  // Behavior: High momentum → "Momentum Chapter", Low momentum → "Rebuilding Chapter"
  if (momentumScore >= 60) return "Momentum Chapter";
  if (momentumScore < 40) return "Rebuilding Chapter";

  const midTitles: Record<StoryArc, string> = {
    discovery: "Discovery Chapter",
    growth: "Growth Chapter",
    breakthrough: "Breakthrough Chapter",
    mastery: "Mastery Chapter",
    transition: "Transition Chapter",
  };
  return midTitles[storyArc];
}

function computeNextChapterPrediction(
  momentumScore: number,
  momentumTrend: string,
  storyArc: StoryArc,
  trajectoryStrength: number,
  missionScore: number
): string {
  if (momentumScore >= 60) {
    if (trajectoryStrength >= 60) return "Continued acceleration — likely entering a mastery phase with deepening expertise.";
    return "Sustained momentum ahead — expect more breakthrough moments and expanding capability.";
  }
  if (momentumScore < 40) {
    if (trajectoryStrength >= 40) return "Recovery likely — foundation is building beneath the surface. Expect a gradual return to momentum.";
    return "Continued exploration phase — small wins will compound into renewed confidence.";
  }
  if (momentumTrend === "accelerating" && missionScore >= 50) {
    return "Momentum is building — next chapter may bring a significant breakthrough.";
  }
  if (momentumTrend === "slowing") {
    return "A transition phase may be ahead — recalibrating could open new opportunities.";
  }
  return "Steady growth continues — consistency is building toward the next inflection point.";
}

function buildNarrativeSummary(
  storyStage: StoryStage,
  storyArc: StoryArc,
  growthTheme: string,
  chapterTitle: string,
  momentumScore: number,
  turningPoints: TurningPoint[],
  majorMoments: MajorMoment[]
): string {
  const parts: string[] = [];

  switch (storyStage) {
    case "early":
      parts.push("Your career journey is in its early stages, with foundational exploration shaping your path.");
      break;
    case "building":
      parts.push("You're actively building career intelligence — each session adds a new layer to your understanding.");
      break;
    case "accelerating":
      parts.push("Your journey is accelerating — confidence and momentum are compounding as you engage more deeply.");
      break;
    case "established":
      parts.push("You've established a strong career intelligence practice — sustained engagement is driving meaningful growth.");
      break;
  }

  if (turningPoints.length > 0) {
    const top = turningPoints[0];
    parts.push(`A key turning point: ${top.title}.`);
  }

  if (majorMoments.length > 0) {
    const highImpact = majorMoments.filter((m) => m.impact === "high");
    if (highImpact.length > 0) {
      parts.push(`${highImpact.length} high-impact moment${highImpact.length > 1 ? "s have" : " has"} shaped your trajectory.`);
    }
  }

  if (momentumScore >= 60) {
    parts.push(`Your ${chapterTitle.toLowerCase()} reflects strong forward momentum — keep building on this energy.`);
  } else if (momentumScore < 40) {
    parts.push(`Your ${chapterTitle.toLowerCase()} is about rebuilding — focus on small, consistent actions to regain traction.`);
  } else {
    parts.push(`Your ${chapterTitle.toLowerCase()} is steady — maintain consistency and watch for emerging opportunities.`);
  }

  parts.push(`The overarching theme: ${growthTheme.toLowerCase()}.`);

  return parts.join(" ");
}

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

function detectTurningPoints(
  journey: JourneyMemory,
  momentum: ReturnType<typeof getCareerMomentum>,
  identity: ReturnType<typeof getCareerIdentity>,
  mission: ReturnType<typeof getMissionIntelligence>,
  confidence: ReturnType<typeof getDecisionConfidence>,
  level: number
): TurningPoint[] {
  const points: TurningPoint[] = [];

  // First breakthrough — milestone thresholds
  if (level >= 2) {
    points.push({
      type: "first_breakthrough",
      title: level >= 3 ? "Reached an established level of career intelligence" : "Broke through to a new level",
      description: level >= 3
        ? `Achieved Level ${level}, demonstrating sustained career exploration and growth.`
        : "Crossed into Level 2, marking the transition from early exploration to active career building.",
    });
  }

  // Confidence jumps
  if (confidence && journey.confidenceHistory.length >= 2) {
    const { jumps, avgDelta } = detectConfidenceJumps(journey.confidenceHistory);
    if (jumps >= 1) {
      points.push({
        type: "confidence_jump",
        title: "Significant confidence gain detected",
        description: `${jumps} confidence jump${jumps > 1 ? "s" : ""} identified in your journey history, with an average delta of ${avgDelta >= 0 ? "+" : ""}${avgDelta} points per transition.`,
      });
    }
  }

  // Identity changes
  if (identity) {
    points.push({
      type: "identity_change",
      title: `Identified as a ${identity.careerArchetype}`,
      description: `Your career identity is shaping into "${identity.identityTitle}" — ${identity.growthStyle.replace(/-/g, " ")} growth style with a ${identity.focusPattern.replace(/-/g, " ")} focus pattern.`,
    });
  }

  // Career pivots
  if (momentum.slowdownSignals.length >= 3) {
    points.push({
      type: "career_pivot",
      title: "Career pivot signals detected",
      description: `${momentum.slowdownSignals.length} slowdown signals suggest a potential career pivot or realignment is underway.`,
    });
  }

  // Mission shifts
  if (mission) {
    if (mission.missionBlocks.length > 0) {
      points.push({
        type: "mission_shift",
        title: "Mission alignment adjustments detected",
        description: `Mission intelligence identified ${mission.missionBlocks.length} block${mission.missionBlocks.length > 1 ? "s" : ""} affecting your trajectory — adaptivity is engaged.`,
      });
    }
  }

  return points;
}

function detectMajorMoments(
  journey: JourneyMemory,
  momentum: ReturnType<typeof getCareerMomentum>,
  level: number,
  xp: number,
  confidenceScore: number | undefined
): MajorMoment[] {
  const moments: MajorMoment[] = [];

  // Achievement milestones
  if (level >= 3) {
    moments.push({ type: "milestone", title: `Reached Level ${level}`, impact: "high" });
  } else if (level >= 1) {
    moments.push({ type: "milestone", title: `Started at Level ${level}`, impact: "medium" });
  }

  if (xp > 500) {
    moments.push({ type: "achievement", title: `Earned ${xp} total XP`, impact: xp > 1000 ? "high" : "medium" });
  }

  // Confidence milestone
  if (confidenceScore !== undefined) {
    if (confidenceScore >= 70) {
      moments.push({ type: "insight", title: "High decision confidence established", impact: "high" });
    } else if (confidenceScore >= 40) {
      moments.push({ type: "insight", title: "Moderate decision confidence emerging", impact: "medium" });
    }
  }

  // Completion milestones
  if (journey.completedQuizzes >= 10) {
    moments.push({ type: "completion", title: `${journey.completedQuizzes} quizzes completed`, impact: "high" });
  } else if (journey.completedQuizzes >= 5) {
    moments.push({ type: "completion", title: `Completed ${journey.completedQuizzes} quizzes`, impact: "medium" });
  } else if (journey.completedQuizzes >= 1) {
    moments.push({ type: "completion", title: "First quiz completed", impact: "medium" });
  }

  // Momentum milestone
  if (momentum.momentumScore >= 60) {
    moments.push({ type: "change", title: "Strong momentum achieved", impact: "high" });
  } else if (momentum.momentumScore >= 40) {
    moments.push({ type: "change", title: "Moderate momentum building", impact: "medium" });
  }

  // Streak milestone — use confidence history length as session consistency proxy
  const sessionCount = journey.confidenceHistory.length;
  if (sessionCount >= 8) {
    moments.push({ type: "milestone", title: "Consistent multi-session engagement", impact: "high" });
  } else if (sessionCount >= 4) {
    moments.push({ type: "milestone", title: "Building session consistency", impact: "medium" });
  }

  return moments;
}

function detectStorySignals(
  journey: JourneyMemory,
  momentum: ReturnType<typeof getCareerMomentum>,
  confidence: ReturnType<typeof getDecisionConfidence>,
  mission: ReturnType<typeof getMissionIntelligence>,
  level: number,
): string[] {
  const signals: string[] = [];

  if (level <= 1) signals.push("Early-stage journey — foundational career intelligence building");
  if (level >= 3) signals.push("Established career intelligence practice");
  if (journey.completedQuizzes >= 10) signals.push("Deep quiz engagement — 10+ completed");
  if (journey.completedQuizzes <= 2) signals.push("Early quiz engagement — building baseline data");
  if (Object.keys(journey.viewedCareers).length >= 8) signals.push("Broad career exploration — 8+ careers viewed");
  if (Object.keys(journey.viewedCareers).length <= 3) signals.push("Focused career exploration — few careers viewed");
  if (momentum.momentumScore >= 60) signals.push("Strong forward momentum driving growth");
  if (momentum.momentumScore < 40) signals.push("Low momentum — rebuilding phase active");
  if (momentum.accelerationSignals.length >= 4) signals.push("Multiple acceleration signals present");
  if (momentum.slowdownSignals.length >= 4) signals.push("Multiple slowdown signals requiring attention");
  if (confidence && confidence.confidenceScore >= 65) signals.push("High decision confidence — clear career direction");
  if (confidence && confidence.confidenceScore < 35) signals.push("Low decision confidence — exploration mode active");
  if (mission && mission.missionScore >= 65) signals.push("Strong mission alignment — goals and actions aligned");
  if (mission && mission.missionScore < 40) signals.push("Mission realignment needed — goals and actions diverging");
  const comparedPairs = Object.keys(journey.comparedCareerPairs);
  if (comparedPairs.length >= 3) signals.push("Active career comparison — evaluating multiple paths");
  if (journey.uncertaintyPatterns.retakes >= 2) signals.push("Quiz retakes suggest deepening interest areas");

  return signals;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute full career story intelligence from current data sources.
 */
export function computeCareerStory(): CareerStoryData {
  const journey = loadJourneyMemory();
  const achievements = loadAchievements() ?? computeAchievements();
  const momentum = getCareerMomentum();
  const future = getFutureSelf();
  const identity = getCareerIdentity();
  const mission = getMissionIntelligence();
  const confidence = getDecisionConfidence();

  const { level, xp } = achievements;
  const trajectoryStrength = future.trajectoryStrength;
  const momentumScore = momentum.momentumScore;
  const momentumTrend = momentum.momentumTrend;

  // Compute core narrative elements
  const storyStage = computeStoryStage(level, momentumScore, journey.completedQuizzes);
  const storyArc = computeStoryArc(momentumTrend, momentumScore, trajectoryStrength);
  const turningPoints = detectTurningPoints(journey, momentum, identity, mission, confidence, level);
  const majorMoments = detectMajorMoments(journey, momentum, level, xp, confidence?.confidenceScore);
  const growthTheme = computeGrowthTheme(storyArc, identity?.careerArchetype ?? "explorer", momentumScore);
  const chapterTitle = computeChapterTitle(momentumScore, storyArc, storyStage);
  const nextChapterPrediction = computeNextChapterPrediction(
    momentumScore, momentumTrend, storyArc, trajectoryStrength, mission?.missionScore ?? 50
  );
  const storySignals = detectStorySignals(journey, momentum, confidence, mission, level);
  const narrativeSummary = buildNarrativeSummary(
    storyStage, storyArc, growthTheme, chapterTitle, momentumScore, turningPoints, majorMoments
  );

  return {
    storyStage,
    storyArc,
    turningPoints,
    majorMoments,
    growthTheme,
    storySignals,
    chapterTitle,
    momentumScore,
    nextChapterPrediction,
    narrativeSummary,
  };
}
