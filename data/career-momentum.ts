/**
 * CAREER MOMENTUM INTELLIGENCE
 *
 * Answers: "Is the user accelerating or slowing down?"
 *
 * Detects momentum signals from future-self, engagement-pulse, goal-tracker,
 * mission-intelligence, career-progress, and journey-memory.
 *
 * Behavior:
 *   momentumScore >= 65 → increase challenge
 *   momentumScore <  40 → recovery recommendations
 *
 * No backend. No auth. All data is local.
 */

import { getFutureSelf } from "./future-self";
import { getEngagementPulse } from "./engagement-pulse";
import { loadGoalState } from "./career-goals";
import { getMissionIntelligence } from "./mission-intelligence";
import { loadCareerProgress, computeCareerProgress } from "./career-progress";
import { loadJourneyMemory } from "./journey-memory";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface MomentumSignal {
  label: string;
  value: number;
  source: string;
}

export interface RecoveryAction {
  action: string;
  reason: string;
  difficulty: "easier" | "moderate" | "challenging";
}

export interface CareerMomentumData {
  /** Overall momentum score 0–100 */
  momentumScore: number;
  /** Trend direction */
  momentumTrend: "accelerating" | "steady" | "slowing" | "stalled";
  /** Positive signals driving momentum */
  accelerationSignals: MomentumSignal[];
  /** Negative signals dragging momentum */
  slowdownSignals: MomentumSignal[];
  /** Ranked contributions from each source */
  momentumDrivers: MomentumSignal[];
  /** Recovery recommendations when momentum is weak */
  recoveryActions: RecoveryAction[];
  /** Narrative summary */
  momentumNarrative: string;
  /** When this was computed */
  computedAt: number;
}

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cached: CareerMomentumData | null = null;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Load cached momentum data without recomputing.
 */
export function loadCareerMomentum(): CareerMomentumData | null {
  return cached;
}

/**
 * Get current career momentum data (cached or freshly computed).
 */
export function getCareerMomentum(): CareerMomentumData {
  if (cached && Date.now() - cached.computedAt < CACHE_TTL) {
    return cached;
  }
  cached = computeCareerMomentum();
  return cached;
}

// ============================================================================
// CORE ENGINE
// ============================================================================

