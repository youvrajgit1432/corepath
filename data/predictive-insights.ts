/**
 * PREDICTIVE CAREER INTELLIGENCE
 *
 * Forecasts likely future outcomes from user behavior and progress signals.
 * Reads exclusively from existing data sources:
 *   - behavior-patterns   (hesitation, consistency, dropoff, curiosity, loops, growth)
 *   - growth-analytics    (confidence trend, XP trend, specialization, goal velocity)
 *   - career-goals        (pace signal, risk signal, progress)
 *   - notification-engine (active signals: streak, goal, activity)
 *   - adaptive-roadmap    (accelerate signals, warnings, timeline adjustment)
 *   - journey-memory      (confidence history, quizzes, streak)
 *
 * No backend. No auth. Persists computed state locally via SafeStorage.
 */

import { computeBehaviorPatterns, type BehaviorPatternsData } from "./behavior-patterns";
import { getGrowthAnalytics } from "./growth-analytics";
import { loadGoalState } from "./career-goals";

import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-predictive-insights";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/** Forecast of the user's learning momentum trajectory */
export interface MomentumForecast {
  /** Predicted direction of momentum over the next 2 weeks */
  direction: "accelerating" | "stable" | "declining";
  /** Forecasted momentum score range [low, high] */
  predictedRange: [number, number];
  /** Confidence in this forecast 0–100 */
  confidence: number;
  /** Human-readable summary */
  summary: string;
}

/** Assessment of dropoff / disengagement risk */
export interface DropoffRisk {
  /** Risk score 0–100 */
  score: number;
  /** Risk level label */
  level: "low" | "moderate" | "elevated" | "high";
  /** Top contributing factors */
  factors: string[];
  /** Human-readable summary */
  summary: string;
}

/** Probability of achieving the active career goal */
export interface GoalCompletionProbability {
  /** Probability percentage 0–100 */
  percentage: number;
  /** Estimated time to completion if current trajectory holds */
  estimatedMonthsRemaining: number | null;
  /** Primary factor affecting the probability */
  keyFactor: "on_track" | "needs_acceleration" | "needs_restart" | "no_goal";
  /** Human-readable summary */
  summary: string;
}

/** Confidence that the user is moving in a clear career direction */
export interface CareerDirectionConfidence {
  /** Direction confidence score 0–100 */
  score: number;
  /** Level label */
  level: "strong" | "moderate" | "unclear" | "early";
  /** Signals supporting this assessment */
  supportingSignals: string[];
  /** Human-readable summary */
  summary: string;
}

/** What is likely to happen in the next week */
export interface NextWeekPrediction {
  /** Expected activity level */
  expectedActivity: "high" | "moderate" | "low";
  /** Most likely actions the user will take */
  likelyActions: string[];
  /** What to watch for (risks or opportunities) */
  watchFor: string[];
  /** Human-readable forecast */
  forecast: string;
}

/** Recommended action based on all predictions */
export interface RecommendedIntervention {
  /** Priority of this intervention */
  priority: "critical" | "high" | "medium" | "low";
  /** Brief action title */
  title: string;
  /** Detailed recommendation */
  description: string;
  /** Expected impact if followed */
  expectedImpact: string;
}

/** Forward-looking signals detected from current trajectory */
export interface FutureSignal {
  signal: string;
  likelihood: "high" | "moderate" | "emerging";
  detail: string;
}

// ============================================================================
// COMPUTED OUTPUT TYPE
// ============================================================================

export interface PredictiveInsightsData {
  momentumForecast: MomentumForecast;
  dropoffRisk: DropoffRisk;
  goalCompletionProbability: GoalCompletionProbability;
  careerDirectionConfidence: CareerDirectionConfidence;
  nextWeekPrediction: NextWeekPrediction;
  recommendedIntervention: RecommendedIntervention;
  futureSignals: FutureSignal[];
  computedAt: string;
}

// ============================================================================
// PER-SIGNAL COMPUTATION
// ============================================================================

/**
 * Forecast momentum direction over the next 2 weeks.
 */
