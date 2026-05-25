/**
 * DECISION READINESS INTELLIGENCE (v2)
 *
 * Answers: "Are you actually ready to choose a career?"
 *
 * Detects:
 *   - Same careers repeatedly compared    → comparisonLoops
 *   - Frequent switching                  → hesitationLevel / clarityTrend
 *   - High uncertainty                    → hesitationLevel
 *   - High exploration breadth            → decisionSignals
 *   - Strong identity consistency         → decisionSignals
 *
 * Reads from:
 *   comparison-history, decision-priority, personal-evolution,
 *   predictive-insights, career-scenarios, recommendation-evolution
 *
 * Behavior:
 *   - Low confidence  → suggest explore
 *   - High confidence → suggest commit
 *
 * Persists via SafeStorage. No backend. No auth.
 */

import { loadComparisonHistory, type ComparisonRecord } from "./comparison-history";
import { getDecisionPriority, type DecisionPriorityData } from "./decision-priority";
import { getPersonalEvolution, type PersonalEvolutionData } from "./personal-evolution";
import { loadPredictiveInsights, computePredictiveInsights, type PredictiveInsightsData } from "./predictive-insights";
import { loadCareerScenarios, type CareerScenarioComparison } from "./career-scenarios";
import { loadRecommendationEvolution, type RecommendationEvolutionData } from "./recommendation-evolution";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-decision-readiness-v2";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type HesitationLevel = "low" | "moderate" | "high";
export type ClarityTrend = "improving" | "stable" | "declining";
export type ChoicePressure = "low" | "medium" | "high";
export type RecommendedAction = "explore" | "compare" | "commit" | "pause";

export interface ComparisonLoop {
  careerA: string;
  careerB: string;
  count: number;
  firstCompared: string;
  lastCompared: string;
}

export interface DecisionSignal {
  type: "positive" | "negative" | "neutral";
  signal: string;
  detail: string;
  source: string;
}

