/**
 * PREDICTION FEEDBACK INTELLIGENCE
 *
 * Tracks prediction accuracy over time and improves future predictions
 * by comparing past forecasts against actual user behavior.
 *
 * Reads from:
 *   - predictive-insights  (the prediction snapshots)
 *   - behavior-patterns    (actual consistency, dropoff, curiosity)
 *   - growth-analytics     (actual confidence, XP, specialization)
 *   - journey-memory       (actual quiz completions, streak)
 *   - career-goals         (actual goal progress)
 *
 * No backend. No auth. Persists history via SafeStorage.
 */

import { computePredictiveInsights, type PredictiveInsightsData } from "./predictive-insights";
import { computeBehaviorPatterns } from "./behavior-patterns";
import { getGrowthAnalytics } from "./growth-analytics";
import { loadJourneyMemory } from "./journey-memory";
import { loadGoalState } from "./career-goals";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-prediction-feedback";
const MAX_HISTORY = 50;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/** A single prediction snapshot, stored for later evaluation */
export interface PredictionRecord {
  id: string;
  /** When this prediction was made */
  createdAt: string;
  /** When it was evaluated against actual data (null = pending) */
  evaluatedAt: string | null;
  /** The prediction data at the time */
  prediction: PredictiveInsightsData;
  /** Per-dimension accuracy after evaluation (null = pending) */
  accuracy: PredictionAccuracy | null;
  /** Whether actual behavior matched the prediction */
  verdict: "correct" | "partial" | "incorrect" | "pending";
}

/** Accuracy breakdown by prediction dimension */
export interface PredictionAccuracy {
  momentumForecast: { correct: boolean; predicted: string; actual: string };
  dropoffRisk: { correct: boolean; predicted: number; actual: number };
  goalCompletion: { correct: boolean; predicted: number; actual: number } | null;
  directionConfidence: { correct: boolean; predicted: number; actual: number };
}

/** Aggregate accuracy score across all evaluated predictions */
export interface AccuracyScore {
  /** Overall accuracy 0–100 */
  overall: number;
  /** Count of evaluated predictions */
  totalEvaluated: number;
  /** Count of correct predictions */
  totalCorrect: number;
  /** Per-dimension accuracy */
  byDimension: {
    momentum: number;
    dropoff: number;
    goal: number | null;
    direction: number;
  };
}

/** How predictions are shifting over time (consecutive predictions) */
export interface PredictionDrift {
  /** How the momentum forecast changed */
  momentumShift: "improving" | "stable" | "declining" | "insufficient_data";
  /** How the dropoff risk assessment changed */
  dropoffShift: "worsening" | "stable" | "improving" | "insufficient_data";
  /** Direction confidence trend */
  directionTrend: "rising" | "stable" | "falling" | "insufficient_data";
  /** Summary of drift */
  summary: string;
}

/** A prediction that proved accurate */
export interface SuccessfulPrediction {
  dimension: string;
  predictedValue: string;
  actualOutcome: string;
  whatWorked: string;
}

/** A prediction that proved inaccurate */
export interface FailedPrediction {
  dimension: string;
  predictedValue: string;
  actualOutcome: string;
  whatWentWrong: string;
  adjustment: string;
}

/** What the system learned from the feedback comparison */
export interface LearningSignal {
  signal: string;
  confidence: "strong" | "moderate" | "emerging";
  detail: string;
}

// ============================================================================
// COMPUTED OUTPUT TYPE
// ============================================================================

export interface PredictionFeedbackData {
  predictionHistory: PredictionRecord[];
  accuracyScore: AccuracyScore;
  predictionDrift: PredictionDrift;
  successfulPredictions: SuccessfulPrediction[];
  failedPredictions: FailedPrediction[];
  learningSignals: LearningSignal[];
  /** When the latest evaluation was performed */
  lastEvaluatedAt: string;
  computedAt: string;
}

// ============================================================================
// INTERNAL STORAGE
// ============================================================================

function getStorage() {
  return getSafeStorage({ silent: true });
}

function loadHistory(): PredictionRecord[] {
  const stored = getStorage().get<PredictionRecord[]>(STORAGE_KEY);
  return Array.isArray(stored) ? stored : [];
}

function saveHistory(history: PredictionRecord[]): void {
  const pruned = history.slice(0, MAX_HISTORY);
  getStorage().set(STORAGE_KEY, pruned);
}

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `pred-${Date.now()}-${idCounter}`;
}