function computeCareerMomentum(): CareerMomentumData {
  // ── Gather context from all 6 sources ─────────────────────────────────
  const future = getFutureSelf();
  const pulse = getEngagementPulse();
  const goalState = loadGoalState();
  const mission = getMissionIntelligence();
  const progress = loadCareerProgress() ?? computeCareerProgress();
  const journey = loadJourneyMemory();

  // ── Source signals ────────────────────────────────────────────────────
  const trajectoryStrength = future?.trajectoryStrength ?? 50;
  const futureConfidence = future?.confidenceScore ?? 50;
  const growthCatalysts = future?.growthCatalysts ?? [];
  const riskFactors = future?.riskFactors ?? [];

  const pulseScore = pulse?.pulseScore ?? 50;
  const pulseDimensions = pulse?.dimensions ?? [];
  const fatigueSignals = pulse?.fatigueSignals ?? [];
  const consistencyDim = pulseDimensions.find(
    (d) => d.name === "consistency_streak"
  );
  const consistencyScore = consistencyDim?.score ?? 50;
  const energyDim = pulseDimensions.find((d) => d.name === "engagement_energy");
  const energyStatus = energyDim?.status ?? "neutral";

  const goalProgress = goalState?.goal?.goalProgress ?? 50;
  const paceSignal = goalState?.signals?.paceSignal ?? "on_track";
  const goalRisk = goalState?.signals?.riskSignal ?? "low";

  const missionScore = mission?.missionScore ?? 50;
  const missionMomentum = mission?.missionMomentum ?? 50;
  const missionRisk = mission?.missionRisk ?? "low";

  const progressScore = progress?.overallProgressScore ?? 50;
  const learningMomentum = progress?.learningMomentum ?? 50;

  const confidenceHistory = journey?.confidenceHistory ?? [];
  const completedQuizzes = journey?.completedQuizzes ?? 0;

  // ── Detect momentum signals ───────────────────────────────────────────

  // Acceleration signals
  const accSignals: MomentumSignal[] = [];

  if (trajectoryStrength >= 65) {
    accSignals.push({
      label: "Strong future trajectory",
      value: trajectoryStrength,
      source: "future-self",
    });
  }
  if (pulseScore >= 65) {
    accSignals.push({
      label: "High engagement energy",
      value: pulseScore,
      source: "engagement-pulse",
    });
  }
  if (missionMomentum >= 60) {
    accSignals.push({
      label: "Mission momentum building",
      value: missionMomentum,
      source: "mission-intelligence",
    });
  }
  if (paceSignal === "ahead") {
    accSignals.push({
      label: "Ahead of goal schedule",
      value: Math.min(100, goalProgress + 10),
      source: "goal-tracker",
    });
  }
  if (growthCatalysts.length >= 2) {
    accSignals.push({
      label: `${growthCatalysts.length} active growth catalysts`,
      value: 80,
      source: "future-self",
    });
  }
  if (energyStatus === "positive" && consistencyScore >= 55) {
    accSignals.push({
      label: "Rising consistency & energy",
      value: Math.round((consistencyScore + 70) / 2),
      source: "engagement-pulse",
    });
  }
  if (learningMomentum >= 60) {
    accSignals.push({
      label: "Strong learning momentum",
      value: learningMomentum,
      source: "career-progress",
    });
  }

  // Slowdown signals
  const slowSignals: MomentumSignal[] = [];

  if (trajectoryStrength < 40) {
    slowSignals.push({
      label: "Weak future trajectory",
      value: 100 - trajectoryStrength,
      source: "future-self",
    });
  }
  if (pulseScore < 40) {
    slowSignals.push({
      label: "Low engagement pulse",
      value: 100 - pulseScore,
      source: "engagement-pulse",
    });
  }
  if (fatigueSignals.length > 0) {
    const maxFatigue = Math.max(...fatigueSignals.map((f) => f.severity === "high" ? 80 : 50));
    slowSignals.push({
      label: `${fatigueSignals.length} fatigue signal${fatigueSignals.length > 1 ? "s" : ""} detected`,
      value: maxFatigue,
      source: "engagement-pulse",
    });
  }
  if (missionRisk === "high" || missionScore < 35) {
    slowSignals.push({
      label: missionRisk === "high" ? "High mission risk" : "Low mission score",
      value: missionRisk === "high" ? 75 : 100 - missionScore,
      source: "mission-intelligence",
    });
  }
  if (paceSignal === "behind" || goalRisk === "high") {
    slowSignals.push({
      label: goalRisk === "high" ? "High goal risk" : "Behind on goal pace",
      value: goalRisk === "high" ? 80 : 65,
      source: "goal-tracker",
    });
  }
  if (consistencyScore < 35) {
    slowSignals.push({
      label: "Low consistency streak",
      value: 100 - consistencyScore,
      source: "engagement-pulse",
    });
  }
  if (learningMomentum < 35) {
    slowSignals.push({
      label: "Declining learning momentum",
      value: 100 - learningMomentum,
      source: "career-progress",
    });
  }
  if (riskFactors.some((r) => r.factor.toLowerCase().includes("momentum") || r.factor.toLowerCase().includes("slow"))) {
    slowSignals.push({
      label: "Momentum risk flagged",
      value: 65,
      source: "future-self",
    });
  }

  // ── Momentum score ────────────────────────────────────────────────────
  const rawScore =
    trajectoryStrength * 0.20 +
    pulseScore * 0.18 +
    missionScore * 0.17 +
    goalProgress * 0.15 +
    progressScore * 0.15 +
    consistencyScore * 0.10 +
    learningMomentum * 0.05;

  // Fatigue penalty
  const fatiguePenalty = fatigueSignals.length > 0
    ? Math.min(15, fatigueSignals.length * 5)
    : 0;

  // Goal risk penalty
  const goalPenalty = goalRisk === "high" ? 10 : goalRisk === "medium" ? 5 : 0;

  // Mission risk penalty
  const missionPenalty = missionRisk === "high" ? 8 : 0;

  // Confidence decline penalty
  const confidenceTrend = detectConfidenceTrend(confidenceHistory);
  const confidencePenalty = confidenceTrend === "declining" ? 5 : 0;

  const momentumScore = Math.round(
    Math.max(0, Math.min(100, rawScore - fatiguePenalty - goalPenalty - missionPenalty - confidencePenalty))
  );

  // ── Momentum trend ────────────────────────────────────────────────────
  const momentumTrend = detectMomentumTrend(
    momentumScore,
    energyStatus,
    fatigueSignals.length,
    consistencyScore
  );

  // ── Momentum drivers (ranked) ─────────────────────────────────────────
  const drivers: MomentumSignal[] = [];

  drivers.push({
    label: "Future trajectory",
    value: trajectoryStrength,
    source: "future-self",
  });
  drivers.push({
    label: "Engagement pulse",
    value: pulseScore,
    source: "engagement-pulse",
  });
  drivers.push({
    label: "Mission performance",
    value: missionScore,
    source: "mission-intelligence",
  });
  drivers.push({
    label: "Goal progress",
    value: goalProgress,
    source: "goal-tracker",
  });
  drivers.push({
    label: "Career progress velocity",
    value: progressScore,
    source: "career-progress",
  });
  drivers.push({
    label: "Consistency score",
    value: consistencyScore,
    source: "engagement-pulse",
  });
  drivers.push({
    label: "Learning momentum",
    value: learningMomentum,
    source: "career-progress",
  });

  drivers.sort((a, b) => b.value - a.value);

  // ── Recovery actions ──────────────────────────────────────────────────
  const recoveryActions = buildRecoveryActions(
    momentumScore,
    trajectoryStrength,
    pulseScore,
    consistencyScore,
    missionScore,
    goalRisk,
    fatigueSignals.length,
    learningMomentum,
    completedQuizzes
  );

  // ── Narrative ─────────────────────────────────────────────────────────
  const momentumNarrative = buildNarrative(
    momentumScore,
    momentumTrend,
    accSignals.length,
    slowSignals.length,
    trajectoryStrength,
    pulseScore
  );

  return {
    momentumScore,
    momentumTrend,
    accelerationSignals: accSignals,
    slowdownSignals: slowSignals,
    momentumDrivers: drivers,
    recoveryActions,
    momentumNarrative,
    computedAt: Date.now(),
  };
}

