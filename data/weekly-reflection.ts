/**
 * WEEKLY REFLECTION INTELLIGENCE
 *
 * Creates a weekly review system showing growth and learning patterns.
 * Sources: journey-memory, achievements, daily-missions, career-progress, career-workspace.
 *
 * Persists via SafeStorage with ISO week key (weekly refresh).
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { loadCareerWorkspace } from "./career-workspace";
import { loadAchievements } from "./achievement-engine";
import { loadCareerProgress } from "./career-progress";


const STORAGE_KEY = "corepath-weekly-reflection";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface WeeklyReflection {
  weekKey: string; // ISO week key: "YYYY-Www"
  wins: string[];
  slowdowns: string[];
  skillsImproved: string[];
  missionCompletionRate: number; // 0–100
  streakTrend: "growing" | "stable" | "declining";
  weeklyInsight: string;
  nextWeekFocus: string;
  motivationSignal: string;
  computedAt: string;
}

// ============================================================================
// ISO WEEK HELPERS
// ============================================================================

function getISOWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const year = d.getFullYear();
  const week = Math.floor(
    (d.getTime() - new Date(year, 0, 4).getTime()) / (7 * 24 * 60 * 60 * 1000) +
      1
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getWeekStartDate(weekKey: string): Date {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  // January 4th is always in week 1 of ISO week
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // Monday = 0
  const week1Start = new Date(jan4.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  return new Date(week1Start.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
}

/** Check if a timestamp falls within a given ISO week */
function isInWeek(timestamp: string, weekKey: string): boolean {
  const d = new Date(timestamp);
  return getISOWeekKey(d) === weekKey;
}

// ============================================================================
// COMPUTATION
// ============================================================================

/**
 * Compute a full weekly reflection from existing data sources.
 */
export function computeWeeklyReflection(): WeeklyReflection {
  const weekKey = getISOWeekKey();
  const memory = loadJourneyMemory();
  const workspace = loadCareerWorkspace();
  const achievements = loadAchievements();
  const progress = loadCareerProgress();

  // ==================== WINS ====================

  const wins = computeWins(weekKey, memory, workspace, achievements);

  // ==================== SLOWDOWNS ====================

  const slowdowns = computeSlowdowns(weekKey, memory, workspace);

  // ==================== SKILLS IMPROVED ====================

  const skillsImproved = computeSkillsImproved(memory);

  // ==================== MISSION COMPLETION RATE ====================

  const missionCompletionRate = computeMissionCompletionRate(workspace, weekKey);

  // ==================== STREAK TREND ====================

  const streakTrend = computeStreakTrend(workspace);

  // ==================== INSIGHT & FOCUS ====================

  const metrics = {
    winsCount: wins.length,
    slowdownsCount: slowdowns.length,
    skillsCount: skillsImproved.length,
    missionCompletionRate,
    streakTrend,
    hasWorkspace: workspace !== null,
    completedQuizzes: memory.completedQuizzes,
    level: achievements?.level ?? 1,
    xp: achievements?.xp ?? 0,
    milestones: workspace?.completedMilestones.length ?? 0,
    projects: workspace?.completedProjects.length ?? 0,
    overallProgress: progress?.overallProgressScore ?? 0,
  };

  const weeklyInsight = generateWeeklyInsight(metrics);
  const nextWeekFocus = generateNextWeekFocus(metrics);
  const motivationSignal = generateMotivationSignal(metrics);

  const reflection: WeeklyReflection = {
    weekKey,
    wins,
    slowdowns,
    skillsImproved,
    missionCompletionRate,
    streakTrend,
    weeklyInsight,
    nextWeekFocus,
    motivationSignal,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, reflection);

  return reflection;
}

/**
 * Load the most recently computed weekly reflection.
 * Returns null if stale (different ISO week) or never computed.
 */
export function loadWeeklyReflection(): WeeklyReflection | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<WeeklyReflection>(STORAGE_KEY);
  if (!cached) return null;

  // Stale if different ISO week
  if (cached.weekKey !== getISOWeekKey()) return null;

  return cached;
}

/**
 * Get the current weekly reflection, computing fresh if needed.
 */
export function getWeeklyReflection(): WeeklyReflection {
  const existing = loadWeeklyReflection();
  if (existing) return existing;
  return computeWeeklyReflection();
}

// ============================================================================
// PRIVATE METRIC COMPUTATIONS
// ============================================================================