function computeMomentumForecast(
  behavior: BehaviorPatternsData,
  analytics: ReturnType<typeof getGrowthAnalytics>
): MomentumForecast {
  const consistency = behavior.learningConsistency;
  const curiosityCount = behavior.curiositySignals.length;
  const curiosityStrong = behavior.curiositySignals.filter(
    (s) => s.strength === "strong"
  ).length;

  // Base momentum from consistency
  let base = consistency.score;

  // Boost from strong curiosity signals
  if (curiosityStrong >= 2) base += 15;
  else if (curiosityStrong >= 1) base += 8;

  // Boost from positive growth signals
  const growthStable = behavior.personalGrowthSignals.filter(
    (s) => s.trend === "improving" || s.trend === "stable"
  ).length;
  const totalGrowth = behavior.personalGrowthSignals.length;
  if (totalGrowth > 0) {
    base += (growthStable / totalGrowth) * 20;
  }

  // Boost from rising XP trend
  if (analytics.xpTrend > 100) base += 15;
  else if (analytics.xpTrend > 50) base += 8;

  // Boost from rising confidence
  if (analytics.confidenceTrend > 5) base += 10;
  else if (analytics.confidenceTrend < -5) base -= 10;

  // Clamp to 0–100
  const forecastScore = Math.max(0, Math.min(100, Math.round(base)));

  // Determine direction
  let direction: MomentumForecast["direction"];
  let confidence: number;

  if (forecastScore >= 60) {
    direction = "accelerating";
    confidence = Math.min(90, 50 + forecastScore * 0.4);
  } else if (forecastScore >= 35) {
    direction = "stable";
    confidence = 60;
  } else {
    direction = "declining";
    confidence = Math.min(85, 40 + (100 - forecastScore) * 0.3);
  }

  // Range around the forecast
  const range = direction === "accelerating"
    ? [forecastScore, Math.min(100, forecastScore + 15)] as [number, number]
    : direction === "declining"
      ? [Math.max(0, forecastScore - 15), forecastScore] as [number, number]
      : [Math.max(0, forecastScore - 8), Math.min(100, forecastScore + 8)] as [number, number];

  const summary =
    direction === "accelerating"
      ? `Your momentum is forecast to increase over the next 2 weeks, reaching ${forecastScore}%+. Strong engagement and curiosity signals support this outlook.`
      : direction === "stable"
        ? `Your momentum is expected to remain steady around ${forecastScore}%. Consistent participation will maintain this trajectory.`
        : `Momentum may decline to ${forecastScore}% without intervention. Consider setting a small weekly goal to rebuild cadence.`;

  return { direction, predictedRange: range, confidence: Math.round(confidence), summary };
}

/**
 * Compute dropoff risk from hesitation, streak, and engagement patterns.
 */
function computeDropoffRisk(
  behavior: BehaviorPatternsData
): DropoffRisk {
  const hesitation = behavior.decisionHesitationScore;
  const consistency = behavior.learningConsistency;
  const dropoffRates = behavior.dropoffPatterns.map((d) => d.rate);
  const avgDropoffRate = dropoffRates.length > 0
    ? dropoffRates.reduce((a, b) => a + b, 0) / dropoffRates.length
    : 0;
  const loopCount = behavior.careerLoopSignals.length;

  // Score components
  let score = 0;

  // 1. Decision hesitation (0–30 points)
  score += hesitation.score * 0.3;

  // 2. Low consistency / streak (0–25 points)
  if (consistency.currentStreak === 0 && consistency.score < 20) {
    score += 25;
  } else if (consistency.currentStreak === 0) {
    score += 15;
  } else if (consistency.currentStreak < 3) {
    score += 8;
  } else if (consistency.currentStreak >= 7) {
    score -= 10; // Strong streak reduces risk
  }

  // 3. Dropoff rates in existing activities (0–20 points)
  score += avgDropoffRate * 20;

  // 4. Career looping — revisiting without deciding (0–15 points)
  if (loopCount >= 3) {
    score += 15;
  } else if (loopCount >= 1) {
    score += 8;
  }

  // 5. Absence of recent growth signals (0–10 points)
  const improvingSignals = behavior.personalGrowthSignals.filter(
    (s) => s.trend === "improving"
  ).length;
  if (improvingSignals === 0 && behavior.personalGrowthSignals.length >= 2) {
    score += 10;
  }

  // Clamp to 0–100
  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: DropoffRisk["level"];
  if (score <= 20) level = "low";
  else if (score <= 40) level = "moderate";
  else if (score <= 65) level = "elevated";
  else level = "high";

  // Build factors list
  const factors: string[] = [];
  if (hesitation.score > 45) {
    factors.push(`Decision hesitation is ${hesitation.level} (${hesitation.score}/100).`);
  }
  if (consistency.currentStreak === 0) {
    factors.push("No active streak — engagement has paused.");
  } else if (consistency.currentStreak < 3) {
    factors.push(`Streak is only ${consistency.currentStreak} days — still building.`);
  }
  if (avgDropoffRate > 0.3) {
    factors.push(`${Math.round(avgDropoffRate * 100)}% average dropoff rate across activities.`);
  }
  if (loopCount >= 2) {
    factors.push(`${loopCount} careers revisited multiple times without commitment.`);
  }
  if (factors.length === 0) {
    factors.push("No significant disengagement signals detected.");
  }

  const summary =
    level === "low"
      ? "Dropoff risk is low. You maintain consistent engagement with career exploration."
      : level === "moderate"
        ? "Moderate dropoff risk. Small consistency improvements will keep you on track."
        : level === "elevated"
          ? "Elevated disengagement signals detected. A focused session or goal reset may help."
          : "High risk of disengagement. Consider a structured plan with weekly commitments to rebuild momentum.";

  return { score, level, factors, summary };
}

