import { getAllEvents, getRecentFeedback, type AnalyticsEvent } from "./analytics-events";
import { getCareerById } from "./careers";
import { loadJourneyMemory, type JourneyMemory } from "./journey-memory";

export interface RankedMetric {
  id: string;
  label: string;
  count: number;
  detail?: string;
}

export interface TrendMetric {
  value: number;
  previous: number;
  direction: "up" | "down" | "flat";
  change: number;
}

export interface ConfidenceDistribution {
  low: number;
  medium: number;
  high: number;
  average: number;
}

export interface LocalProductIntelligence {
  quizStarts: TrendMetric;
  quizCompletions: TrendMetric;
  completionRate: number;
  mostViewedCareers: RankedMetric[];
  mostComparedCareers: RankedMetric[];
  favoriteCategories: RankedMetric[];
  recommendationHelpfulRatio: number;
  recommendationFeedbackTotal: number;
  commonDropoffStage?: RankedMetric;
  topRepeatedInterests: RankedMetric[];
  aiInterestSignals: JourneyMemory["aiInterestSignals"];
  confidenceDistribution: ConfidenceDistribution;
  mostExploredThemes: RankedMetric[];
  generatedInsights: string[];
  eventCount: number;
  lastUpdated?: number;
}

function countBy(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    if (!item) return acc;
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function mergeCounts(...records: Array<Record<string, number> | undefined>): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record ?? {})) {
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}

function rankCounts(record: Record<string, number>, limit = 5, labeler = (key: string) => key): RankedMetric[] {
  return Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id, count]) => ({
      id,
      label: labeler(id),
      count,
    }));
}

function careerLabel(careerId: string): string {
  return getCareerById(careerId)?.title ?? careerId;
}

function careerPairLabel(pair: string): string {
  const [a, b] = pair.split("|");
  return [careerLabel(a), careerLabel(b)].filter(Boolean).join(" vs ");
}

function pairKey(a?: string, b?: string): string | null {
  if (!a || !b) return null;
  return [a, b].sort().join("|");
}

function trendFor(events: AnalyticsEvent[], type: AnalyticsEvent["type"]): TrendMetric {
  const midpoint = events.length > 1 ? events[Math.floor(events.length / 2)]?.timestamp ?? 0 : 0;
  const previous = events.filter((event) => event.type === type && event.timestamp < midpoint).length;
  const value = events.filter((event) => event.type === type && event.timestamp >= midpoint).length;
  const change = value - previous;

  return {
    value: events.filter((event) => event.type === type).length,
    previous,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    change,
  };
}

function buildConfidenceDistribution(memory: JourneyMemory, events: AnalyticsEvent[]): ConfidenceDistribution {
  const eventConfidences = events
    .filter((event) => event.type === "quiz_completed")
    .map((event) => Number(event.metadata?.confidence))
    .filter((value) => Number.isFinite(value) && value > 0);

  const values = [...memory.confidenceHistory, ...eventConfidences];
  const uniqueValues = Array.from(new Set(values));

  const low = uniqueValues.filter((value) => value < 50).length;
  const medium = uniqueValues.filter((value) => value >= 50 && value < 75).length;
  const high = uniqueValues.filter((value) => value >= 75).length;
  const average = uniqueValues.length
    ? Math.round(uniqueValues.reduce((sum, value) => sum + value, 0) / uniqueValues.length)
    : 0;

  return { low, medium, high, average };
}

function buildGeneratedInsights(input: {
  mostComparedCareers: RankedMetric[];
  commonDropoffStage?: RankedMetric;
  favoriteCategories: RankedMetric[];
  confidenceDistribution: ConfidenceDistribution;
  topRepeatedInterests: RankedMetric[];
  mostExploredThemes: RankedMetric[];
  aiInterestSignals: JourneyMemory["aiInterestSignals"];
}): string[] {
  const insights: string[] = [];
  const topPair = input.mostComparedCareers[0];
  const topCategory = input.favoriteCategories[0];
  const topTheme = input.mostExploredThemes[0];
  const topRepeat = input.topRepeatedInterests[0];
  const totalAiSignals =
    input.aiInterestSignals.careerViews +
    input.aiInterestSignals.compareActions +
    input.aiInterestSignals.recommendations;

  if (topPair && topPair.count > 1) {
    insights.push(`Users repeatedly compare ${topPair.label}.`);
  }

  if (input.commonDropoffStage && input.commonDropoffStage.count > 0) {
    insights.push(`Most quiz dropoff happens around ${input.commonDropoffStage.label}.`);
  }

  if (topCategory && topCategory.count >= 3) {
    insights.push(`${topCategory.label} careers receive unusually high engagement.`);
  }

  if (input.confidenceDistribution.low > input.confidenceDistribution.high && input.topRepeatedInterests.length >= 3) {
    insights.push("Recommendation confidence drops for highly exploratory users.");
  }

  if (topTheme && topTheme.count > 0) {
    insights.push(`Most explored theme right now: ${topTheme.label}.`);
  }

  if (topRepeat && topRepeat.count > 1) {
    insights.push(`${topRepeat.label} is a repeated interest and should influence recommendation tuning.`);
  }

  if (totalAiSignals >= 3) {
    insights.push("AI-related careers are producing a clear interest signal across views, comparisons, and recommendations.");
  }

  return insights.length ? insights : ["More local events are needed before strong product patterns emerge."];
}

