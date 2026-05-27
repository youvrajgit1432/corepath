/**
 * USER ANALYTICS INTELLIGENCE
 *
 * Measures actual behavior and engagement across CorePath.
 *
 * Tracked Events:
 *   quiz_started, quiz_completed, career_opened, career_saved,
 *   career_compared, workspace_created, mission_completed,
 *   notification_clicked, timeline_opened, panel_opened,
 *   command_center_opened, recommendation_viewed,
 *   session_duration, return_visit
 *
 * Computed Outputs:
 *   engagementScore, dropoffPoint, retentionSignals,
 *   mostUsedPanels, leastUsedPanels, featureUsageMap,
 *   sessionHeatmap, userJourneySummary
 *
 * Persists via SafeStorage. No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";

// ============================================================================
// TYPES
// ============================================================================

export type AnalyticsEventType =
  | "quiz_started"
  | "quiz_completed"
  | "career_opened"
  | "career_saved"
  | "career_compared"
  | "workspace_created"
  | "mission_completed"
  | "notification_clicked"
  | "timeline_opened"
  | "panel_opened"
  | "command_center_opened"
  | "recommendation_viewed"
  | "session_duration"
  | "return_visit";

export interface AnalyticsRecord {
  event: AnalyticsEventType;
  timestamp: number;
  /** Duration in ms (for session_duration) */
  duration?: number;
  /** Optional metadata (e.g. panel name, career id) */
  metadata?: Record<string, string>;
}

export interface DailySummary {
  date: string;
  events: Partial<Record<AnalyticsEventType, number>>;
  totalEvents: number;
  engagementScore: number; // 0–100
}

export interface FeatureUsageMap {
  quizzes: number;
  careers: number;
  comparisons: number;
  workspace: number;
  missions: number;
  notifications: number;
  timeline: number;
  panels: number;
  commandCenter: number;
  recommendations: number;
}

export interface SessionPattern {
  date: string;
  hour: number;
  events: number;
}

export interface UserAnalyticsData {
  records: AnalyticsRecord[];

  /** Computed from records */
  engagementScore: number; // 0–100
  dropoffPoint: string | null;
  retentionSignals: {
    returningUser: boolean;
    daysSinceLastVisit: number;
    totalSessions: number;
    sessionStreak: number;
    averageSessionEvents: number;
    daysActiveThisWeek: number;
  };
  mostUsedPanels: Array<{ panel: string; count: number }>;
  leastUsedPanels: Array<{ panel: string; count: number }>;
  featureUsageMap: FeatureUsageMap;
  sessionHeatmap: SessionPattern[];
  userJourneySummary: string[];
  dailySummaries: DailySummary[];

