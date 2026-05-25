/**
 * Confidence + Uncertainty Intelligence Engine
 *
 * Analyzes journey signals to generate explainable confidence metrics:
 * - How confident the system is in recommendations
 * - Why confidence is high or low
 * - Where uncertainty exists
 * - Whether user is exploring or converging
 * - How mature the profile is
 *
 * No LLM integrations. Pure signal analysis from:
 * - Journey memory (quiz history, viewed careers, comparisons, roadmap interactions)
 * - Enhanced profile (contradictions, specialization depth)
 * - Recommendation signals
 */

import type { JourneyMemory } from "./journey-memory";
import type { EnhancedProfile } from "./quiz-enhanced";
import type { TraitScores } from "./quiz";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type ConfidenceLevel = "high" | "medium" | "low" | "emerging";
export type UncertaintyLevel = "low" | "medium" | "high";
export type ExplorationStatus = "exploring" | "narrowing" | "converging" | "stable";
export type RecommendationStability = "stable" | "developing" | "volatile";
export type ProfileMaturity = "emerging" | "developing" | "mature" | "evolved";
export type TrendDirection = "improving" | "stable" | "fluctuating" | "declining";

export interface ConfidenceSignal {
  signal: string;
  value: number;
  impact: "positive" | "negative" | "neutral";
  explanation: string;
}

export interface ConfidenceMetrics {
  // Core metrics
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number; // 0-1
  uncertaintyLevel: UncertaintyLevel;
  uncertaintyScore: number; // 0-1

  // Status indicators
  explorationStatus: ExplorationStatus;
  recommendationStability: RecommendationStability;
  profileMaturity: ProfileMaturity;
  trendDirection: TrendDirection;

  // Diagnostic signals (what drives the metrics)
  signals: ConfidenceSignal[];

  // Human-readable narratives
  confidenceNarrative: string;
  uncertaintyNarrative: string;
  explorationNarrative: string;
  recommendationNarrative: string;
  evolutionNarrative: string;

  // Recommendations for next steps
  nextSteps: string[];
}

// Legacy type for backward compatibility
export type ConfidenceInsights = {
  confidenceLevel: string;
  uncertaintyLevel: string;
  explorationStatus: string;
  recommendationStability: string;
  profileMaturity: string;
  trendConfidence: string;
};

// ============================================================================
// PRIVATE ANALYSIS
// ============================================================================

interface SignalAnalysis {
  signals: ConfidenceSignal[];
  score: number; // 0-1
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Analyze contradictions in the user's profile
 * Contradictions reduce confidence (conflicting trait signals)
 */
function analyzeContradictions(profile: EnhancedProfile | null): SignalAnalysis {
  const signals: ConfidenceSignal[] = [];
  let score = 1;

  if (!profile) {
    return { signals, score: 0.5 };
  }

  const contradictionCount = profile.contradictions.length;

  if (contradictionCount === 0) {
    signals.push({
      signal: "no_contradictions",
      value: 1,
      impact: "positive",
      explanation: "Your trait signals are internally consistent.",
    });
  } else if (contradictionCount <= 2) {
    signals.push({
      signal: "minor_contradictions",
      value: 0.8,
      impact: "neutral",
      explanation: `A few minor trait tensions (${contradictionCount}) indicate you bridge different work styles.`,
    });
    score = 0.85;
  } else {
    signals.push({
      signal: "multiple_contradictions",
      value: 0.5,
      impact: "negative",
      explanation: `Multiple contradictions (${contradictionCount}) suggest your interests span diverse domains.`,
    });
    score = 0.6;
  }

  return { signals, score };
}

/**
 * Analyze answer consistency across quiz sessions
 */
function analyzeAnswerConsistency(journey: JourneyMemory): SignalAnalysis {
  const signals: ConfidenceSignal[] = [];
  const quizCount = journey.completedQuizzes;
  let score = 0.5;

  if (quizCount === 0) {
    signals.push({
      signal: "no_quizzes",
      value: 0,
      impact: "neutral",
      explanation: "Complete your first quiz to establish your profile.",
    });
    score = 0;
  } else if (quizCount === 1) {
    signals.push({
      signal: "single_quiz",
      value: 0.6,
      impact: "neutral",
      explanation: "Single session provides initial signal; additional sessions will confirm or evolve this.",
    });
    score = 0.6;
  } else {
    const confidenceHistory = journey.confidenceHistory;
    if (confidenceHistory.length > 1) {
      const avg = confidenceHistory.reduce((a, b) => a + b, 0) / confidenceHistory.length;
      const variance = confidenceHistory.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / confidenceHistory.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < 0.15) {
        signals.push({
          signal: "high_consistency",
          value: 1,
          impact: "positive",
          explanation: `Quiz scores consistently converge (${quizCount} sessions, σ = ${stdDev.toFixed(2)}).`,
        });
        score = 0.9;
      } else if (stdDev < 0.3) {
        signals.push({
          signal: "moderate_consistency",
          value: 0.75,
          impact: "neutral",
          explanation: `Quiz scores show moderate variance (${quizCount} sessions); your profile is becoming clearer.`,
        });
        score = 0.75;
      } else {
        signals.push({
          signal: "high_variance",
          value: 0.4,
          impact: "negative",
          explanation: `Quiz scores fluctuate widely (${quizCount} sessions); you may still be exploring.`,
        });
        score = 0.4;
      }
    }
  }

