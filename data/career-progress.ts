/**
 * CAREER PROGRESS INTELLIGENCE
 *
 * Computes a visible progress system from existing data sources:
 * - CareerWorkspace (milestones, projects, streak, readiness)
 * - JourneyMemory (quiz dates, confidence/specialization history, viewed careers)
 * - QuizHistory (quiz results)
 *
 * Persists computed progress via SafeStorage (local storage).
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadCareerWorkspace } from "./career-workspace";
import { loadJourneyMemory } from "./journey-memory";

const STORAGE_KEY = "corepath-career-progress";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface CareerProgressData {
  careerReadinessTrend: "increasing" | "stable" | "declining";
  milestonesCompleted: number;
  projectsCompleted: number;
  learningMomentum: number; // 0–100
  quizConsistency: number; // 0–100
  explorationFocus: number; // 0–100 (higher = more focused)
  overallProgressScore: number; // 0–100 weighted composite
  computedAt: string;
}

// ============================================================================
// COMPUTATION
// ============================================================================

/**
 * Recompute all career progress metrics from current data sources.
 * This is called on mount — no stale caching.
 */
export function computeCareerProgress(): CareerProgressData {
  const workspace = loadCareerWorkspace();
  const memory = loadJourneyMemory();

  const readinessTrend = computeReadinessTrend(workspace, memory);
  const milestones = workspace?.completedMilestones.length ?? 0;
  const projects = workspace?.completedProjects.length ?? 0;
  const momentum = computeLearningMomentum(workspace);
  const consistency = computeQuizConsistency(memory);
  const focus = computeExplorationFocus(memory);

  // Weighted composite: readiness 30%, momentum 25%, milestones 20%, consistency 15%, focus 10%
  const readinessScore = workspace?.estimatedReadiness ?? 0;
  const milestonesScore = Math.min(100, milestones * 20); // each milestone = 20pts, cap at 100
  const projectsScore = Math.min(100, projects * 25); // each project = 25pts, cap at 100

  const overallProgressScore = Math.round(
    readinessScore * 0.3 +
    momentum * 0.25 +
    milestonesScore * 0.2 +
    consistency * 0.15 +
    focus * 0.1
  );

  const data: CareerProgressData = {
    careerReadinessTrend: readinessTrend,
    milestonesCompleted: milestones,
    projectsCompleted: projects,
    learningMomentum: momentum,
    quizConsistency: consistency,
    explorationFocus: focus,
    overallProgressScore: Math.min(100, Math.max(0, overallProgressScore)),
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, data);

  return data;
}

/**
 * Load the most recently computed progress from storage.
 * Returns null if never computed or data is stale (>1 hour).
 */
export function loadCareerProgress(): CareerProgressData | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<CareerProgressData>(STORAGE_KEY);
  if (!cached) return null;

  // Consider stale after 1 hour
  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  return cached;
}

// ============================================================================
// PRIVATE METRIC COMPUTATIONS
// ============================================================================

function computeReadinessTrend(
  workspace: ReturnType<typeof loadCareerWorkspace>,
  memory: ReturnType<typeof loadJourneyMemory>
): CareerProgressData["careerReadinessTrend"] {
  // Use confidence history as a proxy for progress direction
  const conf = memory.confidenceHistory;
  if (conf.length >= 2) {
    const recent = conf.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const diff = last - first;
    if (diff > 5) return "increasing";
    if (diff < -5) return "declining";
  }

  // Fall back to specialization depth trend
  const spec = memory.specializationDepthHistory;
  if (spec.length >= 2) {
    const recent = spec.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const diff = last - first;
    if (diff > 0.05) return "increasing";
    if (diff < -0.05) return "declining";
  }

  // If we have a workspace, check if milestones are being completed
  if (workspace) {
    if (workspace.completedMilestones.length > 0 && workspace.estimatedReadiness > 0) {
      return "increasing";
    }
  }

  return "stable";
}

function computeLearningMomentum(
  workspace: ReturnType<typeof loadCareerWorkspace>
): number {
  if (!workspace) return 0;

  const { streak, weeklyProgress } = workspace;

  // Streak contributes up to 50 points
  const streakScore = Math.min(50, streak * 10);

  // Weekly activity contributes up to 50 points (up to 10 entries this week)
  const thisWeek = getThisWeekCount(weeklyProgress);
  const activityScore = Math.min(50, thisWeek * 10);

  return Math.min(100, streakScore + activityScore);
}

function computeQuizConsistency(
  memory: ReturnType<typeof loadJourneyMemory>
): number {
  const { quizDates, completedQuizzes } = memory;

  if (completedQuizzes === 0) return 0;
  if (completedQuizzes === 1) return 20;

  // Spread of quiz dates contributes to consistency
  if (quizDates.length < 2) return 30;

  const sorted = [...quizDates].sort();
  const firstDate = new Date(sorted[0]);
  const lastDate = new Date(sorted[sorted.length - 1]);
  const daysDiff = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

  // More quizzes over longer period = more consistent
  // Aim for a score proportional to quizzes per week
  const weeksElapsed = Math.max(1, daysDiff / 7);
  const quizzesPerWeek = completedQuizzes / weeksElapsed;

  if (quizzesPerWeek >= 1) return 90; // 1+ quiz per week
  if (quizzesPerWeek >= 0.5) return 70; // bi-weekly
  if (quizzesPerWeek >= 0.25) return 50; // monthly
  return 30; // sporadic
}

function computeExplorationFocus(
  memory: ReturnType<typeof loadJourneyMemory>
): number {
  const viewedCount = Object.keys(memory.viewedCareers).length;
  const favoriteCount = Object.keys(memory.favoriteCategories).length;

  // Few distinct careers viewed = focused, many = exploratory
  // Ideal range: 3-8 distinct careers viewed shows focused exploration
  if (viewedCount === 0) return 0;

  // Score based on number of distinct careers viewed
  // Peak focus at 5-8 careers
  if (viewedCount <= 3) return 80; // very focused
  if (viewedCount <= 8) return 70; // healthily focused
  if (viewedCount <= 15) return 50; // moderately exploratory
  if (viewedCount <= 25) return 30; // exploratory
  return 20; // very scattered

  // Could also factor in favoriteCategories concentration, but this is sufficient
}

function getThisWeekCount(
  entries: Array<{ date: string }>
): number {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return entries.filter((e) => {
    const d = new Date(e.date);
    return d >= weekAgo && d <= now;
  }).length;
}