  lastComputed: string;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const RECORDS_KEY = "corepath-user-analytics-records";
const COMPUTED_KEY = "corepath-user-analytics-computed";
const MAX_RECORDS = 500;

// ============================================================================
// HELPERS
// ============================================================================

function getStorage() {
  return getSafeStorage({ silent: true });
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function todayHour(): number {
  return new Date().getHours();
}

function daysBetween(a: number, b: number): number {
  return Math.floor(Math.abs(a - b) / 86_400_000);
}

// ============================================================================
// EVENT LOGGING
// ============================================================================

function loadRecords(): AnalyticsRecord[] {
  const storage = getStorage();
  return storage.get<AnalyticsRecord[]>(RECORDS_KEY) ?? [];
}

function saveRecords(records: AnalyticsRecord[]): void {
  const trimmed = records.slice(-MAX_RECORDS);
  getStorage().set(RECORDS_KEY, trimmed);
}

/**
 * Log a single analytics event.
 * Use this from components to track user actions.
 */
export function logAnalyticsEvent(
  event: AnalyticsEventType,
  metadata?: Record<string, string>,
  duration?: number
): void {
  const records = loadRecords();
  records.push({
    event,
    timestamp: Date.now(),
    metadata,
    duration,
  });
  saveRecords(records);
}

/**
 * Convenience: log quiz started.
 */
export function logQuizStarted(): void {
  logAnalyticsEvent("quiz_started");
}

/**
 * Convenience: log quiz completed.
 */
export function logQuizCompleted(): void {
  logAnalyticsEvent("quiz_completed");
}

/**
 * Convenience: log career opened.
 */
export function logCareerOpened(careerId: string): void {
  logAnalyticsEvent("career_opened", { careerId });
}

/**
 * Convenience: log career saved/favorited.
 */
export function logCareerSaved(careerId: string): void {
  logAnalyticsEvent("career_saved", { careerId });
}

/**
 * Convenience: log career comparison.
 */
export function logCareerCompared(careerA: string, careerB: string): void {
  logAnalyticsEvent("career_compared", { careerA, careerB });
}

/**
 * Convenience: log workspace creation.
 */
export function logWorkspaceCreated(careerId: string): void {
  logAnalyticsEvent("workspace_created", { careerId });
}

/**
 * Convenience: log mission completion.
 */
export function logMissionCompleted(missionId: string): void {
  logAnalyticsEvent("mission_completed", { missionId });
}

/**
 * Convenience: log notification click.
 */
export function logNotificationClicked(notificationId: string): void {
  logAnalyticsEvent("notification_clicked", { notificationId });
}

/**
 * Convenience: log timeline open.
 */
export function logTimelineOpened(): void {
  logAnalyticsEvent("timeline_opened");
}

/**
 * Convenience: log panel open.
 */
export function logPanelOpened(panelName: string): void {
  logAnalyticsEvent("panel_opened", { panel: panelName });
}

/**
 * Convenience: log command center open.
 */
export function logCommandCenterOpened(): void {
  logAnalyticsEvent("command_center_opened");
}

/**
 * Convenience: log recommendation view.
 */
export function logRecommendationViewed(careerId?: string): void {
  logAnalyticsEvent("recommendation_viewed", careerId ? { careerId } : undefined);
}

/**
 * Convenience: log session duration.
 */
export function logSessionDuration(durationMs: number): void {
  logAnalyticsEvent("session_duration", undefined, durationMs);
}

/**
 * Convenience: log return visit (called once per session init).
 */
export function logReturnVisit(): void {
  logAnalyticsEvent("return_visit");
}

// ============================================================================
// ENGAGEMENT SCORE COMPUTATION
// ============================================================================

function computeEngagementScore(
  records: AnalyticsRecord[],
  todayEvents: number
): number {
  if (records.length === 0) return 0;

  let score = 10; // baseline for having any events

  // Variety bonus: +5 per unique event type (max +40)
  const uniqueTypes = new Set(records.map((r) => r.event)).size;
  score += Math.min(uniqueTypes * 5, 40);

  // Depth bonus: +10 if any event appears 3+ times
  const eventCounts: Record<string, number> = {};
  records.forEach((r) => {
    eventCounts[r.event] = (eventCounts[r.event] ?? 0) + 1;
  });
  if (Object.values(eventCounts).some((c) => c >= 3)) {
    score += 10;
  }

  // Recent activity bonus: +10 if events today
  if (todayEvents > 0) {
    score += 10;
  }
  if (todayEvents >= 3) {
    score += 10;
  }

  // Session depth bonus
  const sessionEvents = records.filter(
    (r) => daysBetween(Date.now(), r.timestamp) <= 1
  ).length;
  if (sessionEvents >= 5) score += 10;
  if (sessionEvents >= 10) score += 10;

  // Completion rate bonus: quiz_completed / quiz_started ratio
  const started = records.filter((r) => r.event === "quiz_started").length;
  const completed = records.filter((r) => r.event === "quiz_completed").length;
  if (started > 0 && completed / started >= 0.5) {
    score += 10;
  }

  // Cap at 100
  return Math.min(Math.round(score), 100);
}

// ============================================================================
// DROPOFF POINT DETECTION
// ============================================================================

/**
 * Analyze event sequences to find where users tend to drop off.
 * Looks for patterns like quiz_started without quiz_completed.
 */
function detectDropoffPoint(records: AnalyticsRecord[]): string | null {
  // Check for quiz started without completion
  const quizStarts = records.filter((r) => r.event === "quiz_started").length;
  const quizCompletes = records.filter((r) => r.event === "quiz_completed").length;
  if (quizStarts > 0 && quizCompletes === 0) {
    return "Quiz started but not completed";
  }
  if (quizStarts > quizCompletes * 2 && quizStarts >= 3) {
    return "Frequent quiz starts without completion";
  }

  // Check for career opened without saving
  const careersOpened = records.filter((r) => r.event === "career_opened").length;
  const careersSaved = records.filter((r) => r.event === "career_saved").length;
  if (careersOpened > 0 && careersSaved === 0) {
    return "Careers browsed but none saved";
  }
  if (careersOpened > careersSaved * 3 && careersOpened >= 5) {
    return "Frequent career browsing without saving";
  }

  // Check for recommendation viewed without action
  const recsViewed = records.filter((r) => r.event === "recommendation_viewed").length;
  const quizzesAfterRecs = records.filter(
    (r) => r.event === "quiz_started" || r.event === "career_opened"
  ).length;
  if (recsViewed > 0 && quizzesAfterRecs === 0) {
    return "Recommendations viewed but no follow-up action";
  }

  return null;
}

// ============================================================================
// RETENTION SIGNALS
// ============================================================================

function computeRetentionSignals(records: AnalyticsRecord[]) {
  if (records.length === 0) {
    return {
      returningUser: false,
      daysSinceLastVisit: 0,
      totalSessions: 0,
      sessionStreak: 0,
      averageSessionEvents: 0,
      daysActiveThisWeek: 0,
    };
  }

  // Parse unique session days
  const sessionDates = new Set(
    records.map((r) => new Date(r.timestamp).toISOString().split("T")[0])
  );
  const sortedDates = Array.from(sessionDates).sort();
  const totalSessions = sortedDates.length;

  // Last visit
  const lastDate = sortedDates[sortedDates.length - 1];
  const daysSinceLastVisit = daysBetween(Date.now(), new Date(lastDate).getTime());

  // Session streak (consecutive days ending today or yesterday)
  let streak = 0;
  const todayStr = today();
  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  let checkDate =
    sortedDates[sortedDates.length - 1] === todayStr ||
    sortedDates[sortedDates.length - 1] === yesterdayStr
      ? new Date(sortedDates[sortedDates.length - 1])
      : null;

  if (checkDate) {
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const expected = new Date(checkDate);
      const actual = new Date(sortedDates[i]);
      if (
        Math.abs(expected.getTime() - actual.getTime()) <= 86_400_000
      ) {
        streak++;
        checkDate = new Date(expected.getTime() - 86_400_000);
      } else {
        break;
      }
    }
  }

  // Average events per session day
  const eventsPerDay: Record<string, number> = {};
  records.forEach((r) => {
    const d = new Date(r.timestamp).toISOString().split("T")[0];
    eventsPerDay[d] = (eventsPerDay[d] ?? 0) + 1;
  });
  const avgEvents =
    Object.values(eventsPerDay).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(eventsPerDay).length);

