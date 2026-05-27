/**
 * ADMIN INTELLIGENCE DASHBOARD
 *
 * Gives operators complete visibility into platform behavior.
 *
 * Consumes:
 *   user-analytics, feedback-intelligence, recommendation-optimizer,
 *   experiment-engine, journey-memory, career-history
 *
 * Generated:
 *   totalUsersEstimate, activeUsers, topCareers, dropoffFunnels,
 *   panelUsage, experimentWinners, retentionHealth, recommendationHealth,
 *   systemAlerts, businessNarrative
 *
 * Persists via SafeStorage. No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { getUserAnalytics } from "./user-analytics";
import { getFeedbackIntelligence } from "./feedback-intelligence";
import { getRecommendationOptimizer } from "./recommendation-optimizer";
import { getExperimentEngine } from "./experiment-engine";
import { loadJourneyMemory } from "./journey-memory";
import { getCareerById } from "./careers";

// ============================================================================
// TYPES
// ============================================================================

export interface DropoffFunnelStage {
  stage: string;
  users: number;
  dropoffRate: number; // 0–100
  description: string;
}

export interface PanelUsageSummary {
  panel: string;
  count: number;
  percentage: number; // 0–100
}

export interface ExperimentWinner {
  experimentId: string;
  experimentName: string;
  winnerVariant: "A" | "B";
  winningLabel: string;
  confidenceLevel: number;
  metric: string;
  improvementPct: number;
}

export interface RetentionHealthIndicators {
  overallRetention: number; // 0–100
  dailyEngagement: number;
  weeklyActiveDays: number;
  sessionStreak: number;
  returnRate: number;
  churnRisk: "low" | "moderate" | "elevated" | "high";
  insights: string[];
}

export interface RecommendationHealth {
  qualityScore: number; // 0–100
  trustScore: number; // 0–100
  feedbackScore: number; // 0–100
  explorationBias: string;
  specializationDomains: number;
  adjustedCareers: number;
  insights: string[];
}

export interface SystemAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: number;
  actionLabel?: string;
  actionHref?: string;
}

export interface BusinessNarrativeLine {
  icon: string;
  text: string;
}

export interface AdminIntelligenceData {
  /** Simulated total user estimate (single-user system) */
  totalUsersEstimate: number;
  /** Simulated active users in last 7 days */
  activeUsers: number;
  /** Top careers by engagement (views + saves + comparisons) */
  topCareers: Array<{ id: string; title: string; icon: string; engagement: number; category: string }>;
  /** Dropoff funnel stages with rates */
  dropoffFunnels: DropoffFunnelStage[];
  /** Panel usage ranked by open count */
  panelUsage: PanelUsageSummary[];
  /** Experiments with clear winners */
  experimentWinners: ExperimentWinner[];
  /** Retention health assessment */
  retentionHealth: RetentionHealthIndicators;
  /** Recommendation system health */
  recommendationHealth: RecommendationHealth;
  /** System alert cards */
  systemAlerts: SystemAlert[];
  /** Business narrative insights */
  businessNarrative: BusinessNarrativeLine[];
  lastComputed: string;
}

// ============================================================================
// STORAGE
// ============================================================================

const COMPUTED_KEY = "corepath-admin-intelligence-computed";

function getStorage() {
  return getSafeStorage({ silent: true });
}

// ============================================================================
// COMPUTATION HELPERS
// ============================================================================

function computeTotalUsersEstimate(): number {
  // Single-user system
  return 1;
}

function computeActiveUsers(): number {
  // Simulate active users as a multiple of the user's engagement
  const analytics = getUserAnalytics();
  const { retentionSignals } = analytics;
  const sessions = retentionSignals.totalSessions;
  if (sessions === 0) return 0;
  // Generate a plausible active-user count based on session activity
  const simulated = Math.max(1, Math.round(sessions * 0.3 + 2));
  return simulated;
}