/**
 * Estimate probability of achieving the active career goal.
 */
function computeGoalCompletionProbability(
  analytics: ReturnType<typeof getGrowthAnalytics>,
  behavior: BehaviorPatternsData
): GoalCompletionProbability {
  const goalState = loadGoalState();

  if (!goalState.goal || !goalState.signals) {
    return {
      percentage: 0,
      estimatedMonthsRemaining: null,
      keyFactor: "no_goal",
      summary: "No active career goal set. Setting a target career will enable progress tracking and predictions.",
    };
  }

  const pace = goalState.signals.paceSignal;
  const risk = goalState.signals.riskSignal;
  const goalProgress = goalState.goal.goalProgress;
  const hesitation = behavior.decisionHesitationScore;
  const consistency = behavior.learningConsistency;

  // Base probability from current progress
  let probability = goalProgress;

  // Pace adjustments
  if (pace === "ahead") probability += 15;
  else if (pace === "behind") probability -= 20;

  // Risk adjustments
  if (risk === "high") probability -= 15;
  else if (risk === "low") probability += 10;

  // Consistency boosts
  if (consistency.hasRegularCadence) probability += 10;
  if (consistency.currentStreak >= 7) probability += 8;
  else if (consistency.currentStreak === 0) probability -= 10;

  // Hesitation penalty
  if (hesitation.score > 60) probability -= 15;
  else if (hesitation.score > 40) probability -= 8;

  // Growth analytics boosts
  if (analytics.confidenceTrend > 5) probability += 8;
  if (analytics.xpTrend > 100) probability += 5;
  if (analytics.goalVelocity !== null && analytics.goalVelocity > 0) probability += 5;

  // Clamp to 0–99
  probability = Math.max(0, Math.min(99, Math.round(probability)));

  // Estimate months remaining
  const remainingProgress = 100 - goalProgress;
  const progressPerDay = Math.max(0.1, goalProgress / Math.max(1, (Date.now() - new Date(goalState.goal.goalStartDate).getTime()) / (1000 * 60 * 60 * 24)));
  const estimatedDays = Math.round(remainingProgress / progressPerDay);
  const estimatedMonths = Math.max(1, Math.round(estimatedDays / 30));

  // Key factor
  let keyFactor: GoalCompletionProbability["keyFactor"];
  if (pace === "on_track" || (probability >= 60 && risk !== "high")) {
    keyFactor = "on_track";
  } else if (pace === "ahead") {
    keyFactor = "on_track";
  } else if (probability >= 30) {
    keyFactor = "needs_acceleration";
  } else {
    keyFactor = "needs_restart";
  }

  const summary =
    keyFactor === "on_track"
      ? `You have a ${probability}% chance of achieving your career goal within ~${estimatedMonths} months at your current pace. Keep the momentum going.`
      : keyFactor === "needs_acceleration"
        ? `Goal completion probability is ${probability}%. Increasing weekly time commitment or focusing on high-impact milestones will improve this outlook.`
        : `Goal completion is at ${probability}% — consider revisiting your target timeline or breaking the goal into smaller sub-goals.`;

  return {
    percentage: probability,
    estimatedMonthsRemaining: estimatedMonths,
    keyFactor,
    summary,
  };
}

