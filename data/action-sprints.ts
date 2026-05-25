/**
 * ACTION SPRINT INTELLIGENCE
 *
 * Converts long-term career guidance into immediate, actionable execution plans.
 * Reads from adaptive-roadmap, career-goals, career-workspace, predictive-insights,
 * career-scenarios, achievement-engine, behavior-patterns, and journey-memory.
 *
 * Adapts task difficulty based on:
 *   - Low streak → easier, low-commitment tasks
 *   - High momentum → challenge / stretch tasks
 *   - High prediction risk → reinforcement & consistency actions
 *
 * Persists completed actions and sprint history via SafeStorage.
 * No backend. No auth.
 */

import { loadAdaptiveRoadmap } from "./adaptive-roadmap";
import { loadGoalState } from "./career-goals";
import { loadCareerWorkspace } from "./career-workspace";
import { computePredictiveInsights, loadPredictiveInsights } from "./predictive-insights";
import { computeAchievements, loadAchievements } from "./achievement-engine";
import { computeBehaviorPatterns, loadBehaviorPatterns } from "./behavior-patterns";
import { loadJourneyMemory } from "./journey-memory";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-action-sprints";
const HISTORY_KEY = "corepath-sprint-history";
const MAX_HISTORY = 7;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  category: "quick_win" | "consistency" | "stretch" | "reinforcement" | "exploration";
  rationale: string;
}

export interface WeekMission {
  title: string;
  description: string;
  estimatedMinutesTotal: number;
  rationale: string;
}

export interface MicroGoal {
  id: string;
  title: string;
  description: string;
  effortMinutes: number;
}

export interface ActionSprintData {
  date: string; // "YYYY-MM-DD"
  todayActions: ActionItem[];
  thisWeekMission: WeekMission;
  microGoals: MicroGoal[];
  estimatedMinutes: number;
  priorityScore: number; // 0–100
  blockingSignals: string[];
  momentumBoosters: string[];
  completedActionIds: string[];
  computedAt: string;
}

export interface SprintHistory {
  date: string;
  completionRate: number; // % of actions completed
  estimatedMinutes: number;
  priorityScore: number;
}

// ============================================================================
// ADAPTATION HELPERS
// ============================================================================

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getStorage() {
  return getSafeStorage({ silent: true });
}

/** Load today's sprint or compute fresh */
function loadCurrentSprint(): ActionSprintData | null {
  const storage = getStorage();
  const stored = storage.get<ActionSprintData>(STORAGE_KEY);
  if (stored && stored.date === getToday()) return stored;
  return null;
}

function saveCurrentSprint(sprint: ActionSprintData): void {
  const storage = getStorage();
  storage.set(STORAGE_KEY, sprint);
}

function updateHistory(sprint: ActionSprintData): void {
  const storage = getStorage();
  const history = storage.get<SprintHistory[]>(HISTORY_KEY) || [];
  const existingIdx = history.findIndex((h) => h.date === sprint.date);
  const completedCount = sprint.completedActionIds.length;
  const totalCount = sprint.todayActions.length;
  const entry: SprintHistory = {
    date: sprint.date,
    completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    estimatedMinutes: sprint.estimatedMinutes,
    priorityScore: sprint.priorityScore,
  };
  if (existingIdx >= 0) {
    history[existingIdx] = entry;
  } else {
    history.push(entry);
  }
  // Keep only last MAX_HISTORY
  const trimmed = history.slice(-MAX_HISTORY);
  storage.set(HISTORY_KEY, trimmed);
}