function computeWins(
  weekKey: string,
  memory: ReturnType<typeof loadJourneyMemory>,
  workspace: ReturnType<typeof loadCareerWorkspace>,
  achievements: ReturnType<typeof loadAchievements>
): string[] {
  const wins: string[] = [];

  // Weekly progress entries (this week)
  if (workspace) {
    const thisWeekEntries = workspace.weeklyProgress.filter((e) =>
      isInWeek(e.date, weekKey)
    );
    const uniqueActions = [...new Set(thisWeekEntries.map((e) => e.action))];
    uniqueActions.slice(0, 3).forEach((action) => wins.push(action));
  }

  // New achievements (since last week)
  if (achievements && achievements.unlockedAchievements.length > 0) {
    wins.push(`Unlocked ${achievements.unlockedAchievements.length} achievements`);
  }

  // Quiz completions this week
  const quizzesThisWeek = memory.quizDates.filter((d) => isInWeek(d, weekKey)).length;
  if (quizzesThisWeek > 0) {
    wins.push(`Completed ${quizzesThisWeek} career cognition quiz${quizzesThisWeek > 1 ? "zes" : ""}`);
  }

  // Milestone/project completions
  if (workspace) {
    if (workspace.completedMilestones.length > 0) {
      wins.push(
        `Progressed through ${workspace.completedMilestones.length} milestone${workspace.completedMilestones.length > 1 ? "s" : ""}`
      );
    }
    if (workspace.completedProjects.length > 0) {
      wins.push(
        `Delivered ${workspace.completedProjects.length} project${workspace.completedProjects.length > 1 ? "s" : ""}`
      );
    }
    if (workspace.streak >= 3) {
      wins.push(`Maintained a ${workspace.streak}-day streak`);
    }
  }

  // Career views this week
  const viewsThisWeek = memory.viewedCareerHistory.filter((v) =>
    isInWeek(v.timestamp, weekKey)
  ).length;
  if (viewsThisWeek >= 3) {
    wins.push(`Explored ${viewsThisWeek} new career paths`);
  }

  return [...new Set(wins)].slice(0, 5);
}

function computeSlowdowns(
  weekKey: string,
  memory: ReturnType<typeof loadJourneyMemory>,
  workspace: ReturnType<typeof loadCareerWorkspace>
): string[] {
  const slowdowns: string[] = [];

  // No quiz activity this week
  const quizzesThisWeek = memory.quizDates.filter((d) => isInWeek(d, weekKey)).length;
  if (quizzesThisWeek === 0 && memory.completedQuizzes > 0) {
    slowdowns.push("No quiz retakes this week — your profile may need refreshing");
  }

  // Low career exploration
  const viewsThisWeek = memory.viewedCareerHistory.filter((v) =>
    isInWeek(v.timestamp, weekKey)
  ).length;
  if (viewsThisWeek < 2 && memory.completedQuizzes > 0) {
    slowdowns.push("Limited career exploration this week");
  }

  // No workspace progress
  const weeklyEntries = workspace?.weeklyProgress.filter((e) =>
    isInWeek(e.date, weekKey)
  ).length ?? 0;
  if (workspace && weeklyEntries === 0) {
    slowdowns.push("No workspace progress recorded this week");
  }

  // Streak dropped
  if (workspace && workspace.streak === 0 && workspace.lastProgressDate) {
    slowdowns.push("Streak was lost — take one action to restart it");
  }

  // Low confidence trend
  if (memory.confidenceHistory.length >= 2) {
    const recent = memory.confidenceHistory.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    if (last < first && last < 50) {
      slowdowns.push("Confidence dipped in recent sessions");
    }
  }

  return slowdowns.slice(0, 3);
}

function computeSkillsImproved(
  memory: ReturnType<typeof loadJourneyMemory>
): string[] {
  const skills: string[] = [];

  // Confidence trend as growth signal
  if (memory.confidenceHistory.length >= 2) {
    const recent = memory.confidenceHistory.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    if (last - first > 5) {
      skills.push("Career self-assessment clarity");
    }
    if (last > 65) {
      skills.push("Confident decision-making");
    }
  }

  // Specialization depth growth
  if (memory.specializationDepthHistory.length >= 2) {
    const recent = memory.specializationDepthHistory.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    if (last - first > 0.05) {
      skills.push("Specialization focus deepening");
    }
  }

  // Exploration breadth
  const viewedCount = Object.keys(memory.viewedCareers).length;
  if (viewedCount >= 5 && viewedCount <= 15) {
    skills.push("Informed career exploration");
  }
  if (viewedCount >= 3) {
    skills.push("Career landscape awareness");
  }

  // Theme recognition
  const topThemes = Object.entries(memory.repeatedThemes)
    .sort(([, a], [, b]) => b - a)
    .filter(([, v]) => v > 0)
    .slice(0, 3)
    .map(([theme]) => theme);
  if (topThemes.length >= 2) {
    skills.push(`${topThemes.slice(0, 2).join(" & ")} pattern recognition`);
  }

  return [...new Set(skills)].slice(0, 4);
}

function computeMissionCompletionRate(
  workspace: ReturnType<typeof loadCareerWorkspace>,
  weekKey: string
): number {
  // Use weekly progress entries as a proxy for daily engagement
  const thisWeekEntries = workspace?.weeklyProgress.filter((e) =>
    isInWeek(e.date, weekKey)
  ) ?? [];

  // Count unique days with activity
  const activeDays = new Set(
    thisWeekEntries.map((e) => e.date.split("T")[0])
  ).size;

  // Rate = active days / 7
  return Math.min(100, Math.round((activeDays / 7) * 100));
}