  // Days active this week
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0];
  const daysActiveThisWeek = sortedDates.filter((d) => d >= weekAgo).length;

  return {
    returningUser: totalSessions > 1,
    daysSinceLastVisit,
    totalSessions,
    sessionStreak: streak,
    averageSessionEvents: Math.round(avgEvents * 10) / 10,
    daysActiveThisWeek,
  };
}

// ============================================================================
// FEATURE USAGE
// ============================================================================

function computeFeatureUsageMap(
  records: AnalyticsRecord[]
): FeatureUsageMap {
  const count = (event: AnalyticsEventType) =>
    records.filter((r) => r.event === event).length;

  return {
    quizzes: count("quiz_started") + count("quiz_completed"),
    careers: count("career_opened") + count("career_saved"),
    comparisons: count("career_compared"),
    workspace: count("workspace_created"),
    missions: count("mission_completed"),
    notifications: count("notification_clicked"),
    timeline: count("timeline_opened"),
    panels: count("panel_opened"),
    commandCenter: count("command_center_opened"),
    recommendations: count("recommendation_viewed"),
  };
}

function computePanelUsage(
  records: AnalyticsRecord[]
): Array<{ panel: string; count: number }> {
  const panelCounts: Record<string, number> = {};
  records
    .filter((r) => r.event === "panel_opened" && r.metadata?.panel)
    .forEach((r) => {
      const panel = r.metadata!.panel!;
      panelCounts[panel] = (panelCounts[panel] ?? 0) + 1;
    });

  return Object.entries(panelCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([panel, count]) => ({ panel, count }));
}

// ============================================================================
// SESSION HEATMAP
// ============================================================================

/**
 * Build hour-of-day event counts for the last 7 days.
 */
function computeSessionHeatmap(records: AnalyticsRecord[]): SessionPattern[] {
  const patterns: SessionPattern[] = [];
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86_400_000;

  const recent = records.filter((r) => r.timestamp >= sevenDaysAgo);

  // Group by date+hour
  const grouped: Record<string, number> = {};
  recent.forEach((r) => {
    const d = new Date(r.timestamp);
    const key = `${d.toISOString().split("T")[0]}_${d.getHours()}`;
    grouped[key] = (grouped[key] ?? 0) + 1;
  });

  // Fill in all date+hour combos for the past week
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * 86_400_000);
    const dateStr = date.toISOString().split("T")[0];
    for (let h = 0; h < 24; h++) {
      const key = `${dateStr}_${h}`;
      patterns.push({
        date: dateStr,
        hour: h,
        events: grouped[key] ?? 0,
      });
    }
  }

  return patterns;
}

// ============================================================================
// DAILY SUMMARIES
// ============================================================================