function computeTopCareers(): AdminIntelligenceData["topCareers"] {
  const journey = loadJourneyMemory();
  const analytics = getUserAnalytics();

  // Aggregate engagement scores per career from journey memory
  const engagementMap = new Map<string, number>();

  // View counts
  for (const [careerId, count] of Object.entries(journey.viewedCareers ?? {})) {
    engagementMap.set(careerId, (engagementMap.get(careerId) ?? 0) + count * 2);
  }

  // Comparison appearances
  for (const pair of journey.comparisonHistory ?? []) {
    engagementMap.set(pair.careerA, (engagementMap.get(pair.careerA) ?? 0) + 3);
    engagementMap.set(pair.careerB, (engagementMap.get(pair.careerB) ?? 0) + 3);
  }

  // Saved careers from feedback
  const feedback = getFeedbackIntelligence();
  for (const affinity of feedback.careerAffinities) {
    if (affinity.saved) {
      engagementMap.set(affinity.careerId, (engagementMap.get(affinity.careerId) ?? 0) + 5);
    }
  }

  // Career-opened events from analytics
  const openedCareers = new Map<string, number>();
  for (const record of analytics.records) {
    if (record.event === "career_opened" && record.metadata?.careerId) {
      const id = record.metadata.careerId;
      openedCareers.set(id, (openedCareers.get(id) ?? 0) + 1);
    }
  }
  for (const [careerId, count] of openedCareers) {
    engagementMap.set(careerId, (engagementMap.get(careerId) ?? 0) + count * 2);
  }

  // Sort and return top 8
  return Array.from(engagementMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([id, engagement]) => {
      const career = getCareerById(id);
      return {
        id,
        title: career?.title ?? id,
        icon: career?.icon ?? "💼",
        engagement,
        category: career?.category ?? "General",
      };
    });
}

function computeDropoffFunnels(): DropoffFunnelStage[] {
  const analytics = getUserAnalytics();
  const records = analytics.records;

  // Compute sequential dropoff stages
  const funnel: DropoffFunnelStage[] = [];

  // Stage 1: Quiz Start → Quiz Complete
  const quizStarted = records.filter((r) => r.event === "quiz_started").length;
  const quizCompleted = records.filter((r) => r.event === "quiz_completed").length;
  if (quizStarted > 0) {
    const dropoff = Math.round((1 - quizCompleted / Math.max(quizStarted, 1)) * 100);
    funnel.push({
      stage: "Quiz Started → Completed",
      users: Math.max(quizStarted, 1),
      dropoffRate: dropoff,
      description: `${quizStarted} quiz${quizStarted !== 1 ? "zes" : ""} started, ${quizCompleted} completed`,
    });
  }

  // Stage 2: Career Open → Save
  const careersOpened = records.filter((r) => r.event === "career_opened").length;
  const careersSaved = records.filter((r) => r.event === "career_saved").length;
  if (careersOpened > 0) {
    const dropoff = Math.round((1 - careersSaved / Math.max(careersOpened, 1)) * 100);
    funnel.push({
      stage: "Career Opened → Saved",
      users: Math.max(careersOpened, 1),
      dropoffRate: dropoff,
      description: `${careersOpened} career${careersOpened !== 1 ? "s" : ""} opened, ${careersSaved} saved`,
    });
  }

  // Stage 3: Recommendation View → Action
  const recsViewed = records.filter((r) => r.event === "recommendation_viewed").length;
  const quizOrCareerAfter = records.filter(
    (r) => r.event === "quiz_started" || r.event === "career_opened"
  ).length;
  if (recsViewed > 0) {
    const dropoff = Math.round((1 - quizOrCareerAfter / Math.max(recsViewed, 1)) * 100);
    funnel.push({
      stage: "Recommendation Viewed → Action",
      users: Math.max(recsViewed, 1),
      dropoffRate: dropoff,
      description: `${recsViewed} recommendation${recsViewed !== 1 ? "s" : ""} viewed, ${quizOrCareerAfter} follow-up actions`,
    });
  }

  // Stage 4: Session Start → Return
  const sessions = analytics.retentionSignals.totalSessions;
  const returning = analytics.retentionSignals.returningUser ? 1 : 0;
  if (sessions > 0) {
    const dropoff = Math.round((1 - returning / Math.max(sessions, 1)) * 100);
    funnel.push({
      stage: "First Session → Return Visit",
      users: Math.max(sessions, 1),
      dropoffRate: dropoff,
      description: `${sessions} session${sessions !== 1 ? "s" : ""}, ${returning ? "returning" : "first visit only"}`,
    });
  }

  // Stage 5: Mission Started → Completed
  const missionsCompleted = records.filter((r) => r.event === "mission_completed").length;
  // Estimate total missions (commands center opens as proxy)
  const commandOpens = records.filter((r) => r.event === "command_center_opened").length;
  const totalMissions = Math.max(commandOpens, missionsCompleted);
  if (totalMissions > 0) {
    const dropoff = Math.round((1 - missionsCompleted / Math.max(totalMissions, 1)) * 100);
    funnel.push({
      stage: "Mission Available → Completed",
      users: Math.max(totalMissions, 1),
      dropoffRate: dropoff,
      description: `${totalMissions} mission${totalMissions !== 1 ? "s" : ""} available, ${missionsCompleted} completed`,
    });
  }

  if (funnel.length === 0) {
    funnel.push({
      stage: "Getting Started",
      users: 1,
      dropoffRate: 100,
      description: "No activity recorded yet. Start by taking the career quiz.",
    });
  }

  return funnel;
}