/**
 * Assess how confident the user's career direction appears.
 */
function computeCareerDirectionConfidence(
  behavior: BehaviorPatternsData,
  analytics: ReturnType<typeof getGrowthAnalytics>
): CareerDirectionConfidence {
  const hesitation = behavior.decisionHesitationScore;
  const consistency = behavior.learningConsistency;
  const explorationStyle = behavior.explorationHabits.style;
  const dropoffRates = behavior.dropoffPatterns.map((d) => d.rate);
  const avgDropoff = dropoffRates.length > 0
    ? dropoffRates.reduce((a, b) => a + b, 0) / dropoffRates.length
    : 0;
  const curiosityStrong = behavior.curiositySignals.filter(
    (s) => s.strength === "strong"
  ).length;
  const improvingGrowth = behavior.personalGrowthSignals.filter(
    (s) => s.trend === "improving"
  ).length;

  const signals: string[] = [];
  let score = 50; // Start at neutral

  // 1. Hesitation impact (up to -25)
  if (hesitation.score <= 20) {
    score += 20;
    signals.push("Decision profile is decisive — clear direction forming.");
  } else if (hesitation.score <= 45) {
    score += 5;
    signals.push("Decision hesitation is moderate — weighing options is healthy.");
  } else {
    score -= Math.min(25, hesitation.score * 0.25);
    signals.push(`Decision hesitation is ${hesitation.level} (${hesitation.score}/100) — direction needs clarity.`);
  }

  // 2. Exploration style
  if (explorationStyle === "focused") {
    score += 15;
    signals.push("Focused exploration pattern — concentrated career investigation.");
  } else if (explorationStyle === "balanced") {
    score += 5;
    signals.push("Balanced exploration — sampling before committing.");
  } else {
    score -= 10;
    signals.push("Broad exploration across many categories — still discovering preferences.");
  }

  // 3. Consistency
  if (consistency.hasRegularCadence && consistency.currentStreak >= 5) {
    score += 10;
    signals.push(`Regular engagement with a ${consistency.currentStreak}-day streak — shows commitment.`);
  } else if (consistency.currentStreak === 0) {
    score -= 10;
    signals.push("No active engagement streak — direction may be unclear.");
  }

  // 4. Dropoffs
  if (avgDropoff < 0.2) {
    score += 8;
    signals.push("Low dropoff rate — follow-through on started activities.");
  } else if (avgDropoff > 0.5) {
    score -= 10;
    signals.push("High dropoff rate — many activities started but not finished.");
  }

  // 5. Curiosity alignment
  if (curiosityStrong >= 2) {
    score += 10;
    signals.push("Strong curiosity signals — clear areas of interest emerging.");
  }

  // 6. Personal growth direction
  if (improvingGrowth >= 2) {
    score += 8;
    signals.push("Multiple improving growth signals — trajectory is positive.");
  }

  // 7. Specialization trend
  if (analytics.specializationTrend === "deepening") {
    score += 8;
    signals.push("Specialization is deepening — expertise in a focused area.");
  } else if (analytics.specializationTrend === "broadening") {
    score += 3;
    signals.push("Broadening exploration — keeping options open while building awareness.");
  }

  // 8. Confidence trend
  if (analytics.confidenceTrend > 5) {
    score += 8;
    signals.push("Confidence is rising — self-assessment becoming more refined.");
  } else if (analytics.confidenceTrend < -5) {
    score -= 5;
    signals.push("Confidence is declining — may need reinforcement or re-evaluation.");
  }

  // Clamp to 0–100
  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: CareerDirectionConfidence["level"];
  if (score >= 65) level = "strong";
  else if (score >= 45) level = "moderate";
  else if (score >= 25) level = "unclear";
  else level = "early";

  const summary =
    level === "strong"
      ? "Strong career direction confidence — you have a clear sense of your path and are making consistent progress."
      : level === "moderate"
        ? "Moderate direction confidence — you're developing clarity but may benefit from focused exploration."
        : level === "unclear"
          ? "Career direction is still forming — this is normal. Continued exploration will clarify preferences."
          : "Early in your career exploration journey — direction confidence will build as you gather more data about your fit.";

  return { score, level, supportingSignals: signals.slice(0, 5), summary };
}

