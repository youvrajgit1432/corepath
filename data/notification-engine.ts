/**
 * NOTIFICATION INTELLIGENCE
 *
 * Generates smart local notifications based on user behavior and progress.
 * Evaluates 7 signals: missedDailyMission, streakAtRisk, goalBehindSchedule,
 * weeklyPlanIncomplete, newAchievementUnlocked, inactiveUser, careerDriftDetected.
 *
 * Persists via SafeStorage (local storage). Deduplicates by signal type.
 * Max 50 stored. Auto-resolves when the triggering condition clears.
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { loadCareerWorkspace } from "./career-workspace";
import { loadDailyMissions } from "./daily-missions";
import { loadCareerGoal } from "./career-goals";
import { loadAchievements, computeAchievements } from "./achievement-engine";
import { loadCareerProgress, computeCareerProgress } from "./career-progress";
import { loadWeeklyReflection } from "./weekly-reflection";

const STORAGE_KEY = "corepath-notifications";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type NotificationSignal =
  | "missedDailyMission"
  | "streakAtRisk"
  | "goalBehindSchedule"
  | "weeklyPlanIncomplete"
  | "newAchievementUnlocked"
  | "inactiveUser"
  | "careerDriftDetected";

export type NotificationPriority = "critical" | "high" | "medium" | "low";

export interface AppNotification {
  id: string;
  signal: NotificationSignal;
  title: string;
  message: string;
  priority: NotificationPriority;
  triggerReason: string;
  actionHref?: string;
  actionLabel?: string;
  createdAt: string;
  read: boolean;
}

// ============================================================================
// PRIORITY MAP
// ============================================================================

const SIGNAL_PRIORITY: Record<NotificationSignal, NotificationPriority> = {
  missedDailyMission: "medium",
  streakAtRisk: "high",
  goalBehindSchedule: "high",
  weeklyPlanIncomplete: "medium",
  newAchievementUnlocked: "medium",
  inactiveUser: "low",
  careerDriftDetected: "low",
};

// ============================================================================
// SIGNAL DETECTORS
// ============================================================================

interface SignalResult {
  active: boolean;
  title: string;
  message: string;
  triggerReason: string;
  actionHref?: string;
  actionLabel?: string;
}

function detectMissedDailyMission(): SignalResult {
  const missions = loadDailyMissions();
  const now = new Date();
  const hour = now.getHours();

  // Only trigger if it's afternoon (12+) and missions exist but some are incomplete
  const active =
    missions !== null &&
    hour >= 12 &&
    missions.completedMissionIds.length < 4 &&
    !missions.completedMissionIds.includes(missions.todayMission.id);

  return {
    active,
    title: "Today's mission still waiting",
    message: "Your daily mission is incomplete. A quick 10-minute session keeps your progress chain alive.",
    triggerReason: "missions exist but incomplete after noon",
    actionHref: "/",
    actionLabel: "View missions",
  };
}

function detectStreakAtRisk(): SignalResult {
  const workspace = loadCareerWorkspace();
  if (!workspace) {
    return { active: false, title: "", message: "", triggerReason: "" };
  }

  // Streak at risk if: streak is 0 after having had progress, or last progress > 36h ago
  const lastDate = workspace.lastProgressDate ? new Date(workspace.lastProgressDate) : null;
  const hoursSinceLastProgress = lastDate
    ? (Date.now() - lastDate.getTime()) / (1000 * 60 * 60)
    : Infinity;

  const active =
    (workspace.streak === 0 && workspace.completedMilestones.length > 0) ||
    (workspace.streak > 0 && hoursSinceLastProgress > 36);

  const daysMissed = Math.floor(hoursSinceLastProgress / 24);

  return {
    active,
    title: workspace.streak > 0 ? "Streak at risk" : "Streak was lost",
    message:
      workspace.streak > 0
        ? `You haven't logged progress in ${daysMissed} day${daysMissed > 1 ? "s" : ""}. Complete a small task to keep your ${workspace.streak}-day streak alive.`
        : `Your progress streak was lost. Restart it with one small action today — consistency builds career momentum.`,
    triggerReason:
      workspace.streak > 0
        ? `no progress in ${daysMissed} day(s) with streak at ${workspace.streak}`
        : "streak dropped to 0 after prior activity",
    actionHref: `/careers/${workspace.selectedCareerId}`,
    actionLabel: "Log progress",
  };
}

function detectGoalBehindSchedule(): SignalResult {
  const goal = loadCareerGoal();
  if (!goal) {
    return { active: false, title: "", message: "", triggerReason: "" };
  }

  // Import and compute signals inline to avoid circular dependency
  const workspace = loadCareerWorkspace();
  const progress = loadCareerProgress() ?? computeCareerProgress();
  const achievements = loadAchievements() ?? computeAchievements();

  const readiness = workspace?.estimatedReadiness ?? 0;
  const progressScore = progress.overallProgressScore;
  const goalProgress = Math.round(readiness * 0.6 + progressScore * 0.4);

  const startDate = new Date(goal.goalStartDate);
  const daysElapsed = Math.max(1, Math.round(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ));
  const totalDays = goal.targetMonths * 30;
  const expectedProgress = (daysElapsed / totalDays) * 100;
  const paceDiff = goalProgress - expectedProgress;

  const active = paceDiff < -10;

  return {
    active,
    title: "Career goal behind schedule",
    message: `Your ${goal.targetMonths}-month goal for progress is behind the expected pace. Consider increasing your weekly commitment or focusing on high-impact milestones.`,
    triggerReason: `progress ${goalProgress}% vs expected ${Math.round(expectedProgress)}%`,
    actionHref: "/",
    actionLabel: "Review goal",
  };
}

function detectWeeklyPlanIncomplete(): SignalResult {
  const workspace = loadCareerWorkspace();

  // Use weekly reflection completion rate as proxy for weekly plan completeness
  const reflection = loadWeeklyReflection();
  const completionRate = reflection?.missionCompletionRate ?? 0;

  // Also check workspace weekly progress entries
  const weeklyEntries = workspace?.weeklyProgress.filter((e) => {
    const d = new Date(e.date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length ?? 0;

  const active = completionRate < 40 || (workspace !== null && weeklyEntries < 2);

  return {
    active,
    title: "Weekly plan behind target",
    message:
      weeklyEntries < 2
        ? "You've logged fewer than 2 progress entries this week. Even one small action per day builds momentum."
        : `Your weekly engagement is at ${completionRate}%. Aim for small daily actions to reach the weekly target.`,
    triggerReason:
      weeklyEntries < 2
        ? `only ${weeklyEntries} progress entries this week`
        : `weekly completion rate at ${completionRate}%`,
    actionHref: "/",
    actionLabel: "View missions",
  };
}

function detectNewAchievementUnlocked(): SignalResult {
  const achievements = computeAchievements();
  const storage = getSafeStorage({ silent: true });
  const lastKnownCount = storage.get<number>("corepath-last-achievement-count");

  const currentCount = achievements.unlockedAchievements.length;
  const active = lastKnownCount !== null && currentCount > lastKnownCount;

  // Determine which achievements are new
  const newlyUnlocked = lastKnownCount !== null
    ? achievements.unlockedAchievements.slice(lastKnownCount)
    : [];

  const latestAchievement = newlyUnlocked[newlyUnlocked.length - 1];

  // Update stored count
  storage.set("corepath-last-achievement-count", currentCount);

  return {
    active,
    title: latestAchievement ? `Achievement unlocked: ${latestAchievement.title}` : "New achievement unlocked!",
    message: latestAchievement
      ? `${latestAchievement.description}. You're now at level ${achievements.level} with ${achievements.xp} XP.`
      : "You've unlocked a new achievement. Keep exploring to earn more.",
    triggerReason: `achievement count increased from ${lastKnownCount ?? 0} to ${currentCount}`,
    actionHref: "/",
    actionLabel: "View achievements",
  };
}

function detectInactiveUser(): SignalResult {
  const memory = loadJourneyMemory();
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Check last activity across all sources
  const lastQuizDate = memory.quizDates.length > 0
    ? new Date(memory.quizDates[memory.quizDates.length - 1]).getTime()
    : 0;

  const lastViewDate = memory.viewedCareerHistory.length > 0
    ? new Date(memory.viewedCareerHistory[memory.viewedCareerHistory.length - 1].timestamp).getTime()
    : 0;

  const lastComparisonDate = memory.comparisonHistory.length > 0
    ? new Date(memory.comparisonHistory[memory.comparisonHistory.length - 1].timestamp).getTime()
    : 0;

  const lastActivity = Math.max(lastQuizDate, lastViewDate, lastComparisonDate);

  // Only notify if user has done something before (has activity) but has been inactive
  const hasEverBeenActive = memory.completedQuizzes > 0 || memory.viewedCareerHistory.length > 0;
  const active = hasEverBeenActive && lastActivity > 0 && lastActivity < threeDaysAgo;

  const daysSince = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));

  return {
    active,
    title: "It's been a while",
    message:
      daysSince >= 7
        ? `You haven't visited in ${daysSince} days. Your career intelligence data is saved — pick up where you left off.`
        : `No activity in ${daysSince} day${daysSince > 1 ? "s" : ""}. A quick check-in keeps your career insights fresh.`,
    triggerReason: `${daysSince} day(s) since last activity`,
    actionHref: "/careers",
    actionLabel: "Explore careers",
  };
}

function detectCareerDriftDetected(): SignalResult {
  const progress = loadCareerProgress() ?? computeCareerProgress();
  const memory = loadJourneyMemory();

  const focus = progress.explorationFocus;

  // Drift if focus is low (viewing many unrelated careers) or many categories
  const viewedCount = Object.keys(memory.viewedCareers).length;
  const categoryCount = Object.keys(memory.favoriteCategories).length;

  const active = focus < 30 && viewedCount >= 5;

  return {
    active,
    title: "Career drift detected",
    message: `You've viewed ${viewedCount} careers across ${categoryCount} categories. Consider narrowing your focus to build deeper expertise in fewer paths.`,
    triggerReason: `exploration focus ${focus}% with ${viewedCount} careers viewed`,
    actionHref: "/",
    actionLabel: "Review focus",
  };
}

// ============================================================================
// DETECTOR REGISTRY
// ============================================================================

const DETECTORS: Array<{ signal: NotificationSignal; detect: () => SignalResult }> = [
  { signal: "missedDailyMission", detect: detectMissedDailyMission },
  { signal: "streakAtRisk", detect: detectStreakAtRisk },
  { signal: "goalBehindSchedule", detect: detectGoalBehindSchedule },
  { signal: "weeklyPlanIncomplete", detect: detectWeeklyPlanIncomplete },
  { signal: "newAchievementUnlocked", detect: detectNewAchievementUnlocked },
  { signal: "inactiveUser", detect: detectInactiveUser },
  { signal: "careerDriftDetected", detect: detectCareerDriftDetected },
];

// ============================================================================
// NOTIFICATION GENERATION & PERSISTENCE
// ============================================================================

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `notif-${Date.now()}-${idCounter}`;
}

function loadAllNotifications(): AppNotification[] {
  const storage = getSafeStorage({ silent: true });
  return storage.get<AppNotification[]>(STORAGE_KEY) ?? [];
}

function saveAllNotifications(notifications: AppNotification[]): void {
  const storage = getSafeStorage({ silent: true });
  // Max 50 stored
  const pruned = notifications.slice(0, 50);
  storage.set(STORAGE_KEY, pruned);
}

/**
 * Compute all active notification signals and merge with stored notifications.
 * Deduplicates by signal type — only the most recent unread notification per signal is kept.
 * Auto-resolves notifications when the triggering condition clears.
 */
