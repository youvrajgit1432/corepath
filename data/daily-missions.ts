/**
 * DAILY MISSION INTELLIGENCE
 *
 * Generates small daily actions personalized to user state.
 * Sources: career progress, skill gaps, workspace phase, journey activity, achievement level.
 *
 * Persists completion state via SafeStorage with daily refresh.
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { loadCareerWorkspace } from "./career-workspace";
import { loadCareerProgress } from "./career-progress";
import { loadAchievements } from "./achievement-engine";
import { analyzeSkillGap } from "./skill-gap";
import { getCareerById } from "./careers";

const STORAGE_KEY = "corepath-daily-missions";
const DAILY_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type MissionDifficulty = "easy" | "medium" | "hard";

export interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  estimatedMinutes: number;
  rewardXP: number;
  category: MissionCategory;
  /** Link target for the mission action, if applicable */
  actionHref?: string;
}

export type MissionCategory =
  | "quiz"
  | "explore"
  | "compare"
  | "workspace"
  | "roadmap"
  | "skill"
  | "review"
  | "streak";

export interface DailyMissionSet {
  date: string; // ISO date (YYYY-MM-DD) this set was generated for
  todayMission: Mission;
  easyMission: Mission;
  stretchMission: Mission;
  streakMission: Mission | null; // only if user has a streak
  completedMissionIds: string[];
  lastCompletedAt: string | null;
}

// ============================================================================
// XP SCALING BY LEVEL
// ============================================================================

function xpForDifficulty(difficulty: MissionDifficulty, level: number): number {
  const base = difficulty === "easy" ? 30 : difficulty === "medium" ? 65 : 120;
  const levelMultiplier = 1 + (level - 1) * 0.1;
  return Math.round(base * levelMultiplier);
}

// ============================================================================
// MISSION TEMPLATES
// ============================================================================

interface UserContext {
  hasWorkspace: boolean;
  selectedCareerId: string;
  selectedCareerTitle: string;
  activePhaseName: string;
  activePhaseNumber: number;
  completedQuizzes: number;
  streak: number;
  level: number;
  overallProgressScore: number;
  milestonesCompleted: number;
  projectsCompleted: number;
  viewedCareersCount: number;
  comparisonCount: number;
  topMissingSkill: string | null;
}

function gatherContext(): UserContext {
  const memory = loadJourneyMemory();
  const workspace = loadCareerWorkspace();
  const achievements = loadAchievements();
  const progress = loadCareerProgress();

  const level = achievements?.level ?? 1;
  const overallProgressScore = progress?.overallProgressScore ?? 0;

  // Compute top missing skill from skill gaps (if workspace exists)
  let topMissingSkill: string | null = null;
  if (workspace) {
    const career = getCareerById(workspace.selectedCareerId);
    if (career) {
      const gap = analyzeSkillGap(career, []);
      if (gap.missingSkills.length > 0) {
        topMissingSkill = gap.missingSkills[0];
      }
    }
  }

  return {
    hasWorkspace: workspace !== null,
    selectedCareerId: workspace?.selectedCareerId ?? "",
    selectedCareerTitle: workspace?.selectedCareerTitle ?? "",
    activePhaseName: workspace?.activePhaseName ?? "",
    activePhaseNumber: workspace?.activePhaseNumber ?? 0,
    completedQuizzes: memory.completedQuizzes,
    streak: workspace?.streak ?? 0,
    level,
    overallProgressScore,
    milestonesCompleted: workspace?.completedMilestones.length ?? 0,
    projectsCompleted: workspace?.completedProjects.length ?? 0,
    viewedCareersCount: Object.keys(memory.viewedCareers).length,
    comparisonCount: Object.keys(memory.comparedCareerPairs).length,
    topMissingSkill,
  };
}

function generateMissions(ctx: UserContext): {
  today: Mission;
  easy: Mission;
  stretch: Mission;
  streak: Mission | null;
} {
  // ==================== TODAY'S MISSION (medium) ====================

  const today = pickTodayMission(ctx);

  // ==================== EASY MISSION ====================

  const easy = pickEasyMission(ctx);

  // ==================== STRETCH MISSION (hard) ====================

  const stretch = pickStretchMission(ctx);

  // ==================== STREAK MISSION ====================

  const streak = ctx.streak >= 1 ? pickStreakMission(ctx) : null;

  return { today, easy, stretch, streak };
}