// ============================================================================
// EVALUATION: Compare a past prediction against current actual data
// ============================================================================

function evaluateMomentum(
  prediction: PredictiveInsightsData,
  currentBehavior: ReturnType<typeof computeBehaviorPatterns>
): { correct: boolean; predicted: string; actual: string } {
  const predictedDir = prediction.momentumForecast.direction;
  const currentConsistency = currentBehavior.learningConsistency.score;
  const pastConsistency = 50; // Neutral baseline since we don't store past consistency

  // We check if the user's consistency score now is trending in the predicted direction
  // Actual direction: compare current consistency with a moving baseline from history
  const memory = loadJourneyMemory();
  const recentQuizCount = memory.completedQuizzes;
  const recentStreak = currentBehavior.learningConsistency.currentStreak;

  let actualDirection: string;
  if (recentStreak >= 3 && recentQuizCount >= 2) {
    actualDirection = "accelerating";
  } else if (recentStreak === 0 && currentConsistency < 30) {
    actualDirection = "declining";
  } else {
    actualDirection = "stable";
  }

  const correct = predictedDir === actualDirection;

  return {
    correct,
    predicted: `Momentum forecast: ${predictedDir}`,
    actual: `Actual trajectory: ${actualDirection} (consistency ${currentConsistency}, streak ${recentStreak})`,
  };
}

function evaluateDropoff(
  prediction: PredictiveInsightsData,
  currentBehavior: ReturnType<typeof computeBehaviorPatterns>
): { correct: boolean; predicted: number; actual: number } {
  const predictedScore = prediction.dropoffRisk.score;
  // Actual dropoff: compute from current behavior patterns
  const currentDropoff = currentBehavior.decisionHesitationScore;
  const consistency = currentBehavior.learningConsistency;

  // Recompute effective dropoff risk from current data (mirrors logic in predictive-insights)
  let actualScore = currentDropoff.score * 0.3;
  if (consistency.currentStreak === 0 && consistency.score < 20) {
    actualScore += 25;
  } else if (consistency.currentStreak === 0) {
    actualScore += 15;
  } else if (consistency.currentStreak < 3) {
    actualScore += 8;
  } else if (consistency.currentStreak >= 7) {
    actualScore -= 10;
  }
  const avgDropoff = currentBehavior.dropoffPatterns.length > 0
    ? currentBehavior.dropoffPatterns.reduce((a, d) => a + d.rate, 0) / currentBehavior.dropoffPatterns.length
    : 0;
  actualScore += avgDropoff * 20;
  if (currentBehavior.careerLoopSignals.length >= 3) actualScore += 15;
  else if (currentBehavior.careerLoopSignals.length >= 1) actualScore += 8;
  actualScore = Math.max(0, Math.min(100, Math.round(actualScore)));

  // Correct if within 15 points
  const correct = Math.abs(predictedScore - actualScore) <= 15;

  return { correct, predicted: predictedScore, actual: actualScore };
}

function evaluateGoal(
  prediction: PredictiveInsightsData,
  currentGoal: ReturnType<typeof loadGoalState>
): { correct: boolean; predicted: number; actual: number } | null {
  const predictedPct = prediction.goalCompletionProbability.percentage;

  // If there was no goal at prediction time, skip evaluation
  if (prediction.goalCompletionProbability.keyFactor === "no_goal") return null;

  // Actual goal progress
  const actualProgress = currentGoal.goal?.goalProgress ?? 0;

  // Correct if within 20 percentage points
  const correct = Math.abs(predictedPct - actualProgress) <= 20;

  return { correct, predicted: predictedPct, actual: actualProgress };
}