  return { signals, score };
}

/**
 * Analyze repeated themes
 */
function analyzeRepeatedThemes(journey: JourneyMemory): SignalAnalysis {
  const signals: ConfidenceSignal[] = [];
  const themes = journey.repeatedThemes;
  const themeValues = Object.values(themes).filter((v) => v > 0);
  const maxThemeCount = Math.max(...themeValues, 0);
  const diverseThemeCount = themeValues.filter((v) => v > 0).length;
  let score = 0.5;

  if (diverseThemeCount === 0) {
    signals.push({
      signal: "no_themes",
      value: 0,
      impact: "neutral",
      explanation: "View and compare careers to establish interest patterns.",
    });
    score = 0;
  } else if (maxThemeCount >= 5 && diverseThemeCount <= 2) {
    const topTheme = Object.entries(themes).sort(([, a], [, b]) => b - a)[0][0];
    signals.push({
      signal: "strong_specialization",
      value: 0.95,
      impact: "positive",
      explanation: `Strong focus on ${topTheme} (${maxThemeCount} signals). Your preferences are clear.`,
    });
    score = 0.9;
  } else if (maxThemeCount >= 3 && diverseThemeCount <= 3) {
    signals.push({
      signal: "developing_focus",
      value: 0.8,
      impact: "positive",
      explanation: `A few dominant themes (${diverseThemeCount}) are emerging from your interests.`,
    });
    score = 0.8;
  } else if (diverseThemeCount > 4) {
    signals.push({
      signal: "broad_exploration",
      value: 0.4,
      impact: "neutral",
      explanation: `Exploring widely across ${diverseThemeCount} different themes. Patterns will crystallize as you narrow.`,
    });
    score = 0.4;
  }

  return { signals, score };
}

/**
 * Analyze specialization depth trajectory
 */
function analyzeSpecializationTrend(journey: JourneyMemory): SignalAnalysis {
  const signals: ConfidenceSignal[] = [];
  const depthHistory = journey.specializationDepthHistory;
  let score = 0.5;

  if (depthHistory.length < 2) {
    signals.push({
      signal: "insufficient_depth_history",
      value: 0.5,
      impact: "neutral",
      explanation: "Specialization trend will emerge over multiple sessions.",
    });
    score = 0.5;
  } else {
    const recentDepth = depthHistory.slice(-3);
    const trend = recentDepth[recentDepth.length - 1] - recentDepth[0];

    if (trend > 0.15) {
      signals.push({
        signal: "increasing_specialization",
        value: 0.9,
        impact: "positive",
        explanation: "Specialization is deepening. You are converging toward specific roles.",
      });
      score = 0.85;
    } else if (trend > -0.1) {
      signals.push({
        signal: "stable_specialization",
        value: 0.7,
        impact: "neutral",
        explanation: "Specialization level is stable. Your profile is settling.",
      });
      score = 0.7;
    } else {
      signals.push({
        signal: "broadening_scope",
        value: 0.5,
        impact: "neutral",
        explanation: "You are broadening your exploration. Still discovering your direction.",
      });
      score = 0.5;
    }
  }

  return { signals, score };
}