function pickTodayMission(ctx: UserContext): Mission {
  // New user — no quiz, no workspace
  if (ctx.completedQuizzes === 0) {
    return {
      id: "take-first-quiz",
      title: "Take your first career cognition quiz",
      description: "Discover your thinking profile and get personalized career recommendations tailored to your style.",
      difficulty: "medium",
      estimatedMinutes: 10,
      rewardXP: xpForDifficulty("medium", ctx.level),
      category: "quiz",
      actionHref: "/quiz",
    };
  }

  // Has quiz but no workspace
  if (!ctx.hasWorkspace) {
    return {
      id: "select-career-workspace",
      title: "Select a career to start tracking",
      description: "Pick a career that matches your profile and begin tracking your progress with milestones and projects.",
      difficulty: "medium",
      estimatedMinutes: 8,
      rewardXP: xpForDifficulty("medium", ctx.level),
      category: "workspace",
      actionHref: "/careers",
    };
  }

  // Has workspace — phase-related mission
  const phaseMission: Mission = {
    id: `complete-phase-milestone-${ctx.activePhaseNumber}`,
    title: `Complete: ${ctx.activePhaseName}`,
    description: `Work on the current phase milestone to advance your ${ctx.selectedCareerTitle} progress.`,
    difficulty: "medium",
    estimatedMinutes: 15,
    rewardXP: xpForDifficulty("medium", ctx.level),
    category: "workspace",
    actionHref: `/careers/${ctx.selectedCareerId}`,
  };

  // If milestones > 0, give more variety
  if (ctx.milestonesCompleted >= 1 && ctx.completedQuizzes >= 1) {
    // Alternate between quiz retake, exploration, and workspace
    const rng = Math.random();
    if (rng < 0.25 && ctx.completedQuizzes >= 2) {
      return {
        id: "retake-quiz",
        title: "Retake the quiz to update your profile",
        description: "Your interests may have shifted — retake the quiz to refresh your recommendations and track changes.",
        difficulty: "medium",
        estimatedMinutes: 10,
        rewardXP: xpForDifficulty("medium", ctx.level),
        category: "quiz",
        actionHref: "/quiz",
      };
    }
  }

  return phaseMission;
}