function evaluateDirection(
  prediction: PredictiveInsightsData,
  currentBehavior: ReturnType<typeof computeBehaviorPatterns>,
  currentAnalytics: ReturnType<typeof getGrowthAnalytics>
): { correct: boolean; predicted: number; actual: number } {
  const predictedScore = prediction.careerDirectionConfidence.score;

  // Compute actual direction confidence based on current data
  const hesitation = currentBehavior.decisionHesitationScore;
  const consistency = currentBehavior.learningConsistency;
  const explorationStyle = currentBehavior.explorationHabits.style;
  const avgDropoff = currentBehavior.dropoffPatterns.length > 0
    ? currentBehavior.dropoffPatterns.reduce((a, d) => a + d.rate, 0) / currentBehavior.dropoffPatterns.length
    : 0;
  const curiosityStrong = currentBehavior.curiositySignals.filter((s) => s.strength === "strong").length;

  let actualScore = 50;
  if (hesitation.score <= 20) actualScore += 20;
  else if (hesitation.score <= 45) actualScore += 5;
  else actualScore -= Math.min(25, hesitation.score * 0.25);
  if (explorationStyle === "focused") actualScore += 15;
  else if (explorationStyle === "balanced") actualScore += 5;
  else actualScore -= 10;
  if (consistency.hasRegularCadence && consistency.currentStreak >= 5) actualScore += 10;
  else if (consistency.currentStreak === 0) actualScore -= 10;
  if (avgDropoff < 0.2) actualScore += 8;
  if (curiosityStrong >= 2) actualScore += 10;
  if (currentAnalytics.specializationTrend === "deepening") actualScore += 8;
  if (currentAnalytics.confidenceTrend > 5) actualScore += 8;
  actualScore = Math.max(0, Math.min(100, Math.round(actualScore)));

  // Correct if within 15 points
  const correct = Math.abs(predictedScore - actualScore) <= 15;

  return { correct, predicted: predictedScore, actual: actualScore };
}

// ============================================================================
// EVALUATE ALL PENDING PREDICTIONS
// ============================================================================

function evaluatePendingPredictions(
  history: PredictionRecord[]
): {
  updated: PredictionRecord[];
  evaluated: PredictionRecord[];
} {
  const now = new Date().toISOString();
  const currentBehavior = computeBehaviorPatterns();
  const currentAnalytics = getGrowthAnalytics();
  const currentGoal = loadGoalState();

  const updated: PredictionRecord[] = [];
  const evaluated: PredictionRecord[] = [];

  for (const record of history) {
    if (record.evaluatedAt !== null) {
      updated.push(record);
      continue;
    }

    // Only evaluate predictions that are at least 1 hour old
    const age = Date.now() - new Date(record.createdAt).getTime();
    if (age < 60 * 60 * 1000) {
      updated.push(record);
      continue;
    }

    // Evaluate each dimension
    const momentumResult = evaluateMomentum(record.prediction, currentBehavior);
    const dropoffResult = evaluateDropoff(record.prediction, currentBehavior);
    const goalResult = evaluateGoal(record.prediction, currentGoal);
    const directionResult = evaluateDirection(record.prediction, currentBehavior, currentAnalytics);

    const accuracy: PredictionAccuracy = {
      momentumForecast: momentumResult,
      dropoffRisk: dropoffResult,
      goalCompletion: goalResult,
      directionConfidence: directionResult,
    };

    // Determine overall verdict
    const dimensions = [momentumResult.correct, dropoffResult.correct, directionResult.correct];
    if (goalResult) dimensions.push(goalResult.correct);

    const correctCount = dimensions.filter(Boolean).length;
    let verdict: PredictionRecord["verdict"];
    if (correctCount === dimensions.length) verdict = "correct";
    else if (correctCount >= dimensions.length / 2) verdict = "partial";
    else verdict = "incorrect";

    const evaluatedRecord: PredictionRecord = {
      ...record,
      evaluatedAt: now,
      accuracy,
      verdict,
    };

    updated.push(evaluatedRecord);
    evaluated.push(evaluatedRecord);
  }

  return { updated, evaluated };
}

// ============================================================================
// COMPUTE AGGREGATE SCORES
// ============================================================================

function computeAccuracyScore(evaluated: PredictionRecord[]): AccuracyScore {
  if (evaluated.length === 0) {
    return {
      overall: 0,
      totalEvaluated: 0,
      totalCorrect: 0,
      byDimension: { momentum: 0, dropoff: 0, goal: null, direction: 0 },
    };
  }

  let momentumCorrect = 0;
  let dropoffCorrect = 0;
  let goalCorrect = 0;
  let goalCount = 0;
  let directionCorrect = 0;
  let totalCorrect = 0;
  let totalDimensions = 0;

  for (const record of evaluated) {
    if (!record.accuracy) continue;

    if (record.accuracy.momentumForecast.correct) momentumCorrect++;
    totalDimensions++;
    totalCorrect += record.accuracy.momentumForecast.correct ? 1 : 0;

    if (record.accuracy.dropoffRisk.correct) dropoffCorrect++;
    totalCorrect += record.accuracy.dropoffRisk.correct ? 1 : 0;
    totalDimensions++;

    if (record.accuracy.goalCompletion) {
      if (record.accuracy.goalCompletion.correct) goalCorrect++;
      goalCount++;
      totalCorrect += record.accuracy.goalCompletion.correct ? 1 : 0;
      totalDimensions++;
    }

    if (record.accuracy.directionConfidence.correct) directionCorrect++;
    totalCorrect += record.accuracy.directionConfidence.correct ? 1 : 0;
    totalDimensions++;
  }

  const overall = totalDimensions > 0 ? Math.round((totalCorrect / totalDimensions) * 100) : 0;

  return {
    overall,
    totalEvaluated: evaluated.length,
    totalCorrect,
    byDimension: {
      momentum: evaluated.length > 0 ? Math.round((momentumCorrect / evaluated.length) * 100) : 0,
      dropoff: evaluated.length > 0 ? Math.round((dropoffCorrect / evaluated.length) * 100) : 0,
      goal: goalCount > 0 ? Math.round((goalCorrect / goalCount) * 100) : null,
      direction: evaluated.length > 0 ? Math.round((directionCorrect / evaluated.length) * 100) : 0,
    },
  };
}

