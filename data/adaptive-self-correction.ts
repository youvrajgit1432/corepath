/**
 * ADAPTIVE SELF-CORRECTION INTELLIGENCE
 *
 * Answers: "Which recommendations were right, wrong, or becoming inaccurate?"
 *
 * Evaluates prediction accuracy, detects drift, identifies successful and
 * failed interventions, and produces a correction score with improvement
 * actions for the system to self-correct.
 *
 * Sources (8):
 *   - predictive-insights   → momentumForecast, dropoffRisk, goalCompletionProbability
 *   - prediction-feedback   → accuracyScore, predictionDrift, successfulPredictions, failedPredictions
 *   - decision-confidence   → confidenceScore, decisionStability, uncertaintySignals
 *   - mission-intelligence  → missionScore, missionBlocks, missionRisk
 *   - memory-evolution      → thinkingShifts, confidenceEvolution, evolutionScore
 *   - action-execution      → executionMode, executionConfidence, blockers
 *   - journey-memory        → confidenceHistory, completedQuizzes, viewedCareers
 *   - growth-forecast       → trajectoryStrength, confidenceScore, forecastState
 *
 * No backend. No auth. Stateless — computed fresh on each call.
 */

import { computePredictiveInsights, type PredictiveInsightsData } from "./predictive-insights";
import { computePredictionFeedback, type PredictionFeedbackData } from "./prediction-feedback";
import { getDecisionConfidence, type DecisionConfidenceData } from "./decision-confidence";
import { getMissionIntelligence, type MissionIntelligenceData } from "./mission-intelligence";
import { computeMemoryEvolution, type MemoryEvolutionData } from "./memory-evolution";
import { computeActionExecution, type ActionExecutionData } from "./action-execution";
import { loadJourneyMemory } from "./journey-memory";
import { computeGrowthForecast, type GrowthForecastData } from "./growth-forecast";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type CorrectionTrend = "improving" | "stable" | "declining";