function pickEasyMission(ctx: UserContext): Mission {
  // Different easy missions based on state
  const options: Mission[] = [];

  if (ctx.completedQuizzes === 0) {
    options.push({
      id: "view-one-career",
      title: "Explore a career",
      description: "Browse one career intelligence card to start understanding your options.",
      difficulty: "easy",
      estimatedMinutes: 3,
      rewardXP: xpForDifficulty("easy", ctx.level),
      category: "explore",
      actionHref: "/careers",
    });
  }

  if (ctx.hasWorkspace) {
    options.push({
      id: "view-roadmap-overview",
      title: "Review your roadmap",
      description: "Take a quick look at the phases ahead in your career roadmap.",
      difficulty: "easy",
      estimatedMinutes: 3,
      rewardXP: xpForDifficulty("easy", ctx.level),
      category: "roadmap",
      actionHref: `/careers/${ctx.selectedCareerId}`,
    });
  }

  options.push({
    id: "check-progress",
    title: "Check your progress dashboard",
    description: "Review your XP, achievements, and career readiness at a glance.",
    difficulty: "easy",
    estimatedMinutes: 2,
    rewardXP: xpForDifficulty("easy", ctx.level),
    category: "review",
  });

  if (ctx.topMissingSkill && ctx.hasWorkspace) {
    options.push({
      id: `skill-gap-${ctx.topMissingSkill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      title: `Learn: ${ctx.topMissingSkill}`,
      description: `This is a key skill for ${ctx.selectedCareerTitle}. Start learning the fundamentals today.`,
      difficulty: "easy",
      estimatedMinutes: 4,
      rewardXP: xpForDifficulty("easy", ctx.level),
      category: "skill",
      actionHref: `/careers/${ctx.selectedCareerId}`,
    });
  }

  if (ctx.viewedCareersCount < 5) {
    options.push({
      id: "explore-new-category",
      title: "Discover a new career category",
      description: "Browse a category you haven't explored yet to broaden your perspective.",
      difficulty: "easy",
      estimatedMinutes: 4,
      rewardXP: xpForDifficulty("easy", ctx.level),
      category: "explore",
      actionHref: "/careers",
    });
  }

  // Pick based on simple rotation using day of year
  const dayIndex = new Date().getDate() % options.length;
  return options[dayIndex];
}

function pickStretchMission(ctx: UserContext): Mission {
  // Harder mission for engaged users
  if (!ctx.hasWorkspace || ctx.completedQuizzes === 0) {
    // Stretch for new users: compare two careers
    return {
      id: "compare-careers",
      title: "Compare two careers side by side",
      description: "Use the comparison tool to evaluate two different paths and see which aligns better with your strengths.",
      difficulty: "hard",
      estimatedMinutes: 12,
      rewardXP: xpForDifficulty("hard", ctx.level),
      category: "compare",
      actionHref: "/careers",
    };
  }

  if (ctx.streak >= 3 && ctx.completedQuizzes >= 2) {
    return {
      id: "complete-roadmap-start",
      title: "Start a roadmap milestone",
      description: `Dive into the "${ctx.activePhaseName}" phase and begin working toward your first milestone for ${ctx.selectedCareerTitle}.`,
      difficulty: "hard",
      estimatedMinutes: 20,
      rewardXP: xpForDifficulty("hard", ctx.level),
      category: "workspace",
    };
  }

  return {
    id: "explore-roadmaps",
    title: "Explore career roadmaps",
    description: "Review the step-by-step roadmap for multiple careers to understand what each path requires.",
    difficulty: "hard",
    estimatedMinutes: 15,
    rewardXP: xpForDifficulty("hard", ctx.level),
    category: "roadmap",
    actionHref: "/careers",
  };
}

function pickStreakMission(ctx: UserContext): Mission {
  const streak = ctx.streak;
  const nextMilestone = streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : 60;

  let title: string;
  let description: string;

  if (streak === 0) {
    title = "Start your streak";
    description = "Complete any mission today to begin a progress streak.";
  } else if (streak < 3) {
    title = `${streak}/3 toward Streak Starter`;
    description = `You're ${streak}/3 days toward unlocking the Streak Starter achievement. Keep going!`;
  } else if (streak < 7) {
    title = `${streak}/7 toward Streak Master`;
    description = `${streak} days strong! ${7 - streak} more days until Streak Master.`;
  } else if (streak < 14) {
    title = `${streak}/14 toward Dedicated`;
    description = `Impressive ${streak}-day streak! Only ${14 - streak} days until Dedicated.`;
  } else if (streak < 30) {
    title = `${streak}/30 — legendary territory`;
    description = `${streak} days and counting! Can you hit 30?`;
  } else {
    title = `${streak}-day streak — maintain it!`;
    description = `You're on an incredible ${streak}-day streak. Don't break it now!`;
  }

  return {
    id: `streak-${nextMilestone}`,
    title,
    description,
    difficulty: "easy",
    estimatedMinutes: 2,
    rewardXP: 25 + Math.min(75, streak * 5), // scales with streak
    category: "streak",
  };
}

// ============================================================================
// PERSISTENCE
// ============================================================================

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Generate a fresh daily mission set for today.
 */
export function generateDailyMissions(): DailyMissionSet {
  const ctx = gatherContext();
  const { today, easy, stretch, streak } = generateMissions(ctx);

  const set: DailyMissionSet = {
    date: getTodayKey(),
    todayMission: today,
    easyMission: easy,
    stretchMission: stretch,
    streakMission: streak,
    completedMissionIds: [],
    lastCompletedAt: null,
  };

  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, set);

  return set;
}

/**
 * Load today's mission set.
 * Returns null if none exists for today (first visit or stale).
 */
export function loadDailyMissions(): DailyMissionSet | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<DailyMissionSet>(STORAGE_KEY);
  if (!cached) return null;

  const today = getTodayKey();
  if (cached.date !== today) return null;

  return cached;
}

/**
 * Get the current mission set, generating a fresh one if needed.
 */
export function getDailyMissions(): DailyMissionSet {
  const existing = loadDailyMissions();
  if (existing) return existing;
  return generateDailyMissions();
}

// ============================================================================
// COMPLETION
// ============================================================================

/**
 * Mark a mission as completed for today.
 * Returns the updated mission set, or null if no set exists.
 */
export function completeMission(missionId: string): DailyMissionSet | null {
  const set = loadDailyMissions();
  if (!set) return null;

  if (set.completedMissionIds.includes(missionId)) return set;

  set.completedMissionIds = [...set.completedMissionIds, missionId];
  set.lastCompletedAt = new Date().toISOString();

  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, set);

  return set;
}

/**
 * Check if a mission has been completed today.
 */
export function isMissionCompleted(missionId: string): boolean {
  const set = loadDailyMissions();
  return set?.completedMissionIds.includes(missionId) ?? false;
}

// ============================================================================
// COUNTDOWN
// ============================================================================

/**
 * Get the number of milliseconds until the next daily reset.
 */
export function getNextResetMs(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}