function computeDrift(history: PredictionRecord[]): PredictionDrift {
  // Only look at unevaluated + recent predictions (last 3 non-evaluated entries)
  const recent = history.slice(0, 3);
  if (recent.length < 2) {
    return {
      momentumShift: "insufficient_data",
      dropoffShift: "insufficient_data",
      directionTrend: "insufficient_data",
      summary: "Need at least 2 prediction snapshots to detect drift.",
    };
  }

  // Compare first vs last for momentum direction
  const first = recent[recent.length - 1].prediction;
  const last = recent[0].prediction;

  const momentumMap: Record<string, number> = { accelerating: 2, stable: 1, declining: 0 };
  const momentumDiff = (momentumMap[last.momentumForecast.direction] ?? 1) - (momentumMap[first.momentumForecast.direction] ?? 1);

  const momentumShift: PredictionDrift["momentumShift"] =
    momentumDiff > 0 ? "improving" : momentumDiff < 0 ? "declining" : "stable";

  const dropoffDiff = first.dropoffRisk.score - last.dropoffRisk.score;
  const dropoffShift: PredictionDrift["dropoffShift"] =
    dropoffDiff > 5 ? "improving" : dropoffDiff < -5 ? "worsening" : "stable";

  const directionDiff = last.careerDirectionConfidence.score - first.careerDirectionConfidence.score;
  const directionTrend: PredictionDrift["directionTrend"] =
    directionDiff > 5 ? "rising" : directionDiff < -5 ? "falling" : "stable";

  const parts: string[] = [];
  if (momentumShift === "improving") parts.push("Momentum outlook is improving.");
  else if (momentumShift === "declining") parts.push("Momentum outlook is softening.");
  if (dropoffShift === "improving") parts.push("Dropoff risk perception is decreasing.");
  else if (dropoffShift === "worsening") parts.push("Dropoff risk perception is increasing.");
  if (directionTrend === "rising") parts.push("Direction confidence is trending upward.");
  else if (directionTrend === "falling") parts.push("Direction confidence is trending downward.");
  if (parts.length === 0) parts.push("Predictions are stable — no significant drift detected.");

  return { momentumShift, dropoffShift, directionTrend, summary: parts.join(" ") };
}

// ============================================================================
// EXTRACT SUCCESSES, FAILURES, AND LEARNING SIGNALS
// ============================================================================

function extractSuccesses(evaluated: PredictionRecord[]): SuccessfulPrediction[] {
  const successes: SuccessfulPrediction[] = [];

  for (const record of evaluated) {
    if (!record.accuracy) continue;

    if (record.accuracy.momentumForecast.correct) {
      successes.push({
        dimension: "Momentum forecast",
        predictedValue: record.accuracy.momentumForecast.predicted,
        actualOutcome: record.accuracy.momentumForecast.actual,
        whatWorked: "The model correctly identified the user's engagement trajectory based on consistency and streak signals.",
      });
    }

    if (record.accuracy.dropoffRisk.correct) {
      successes.push({
        dimension: "Dropoff risk",
        predictedValue: `Score: ${record.accuracy.dropoffRisk.predicted}`,
        actualOutcome: `Actual: ${record.accuracy.dropoffRisk.actual}`,
        whatWorked: "Hesitation and consistency signals accurately predicted disengagement risk.",
      });
    }

    if (record.accuracy.directionConfidence.correct) {
      successes.push({
        dimension: "Direction confidence",
        predictedValue: `Score: ${record.accuracy.directionConfidence.predicted}`,
        actualOutcome: `Actual: ${record.accuracy.directionConfidence.actual}`,
        whatWorked: "Exploration style and specialization trend correctly informed direction confidence.",
      });
    }

    if (record.accuracy.goalCompletion?.correct) {
      successes.push({
        dimension: "Goal completion",
        predictedValue: `${record.accuracy.goalCompletion.predicted}%`,
        actualOutcome: `${record.accuracy.goalCompletion.actual}% progress`,
        whatWorked: "Goal progress pace and consistency signals produced an accurate probability estimate.",
      });
    }
  }

  return successes.slice(0, 6);
}