/**
 * Analyze exploration diversity
 */
function analyzeExplorationDiversity(journey: JourneyMemory): SignalAnalysis {
  const signals: ConfidenceSignal[] = [];
  const viewedCareers = Object.keys(journey.viewedCareers).length;
  const comparedPairs = Object.keys(journey.comparedCareerPairs).length;
  const roadmapEngagement = Object.keys(journey.roadmapInteractions).length;
  let score = 0.5;

  if (viewedCareers < 3) {
    signals.push({
      signal: "limited_career_exploration",
      value: 0.3,
      impact: "neutral",
      explanation: `You have viewed ${viewedCareers} careers. Browse more to build confidence.`,
    });
    score = 0.3;
  } else if (viewedCareers < 8) {
    signals.push({
      signal: "moderate_career_exploration",
      value: 0.7,
      impact: "neutral",
      explanation: `You have explored ${viewedCareers} careers, a good foundation for confident recommendations.`,
    });
    score = 0.7;
  } else {
    signals.push({
      signal: "broad_career_exploration",
      value: 0.85,
      impact: "positive",
      explanation: `You have viewed ${viewedCareers} careers, building comprehensive perspective.`,
    });
    score = 0.85;
  }

  if (comparedPairs > 0) {
    signals.push({
      signal: "active_comparison",
      value: Math.min(1, comparedPairs / 5),
      impact: "positive",
      explanation: `You have compared ${comparedPairs} career pairs, showing active evaluation.`,
    });
    score = Math.min(1, score * 1.1);
  }

  if (roadmapEngagement > 0) {
    signals.push({
      signal: "roadmap_engagement",
      value: Math.min(1, roadmapEngagement / 3),
      impact: "positive",
      explanation: `You have engaged with ${roadmapEngagement} learning roadmaps, showing commitment.`,
    });
    score = Math.min(1, score * 1.15);
  }

  return { signals, score };
}

/**
 * Analyze recommendation convergence
 */
function analyzeRecommendationConvergence(journey: JourneyMemory): SignalAnalysis {
  const signals: ConfidenceSignal[] = [];
  const recommendedCareers = journey.recommendedCareers;
  const careerCount = Object.keys(recommendedCareers).length;
  const recommCount = Object.values(recommendedCareers).reduce((a, b) => a + b, 0);
  let score = 0.5;

  if (recommCount === 0) {
    signals.push({
      signal: "no_recommendations",
      value: 0,
      impact: "neutral",
      explanation: "Complete a quiz to generate recommendations.",
    });
    score = 0;
  } else if (recommCount === 1) {
    signals.push({
      signal: "single_recommendation",
      value: 0.5,
      impact: "neutral",
      explanation: "One recommendation session provides initial direction.",
    });
    score = 0.5;
  } else if (careerCount <= 3 && recommCount >= 3) {
    const concentration = Math.max(...Object.values(recommendedCareers), 0) / recommCount;
    if (concentration > 0.5) {
      signals.push({
        signal: "high_recommendation_convergence",
        value: 0.9,
        impact: "positive",
        explanation: "Top recommendations are consistent across sessions.",
      });
      score = 0.9;
    } else {
      signals.push({
        signal: "moderate_recommendation_convergence",
        value: 0.7,
        impact: "positive",
        explanation: "Recommendations are consolidating toward a few key roles.",
      });
      score = 0.7;
    }
  } else if (careerCount > 5) {
    signals.push({
      signal: "diverse_recommendations",
      value: 0.4,
      impact: "neutral",
      explanation: `${careerCount} different careers recommended suggests your profile is still evolving.`,
    });
    score = 0.4;
  }

  return { signals, score };
}

/**
 * Analyze uncertainty patterns
 */