export interface AdaptiveSelfCorrectionData {
  /** How prediction accuracy is trending over time */
  predictionAccuracyTrend: CorrectionTrend;
  /** Recommendations that consistently failed or missed */
  recommendationFailures: string[];
  /** Interventions that proved successful */
  successfulInterventions: string[];
  /** Signals that the user's behavior is drifting from predictions */
  driftSignals: string[];
  /** Overall correction score (0–100) — higher = system is well-calibrated */
  correctionScore: number;
  /** How confident the system is in its own model (0–100) */
  modelConfidence: number;
  /** Concrete actions the system should take to improve */
  improvementActions: string[];
  /** Areas where predictions and reality are misaligned */
  misalignmentAreas: string[];
  /** Narrative summary of the self-correction analysis */
  selfCorrectionNarrative: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface SelfCorrectionContext {
  predictions: PredictiveInsightsData;
  feedback: PredictionFeedbackData;
  confidence: DecisionConfidenceData;
  mission: MissionIntelligenceData;
  evolution: MemoryEvolutionData;
  execution: ActionExecutionData;
  memory: ReturnType<typeof loadJourneyMemory>;
  forecast: GrowthForecastData;
}

function gatherContext(): SelfCorrectionContext {
  return {
    predictions: computePredictiveInsights(),
    feedback: computePredictionFeedback(),
    confidence: getDecisionConfidence(),
    mission: getMissionIntelligence(),
    evolution: computeMemoryEvolution(),
    execution: computeActionExecution(),
    memory: loadJourneyMemory(),
    forecast: computeGrowthForecast(),
  };
}

// ============================================================================
// DETECTION HELPERS
// ============================================================================

function detectAccuracyTrend(ctx: SelfCorrectionContext): CorrectionTrend {
  const { feedback } = ctx;
  const { accuracyScore, predictionDrift } = feedback;

  // If no evaluations yet, trend is stable by default
  if (accuracyScore.totalEvaluated === 0) return "stable";

  // Check momentum shift direction — it reflects whether predictions are getting better
  if (predictionDrift.momentumShift === "improving" && accuracyScore.overall >= 50) {
    return "improving";
  }

  // If drift is worsening and accuracy is declining, trend is declining
  if (predictionDrift.momentumShift === "declining" && accuracyScore.overall < 50) {
    return "declining";
  }

  // If there are more improvements than worsening
  const improvements = [
    predictionDrift.momentumShift,
    predictionDrift.dropoffShift,
    predictionDrift.directionTrend,
  ].filter((s) => s === "improving").length;

  const worsening = [
    predictionDrift.momentumShift,
    predictionDrift.dropoffShift,
    predictionDrift.directionTrend,
  ].filter((s) => s === "worsening" || s === "falling").length;

  if (improvements > worsening) return "improving";
  if (worsening > improvements) return "declining";

  return "stable";
}

function detectFailures(ctx: SelfCorrectionContext): string[] {
  const failures: string[] = [];
  const { feedback, mission, execution } = ctx;

  // 1. Repeated failed missions
  const failedMissionCount = mission.missionBlocks.filter((b) => b.severity === "high").length;
  if (failedMissionCount >= 2) {
    failures.push(
      `${failedMissionCount} high-severity mission block(s) persist — missions are failing to translate into action`
    );
  }

  if (mission.missionScore < 30) {
    failures.push(
      `Mission score is critically low (${mission.missionScore}/100) — the mission system is not aligned with user capacity`
    );
  }

  // 2. Prediction misses from feedback
  if (feedback.failedPredictions && feedback.failedPredictions.length > 0) {
    for (const fp of feedback.failedPredictions.slice(0, 3)) {
      failures.push(`Prediction miss — ${fp.dimension}: predicted ${fp.predictedValue}, actual ${fp.actualOutcome}`);
    }
  }

  // 3. Execution failures
  if (execution.executionMode === "fallback" && execution.executionConfidence < 50) {
    failures.push(
      "Execution system defaulted to fallback with low confidence — no actionable plan could be generated"
    );
  }

  if (execution.blockers.filter((b) => !b.includes("No blockers")).length >= 3) {
    failures.push(
      `${execution.blockers.length} execution blockers detected — plans are being blocked by unresolved friction`
    );
  }

  return [...new Set(failures)].slice(0, 5);
}

function detectSuccesses(ctx: SelfCorrectionContext): string[] {
  const successes: string[] = [];
  const { feedback, confidence, evolution, execution } = ctx;

  // 1. Successful predictions from feedback
  if (feedback.successfulPredictions && feedback.successfulPredictions.length > 0) {
    for (const sp of feedback.successfulPredictions.slice(0, 3)) {
      successes.push(`Accurate prediction — ${sp.dimension}: ${sp.predictedValue} matched reality`);
    }
  }

  // 2. Stable decision confidence = good calibration
  if (confidence.decisionStability === "stable" && confidence.confidenceScore >= 60) {
    successes.push(
      `Decision confidence is stable at ${confidence.confidenceScore}/100 — the model is well-calibrated to the user's certainty level`
    );
  }

  // 3. Rising confidence evolution
  if (evolution.confidenceEvolution.trend === "rising") {
    successes.push(
      `User confidence is rising (${evolution.confidenceEvolution.before}% → ${evolution.confidenceEvolution.after}%) — recommendations are supporting growth`
    );
  }

  // 4. Execution success — high confidence plan
  if (execution.executionMode !== "fallback" && execution.executionConfidence >= 65) {
    successes.push(
      `Execution confidence is ${execution.executionConfidence}/100 with mode "${execution.executionMode}" — plans are well-matched to user state`
    );
  }

  // 5. High accuracy score
  if (feedback.accuracyScore.overall >= 65 && feedback.accuracyScore.totalEvaluated >= 3) {
    successes.push(
      `Overall prediction accuracy is ${feedback.accuracyScore.overall}% across ${feedback.accuracyScore.totalEvaluated} evaluations — reliable forecasting`
    );
  }

  return [...new Set(successes)].slice(0, 5);
}

function detectDriftSignals(ctx: SelfCorrectionContext): string[] {
  const signals: string[] = [];
  const { feedback, evolution, memory, confidence } = ctx;

  // 1. Prediction drift from feedback
  if (feedback.predictionDrift) {
    if (feedback.predictionDrift.momentumShift === "declining") {
      signals.push("Momentum forecast is declining relative to past predictions — user engagement may be changing");
    }
    if (feedback.predictionDrift.dropoffShift === "worsening") {
      signals.push("Dropoff risk is worsening — disengagement signals are strengthening over time");
    }
    if (feedback.predictionDrift.directionTrend === "falling") {
      signals.push("Direction confidence is falling — the user's career preferences may be shifting");
    }
  }

  // 2. Confidence evolution indicating drift
  if (evolution.confidenceEvolution.trend === "declining") {
    signals.push(
      `User confidence declined from ${evolution.confidenceEvolution.before}% to ${evolution.confidenceEvolution.after}% — model may be overestimating certainty`
    );
  }
  if (evolution.confidenceEvolution.trend === "fluctuating") {
    signals.push("Confidence is fluctuating — the user's self-assessment is unstable, making predictions harder");
  }

  // 3. Behavior drift from memory
  if (memory.confidenceHistory.length >= 4) {
    const recent = memory.confidenceHistory.slice(-2);
    const older = memory.confidenceHistory.slice(-4, -2);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (Math.abs(recentAvg - olderAvg) > 15) {
      signals.push(
        `Confidence pattern shifted from avg ${Math.round(olderAvg)}% to ${Math.round(recentAvg)}% — behavior drift detected`
      );
    }
  }

  // 4. Uncertainty signals from decision confidence
  if (confidence.uncertaintySignals && confidence.uncertaintySignals.length >= 2) {
    const highUncertainty = confidence.uncertaintySignals.filter((u) => u.severity === "high").length;
    if (highUncertainty >= 1) {
      signals.push(
        `${highUncertainty} high-severity uncertainty signal(s) — prediction baselines may need recalibration`
      );
    }
  }

  // 5. Thinking shifts from evolution — user's mental model is changing
  if (evolution.thinkingShifts.length >= 3) {
    signals.push(
      `${evolution.thinkingShifts.length} thinking shifts detected — the user's career framework is evolving rapidly`
    );
  }

  return [...new Set(signals)].slice(0, 6);
}

function computeCorrectionScore(ctx: SelfCorrectionContext): number {
  const { feedback, confidence, evolution, execution, forecast } = ctx;
  let score = 50; // baseline

  // Accuracy contribution (0–25)
  if (feedback.accuracyScore.totalEvaluated > 0) {
    score += (feedback.accuracyScore.overall - 50) * 0.4;
  }

  // Decision stability bonus (0–10)
  if (confidence.decisionStability === "stable") score += 10;
  else if (confidence.decisionStability === "emerging") score += 3;
  else score -= 5; // fluctuating

  // Confidence evolution boost (0–10)
  if (evolution.confidenceEvolution.trend === "rising") score += 10;
  else if (evolution.confidenceEvolution.trend === "stable") score += 5;
  else score -= 5;

  // Execution alignment (0–10)
  if (execution.executionMode !== "fallback" && execution.executionConfidence >= 60) score += 10;
  else if (execution.executionMode === "fallback") score -= 5;

  // Trajectory alignment (0–10)
  if (forecast.trajectoryStrength >= 55 && forecast.confidenceScore >= 55) score += 10;
  else if (forecast.trajectoryStrength < 30) score -= 10;

  // Evolution score bonus (0–15)
  score += (evolution.evolutionScore - 50) * 0.3;

  // Feedback quality bonus (0–10)
  if (feedback.accuracyScore.totalEvaluated >= 5) score += 10;
  else if (feedback.accuracyScore.totalEvaluated >= 2) score += 5;

  // Drift penalty
  const driftCount = detectDriftSignals(ctx).length;
  score -= driftCount * 3;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function computeModelConfidence(ctx: SelfCorrectionContext): number {
  const { feedback, confidence, forecast, evolution, memory } = ctx;
  let conf = 55; // baseline

  // Accuracy track record (0–20)
  if (feedback.accuracyScore.totalEvaluated >= 3) {
    conf += (feedback.accuracyScore.overall - 50) * 0.4;
  } else if (feedback.accuracyScore.totalEvaluated === 0) {
    conf -= 15; // no feedback yet
  }

  // Decision confidence alignment (0–15)
  if (confidence.decisionStability === "stable") conf += 10;
  else if (confidence.decisionStability === "emerging") conf += 3;
  else conf -= 8;

  // Forecast trajectory alignment (0–10)
  if (forecast.trajectoryStrength >= 55) conf += 10;
  else if (forecast.trajectoryStrength < 30) conf -= 10;

  // Evolution confidence alignment (0–10)
  if (evolution.confidenceEvolution.trend === "rising") conf += 8;
  else if (evolution.confidenceEvolution.trend === "declining") conf -= 8;

  // Memory data volume (0–10)
  if (memory.confidenceHistory.length >= 5) conf += 10;
  else if (memory.confidenceHistory.length >= 3) conf += 5;

  // Data consistency penalty
  if (memory.confidenceHistory.length > 0) {
    const stdDev = Math.sqrt(
      memory.confidenceHistory.reduce((sum, v) => sum + (v - 50) ** 2, 0) / memory.confidenceHistory.length
    );
    if (stdDev > 20) conf -= 5; // high variance reduces confidence
  }

  return Math.round(Math.max(10, Math.min(95, conf)));
}

function detectMisalignmentAreas(ctx: SelfCorrectionContext): string[] {
  const areas: string[] = [];
  const { feedback, confidence, evolution, execution, mission, forecast } = ctx;

  // 1. Prediction accuracy misalignment
  if (feedback.accuracyScore.totalEvaluated > 0 && feedback.accuracyScore.overall < 50) {
    areas.push(
      `Overall prediction accuracy is ${feedback.accuracyScore.overall}% — the model's predictions frequently diverge from reality`
    );
  }

  // 2. Dimension-specific weak spots
  const { byDimension } = feedback.accuracyScore;
  if (byDimension.momentum > 0 && byDimension.momentum < 40) {
    areas.push("Momentum forecasts are poorly calibrated — the engagement model needs adjustment");
  }
  if (byDimension.dropoff > 0 && byDimension.dropoff < 40) {
    areas.push("Dropoff risk predictions are inaccurate — disengagement signals may be misweighted");
  }
  if (byDimension.goal !== null && byDimension.goal < 40) {
    areas.push("Goal completion predictions are inaccurate — goal pacing signals need recalibration");
  }
  if (byDimension.direction > 0 && byDimension.direction < 40) {
    areas.push("Direction confidence predictions are off — exploration signals may not reflect actual preferences");
  }

  // 3. Confidence mismatch — stated vs observed
  if (confidence.confidenceScore >= 60 && evolution.confidenceEvolution.trend === "declining") {
    areas.push(
      `Confidence mismatch: current score (${confidence.confidenceScore}/100) is high but trend is declining — the model may be lagging behind reality`
    );
  }

  if (confidence.confidenceScore < 40 && evolution.confidenceEvolution.trend === "rising") {
    areas.push(
      `Confidence mismatch: current score (${confidence.confidenceScore}/100) is low but trend is rising — the model may be underestimating improvement`
    );
  }

  // 4. Execution alignment
  if (execution.executionMode === "fallback" && mission.missionScore >= 50) {
    areas.push(
      "Execution mode is fallback despite moderate mission score — the execution model may be overly cautious"
    );
  }

  // 5. Trajectory forecast vs evolution
  if (forecast.trajectoryStrength >= 55 && evolution.growthVelocity < 40) {
    areas.push(
      `Forecast trajectory (${forecast.trajectoryStrength}/100) outpaces growth velocity (${evolution.growthVelocity}/100) — over-optimistic trajectory projection`
    );
  }

  if (forecast.trajectoryStrength < 35 && evolution.growthVelocity >= 60) {
    areas.push(
      `Growth velocity (${evolution.growthVelocity}/100) exceeds forecast trajectory (${forecast.trajectoryStrength}/100) — the forecast is underestimating user momentum`
    );
  }

  return [...new Set(areas)].slice(0, 5);
}

function generateImprovementActions(ctx: SelfCorrectionContext): string[] {
  const actions: string[] = [];
  const { feedback, confidence, mission, forecast, evolution } = ctx;

  // 1. Low accuracy — improve prediction model
  if (feedback.accuracyScore.totalEvaluated > 0 && feedback.accuracyScore.overall < 50) {
    actions.push(
      "Recalibrate prediction model weights: increase emphasis on recent behavior signals and reduce reliance on historical averages"
    );
  }

  // 2. High drift — shorten prediction windows
  const driftCount = detectDriftSignals(ctx).length;
  if (driftCount >= 3) {
    actions.push(
      `Shorten prediction windows: ${driftCount} drift signals detected — forecasts beyond 7 days may lose accuracy. Prioritize next-24-hour predictions`
    );
  }

  // 3. Confidence mismatch — align signals
  if (confidence.confidenceScore >= 60 && evolution.confidenceEvolution.trend === "declining") {
    actions.push(
      "Reduce confidence signal weight: current confidence is elevated but trending down — use a trailing average instead of point-in-time score"
    );
  }

  // 4. Mission failures — adjust difficulty
  if (mission.missionScore < 35) {
    actions.push(
      "Lower mission difficulty baseline: mission score is critically low — reduce default difficulty to 'tiny' across all mission generation to rebuild completion rates"
    );
  }

  // 5. Trajectory misalignment — recalibrate
  if (forecast.trajectoryStrength >= 55 && evolution.growthVelocity < 40) {
    actions.push(
      "Reduce trajectory forecast optimism: growth velocity is significantly behind trajectory strength — apply a 15% discount to trajectory predictions until velocity catches up"
    );
  }

  if (forecast.trajectoryStrength < 35 && evolution.growthVelocity >= 60) {
    actions.push(
      "Increase trajectory forecast baseline: growth velocity is outpacing trajectory — apply a boost to reflect actual user momentum"
    );
  }

  // 6. Insufficient feedback data — collect more
  if (feedback.accuracyScore.totalEvaluated < 3) {
    actions.push(
      `Collect more prediction evaluations: only ${feedback.accuracyScore.totalEvaluated} evaluations so far — increase prediction snapshot frequency to every 12 hours`
    );
  }

  // 7. Uncertainty spike — pause automatic recommendations
  if (confidence.uncertaintySignals.filter((u) => u.severity === "high").length >= 2) {
    actions.push(
      "Pause automatic high-stakes recommendations: high-severity uncertainty signals detected — switch to exploration-only mode until confidence stabilizes"
    );
  }

  // 8. Thinking shifts — extend exploration modes
  if (evolution.thinkingShifts.length >= 3) {
    actions.push(
      `${evolution.thinkingShifts.length} thinking shifts detected — extend recommended exploration windows to give the user time to consolidate new perspectives`
    );
  }

  if (actions.length === 0) {
    actions.push("No improvement actions needed — the system is well-calibrated. Continue monitoring for drift.");
  }

  return actions.slice(0, 6);
}

function buildSelfCorrectionNarrative(ctx: SelfCorrectionContext): string {
  const parts: string[] = [];
  const { feedback, evolution, execution, mission } = ctx;

  const score = computeCorrectionScore(ctx);
  const modelConf = computeModelConfidence(ctx);

  // Opening
  if (score >= 65) {
    parts.push("The self-correction system is well-calibrated.");
  } else if (score >= 40) {
    parts.push("The self-correction system is functioning but needs adjustments.");
  } else {
    parts.push("The self-correction system requires significant recalibration.");
  }

  // Accuracy context
  if (feedback.accuracyScore.totalEvaluated > 0) {
    parts.push(
      `Prediction accuracy is ${feedback.accuracyScore.overall}% across ${feedback.accuracyScore.totalEvaluated} evaluated prediction(s).`
    );
  } else {
    parts.push("Not enough prediction evaluations yet to assess accuracy trend.");
  }

  // Model confidence
  parts.push(`Model confidence is ${modelConf}/100.`);

  // Drift
  const driftSignals = detectDriftSignals(ctx);
  if (driftSignals.length > 0) {
    parts.push(`${driftSignals.length} drift signal(s) detected.`);
  } else {
    parts.push("No significant drift detected.");
  }

  // Success vs failure summary
  const failures = detectFailures(ctx);
  const successes = detectSuccesses(ctx);
  if (successes.length > 0) {
    parts.push(`${successes.length} successful intervention(s) identified.`);
  }
  if (failures.length > 0) {
    parts.push(`${failures.length} recommendation failure(s) to address.`);
  }

  // Evolution context
  if (evolution.confidenceEvolution.trend === "rising") {
    parts.push("User confidence is rising — recommendations are supporting positive growth.");
  } else if (evolution.confidenceEvolution.trend === "declining") {
    parts.push("User confidence is declining — recommendations may need to shift toward recovery mode.");
  }

  // Execution alignment
  if (execution.executionMode !== "fallback") {
    parts.push(`Execution mode \"${execution.executionMode}\" is active with ${execution.executionConfidence}/100 confidence.`);
  } else {
    parts.push("Execution is in fallback mode — the system could not generate a confident plan.");
  }

  // Closing
  const improvementActions = generateImprovementActions(ctx);
  if (improvementActions.length > 0 && !improvementActions[0].includes("no improvement actions needed")) {
    parts.push(`${improvementActions.length} improvement action(s) recommended.`);
  }

  return parts.join(" ");
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute a full adaptive self-correction analysis from all available data sources.
 */
export function computeAdaptiveSelfCorrection(): AdaptiveSelfCorrectionData {
  const ctx = gatherContext();

  const predictionAccuracyTrend = detectAccuracyTrend(ctx);
  const recommendationFailures = detectFailures(ctx);
  const successfulInterventions = detectSuccesses(ctx);
  const driftSignals = detectDriftSignals(ctx);
  const correctionScore = computeCorrectionScore(ctx);
  const modelConfidence = computeModelConfidence(ctx);
  const improvementActions = generateImprovementActions(ctx);
  const misalignmentAreas = detectMisalignmentAreas(ctx);
  const selfCorrectionNarrative = buildSelfCorrectionNarrative(ctx);

  return {
    predictionAccuracyTrend,
    recommendationFailures,
    successfulInterventions,
    driftSignals,
    correctionScore,
    modelConfidence,
    improvementActions,
    misalignmentAreas,
    selfCorrectionNarrative,
  };
}
