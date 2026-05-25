/**
 * Personal insights generator.
 * Creates user-facing messages from engagement signals.
 */

import {
  analyzeEngagementSignals,
  identifyInterestClusters,
  analyzeBehaviorProfile,
  getExploredThemes,
} from "./engagement-signals";

export interface PersonalInsight {
  type: "interest_cluster" | "behavior" | "exploration" | "engagement" | "recommendation_quality";
  title: string;
  message: string;
  icon?: string;
}

export function generatePersonalInsights(sessionId?: string): PersonalInsight[] {
  const signals = analyzeEngagementSignals(sessionId);
  const clusters = identifyInterestClusters(sessionId);
  const profile = analyzeBehaviorProfile(sessionId);
  const themes = getExploredThemes(sessionId);

  const insights: PersonalInsight[] = [];

  // Interest cluster insight
  if (clusters.length > 0) {
    const topCluster = clusters[0];
    const clusterMessage =
      topCluster.strength === "high"
        ? `Your strongest interest cluster is **${topCluster.cluster}**. You've explored careers in this area multiple times, showing focused interest.`
        : `You're exploring careers in **${topCluster.cluster}**, which combines several of the roles you've viewed.`;

    insights.push({
      type: "interest_cluster",
      title: `Interest cluster: ${topCluster.cluster}`,
      message: clusterMessage,
      icon: "🎯",
    });
  }

  // Behavior insight
  if (profile.engagementLevel === "high") {
    const behaviorMsg =
      profile.primaryBehavior === "comparison_focused"
        ? `You're a **comparison-focused explorer**: you're making careful distinctions between roles before deciding. This methodical approach helps you find the best fit.`
        : profile.primaryBehavior === "learner"
          ? `You're a **learner**: you're exploring careers and diving into roadmaps to understand how to transition. This signals serious interest in building skills.`
          : profile.primaryBehavior === "focused"
            ? `You've narrowed your focus after the quiz. This suggests you found roles that resonate with your strengths.`
            : `You're actively exploring, which helps you understand the breadth of tech careers before deciding.`;

    insights.push({
      type: "behavior",
      title: "Your exploration style",
      message: behaviorMsg,
      icon: "🔍",
    });
  }

  // Exploration insight
  if (themes.length > 0) {
    const themeList = themes.slice(0, 4).join(", ");
    const explorationMsg = `You've explored careers around **${themeList}**. These themes suggest interest in roles with deep technical impact and long-term growth potential.`;

    insights.push({
      type: "exploration",
      title: "Your most explored themes",
      message: explorationMsg,
      icon: "📚",
    });
  }

  // Engagement insight
  if (signals.hasRecommendationFeedback) {
    insights.push({
      type: "engagement",
      title: "Feedback matters",
      message:
        "You've shared feedback on recommendations. This helps CorePath improve for everyone, and helps us understand what resonates with you.",
      icon: "💬",
    });
  }

  // Repeated interest insight
  if (Object.keys(profile.repeatInterests).length > 0) {
    const topRepeat = Object.entries(profile.repeatInterests).sort(
      ([, a], [, b]) => b - a
    )[0][0];
    insights.push({
      type: "engagement",
      title: "Strong repeated interest",
      message: `You've returned to **${topRepeat}** multiple times. This career aligns strongly with your interests and is worth exploring further.`,
      icon: "⭐",
    });
  }

  // Dropoff insight
  if (signals.dropoffStage && signals.eventCount < 8) {
    const dropoffMsg =
      signals.dropoffStage === "quiz_incomplete"
        ? "You started the quiz but didn't complete it. No pressure—come back when you're ready, and we'll pick up where you left off."
        : "You completed the quiz but haven't explored recommendations yet. That section has personalized career matches based on your answers.";

    insights.push({
      type: "recommendation_quality",
      title: "Continue exploring",
      message: dropoffMsg,
      icon: "👉",
    });
  }

  // Quiz completion time insight
  if (
    signals.timeBeforeQuizCompletion &&
    signals.timeBeforeQuizCompletion > 600000
  ) {
    const mins = Math.round(signals.timeBeforeQuizCompletion / 60000);
    insights.push({
      type: "engagement",
      title: "Thoughtful quiz-taker",
      message: `You spent about **${mins} minutes** on the quiz. Taking time to think through your answers leads to better career recommendations.`,
      icon: "⏱️",
    });
  }

  return insights;
}

export function generateInsightSummary(sessionId?: string): string {
  const clusters = identifyInterestClusters(sessionId);
  const themes = getExploredThemes(sessionId);

  if (clusters.length === 0 || themes.length === 0) {
    return "Keep exploring to reveal your career interests.";
  }

  const topCluster = clusters[0];
  const topThemes = themes.slice(0, 2);
  const themePhrase = topThemes.length > 1 ? topThemes.join(" and ") : topThemes[0];

  return `Your strongest interest cluster: **${topCluster.cluster}**. Most explored themes: ${themePhrase}.`;
}

export function getEngagementMessage(sessionId?: string): string {
  const signals = analyzeEngagementSignals(sessionId);
  const profile = analyzeBehaviorProfile(sessionId);

  if (profile.engagementLevel === "low") {
    return signals.viewedCareers.length > 0
      ? "You're just getting started—keep exploring to find your best fit."
      : "Start with the career quiz or explore careers directly.";
  }

  if (profile.engagementLevel === "medium") {
    return "You're building a clearer picture of the roles that interest you.";
  }

  return `You're deeply engaged! You've explored ${signals.viewedCareers.length} careers and ${signals.comparisonCount} comparisons.`;
}
