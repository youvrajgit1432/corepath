/**
 * LEARNING FRICTION INTELLIGENCE
 *
 * Detects where users repeatedly get stuck across their career exploration journey.
 *
 * Reads from:
 *   journey-memory        (quiz retakes, roadmap interactions, confidence history)
 *   decision-readiness    (comparison loops, hesitation level, decision score)
 *   engagement-pulse      (fatigue signals, consistency streak, pulse score)
 *   community-signals     (popular careers, trending projects — contextual)
 *   predictive-insights   (dropoff risk, momentum forecast, direction confidence)
 *   action-sprints        (blocking signals, sprint history completion rates)
 *
 * Behavior:
 *   If stuck  → suggest easier, lower-commitment actions
 *   If progressing → reduce intervention intensity
 *
 * Persists via SafeStorage with 1-hour cache.
 * No backend. No auth.
 */

import { loadJourneyMemory } from "./journey-memory";
import { getDecisionReadiness, type DecisionReadinessData } from "./decision-readiness";
import { getEngagementPulse, type EngagementPulseData } from "./engagement-pulse";
import { buildCommunitySignals, type CommunitySignals } from "./community-signals";
import { loadPredictiveInsights, computePredictiveInsights } from "./predictive-insights";
import { loadActionSprint, loadSprintHistory } from "./action-sprints";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-learning-friction";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type FrictionSeverity = "low" | "medium" | "high";

export interface FrictionArea {
  area: string;
  severity: FrictionSeverity;
  detail: string;
  source: string;
}

export interface DropoffMoment {
  stage: string;
  count: number;
  detail: string;
}

export interface RepeatPattern {
  pattern: string;
  count: number;
  detail: string;
}

export interface StuckSignal {
  signal: string;
  severity: FrictionSeverity;
  detail: string;
  source: string;
}

export interface RecoverySignal {
  signal: string;
  detail: string;
}

export interface InterventionPlan {
  action: string;
  difficulty: "easier" | "maintain";
  rationale: string;
}