export interface DecisionReadinessData {
  /** Overall readiness to choose a career 0–100 */
  decisionScore: number;
  /** How much the user hesitates between options */
  hesitationLevel: HesitationLevel;
  /** Career pairs that have been compared repeatedly */
  comparisonLoops: ComparisonLoop[];
  /** All detected signals — positive, negative, neutral */
  decisionSignals: DecisionSignal[];
  /** Whether career clarity is improving, stable, or declining */
  clarityTrend: ClarityTrend;
  /** How much pressure the user feels to decide */
  choicePressure: ChoicePressure;
  /** Single recommended action */
  recommendedAction: RecommendedAction;
  /** Human-readable decision narrative */
  decisionNarrative: string;
  computedAt: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ReadinessContext {
  comparisonHistory: ComparisonRecord[];
  priority: DecisionPriorityData;
  evolution: PersonalEvolutionData;
  predictions: PredictiveInsightsData;
  scenarios: CareerScenarioComparison | null;
  recEvolution: RecommendationEvolutionData | null;
}

function gatherContext(): ReadinessContext {
  const comparisonHistory = loadComparisonHistory();
  const priority = getDecisionPriority();
  const evolution = getPersonalEvolution();
  const predictions = loadPredictiveInsights() ?? computePredictiveInsights();
  const scenarios = loadCareerScenarios("");
  const recEvolution = loadRecommendationEvolution();

  return {
    comparisonHistory,
    priority,
    evolution,
    predictions,
    scenarios,
    recEvolution,
  };
}

// ============================================================================
// COMPARISON LOOP DETECTION
// ============================================================================

function detectComparisonLoops(history: ComparisonRecord[]): ComparisonLoop[] {
  if (history.length === 0) return [];

  // Group by career pair (order-independent)
  const pairMap = new Map<string, { a: string; b: string; timestamps: string[] }>();

  for (const rec of history) {
    const key = [rec.careerA, rec.careerB].sort().join("::");
    const existing = pairMap.get(key);
    if (existing) {
      existing.timestamps.push(rec.timestamp);
    } else {
      pairMap.set(key, {
        a: rec.careerA,
        b: rec.careerB,
        timestamps: [rec.timestamp],
      });
    }
  }

  const loops: ComparisonLoop[] = [];
  for (const [, entry] of pairMap) {
    if (entry.timestamps.length >= 2) {
      entry.timestamps.sort();
      loops.push({
        careerA: entry.a,
        careerB: entry.b,
        count: entry.timestamps.length,
        firstCompared: entry.timestamps[0],
        lastCompared: entry.timestamps[entry.timestamps.length - 1],
      });
    }
  }

  // Sort by count descending (most looped first)
  loops.sort((a, b) => b.count - a.count);
  return loops;
}

// ============================================================================
// HESITATION LEVEL
// ============================================================================

function computeHesitationLevel(
  evolution: PersonalEvolutionData,
  predictions: PredictiveInsightsData
): HesitationLevel {
  const confDirection = predictions.careerDirectionConfidence;
  const confScore = confDirection.score;
  const confLevel = confDirection.level;
  const evolutionScore = evolution.evolutionScore;

  // Strong direction + high evolution → low hesitation
  if (confLevel === "strong" && confScore >= 65 && evolutionScore >= 60) {
    return "low";
  }

  // Unclear direction + low evolution → high hesitation
  if (confLevel === "unclear" || confLevel === "early" || evolutionScore < 30) {
    return "high";
  }

  // Moderate → moderate
  return "moderate";
}

// ============================================================================
// CLARITY TREND
// ============================================================================

function computeClarityTrend(
  evolution: PersonalEvolutionData,
  predictions: PredictiveInsightsData
): ClarityTrend {
  const confGrowth = evolution.confidenceGrowth;
  const momentumDir = predictions.momentumForecast.direction;

  // Confidence growing + momentum accelerating → improving
  if (confGrowth > 5 && (momentumDir === "accelerating" || momentumDir === "stable")) {
    return "improving";
  }

  // Confidence declining or momentum declining → declining
  if (confGrowth < -5 || momentumDir === "declining") {
    return "declining";
  }

  return "stable";
}

// ============================================================================
// CHOICE PRESSURE
// ============================================================================

function computeChoicePressure(
  context: ReadinessContext
): ChoicePressure {
  let pressureScore = 0;
  const { comparisonHistory, evolution, predictions, scenarios, priority } = context;

  // Frequent comparisons → pressure
  if (comparisonHistory.length >= 10) pressureScore += 25;
  else if (comparisonHistory.length >= 5) pressureScore += 15;
  else if (comparisonHistory.length >= 3) pressureScore += 8;

  // Looping increases pressure
  const loopCount = detectComparisonLoops(comparisonHistory).length;
  if (loopCount >= 3) pressureScore += 20;
  else if (loopCount >= 1) pressureScore += 10;

  // Priority urgency
  if (priority.urgencyLevel === "high" || priority.urgencyLevel === "critical") {
    pressureScore += 15;
  }

  // Low clarity + high exploration → pressure to figure it out
  if (predictions.careerDirectionConfidence.level === "unclear" && evolution.evolutionScore < 50) {
    pressureScore += 10;
  }

  // Scenarios available but many forks → decision complexity
  if (scenarios && scenarios.careerA) {
    const forks = scenarios.careerA.careerForks?.length ?? 0;
    if (forks >= 3) pressureScore += 8;
  }

  // High identity consistency = less pressure
  if (evolution.evolutionScore >= 70) {
    pressureScore -= 10;
  }

  // Clamp to 0–100 and classify
  if (pressureScore >= 40) return "high";
  if (pressureScore >= 18) return "medium";
  return "low";
}

// ============================================================================
// DECISION SIGNALS
// ============================================================================

function computeDecisionSignals(context: ReadinessContext): DecisionSignal[] {
  const signals: DecisionSignal[] = [];
  const { comparisonHistory, evolution, predictions, scenarios, priority, recEvolution } = context;

  // ── POSITIVE SIGNALS ──

  // Strong identity clarity
  if (predictions.careerDirectionConfidence.level === "strong") {
    signals.push({
      type: "positive",
      signal: "Strong career direction",
      detail: `Career direction confidence is ${predictions.careerDirectionConfidence.score}/100 — you have a clear sense of your path.`,
      source: "predictive-insights",
    });
  }

  // Growing confidence
  if (evolution.confidenceGrowth > 5) {
    signals.push({
      type: "positive",
      signal: "Confidence is growing",
      detail: `Your self-assessment confidence has grown by ${evolution.confidenceGrowth} points since your early sessions.`,
      source: "personal-evolution",
    });
  }

  // High evolution score
  if (evolution.evolutionScore >= 65) {
    signals.push({
      type: "positive",
      signal: "Strong personal evolution",
      detail: `Your evolution score is ${evolution.evolutionScore}/100 — reflecting meaningful growth in self-awareness.`,
      source: "personal-evolution",
    });
  }

  // Recommendation stability
  if (recEvolution && recEvolution.rankingShifts.length <= 3) {
    signals.push({
      type: "positive",
      signal: "Recommendations are stable",
      detail: "Your career recommendation rankings are stable with minimal shifting between snapshots.",
      source: "recommendation-evolution",
    });
  }

  // Scenarios available
  if (scenarios && scenarios.careerA) {
    signals.push({
      type: "positive",
      signal: "Career scenarios available",
      detail: "Year-by-year career projections are available to inform your decision.",
      source: "career-scenarios",
    });
  }

  // ── NEGATIVE SIGNALS ──

  // Looping behavior
  const loops = detectComparisonLoops(comparisonHistory);
  if (loops.length > 0) {
    const topLoop = loops[0];
    signals.push({
      type: "negative",
      signal: "Repeated comparisons without resolution",
      detail: `You've compared ${topLoop.careerA} vs ${topLoop.careerB} ${topLoop.count} times without committing to a direction.`,
      source: "comparison-history",
    });
  }

  // High hesitation
  if (predictions.careerDirectionConfidence.level === "unclear" || predictions.careerDirectionConfidence.level === "early") {
    signals.push({
      type: "negative",
      signal: "Uncertain career direction",
      detail: `Career direction confidence is ${predictions.careerDirectionConfidence.level} — you haven't formed a clear preference yet.`,
      source: "predictive-insights",
    });
  }

  // Low evolution score with many interests → broad exploration without convergence
  if (evolution.evolutionScore < 40 && evolution.interestEvolution.length >= 2) {
    signals.push({
      type: "negative",
      signal: "Broad exploration without narrowing",
      detail: "You're exploring broadly but haven't started converging on a specific path.",
      source: "personal-evolution",
    });
  }

  // High choice pressure
  if (computeChoicePressure(context) === "high") {
    signals.push({
      type: "negative",
      signal: "High decision pressure",
      detail: "Many comparisons and looping patterns suggest pressure to decide, which may lead to rushed choices.",
      source: "decision-readiness",
    });
  }

  // ── NEUTRAL SIGNALS ──

  // Early in journey
  if (evolution.evolutionScore < 25) {
    signals.push({
      type: "neutral",
      signal: "Early exploration phase",
      detail: "You're in the early stages of career exploration. Decision readiness will build naturally with continued engagement.",
      source: "personal-evolution",
    });
  }

  // Moderate hesitation
  if (predictions.careerDirectionConfidence.level === "moderate" && evolution.evolutionScore >= 40) {
    signals.push({
      type: "neutral",
      signal: "Developing direction",
      detail: "Your career direction is forming but not yet crystallized — this is a healthy exploration phase.",
      source: "predictive-insights",
    });
  }

  // Priority maintain mode = everything is fine
  if (priority.focusMode === "maintain" && evolution.evolutionScore >= 50) {
    signals.push({
      type: "neutral",
      signal: "Steady trajectory",
      detail: "All signals are balanced — maintain your current exploration cadence.",
      source: "decision-priority",
    });
  }

  return signals;
}

// ============================================================================
// RECOMMENDED ACTION
// ============================================================================

function computeRecommendedAction(
  score: number,
  hesitation: HesitationLevel,
  loops: ComparisonLoop[],
  clarity: ClarityTrend,
  evolution: PersonalEvolutionData,
  predictions: PredictiveInsightsData
): RecommendedAction {
  const confLevel = predictions.careerDirectionConfidence.level;
  const confScore = predictions.careerDirectionConfidence.score;

  // High hesitation + many loops → explore (broaden before deciding)
  if (hesitation === "high" && loops.length >= 2) {
    return "explore";
  }

  // Low score + low evolution → explore
  if (score < 35 && evolution.evolutionScore < 30) {
    return "explore";
  }

  // Moderate score + moderate hesitation + loops exist → compare
  if (score >= 35 && score < 65 && hesitation === "moderate" && loops.length > 0) {
    return "compare";
  }

  // High score + strong direction + clarity improving → commit
  if (score >= 65 && confLevel === "strong" && clarity !== "declining") {
    return "commit";
  }

  // High pressure + high hesitation → pause (don't decide under pressure)
  const pressure = computeChoicePressure({
    comparisonHistory: [],
    priority: { urgencyLevel: "low", confidenceScore: 50 } as DecisionPriorityData,
    evolution,
    predictions,
    scenarios: null,
    recEvolution: null,
  });
  if (pressure === "high" && hesitation === "high") {
    return "pause";
  }

  // High score + moderate pressure → commit
  if (score >= 75 && confScore >= 70) {
    return "commit";
  }

  // Default: compare (keep evaluating)
  return "compare";
}

// ============================================================================
// DECISION NARRATIVE
// ============================================================================

function buildDecisionNarrative(
  score: number,
  hesitation: HesitationLevel,
  loops: ComparisonLoop[],
  clarity: ClarityTrend,
  pressure: ChoicePressure,
  action: RecommendedAction,
  signals: DecisionSignal[],
  evolution: PersonalEvolutionData,
  predictions: PredictiveInsightsData
): string {
  const parts: string[] = [];

  // Opening — current state
  if (score >= 70) {
    parts.push(`You have a strong foundation for making a career decision (score: ${score}/100).`);
  } else if (score >= 45) {
    parts.push(`You're making progress toward career clarity (score: ${score}/100).`);
  } else {
    parts.push(`You're in an active exploration phase (score: ${score}/100).`);
  }

  // Hesitation
  if (hesitation === "high") {
    parts.push(`Hesitation is high — you're weighing multiple options and haven't found a clear favorite yet.`);
  } else if (hesitation === "low") {
    parts.push(`Hesitation is low — your preferences are becoming clear.`);
  }

  // Loops
  if (loops.length >= 2) {
    parts.push(`You've compared ${loops.length} career pairs multiple times. This suggests genuine interest but also uncertainty between those options.`);
  } else if (loops.length === 1) {
    parts.push(`One career pair stands out in your comparisons — ${loops[0].careerA} vs ${loops[0].careerB}.`);
  }

  // Clarity trend
  if (clarity === "improving") {
    parts.push(`Your direction clarity is improving — keep engaging to accelerate this trend.`);
  } else if (clarity === "declining") {
    parts.push(`Your direction clarity has declined recently — consider taking a step back to reflect on what matters to you.`);
  }

  // Pressure
  if (pressure === "high") {
    parts.push(`Decision pressure is high. Avoid rushing — the best career choice comes from clarity, not urgency.`);
  } else if (pressure === "low") {
    parts.push(`There's no rush to decide — take the time you need to explore thoroughly.`);
  }

  // Recommendation
  switch (action) {
    case "explore":
      parts.push(`Recommended action: Explore more broadly. Look at careers outside your current set to gain perspective before narrowing down.`);
      break;
    case "compare":
      parts.push(`Recommended action: Compare your top options side-by-side. Structured comparison will reveal what matters most to you.`);
      break;
    case "commit":
      parts.push(`Recommended action: You're ready to commit. Your signals are consistent — choose the path that aligns with your strongest preferences.`);
      break;
    case "pause":
      parts.push(`Recommended action: Pause and reflect. The pressure to decide is high but clarity isn't there yet. Take a short break and return with fresh perspective.`);
      break;
  }

  // Closing
  if (predictions.careerDirectionConfidence.level === "strong" && score >= 65) {
    parts.push(`Your career direction is clear and your self-awareness is strong. Trust your signals.`);
  } else if (predictions.careerDirectionConfidence.level === "unclear" && evolution.evolutionScore < 40) {
    parts.push(`You're early in your journey — every quiz, comparison, and career view adds to your self-knowledge.`);
  }

  return parts.join(" ");
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute a full decision readiness assessment focused on career choice.
 */
export function computeDecisionReadiness(): DecisionReadinessData {
  const ctx = gatherContext();
  const { comparisonHistory, evolution, predictions, priority } = ctx;

  // Detect comparison loops
  const comparisonLoops = detectComparisonLoops(comparisonHistory);

  // Compute hesitation level
  const hesitationLevel = computeHesitationLevel(evolution, predictions);

  // Compute clarity trend
  const clarityTrend = computeClarityTrend(evolution, predictions);

  // Compute choice pressure
  const choicePressure = computeChoicePressure(ctx);

  // Compute decision score (0–100)
  let score = 50; // baseline neutral

  // Boost from strong direction confidence
  const confScore = predictions.careerDirectionConfidence.score;
  score += (confScore - 50) * 0.4;

  // Boost from evolution
  score += (evolution.evolutionScore - 50) * 0.3;

  // Penalty from hesitation
  if (hesitationLevel === "high") score -= 15;
  else if (hesitationLevel === "moderate") score -= 5;

  // Penalty from comparison loops
  if (comparisonLoops.length >= 3) score -= 12;
  else if (comparisonLoops.length >= 1) score -= Math.min(10, comparisonLoops.length * 4);

  // Bonus from clarity trend
  if (clarityTrend === "improving") score += 8;
  else if (clarityTrend === "declining") score -= 8;

  // Pressure adjustments
  if (choicePressure === "high") score -= 5;
  else if (choicePressure === "low") score += 3;

  // Confidence from priority
  if (priority.focusMode === "maintain") score += 5;
  else if (priority.focusMode === "challenge") score += 5;
  else if (priority.focusMode === "reduce_workload" || priority.focusMode === "intervention") score -= 10;

  // Clamp
  const decisionScore = Math.max(0, Math.min(100, Math.round(score)));

  // Decision signals
  const decisionSignals = computeDecisionSignals(ctx);

  // Recommended action
  const recommendedAction = computeRecommendedAction(
    decisionScore,
    hesitationLevel,
    comparisonLoops,
    clarityTrend,
    evolution,
    predictions
  );

  // Narrative
  const decisionNarrative = buildDecisionNarrative(
    decisionScore,
    hesitationLevel,
    comparisonLoops,
    clarityTrend,
    choicePressure,
    recommendedAction,
    decisionSignals,
    evolution,
    predictions
  );

  const result: DecisionReadinessData = {
    decisionScore,
    hesitationLevel,
    comparisonLoops,
    decisionSignals,
    clarityTrend,
    choicePressure,
    recommendedAction,
    decisionNarrative,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Load the most recently computed decision readiness assessment.
 */
export function loadDecisionReadiness(): DecisionReadinessData | null {
  const storage = getSafeStorage({ silent: true });
  return storage.get<DecisionReadinessData>(STORAGE_KEY);
}

/**
 * Get the current decision readiness, computing fresh if needed.
 */
export function getDecisionReadiness(): DecisionReadinessData {
  const existing = loadDecisionReadiness();
  if (existing) return existing;
  return computeDecisionReadiness();
}

/**
 * Quick check: is the user ready to commit to a career?
 */
export function isReadyForDecision(): boolean {
  const data = loadDecisionReadiness();
  if (!data) return false;
  return data.recommendedAction === "commit" && data.decisionScore >= 60;
}