function computeStreakTrend(
  workspace: ReturnType<typeof loadCareerWorkspace>
): WeeklyReflection["streakTrend"] {
  if (!workspace) return "stable";

  const currentStreak = workspace.streak;

  // Check weekly progress for how many days had entries
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeek = workspace.weeklyProgress.filter((e) => {
    const d = new Date(e.date);
    return d >= weekAgo && d <= now;
  });
  const activeDays = new Set(prevWeek.map((e) => e.date.split("T")[0])).size;

  // If active most days and streak is growing
  if (currentStreak >= 5 && activeDays >= 4) return "growing";
  if (currentStreak >= 3 && activeDays >= 3) return "growing";

  // If active but not building streak
  if (currentStreak >= 1 && activeDays >= 2) return "stable";

  // If minimal activity
  return "declining";
}

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

interface MetricsSummary {
  winsCount: number;
  slowdownsCount: number;
  skillsCount: number;
  missionCompletionRate: number;
  streakTrend: string;
  hasWorkspace: boolean;
  completedQuizzes: number;
  level: number;
  xp: number;
  milestones: number;
  projects: number;
  overallProgress: number;
}

function generateWeeklyInsight(m: MetricsSummary): string {
  // New users
  if (m.completedQuizzes === 0) {
    return "This week was about discovery — you're building the foundation for your career intelligence journey. Every exploration starts with a first step.";
  }

  if (!m.hasWorkspace) {
    return "You've completed your career cognition and explored options. Consider selecting a career to start tracking structured progress next week.";
  }

  // Strong week
  if (m.winsCount >= 3 && m.missionCompletionRate >= 60) {
    return `Strong week! You logged ${m.winsCount} wins with ${m.missionCompletionRate}% consistency. Your ${m.streakTrend} streak shows real momentum building toward your ${m.milestones > 0 ? "milestone goals" : "career goals"}.`;
  }

  // Building momentum
  if (m.missionCompletionRate >= 40) {
    return `Consistent week with ${m.missionCompletionRate}% engagement. You're building reliable habits that compound into long-term career progress.`;
  }

  // Low activity
  if (m.missionCompletionRate < 40 && m.completedQuizzes > 0) {
    return `Light engagement this week — ${m.missionCompletionRate}% active days. Even small actions build career clarity. Try a quick mission tomorrow to rebuild momentum.`;
  }

  return "Every week of engagement adds to your career intelligence. Keep showing up — the pattern builds the path.";
}

function generateNextWeekFocus(m: MetricsSummary): string {
  if (m.completedQuizzes === 0) {
    return "Take your first career cognition quiz to discover your thinking profile.";
  }

  if (!m.hasWorkspace) {
    return "Select a career to start tracking progress with milestones and projects.";
  }

  if (m.slowdownsCount >= 2) {
    return "Focus on consistency — aim for at least one small action each day to rebuild your streak and momentum.";
  }

  if (m.missionCompletionRate < 50) {
    return "Increase daily engagement — try completing the easy mission each day to build a reliable rhythm.";
  }

  if (m.milestones === 0) {
    return "Complete your first milestone in the current phase to unlock structured progress tracking.";
  }

  if (m.projects === 0) {
    return "Start your first project — applying learned skills to real work accelerates readiness.";
  }

  if (m.level < 5) {
    return "Deepen your exploration: compare careers, review roadmaps, and retake the quiz to sharpen your profile.";
  }

  return "Continue your current pace — you're building strong career intelligence habits. Focus on completing your next milestone.";
}

function generateMotivationSignal(m: MetricsSummary): string {
  if (m.completedQuizzes === 0) {
    return "You're here — that's the first and most important step toward career clarity.";
  }

  if (m.xp >= 1000) {
    return `Level ${m.level} with ${m.xp} XP — your commitment is building real career intelligence momentum. Keep showing up.`;
  }

  if (m.streakTrend === "growing") {
    return "Your streak is building! Consistency is the #1 predictor of career progression success.";
  }

  if (m.winsCount >= 3) {
    return "This week shows real traction — each action you take adds to a clearer, more confident career path.";
  }

  if (m.overallProgress > 0) {
    return "Every action counts. Your career intelligence is compounding with each quiz, exploration, and comparison.";
  }

  return "Career clarity doesn't come from a single decision — it comes from consistent exploration and reflection. You're on the right path.";
}

// ============================================================================
// EXPLICIT REFRESH
// ============================================================================

/**
 * Force a refresh of the weekly reflection, regardless of staleness.
 */
export function refreshWeeklyReflection(): WeeklyReflection {
  return computeWeeklyReflection();
}
