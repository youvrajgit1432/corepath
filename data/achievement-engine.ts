/**
 * SKILL XP + ACHIEVEMENT SYSTEM
 *
 * Rewards users for career exploration and progress.
 * Computes XP, level, achievements, streak bonuses, and next unlock
 * from existing journey-memory and career-workspace data.
 *
 * Persists computed state via SafeStorage (local storage).
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { loadCareerWorkspace } from "./career-workspace";

const STORAGE_KEY = "corepath-achievements";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface AchievementState {
  xp: number;
  level: number;
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
  activeStreakBonus: number; // bonus XP from current streak
  nextUnlock: Achievement | null;
  computedAt: string;
}

// ============================================================================
// XP THRESHOLDS & XP VALUES
// ============================================================================

const XP_VALUES = {
  quizCompletion: 50,
  careerView: 10,
  careerComparison: 15,
  milestoneCompletion: 100,
  projectCompletion: 150,
  roadmapView: 10,
  roadmapStart: 25,
  roadmapComplete: 50,
} as const;

const STREAK_BONUSES = [
  { days: 3, bonus: 25 },
  { days: 7, bonus: 50 },
  { days: 14, bonus: 100 },
  { days: 30, bonus: 250 },
] as const;

/**
 * Calculate level from total XP.
 * Levels use progressively increasing thresholds.
 */
function levelFromXp(xp: number): number {
  if (xp < 200) return 1;
  if (xp < 500) return 2;
  if (xp < 1000) return 3;
  if (xp < 1800) return 4;
  if (xp < 2800) return 5;
  if (xp < 4000) return 6;
  if (xp < 5500) return 7;
  if (xp < 7500) return 8;
  if (xp < 10000) return 9;
  return 10;
}

/**
 * Get XP needed to reach the next level.
 */
function xpForNextLevel(xp: number): number {
  const nextLevel = levelFromXp(xp) + 1;
  const thresholds = [0, 200, 500, 1000, 1800, 2800, 4000, 5500, 7500, 10000, 13000];
  const currentThreshold = thresholds[Math.min(nextLevel - 1, thresholds.length - 1)];
  return currentThreshold;
}

/**
 * Get XP needed for current level (floor).
 */
