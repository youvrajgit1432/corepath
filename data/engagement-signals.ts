/**
 * Engagement signals analyzer.
 * Calculates session depth, interests, behavior patterns from tracked events.
 */

import { getEventsInSession, getSessionDuration, getSessionId, AnalyticsEvent } from "./analytics-events";

export interface EngagementSignals {
  sessionDepth: "light" | "moderate" | "deep";
  eventCount: number;
  viewedCareers: string[];
  viewedCategories: string[];
  comparisonCount: number;
  comparisonFrequency: "none" | "occasional" | "frequent";
  roadmapEngagement: "none" | "viewed" | "active";
  roadsMapInteractionCount: number;
  roadmapInteractionCount: number;
  quizCompletedInSession: boolean;
  timeBeforeQuizCompletion?: number;
  hasRecommendationFeedback: boolean;
  insightPagesViewed: string[];
  recommendationClicked: boolean;
  dropoffStage?: string;
}

export interface InterestCluster {
  cluster: string;
  strength: "high" | "medium" | "low";
  careerIds: string[];
  themes: string[];
}

export interface UserBehaviorProfile {
  primaryBehavior: "explorer" | "focused" | "comparison_focused" | "learner";
  engagementLevel: "low" | "medium" | "high";
  repeatInterests: Record<string, number>;
  timeInSession: number;
}

function extractMetadata<T>(events: AnalyticsEvent[], field: string): T[] {
  return events
    .filter((e) => e.metadata?.[field])
    .map((e) => e.metadata![field] as T);
}

