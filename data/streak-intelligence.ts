/**
 * STREAK INTELLIGENCE
 *
 * Computes daily streak, weekly streak, longest streak, recovery streak,
 * and streak freeze availability on top of CareerWorkspace data.
 *
 * Persists longest-streak record and freeze status via SafeStorage.
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadCareerWorkspace } from "./career-workspace";
import { logEvent } from "./analytics-events";

// ============================================================================
// CONSTANTS
// ============================================================================

const STREAK_KEY = "corepath-streak-intel";

const STREAK_MESSAGES: Record<string, string> = {
  none: "Start your first streak",
  building: "Momentum building",
  strong: "Strong progress",
  consistent: "You're becoming consistent",
};

const DAY_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type StreakGrade = "none" | "building" | "strong" | "consistent";

export interface StreakData {
  currentStreak: number;
  weeklyStreak: number;
  longestStreak: number;
  recoveryStreak: number;
  streakFreezeAvailable: number;
  missedYesterday: boolean;
  message: string;
  grade: StreakGrade;
}

interface StreakPersistence {
  longestStreak: number;
  freezesUsedThisWeek: number;
  freezeWeekStart: string; // ISO date of the Monday of the current freeze week
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function getStore() {
  return getSafeStorage({ silent: true });
}

function loadPersisted(): StreakPersistence {
  const store = getStore();
  const raw = store.get<StreakPersistence>(STREAK_KEY);
  return (
    raw ?? {
      longestStreak: 0,
      freezesUsedThisWeek: 0,
      freezeWeekStart: "",
    }
  );
}

function savePersisted(data: StreakPersistence): void {
  const store = getStore();
  store.set(STREAK_KEY, data);
}

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getDaysSince(dateStr: string): number {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr).getTime();
  return Math.floor((Date.now() - then) / DAY_MS);
}

function getDaysInWeek(): number {
  // Count how many distinct days this week had progress
  const workspace = loadCareerWorkspace();
  if (!workspace?.weeklyProgress) return 0;

  const now = new Date();
  const monday = getMondayOfWeek(now);
  const mondayMs = new Date(monday).getTime();

  const days = new Set<string>();
  for (const entry of workspace.weeklyProgress) {
    const entryMs = new Date(entry.date).getTime();
    if (entryMs >= mondayMs && entryMs <= now.getTime()) {
      days.add(new Date(entry.date).toISOString().split("T")[0]);
    }
  }
  return days.size;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute all streak metrics based on workspace data and persisted history.
 */
export function computeStreakData(): StreakData {
  const workspace = loadCareerWorkspace();
  const persisted = loadPersisted();

  const currentStreak = workspace?.streak ?? 0;
  const lastDate = workspace?.lastProgressDate ?? "";
  const weeklyStreak = getDaysInWeek();
  const longestStreak = Math.max(persisted.longestStreak, currentStreak);

  // Compute recovery streak: if current streak is < 3 but user had a longer past streak,
  // recovery streak is the current streak after a break
  const wasHigher =
    persisted.longestStreak > 0 &&
    currentStreak < persisted.longestStreak &&
    currentStreak > 0;
  const recoveryStreak = wasHigher ? currentStreak : 0;

  // Check if yesterday was missed (current streak is 0 or lastDate is more than 1 day ago)
  let missedYesterday = false;
  if (currentStreak === 0 && lastDate) {
    const daysSince = getDaysSince(lastDate);
    missedYesterday = daysSince >= 1 && daysSince < 3;
  } else if (currentStreak === 0 && !lastDate) {
    missedYesterday = false;
  } else if (lastDate) {
    const daysSince = getDaysSince(lastDate);
    missedYesterday = daysSince >= 2;
  }

  // Compute freeze availability (1 per week)
  const thisWeekMonday = getMondayOfWeek(new Date());
  let freezesUsedThisWeek = persisted.freezesUsedThisWeek;
  let freezeWeekStart = persisted.freezeWeekStart;

  // Reset if it's a new week
  if (freezeWeekStart !== thisWeekMonday) {
    freezesUsedThisWeek = 0;
    freezeWeekStart = thisWeekMonday;
  }

  const streakFreezeAvailable = Math.max(0, 1 - freezesUsedThisWeek);

  // Grade & message
  let grade: StreakGrade = "none";
  if (currentStreak >= 7) grade = "consistent";
  else if (currentStreak >= 3) grade = "strong";
  else if (currentStreak >= 1) grade = "building";

  const message = missedYesterday
    ? "Resume streak today"
    : STREAK_MESSAGES[grade];

  // Persist updated longest streak if needed
  if (longestStreak > persisted.longestStreak) {
    savePersisted({
      ...persisted,
      longestStreak,
      freezesUsedThisWeek,
      freezeWeekStart,
    });
  } else if (persisted.longestStreak > 0 && currentStreak === 0 && getDaysSince(lastDate) >= 7) {
    // Streak was broken — persisted longest stays, no change needed
  } else if (freezesUsedThisWeek !== persisted.freezesUsedThisWeek) {
    savePersisted({
      ...persisted,
      longestStreak,
      freezesUsedThisWeek,
      freezeWeekStart,
    });
  }

  return {
    currentStreak,
    weeklyStreak,
    longestStreak,
    recoveryStreak,
    streakFreezeAvailable,
    missedYesterday,
    message,
    grade,
  };
}

/**
 * Log streak lifecycle events based on the current state.
 * Call this when the widget mounts to detect streak milestones.
 */
export function logStreakEvents(data: StreakData): void {
  if (data.currentStreak === 1 && data.longestStreak <= 1) {
    logEvent("streak_started", { currentStreak: 1 });
  }
  if (data.recoveryStreak > 0 && data.currentStreak <= 3) {
    logEvent("streak_resumed", { currentStreak: data.currentStreak, recoveryStreak: data.recoveryStreak });
  }
  if (data.missedYesterday && data.currentStreak === 0 && data.longestStreak > 0) {
    logEvent("streak_broken", { longestStreak: data.longestStreak });
  }
}

/**
 * Use one streak freeze. Only available if streakFreezeAvailable > 0.
 * Returns updated StreakData or null if no freezes available.
 */
export function useStreakFreeze(): StreakData | null {
  const persisted = loadPersisted();
  const thisWeekMonday = getMondayOfWeek(new Date());

  let freezesUsedThisWeek = persisted.freezesUsedThisWeek;
  let freezeWeekStart = persisted.freezeWeekStart;

  // Reset if new week
  if (freezeWeekStart !== thisWeekMonday) {
    freezesUsedThisWeek = 0;
    freezeWeekStart = thisWeekMonday;
  }

  if (freezesUsedThisWeek >= 1) return null;

  freezesUsedThisWeek += 1;

  savePersisted({
    ...persisted,
    freezesUsedThisWeek,
    freezeWeekStart,
  });

  return computeStreakData();
}

/**
 * Get a human-readable message for a streak grade.
 */
export function getStreakMessage(grade: StreakGrade): string {
  return STREAK_MESSAGES[grade];
}

/**
 * Get the streak grade for a given numerical streak.
 */
export function getStreakGrade(streak: number): StreakGrade {
  if (streak >= 7) return "consistent";
  if (streak >= 3) return "strong";
  if (streak >= 1) return "building";
  return "none";
}
