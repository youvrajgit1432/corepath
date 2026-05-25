/**
 * CAREER GOAL TARGET INTELLIGENCE
 *
 * Allows users to set and track a personal target career goal.
 * Derives progress signals from workspace, career-progress, and achievement-engine.
 *
 * Persists via SafeStorage (local storage).
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadCareerWorkspace } from "./career-workspace";
import { loadCareerProgress, computeCareerProgress } from "./career-progress";
import { loadAchievements, computeAchievements } from "./achievement-engine";

const STORAGE_KEY = "corepath-career-goals";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface CareerGoal {
  /** Career ID the user is targeting */
  selectedCareerGoal: string;
  /** User's target timeline in months */
  targetMonths: number;
  /** Estimated weekly hours the user can commit */
  weeklyTimeCommitment: number;
  /** When the goal was first set */
  goalStartDate: string;
  /** Computed progress percentage 0–100 */
  goalProgress: number;
  /** Whether the goal has been explicitly saved by the user */
  isActive: boolean;
}

export interface GoalSignals {
  /** Estimated date when the goal will be achieved at current pace */
  estimatedCompletion: string;
  /** Whether the user is on track, ahead, or behind */
  paceSignal: "on_track" | "ahead" | "behind";
  /** Risk level of not achieving the goal in time */
  riskSignal: "low" | "medium" | "high";
  /** Most critical next step to stay on track */
  nextCriticalStep: string;
  /** Last updated timestamp */
  computedAt: string;
}

export interface GoalState {
  goal: CareerGoal | null;
  signals: GoalSignals | null;
}

// ============================================================================
// DEFAULT TARGETS
// ============================================================================

const DEFAULT_TARGET_MONTHS = 12;
const DEFAULT_WEEKLY_HOURS = 10;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Load the current career goal from storage.
 */
export function loadCareerGoal(): CareerGoal | null {
  const storage = getSafeStorage({ silent: true });
  const stored = storage.get<CareerGoal>(STORAGE_KEY);
  return stored?.isActive ? stored : null;
}

/**
 * Set or update the career goal.
 */
export function setCareerGoal(
  careerId: string,
  targetMonths?: number,
  weeklyHours?: number
): CareerGoal {
  const goal: CareerGoal = {
    selectedCareerGoal: careerId,
    targetMonths: targetMonths ?? DEFAULT_TARGET_MONTHS,
    weeklyTimeCommitment: weeklyHours ?? DEFAULT_WEEKLY_HOURS,
    goalStartDate: new Date().toISOString(),
    goalProgress: 0,
    isActive: true,
  };

  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, goal);
  return goal;
}

/**
 * Clear the current career goal.
 */
export function clearCareerGoal(): void {
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, { isActive: false });
}

/**
 * Compute goal signals from workspace progress and career data.
 */
export function computeGoalSignals(goal: CareerGoal): GoalSignals {
  const workspace = loadCareerWorkspace();
  const progress = loadCareerProgress() ?? computeCareerProgress();
  const achievements = loadAchievements() ?? computeAchievements();

  // ── Progress toward goal ──────────────────────────────────────────────
  // Blend workspace readiness (60%) + overall progress score (40%)
  const readiness = workspace?.estimatedReadiness ?? 0;
  const progressScore = progress.overallProgressScore;
  const goalProgress = Math.round(readiness * 0.6 + progressScore * 0.4);

  // Persist updated progress
  goal.goalProgress = goalProgress;
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, goal);

  // ── Estimated completion ──────────────────────────────────────────────
  const startDate = new Date(goal.goalStartDate);
  const daysElapsed = Math.max(1, Math.round(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ));
  const totalDays = goal.targetMonths * 30;
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  // Progress rate: % progress per day
  const progressPerDay = goalProgress / daysElapsed;

  // Days needed to reach 100% at current rate
  const remainingProgress = 100 - goalProgress;
  const estimatedDaysToGoal = progressPerDay > 0
    ? Math.round(remainingProgress / progressPerDay)
    : totalDays;

  const estimatedCompletionDate = new Date(
    Date.now() + estimatedDaysToGoal * 24 * 60 * 60 * 1000
  );
  const estimatedCompletion = estimatedCompletionDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // ── Pace signal ───────────────────────────────────────────────────────
  // Expected progress at this point = (daysElapsed / totalDays) * 100
  const expectedProgress = (daysElapsed / totalDays) * 100;
  const paceDiff = goalProgress - expectedProgress;

  let paceSignal: GoalSignals["paceSignal"] = "on_track";
  if (paceDiff > 10) paceSignal = "ahead";
  else if (paceDiff < -10) paceSignal = "behind";

  // ── Risk signal ───────────────────────────────────────────────────────
  const streak = workspace?.streak ?? 0;
  const milestoneCount = workspace?.completedMilestones.length ?? 0;
  const momentum = progress.learningMomentum;

  let riskSignal: GoalSignals["riskSignal"] = "low";
  if (paceSignal === "behind" || streak === 0 || momentum < 20) {
    riskSignal = "high";
  } else if (paceSignal === "on_track" && (streak < 3 || momentum < 50)) {
    riskSignal = "medium";
  }

  // ── Next critical step ────────────────────────────────────────────────
  let nextCriticalStep: string;

  if (!workspace) {
    nextCriticalStep = "Select a career and start building your workspace to track progress.";
  } else if (milestoneCount === 0) {
    nextCriticalStep = "Complete your first milestone to start making measurable progress.";
  } else if (streak === 0) {
    nextCriticalStep = "Resume your streak — even a small daily action keeps momentum alive.";
  } else if (paceSignal === "behind") {
    nextCriticalStep = `Increase weekly time commitment from ${goal.weeklyTimeCommitment}h to stay on track for your ${goal.targetMonths}-month goal.`;
  } else if (readiness < 50) {
    nextCriticalStep = "Focus on completing current phase milestones to boost career readiness.";
  } else {
    nextCriticalStep = "Keep up the pace! Consider advancing to the next roadmap phase.";
  }

  return {
    estimatedCompletion,
    paceSignal,
    riskSignal,
    nextCriticalStep,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Load or initialize goal state (goal + computed signals).
 */
export function loadGoalState(): GoalState {
  const goal = loadCareerGoal();
  if (!goal) return { goal: null, signals: null };

  const signals = computeGoalSignals(goal);
  return { goal, signals };
}

/**
 * Format the pace signal as a human-readable label.
 */
export function formatPaceSignal(signal: GoalSignals["paceSignal"]): string {
  const labels: Record<GoalSignals["paceSignal"], string> = {
    ahead: "Ahead of schedule 🚀",
    on_track: "On track ✅",
    behind: "Behind schedule ⚠️",
  };
  return labels[signal];
}

/**
 * Format the risk signal as a human-readable label.
 */
export function formatRiskSignal(signal: GoalSignals["riskSignal"]): string {
  const labels: Record<GoalSignals["riskSignal"], string> = {
    low: "Low risk",
    medium: "Medium risk",
    high: "High risk",
  };
  return labels[signal];
}