function xpForCurrentLevel(level: number): number {
  const thresholds = [0, 0, 200, 500, 1000, 1800, 2800, 4000, 5500, 7500, 10000];
  return thresholds[Math.min(level, thresholds.length - 1)];
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

function defineAchievements(context: {
  quizCount: number;
  careerViewCount: number;
  comparisonCount: number;
  milestoneCount: number;
  projectCount: number;
  streak: number;
  roadmapsViewedCount: number;
  hasWorkspace: boolean;
}): Achievement[] {
  return [
    {
      id: "first-quiz",
      title: "First Quiz",
      description: "Complete your first career cognition quiz",
      icon: "📝",
      unlocked: context.quizCount >= 1,
    },
    {
      id: "quiz-master",
      title: "Quiz Master",
      description: "Complete 5 quizzes",
      icon: "🎯",
      unlocked: context.quizCount >= 5,
    },
    {
      id: "explorer",
      title: "Explorer",
      description: "View 10+ careers",
      icon: "🔍",
      unlocked: context.careerViewCount >= 10,
    },
    {
      id: "deep-explorer",
      title: "Deep Explorer",
      description: "View 25+ careers",
      icon: "🗺️",
      unlocked: context.careerViewCount >= 25,
    },
    {
      id: "comparer",
      title: "Comparer",
      description: "Compare 5+ career pairs",
      icon: "⚖️",
      unlocked: context.comparisonCount >= 5,
    },
    {
      id: "super-comparer",
      title: "Super Comparer",
      description: "Compare 15+ career pairs",
      icon: "🏆",
      unlocked: context.comparisonCount >= 15,
    },
    {
      id: "milestone-maker",
      title: "Milestone Maker",
      description: "Complete your first milestone",
      icon: "🎖️",
      unlocked: context.milestoneCount >= 1,
    },
    {
      id: "milestone-master",
      title: "Milestone Master",
      description: "Complete 5 milestones",
      icon: "🏅",
      unlocked: context.milestoneCount >= 5,
    },
    {
      id: "project-pro",
      title: "Project Pro",
      description: "Complete your first project",
      icon: "💼",
      unlocked: context.projectCount >= 1,
    },
    {
      id: "project-legend",
      title: "Project Legend",
      description: "Complete 5 projects",
      icon: "🌟",
      unlocked: context.projectCount >= 5,
    },
    {
      id: "streak-starter",
      title: "Streak Starter",
      description: "Maintain a 3-day streak",
      icon: "🔥",
      unlocked: context.streak >= 3,
    },
    {
      id: "streak-master",
      title: "Streak Master",
      description: "Maintain a 7-day streak",
      icon: "💪",
      unlocked: context.streak >= 7,
    },
    {
      id: "dedicated",
      title: "Dedicated",
      description: "Maintain a 14-day streak",
      icon: "⚡",
      unlocked: context.streak >= 14,
    },
    {
      id: "roadmapper",
      title: "Roadmapper",
      description: "Interact with 3+ career roadmaps",
      icon: "🧭",
      unlocked: context.roadmapsViewedCount >= 3,
    },
    {
      id: "career-tracker",
      title: "Career Tracker",
      description: "Select a career workspace",
      icon: "🚀",
      unlocked: context.hasWorkspace,
    },
  ];
}

// ============================================================================
// COMPUTATION
// ============================================================================

/**
 * Compute full achievement state from current data sources.
 * Called on mount — reads journey-memory + career-workspace.
 */
export function computeAchievements(): AchievementState {
  const memory = loadJourneyMemory();
  const workspace = loadCareerWorkspace();

  // === XP Sources ===

  // Quiz completions
  const quizXp = memory.completedQuizzes * XP_VALUES.quizCompletion;

  // Career views: count unique viewed careers
  const careerViewCount = Object.keys(memory.viewedCareers).length;
  const careerViewXp = Math.min(careerViewCount * XP_VALUES.careerView, 200); // cap at 200

  // Career comparisons
  const comparisonCount = Object.keys(memory.comparedCareerPairs).length;
  const comparisonXp = Math.min(comparisonCount * XP_VALUES.careerComparison, 300); // cap at 300

  // Milestone completions
  const milestoneCount = workspace?.completedMilestones.length ?? 0;
  const milestoneXp = milestoneCount * XP_VALUES.milestoneCompletion;

  // Project completions
  const projectCount = workspace?.completedProjects.length ?? 0;
  const projectXp = projectCount * XP_VALUES.projectCompletion;

  // Roadmap interactions
  let roadmapViewCount = 0;
  let roadmapStartCount = 0;
  let roadmapCompleteCount = 0;
  let roadmapIdsWithActivity = 0;

  if (memory.roadmapInteractions) {
    const entries = Object.entries(memory.roadmapInteractions);
    entries.forEach(([_, counts]) => {
      roadmapViewCount += counts.view;
      roadmapStartCount += counts.start;
      roadmapCompleteCount += counts.complete;
    });
    roadmapIdsWithActivity = entries.filter(
      ([_, c]) => c.view > 0 || c.start > 0 || c.complete > 0
    ).length;
  }

  const roadmapXp =
    roadmapViewCount * XP_VALUES.roadmapView +
    roadmapStartCount * XP_VALUES.roadmapStart +
    roadmapCompleteCount * XP_VALUES.roadmapComplete;

  // Streak bonuses
  const streak = workspace?.streak ?? 0;
  const activeStreakBonus = STREAK_BONUSES.filter((b) => streak >= b.days)
    .reduce((sum, b) => sum + b.bonus, 0);

  // Total XP
  const totalXp = quizXp + careerViewXp + comparisonXp + milestoneXp + projectXp + Math.min(roadmapXp, 500) + activeStreakBonus;

  // Level
  const level = levelFromXp(totalXp);

  // Achievements
  const achievements = defineAchievements({
    quizCount: memory.completedQuizzes,
    careerViewCount,
    comparisonCount,
    milestoneCount,
    projectCount,
    streak,
    roadmapsViewedCount: roadmapIdsWithActivity,
    hasWorkspace: workspace !== null,
  });

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  // Next unlock: the first locked achievement
  const nextUnlock = lockedAchievements.length > 0 ? lockedAchievements[0] : null;

  // Build state
  const state: AchievementState = {
    xp: totalXp,
    level,
    unlockedAchievements,
    lockedAchievements,
    activeStreakBonus,
    nextUnlock,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, state);

  return state;
}

/**
 * Load previously computed achievement state from cache.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadAchievements(): AchievementState | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<AchievementState>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  return cached;
}

/**
 * Get progress percentage toward the next level.
 */
export function levelProgressPercentage(state: AchievementState): number {
  const currentLevel = state.level;
  const currentFloor = xpForCurrentLevel(currentLevel);
  const nextFloor = xpForNextLevel(state.xp);
  const range = nextFloor - currentFloor;
  if (range <= 0) return 100;
  const progress = state.xp - currentFloor;
  return Math.min(100, Math.round((progress / range) * 100));
}

/**
 * Get a short readout of XP needed for next level.
 */
export function xpToNextLevel(state: AchievementState): number {
  return xpForNextLevel(state.xp) - state.xp;
}