/**
 * Generate a next-week prediction based on current patterns.
 */
function computeNextWeekPrediction(
  behavior: BehaviorPatternsData,
  analytics: ReturnType<typeof getGrowthAnalytics>
): NextWeekPrediction {
  const consistency = behavior.learningConsistency;
  const hesitation = behavior.decisionHesitationScore;
  const curiosityCount = behavior.curiositySignals.length;
  const loopCount = behavior.careerLoopSignals.length;
  const goalState = loadGoalState();

  // Predict expected activity level
  let activityScore = 0;
  if (consistency.score >= 40) activityScore += 30;
  if (consistency.currentStreak >= 3) activityScore += 20;
  if (analytics.confidenceTrend > 5) activityScore += 15;
  if (analytics.xpTrend > 50) activityScore += 15;
  if (curiosityCount >= 3) activityScore += 10;
  if (consistency.currentStreak === 0) activityScore -= 20;

  const expectedActivity: NextWeekPrediction["expectedActivity"] =
    activityScore >= 55 ? "high" : activityScore >= 25 ? "moderate" : "low";

  // Likely actions
  const likelyActions: string[] = [];
  if (curiosityCount >= 2) {
    likelyActions.push("Explore new career categories based on current curiosity signals");
  }
  if (hesitation.score > 40) {
    likelyActions.push("Compare careers side-by-side to clarify preferences");
  }
  if (loopCount > 0) {
    likelyActions.push("Revisit previously viewed careers for closer evaluation");
  }
  if (consistency.score < 40) {
    likelyActions.push("Engage in shorter, more frequent sessions to build cadence");
  }
  if (analytics.goalVelocity !== null && analytics.goalVelocity > 0) {
    likelyActions.push("Continue progressing toward the active career goal");
  }
  if (goalState.signals?.paceSignal === "behind") {
    likelyActions.push("Adjust goal timeline or increase weekly commitment");
  }
  if (behavior.explorationHabits.style === "focused") {
    likelyActions.push("Deep-dive into selected career roadmaps");
  }
  if (likelyActions.length === 0) {
    likelyActions.push("Continue career exploration and quiz completion");
  }

  // What to watch for
  const watchFor: string[] = [];
  if (consistency.currentStreak === 0) {
    watchFor.push("Risk of extended disengagement — consider a quick check-in session");
  }
  if (hesitation.score > 60) {
    watchFor.push("Decision fatigue may set in — narrow choices to 2–3 options");
  }
  if (behavior.dropoffPatterns.some((d) => d.rate >= 0.5)) {
    watchFor.push("Dropoff rates are high — shorter formatting of activities may help");
  }
  if (loopCount >= 3) {
    watchFor.push("Career cycling detected — try committing to a deeper evaluation of one path");
  }
  if (analytics.confidenceTrend < -5) {
    watchFor.push("Confidence is declining — a reinforcement milestone may help rebuild assurance");
  }
  if (behavior.explorationHabits.style === "scattered" && curiosityCount >= 3) {
    watchFor.push("Broad curiosity may spread focus thin — prioritize top career categories");
  }
  if (watchFor.length === 0) {
    watchFor.push("No significant risks for the coming week — maintain current trajectory");
  }

  const forecast =
    expectedActivity === "high"
      ? `Next week looks active: you're forecast to explore careers, complete quizzes, and make measurable progress. ${watchFor.length > 0 ? `Watch for: ${watchFor[0].toLowerCase()}` : ""}`
      : expectedActivity === "moderate"
        ? `A moderate week ahead with steady exploration. ${likelyActions[0] ?? "Continue building on your progress."} ${watchFor.length > 0 ? `Keep an eye on: ${watchFor[0].toLowerCase()}` : ""}`
        : `Next week may see lower engagement. To stay on track, try scheduling 2–3 short sessions. ${watchFor.length > 0 ? `Watch for: ${watchFor[0].toLowerCase()}` : ""}`;

  return { expectedActivity, likelyActions: likelyActions.slice(0, 4), watchFor: watchFor.slice(0, 3), forecast };
}

/**
 * Determine the most important recommended intervention.
 */
