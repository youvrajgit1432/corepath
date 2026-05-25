/**
 * GROWTH ANALYTICS INTELLIGENCE
 *
 * Visualizes how users evolve over time using time-series snapshots
 * and trend computation from existing data sources.
 *
 * Sources: journey-memory, achievements, career-progress, career-goals, weekly-reflection
 * Persists: progress snapshot history via SafeStorage (local storage)
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { loadAchievements, computeAchievements } from "./achievement-engine";
import { loadCareerProgress, computeCareerProgress } from "./career-progress";
import { loadCareerGoal } from "./career-goals";
import { loadWeeklyReflection } from "./weekly-reflection";

const STORAGE_KEY = "corepath-growth-analytics";
const SNAPSHOT_KEY = "corepath-growth-snapshots";
const MAX_SNAPSHOTS = 90;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/** A single point-in-time snapshot appended on each analytics computation */
export interface ProgressSnapshot {
  date: string;
  overallProgress: number;
  xp: number;
  confidence: number;
  specializationDepth: number;
  goalProgress: number | null;
}

/** Computed trend signals */
export interface GrowthAnalytics {
  /** Time-series of past snapshots (newest first, capped at 90) */
  progressHistory: ProgressSnapshot[];
  /** Confidence slope as a percentage change across recent quizzes */
  confidenceTrend: number;
  /** Direction of specialization over time */
  specializationTrend: "deepening" | "broadening" | "stable";
  /** XP accumulated in the last 30 days (approximate) */
  xpTrend: number;
  /** Goal progress % gained in the last 7 days (null if no goal) */
  goalVelocity: number | null;
  /** Detected shifts in career interests/themes over time */
  careerShiftSignals: string[];
  /** Last computed timestamp */
  computedAt: string;
}

