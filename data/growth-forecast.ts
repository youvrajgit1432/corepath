/**
 * GROWTH FORECAST INTELLIGENCE
 *
 * Answers: "Where will this user likely be in 30–90 days?"
 *
 * Synthesizes 8 sources to detect the user's forecast state and generate
 * time-specific predictions at 30, 60, and 90-day horizons with risks,
 * opportunities, and levers to change the outcome.
 *
 * Sources:
 *   - future-self            → trajectory strength, risk factors, catalysts
 *   - decision-intelligence  → decision state, confidence level
 *   - career-story           → story stage, story arc, momentum score
 *   - coaching-intelligence  → coaching mode, coach confidence, warnings
 *   - mission-intelligence   → mission score, mission momentum, blocks
 *   - progress-reflection    → progress rate, reflection theme, momentum signal
 *   - journey-memory         → confidence history, quiz counts, uncertainty
 *   - predictive-insights    → momentum forecast, dropoff risk, future signals
 *
 * Forecast states:
 *   accelerating  → strong trajectory + high confidence + rising momentum
 *   compounding   → strong mission + consistency + steady progress
 *   stalled       → low momentum + repeated friction + declining forecast
 *   unstable      → high contradictions + fluctuating confidence
 *   recovering    → previously stalled/burnout but early recovery signal
 *
 * No backend. No auth. Pure client-side computation.
 */

import { getFutureSelf } from "./future-self";
import type { FutureSelfData } from "./future-self";
import type { DecisionIntelligenceData } from "./decision-intelligence";
import type { CareerStoryData } from "./career-story";
import type { CoachingData } from "./coaching-intelligence";
import { getMissionIntelligence } from "./mission-intelligence";
import type { MissionIntelligenceData } from "./mission-intelligence";
import { computeProgressReflection } from "./progress-reflection";
import type { ProgressReflectionData } from "./progress-reflection";
import { loadJourneyMemory } from "./journey-memory";
import type { JourneyMemory } from "./journey-memory";
import { computePredictiveInsights } from "./predictive-insights";
import type { PredictiveInsightsData } from "./predictive-insights";
import { getStored } from "./shared-context";
import {
  EMPTY_DECISION,
  EMPTY_CAREER_STORY,
  EMPTY_COACHING,
} from "./safe-context";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type ForecastState = "accelerating" | "compounding" | "stalled" | "unstable" | "recovering";

export interface TimePrediction {
  horizon: "30" | "60" | "90";
  narrative: string;
  projectedMetric: string; // e.g., "Mission score: 68 → 82"
  keyChallenge: string;
  growthProjection: number; // -100 to +100
}