export function computeNotifications(): AppNotification[] {
  const stored = loadAllNotifications();

  // Evaluate all signals fresh
  for (const { signal, detect } of DETECTORS) {
    const result = detect();

    // Find existing unread notification for this signal
    const existingIdx = stored.findIndex(
      (n) => n.signal === signal && !n.read
    );

    if (result.active) {
      if (existingIdx === -1) {
        // Create new notification
        const notification: AppNotification = {
          id: generateId(),
          signal,
          title: result.title,
          message: result.message,
          priority: SIGNAL_PRIORITY[signal],
          triggerReason: result.triggerReason,
          actionHref: result.actionHref,
          actionLabel: result.actionLabel,
          createdAt: new Date().toISOString(),
          read: false,
        };
        stored.unshift(notification);
      } else {
        // Update existing — refresh timestamp and message
        stored[existingIdx] = {
          ...stored[existingIdx],
          title: result.title,
          message: result.message,
          triggerReason: result.triggerReason,
          actionHref: result.actionHref ?? stored[existingIdx].actionHref,
          actionLabel: result.actionLabel ?? stored[existingIdx].actionLabel,
          createdAt: new Date().toISOString(),
        };
      }
    } else {
      // Signal no longer active — auto-resolve if unread
      if (existingIdx !== -1) {
        stored[existingIdx] = {
          ...stored[existingIdx],
          read: true,
        };
      }
    }
  }

  // Sort: unread first, then by createdAt descending
  stored.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  saveAllNotifications(stored);
  return stored;
}