export function buildLocalProductIntelligence(): LocalProductIntelligence {
  const events = getAllEvents(500).sort((a, b) => a.timestamp - b.timestamp);
  const feedback = getRecentFeedback(500);
  const memory = loadJourneyMemory();

  const quizStarts = events.filter((event) => event.type === "quiz_started").length;
  const quizCompletions = events.filter((event) => event.type === "quiz_completed").length;
  const completionRate = quizStarts > 0 ? Math.round((quizCompletions / quizStarts) * 100) : 0;

  const viewedCareerCounts = mergeCounts(
    memory.viewedCareers,
    countBy(
      events
        .filter((event) => event.type === "career_viewed" && event.metadata?.careerId)
        .map((event) => String(event.metadata?.careerId))
    )
  );

  const comparedFromEvents = countBy(
    events
      .filter((event) => event.type === "comparison_opened" || event.type === "comparison_initiated")
      .map((event) => pairKey(String(event.metadata?.careerA ?? ""), String(event.metadata?.careerB ?? "")) ?? "")
  );

  const categoryCounts = mergeCounts(
    memory.favoriteCategories,
    countBy(
      events.flatMap((event) => {
        const category = event.metadata?.category ?? event.metadata?.careerCategory;
        const categoryA = event.metadata?.categoryA;
        const categoryB = event.metadata?.categoryB;
        return [category, categoryA, categoryB].filter(Boolean).map(String);
      })
    )
  );

  const dropoffCounts = countBy(
    events
      .filter((event) => event.type === "quiz_dropoff")
      .map((event) => String(event.metadata?.stage ?? "quiz_incomplete"))
  );

  const repeatedInterestCounts = mergeCounts(memory.viewedCareers, memory.recommendedCareers, viewedCareerCounts);
  const themeCounts = memory.repeatedThemes;
  const helpfulCount = feedback.filter((item) => item.helpful).length;
  const recommendationHelpfulRatio = feedback.length ? Math.round((helpfulCount / feedback.length) * 100) : 0;
  const confidenceDistribution = buildConfidenceDistribution(memory, events);

  const mostViewedCareers = rankCounts(viewedCareerCounts, 5, careerLabel);
  const mostComparedCareers = rankCounts(mergeCounts(memory.comparedCareerPairs, comparedFromEvents), 5, careerPairLabel);
  const favoriteCategories = rankCounts(categoryCounts, 5);
  const commonDropoffStage = rankCounts(dropoffCounts, 1, (stage) => stage.replace(/_/g, " "))[0];
  const topRepeatedInterests = rankCounts(
    Object.fromEntries(Object.entries(repeatedInterestCounts).filter(([, count]) => count > 1)),
    5,
    careerLabel
  );
  const mostExploredThemes = rankCounts(themeCounts, 6, (theme) => theme.replace(/-/g, " "));

  const aiInterestSignals = memory.aiInterestSignals;
  const generatedInsights = buildGeneratedInsights({
    mostComparedCareers,
    commonDropoffStage,
    favoriteCategories,
    confidenceDistribution,
    topRepeatedInterests,
    mostExploredThemes,
    aiInterestSignals,
  });

  return {
    quizStarts: trendFor(events, "quiz_started"),
    quizCompletions: trendFor(events, "quiz_completed"),
    completionRate,
    mostViewedCareers,
    mostComparedCareers,
    favoriteCategories,
    recommendationHelpfulRatio,
    recommendationFeedbackTotal: feedback.length,
    commonDropoffStage,
    topRepeatedInterests,
    aiInterestSignals,
    confidenceDistribution,
    mostExploredThemes,
    generatedInsights,
    eventCount: events.length,
    lastUpdated: events.at(-1)?.timestamp,
  };
}
