/**
 * ENGAGEMENT PULSE INTELLIGENCE
 *
 * Detects burnout, fatigue, or disengagement patterns and generates:
 * - Pulse score (energy/engagement level)
 * - Fatigue signals with severity
 * - Energy forecast
 * - Rest recommendations
 * - Notification/mission load assessment
 * - Booster suggestions
 *
 * Sources: engagement-signals, behavior-patterns, notification-engine,
 *          daily-missions, weekly-reflection, action-sprints, journey-memory,
 *          growth-analytics, career-workspace
 *
 * Persists via SafeStorage with 14-day pulse history.
 * No backend. No auth.
 */

import { analyzeEngagementSignals, analyzeBehaviorProfile } from "./engagement-signals";
import { computeBehaviorPatterns, loadBehaviorPatterns, type BehaviorPatternsData } from "./behavior-patterns";
import { getNotifications } from "./notification-engine";
import { loadDailyMissions } from "./daily-missions";
import { loadWeeklyReflection } from "./weekly-reflection";
import { loadActionSprint, loadSprintHistory } from "./action-sprints";
import { loadJourneyMemory } from "./journey-memory";
import { getGrowthAnalytics, loadGrowthAnalytics } from "./growth-analytics";
import { loadCareerWorkspace } from "./career-workspace";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-engagement-pulse";
const HISTORY_KEY = "corepath-pulse-history";
const MAX_HISTORY = 14;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface FatigueSignal {
  type: "overload" | "burnout_risk" | "disengagement" | "inconsistency" | "overwhelm";
  severity: "low" | "medium" | "high";
  detail: string;
}

export interface PulseDimension {
  name: string;
  label: string;
  score: number; // 0–100
  status: "positive" | "neutral" | "caution" | "critical";
  signals: string[];
}

export interface PulseHistoryEntry {
  date: string;
  pulseScore: number;
  energyForecast: EngagementPulseData["energyForecast"];
}

export type EnergyForecast = "sustained" | "declining" | "recovering";

export type LoadLevel = "low" | "medium" | "high";