/** Cached computed analytics */
interface CachedGrowthAnalytics {
  analytics: Omit<GrowthAnalytics, "progressHistory">;
  computedAt: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getStorage() {
  return getSafeStorage({ silent: true });
}

/** Load persisted snapshot history, newest first */
function loadSnapshots(): ProgressSnapshot[] {
  const storage = getStorage();
  const stored = storage.get<ProgressSnapshot[]>(SNAPSHOT_KEY);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  return [];
}

/** Append a new snapshot to history, cap at MAX_SNAPSHOTS, keep newest */
function appendSnapshot(snapshot: ProgressSnapshot): ProgressSnapshot[] {
  const history = loadSnapshots();

  // Dedupe by day: if a snapshot from today already exists, update it
  const todayStr = snapshot.date.split("T")[0];
  const existingIdx = history.findIndex(
    (s) => s.date.split("T")[0] === todayStr
  );

  let updated: ProgressSnapshot[];
  if (existingIdx !== -1) {
    updated = [...history];
    updated[existingIdx] = snapshot;
  } else {
    updated = [snapshot, ...history];
  }

  // Cap at MAX_SNAPSHOTS
  updated = updated.slice(0, MAX_SNAPSHOTS);

  const storage = getStorage();
  storage.set(SNAPSHOT_KEY, updated);
  return updated;
}

// ============================================================================
// TREND COMPUTATION
// ============================================================================

/**
 * Compute confidence trend: linear slope over last 5 quiz results.
 * Returns a percentage change value (e.g., 8.5 means +8.5% over the period).
 */
function computeConfidenceTrend(memory: ReturnType<typeof loadJourneyMemory>): number {
  const history = memory.confidenceHistory;
  if (history.length < 2) return 0;

  // Use last 5 entries (or all if fewer)
  const recent = history.slice(-5);
  const n = recent.length;
  if (n < 2) return 0;

  // Simple linear regression: slope = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
  const indices = Array.from({ length: n }, (_, i) => i);
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = recent.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((acc, x, i) => acc + x * recent[i], 0);
  const sumX2 = indices.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return Math.round(slope * 10) / 10;
}

/**
 * Compute specialization trend direction.
 * Compares average of first half vs second half of available history.
 */
function computeSpecializationTrend(
  memory: ReturnType<typeof loadJourneyMemory>
): GrowthAnalytics["specializationTrend"] {
  const history = memory.specializationDepthHistory;
  if (history.length < 3) return "stable";

  const midpoint = Math.floor(history.length / 2);
  const firstHalf = history.slice(0, midpoint);
  const secondHalf = history.slice(midpoint);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  if (diff > 0.05) return "deepening";
  if (diff < -0.05) return "broadening";
  return "stable";
}

/**
 * Estimate XP gained in the last 30 days by comparing snapshots.
 */
function computeXpTrend(snapshots: ProgressSnapshot[], currentXp: number): number {
  if (snapshots.length < 2) return currentXp > 0 ? currentXp : 0;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const oldSnapshot = [...snapshots]
    .reverse()
    .find((s) => new Date(s.date).getTime() <= thirtyDaysAgo);

  if (oldSnapshot) {
    return Math.max(0, currentXp - oldSnapshot.xp);
  }

  // Fallback: use the oldest snapshot
  const oldest = snapshots[snapshots.length - 1];
  return Math.max(0, currentXp - oldest.xp);
}

/**
 * Compute goal velocity: how much goalProgress changed in last 7 days.
 */
function computeGoalVelocity(snapshots: ProgressSnapshot[]): number | null {
  if (snapshots.length < 2) return null;

  const latest = snapshots[0];
  if (latest.goalProgress === null) return null;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekAgo = [...snapshots].find(
    (s) => new Date(s.date).getTime() <= sevenDaysAgo && s.goalProgress !== null
  );

  if (weekAgo && weekAgo.goalProgress !== null) {
    return Math.max(0, Math.round((latest.goalProgress - weekAgo.goalProgress) * 10) / 10);
  }

  // Not enough data — use earliest available
  const earliest = [...snapshots]
    .filter((s) => s.goalProgress !== null)
    .pop();
  if (earliest && earliest.goalProgress !== null && latest.goalProgress !== null) {
    const diff = latest.goalProgress - earliest.goalProgress;
    return Math.max(0, Math.round(diff * 10) / 10);
  }

  return null;
}

/**
 * Detect career interest shifts by comparing recent vs older
 * theme preferences and category exploration patterns.
 */
function computeCareerShiftSignals(
  memory: ReturnType<typeof loadJourneyMemory>
): string[] {
  const signals: string[] = [];

  // Theme dominance shifts: compare top themes vs overall pattern
  const themeEntries = Object.entries(memory.repeatedThemes)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (themeEntries.length >= 2) {
    const topTheme = themeEntries[0][0];
    const secondTheme = themeEntries[1][0];

    // If top two are close, signal balanced exploration
    const ratio = themeEntries[1][1] / Math.max(1, themeEntries[0][1]);
    if (ratio > 0.8 && themeEntries[0][1] >= 3) {
      signals.push(
        `Balanced interest between ${topTheme} and ${secondTheme} — consider which aligns with your long-term goals`
      );
    }

    // If one theme strongly dominates
    if (themeEntries[0][1] >= themeEntries[1][1] * 3 && themeEntries[0][1] >= 5) {
      signals.push(
        `Strong ${topTheme} focus detected — your exploration consistently centers on this theme`
      );
    }
  }

  // Category evolution: check if user is viewing new categories beyond their favorites
  const viewedCount = Object.keys(memory.viewedCareers).length;
  const favoriteCount = Object.keys(memory.favoriteCategories).length;

  if (viewedCount >= 5 && favoriteCount <= 2) {
    signals.push(
      "Narrow category focus — you tend to revisit the same career areas. Consider exploring adjacent fields for broader perspective."
    );
  } else if (viewedCount >= 10 && favoriteCount >= 4) {
    signals.push(
      "Broad exploration pattern — you're sampling multiple career categories. Your preferences may clarify as you explore further."
    );
  }

  // Career shift detection via comparison patterns
  const comparisonCount = Object.keys(memory.comparedCareerPairs).length;
  if (comparisonCount >= 3) {
    signals.push(
      "Active comparison behavior — cross-referencing careers helps identify what matters most to you."
    );
  }

  // Interest expansion signal
  const recentViews = memory.viewedCareerHistory.slice(-5);
  const recentCategories = new Set(recentViews.map((v) => v.careerId));
  const totalViewed = new Set(memory.viewedCareerHistory.map((v) => v.careerId));
  const newCategories = [...recentCategories].filter(
    (cat) => Array.from(totalViewed).filter((v) => v === cat).length <= 2
  );

  if (newCategories.length >= 2) {
    signals.push(
      "Recent exploration includes new career areas — your interests may be expanding beyond initial preferences."
    );
  }

  return signals.slice(0, 3);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute full growth analytics from current data sources.
 * Appends a new snapshot to history for trend tracking.
 */
export function computeGrowthAnalytics(): GrowthAnalytics {
  const memory = loadJourneyMemory();
  const achievements = loadAchievements() ?? computeAchievements();
  const progress = loadCareerProgress() ?? computeCareerProgress();
  const goal = loadCareerGoal();

  // ── Build new snapshot ──
  const currentConfidence =
    memory.confidenceHistory.length > 0
      ? memory.confidenceHistory[memory.confidenceHistory.length - 1]
      : 0;
  const currentSpecialization =
    memory.specializationDepthHistory.length > 0
      ? memory.specializationDepthHistory[memory.specializationDepthHistory.length - 1]
      : 0;

  const snapshot: ProgressSnapshot = {
    date: new Date().toISOString(),
    overallProgress: progress.overallProgressScore,
    xp: achievements.xp,
    confidence: currentConfidence,
    specializationDepth: currentSpecialization,
    goalProgress: goal?.goalProgress ?? null,
  };

  const history = appendSnapshot(snapshot);

  // ── Compute trend signals ──
  const confidenceTrend = computeConfidenceTrend(memory);
  const specializationTrend = computeSpecializationTrend(memory);
  const xpTrend = computeXpTrend(history, achievements.xp);
  const goalVelocity = computeGoalVelocity(history);
  const careerShiftSignals = computeCareerShiftSignals(memory);

  const analytics: GrowthAnalytics = {
    progressHistory: history,
    confidenceTrend,
    specializationTrend,
    xpTrend,
    goalVelocity,
    careerShiftSignals,
    computedAt: new Date().toISOString(),
  };

  // Cache computed signals (without full history) for faster subsequent loads
  const cache: CachedGrowthAnalytics = {
    analytics: {
      confidenceTrend,
      specializationTrend,
      xpTrend,
      goalVelocity,
      careerShiftSignals,
      computedAt: analytics.computedAt,
    },
    computedAt: analytics.computedAt,
  };

  const storage = getStorage();
  storage.set(STORAGE_KEY, cache);

  return analytics;
}

/**
 * Load previously computed growth analytics from cache.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadGrowthAnalytics(): GrowthAnalytics | null {
  const storage = getStorage();
  const cached = storage.get<CachedGrowthAnalytics>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  const history = loadSnapshots();

  return {
    progressHistory: history,
    ...cached.analytics,
    computedAt: cached.computedAt,
  };
}

/**
 * Get growth analytics, computing fresh if needed.
 */
export function getGrowthAnalytics(): GrowthAnalytics {
  const existing = loadGrowthAnalytics();
  if (existing) return existing;
  return computeGrowthAnalytics();
}

/**
 * Format confidence trend as a readable label.
 */
export function formatConfidenceTrend(trend: number): string {
  if (trend > 2) return `Rising (+${trend}%)`;
  if (trend > 0) return `Slight uptick (+${trend}%)`;
  if (trend < -2) return `Declining (${trend}%)`;
  if (trend < 0) return `Slight dip (${trend}%)`;
  return "Steady";
}

/**
 * Format specialization trend as a readable label.
 */
export function formatSpecializationTrend(
  trend: GrowthAnalytics["specializationTrend"]
): string {
  switch (trend) {
    case "deepening":
      return "Deepening specialization";
    case "broadening":
      return "Broadening exploration";
    case "stable":
      return "Stable range";
  }
}

/**
 * Format XP trend as a readable string.
 */
export function formatXpTrend(xp: number): string {
  return `+${xp} XP in last 30 days`;
}

/**
 * Format goal velocity as a readable string.
 */
export function formatGoalVelocity(velocity: number | null): string | null {
  if (velocity === null) return null;
  if (velocity > 0) return `+${velocity}% this week`;
  if (velocity === 0) return "No progress this week";
  return `${velocity}% this week`;
}

/**
 * Generate an overall insights summary from analytics data.
 */
export function generateGrowthInsights(analytics: GrowthAnalytics): string[] {
  const insights: string[] = [];

  // Confidence insight
  if (analytics.confidenceTrend > 5) {
    insights.push(
      `Your career confidence is rising steadily (+${analytics.confidenceTrend}%) — you're getting clearer on your fit.`
    );
  } else if (analytics.confidenceTrend < -5) {
    insights.push(
      `Your confidence has dipped (${analytics.confidenceTrend}%) — this is normal when exploring new territory.`
    );
  } else if (analytics.confidenceTrend > 0) {
    insights.push(
      `Confidence is trending upward — your self-assessment is becoming more refined.`
    );
  } else {
    insights.push(
      `Confidence is stable — you're in a consistent exploration phase.`
    );
  }

  // Specialization insight
  if (analytics.specializationTrend === "deepening") {
    insights.push(
      "You're developing deeper expertise in specific areas — a strong signal for career direction."
    );
  } else if (analytics.specializationTrend === "broadening") {
    insights.push(
      "You're keeping your options open with broad exploration — ideal for discovering unexpected fits."
    );
  } else {
    insights.push(
      "Your specialization range is holding steady — a balanced approach to career discovery."
    );
  }

  // XP momentum insight
  if (analytics.xpTrend >= 200) {
    insights.push(
      `Strong momentum! You've gained ${analytics.xpTrend} XP recently — your engagement is compounding.`
    );
  } else if (analytics.xpTrend >= 50) {
    insights.push(
      `You've earned ${analytics.xpTrend} XP recently — consistent progress builds career intelligence.`
    );
  }

  // Goal velocity insight
  if (analytics.goalVelocity !== null && analytics.goalVelocity > 0) {
    insights.push(
      `You're making measurable progress toward your goal at +${analytics.goalVelocity}% this week.`
    );
  } else if (analytics.goalVelocity !== null && analytics.goalVelocity === 0) {
    insights.push(
      `Goal progress has paused — consider a focused session to regain momentum.`
    );
  }

  // Career shift signal
  if (analytics.careerShiftSignals.length > 0) {
    insights.push(analytics.careerShiftSignals[0]);
  }

  return insights.slice(0, 4);
}