export interface GrowthForecastData {
  /** Overall forecast state */
  forecastState: ForecastState;
  /** 30-day prediction */
  days30Prediction: TimePrediction;
  /** 60-day prediction */
  days60Prediction: TimePrediction;
  /** 90-day prediction */
  days90Prediction: TimePrediction;
  /** Overall trajectory strength 0–100 */
  trajectoryStrength: number;
  /** Risks that could derail the trajectory */
  forecastRisks: string[];
  /** Opportunities that could accelerate growth */
  forecastOpportunities: string[];
  /** Confidence in the forecast 0–100 */
  confidenceScore: number;
  /** Levers the user can pull to change the outcome */
  recommendedLevers: string[];
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface ForecastContext {
  future: FutureSelfData;
  decision: DecisionIntelligenceData;
  story: CareerStoryData;
  coaching: CoachingData;
  mission: MissionIntelligenceData;
  reflection: ProgressReflectionData;
  memory: JourneyMemory;
  predictions: PredictiveInsightsData;
}

// ── Forecast state metadata ──────────────────────────────────────────────

interface StateDef {
  state: ForecastState;
  label: string;
  icon: string;
  description: string;
}

const STATE_DEFS: Record<ForecastState, StateDef> = {
  accelerating: {
    state: "accelerating",
    label: "Accelerating",
    icon: "🚀",
    description: "Strong trajectory and rising momentum — growth is compounding",
  },
  compounding: {
    state: "compounding",
    label: "Compounding",
    icon: "📈",
    description: "Steady progress with strong mission alignment — consistent growth",
  },
  stalled: {
    state: "stalled",
    label: "Stalled",
    icon: "⛔",
    description: "Low momentum with repeated friction — trajectory needs intervention",
  },
  unstable: {
    state: "unstable",
    label: "Unstable",
    icon: "🌊",
    description: "High contradictions and fluctuating signals — path is uncertain",
  },
  recovering: {
    state: "recovering",
    label: "Recovering",
    icon: "🌱",
    description: "Early recovery signals after a stalled or burnout period",
  },
};

// ============================================================================
// FORECAST STATE DETECTION
// ============================================================================

function detectForecastState(ctx: ForecastContext): ForecastState {
  // Detect signals
  const strongTrajectory = ctx.future.trajectoryStrength >= 60;
  const highConfidence = ctx.decision.confidenceLevel >= 65;
  const risingMomentum =
    ctx.predictions.momentumForecast.direction === "accelerating" ||
    ctx.reflection.momentumSignal === "rising";

  const strongMission = ctx.mission.missionScore >= 55;
  const steadyProgress =
    ctx.reflection.momentumSignal === "steady" ||
    ctx.reflection.progressRate >= 50;

  const lowMomentum =
    ctx.future.trajectoryStrength < 35 ||
    ctx.reflection.momentumSignal === "slipping" ||
    ctx.predictions.momentumForecast.direction === "declining";

  const repeatedFriction =
    ctx.mission.missionBlocks.length >= 2 ||
    ctx.coaching.warnings.length >= 2;

  const highContradictions =
    ctx.story.storyArc === "transition" ||
    ctx.decision.decisionState === "recalibrate";

  const fluctuatingConfidence =
    ctx.memory.confidenceHistory.length >= 3 &&
    Math.abs(ctx.memory.confidenceHistory[ctx.memory.confidenceHistory.length - 1] -
      ctx.memory.confidenceHistory[0]) > 25;

  const recoverySignals =
    ctx.coaching.coachingMode === "reflective" ||
    ctx.reflection.reflectionTheme === "rebuilding" ||
    (ctx.story.storyArc === "transition" && ctx.future.trajectoryStrength >= 40);

  // Priority order: stalled > unstable > accelerating > compounding > recovering

  // 1. Stalled: low momentum + repeated friction
  if (lowMomentum && repeatedFriction) {
    return "stalled";
  }

  // 2. Unstable: high contradictions + fluctuating confidence
  if (highContradictions && fluctuatingConfidence) {
    return "unstable";
  }

  // 3. Accelerating: strong trajectory + high confidence + rising momentum
  if (strongTrajectory && highConfidence && risingMomentum) {
    return "accelerating";
  }

  // 4. Compounding: strong mission + steady progress
  if (strongMission && steadyProgress) {
    return "compounding";
  }

  // 5. Recovering: recovery signals present
  if (recoverySignals) {
    return "recovering";
  }

  // Fallback: compounding (steady state)
  return "compounding";
}

// ============================================================================
// TIME PREDICTION GENERATORS
// ============================================================================

function generateTimePrediction(
  horizon: "30" | "60" | "90",
  state: ForecastState,
  ctx: ForecastContext
): TimePrediction {
  const days = parseInt(horizon);
  const multiplier = days / 30;

  // Calculate projected metric changes
  const baseMetric = ctx.mission.missionScore;
  const trajectoryBase = ctx.future.trajectoryStrength;
  const confidenceBase = ctx.predictions.momentumForecast.confidence;

  let projectedMetric: string;
  let narrative: string;
  let keyChallenge: string;
  let growthProjection: number;

  switch (state) {
    case "accelerating": {
      const growth = Math.min(100, Math.round(baseMetric + 8 * multiplier));
      projectedMetric = `Mission score: ${baseMetric} → ${growth}`;
      narrative =
        days <= 30
          ? `Your strong trajectory (${trajectoryBase}%) and rising momentum are forecast to accelerate your career growth significantly over the next ${days} days. Mission alignment is strengthening, and your confidence is building on itself.`
          : days <= 60
            ? `By day 60, your accelerating trajectory will likely translate into concrete progress — expect milestone completions to cluster in this period as your engagement compounds. Risk of overextension is the key watchpoint.`
            : `The 90-day outlook shows substantial growth potential. If current signals hold, you'll be in a position to make confident career moves or commit to an advanced roadmap. The compounding effect of ${multiplier.toFixed(0)} months of strong engagement is significant.`;
      keyChallenge =
        days <= 30
          ? "Channeling acceleration into focused milestones without spreading too thin"
          : days <= 60
            ? "Sustaining the pace without burnout — success creates its own pressure"
            : "Translating momentum into a concrete career decision before the window closes";
      growthProjection = Math.min(100, 25 + 15 * multiplier);
      break;
    }

    case "compounding": {
      const growth = Math.min(95, Math.round(baseMetric + 5 * multiplier));
      projectedMetric = `Mission score: ${baseMetric} → ${growth}`;
      narrative =
        days <= 30
          ? `Your consistent engagement and strong mission alignment (${ctx.mission.missionScore}/100) will produce steady, compounding growth over the next ${days} days. Progress may feel gradual, but each session builds on the last.`
          : days <= 60
            ? `By 60 days, the compounding effect of your steady cadence becomes visible. Small daily actions will accumulate into meaningful progress across multiple dimensions — mission score, trajectory strength, and career clarity.`
            : `The 90-day outlook for compounding growth is strong. ${multiplier.toFixed(0)} months of consistent engagement at your current rate positions you well for a significant leap in career intelligence. The key is maintaining — not increasing — your current rhythm.`;
      keyChallenge =
        days <= 30
          ? "Avoiding complacency — steady progress can mask the need for occasional stretch challenges"
          : days <= 60
            ? "Introducing variety to prevent routine from becoming stagnation"
            : "Knowing when to shift from compounding to acceleration mode";
      growthProjection = Math.min(85, 15 + 10 * multiplier);
      break;
    }

    case "stalled": {
      const decline = Math.max(0, Math.round(baseMetric - 10 * multiplier));
      projectedMetric = `Mission score: ${baseMetric} → ${decline}`;
      narrative =
        days <= 30
          ? `Current signals indicate a stalled trajectory. Low momentum (${trajectoryBase}%) combined with ${ctx.mission.missionBlocks.length} friction point${ctx.mission.missionBlocks.length !== 1 ? "s" : ""} suggests the next ${days} days will require intentional intervention to change course.`
          : days <= 60
            ? `Without intervention by day 60, the stall risk deepens. Engagement may continue declining, and previously achievable milestones may slip further out of reach. A structured reset is recommended in the next 2 weeks.`
            : `The 90-day outlook for an unaddressed stall is the most concerning — prolonged low engagement can lead to disengagement and loss of accumulated career intelligence momentum. However, even small interventions now can shift this trajectory.`;
      keyChallenge =
        days <= 30
          ? "Breaking inertia with the smallest possible action — one micro-step resets the pattern"
          : days <= 60
            ? "Rebuilding consistency after a period of low engagement — focus on 2-minute actions"
            : "Preventing the stall from becoming permanent disengagement — re-establishing the 'why'";
      growthProjection = Math.max(-60, -20 - 10 * multiplier);
      break;
    }

    case "unstable": {
      const variance = Math.round(15 * multiplier);
      projectedMetric = `Mission score: ${baseMetric} ± ${variance}`;
      narrative =
        days <= 30
          ? `Your growth path is unstable — contradictions and fluctuating confidence make the ${days}-day outlook uncertain. Progress may happen in bursts rather than a steady climb, with some periods of rapid insight followed by pauses.`
          : days <= 60
            ? `By 60 days, the instability should begin to resolve as contradictions surface clearer preferences. The key is using this period for structured exploration rather than forced decisions — let the data clarify, don't rush it.`
            : `The 90-day outlook for an unstable trajectory is cautiously optimistic. Most unstable paths resolve into a clear direction within 2–3 months as exploration data accumulates and contradictions resolve. The growth may be uneven but directional.`;
      keyChallenge =
        days <= 30
          ? "Holding space for uncertainty without making premature commitments"
          : days <= 60
            ? "Using contradictions as data points rather than sources of anxiety"
            : "Recognizing when instability has resolved into a clear signal";
      growthProjection = 0; // neutral — could go either way
      break;
    }

    case "recovering": {
      const recovery = Math.min(80, Math.round(baseMetric + 12 * multiplier));
      projectedMetric = `Mission score: ${baseMetric} → ${recovery}`;
      narrative =
        days <= 30
          ? `Early recovery signals are present — your trajectory is rebounding from a low point. The next ${days} days are critical for establishing a new baseline. Focus on consistency over intensity; each small action rebuilds the foundation.`
          : days <= 60
            ? `By 60 days, the recovery should be established. The initial rebound gains will level into a sustainable growth cadence. This is the period where new habits solidify and the risk of backsliding decreases significantly.`
            : `The 90-day outlook for recovery is positive. ${multiplier.toFixed(0)} months of consistent rebuilding places you back on a strong trajectory, often with greater self-awareness than before the setback. Recovery trajectories frequently lead to more resilient growth patterns.`;
      keyChallenge =
        days <= 30
          ? "Building consistency without overwhelming the system — start with micro-actions"
          : days <= 60
            ? "Transitioning from 'recovery mode' to 'growth mode' without rushing"
            : "Sustaining the new habits long enough for them to become automatic";
      growthProjection = Math.min(70, 10 + 15 * multiplier);
      break;
    }
  }

  return {
    horizon,
    narrative,
    projectedMetric,
    keyChallenge,
    growthProjection,
  };
}

// ============================================================================
// TRAJECTORY STRENGTH
// ============================================================================

function computeTrajectoryStrength(ctx: ForecastContext): number {
  let score = 40; // baseline

  // Future self trajectory (0–25)
  score += ctx.future.trajectoryStrength * 0.25;

  // Decision confidence (0–15)
  score += ctx.decision.confidenceLevel * 0.15;

  // Mission momentum (0–15)
  score += ctx.mission.missionMomentum * 0.15;

  // Progress rate (0–10)
  score += ctx.reflection.progressRate * 0.1;

  // Momentum forecast (0–15)
  if (ctx.predictions.momentumForecast.direction === "accelerating") score += 15;
  else if (ctx.predictions.momentumForecast.direction === "stable") score += 8;

  // Coaching confidence (0–10)
  score += ctx.coaching.coachConfidence * 0.1;

  // Story momentum (0–10)
  score += Math.min(10, ctx.story.momentumScore * 0.1);

  return Math.round(Math.max(0, Math.min(100, score)));
}

// ============================================================================
// FORECAST RISKS & OPPORTUNITIES
// ============================================================================

function detectForecastRisks(ctx: ForecastContext): string[] {
  const risks: string[] = [];

  // From future-self risk factors
  if (ctx.future.riskFactors.length > 0) {
    const highRisks = ctx.future.riskFactors.filter((r) => r.severity === "high");
    if (highRisks.length > 0) {
      risks.push(`High-severity risk: ${highRisks[0].factor}`);
    }
  }

  // From predictive insights
  if (ctx.predictions.dropoffRisk.level === "high" || ctx.predictions.dropoffRisk.level === "elevated") {
    risks.push(`Disengagement risk (${ctx.predictions.dropoffRisk.level}) — may slow or reverse progress`);
  }

  // From mission blocks
  if (ctx.mission.missionBlocks.length >= 2) {
    risks.push(`${ctx.mission.missionBlocks.length} mission blocks — friction could stall trajectory`);
  }

  // From declining momentum forecast
  if (ctx.predictions.momentumForecast.direction === "declining") {
    risks.push("Momentum forecast is declining without intervention");
  }

  // From coaching warnings
  if (ctx.coaching.warnings.length > 0) {
    risks.push(ctx.coaching.warnings[0].replace(/^["']|["']$/g, ""));
  }

  // From contradictions
  if (ctx.mission.missionRisk === "high") {
    risks.push("High mission risk — alignment or execution issues may worsen");
  }

  return risks.slice(0, 4);
}

function detectForecastOpportunities(ctx: ForecastContext): string[] {
  const opportunities: string[] = [];

  // From growth catalysts
  if (ctx.future.growthCatalysts.length > 0) {
    opportunities.push(`Growth catalyst: ${ctx.future.growthCatalysts[0].catalyst} (strength: ${ctx.future.growthCatalysts[0].strength}%)`);
  }

  // From coaching growth opportunities
  if (ctx.coaching.growthOpportunities.length > 0) {
    opportunities.push(ctx.coaching.growthOpportunities[0].replace(/^["']|["']$/g, ""));
  }

  // From rising trajectory
  if (ctx.future.trajectoryStrength >= 50) {
    opportunities.push(`Strong trajectory (${ctx.future.trajectoryStrength}%) — foundation for accelerated growth`);
  }

  // From mission alignment
  if (ctx.mission.missionScore >= 60) {
    opportunities.push(`High mission alignment (${ctx.mission.missionScore}/100) — compounding returns on effort`);
  }

  // From accelerating momentum
  if (ctx.predictions.momentumForecast.direction === "accelerating") {
    opportunities.push("Momentum is accelerating — optimal window for stretch goals");
  }

  // From reflection wins
  if (ctx.reflection.winsSummary.length > 0) {
    const firstWin = ctx.reflection.winsSummary[0];
    opportunities.push(firstWin.length > 80 ? firstWin.slice(0, 80) + "…" : firstWin);
  }

  // From progress rate
  if (ctx.reflection.progressRate >= 60) {
    opportunities.push(`High progress rate (${ctx.reflection.progressRate}%) — growth is self-reinforcing`);
  }

  return opportunities.slice(0, 4);
}

// ============================================================================
// CONFIDENCE SCORE
// ============================================================================

function computeConfidenceScore(ctx: ForecastContext): number {
  let score = 50; // baseline

  // Boost from data quality
  if (ctx.memory.confidenceHistory.length >= 5) score += 10;
  if (ctx.memory.completedQuizzes >= 5) score += 5;

  // Boost from signal alignment
  if (ctx.predictions.momentumForecast.confidence >= 70) score += 8;
  if (ctx.future.confidenceScore >= 60) score += 7;
  if (ctx.coaching.coachConfidence >= 70) score += 5;

  // Penalty from instability
  if (ctx.predictions.momentumForecast.direction === "declining") score -= 10;
  if (ctx.reflection.momentumSignal === "slipping") score -= 8;
  if (ctx.mission.missionRisk === "high") score -= 5;
  if (ctx.decision.decisionState === "recalibrate") score -= 5;

  return Math.max(20, Math.min(95, score));
}

// ============================================================================
// RECOMMENDED LEVERS
// ============================================================================

function generateRecommendedLevers(state: ForecastState, ctx: ForecastContext): string[] {
  switch (state) {
    case "accelerating":
      return [
        `Set 3 stretch milestones for the next 30 days — your trajectory (${ctx.future.trajectoryStrength}%) can handle the challenge`,
        "Channel acceleration into one focused career path rather than spreading across multiple",
        "Schedule weekly reflection sessions to ensure acceleration doesn't tip into burnout",
        "Share your progress with a mentor or peer — external accountability compounds momentum",
      ];
    case "compounding":
      return [
        `Introduce one stretch goal per week to complement your steady cadence (mission: ${ctx.mission.missionScore}/100)`,
        "Use comparison sessions to ensure your current path still aligns with evolving preferences",
        "Increase session variety — mix quizzes, career views, and roadmap work to prevent routine fatigue",
        "Set a 30-day 'acceleration trigger' — a condition that, if met, shifts you from compounding to accelerating mode",
      ];
    case "stalled":
      return [
        "Start with a single 2-minute action today — one micro-step breaks the inertia cycle",
        `Address the top friction point: "${ctx.mission.missionBlocks[0]?.detail || "identify what's blocking progress"}"`,
        "Reset your goal to a smaller, achievable target for the next 7 days",
        "Use coaching intelligence (currently: mentor mode) for structured guidance through the stall",
      ];
    case "unstable":
      return [
        `Resolve contradictions systematically — start with: "${ctx.mission.missionBlocks[0]?.detail || "identify the most confusing signal"}"`,
        "Reduce decision surface area — focus on 2 career paths maximum for the next 2 weeks",
        "Increase quiz frequency to generate more signal and resolve uncertainty faster",
        "Use the comparison tool to create structured tradeoff documents for top options",
      ];
    case "recovering":
      return [
        "Focus on streak building — 3 consecutive days of any action establishes the recovery baseline",
        "Celebrate small wins explicitly — each completed action reinforces the recovery narrative",
        `Leverage the rebounding trajectory (${ctx.future.trajectoryStrength}%) to set gentle but directional goals`,
        "Avoid comparing current pace to pre-stall performance — recovery is its own progress metric",
      ];
  }
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

function gatherContext(): ForecastContext {
  return {
    future: getFutureSelf(),
    // Read pipeline modules from shared store with EMPTY fallbacks
    // to prevent circular dependency chains.
    decision: getStored<DecisionIntelligenceData>("decision-intelligence") ??
      (EMPTY_DECISION as unknown as DecisionIntelligenceData),
    story: getStored<CareerStoryData>("career-story") ??
      (EMPTY_CAREER_STORY as unknown as CareerStoryData),
    coaching: getStored<CoachingData>("coaching-intelligence") ??
      (EMPTY_COACHING as unknown as CoachingData),
    mission: getMissionIntelligence(),
    // Non-pipeline modules are safe to call directly:
    reflection: computeProgressReflection(),
    memory: loadJourneyMemory(),
    predictions: computePredictiveInsights(),
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute full growth forecast from current data sources.
 * Returns 30/60/90 day predictions with risks, opportunities,
 * confidence level, and levers to change the outcome.
 */
export function computeGrowthForecast(): GrowthForecastData {
  const ctx = gatherContext();

  // Detect forecast state
  const forecastState = detectForecastState(ctx);

  // Generate time predictions
  const days30Prediction = generateTimePrediction("30", forecastState, ctx);
  const days60Prediction = generateTimePrediction("60", forecastState, ctx);
  const days90Prediction = generateTimePrediction("90", forecastState, ctx);

  // Compute derived values
  const trajectoryStrength = computeTrajectoryStrength(ctx);
  const forecastRisks = detectForecastRisks(ctx);
  const forecastOpportunities = detectForecastOpportunities(ctx);
  const confidenceScore = computeConfidenceScore(ctx);
  const recommendedLevers = generateRecommendedLevers(forecastState, ctx);

  return {
    forecastState,
    days30Prediction,
    days60Prediction,
    days90Prediction,
    trajectoryStrength,
    forecastRisks,
    forecastOpportunities,
    confidenceScore,
    recommendedLevers,
  };
}

/**
 * Get metadata for a forecast state (label, icon, description).
 */
export function getForecastStateMeta(state: ForecastState): StateDef {
  return STATE_DEFS[state];
}