function computeDailySummaries(
  records: AnalyticsRecord[]
): DailySummary[] {
  const grouped: Record<string, Partial<Record<AnalyticsEventType, number>>> = {};
  const totalByDay: Record<string, number> = {};

  records.forEach((r) => {
    const d = new Date(r.timestamp).toISOString().split("T")[0];
    if (!grouped[d]) {
      grouped[d] = {};
      totalByDay[d] = 0;
    }
    grouped[d][r.event] = (grouped[d][r.event] ?? 0) + 1;
    totalByDay[d]++;
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, events]) => ({
      date,
      events,
      totalEvents: totalByDay[date] ?? 0,
      engagementScore: computeEngagementScore(
        records.filter(
          (r) =>
            new Date(r.timestamp).toISOString().split("T")[0] === date
        ),
        totalByDay[date] ?? 0
      ),
    }));
}

// ============================================================================
// JOURNEY SUMMARY NARRATIVE
// ============================================================================

function computeUserJourneySummary(
  featureUsage: FeatureUsageMap,
  retention: ReturnType<typeof computeRetentionSignals>,
  engagementScore: number,
  dropoffPoint: string | null
): string[] {
  const summary: string[] = [];

  // Engagement level
  if (engagementScore >= 70) {
    summary.push("High engagement — you're actively exploring and using CorePath's features.");
  } else if (engagementScore >= 40) {
    summary.push("Moderate engagement — consistent use with room for deeper exploration.");
  } else {
    summary.push("Getting started — build momentum by exploring careers and taking quizzes.");
  }

  // Feature usage insights
  const topFeatures = Object.entries(featureUsage)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0);

  if (topFeatures.length > 0) {
    const top = topFeatures[0];
    summary.push(`Most used feature: ${top[0]} (${top[1]} interactions).`);
  }

  if (retention.totalSessions > 1) {
    summary.push(`Returning across ${retention.totalSessions} sessions — strong retention signal.`);
  }

  if (retention.sessionStreak >= 3) {
    summary.push(`Active streak of ${retention.sessionStreak} days — consistent usage pattern.`);
  }

  if (dropoffPoint) {
    summary.push(`Detected friction: ${dropoffPoint}. Consider revisiting to complete actions.`);
  }

  if (featureUsage.quizzes > 0 && featureUsage.careers === 0) {
    summary.push("You've taken quizzes but haven't explored careers yet. Try browsing career matches.");
  }

  if (featureUsage.careers > 0 && featureUsage.workspace === 0) {
    summary.push("You've browsed careers — creating a workspace helps track your progress.");
  }

  if (featureUsage.recommendations > 0 && featureUsage.quizzes === 0) {
    summary.push("You've seen recommendations but haven't taken a quiz. Quizzes personalize your matches.");
  }

  return summary;
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full analytics state from stored records.
 */
export function computeUserAnalytics(): UserAnalyticsData {
  const records = loadRecords();
  const todayStr = today();

  const todayEvents = records.filter(
    (r) => new Date(r.timestamp).toISOString().split("T")[0] === todayStr
  ).length;

  const engagementScore = computeEngagementScore(records, todayEvents);
  const dropoffPoint = detectDropoffPoint(records);
  const retentionSignals = computeRetentionSignals(records);
  const featureUsageMap = computeFeatureUsageMap(records);
  const panelUsage = computePanelUsage(records);
  const sessionHeatmap = computeSessionHeatmap(records);
  const dailySummaries = computeDailySummaries(records);
  const userJourneySummary = computeUserJourneySummary(
    featureUsageMap,
    retentionSignals,
    engagementScore,
    dropoffPoint
  );

  // Most and least used panels (from panel_opened events)
  const mostUsedPanels = panelUsage.slice(0, 5);
  const leastUsedPanels = panelUsage.slice(-5).reverse();

  const data: UserAnalyticsData = {
    records: records.slice(-100), // keep last 100 in computed state
    engagementScore,
    dropoffPoint,
    retentionSignals,
    mostUsedPanels,
    leastUsedPanels,
    featureUsageMap,
    sessionHeatmap,
    userJourneySummary,
    dailySummaries,
    lastComputed: new Date().toISOString(),
  };

  // Persist computed state
  getStorage().set(COMPUTED_KEY, data);

  return data;
}

/**
 * Load previously computed analytics data.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadUserAnalytics(): UserAnalyticsData | null {
  const storage = getStorage();
  const cached = storage.get<UserAnalyticsData>(COMPUTED_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.lastComputed).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  return cached;
}

/**
 * Get current analytics, computing fresh if needed.
 */
export function getUserAnalytics(): UserAnalyticsData {
  const existing = loadUserAnalytics();
  if (existing) return existing;
  return computeUserAnalytics();
}

/**
 * Get all raw analytics records for detailed analysis.
 */
export function getAllAnalyticsRecords(): AnalyticsRecord[] {
  return loadRecords();
}

/**
 * Clear all analytics data.
 */
export function clearAnalyticsData(): void {
  const storage = getStorage();
  storage.remove(RECORDS_KEY);
  storage.remove(COMPUTED_KEY);
}