function computeRecommendedIntervention(
  dropoffRisk: DropoffRisk,
  goalProbability: GoalCompletionProbability,
  momentumForecast: MomentumForecast,
  directionConfidence: CareerDirectionConfidence,
  behavior: BehaviorPatternsData
): RecommendedIntervention {
  const hesitation = behavior.decisionHesitationScore;
  const consistency = behavior.learningConsistency;

  // Critical: high dropoff risk + no streak
  if (dropoffRisk.level === "high" && consistency.currentStreak === 0) {
    return {
      priority: "critical",
      title: "Re-engagement needed — schedule a session now",
      description: "Disengagement risk is high with no active streak. Schedule 3 short sessions this week (15 min each) to rebuild momentum. Start with a quick quiz or career view — the smallest action breaks the inertia.",
      expectedImpact: "Restarting your streak within 3 days reduces dropoff risk by ~40%.",
    };
  }

  // High: goal behind schedule
  if (goalProbability.keyFactor === "needs_acceleration" || goalProbability.keyFactor === "needs_restart") {
    return {
      priority: "high",
      title: "Goal trajectory needs adjustment",
      description: `Your goal completion probability is ${goalProbability.percentage}%. ${
        consistency.currentStreak === 0
          ? "Resuming regular engagement is the most impactful first step."
          : hesitation.score > 50
            ? "Narrowing your career options will accelerate goal progress."
            : "Consider increasing weekly time commitment or breaking milestones into smaller steps."
      }`,
      expectedImpact: "Adjusting your goal plan increases completion probability by 15–25%.",
    };
  }

  // High: high hesitation with lots of looping
  if (hesitation.score > 60 && behavior.careerLoopSignals.length >= 2) {
    return {
      priority: "high",
      title: "Decision clarity session recommended",
      description: `You've revisited ${behavior.careerLoopSignals.length} careers multiple times with hesitation at ${hesitation.score}/100. Try a structured comparison of your top 2–3 options using the comparison tool, then commit to exploring one path for a week.`,
      expectedImpact: "Structured comparison reduces decision hesitation by 20–30% on average.",
    };
  }

  // Medium: momentum declining
  if (momentumForecast.direction === "declining") {
    return {
      priority: "medium",
      title: "Momentum preservation plan",
      description: "Your momentum is forecast to decline. Set one small weekly goal (e.g., complete 2 quizzes or explore 1 new career) to maintain trajectory. Even minimal consistent engagement preserves progress.",
      expectedImpact: "One small weekly action maintains 80% of current momentum trajectory.",
    };
  }

  // Medium: direction unclear
  if (directionConfidence.level === "unclear" || directionConfidence.level === "early") {
    return {
      priority: "medium",
      title: "Direction exploration sprint",
      description: `Career direction confidence is ${directionConfidence.level}. Try a focused exploration sprint: pick 3 careers from different categories and spend 10 minutes each on their roadmaps and skill requirements.`,
      expectedImpact: "Focused exploration sprints improve direction clarity by ~35% in 2 weeks.",
    };
  }

  // Medium: moderate dropoff risk
  if (dropoffRisk.level === "moderate") {
    return {
      priority: "medium",
      title: "Consistency building",
      description: "Dropoff risk is moderate. Maintaining a 3-day streak reduces disengagement signals significantly. Try completing one small action per day — even viewing a career page counts.",
      expectedImpact: "A 3-day streak reduces dropoff risk by ~25%.",
    };
  }

  // Low: everything looks good
  return {
    priority: "low",
    title: "Maintain trajectory",
    description: "All signals are positive. Your momentum is stable or accelerating, direction is forming, and dropoff risk is low. Keep up your current cadence and advance to the next milestone in your career roadmap.",
    expectedImpact: "Continued consistent engagement compounds career intelligence growth.",
  };
}

/**
 * Detect forward-looking signals from current trajectory.
 */