export interface LearningFrictionData {
  /** Overall friction score 0–100 (higher = more stuck) */
  frictionScore: number;
  /** Areas where the user repeatedly gets stuck */
  frictionAreas: FrictionArea[];
  /** Stages/activities where the user tends to drop off */
  dropoffMoments: DropoffMoment[];
  /** Patterns that repeat without resolution */
  repeatPatterns: RepeatPattern[];
  /** All negative signals detected */
  stuckSignals: StuckSignal[];
  /** What has helped or could help the user recover */
  recoverySignals: RecoverySignal[];
  /** Recommended intervention */
  interventionPlan: InterventionPlan;
  /// Single label summarizing the user's friction state
  stateLabel: "stuck" | "struggling" | "progressing";
  computedAt: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface FrictionContext {
  journey: ReturnType<typeof loadJourneyMemory>;
  readiness: DecisionReadinessData;
  pulse: EngagementPulseData;
  community: CommunitySignals;
  predictions: ReturnType<typeof loadPredictiveInsights>;
  sprint: ReturnType<typeof loadActionSprint>;
  sprintHistory: ReturnType<typeof loadSprintHistory>;
}

function gatherContext(): FrictionContext {
  return {
    journey: loadJourneyMemory(),
    readiness: getDecisionReadiness(),
    pulse: getEngagementPulse(),
    community: buildCommunitySignals(),
    predictions: loadPredictiveInsights() ?? computePredictiveInsights(),
    sprint: loadActionSprint(),
    sprintHistory: loadSprintHistory(),
  };
}

// ============================================================================
// FRICTION AREA DETECTION
// ============================================================================

function detectQuizRetakes(ctx: FrictionContext): FrictionArea | null {
  const { uncertaintyPatterns, completedQuizzes } = ctx.journey;
  const retakes = uncertaintyPatterns.retakes;
  if (retakes === 0 || completedQuizzes < 2) return null;

  const retakeRate = completedQuizzes > 0 ? retakes / completedQuizzes : 0;
  const severity: FrictionSeverity =
    retakeRate >= 0.4 ? "high" : retakeRate >= 0.2 ? "medium" : "low";

  if (retakeRate >= 0.2) {
    return {
      area: "Quiz Retakes",
      severity,
      detail: `Retook quizzes ${retakes} out of ${completedQuizzes} sessions (${Math.round(retakeRate * 100)}% retake rate) — suggests difficulty forming a consistent self-assessment.`,
      source: "journey-memory",
    };
  }
  return null;
}

function detectCareerSwitching(ctx: FrictionContext): FrictionArea | null {
  const loops = ctx.readiness.comparisonLoops;
  if (loops.length === 0) return null;

  const totalLoopCount = loops.reduce((sum, l) => sum + l.count, 0);
  const severity: FrictionSeverity =
    loops.length >= 3 || totalLoopCount >= 8 ? "high" : loops.length >= 1 ? "medium" : "low";

  return {
    area: "Career Switching",
    severity,
    detail: `${loops.length} career pair${loops.length > 1 ? "s" : ""} compared ${totalLoopCount} times without commitment. Top loop: ${loops[0].careerA} vs ${loops[0].careerB} (${loops[0].count}x).`,
    source: "decision-readiness",
  };
}

function detectRoadmapStalling(ctx: FrictionContext): FrictionArea | null {
  const interactions = ctx.journey.roadmapInteractions;
  const stalledCareers: string[] = [];

  for (const [careerId, actions] of Object.entries(interactions)) {
    // Viewed multiple times but never started a phase
    if (actions.view >= 3 && actions.start === 0) {
      stalledCareers.push(careerId);
    }
  }

  if (stalledCareers.length === 0) return null;

  const severity: FrictionSeverity =
    stalledCareers.length >= 3 ? "high" : stalledCareers.length >= 1 ? "medium" : "low";

  return {
    area: "Roadmap Stalling",
    severity,
    detail: `${stalledCareers.length} career${stalledCareers.length > 1 ? "s" : ""} viewed repeatedly but never started a roadmap phase — exploration without commitment to a path.`,
    source: "journey-memory",
  };
}

function detectDecisionParalysis(ctx: FrictionContext): FrictionArea | null {
  const { hesitationLevel, decisionScore } = ctx.readiness;
  const consistencyDim = ctx.pulse.dimensions.find((d) => d.name === "consistency_streak");

  if (hesitationLevel !== "high" && consistencyDim && consistencyDim.score >= 40) return null;

  const lowStreak = consistencyDim ? consistencyDim.score < 40 : true;

  if (hesitationLevel === "high" && lowStreak) {
    return {
      area: "Decision Paralysis",
      severity: "high",
      detail: `High hesitation with low consistency streak (streak score: ${consistencyDim?.score ?? 0}/100, decision score: ${decisionScore}/100). Difficulty committing to a direction.`,
      source: "decision-readiness",
    };
  }

  if (hesitationLevel === "moderate" && lowStreak) {
    return {
      area: "Decision Paralysis",
      severity: "medium",
      detail: `Moderate hesitation paired with low consistency — may be unsure which direction to focus on.`,
      source: "decision-readiness",
    };
  }

  return null;
}

function detectConsistencyGaps(ctx: FrictionContext): FrictionArea | null {
  const consistencyDim = ctx.pulse.dimensions.find((d) => d.name === "consistency_streak");
  if (!consistencyDim) return null;

  const streakScore = consistencyDim.score;
  if (streakScore >= 50) return null;

  const fatigueSignals = ctx.pulse.fatigueSignals;
  const hasFatigue = fatigueSignals.some((f) => f.severity === "high");

  const severity: FrictionSeverity =
    streakScore < 20 && hasFatigue ? "high" : streakScore < 35 ? "medium" : "low";

  if (streakScore < 35) {
    return {
      area: "Consistency Gaps",
      severity,
      detail: `Consistency score is ${streakScore}/100${hasFatigue ? ", compounded by fatigue signals" : ""} — irregular engagement makes it hard to build momentum.`,
      source: "engagement-pulse",
    };
  }

  return null;
}

// ============================================================================
// DROPOFF MOMENTS
// ============================================================================

function detectDropoffMoments(ctx: FrictionContext): DropoffMoment[] {
  const moments: DropoffMoment[] = [];

  // 1. From predictive-insights dropoff risk
  const dropoff = ctx.predictions.dropoffRisk;
  if (dropoff.score >= 40) {
    moments.push({
      stage: "General Engagement",
      count: Math.round(dropoff.score / 10),
      detail: dropoff.summary,
    });
  }

  // 2. From engagement-pulse fatigue signals
  for (const signal of ctx.pulse.fatigueSignals) {
    if (signal.severity === "high" || signal.severity === "medium") {
      moments.push({
        stage: signal.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        count: signal.severity === "high" ? 3 : 1,
        detail: signal.detail,
      });
    }
  }

  // 3. From roadmap interactions — phases viewed but abandoned
  for (const [, actions] of Object.entries(ctx.journey.roadmapInteractions)) {
    if (actions.start > 0 && actions.complete === 0) {
      moments.push({
        stage: "Roadmap Phase Started But Not Completed",
        count: actions.start,
        detail: "A roadmap phase was started but never finished — potential friction at the midpoint.",
      });
      break; // One entry is enough for this category
    }
  }

  return moments;
}

// ============================================================================
// REPEAT PATTERNS
// ============================================================================

function detectRepeatPatterns(ctx: FrictionContext): RepeatPattern[] {
  const patterns: RepeatPattern[] = [];

  // 1. Quiz retakes
  if (ctx.journey.uncertaintyPatterns.retakes >= 2) {
    patterns.push({
      pattern: "Repeated Quiz Retakes",
      count: ctx.journey.uncertaintyPatterns.retakes,
      detail: `Quiz retaken ${ctx.journey.uncertaintyPatterns.retakes} times — suggests difficulty forming a stable self-assessment profile.`,
    });
  }

  // 2. Comparison loops
  for (const loop of ctx.readiness.comparisonLoops.slice(0, 3)) {
    patterns.push({
      pattern: `Comparing ${loop.careerA} vs ${loop.careerB}`,
      count: loop.count,
      detail: `Compared ${loop.count} times without deciding between them.`,
    });
  }

  // 3. Roadmap revisit loop
  const revisitedRoadmaps = Object.entries(ctx.journey.roadmapInteractions).filter(
    ([, actions]) => actions.view >= 3 && actions.start === 0
  );
  for (const [careerId] of revisitedRoadmaps.slice(0, 2)) {
    const actions = ctx.journey.roadmapInteractions[careerId];
    patterns.push({
      pattern: `Viewed ${careerId} Roadmap Without Starting`,
      count: actions.view,
      detail: `Roadmap viewed ${actions.view} times but never started — user may find the path intimidating or unclear.`,
    });
  }

  return patterns;
}

// ============================================================================
// STUCK SIGNALS
// ============================================================================

function detectStuckSignals(ctx: FrictionContext): StuckSignal[] {
  const signals: StuckSignal[] = [];

  // High hesitation
  if (ctx.readiness.hesitationLevel === "high") {
    signals.push({
      signal: "High Decision Hesitation",
      severity: "high",
      detail: "User hesitates significantly between career options, unable to commit to a direction.",
      source: "decision-readiness",
    });
  }

  // Low consistency
  const consistencyDim = ctx.pulse.dimensions.find((d) => d.name === "consistency_streak");
  if (consistencyDim && consistencyDim.score < 30) {
    signals.push({
      signal: "Low Consistency",
      severity: "high",
      detail: `Consistency score is ${consistencyDim.score}/100 — engagement is too irregular to build momentum.`,
      source: "engagement-pulse",
    });
  }

  // High dropoff risk
  if (ctx.predictions.dropoffRisk.level === "high" || ctx.predictions.dropoffRisk.level === "elevated") {
    signals.push({
      signal: "Elevated Dropoff Risk",
      severity: ctx.predictions.dropoffRisk.level === "high" ? "high" : "medium",
      detail: ctx.predictions.dropoffRisk.summary,
      source: "predictive-insights",
    });
  }

  // Fatigue signals
  for (const signal of ctx.pulse.fatigueSignals) {
    if (signal.severity === "high") {
      signals.push({
        signal: signal.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        severity: "high",
        detail: signal.detail,
        source: "engagement-pulse",
      });
    }
  }

  // Low decision score
  if (ctx.readiness.decisionScore < 40) {
    signals.push({
      signal: "Low Decision Readiness",
      severity: "medium",
      detail: `Decision score is ${ctx.readiness.decisionScore}/100 — user is not yet confident in a career choice.`,
      source: "decision-readiness",
    });
  }

  // Unclear direction
  if (ctx.predictions.careerDirectionConfidence.level === "unclear") {
    signals.push({
      signal: "Unclear Career Direction",
      severity: "medium",
      detail: "Predictive insights indicate the user's career direction is still unclear.",
      source: "predictive-insights",
    });
  }

  // Sprint blocking signals
  for (const signal of ctx.sprint.blockingSignals.slice(0, 2)) {
    if (signal.includes("No active streak") || signal.includes("behind schedule")) {
      signals.push({
        signal: signal.length > 60 ? signal.slice(0, 60) + "…" : signal,
        severity: "medium",
        detail: signal,
        source: "action-sprints",
      });
    }
  }

  return signals;
}

// ============================================================================
// RECOVERY SIGNALS
// ============================================================================

function detectRecoverySignals(ctx: FrictionContext, frictionAreaCount: number): RecoverySignal[] {
  const signals: RecoverySignal[] = [];

  // Positive: improving decision score
  if (ctx.readiness.clarityTrend === "improving") {
    signals.push({
      signal: "Clarity is improving",
      detail: "Your decision clarity is trending upward — continued engagement will accelerate this.",
    });
  }

  // Positive: growing confidence
  const growthDim = ctx.pulse.dimensions.find((d) => d.name === "growth_trend");
  if (growthDim && growthDim.score >= 60) {
    signals.push({
      signal: "Growth trend is positive",
      detail: "Your growth metrics are strong — channel this into focused exploration.",
    });
  }

  // Positive: low fatigue
  if (ctx.pulse.fatigueSignals.length === 0) {
    signals.push({
      signal: "No fatigue detected",
      detail: "Energy levels are healthy — good conditions for tackling challenging tasks.",
    });
  }

  // Positive: accelerating momentum
  if (ctx.predictions.momentumForecast.direction === "accelerating") {
    signals.push({
      signal: "Momentum is accelerating",
      detail: "Your trajectory is improving — now is a good time to push for progress.",
    });
  }

  // Positive: sprint completion rate
  const recentSprints = ctx.sprintHistory.slice(0, 3);
  if (recentSprints.length >= 2) {
    const avgCompletion = recentSprints.reduce((s, h) => s + h.completionRate, 0) / recentSprints.length;
    if (avgCompletion >= 60) {
      signals.push({
        signal: "Consistent sprint completion",
        detail: `You've completed an average of ${Math.round(avgCompletion)}% of your sprint tasks — strong follow-through.`,
      });
    }
  }

  // Positive: high pulse score
  if (ctx.pulse.pulseScore >= 65) {
    signals.push({
      signal: "High engagement energy",
      detail: "Your engagement pulse is strong — you're in a good state for meaningful progress.",
    });
  }

  // Community context: trending projects in popular careers
  if (ctx.community.trendingProjects.length > 0 && frictionAreaCount >= 2) {
    signals.push({
      signal: "Trending projects in your area",
      detail: `Try exploring these popular projects: ${ctx.community.trendingProjects.slice(0, 2).join(", ")}. Hands-on work can break through analysis paralysis.`,
    });
  }

  // If no positive signals, give a general encouragement
  if (signals.length === 0) {
    signals.push({
      signal: "Every action counts",
      detail: "Even a single small step today breaks the inertia. Start with a 2-minute task.",
    });
  }

  return signals;
}

// ============================================================================
// INTERVENTION PLAN
// ============================================================================

function computeInterventionPlan(
  frictionScore: number,
  areas: FrictionArea[],
  ctx: FrictionContext
): InterventionPlan {
  // High friction → easier, low-commitment interventions
  if (frictionScore >= 55) {
    return {
      action: "Focus on one small, easy action today — view a career page or complete a quick quiz.",
      difficulty: "easier",
      rationale: `Friction score is ${frictionScore}/100. When stuck, the best intervention is the smallest possible next step.`,
    };
  }

  // Medium friction → structured guidance
  if (frictionScore >= 30) {
    // If roadmap stalling is an issue, suggest starting
    if (areas.some((a) => a.area === "Roadmap Stalling")) {
      return {
        action: "Pick one career roadmap and commit to completing its first phase this week.",
        difficulty: "maintain",
        rationale: "Roadmap stalling suggests hesitation to start. Breaking the first milestone into tiny steps helps overcome inertia.",
      };
    }

    // If comparison loops, suggest structured compare
    if (areas.some((a) => a.area === "Career Switching")) {
      return {
        action: "Use the structured comparison tool to evaluate your top 2 careers side-by-side.",
        difficulty: "maintain",
        rationale: "Structured comparison reduces decision fatigue and helps clarify preferences.",
      };
    }

    // Default medium friction
    return {
      action: "Maintain your current cadence but try one slightly deeper session this week.",
      difficulty: "maintain",
      rationale: "Moderate friction means you're engaged but may benefit from more focused effort.",
    };
  }

  // Low friction → maintain or challenge
  return {
    action: "Continue your current trajectory — you're making consistent progress without getting stuck.",
    difficulty: "maintain",
    rationale: "Low friction means your strategies are working well. Maintain the approach.",
  };
}

// ============================================================================
// STATE LABEL
// ============================================================================

function computeStateLabel(frictionScore: number, areas: FrictionArea[]): "stuck" | "struggling" | "progressing" {
  if (frictionScore >= 55 || areas.some((a) => a.severity === "high")) return "stuck";
  if (frictionScore >= 30 || areas.length >= 2) return "struggling";
  return "progressing";
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute a full learning friction assessment from all available data sources.
 */
export function computeLearningFriction(): LearningFrictionData {
  const ctx = gatherContext();

  // Detect friction areas
  const frictionAreas: FrictionArea[] = [
    detectQuizRetakes(ctx),
    detectCareerSwitching(ctx),
    detectRoadmapStalling(ctx),
    detectDecisionParalysis(ctx),
    detectConsistencyGaps(ctx),
  ].filter((f): f is FrictionArea => f !== null);

  // Detect dropoff moments
  const dropoffMoments = detectDropoffMoments(ctx);

  // Detect repeat patterns
  const repeatPatterns = detectRepeatPatterns(ctx);

  // Detect stuck signals
  const stuckSignals = detectStuckSignals(ctx);

  // Detect recovery signals
  const recoverySignals = detectRecoverySignals(ctx, frictionAreas.length);

  // ── Compute friction score (0–100) ──
  let score = 20; // baseline (low friction)

  // Quiz retake rate
  const { uncertaintyPatterns, completedQuizzes } = ctx.journey;
  if (completedQuizzes >= 2) {
    const retakeRate = uncertaintyPatterns.retakes / completedQuizzes;
    score += retakeRate * 30;
  }

  // Comparison loops
  const loopCount = ctx.readiness.comparisonLoops.reduce((s, l) => s + l.count, 0);
  score += Math.min(20, loopCount * 5);

  // Hesitation
  if (ctx.readiness.hesitationLevel === "high") score += 15;
  else if (ctx.readiness.hesitationLevel === "moderate") score += 7;

  // Low consistency
  const consistencyDim = ctx.pulse.dimensions.find((d) => d.name === "consistency_streak");
  if (consistencyDim) {
    score += Math.max(0, (50 - consistencyDim.score)) * 0.3;
  }

  // Fatigue signals
  const highFatigueCount = ctx.pulse.fatigueSignals.filter((f) => f.severity === "high").length;
  score += highFatigueCount * 8;

  // Dropoff risk
  score += ctx.predictions.dropoffRisk.score * 0.2;

  // Roadmap stalling
  const stalledCount = Object.entries(ctx.journey.roadmapInteractions).filter(
    ([, a]) => a.view >= 3 && a.start === 0
  ).length;
  score += Math.min(10, stalledCount * 5);

  // Clamp
  const frictionScore = Math.max(0, Math.min(100, Math.round(score)));

  // State label
  const stateLabel = computeStateLabel(frictionScore, frictionAreas);

  // Intervention plan
  const interventionPlan = computeInterventionPlan(frictionScore, frictionAreas, ctx);

  const result: LearningFrictionData = {
    frictionScore,
    frictionAreas,
    dropoffMoments,
    repeatPatterns,
    stuckSignals,
    recoverySignals,
    interventionPlan,
    stateLabel,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Load the most recently computed friction assessment.
 */
export function loadLearningFriction(): LearningFrictionData | null {
  const storage = getSafeStorage({ silent: true });
  return storage.get<LearningFrictionData>(STORAGE_KEY);
}

/**
 * Get the current friction assessment, computing fresh if needed.
 */
export function getLearningFriction(): LearningFrictionData {
  const existing = loadLearningFriction();
  if (existing) return existing;
  return computeLearningFriction();
}