function computePanelUsage(): PanelUsageSummary[] {
  const analytics = getUserAnalytics();
  const panelCounts = new Map<string, number>();

  for (const record of analytics.records) {
    if (record.event === "panel_opened" && record.metadata?.panel) {
      const panel = record.metadata.panel;
      panelCounts.set(panel, (panelCounts.get(panel) ?? 0) + 1);
    }
  }

  // Also include feature usage map entries as panels
  const featureMap = analytics.featureUsageMap;
  const featurePanelMap: Record<string, string> = {
    quizzes: "Quiz System",
    careers: "Career Browser",
    comparisons: "Comparison Tool",
    workspace: "Workspace",
    missions: "Mission System",
    notifications: "Notification Center",
    timeline: "Timeline",
    panels: "Intelligence Panels",
    commandCenter: "Command Center",
    recommendations: "Recommendations",
  };

  for (const [key, label] of Object.entries(featurePanelMap)) {
    const count = featureMap[key as keyof typeof featureMap] ?? 0;
    if (count > 0) {
      panelCounts.set(label, (panelCounts.get(label) ?? 0) + count);
    }
  }

  const total = Math.max(Array.from(panelCounts.values()).reduce((a, b) => a + b, 0), 1);

  return Array.from(panelCounts.entries())
    .map(([panel, count]) => ({
      panel,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function computeExperimentWinners(): ExperimentWinner[] {
  const engine = getExperimentEngine();

  return engine.activeExperiments
    .filter((e) => e.winnerPrediction !== "none")
    .map((e) => {
      const winnerPerf = e.performance.find(
        (p) => p.variant === e.winnerPrediction
      );
      const loserPerf = e.performance.find(
        (p) => p.variant !== e.winnerPrediction
      );
      const winnerLabel =
        e.winnerPrediction === "A" ? e.variantA : e.variantB;
      const improvementPct = loserPerf && winnerPerf && loserPerf.metricValue > 0
        ? Math.round(
            ((winnerPerf.metricValue - loserPerf.metricValue) /
              loserPerf.metricValue) *
              100
          )
        : 0;

      return {
        experimentId: e.id,
        experimentName: e.name,
        winnerVariant: e.winnerPrediction as "A" | "B",
        winningLabel: winnerLabel,
        confidenceLevel: e.confidenceLevel,
        metric: e.successMetric.replace(/_/g, " "),
        improvementPct,
      };
    });
}

function computeRetentionHealth(): RetentionHealthIndicators {
  const analytics = getUserAnalytics();
  const { retentionSignals, engagementScore } = analytics;

  // Overall retention: blend of engagement, streak, return rate, days active
  const returnScore = retentionSignals.returningUser ? 30 : 0;
  const streakScore = Math.min(retentionSignals.sessionStreak * 10, 30);
  const daysActiveScore = Math.min(retentionSignals.daysActiveThisWeek * 10, 20);
  const engagementContribution = Math.round(engagementScore * 0.2);
  const overallRetention = Math.min(
    returnScore + streakScore + daysActiveScore + engagementContribution,
    100
  );

  const avgEvents = retentionSignals.averageSessionEvents;
  const dailyEngagement = Math.min(Math.round((avgEvents / 10) * 100), 100);

  // Churn risk assessment
  let churnRisk: RetentionHealthIndicators["churnRisk"] = "low";
  if (overallRetention < 20 && retentionSignals.daysSinceLastVisit > 7) {
    churnRisk = "high";
  } else if (overallRetention < 40) {
    churnRisk = "elevated";
  } else if (overallRetention < 60) {
    churnRisk = "moderate";
  }

  // Insights
  const insights: string[] = [];
  if (retentionSignals.sessionStreak >= 5) {
    insights.push(`Strong ${retentionSignals.sessionStreak}-day streak — excellent consistency.`);
  } else if (retentionSignals.sessionStreak >= 2) {
    insights.push(`Building a ${retentionSignals.sessionStreak}-day streak — keep it going.`);
  } else {
    insights.push("No active streak — scheduling regular sessions builds momentum.");
  }

  if (retentionSignals.daysActiveThisWeek >= 4) {
    insights.push(`Active ${retentionSignals.daysActiveThisWeek} days this week — high engagement pattern.`);
  } else if (retentionSignals.daysActiveThisWeek > 0) {
    insights.push(`Active ${retentionSignals.daysActiveThisWeek} day${retentionSignals.daysActiveThisWeek > 1 ? "s" : ""} this week.`);
  } else {
    insights.push("No activity this week — consider re-engagement strategies.");
  }

  if (retentionSignals.returningUser) {
    insights.push(`Returning user with ${retentionSignals.totalSessions} total sessions.`);
  }

  if (analytics.dropoffPoint) {
    insights.push(`Dropoff detected: ${analytics.dropoffPoint}.`);
  }

  return {
    overallRetention,
    dailyEngagement,
    weeklyActiveDays: retentionSignals.daysActiveThisWeek,
    sessionStreak: retentionSignals.sessionStreak,
    returnRate: retentionSignals.returningUser ? Math.round((retentionSignals.totalSessions / Math.max(retentionSignals.totalSessions, 2)) * 100) : 0,
    churnRisk,
    insights,
  };
}

function computeRecommendationHealth(): RecommendationHealth {
  const optimizer = getRecommendationOptimizer();
  const feedback = getFeedbackIntelligence();

  const domainCount = optimizer.specializationStrength.length;

  const insights: string[] = [];

  if (optimizer.recommendationQualityScore >= 70) {
    insights.push("Recommendation quality is strong — the system has robust personalization data.");
  } else if (optimizer.recommendationQualityScore >= 40) {
    insights.push("Recommendation quality is developing — more engagement improves accuracy.");
  } else {
    insights.push("Recommendation quality is low — encourage quiz completion and career exploration.");
  }

  if (feedback.recommendationTrust >= 70) {
    insights.push(`High trust (${feedback.recommendationTrust}/100) — user confidence in suggestions.`);
  } else if (feedback.recommendationTrust < 40) {
    insights.push(`Low trust (${feedback.recommendationTrust}/100) — may indicate recommendation mismatch.`);
  }

  if (optimizer.explorationBias.type === "specialize") {
    insights.push("Exploration bias favors specialization — narrowing recommendations to focused domains.");
  } else if (optimizer.explorationBias.type === "diversify") {
    insights.push("Exploration bias favors diversification — broadening recommendations.");
  } else {
    insights.push("Exploration bias is balanced — maintaining mixed recommendation strategy.");
  }

  const adjustedCount = optimizer.adaptiveRecommendationWeights.length;
  if (adjustedCount > 0) {
    insights.push(`${adjustedCount} career${adjustedCount > 1 ? "s" : ""} with adjusted recommendation weights.`);
  }

  return {
    qualityScore: optimizer.recommendationQualityScore,
    trustScore: feedback.recommendationTrust,
    feedbackScore: feedback.feedbackScore,
    explorationBias: optimizer.explorationBias.type,
    specializationDomains: domainCount,
    adjustedCareers: adjustedCount,
    insights,
  };
}

function computeSystemAlerts(
  retention: RetentionHealthIndicators,
  recommendation: RecommendationHealth,
  analytics: ReturnType<typeof getUserAnalytics>,
  experiments: ExperimentWinner[]
): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  let id = 0;

  // Critical alerts
  if (retention.churnRisk === "high") {
    alerts.push({
      id: `alert-${++id}`,
      severity: "critical",
      title: "High churn risk detected",
      description: `User has been inactive for ${analytics.retentionSignals.daysSinceLastVisit} days. Re-engagement campaign recommended.`,
      timestamp: Date.now(),
      actionLabel: "View retention",
      actionHref: "/admin",
    });
  }

  if (recommendation.qualityScore < 30) {
    alerts.push({
      id: `alert-${++id}`,
      severity: "critical",
      title: "Recommendation quality critically low",
      description: "The recommendation system lacks sufficient data to provide meaningful suggestions.",
      timestamp: Date.now(),
      actionLabel: "Improve data",
      actionHref: "/quiz",
    });
  }

  // Warning alerts
  if (retention.overallRetention < 40) {
    alerts.push({
      id: `alert-${++id}`,
      severity: "warning",
      title: "Retention below target",
      description: `Overall retention at ${retention.overallRetention}% — below the 60% target. Consider engagement initiatives.`,
      timestamp: Date.now(),
    });
  }

  if (analytics.dropoffPoint) {
    alerts.push({
      id: `alert-${++id}`,
      severity: "warning",
      title: "Dropoff identified in user journey",
      description: analytics.dropoffPoint,
      timestamp: Date.now(),
    });
  }

  if (experiments.length === 0) {
    alerts.push({
      id: `alert-${++id}`,
      severity: "info",
      title: "No experiment winners yet",
      description: "All A/B tests are still gathering data. Continue normal engagement to help determine winners.",
      timestamp: Date.now(),
    });
  }

  const noFeedbacks = feedbackScoreIsZero(recommendation.feedbackScore);
  if (noFeedbacks) {
    const feedback = getFeedbackIntelligence();
    if (feedback.careerAffinities.length === 0) {
      alerts.push({
        id: `alert-${++id}`,
        severity: "info",
        title: "No feedback data collected",
        description: "User hasn't provided any career feedback yet. Feedback improves recommendation accuracy.",
        timestamp: Date.now(),
        actionLabel: "Explore careers",
        actionHref: "/careers",
      });
    }
  }

  // Positive info alerts
  if (retention.sessionStreak >= 5) {
    alerts.push({
      id: `alert-${++id}`,
      severity: "info",
      title: `🔥 ${retention.sessionStreak}-day engagement streak`,
      description: "Strong consistency — this user is highly engaged with the platform.",
      timestamp: Date.now(),
    });
  }

  if (recommendation.qualityScore >= 70 && recommendation.trustScore >= 70) {
    alerts.push({
      id: `alert-${++id}`,
      severity: "info",
      title: "Recommendation system healthy",
      description: "Both quality and trust scores are strong. The system is performing well.",
      timestamp: Date.now(),
    });
  }

  return alerts;
}

function feedbackScoreIsZero(score: number): boolean {
  return score < 5;
}

function computeBusinessNarrative(
  retention: RetentionHealthIndicators,
  recommendation: RecommendationHealth,
  topCareers: AdminIntelligenceData["topCareers"],
  experiments: ExperimentWinner[],
  analytics: ReturnType<typeof getUserAnalytics>
): BusinessNarrativeLine[] {
  const narrative: BusinessNarrativeLine[] = [];

  // Engagement overview
  if (analytics.engagementScore >= 70) {
    narrative.push({
      icon: "📈",
      text: `Engagement is strong at ${analytics.engagementScore}/100 — the user is actively exploring and using features.`,
    });
  } else if (analytics.engagementScore >= 40) {
    narrative.push({
      icon: "📊",
      text: `Engagement at ${analytics.engagementScore}/100 — consistent but room for deeper feature adoption.`,
    });
  } else {
    narrative.push({
      icon: "🌱",
      text: `Engagement is building at ${analytics.engagementScore}/100 — focus on core feature adoption.`,
    });
  }

  // Retention insight
  if (retention.churnRisk === "low") {
    narrative.push({
      icon: "🛡️",
      text: `Retention is healthy at ${retention.overallRetention}% with a ${retention.sessionStreak}-day active streak.`,
    });
  } else if (retention.churnRisk === "high") {
    narrative.push({
      icon: "⚠️",
      text: `Churn risk is high — retention at ${retention.overallRetention}% with ${analytics.retentionSignals.daysSinceLastVisit} days since last visit.`,
    });
  } else {
    narrative.push({
      icon: "🔄",
      text: `Retention at ${retention.overallRetention}% with ${retention.churnRisk} risk level.`,
    });
  }

  // Top career insight
  if (topCareers.length > 0) {
    const top = topCareers[0];
    narrative.push({
      icon: "🎯",
      text: `Top career by engagement: ${top.title} (${top.engagement} points, ${top.category}).`,
    });
  }

  // Experiment insight
  if (experiments.length > 0) {
    const topExp = experiments.sort((a, b) => b.confidenceLevel - a.confidenceLevel)[0];
    narrative.push({
      icon: "🔬",
      text: `Leading experiment: "${topExp.experimentName}" — variant "${topExp.winningLabel}" winning by ${topExp.improvementPct}% improvement.`,
    });
  } else {
    const engine = getExperimentEngine();
    const activeCount = engine.activeExperiments.length;
    narrative.push({
      icon: "🔬",
      text: `${activeCount} experiment${activeCount !== 1 ? "s" : ""} running — all still gathering sufficient data.`,
    });
  }

  // Recommendation health
  if (recommendation.qualityScore >= 60) {
    narrative.push({
      icon: "💡",
      text: `Recommendation system quality at ${recommendation.qualityScore}/100 with ${recommendation.specializationDomains} specialization domain${recommendation.specializationDomains !== 1 ? "s" : ""} identified.`,
    });
  } else {
    narrative.push({
      icon: "💡",
      text: `Recommendation system is building quality (${recommendation.qualityScore}/100) — more data will improve personalization.`,
    });
  }

  // Feature adoption
  const featuresUsed = Object.values(analytics.featureUsageMap).filter((c) => c > 0).length;
  const totalFeatures = Object.keys(analytics.featureUsageMap).length;
  narrative.push({
    icon: "🧩",
    text: `Feature adoption: ${featuresUsed}/${totalFeatures} features used. ${featuresUsed >= 6 ? "Strong adoption across the platform." : "Opportunity to introduce unused features."}`,
  });

  return narrative;
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full admin intelligence from all available data sources.
 */
export function computeAdminIntelligence(): AdminIntelligenceData {
  const analytics = getUserAnalytics();
  const optimizer = getRecommendationOptimizer();
  const feedback = getFeedbackIntelligence();
  const engine = getExperimentEngine();
  const topCareers = computeTopCareers();
  const dropoffFunnels = computeDropoffFunnels();
  const panelUsage = computePanelUsage();
  const experimentWinners = computeExperimentWinners();
  const retentionHealth = computeRetentionHealth();
  const recommendationHealth = computeRecommendationHealth();
  const systemAlerts = computeSystemAlerts(
    retentionHealth,
    recommendationHealth,
    analytics,
    experimentWinners
  );
  const businessNarrative = computeBusinessNarrative(
    retentionHealth,
    recommendationHealth,
    topCareers,
    experimentWinners,
    analytics
  );

  const data: AdminIntelligenceData = {
    totalUsersEstimate: computeTotalUsersEstimate(),
    activeUsers: computeActiveUsers(),
    topCareers,
    dropoffFunnels,
    panelUsage,
    experimentWinners,
    retentionHealth,
    recommendationHealth,
    systemAlerts,
    businessNarrative,
    lastComputed: new Date().toISOString(),
  };

  getStorage().set(COMPUTED_KEY, data);
  return data;
}

/**
 * Load previously computed admin intelligence data.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadAdminIntelligence(): AdminIntelligenceData | null {
  const storage = getStorage();
  const cached = storage.get<AdminIntelligenceData>(COMPUTED_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.lastComputed).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  return cached;
}

/**
 * Get current admin intelligence, computing fresh if needed.
 */
export function getAdminIntelligence(): AdminIntelligenceData {
  const existing = loadAdminIntelligence();
  if (existing) return existing;
  return computeAdminIntelligence();
}

/**
 * Clear all admin intelligence data.
 */
export function clearAdminIntelligence(): void {
  const storage = getStorage();
  storage.remove(COMPUTED_KEY);
}