// ============================================================================
// DETECTION HELPERS
// ============================================================================

function detectConfidenceTrend(history: number[]): "rising" | "declining" | "stable" {
  if (history.length < 3) return "stable";

  const recent = history.slice(-3);

  if (recent[2] > recent[0] + 5) return "rising";
  if (recent[2] < recent[0] - 5) return "declining";
  return "stable";
}

function detectMomentumTrend(
  score: number,
  energyStatus: string,
  fatigueCount: number,
  consistencyScore: number
): CareerMomentumData["momentumTrend"] {
  if (score < 25) return "stalled";
  if (score < 45 && fatigueCount > 0) return "slowing";
  if (score >= 70 && energyStatus === "positive" && consistencyScore >= 50) return "accelerating";
  if (score < 45) return "slowing";
  return "steady";
}

function buildRecoveryActions(
  momentumScore: number,
  trajectoryStrength: number,
  pulseScore: number,
  consistencyScore: number,
  missionScore: number,
  goalRisk: string,
  fatigueCount: number,
  learningMomentum: number,
  completedQuizzes: number
): RecoveryAction[] {
  const actions: RecoveryAction[] = [];

  if (momentumScore >= 65) {
    actions.push({
      action: "Increase mission challenge — add one higher-difficulty task per week",
      reason: "Strong momentum supports growth through increased challenge.",
      difficulty: "moderate",
    });
    if (trajectoryStrength >= 70) {
      actions.push({
        action: "Explore adjacent career paths or advanced specializations",
        reason: "Your trajectory shows room for expanded scope.",
        difficulty: "challenging",
      });
    }
  } else if (momentumScore < 40) {
    actions.push({
      action: "Complete one tiny win today — review a career page or finish a short quiz",
      reason: "Small completions rebuild momentum faster than large goals.",
      difficulty: "easier",
    });

    if (fatigueCount > 0) {
      actions.push({
        action: "Take a deliberate rest day — skip missions to recover energy",
        reason: "Fatigue signals suggest rest will improve long-term consistency.",
        difficulty: "easier",
      });
    }
    if (consistencyScore < 35) {
      actions.push({
        action: "Set a 3-day streak goal — one small action each day",
        reason: "Building a short streak creates psychological momentum.",
        difficulty: "easier",
      });
    }
    if (learningMomentum < 30) {
      actions.push({
        action: "Revisit a previously completed phase to rebuild confidence",
        reason: "Reviewing past wins restores learning momentum.",
        difficulty: "easier",
      });
    }
    if (goalRisk === "high") {
      actions.push({
        action: "Review and adjust your goal timeline or weekly commitment",
        reason: "Your goal is at risk — recalibrating expectations reduces pressure.",
        difficulty: "moderate",
      });
    }
    if (missionScore < 35) {
      actions.push({
        action: "Replace current missions with one simple, completable task",
        reason: "Overwhelming missions drain momentum — simplify to rebuild.",
        difficulty: "easier",
      });
    }
    if (completedQuizzes < 3) {
      actions.push({
        action: "Take a career quiz to re-engage with your direction",
        reason: "Low engagement history suggests a fresh interaction can restart momentum.",
        difficulty: "easier",
      });
    }
  } else {
    // Moderate momentum — maintenance actions
    if (consistencyScore < 50) {
      actions.push({
        action: "Maintain a 5-day weekly check-in rhythm",
        reason: "Consistency is the foundation of steady momentum.",
        difficulty: "easier",
      });
    }
    if (trajectoryStrength < 50) {
      actions.push({
        action: "Explore one new career path to strengthen your future direction",
        reason: "Broadening exploration supports trajectory growth.",
        difficulty: "moderate",
      });
    }
  }

  return actions;
}

function buildNarrative(
  score: number,
  trend: string,
  accCount: number,
  slowCount: number,
  trajectoryStrength: number,
  pulseScore: number
): string {
  if (score >= 65 && accCount >= 2) {
    return `Your career momentum is strong at ${score}/100. With ${accCount} acceleration signals — including a future trajectory of ${trajectoryStrength}/100 and engagement at ${pulseScore}/100 — you're well positioned to increase challenge and expand your scope.`;
  }
  if (score >= 45) {
    return `Your momentum is steady at ${score}/100${accCount > 0 ? ` with ${accCount} positive signals` : ""}${slowCount > 0 ? ` and ${slowCount} areas to watch` : ""}. Focus on consistency to build toward acceleration.`;
  }
  if (trend === "stalled") {
    return `Momentum is stalled at ${score}/100 — but stalled isn't stuck. ${slowCount > 0 ? `${slowCount} slowdown signals` : "Low activity"} suggest starting with the smallest possible action to rebuild forward motion.`;
  }
  return `Momentum is ${trend} at ${score}/100. ${slowCount > 0 ? `${slowCount} areas need attention to prevent further slowdown.` : "Small consistent actions can shift the trend upward."}`;
}
