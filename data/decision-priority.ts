/**
 * DECISION PRIORITY ENGINE
 *
 * Answers: "What matters most right now?"
 *
 * Synthesizes action-sprints, engagement-pulse, predictive-insights, goals,
 * notifications, achievements, and workspace into one dominant priority.
 *
 * Priority ladder (first match wins):
 *   1. Burnout risk high       → reduce_workload
 *   2. Goal behind schedule     → recover
 *   3. Prediction risk high     → intervention
 *   4. Momentum high             → challenge
 *   5. Fallback                 → maintain
 *
 * Persists via SafeStorage.
 * No backend. No auth.
 */

import { loadActionSprint, loadSprintHistory, type ActionSprintData, type SprintHistory } from "./action-sprints";
import { loadEngagementPulse, type EngagementPulseData, type FatigueSignal } from "./engagement-pulse";
import { loadPredictiveInsights, type PredictiveInsightsData } from "./predictive-insights";
import { loadGoalState, type GoalState } from "./career-goals";
import { getNotifications, type AppNotification } from "./notification-engine";
import { loadAchievements, computeAchievements } from "./achievement-engine";
import { loadCareerWorkspace, type CareerWorkspace } from "./career-workspace";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-decision-priority";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type FocusMode =
  | "reduce_workload"
  | "recover"
  | "intervention"
  | "challenge"
  | "maintain";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export interface DecisionPriorityData {
  topPriority: string;
  priorityReason: string;
  urgencyLevel: UrgencyLevel;
  ignoredSignals: string[];
  focusMode: FocusMode;
  todayDecision: string;
  confidenceScore: number; // 0–100
  computedAt: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface PriorityContext {
  pulse: EngagementPulseData | null;
  predictions: PredictiveInsightsData | null;
  goalState: GoalState;
  sprint: ActionSprintData;
  sprintHistory: SprintHistory[];
  notifications: AppNotification[];
  workspace: CareerWorkspace | null;
  level: number;
}

function gatherContext(): PriorityContext {
  const pulse = loadEngagementPulse();
  const predictions = loadPredictiveInsights();
  const goalState = loadGoalState();
  const sprint = loadActionSprint();
  const sprintHistory = loadSprintHistory();
  const notifications = getNotifications();
  const workspace = loadCareerWorkspace();
  const achievements = loadAchievements() ?? computeAchievements();

  return {
    pulse,
    predictions,
    goalState,
    sprint,
    sprintHistory,
    notifications,
    workspace,
    level: achievements.level,
  };
}

// ============================================================================
// SIGNAL EVALUATORS
// ============================================================================

function hasBurnoutRisk(pulse: EngagementPulseData | null): boolean {
  if (!pulse || pulse.fatigueSignals.length === 0) return false;

  return pulse.fatigueSignals.some(
    (s) => s.type === "burnout_risk" && s.severity === "high"
  );
}

function isGoalBehindSchedule(goalState: GoalState): boolean {
  if (!goalState.goal || !goalState.signals) return false;
  return (
    goalState.signals.paceSignal === "behind" &&
    (goalState.signals.riskSignal === "high" || goalState.signals.riskSignal === "medium")
  );
}

function hasHighPredictionRisk(predictions: PredictiveInsightsData | null): boolean {
  if (!predictions) return false;

  const dropoffHigh =
    predictions.dropoffRisk.level === "high" || predictions.dropoffRisk.level === "elevated";

  const interventionHigh =
    predictions.recommendedIntervention.priority === "critical" ||
    predictions.recommendedIntervention.priority === "high";

  return dropoffHigh || interventionHigh;
}

function hasHighMomentum(
  pulse: EngagementPulseData | null,
  predictions: PredictiveInsightsData | null,
  workspace: CareerWorkspace | null
): boolean {
  const streak = workspace?.streak ?? 0;

  const pulseGood = (pulse?.pulseScore ?? 0) >= 65;
  const momentumAccelerating = predictions?.momentumForecast.direction === "accelerating";
  const streakStrong = streak >= 5;

  return (pulseGood && momentumAccelerating) || (pulseGood && streakStrong);
}

// ============================================================================
// IGNORED SIGNALS — what we evaluated but chose not to prioritize
// ============================================================================

function computeIgnoredSignals(
  ctx: PriorityContext,
  chosenFocus: FocusMode
): string[] {
  const ignored: string[] = [];
  const { pulse, predictions, goalState, workspace } = ctx;

  // Check all non-chosen signals
  if (chosenFocus !== "reduce_workload" && pulse && hasBurnoutRisk(pulse)) {
    ignored.push("Burnout risk detected but deprioritized — higher-priority signal overrides");
  }

  if (chosenFocus !== "recover" && isGoalBehindSchedule(goalState)) {
    ignored.push("Goal behind schedule but deprioritized — another signal takes precedence");
  }

  if (chosenFocus !== "intervention" && predictions && hasHighPredictionRisk(predictions)) {
    ignored.push("Prediction risk elevated but deprioritized — current focus is more urgent");
  }

  if (chosenFocus !== "challenge" && hasHighMomentum(pulse, predictions, workspace)) {
    ignored.push("High momentum available but not the top priority right now");
  }

  // Notification volume
  const unreadCount = ctx.notifications.filter((n) => !n.read).length;
  if (chosenFocus !== "reduce_workload" && unreadCount > 5) {
    ignored.push(`${unreadCount} unread notifications — manageable under current priority`);
  }

  if (ignored.length === 0) {
    ignored.push("No significant competing signals detected");
  }

  return ignored;
}

// ============================================================================
// FOCUS OUTPUT GENERATORS
// ============================================================================

function buildReduceWorkload(ctx: PriorityContext): DecisionPriorityData {
  const fatigue = ctx.pulse?.fatigueSignals ?? [];
  const burnoutSignal = fatigue.find((s) => s.type === "burnout_risk");

  return {
    topPriority: "Reduce workload — burnout risk detected",
    priorityReason:
      burnoutSignal?.detail ??
      "Engagement signals show high burnout risk with shallow session depth despite maintained streak. Quality over quantity needed.",
    urgencyLevel: "high",
    ignoredSignals: computeIgnoredSignals(ctx, "reduce_workload"),
    focusMode: "reduce_workload",
    todayDecision:
      "Focus on one small, low-effort action today. Skip stretch goals and clear notifications to reduce cognitive load. Consider taking a full rest day if needed.",
    confidenceScore: Math.max(70, ctx.pulse?.pulseScore ?? 75),
    computedAt: new Date().toISOString(),
  };
}

function buildRecover(ctx: PriorityContext): DecisionPriorityData {
  const goalProgress = ctx.goalState.goal?.goalProgress ?? 0;
  const targetMonths = ctx.goalState.goal?.targetMonths ?? 12;

  return {
    topPriority: "Goal recovery — get back on track",
    priorityReason: `Your career goal is behind schedule (${goalProgress}% progress in ${targetMonths}-month timeline). Recalibrating now prevents further drift and keeps the target achievable.`,
    urgencyLevel: "high",
    ignoredSignals: computeIgnoredSignals(ctx, "recover"),
    focusMode: "recover",
    todayDecision:
      "Reassess your goal timeline and weekly commitment. Adjust the target months or reduce weekly scope to make progress realistic again. Then complete one small milestone task to rebuild momentum.",
    confidenceScore: 65 + Math.min(25, goalProgress),
    computedAt: new Date().toISOString(),
  };
}

function buildIntervention(ctx: PriorityContext): DecisionPriorityData {
  const intervention = ctx.predictions?.recommendedIntervention;
  const dropoffLevel = ctx.predictions?.dropoffRisk.level;

  return {
    topPriority: intervention?.title ?? "Intervention needed — re-engage now",
    priorityReason:
      intervention?.description ??
      `Dropoff risk is ${dropoffLevel}. Structured re-engagement is the most impactful action to prevent extended disengagement.`,
    urgencyLevel: "critical",
    ignoredSignals: computeIgnoredSignals(ctx, "intervention"),
    focusMode: "intervention",
    todayDecision:
      intervention?.expectedImpact
        ? `${intervention.title}. ${intervention.expectedImpact}`
        : "Schedule 3 short sessions this week (15 min each). Start with a quick quiz or career view to rebuild cadence.",
    confidenceScore: 60,
    computedAt: new Date().toISOString(),
  };
}

function buildChallenge(ctx: PriorityContext): DecisionPriorityData {
  const streak = ctx.workspace?.streak ?? 0;
  const direction = ctx.predictions?.momentumForecast.direction;

  return {
    topPriority: "Challenge mode — momentum is strong",
    priorityReason: `Your engagement is high (pulse ${ctx.pulse?.pulseScore ?? "?"}) with momentum ${direction}. This is the optimal window for high-impact career work like completing a roadmap milestone or deep career comparison.`,
    urgencyLevel: "medium",
    ignoredSignals: computeIgnoredSignals(ctx, "challenge"),
    focusMode: "challenge",
    todayDecision:
      streak >= 7
        ? `Leverage your ${streak}-day streak by tackling a stretch milestone or completing an advanced career comparison today.`
        : "Complete one stretch task from your sprint — your high engagement makes this the ideal time for challenging work.",
    confidenceScore: Math.max(70, ctx.pulse?.pulseScore ?? 75),
    computedAt: new Date().toISOString(),
  };
}

function buildMaintain(ctx: PriorityContext): DecisionPriorityData {
  return {
    topPriority: "Maintain trajectory — all signals positive",
    priorityReason:
      "No significant risks detected. Engagement is healthy, goal pace is on track, and predictions are stable. Continue your current cadence to compound progress.",
    urgencyLevel: "low",
    ignoredSignals: computeIgnoredSignals(ctx, "maintain"),
    focusMode: "maintain",
    todayDecision:
      "Complete your daily sprint tasks as planned. Consider one exploration action to broaden awareness while maintaining your current pace.",
    confidenceScore: 80,
    computedAt: new Date().toISOString(),
  };
}

// ============================================================================
// MAIN PRIORITY LADDER
// ============================================================================

/**
 * Compute the decision priority by evaluating the priority ladder.
 * Only one dominant recommendation is returned — the first match wins.
 */
export function computeDecisionPriority(): DecisionPriorityData {
  const ctx = gatherContext();

  let result: DecisionPriorityData;

  // Priority ladder: first match wins
  if (hasBurnoutRisk(ctx.pulse)) {
    result = buildReduceWorkload(ctx);
  } else if (isGoalBehindSchedule(ctx.goalState)) {
    result = buildRecover(ctx);
  } else if (hasHighPredictionRisk(ctx.predictions)) {
    result = buildIntervention(ctx);
  } else if (hasHighMomentum(ctx.pulse, ctx.predictions, ctx.workspace)) {
    result = buildChallenge(ctx);
  } else {
    result = buildMaintain(ctx);
  }

  // Persist so loadDecisionPriority() can return cached data
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Load the most recently computed decision priority.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadDecisionPriority(): DecisionPriorityData | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<DecisionPriorityData>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  return cached;
}

/**
 * Get the current decision priority, computing fresh if needed.
 */
export function getDecisionPriority(): DecisionPriorityData {
  const existing = loadDecisionPriority();
  if (existing) return existing;
  return computeDecisionPriority();
}