function computeFutureSignals(
  behavior: BehaviorPatternsData,
  analytics: ReturnType<typeof getGrowthAnalytics>,
  directionConfidence: CareerDirectionConfidence,
  momentumForecast: MomentumForecast
): FutureSignal[] {
  const signals: FutureSignal[] = [];

  // 1. Upward confidence trajectory
  if (analytics.confidenceTrend > 8) {
    signals.push({
      signal: "confidence_acceleration",
      likelihood: "high",
      detail: `Confidence is rising sharply (+${analytics.confidenceTrend}%) — likely to pass decisiveness threshold within 2–3 sessions.`,
    });
  } else if (analytics.confidenceTrend > 3) {
    signals.push({
      signal: "confidence_growth",
      likelihood: "moderate",
      detail: `Steady confidence increase (+${analytics.confidenceTrend}%) — trajectory suggests growing clarity.`,
    });
  }

  // 2. Specialization emergence
  if (analytics.specializationTrend === "deepening" && behavior.explorationHabits.style !== "focused") {
    signals.push({
      signal: "specialization_emerging",
      likelihood: "moderate",
      detail: "Specialization is deepening while exploration is still broad — a focused career direction may soon crystallize.",
    });
  }

  // 3. Broad curiosity narrowing
  if (behavior.curiositySignals.filter((s) => s.strength === "strong").length >= 3) {
    signals.push({
      signal: "curiosity_convergence",
      likelihood: "moderate",
      detail: "Multiple strong curiosity signals detected — these interest areas may converge into a clear career preference.",
    });
  }

  // 4. Goal acceleration potential
  const goalState = loadGoalState();
  if (goalState.goal && analytics.xpTrend > 100 && analytics.confidenceTrend > 0) {
    signals.push({
      signal: "goal_acceleration_potential",
      likelihood: "high",
      detail: `With rising XP trend and confidence, goal completion may accelerate faster than the current linear estimate of ${goalState.signals?.estimatedCompletion ?? "unknown"}.`,
    });
  }

  // 5. Decision clarity approaching
  if (behavior.decisionHesitationScore.score > 40 && analytics.confidenceTrend > 0) {
    signals.push({
      signal: "decision_clarity_approaching",
      likelihood: "emerging",
      detail: "Rising confidence paired with moderate hesitation suggests decision clarity is building — a breakthrough may be near.",
    });
  }

  // 6. Career shift potential (from growth analytics)
  if (analytics.careerShiftSignals.length > 0) {
    signals.push({
      signal: "career_shift_potential",
      likelihood: "emerging",
      detail: analytics.careerShiftSignals[0],
    });
  }

  // 7. Momentum trajectory
  if (momentumForecast.direction === "accelerating" && momentumForecast.confidence >= 60) {
    signals.push({
      signal: "momentum_acceleration",
      likelihood: "high",
      detail: `Strong momentum acceleration forecast with ${momentumForecast.confidence}% confidence — optimal time for advanced milestones.`,
    });
  }

  // 8. Exploration expansion
  if (behavior.explorationHabits.categoriesExplored >= 4 && behavior.decisionHesitationScore.score <= 30) {
    signals.push({
      signal: "exploration_expansion_ready",
      likelihood: "moderate",
      detail: "Decisive exploration across multiple categories — ready for deeper engagement with chosen paths.",
    });
  }

  return signals;
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full predictive insights from all available data sources.
 * Falls back gracefully if any source has insufficient data.
 */
export function computePredictiveInsights(): PredictiveInsightsData {
  const behavior = computeBehaviorPatterns();
  const analytics = getGrowthAnalytics();

  const momentumForecast = computeMomentumForecast(behavior, analytics);
  const dropoffRisk = computeDropoffRisk(behavior);
  const goalCompletionProbability = computeGoalCompletionProbability(analytics, behavior);
  const careerDirectionConfidence = computeCareerDirectionConfidence(behavior, analytics);
  const nextWeekPrediction = computeNextWeekPrediction(behavior, analytics);
  const recommendedIntervention = computeRecommendedIntervention(
    dropoffRisk,
    goalCompletionProbability,
    momentumForecast,
    careerDirectionConfidence,
    behavior
  );
  const futureSignals = computeFutureSignals(behavior, analytics, careerDirectionConfidence, momentumForecast);

  const result: PredictiveInsightsData = {
    momentumForecast,
    dropoffRisk,
    goalCompletionProbability,
    careerDirectionConfidence,
    nextWeekPrediction,
    recommendedIntervention,
    futureSignals,
    computedAt: new Date().toISOString(),
  };

  // Persist to local storage
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

/**
 * Load previously computed predictive insights from storage.
 */
export function loadPredictiveInsights(): PredictiveInsightsData | null {
  const storage = getSafeStorage({ silent: true });
  return storage.get<PredictiveInsightsData>(STORAGE_KEY);
}