/**
 * Get all notifications, computing fresh signals on each call.
 */
export function getNotifications(): AppNotification[] {
  return computeNotifications();
}

/**
 * Get the count of unread notifications.
 */
export function getUnreadCount(): number {
  const stored = loadAllNotifications();
  return stored.filter((n) => !n.read).length;
}

/**
 * Mark a single notification as read.
 */
export function markAsRead(id: string): AppNotification[] {
  const stored = loadAllNotifications();
  const updated = stored.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveAllNotifications(updated);
  return updated;
}

/**
 * Mark all notifications as read.
 */
export function markAllAsRead(): AppNotification[] {
  const stored = loadAllNotifications();
  const updated = stored.map((n) => ({ ...n, read: true }));
  saveAllNotifications(updated);
  return updated;
}

/**
 * Clear all read notifications.
 */
export function clearReadNotifications(): AppNotification[] {
  const stored = loadAllNotifications();
  const updated = stored.filter((n) => !n.read);
  saveAllNotifications(updated);
  return updated;
}

/**
 * Map a notification signal to a command-center section name.
 * Returns undefined for signals that should navigate to the dashboard without scrolling.
 */
export function notificationSection(
  signal: NotificationSignal
): "goals" | "missions" | "planner" | "achievements" | "analytics" | undefined {
  const map: Record<NotificationSignal, string | undefined> = {
    goalBehindSchedule: "goals",
    missedDailyMission: "missions",
    weeklyPlanIncomplete: "planner",
    newAchievementUnlocked: "achievements",
    careerDriftDetected: "analytics",
    inactiveUser: undefined,
    streakAtRisk: undefined,
  };
  return map[signal] as any;
}

/**
 * Get the human-readable label for a priority level.
 */
export function formatPriority(priority: NotificationPriority): string {
  const labels: Record<NotificationPriority, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[priority];
}

/**
 * Get CSS color for a priority level.
 */
export function priorityColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    critical: "text-red-400",
    high: "text-orange-400",
    medium: "text-yellow-400",
    low: "text-gray-400",
  };
  return colors[priority];
}

/**
 * Get dot color for a priority level (for visual indicators).
 */
export function priorityDotColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    critical: "bg-red-400",
    high: "bg-orange-400",
    medium: "bg-yellow-400",
    low: "bg-gray-400",
  };
  return colors[priority];
}
