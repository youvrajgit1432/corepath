/**
 * SAFE CONTEXT — typed EMPTY fallback objects
 *
 * Provides safe default values for every module type in the pipeline.
 * These are used when a module's data hasn't been computed yet (store miss)
 * to avoid calling compute functions directly and triggering circular cycles.
 *
 * IMPORTANT: This file imports ZERO types from data modules to prevent
 * circular dependency chains. Consuming modules cast these objects to
 * their proper types at the point of use.
 *
 * Each EMPTY object is designed to NOT crash when its properties are
 * accessed (e.g., `.contradictions`, `.focusMode`, `.trajectoryStrength`).
 *
 * No backend. No auth. Pure client-side computation.
 */

// ============================================================================
// Intelligence Synthesis
// ============================================================================

export const EMPTY_SYNTHESIS = {
  primarySignal: "",
  primaryReason: "",
  urgencyLevel: "low",
  confidence: 50,
  topOpportunity: "",
  topRisk: "",
  contradictions: [],
  actionPlan: [],
  focusMode: "focus",
  summaryNarrative: "",
};

// ============================================================================
// Decision Intelligence
// ============================================================================

export const EMPTY_DECISION = {
  decisionState: "explore",
  decisionOptions: [],
  recommendedDecision: "",
  decisionReason: "",
  decisionTradeoffs: [],
  confidenceLevel: 50,
  waitSignals: [],
  actionIfYes: "",
  actionIfNo: "",
};

// ============================================================================
// Growth Forecast
// ============================================================================

export const EMPTY_GROWTH_FORECAST = {
  forecastState: "compounding",
  days30Prediction: {
    horizon: "30",
    narrative: "",
    projectedMetric: "",
    keyChallenge: "",
    growthProjection: 0,
  },
  days60Prediction: {
    horizon: "60",
    narrative: "",
    projectedMetric: "",
    keyChallenge: "",
    growthProjection: 0,
  },
  days90Prediction: {
    horizon: "90",
    narrative: "",
    projectedMetric: "",
    keyChallenge: "",
    growthProjection: 0,
  },
  trajectoryStrength: 0,
  forecastRisks: [],
  forecastOpportunities: [],
  confidenceScore: 50,
  recommendedLevers: [],
};

// ============================================================================
// Coaching Intelligence
// ============================================================================

export const EMPTY_COACHING = {
  coachingMode: "reflective",
  coachMessage: "",
  focusAdvice: "",
  warnings: [],
  encouragements: [],
  blindSpots: [],
  growthOpportunities: [],
  coachConfidence: 50,
  todayCoaching: "",
};

// ============================================================================
// Action Execution
// ============================================================================

export const EMPTY_ACTION_EXECUTION = {
  executionMode: "fallback",
  actionUrgency: "low",
  next24HourPlan: "",
  microActions: [],
  blockers: [],
  executionConfidence: 50,
  energyFit: "",
  fallbackAction: "",
  executionNarrative: "",
};

// ============================================================================
// Insight Vault
// ============================================================================

export const EMPTY_INSIGHT_VAULT = {
  majorInsights: [],
  beliefShifts: [],
  identityChanges: [],
  decisionBreakthroughs: [],
  recurringPatterns: [],
  confidenceMoments: [],
  vaultScore: 0,
  topInsight: null,
};

// ============================================================================
// Career Story
// ============================================================================

export const EMPTY_CAREER_STORY = {
  storyStage: "early",
  storyArc: "discovery",
  turningPoints: [],
  majorMoments: [],
  growthTheme: "",
  storySignals: [],
  chapterTitle: "",
  momentumScore: 0,
  nextChapterPrediction: "",
  narrativeSummary: "",
};

// ============================================================================
// Progress Reflection
// ============================================================================

export const EMPTY_PROGRESS_REFLECTION = {
  progressRate: 0,
  reflectionTheme: "consistent",
  winsSummary: [],
  growthAreas: [],
  nextMilestone: "",
  reflectionPrompt: "",
  momentumSignal: "steady",
  keyMetric: { label: "", value: "", change: "stable" },
  oneLineReflection: "",
};

// ============================================================================
// Predictive Insights
// ============================================================================

export const EMPTY_PREDICTIVE_INSIGHTS = {
  momentumForecast: {
    direction: "stable",
    predictedRange: [0, 0] as [number, number],
    confidence: 50,
    summary: "",
  },
  dropoffRisk: {
    score: 0,
    level: "low",
    factors: [],
    summary: "",
  },
  goalCompletionProbability: {
    percentage: 0,
    estimatedMonthsRemaining: null,
    keyFactor: "no_goal",
    summary: "",
  },
  careerDirectionConfidence: {
    score: 0,
    level: "early",
    supportingSignals: [],
    summary: "",
  },
  nextWeekPrediction: {
    expectedActivity: "low",
    likelyActions: [],
    watchFor: [],
    forecast: "",
  },
  recommendedIntervention: {
    priority: "low",
    title: "",
    description: "",
    expectedImpact: "",
  },
  futureSignals: [],
  computedAt: "",
};

// ============================================================================
// Achievements
// ============================================================================

export const EMPTY_ACHIEVEMENTS = {
  xp: 0,
  level: 1,
  unlockedAchievements: [],
  lockedAchievements: [],
  activeStreakBonus: 0,
  nextUnlock: null,
  computedAt: "",
};