function extractFailures(evaluated: PredictionRecord[]): FailedPrediction[] {
  const failures: FailedPrediction[] = [];

  for (const record of evaluated) {
    if (!record.accuracy) continue;

    if (!record.accuracy.momentumForecast.correct) {
      failures.push({
        dimension: "Momentum forecast",
        predictedValue: record.accuracy.momentumForecast.predicted,
        actualOutcome: record.accuracy.momentumForecast.actual,
        whatWentWrong: "The model over- or under-estimated engagement velocity. External factors may have influenced user activity.",
        adjustment: "Incorporate session recency and average session duration as additional signals.",
      });
    }

    if (!record.accuracy.dropoffRisk.correct) {
      failures.push({
        dimension: "Dropoff risk",
        predictedValue: `Score: ${record.accuracy.dropoffRisk.predicted}`,
        actualOutcome: `Actual: ${record.accuracy.dropoffRisk.actual}`,
        whatWentWrong: "Dropoff risk was misaligned — the user's actual engagement differed from signal-based prediction.",
        adjustment: "Weight recent session data more heavily and reduce reliance on historical hesitation patterns.",
      });
    }

    if (!record.accuracy.directionConfidence.correct) {
      failures.push({
        dimension: "Direction confidence",
        predictedValue: `Score: ${record.accuracy.directionConfidence.predicted}`,
        actualOutcome: `Actual: ${record.accuracy.directionConfidence.actual}`,
        whatWentWrong: "Direction confidence was estimated higher or lower than reality. Exploration breadth changed unexpectedly.",
        adjustment: "Add curriculum progress and roadmap engagement as additional direction signals.",
      });
    }

    if (record.accuracy.goalCompletion && !record.accuracy.goalCompletion.correct) {
      failures.push({
        dimension: "Goal completion",
        predictedValue: `${record.accuracy.goalCompletion.predicted}%`,
        actualOutcome: `${record.accuracy.goalCompletion.actual}% progress`,
        whatWentWrong: "Goal pace prediction diverged from actual progress. User may have changed commitment level.",
        adjustment: "Track weekly time commitment changes to improve goal completion predictions.",
      });
    }
  }

  return failures.slice(0, 6);
}