function countOccurrences<T>(items: T[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = String(item);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

export function analyzeEngagementSignals(
  sessionId?: string
): EngagementSignals {
  const events = getEventsInSession(sessionId || getSessionId());

  const careerViewEvents = events.filter((e) => e.metadata?.careerId);
  const careerViews = careerViewEvents.map((e) => e.metadata!.careerId as string);
  const categoryViews = events.flatMap((e) => {
    const category = e.metadata?.category ?? e.metadata?.careerCategory;
    return category ? [String(category)] : [];
  });
  const comparisonOpens = events.filter((e) => e.type === "comparison_opened");
  const roadmapViews = events.filter((e) => e.type === "roadmap_viewed");
  const roadmapInteractions = events.filter((e) => e.type === "roadmap_interacted");
  const quizCompleted = events.some((e) => e.type === "quiz_completed");
  const quizStarted = events.find((e) => e.type === "quiz_started");
  const quizFinished = events.find((e) => e.type === "quiz_completed");
  const insightViews = extractMetadata<string>(events, "insightSlug");
  const hasFeedback = events.some((e) => e.type === "recommendation_feedback");
  const recommendationClicked = events.some((e) => e.type === "recommendation_clicked");

  const timeBeforeQuizCompletion = quizStarted && quizFinished
    ? quizFinished.timestamp - quizStarted.timestamp
    : undefined;

  const eventCount = events.length;
  let sessionDepth: "light" | "moderate" | "deep" = "light";
  if (eventCount >= 20) {
    sessionDepth = "deep";
  } else if (eventCount >= 8) {
    sessionDepth = "moderate";
  }

  const comparisonFrequency =
    comparisonOpens.length >= 3 ? "frequent" : comparisonOpens.length > 0 ? "occasional" : "none";
  const roadmapEngagement =
    roadmapInteractions.length > 0 ? "active" : roadmapViews.length > 0 ? "viewed" : "none";

  // Detect dropoff stage
  let dropoffStage: string | undefined;
  if (events.some((e) => e.type === "quiz_dropoff")) {
    dropoffStage = "quiz_incomplete";
  } else if (
    events.some((e) => e.type === "quiz_completed") &&
    !events.some((e) => e.type === "recommendation_viewed")
  ) {
    dropoffStage = "after_quiz";
  }

  return {
    sessionDepth,
    eventCount,
    viewedCareers: Array.from(new Set(careerViews)),
    viewedCategories: Array.from(new Set(categoryViews)),
    comparisonCount: comparisonOpens.length,
    comparisonFrequency,
    roadmapEngagement,
    roadsMapInteractionCount: roadmapInteractions.length,
    roadmapInteractionCount: roadmapInteractions.length,
    quizCompletedInSession: quizCompleted,
    timeBeforeQuizCompletion,
    hasRecommendationFeedback: hasFeedback,
    insightPagesViewed: Array.from(new Set(insightViews)),
    recommendationClicked,
    dropoffStage,
  };
}

export function identifyInterestClusters(
  sessionId?: string
): InterestCluster[] {
  const signals = analyzeEngagementSignals(sessionId);
  const events = getEventsInSession(sessionId || getSessionId());

  // Map viewed careers to potential clusters
  const clusters: Map<string, { careers: Set<string>; themes: Set<string> }> = new Map();

  // AI/Systems cluster
  const aiSystemsCareers = [
    "ml-engineer",
    "devops-engineer",
    "backend-engineer",
    "cloud-architect",
    "ai-systems-engineer",
  ];
  const aiSystemsThemes = ["scalability", "infrastructure", "ai-systems", "automation"];

  // Frontend/UX cluster
  const frontendCareers = [
    "frontend-engineer",
    "fullstack-engineer",
    "ui-designer",
    "interaction-designer",
  ];
  const frontendThemes = ["ux", "visual", "design", "product"];

  // Data cluster
  const dataCareers = ["data-scientist", "data-engineer", "analytics-engineer"];
  const dataThemes = ["data", "analytics", "ml", "insights"];

  // Security cluster
  const securityCareers = ["cybersecurity-analyst", "security-engineer"];
  const securityThemes = ["security", "compliance", "risk", "audit"];

  clusters.set("AI + Systems", {
    careers: new Set(aiSystemsCareers),
    themes: new Set(aiSystemsThemes),
  });
  clusters.set("Frontend & UX", {
    careers: new Set(frontendCareers),
    themes: new Set(frontendThemes),
  });
  clusters.set("Data & Analytics", {
    careers: new Set(dataCareers),
    themes: new Set(dataThemes),
  });
  clusters.set("Security", {
    careers: new Set(securityCareers),
    themes: new Set(securityThemes),
  });

  // Calculate cluster affinity
  const viewedCareerCounts = countOccurrences(extractMetadata<string>(events, "careerId"));
  const viewedCategoryCounts = countOccurrences(signals.viewedCategories);

  const clusterScores: Record<string, number> = {};
  for (const [clusterName, { careers }] of clusters) {
    let score = 0;
    for (const career of careers) {
      score += viewedCareerCounts[career] || 0;
    }
    clusterScores[clusterName] = score;
  }

  // Return clusters sorted by score, with strength levels
  return Array.from(clusters.entries())
    .map(([name, { careers, themes }]) => {
      const strength: InterestCluster["strength"] =
        clusterScores[name] >= 5
          ? "high"
          : clusterScores[name] >= 2
            ? "medium"
            : "low";

      return {
        cluster: name,
        strength,
        careerIds: Array.from(careers),
        themes: Array.from(themes),
      };
    })
    .filter((c) => c.strength !== "low")
    .sort((a, b) => {
      const scoreMap = { high: 3, medium: 2, low: 1 };
      return scoreMap[b.strength] - scoreMap[a.strength];
    });
}

export function analyzeBehaviorProfile(sessionId?: string): UserBehaviorProfile {
  const signals = analyzeEngagementSignals(sessionId);
  const events = getEventsInSession(sessionId || getSessionId());

  // Determine primary behavior
  let primaryBehavior: "explorer" | "focused" | "comparison_focused" | "learner" =
    "explorer";
  if (signals.comparisonCount >= 3) {
    primaryBehavior = "comparison_focused";
  } else if (
    signals.roadsMapInteractionCount > 0 &&
    signals.eventCount > 10
  ) {
    primaryBehavior = "learner";
  } else if (
    signals.viewedCareers.length <= 3 &&
    signals.quizCompletedInSession
  ) {
    primaryBehavior = "focused";
  }

  // Engagement level
  let engagementLevel: "low" | "medium" | "high" = "low";
  if (signals.eventCount >= 15) {
    engagementLevel = "high";
  } else if (signals.eventCount >= 6) {
    engagementLevel = "medium";
  }

  // Repeated interests
  const repeatInterests = countOccurrences(extractMetadata<string>(events, "careerId"));

  // Session duration
  const sessionStart = events.find((e) => e.type === "session_started");
  const sessionEnd = events.at(-1);
  const timeInSession =
    sessionEnd && sessionStart
      ? sessionEnd.timestamp - sessionStart.timestamp
      : getSessionDuration();

  return {
    primaryBehavior,
    engagementLevel,
    repeatInterests: Object.fromEntries(
      Object.entries(repeatInterests).filter(([, count]) => count > 1)
    ),
    timeInSession,
  };
}

export function getExploredThemes(sessionId?: string): string[] {
  const clusters = identifyInterestClusters(sessionId);
  const themes = new Set<string>();

  for (const cluster of clusters) {
    for (const theme of cluster.themes) {
      themes.add(theme);
    }
  }

  return Array.from(themes);
}