export function loadSprintHistory(): SprintHistory[] {
  const storage = getStorage();
  return storage.get<SprintHistory[]>(HISTORY_KEY) || [];
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface AdaptationContext {
  streak: number;
  momentum: number; // 0–100
  consistencyScore: number;
  dropoffRisk: number;
  dropoffLevel: string;
  goalPace: string;
  goalRisk: string;
  goalProgress: number;
  momentumDirection: string;
  predictionConfidence: number;
  interventionPriority: string;
  level: number;
  hasWorkspace: boolean;
  milestonesCompleted: number;
  quizCount: number;
  avgDaysBetweenSessions: number;
  hasAdaptiveWarnings: boolean;
}

function gatherContext(): AdaptationContext {
  const workspace = loadCareerWorkspace();
  const goalState = loadGoalState();
  const predictions = loadPredictiveInsights() ?? computePredictiveInsights();
  const behavior = loadBehaviorPatterns() ?? computeBehaviorPatterns();
  const achievements = loadAchievements() ?? computeAchievements();
  const adaptive = loadAdaptiveRoadmap();
  const memory = loadJourneyMemory();

  return {
    streak: workspace?.streak ?? 0,
    momentum: workspace
      ? Math.min(50, (workspace.streak ?? 0) * 10) +
        Math.min(50, (workspace.weeklyProgress?.length ?? 0) * 10)
      : 0,
    consistencyScore: behavior.learningConsistency.score,
    dropoffRisk: predictions.dropoffRisk.score,
    dropoffLevel: predictions.dropoffRisk.level,
    goalPace: goalState.signals?.paceSignal ?? "on_track",
    goalRisk: goalState.signals?.riskSignal ?? "low",
    goalProgress: goalState.goal?.goalProgress ?? 0,
    momentumDirection: predictions.momentumForecast.direction,
    predictionConfidence: predictions.momentumForecast.confidence,
    interventionPriority: predictions.recommendedIntervention.priority,
    level: achievements.level,
    hasWorkspace: workspace !== null,
    milestonesCompleted: workspace?.completedMilestones.length ?? 0,
    quizCount: memory.completedQuizzes,
    avgDaysBetweenSessions: behavior.learningConsistency.avgDaysBetweenSessions,
    hasAdaptiveWarnings: (adaptive?.adaptiveWarnings?.length ?? 0) > 0,
  };
}

// ============================================================================
// ACTION GENERATORS — ADAPTED TO CONTEXT
// ============================================================================

function generateTodayActions(ctx: AdaptationContext): ActionItem[] {
  const actions: ActionItem[] = [];
  const usedTitles = new Set<string>();
  const addUnique = (action: ActionItem) => {
    if (!usedTitles.has(action.title)) {
      usedTitles.add(action.title);
      actions.push(action);
    }
  };

  // ── Low streak (0–1) → easier, low-commitment tasks ──
  if (ctx.streak <= 1) {
    addUnique({
      id: "action-restart-streak",
      title: "Log one small progress entry",
      description: "Even 5 minutes counts. Open your workspace and log a study session or career view to restart your streak.",
      estimatedMinutes: 5,
      category: "quick_win",
      rationale: "No active streak — the smallest action breaks inertia and rebuilds momentum.",
    });
    addUnique({
      id: "action-quick-quiz",
      title: "Take a quick career cognition quiz",
      description: "A single quiz refreshes your profile and takes only 5–10 minutes. It keeps your data current.",
      estimatedMinutes: 8,
      category: "consistency",
      rationale: "Low streak + low engagement risk — quick quizzes rebuild cadence with minimal commitment.",
    });
    addUnique({
      id: "action-view-career",
      title: "Browse and favorite 3 careers",
      description: "Explore 3 careers from different categories and mark ones that resonate. This builds awareness without pressure.",
      estimatedMinutes: 10,
      category: "exploration",
      rationale: "Light exploration keeps you engaged without requiring deep focus.",
    });
  }

  // ── High streak + high momentum → challenge / stretch tasks ──
  else if (ctx.streak >= 5 && ctx.momentum >= 40) {
    addUnique({
      id: "action-stretch-milestone",
      title: "Complete a roadmap milestone",
      description: "You have strong momentum — tackle the next milestone in your active roadmap phase to advance your career readiness.",
      estimatedMinutes: 30,
      category: "stretch",
      rationale: "High streak + strong momentum — optimal time for high-impact, challenging work.",
    });
    addUnique({
      id: "action-deep-compare",
      title: "Deep-compare 2 careers side-by-side",
      description: "Use the comparison tool to evaluate two careers in depth. Focus on skills, salary, growth, and lifestyle fit.",
      estimatedMinutes: 20,
      category: "exploration",
      rationale: "High momentum supports focused analytical work. Deep comparison builds clarity.",
    });
    addUnique({
      id: "action-roadmap-review",
      title: "Review and adapt your roadmap",
      description: "Check your adaptive roadmap for skip suggestions and accelerate signals. You may be ready to advance faster.",
      estimatedMinutes: 15,
      category: "stretch",
      rationale: "Strong progress may qualify you for roadmap acceleration — review to confirm.",
    });
  }

  // ── Moderate streak → balanced mix ──
  else {
    addUnique({
      id: "action-weekly-progress",
      title: "Log weekly progress entry",
      description: "Record what you accomplished this week. Even small steps compound into meaningful progress.",
      estimatedMinutes: 10,
      category: "consistency",
      rationale: "Regular progress logging strengthens consistency and keeps your workspace accurate.",
    });
    addUnique({
      id: "action-explore-roadmap",
      title: "Explore your career roadmap",
      description: "Open your career's roadmap and review the current phase's milestones and skills. Identify what to tackle next.",
      estimatedMinutes: 15,
      category: "exploration",
      rationale: "Roadmap awareness keeps long-term goals aligned with daily actions.",
    });
    if (ctx.goalProgress < 50) {
      addUnique({
        id: "action-goal-check",
        title: "Check goal progress and adjust",
        description: `Your career goal is ${ctx.goalProgress}% complete. Review pace and adjust weekly time if you're ${ctx.goalPace === "behind" ? "behind schedule" : "on track"}.`,
        estimatedMinutes: 10,
        category: "reinforcement",
        rationale: "Regular goal check-ins prevent drift and keep timelines realistic.",
      });
    }
  }

  // ── High dropoff risk → add reinforcement action ──
  if (ctx.dropoffLevel === "high" || ctx.dropoffLevel === "elevated") {
    addUnique({
      id: "action-reinforce-streak",
      title: "Schedule 3 short sessions this week",
      description: `Dropoff risk is ${ctx.dropoffLevel}. Block three 15-minute slots this week for career exploration. Consistency beats intensity.`,
      estimatedMinutes: 5,
      category: "reinforcement",
      rationale: `Dropoff risk is ${ctx.dropoffLevel} — scheduling sessions proactively reduces disengagement probability.`,
    });
  }

  // ── Goal behind schedule → add catch-up action ──
  if (ctx.goalPace === "behind") {
    addUnique({
      id: "action-catch-up-goal",
      title: "Reset goal timeline or increase commitment",
      description: `Your goal is behind schedule with ${ctx.goalProgress}% progress. Consider extending your target by 1–2 months or adding 2 more weekly hours.`,
      estimatedMinutes: 10,
      category: "reinforcement",
      rationale: "Behind-schedule goals need active adjustment to stay achievable and motivating.",
    });
  }

  // ── Direction unclear → add clarity action ──
  if (ctx.interventionPriority === "medium" || ctx.interventionPriority === "high") {
    addUnique({
      id: "action-clarity-session",
      title: "Focused clarity session",
      description: "Pick 2 careers you are most curious about and spend 10 minutes each exploring their day-to-day, salary, and growth paths.",
      estimatedMinutes: 20,
      category: "exploration",
      rationale: `Intervention priority is ${ctx.interventionPriority} — structured comparison reduces hesitation and builds direction clarity.`,
    });
  }

  // Ensure we always have at least 2 actions
  if (actions.length < 2) {
    addUnique({
      id: "action-default-quiz",
      title: "Retake career cognition quiz",
      description: "Retaking the quiz updates your profile with any shifts in preferences or confidence since your last session.",
      estimatedMinutes: 10,
      category: "exploration",
      rationale: "Regular quiz retakes keep recommendations aligned with your evolving profile.",
    });
    addUnique({
      id: "action-default-explore",
      title: "Explore 2 new career categories",
      description: "Browse careers in categories you have not explored yet. Broad awareness helps you make informed decisions.",
      estimatedMinutes: 12,
      category: "exploration",
      rationale: "Broad exploration builds awareness of the full opportunity landscape.",
    });
  }

  // Cap at 4 actions
  return actions.slice(0, 4);
}

function generateWeekMission(ctx: AdaptationContext): WeekMission {
  // Low streak → easy weekly mission
  if (ctx.streak <= 1) {
    return {
      title: "Build a 3-day streak",
      description: "Log at least one career action each day for 3 consecutive days. Each entry can be as short as 5 minutes — the goal is consistency, not intensity.",
      estimatedMinutesTotal: 30,
      rationale: "A 3-day streak is the strongest predictor of continued engagement. Starting small prevents overwhelm.",
    };
  }

  // High momentum → stretch weekly mission
  if (ctx.streak >= 5 && ctx.momentum >= 40) {
    return {
      title: "Complete a stretch milestone",
      description: "Pick one advanced milestone or activity you have been postponing and complete it this week. Examples: finish a roadmap phase, complete a career comparison write-up, or build a mini portfolio piece.",
      estimatedMinutesTotal: 90,
      rationale: "High momentum creates a narrow window for high-impact work. Stretch milestones accelerate career readiness significantly.",
    };
  }

  // Goal behind → catch-up mission
  if (ctx.goalPace === "behind") {
    return {
      title: "Recalibrate your goal plan",
      description: "Spend this week reassessing your goal timeline and weekly commitment. Review your progress, adjust your target months if needed, and set a realistic weekly schedule.",
      estimatedMinutesTotal: 45,
      rationale: "Goals need periodic recalibration. A fresh plan beats grinding against an unrealistic timeline.",
    };
  }

  // Default balanced mission
  return {
    title: "Maintain and deepen",
    description: "Complete your daily actions and spend at least one longer session (30+ min) exploring a career roadmap or completing a milestone. Consistency compounds.",
    estimatedMinutesTotal: 60,
    rationale: "Balanced weeks with both daily consistency and a deeper session produce the most reliable progress.",
  };
}

function generateMicroGoals(ctx: AdaptationContext): MicroGoal[] {
  const goals: MicroGoal[] = [];

  // Low streak → easy micro goals
  if (ctx.streak <= 1) {
    goals.push({
      id: "micro-view-3",
      title: "View 3 career pages",
      description: "Browse 3 careers from your favorite categories or ones you have not explored yet.",
      effortMinutes: 6,
    });
    goals.push({
      id: "micro-log-entry",
      title: "Log one progress entry",
      description: "Open your workspace and log a quick study session or career view.",
      effortMinutes: 3,
    });
    goals.push({
      id: "micro-quiz",
      title: "Complete one quiz question set",
      description: "Answer just 2–3 quiz questions to keep your profile fresh.",
      effortMinutes: 5,
    });
  }

  // High momentum → stretch micro goals
  else if (ctx.streak >= 5 && ctx.momentum >= 40) {
    goals.push({
      id: "micro-milestone",
      title: "Complete one milestone task",
      description: "Finish one concrete task from your current roadmap milestone.",
      effortMinutes: 25,
    });
    goals.push({
      id: "micro-compare",
      title: "Compare 2 careers with notes",
      description: "Use the comparison tool and jot down 3 key differences you notice.",
      effortMinutes: 15,
    });
    goals.push({
      id: "micro-adapt-review",
      title: "Review roadmap adjustments",
      description: "Check if your adaptive roadmap suggests skipping or accelerating any phases.",
      effortMinutes: 10,
    });
  }

  // Default micro goals
  else {
    goals.push({
      id: "micro-review-goal",
      title: "Review goal progress",
      description: "Open your goal tracker and see how your pace compares to your target.",
      effortMinutes: 5,
    });
    goals.push({
      id: "micro-explore-category",
      title: "Explore one new category",
      description: "Pick a career category you have not explored and view its top careers.",
      effortMinutes: 10,
    });
    goals.push({
      id: "micro-log-weekly",
      title: "Log a weekly entry",
      description: "Record what you learned or accomplished this week in your workspace.",
      effortMinutes: 5,
    });
  }

  return goals.slice(0, 3);
}

function computeBlockingSignals(ctx: AdaptationContext): string[] {
  const signals: string[] = [];

  if (ctx.streak === 0) {
    signals.push("No active streak — even a 5-minute action today rebuilds momentum.");
  }
  if (ctx.dropoffLevel === "high" || ctx.dropoffLevel === "elevated") {
    signals.push(`Dropoff risk is ${ctx.dropoffLevel} — schedule short sessions to stay engaged.`);
  }
  if (ctx.goalPace === "behind") {
    signals.push("Goal is behind schedule — consider adjusting your target timeline or weekly commitment.");
  }
  if (ctx.avgDaysBetweenSessions > 7 && ctx.quizCount > 0) {
    signals.push(`Sessions are ${Math.round(ctx.avgDaysBetweenSessions)} days apart on average — shorter gaps improve retention.`);
  }
  if (ctx.hasAdaptiveWarnings) {
    signals.push("Adaptive roadmap has active warnings — review them to avoid surprises.");
  }
  if (signals.length === 0) {
    signals.push("No critical blockers detected. Maintain your current trajectory.");
  }

  return signals;
}

function computeMomentumBoosters(ctx: AdaptationContext): string[] {
  const boosters: string[] = [];

  if (ctx.streak >= 3) {
    boosters.push(`Your ${ctx.streak}-day streak is strong. Maintaining it for 7 days unlocks a streak bonus.`);
  } else if (ctx.streak > 0) {
    boosters.push("You have an active streak. Reaching 3 days reduces dropoff risk significantly.");
  } else {
    boosters.push("Starting a streak today puts you ahead. Even one action makes tomorrow easier.");
  }

  if (ctx.level >= 3) {
    boosters.push(`Level ${ctx.level} — your accumulated XP shows sustained commitment. Keep building.`);
  } else if (ctx.quizCount >= 3) {
    boosters.push(`${ctx.quizCount} quizzes completed — your profile gets sharper with each one.`);
  }

  if (ctx.momentumDirection === "accelerating") {
    boosters.push("Momentum is forecast to accelerate — optimal conditions for tackling milestones.");
  } else if (ctx.momentumDirection === "stable") {
    boosters.push("Stable momentum creates a reliable foundation. Consistent small actions compound over time.");
  }

  if (ctx.goalPace === "ahead") {
    boosters.push("You are ahead of schedule — this confidence can fuel even more progress.");
  }

  if (ctx.milestonesCompleted >= 3) {
    boosters.push(`${ctx.milestonesCompleted} milestones completed — you are making measurable progress toward your career goal.`);
  }

  if (boosters.length === 0) {
    boosters.push("Every session builds your career intelligence. The best time to start is now.");
  }

  return boosters;
}

function computePriorityScore(ctx: AdaptationContext): number {
  let score = 50; // neutral baseline

  // Higher priority when risk is present
  if (ctx.streak === 0) score += 20;
  if (ctx.dropoffLevel === "high") score += 15;
  else if (ctx.dropoffLevel === "elevated") score += 10;
  if (ctx.goalPace === "behind") score += 15;
  if (ctx.goalRisk === "high") score += 10;
  if (ctx.interventionPriority === "critical") score += 20;
  else if (ctx.interventionPriority === "high") score += 10;

  // Slightly lower priority when everything is good
  if (ctx.streak >= 7 && ctx.dropoffLevel === "low" && ctx.goalPace === "on_track") {
    score = Math.max(30, score - 10);
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// MAIN PUBLIC API
// ============================================================================

/**
 * Compute a fresh action sprint for today.
 * Adapts task difficulty based on streak, momentum, and prediction risk.
 */
export function computeActionSprint(): ActionSprintData {
  const ctx = gatherContext();

  const todayActions = generateTodayActions(ctx);
  const thisWeekMission = generateWeekMission(ctx);
  const microGoals = generateMicroGoals(ctx);
  const estimatedMinutes = todayActions.reduce((sum, a) => sum + a.estimatedMinutes, 0);
  const priorityScore = computePriorityScore(ctx);
  const blockingSignals = computeBlockingSignals(ctx);
  const momentumBoosters = computeMomentumBoosters(ctx);

  // Load existing completed action IDs if this is a recompute for the same day
  const existing = loadCurrentSprint();
  const completedActionIds = existing?.date === getToday() ? existing.completedActionIds : [];

  const sprint: ActionSprintData = {
    date: getToday(),
    todayActions,
    thisWeekMission,
    microGoals,
    estimatedMinutes,
    priorityScore,
    blockingSignals,
    momentumBoosters,
    completedActionIds,
    computedAt: new Date().toISOString(),
  };

  saveCurrentSprint(sprint);
  return sprint;
}

/**
 * Load today's sprint if already computed, otherwise compute fresh.
 */
export function loadActionSprint(): ActionSprintData {
  const existing = loadCurrentSprint();
  if (existing) return existing;
  return computeActionSprint();
}

/**
 * Mark a single action as completed / toggled.
 */
export function toggleActionCompletion(actionId: string): ActionSprintData {
  const sprint = loadActionSprint();
  const idx = sprint.completedActionIds.indexOf(actionId);
  if (idx >= 0) {
    sprint.completedActionIds.splice(idx, 1);
  } else {
    sprint.completedActionIds.push(actionId);
  }
  saveCurrentSprint(sprint);
  updateHistory(sprint);
  return sprint;
}

/**
 * Get the user's action sprint history (last 7 days).
 */
export function getSprintHistory(): SprintHistory[] {
  return loadSprintHistory();
}