function analyzeUncertaintyPatterns(journey: JourneyMemory): SignalAnalysis {
  const signals: ConfidenceSignal[] = [];
  const patterns = journey.uncertaintyPatterns;
  const retakes = patterns.retakes || 0;
  const lowConfidence = patterns.lowConfidenceMatches || 0;
  const repeatSessions = patterns.repeatQuizSessions || 0;
  let score = 1;

  if (retakes > 2) {
    signals.push({
      signal: "multiple_retakes",
      value: 0.6,
      impact: "negative",
      explanation: `You have retaken the quiz ${retakes} times. Each iteration refines your profile.`,
    });
    score -= 0.2;
  }

  if (lowConfidence > 2) {
    signals.push({
      signal: "low_confidence_matches",
      value: 0.5,
      impact: "negative",
      explanation: `${lowConfidence} recommendations had low confidence, suggesting diverse interests.`,
    });
    score -= 0.15;
  }

  if (repeatSessions > 3) {
    signals.push({
      signal: "frequent_quiz_sessions",
      value: 0.6,
      impact: "neutral",
      explanation: `${repeatSessions} quiz sessions show you are actively refining your profile.`,
    });
    score -= 0.1;
  }

  if (signals.length === 0) {
    signals.push({
      signal: "no_uncertainty_patterns",
      value: 1,
      impact: "positive",
      explanation: "Your journey shows consistent, decisive signals.",
    });
  }

  return { signals, score: Math.max(0.3, score) };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate comprehensive confidence metrics
 */
export function generateConfidenceMetrics(
  journey: JourneyMemory,
  profile: EnhancedProfile | null = null,
  userTraits: TraitScores | null = null
): ConfidenceMetrics {
  const contradictions = analyzeContradictions(profile);
  const consistency = analyzeAnswerConsistency(journey);
  const themes = analyzeRepeatedThemes(journey);
  const specialization = analyzeSpecializationTrend(journey);
  const exploration = analyzeExplorationDiversity(journey);
  const recommendations = analyzeRecommendationConvergence(journey);
  const uncertainty = analyzeUncertaintyPatterns(journey);

  const allSignals = [
    ...contradictions.signals,
    ...consistency.signals,
    ...themes.signals,
    ...specialization.signals,
    ...exploration.signals,
    ...recommendations.signals,
    ...uncertainty.signals,
  ];

  const confidenceComponentScores = [
    consistency.score * 0.25,
    themes.score * 0.25,
    specialization.score * 0.2,
    recommendations.score * 0.2,
    contradictions.score * 0.1,
  ];
  const confidenceScore = confidenceComponentScores.reduce((a, b) => a + b, 0);

  const uncertaintyComponentScores = [
    1 - consistency.score * 0.2,
    1 - themes.score * 0.2,
    1 - specialization.score * 0.15,
    1 - recommendations.score * 0.15,
    uncertainty.score * 0.3,
  ];
  const uncertaintyScore = Math.max(
    0,
    Math.min(1, uncertaintyComponentScores.reduce((a, b) => a + b, 0))
  );

  let confidenceLevel: ConfidenceLevel;
  if (journey.completedQuizzes === 0) {
    confidenceLevel = "emerging";
  } else if (confidenceScore >= 0.8) {
    confidenceLevel = "high";
  } else if (confidenceScore >= 0.6) {
    confidenceLevel = "medium";
  } else {
    confidenceLevel = "low";
  }

  let uncertaintyLevel: UncertaintyLevel;
  if (uncertaintyScore >= 0.6) {
    uncertaintyLevel = "high";
  } else if (uncertaintyScore >= 0.35) {
    uncertaintyLevel = "medium";
  } else {
    uncertaintyLevel = "low";
  }

  let explorationStatus: ExplorationStatus;
  const themeCount = Object.values(journey.repeatedThemes).filter((v) => v > 0).length;
  const maxTheme = Math.max(...Object.values(journey.repeatedThemes), 0);

  if (themeCount > 4 || maxTheme < 2) {
    explorationStatus = "exploring";
  } else if (themeCount <= 2 && maxTheme >= 4) {
    explorationStatus = "converging";
  } else if (specialization.score > 0.8) {
    explorationStatus = "stable";
  } else {
    explorationStatus = "narrowing";
  }

  const recommendationStability: RecommendationStability = recommendations.signals[0]?.value
    ? recommendations.signals[0].value > 0.75
      ? "stable"
      : recommendations.signals[0].value > 0.5
      ? "developing"
      : "volatile"
    : "developing";

  let profileMaturity: ProfileMaturity;
  if (journey.completedQuizzes === 0) {
    profileMaturity = "emerging";
  } else if (journey.completedQuizzes === 1) {
    profileMaturity = "emerging";
  } else if (journey.completedQuizzes <= 3 && confidenceScore < 0.7) {
    profileMaturity = "developing";
  } else if (journey.completedQuizzes <= 3) {
    profileMaturity = "developing";
  } else if (confidenceScore > 0.8 && explorationStatus === "converging") {
    profileMaturity = "mature";
  } else if (confidenceScore > 0.75) {
    profileMaturity = "evolved";
  } else {
    profileMaturity = "developing";
  }

  let trendDirection: TrendDirection;
  if (consistency.score > 0.8) {
    trendDirection = consistency.score >= 0.9 ? "stable" : "improving";
  } else if (specialization.score >= 0.8) {
    trendDirection = "improving";
  } else if (specialization.score < 0.3) {
    trendDirection = "fluctuating";
  } else {
    trendDirection = "stable";
  }

  const confidenceNarrative = buildConfidenceNarrative(confidenceLevel, confidenceScore, allSignals);
  const uncertaintyNarrative = buildUncertaintyNarrative(uncertaintyLevel, explorationStatus, allSignals);
  const explorationNarrative = buildExplorationNarrative(explorationStatus, journey);
  const recommendationNarrative = buildRecommendationNarrative(explorationStatus, profileMaturity, recommendations.signals);
  const evolutionNarrative = buildEvolutionNarrative(profileMaturity, trendDirection, journey);
  const nextSteps = generateNextSteps(explorationStatus, profileMaturity, confidenceLevel, journey);

  return {
    confidenceLevel,
    confidenceScore,
    uncertaintyLevel,
    uncertaintyScore,
    explorationStatus,
    recommendationStability,
    profileMaturity,
    trendDirection,
    signals: allSignals,
    confidenceNarrative,
    uncertaintyNarrative,
    explorationNarrative,
    recommendationNarrative,
    evolutionNarrative,
    nextSteps,
  };
}

function buildConfidenceNarrative(
  level: ConfidenceLevel,
  score: number,
  signals: ConfidenceSignal[]
): string {
  const positiveSignals = signals.filter((s) => s.impact === "positive").slice(0, 2);

  if (level === "emerging") {
    return "Your profile is just starting to form. Complete a quiz to begin building confidence in your recommendations.";
  }

  if (level === "high") {
    const signalText = positiveSignals.map((s) => s.explanation).join(" ");
    return `Your signals have remained highly consistent across sessions and repeatedly favor your core interests. ${signalText}`;
  }

  if (level === "medium") {
    return "Your profile is becoming clear, though some exploration remains. Your top recommendations are emerging, but you may discover new directions.";
  }

  return "Your profile is still forming. Continue exploring careers and retaking quizzes to sharpen your direction.";
}

function buildUncertaintyNarrative(
  level: UncertaintyLevel,
  status: ExplorationStatus,
  signals: ConfidenceSignal[]
): string {
  if (level === "low") {
    return "Uncertainty is minimal. Your profile shows clear, consistent signals.";
  }

  if (level === "medium") {
    if (status === "exploring") {
      return "You are actively exploring multiple directions. This breadth is expected and valuable during discovery.";
    }
    return "Some uncertainty remains as you evaluate different paths. This is normal during profile development.";
  }

  return "Significant exploration is underway across multiple themes and career paths. Let your interests continue to crystallize.";
}

function buildExplorationNarrative(status: ExplorationStatus, journey: JourneyMemory): string {
  const viewedCareers = Object.keys(journey.viewedCareers).length;

  if (status === "exploring") {
    return `You are actively exploring multiple directions across different domains. You have viewed ${viewedCareers} careers. Continue this broad search to discover surprising connections.`;
  }

  if (status === "narrowing") {
    return `Your interests are beginning to narrow toward specific domains. You have viewed ${viewedCareers} careers and are starting to focus your attention.`;
  }

  if (status === "converging") {
    return `Your profile is converging toward specific roles. The exploration phase is crystallizing into a clearer direction.`;
  }

  return `Your exploration pattern has stabilized. You have a clear sense of your direction and are deep into specific career paths.`;
}

function buildRecommendationNarrative(
  status: ExplorationStatus,
  maturity: ProfileMaturity,
  signals: ConfidenceSignal[]
): string {
  if (status === "exploring" || maturity === "emerging") {
    return "Your recommendations may evolve significantly as you continue exploring and refining your profile.";
  }

  if (status === "converging" || status === "stable") {
    return "Your recommendations are becoming more stable and precise as your profile matures.";
  }

  return "Your recommendations reflect your current profile signals and will continue to evolve with your journey.";
}

function buildEvolutionNarrative(maturity: ProfileMaturity, trend: TrendDirection, journey: JourneyMemory): string {
  if (maturity === "emerging") {
    return `Your profile is just beginning. You are on session 1 of a multi-session journey. Each additional session will strengthen your signals.`;
  }

  if (trend === "improving") {
    return `Your profile is rapidly improving. Your signals are becoming more consistent and specialized with each session.`;
  }

  if (trend === "stable") {
    if (maturity === "mature" || maturity === "evolved") {
      return `Your profile has stabilized into a mature, well-defined career direction. Your signals are reliable and consistent.`;
    }
    return `Your profile is stable. Continue exploring to deepen your specialization or test alternative directions.`;
  }

  return `Your profile is fluctuating as you test different possibilities. This is a normal part of career exploration.`;
}

function generateNextSteps(
  status: ExplorationStatus,
  maturity: ProfileMaturity,
  level: ConfidenceLevel,
  journey: JourneyMemory
): string[] {
  const steps: string[] = [];

  if (level === "emerging") {
    steps.push("Take your first career alignment quiz to establish your baseline signals.");
    return steps;
  }

  if (status === "exploring") {
    steps.push("Continue exploring careers across different domains to map your full interest landscape.");
    steps.push("Compare careers that seem different but appeal to you—this reveals hidden connections.");
  } else if (status === "narrowing") {
    steps.push("Dive deeper into your top 2-3 career focuses through learning roadmaps.");
    steps.push("Narrow your exploration to test your commitment to your emerging preferences.");
  } else if (status === "converging") {
    steps.push("Explore adjacent roles and specializations within your chosen domain.");
    steps.push("Start building skills through your personalized learning roadmap.");
  } else {
    steps.push("Consider depth expansion: explore leadership, management, or specialization paths.");
    steps.push("Revisit your quiz periodically (every 6-12 months) to ensure your direction still fits.");
  }

  if (maturity === "developing" && journey.completedQuizzes < 3) {
    steps.push("Retake the quiz after exploring careers to validate or refine your signals.");
  }

  return steps;
}

export function getConfidenceSummary(metrics: ConfidenceMetrics): string {
  const parts = [
    `Confidence: ${metrics.confidenceLevel.charAt(0).toUpperCase() + metrics.confidenceLevel.slice(1)} (${Math.round(metrics.confidenceScore * 100)}%)`,
    `Exploring: ${metrics.explorationStatus.charAt(0).toUpperCase() + metrics.explorationStatus.slice(1)}`,
  ];
  return parts.join(" • ");
}

export function getTopConfidenceSignals(metrics: ConfidenceMetrics, count: number = 3): ConfidenceSignal[] {
  return metrics.signals.filter((s) => s.impact === "positive").slice(0, count);
}

export function getTopUncertaintySignals(metrics: ConfidenceMetrics, count: number = 2): ConfidenceSignal[] {
  return metrics.signals.filter((s) => s.impact === "negative").slice(0, count);
}

/**
 * Legacy backward-compatible function (deprecated: use generateConfidenceMetrics instead)
 */
export function buildConfidenceInsights(memory: JourneyMemory, enhancedProfile?: EnhancedProfile): ConfidenceInsights {
  const metrics = generateConfidenceMetrics(memory, enhancedProfile);

  return {
    confidenceLevel: metrics.confidenceLevel.charAt(0).toUpperCase() + metrics.confidenceLevel.slice(1),
    uncertaintyLevel: metrics.uncertaintyLevel.charAt(0).toUpperCase() + metrics.uncertaintyLevel.slice(1),
    explorationStatus: metrics.explorationNarrative,
    recommendationStability: metrics.recommendationNarrative,
    profileMaturity: metrics.evolutionNarrative,
    trendConfidence: metrics.trendDirection.charAt(0).toUpperCase() + metrics.trendDirection.slice(1),
  };
}