export interface EngagementPulseData {
  pulseScore: number; // 0–100 overall
  dimensions: PulseDimension[];
  energyForecast: EnergyForecast;
  fatigueSignals: FatigueSignal[];
  notificationLoad: LoadLevel;
  missionLoad: LoadLevel;
  recommendedDifficulty: "easier" | "maintain" | "challenge";
  restRecommendations: string[];
  boosters: string[];
  history: PulseHistoryEntry[];
  computedAt: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface PulseContext {
  engagement: ReturnType<typeof analyzeEngagementSignals>;
  behavior: ReturnType<typeof analyzeBehaviorProfile>;
  patterns: BehaviorPatternsData;
  notifications: ReturnType<typeof getNotifications>;
  missions: ReturnType<typeof loadDailyMissions>;
  reflection: ReturnType<typeof loadWeeklyReflection>;
  sprint: ReturnType<typeof loadActionSprint>;
  sprintHistory: ReturnType<typeof loadSprintHistory>;
  journey: ReturnType<typeof loadJourneyMemory>;
  analytics: ReturnType<typeof getGrowthAnalytics>;
  workspace: ReturnType<typeof loadCareerWorkspace>;
}

function gatherContext(): PulseContext {
  const patterns = loadBehaviorPatterns() ?? computeBehaviorPatterns();

  const analytics = loadGrowthAnalytics() ?? getGrowthAnalytics();

  return {
    engagement: analyzeEngagementSignals(),
    behavior: analyzeBehaviorProfile(),
    patterns,
    notifications: getNotifications(),
    missions: loadDailyMissions(),
    reflection: loadWeeklyReflection(),
    sprint: loadActionSprint(),
    sprintHistory: loadSprintHistory(),
    journey: loadJourneyMemory(),
    analytics,
    workspace: loadCareerWorkspace(),
  };
}

// ============================================================================
// DIMENSION SCORING
// ============================================================================

function scoreEngagementEnergy(ctx: PulseContext): PulseDimension {
  const signals: string[] = [];
  let score = 50; // baseline

  // Session depth
  if (ctx.engagement.sessionDepth === "deep") {
    score += 20;
    signals.push("Deep session engagement");
  } else if (ctx.engagement.sessionDepth === "moderate") {
    score += 10;
    signals.push("Moderate session activity");
  } else {
    score -= 10;
    signals.push("Shallow session engagement");
  }

  // Event count
  if (ctx.engagement.eventCount >= 20) {
    score += 10;
  } else if (ctx.engagement.eventCount <= 5) {
    score -= 10;
    signals.push("Low event activity — possible fatigue");
  }

  // Behavior engagement level
  if (ctx.behavior.engagementLevel === "high") {
    score += 10;
  } else if (ctx.behavior.engagementLevel === "low") {
    score -= 10;
    signals.push("Low engagement level detected");
  }

  // Dropoff signal
  if (ctx.engagement.dropoffStage) {
    score -= 15;
    signals.push(`Dropoff at stage: ${ctx.engagement.dropoffStage}`);
  }

  score = Math.max(0, Math.min(100, score));

  const status: PulseDimension["status"] =
    score >= 70 ? "positive" : score >= 50 ? "neutral" : score >= 30 ? "caution" : "critical";

  return {
    name: "engagement_energy",
    label: "Engagement Energy",
    score,
    status,
    signals,
  };
}

function scoreMissionMomentum(ctx: PulseContext): PulseDimension {
  const signals: string[] = [];
  let score = 50;

  // Mission completion rate today
  if (ctx.missions) {
    const total = [
      ctx.missions.todayMission,
      ctx.missions.easyMission,
      ctx.missions.stretchMission,
      ...(ctx.missions.streakMission ? [ctx.missions.streakMission] : []),
    ].length;
    const completed = ctx.missions.completedMissionIds.length;
    const rate = total > 0 ? (completed / total) * 100 : 0;

    if (rate >= 75) {
      score += 20;
      signals.push("Strong mission completion today");
    } else if (rate >= 50) {
      score += 10;
      signals.push("Partial mission completion");
    } else if (rate === 0) {
      score -= 10;
      signals.push("No missions completed today");
    } else {
      score -= 5;
    }
  } else {
    score -= 10;
    signals.push("No active missions today");
  }

  // Sprint completion
  const completedCount = ctx.sprint.completedActionIds.length;
  const totalActions = ctx.sprint.todayActions.length;
  if (totalActions > 0) {
    const sprintRate = (completedCount / totalActions) * 100;
    if (sprintRate >= 70) {
      score += 15;
      signals.push("Strong sprint task completion");
    } else if (sprintRate <= 20) {
      score -= 10;
      signals.push("Low sprint task completion");
    }
  }

  // Sprint history trend (last 3)
  const recent = ctx.sprintHistory.slice(0, 3);
  if (recent.length >= 2) {
    const rates = recent.map((h) => h.completionRate);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    if (avg >= 60) {
      score += 10;
      signals.push("Consistent sprint history");
    } else if (avg <= 20) {
      score -= 10;
      signals.push("Declining sprint momentum");
    }
  }

  score = Math.max(0, Math.min(100, score));

  const status: PulseDimension["status"] =
    score >= 70 ? "positive" : score >= 50 ? "neutral" : score >= 30 ? "caution" : "critical";

  return {
    name: "mission_momentum",
    label: "Mission Momentum",
    score,
    status,
    signals,
  };
}

function scoreNotificationBurden(ctx: PulseContext): PulseDimension {
  const signals: string[] = [];
  const unread = ctx.notifications.filter((n) => !n.read).length;
  const total = ctx.notifications.length;

  // Invert: high burden = low score
  let score = 100;

  if (total === 0) {
    score = 80; // No notifications — clean but possibly disengaged
    signals.push("No active notifications");
  } else if (unread <= 2) {
    score = 80;
    signals.push("Low notification volume — manageable");
  } else if (unread <= 5) {
    score = 60;
    signals.push("Moderate unread notifications");
  } else if (unread <= 10) {
    score = 35;
    signals.push("High unread notification count — potential overwhelm");
  } else {
    score = 15;
    signals.push("Notification overload — >10 unread items");
  }

  // Check for urgent notifications
  const urgentCount = ctx.notifications.filter(
    (n) => !n.read && ("priority" in n ? (n as any).priority === "high" : false)
  ).length;
  if (urgentCount >= 3) {
    score -= 15;
    signals.push(`${urgentCount} urgent notifications pending`);
  }

  score = Math.max(0, Math.min(100, score));

  const status: PulseDimension["status"] =
    score >= 70 ? "positive" : score >= 50 ? "neutral" : score >= 30 ? "caution" : "critical";

  return {
    name: "notification_burden",
    label: "Notification Load",
    score,
    status,
    signals,
  };
}

function scoreConsistencyStreak(ctx: PulseContext): PulseDimension {
  const signals: string[] = [];
  const streak = ctx.workspace?.streak ?? 0;
  const weeklyEntries = ctx.workspace?.weeklyProgress.length ?? 0;
  let score = 50;

  // Streak
  if (streak >= 14) {
    score += 25;
    signals.push(`Impressive ${streak}-day streak`);
  } else if (streak >= 7) {
    score += 20;
    signals.push(`Consistent ${streak}-day streak`);
  } else if (streak >= 3) {
    score += 10;
    signals.push(`Building ${streak}-day streak`);
  } else if (streak >= 1) {
    score += 5;
  } else {
    score -= 15;
    signals.push("No active streak — missing daily engagement");
  }

  // Weekly entries
  if (weeklyEntries >= 5) {
    score += 10;
    signals.push("Strong weekly consistency");
  } else if (weeklyEntries <= 1) {
    score -= 10;
    signals.push("Minimal weekly activity");
  }

  // Reflection trend
  if (ctx.reflection) {
    if (ctx.reflection.streakTrend === "growing") {
      score += 10;
    } else if (ctx.reflection.streakTrend === "declining") {
      score -= 10;
      signals.push("Streak trend declining");
    }
  }

  score = Math.max(0, Math.min(100, score));

  const status: PulseDimension["status"] =
    score >= 70 ? "positive" : score >= 50 ? "neutral" : score >= 30 ? "caution" : "critical";

  return {
    name: "consistency_streak",
    label: "Consistency & Streak",
    score,
    status,
    signals,
  };
}

function scoreGrowthTrend(ctx: PulseContext): PulseDimension {
  const signals: string[] = [];
  let score = 50;

  // Confidence trend
  if (ctx.analytics.confidenceTrend > 5) {
    score += 20;
    signals.push(`Confidence rising (+${ctx.analytics.confidenceTrend}%)`);
  } else if (ctx.analytics.confidenceTrend > 0) {
    score += 10;
    signals.push("Confidence slightly improving");
  } else if (ctx.analytics.confidenceTrend < -5) {
    score -= 15;
    signals.push(`Confidence declining (${ctx.analytics.confidenceTrend}%)`);
  } else if (ctx.analytics.confidenceTrend < 0) {
    score -= 5;
  }

  // XP trend
  if (ctx.analytics.xpTrend >= 200) {
    score += 15;
    signals.push(`Strong XP momentum (+${ctx.analytics.xpTrend})`);
  } else if (ctx.analytics.xpTrend >= 50) {
    score += 5;
  } else if (ctx.analytics.xpTrend === 0) {
    score -= 5;
  }

  // Specialization
  if (ctx.analytics.specializationTrend === "deepening") {
    score += 10;
    signals.push("Specialization deepening — positive focus");
  } else if (ctx.analytics.specializationTrend === "broadening") {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  const status: PulseDimension["status"] =
    score >= 70 ? "positive" : score >= 50 ? "neutral" : score >= 30 ? "caution" : "critical";

  return {
    name: "growth_trend",
    label: "Growth Trend",
    score,
    status,
    signals,
  };
}

function scoreReflectionHealth(ctx: PulseContext): PulseDimension {
  const signals: string[] = [];
  let score = 50;

  if (!ctx.reflection) {
    score = 40;
    signals.push("No weekly reflection yet");
    return {
      name: "reflection_health",
      label: "Reflection Health",
      score,
      status: "neutral",
      signals,
    };
  }

  // Mission completion rate in reflection
  if (ctx.reflection.missionCompletionRate >= 70) {
    score += 20;
    signals.push("High weekly mission completion rate");
  } else if (ctx.reflection.missionCompletionRate >= 40) {
    score += 5;
  } else {
    score -= 15;
    signals.push("Low weekly completion rate");
  }

  // Streak trend
  if (ctx.reflection.streakTrend === "growing") {
    score += 15;
    signals.push("Streak growing week over week");
  } else if (ctx.reflection.streakTrend === "declining") {
    score -= 15;
    signals.push("Streak declining — possible disengagement");
  }

  // Wins vs slowdowns
  const winCount = ctx.reflection.wins.length;
  const slowCount = ctx.reflection.slowdowns.length;
  if (winCount >= 3 && slowCount <= 1) {
    score += 10;
    signals.push("Positive week with strong wins");
  } else if (slowCount >= winCount && slowCount >= 2) {
    score -= 10;
    signals.push("More slowdowns than wins this week");
  }

  score = Math.max(0, Math.min(100, score));

  const status: PulseDimension["status"] =
    score >= 70 ? "positive" : score >= 50 ? "neutral" : score >= 30 ? "caution" : "critical";

  return {
    name: "reflection_health",
    label: "Reflection Health",
    score,
    status,
    signals,
  };
}

// ============================================================================
// FATIGUE DETECTION
// ============================================================================

function detectFatigueSignals(ctx: PulseContext): FatigueSignal[] {
  const signals: FatigueSignal[] = [];

  // 1. Notification overload
  const unreadCount = ctx.notifications.filter((n) => !n.read).length;
  if (unreadCount > 10) {
    signals.push({
      type: "overload",
      severity: "high",
      detail: `${unreadCount} unread notifications — may be overwhelmed by information volume`,
    });
  } else if (unreadCount > 5) {
    signals.push({
      type: "overload",
      severity: "medium",
      detail: `${unreadCount} unread notifications — consider clearing to reduce cognitive load`,
    });
  }

  // 2. Burnout risk: high streak + declining engagement
  const streak = ctx.workspace?.streak ?? 0;
  if (streak >= 7 && ctx.engagement.sessionDepth === "light") {
    signals.push({
      type: "burnout_risk",
      severity: "high",
      detail: `${streak}-day streak with shallow sessions — risk of burnout from quantity over quality`,
    });
  } else if (streak >= 4 && ctx.engagement.eventCount <= 5) {
    signals.push({
      type: "burnout_risk",
      severity: "medium",
      detail: "Streak maintained but engagement dropping — watch for fatigue",
    });
  }

  // 3. Disengagement: low events, no missions, no reflection
  if (ctx.engagement.eventCount <= 3 && !ctx.missions) {
    signals.push({
      type: "disengagement",
      severity: "high",
      detail: "Very low activity — minimal engagement across all dimensions",
    });
  } else if (ctx.engagement.eventCount <= 8 && ctx.missions && ctx.missions.completedMissionIds.length === 0) {
    signals.push({
      type: "disengagement",
      severity: "medium",
      detail: "Below-average session activity with no mission completions",
    });
  }

  // 4. Inconsistency: low streak + minimal weekly progress
  if (streak === 0 && (ctx.workspace?.weeklyProgress.length ?? 0) <= 1) {
    signals.push({
      type: "inconsistency",
      severity: "high",
      detail: "No active streak and minimal weekly progress — consistency needs rebuilding",
    });
  } else if (ctx.reflection?.streakTrend === "declining") {
    signals.push({
      type: "inconsistency",
      severity: "medium",
      detail: "Streak declining week over week — attention needed to reverse trend",
    });
  }

  // 5. Overwhelm: high sprint volume + low completion
  const totalActions = ctx.sprint.todayActions.length;
  const completedActions = ctx.sprint.completedActionIds.length;
  if (totalActions >= 4 && completedActions <= 1) {
    signals.push({
      type: "overwhelm",
      severity: "high",
      detail: `${totalActions} tasks planned but only ${completedActions} completed — too much on plate`,
    });
  } else if (totalActions >= 3 && completedActions === 0) {
    signals.push({
      type: "overwhelm",
      severity: "medium",
      detail: "Sprint tasks not started — may be avoiding due to perceived difficulty",
    });
  }

  return signals;
}

// ============================================================================
// ENERGY FORECAST
// ============================================================================

function computeEnergyForecast(
  dimensions: PulseDimension[],
  fatigueSignals: FatigueSignal[]
): EnergyForecast {
  const avgScore = dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length;

  // Strong fatigue signals → declining
  const criticalSignals = fatigueSignals.filter((s) => s.severity === "high").length;
  if (criticalSignals >= 2) return "declining";

  // Low average with high fatigue → declining
  if (avgScore < 40 && fatigueSignals.length >= 2) return "declining";

  // Low average but improving growth trend → recovering
  const growthDim = dimensions.find((d) => d.name === "growth_trend");
  if (avgScore < 50 && growthDim && growthDim.score >= 60) return "recovering";

  // Moderate with positives → sustained
  if (avgScore >= 50 && fatigueSignals.length <= 1) return "sustained";

  // Default: sustained
  return "sustained";
}

// ============================================================================
// LOAD ASSESSMENT
// ============================================================================

function assessNotificationLoad(ctx: PulseContext): LoadLevel {
  const unread = ctx.notifications.filter((n) => !n.read).length;
  if (unread > 8) return "high";
  if (unread > 3) return "medium";
  return "low";
}

function assessMissionLoad(ctx: PulseContext): LoadLevel {
  if (!ctx.missions) return "low";

  const totalDiff = [
    ctx.missions.todayMission,
    ctx.missions.easyMission,
    ctx.missions.stretchMission,
    ...(ctx.missions.streakMission ? [ctx.missions.streakMission] : []),
  ].reduce((sum, m) => sum + m.estimatedMinutes, 0);

  if (totalDiff > 40) return "high";
  if (totalDiff > 20) return "medium";
  return "low";
}

// ============================================================================
// DIFFICULTY RECOMMENDATION
// ============================================================================

function computeRecommendedDifficulty(
  ctx: PulseContext,
  fatigueSignals: FatigueSignal[],
  pulseScore: number
): "easier" | "maintain" | "challenge" {
  const streak = ctx.workspace?.streak ?? 0;

  // Fatigue → easier
  if (fatigueSignals.some((s) => s.severity === "high")) return "easier";

  // Low streak → easier
  if (streak <= 1) return "easier";

  // High pulse + high streak → challenge
  if (pulseScore >= 70 && streak >= 5) return "challenge";

  // High pulse + good engagement → challenge
  if (pulseScore >= 65 && ctx.engagement.sessionDepth === "deep") return "challenge";

  // Default: maintain
  return "maintain";
}

// ============================================================================
// REST RECOMMENDATIONS
// ============================================================================

function computeRestRecommendations(
  fatigueSignals: FatigueSignal[],
  pulseScore: number
): string[] {
  const recs: string[] = [];

  if (fatigueSignals.some((s) => s.type === "overload" && s.severity === "high")) {
    recs.push("Clear unread notifications to reduce cognitive load");
  }

  if (fatigueSignals.some((s) => s.type === "burnout_risk")) {
    recs.push("Take a quality break — step away and return with fresh focus");
    recs.push("Focus on one small, satisfying task instead of multiple at once");
  }

  if (fatigueSignals.some((s) => s.type === "overwhelm")) {
    recs.push("Reduce today's sprint to 1-2 top-priority tasks");
    recs.push("Try a 5-minute easy mission to regain momentum without pressure");
  }

  if (fatigueSignals.some((s) => s.type === "disengagement")) {
    recs.push("Revisit a career you found interesting before — reconnect with your motivation");
    recs.push("Set a 2-minute timer for a single small action to break the inertia");
  }

  if (fatigueSignals.some((s) => s.type === "inconsistency")) {
    recs.push("Commit to just 3 minutes on a single easy task — rebuild the habit loop");
  }

  // General rest if score is low
  if (pulseScore < 35) {
    recs.push("Consider a full rest day — recovery enables better long-term consistency");
  }

  return recs.length > 0 ? recs : ["Your engagement looks healthy — maintain your current pace"];
}

// ============================================================================
// BOOSTERS
// ============================================================================

function computeBoosters(
  ctx: PulseContext,
  pulseScore: number,
  dimensions: PulseDimension[]
): string[] {
  const boosters: string[] = [];

  // Based on lowest dimension
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const lowest = sorted[0];

  if (lowest.name === "engagement_energy") {
    boosters.push("Try exploring a career in a new category to spark fresh interest");
    boosters.push("Take a quick quiz to re-engage with interactive content");
  }

  if (lowest.name === "mission_momentum") {
    boosters.push("Complete the easiest mission first — build momentum from a small win");
    boosters.push("Set a 5-minute timer and see how much you can accomplish");
  }

  if (lowest.name === "notification_burden") {
    boosters.push("Spend 2 minutes clearing notifications — a clean inbox reduces mental clutter");
  }

  if (lowest.name === "consistency_streak") {
    boosters.push("One small action today is all it takes to restart your streak");
    boosters.push("Schedule a recurring 5-minute daily slot for career work");
  }

  if (lowest.name === "growth_trend") {
    boosters.push("Review your confidence history to see how far you've come");
    boosters.push("Compare two careers — the process itself builds clarity and confidence");
  }

  if (lowest.name === "reflection_health") {
    boosters.push("Complete the weekly reflection — it helps solidify your progress awareness");
  }

  // General boosters for medium scores
  if (pulseScore >= 50 && pulseScore < 75) {
    boosters.push("You're in good shape — try one stretch goal today to push your momentum further");
  }

  if (pulseScore >= 75) {
    boosters.push("Excellent engagement! Channel this energy into a meaningful career exploration session");
  }

  return boosters.slice(0, 4);
}

// ============================================================================
// PERSISTENCE
// ============================================================================

function loadPulseHistory(): PulseHistoryEntry[] {
  const storage = getSafeStorage({ silent: true });
  const stored = storage.get<PulseHistoryEntry[]>(HISTORY_KEY);
  return Array.isArray(stored) ? stored : [];
}

function appendPulseHistory(entry: PulseHistoryEntry): PulseHistoryEntry[] {
  const history = loadPulseHistory();
  const today = entry.date.split("T")[0];

  // Dedupe by day
  const existingIdx = history.findIndex((h) => h.date.split("T")[0] === today);
  let updated: PulseHistoryEntry[];
  if (existingIdx !== -1) {
    updated = [...history];
    updated[existingIdx] = entry;
  } else {
    updated = [entry, ...history];
  }

  updated = updated.slice(0, MAX_HISTORY);

  const storage = getSafeStorage({ silent: true });
  storage.set(HISTORY_KEY, updated);
  return updated;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute a fresh engagement pulse reading from all data sources.
 */
export function computeEngagementPulse(): EngagementPulseData {
  const ctx = gatherContext();

  const dimensions = [
    scoreEngagementEnergy(ctx),
    scoreMissionMomentum(ctx),
    scoreNotificationBurden(ctx),
    scoreConsistencyStreak(ctx),
    scoreGrowthTrend(ctx),
    scoreReflectionHealth(ctx),
  ];

  const fatigueSignals = detectFatigueSignals(ctx);
  const pulseScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  );

  const energyForecast = computeEnergyForecast(dimensions, fatigueSignals);
  const notificationLoad = assessNotificationLoad(ctx);
  const missionLoad = assessMissionLoad(ctx);
  const recommendedDifficulty = computeRecommendedDifficulty(ctx, fatigueSignals, pulseScore);
  const restRecommendations = computeRestRecommendations(fatigueSignals, pulseScore);
  const boosters = computeBoosters(ctx, pulseScore, dimensions);

  const historyEntry: PulseHistoryEntry = {
    date: new Date().toISOString(),
    pulseScore,
    energyForecast,
  };
  const history = appendPulseHistory(historyEntry);

  const data: EngagementPulseData = {
    pulseScore,
    dimensions,
    energyForecast,
    fatigueSignals,
    notificationLoad,
    missionLoad,
    recommendedDifficulty,
    restRecommendations,
    boosters,
    history,
    computedAt: new Date().toISOString(),
  };

  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, data);

  return data;
}

/**
 * Load the most recently computed pulse reading.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadEngagementPulse(): EngagementPulseData | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<EngagementPulseData>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  // Attach latest history
  return {
    ...cached,
    history: loadPulseHistory(),
  };
}

/**
 * Get the current pulse, computing fresh if needed.
 */
export function getEngagementPulse(): EngagementPulseData {
  const existing = loadEngagementPulse();
  if (existing) return existing;
  return computeEngagementPulse();
}