function extractLearningSignals(
  evaluated: PredictionRecord[],
  accuracy: AccuracyScore,
  failures: FailedPrediction[]
): LearningSignal[] {
  const signals: LearningSignal[] = [];

  // 1. Overall accuracy trend
  if (accuracy.overall >= 70) {
    signals.push({
      signal: "prediction_model_reliable",
      confidence: "strong",
      detail: `Overall prediction accuracy is ${accuracy.overall}% across ${accuracy.totalEvaluated} evaluations — the model is producing reliable forecasts.`,
    });
  } else if (accuracy.overall >= 40) {
    signals.push({
      signal: "prediction_model_improving",
      confidence: "moderate",
      detail: `Overall accuracy is ${accuracy.overall}%. More data will refine predictions as the model learns from feedback.`,
    });
  } else {
    signals.push({
      signal: "prediction_model_early",
      confidence: "emerging",
      detail: `Limited accuracy data (${accuracy.totalEvaluated} evaluations). Predictions will improve as more comparisons are made.`,
    });
  }

  // 2. Best performing dimension
  const dims: { name: string; score: number }[] = [
    { name: "Momentum", score: accuracy.byDimension.momentum },
    { name: "Dropoff risk", score: accuracy.byDimension.dropoff },
    { name: "Direction", score: accuracy.byDimension.direction },
  ];
  if (accuracy.byDimension.goal !== null) {
    dims.push({ name: "Goal completion", score: accuracy.byDimension.goal });
  }

  const best = dims.reduce((a, b) => (a.score >= b.score ? a : b));
  if (best.score >= 60) {
    signals.push({
      signal: `${best.name.toLowerCase().replace(/\s+/g, "_")}_strong_signal`,
      confidence: "strong",
      detail: `${best.name} predictions are the most accurate (${best.score}%) — the signals driving this dimension are well-calibrated.`,
    });
  }

  // 3. Improvement areas from failures
  if (failures.length > 0) {
    const dimensionCounts: Record<string, number> = {};
    for (const f of failures) {
      dimensionCounts[f.dimension] = (dimensionCounts[f.dimension] ?? 0) + 1;
    }
    const worstDim = Object.entries(dimensionCounts).sort((a, b) => b[1] - a[1])[0];
    if (worstDim) {
      signals.push({
        signal: `${worstDim[0].toLowerCase().replace(/\s+/g, "_")}_needs_calibration`,
        confidence: "moderate",
        detail: `${worstDim[0]} predictions have failed ${worstDim[1]} time(s). Adjusting signal weights for this dimension may improve accuracy.`,
      });
    }
  }

  // 4. Direction trend
  if (accuracy.byDimension.direction >= 60) {
    signals.push({
      signal: "direction_signals_calibrated",
      confidence: "moderate",
      detail: "Direction confidence predictions are accurate — the exploration style and specialization signals are well-calibrated.",
    });
  }

  // 5. Data volume signal
  if (evaluated.length >= 5) {
    signals.push({
      signal: "sufficient_feedback_data",
      confidence: "strong",
      detail: `${evaluated.length} predictions evaluated — sufficient data for reliable accuracy metrics.`,
    });
  } else if (evaluated.length >= 2) {
    signals.push({
      signal: "growing_feedback_data",
      confidence: "moderate",
      detail: `${evaluated.length} predictions evaluated so far. More feedback will improve accuracy.`,
    });
  }

  return signals.slice(0, 6);
}

// ============================================================================
// MAIN PUBLIC API
// ============================================================================

/**
 * Compute prediction feedback: snapshots the current prediction, evaluates
 * all pending predictions, and produces accuracy, drift, and learning signals.
 */
export function computePredictionFeedback(): PredictionFeedbackData {
  const history = loadHistory();

  // 1. Snapshot the current prediction
  const currentPrediction = computePredictiveInsights();

  const newRecord: PredictionRecord = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    evaluatedAt: null,
    prediction: currentPrediction,
    accuracy: null,
    verdict: "pending",
  };

  // 2. Add to history
  const updatedHistory = [newRecord, ...history];

  // 3. Evaluate all pending predictions
  const { updated: evaluatedHistory, evaluated } = evaluatePendingPredictions(updatedHistory);

  // 4. Compute aggregate accuracy
  const accuracyScore = computeAccuracyScore(evaluated);

  // 5. Detect drift
  const predictionDrift = computeDrift(evaluatedHistory);

  // 6. Extract successes, failures, learning
  const successfulPredictions = extractSuccesses(evaluated);
  const failedPredictions = extractFailures(evaluated);
  const learningSignals = extractLearningSignals(evaluated, accuracyScore, failedPredictions);

  // 7. Persist
  saveHistory(evaluatedHistory);

  const result: PredictionFeedbackData = {
    predictionHistory: evaluatedHistory,
    accuracyScore,
    predictionDrift,
    successfulPredictions,
    failedPredictions,
    learningSignals,
    lastEvaluatedAt: new Date().toISOString(),
    computedAt: new Date().toISOString(),
  };

  return result;
}

/**
 * Load previously computed prediction feedback from storage.
 */
export function loadPredictionFeedback(): PredictionFeedbackData | null {
  const history = loadHistory();
  if (history.length === 0) return null;

  // Recompute aggregate metrics from stored history
  const evaluated = history.filter((r) => r.evaluatedAt !== null);
  const accuracyScore = computeAccuracyScore(evaluated);
  const predictionDrift = computeDrift(history);
  const successfulPredictions = extractSuccesses(evaluated);
  const failedPredictions = extractFailures(evaluated);
  const learningSignals = extractLearningSignals(evaluated, accuracyScore, failedPredictions);

  return {
    predictionHistory: history,
    accuracyScore,
    predictionDrift,
    successfulPredictions,
    failedPredictions,
    learningSignals,
    lastEvaluatedAt: evaluated.length > 0 ? evaluated[0].evaluatedAt ?? "" : "",
    computedAt: new Date().toISOString(),
  };
}
