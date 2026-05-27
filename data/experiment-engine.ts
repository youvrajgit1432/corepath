/**
 * EXPERIMENT INTELLIGENCE (A/B Testing System)
 *
 * Allows CorePath to run experiments and compare feature performance.
 *
 * Support:
 *   experimentId, variantA, variantB, variantAssignment,
 *   startDate, endDate, successMetric
 *
 * Tracked Metrics:
 *   mission_completion_rate, quiz_completion_rate, career_click_rate,
 *   workspace_creation_rate, return_rate, engagement_score,
 *   recommendation_acceptance
 *
 * Generated Outputs:
 *   activeExperiments, variantPerformance, winnerPrediction,
 *   confidenceLevel, experimentNarrative, recommendedAction
 *
 * Behavior:
 *   Randomly assign users once
 *   Persist assignment via SafeStorage
 *   Collect analytics automatically
 *   Predict likely winner when enough data exists
 *
 * No backend. No auth. Client-side only.
 */

import { getSafeStorage } from "./safe-storage";
import { getUserAnalytics } from "./user-analytics";
import { getRecommendationOptimizer } from "./recommendation-optimizer";

// ============================================================================
// TYPES
// ============================================================================

export type SuccessMetric =
  | "mission_completion_rate"
  | "quiz_completion_rate"
  | "career_click_rate"
  | "workspace_creation_rate"
  | "return_rate"
  | "engagement_score"
  | "recommendation_acceptance";

export interface ExperimentDefinition {
  /** Unique experiment identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** What the experiment tests */
  description: string;
  /** Label for variant A (control) */
  variantA: string;
  /** Label for variant B (treatment) */
  variantB: string;
  /** Which metric determines success */
  successMetric: SuccessMetric;
  /** When the experiment started (epoch ms) */
  startDate: number;
  /** When the experiment ended (null = still running) */
  endDate: number | null;
  /** Minimum sample size before predicting a winner */
  minSampleSize: number;
}

export interface VariantPerformance {
  variant: "A" | "B";
  label: string;
  metricValue: number; // 0–100
  sampleSize: number;
}

export interface ActiveExperiment extends ExperimentDefinition {
  /** Which variant this user was assigned */
  variantAssignment: "A" | "B";
  /** Performance for both variants */
  performance: [VariantPerformance, VariantPerformance];
  /** Predicted winner ("A", "B", or "none" if insufficient data) */
  winnerPrediction: "A" | "B" | "none";
  /** Confidence in the prediction (0–100) */
  confidenceLevel: number;
  /** How long the experiment has been running (days) */
  daysRunning: number;
}

export interface ExperimentEngineOutput {
  /** All active (non-ended) experiments with computed performance */
  activeExperiments: ActiveExperiment[];
  /** Overall experiment system narrative */
  experimentNarrative: string[];
  /** Recommended action based on all experiments */
  recommendedAction: string;
  lastComputed: string;
}

// ============================================================================
// DEFAULT EXPERIMENTS
// ============================================================================

const DEFAULT_EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: "quiz-completion-flow",
    name: "Quiz Completion Flow",
    description: "Testing whether guided quizzes improve completion rates over standard quizzes.",
    variantA: "Standard Quiz",
    variantB: "Guided Quiz",
    successMetric: "quiz_completion_rate",
    startDate: Date.now() - 14 * 86_400_000, // 14 days ago
    endDate: null,
    minSampleSize: 3,
  },
  {
    id: "career-discovery-layout",
    name: "Career Discovery Layout",
    description: "Testing whether a grid or list layout drives more career exploration.",
    variantA: "Grid Layout",
    variantB: "List Layout",
    successMetric: "career_click_rate",
    startDate: Date.now() - 14 * 86_400_000,
    endDate: null,
    minSampleSize: 3,
  },
  {
    id: "workspace-onboarding",
    name: "Workspace Onboarding Flow",
    description: "Testing guided wizard vs self-guided workspace creation.",
    variantA: "Wizard Onboarding",
    variantB: "Self-Guided",
    successMetric: "workspace_creation_rate",
    startDate: Date.now() - 14 * 86_400_000,
    endDate: null,
    minSampleSize: 2,
  },
  {
    id: "mission-difficulty",
    name: "Mission Difficulty Curve",
    description: "Testing balanced vs aggressive mission difficulty for sustained engagement.",
    variantA: "Balanced Missions",
    variantB: "Aggressive Missions",
    successMetric: "mission_completion_rate",
    startDate: Date.now() - 10 * 86_400_000,
    endDate: null,
    minSampleSize: 3,
  },
  {
    id: "recommendation-style",
    name: "Recommendation Style",
    description: "Testing conservative vs exploratory recommendation algorithms.",
    variantA: "Conservative",
    variantB: "Exploratory",
    successMetric: "recommendation_acceptance",
    startDate: Date.now() - 14 * 86_400_000,
    endDate: null,
    minSampleSize: 3,
  },
  {
    id: "return-engagement",
    name: "Return Engagement Model",
    description: "Testing daily missions vs weekly sprints for return rate.",
    variantA: "Daily Missions",
    variantB: "Weekly Sprints",
    successMetric: "return_rate",
    startDate: Date.now() - 14 * 86_400_000,
    endDate: null,
    minSampleSize: 3,
  },
  {
    id: "engagement-engine",
    name: "Engagement Engine",
    description: "Testing points-based vs streak-based motivation systems.",
    variantA: "Points-Based",
    variantB: "Streak-Based",
    successMetric: "engagement_score",
    startDate: Date.now() - 14 * 86_400_000,
    endDate: null,
    minSampleSize: 3,
  },
];

// ============================================================================
// STORAGE
// ============================================================================

const ASSIGNMENT_KEY = "corepath-experiment-assignments";
const COMPUTED_KEY = "corepath-experiment-computed";

function getStorage() {
  return getSafeStorage({ silent: true });
}

// ============================================================================
// VARIANT ASSIGNMENT (deterministic random per experiment per user)
// ============================================================================

/**
 * Deterministically assign a variant using a simple hash of experiment ID.
 * Returns "A" or "B". Assignment persists via SafeStorage.
 */
function getOrCreateAssignment(experimentId: string): "A" | "B" {
  const storage = getStorage();
  const assignments = storage.get<Record<string, "A" | "B">>(ASSIGNMENT_KEY) ?? {};

  if (assignments[experimentId]) {
    return assignments[experimentId];
  }

  // Simple deterministic hash
  let hash = 0;
  const str = `${experimentId}-${navigator.userAgent}-corepath`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }

  const assignment: "A" | "B" = Math.abs(hash) % 2 === 0 ? "A" : "B";
  assignments[experimentId] = assignment;
  storage.set(ASSIGNMENT_KEY, assignments);
  return assignment;
}

// ============================================================================
// METRIC COMPUTATION
// ============================================================================

function computeMetricValue(
  metric: SuccessMetric,
  analytics: ReturnType<typeof getUserAnalytics>,
  optimizer: ReturnType<typeof getRecommendationOptimizer>
): number {
  switch (metric) {
    case "quiz_completion_rate": {
      const { quizzes } = analytics.featureUsageMap;
      // quizzes = quiz_started + quiz_completed, use records to get ratio
      const records = analytics.records;
      const started = records.filter((r) => r.event === "quiz_started").length;
      const completed = records.filter((r) => r.event === "quiz_completed").length;
      if (started === 0) return 0;
      return Math.round((completed / Math.max(started, 1)) * 100);
    }

    case "career_click_rate": {
      const { careers } = analytics.featureUsageMap;
      // Scale: 0 interactions = 0, 10+ interactions = 100
      return Math.min(Math.round((careers / 10) * 100), 100);
    }

    case "workspace_creation_rate": {
      const { workspace } = analytics.featureUsageMap;
      // 0 or 1 for binary
      return workspace > 0 ? 100 : 0;
    }

    case "mission_completion_rate": {
      const { missions } = analytics.featureUsageMap;
      // Scale: 0 = 0, 10+ = 100
      return Math.min(Math.round((missions / 10) * 100), 100);
    }

    case "return_rate": {
      const { retentionSignals } = analytics;
      // returning user + days active this week + session streak
      let score = 0;
      if (retentionSignals.returningUser) score += 30;
      score += Math.min(retentionSignals.daysActiveThisWeek * 10, 40);
      score += Math.min(retentionSignals.sessionStreak * 5, 30);
      return Math.min(score, 100);
    }

    case "engagement_score": {
      return analytics.engagementScore;
    }

    case "recommendation_acceptance": {
      const { recommendations } = analytics.featureUsageMap;
      const { recommendationQualityScore } = optimizer;
      // Blend recommendation views with quality score
      const viewScore = Math.min(Math.round((recommendations / 10) * 100), 100);
      return Math.round((viewScore + recommendationQualityScore) / 2);
    }

    default:
      return 0;
  }
}

/**
 * Compute the "expected" metric value for the opposite variant (baseline).
 * This simulates what the opposite variant would likely achieve based on
 * general engagement patterns. In a multi-user system this would be real data;
 * here we estimate from the user's overall analytics.
 */
function computeBaselineValue(
  metric: SuccessMetric,
  analytics: ReturnType<typeof getUserAnalytics>
): number {
  // Use overall engagement as a baseline proxy
  const { engagementScore, featureUsageMap, retentionSignals } = analytics;

  switch (metric) {
    case "quiz_completion_rate": {
      // Expected baseline for completion: 40–60% depending on engagement
      const base = 40 + Math.round(engagementScore * 0.2);
      return Math.min(base, 80);
    }
    case "career_click_rate": {
      const { careers } = featureUsageMap;
      return Math.min(Math.round(((careers + 2) / 12) * 100), 100);
    }
    case "workspace_creation_rate": {
      return 50; // 50% baseline
    }
    case "mission_completion_rate": {
      return 30 + Math.round(engagementScore * 0.2); // 30–50 baseline
    }
    case "return_rate": {
      const daysActive = retentionSignals.daysActiveThisWeek;
      return Math.min(Math.round(((daysActive + 1) / 7) * 100), 100);
    }
    case "engagement_score": {
      return Math.round(engagementScore * 0.85); // slightly below actual
    }
    case "recommendation_acceptance": {
      return 50; // 50% baseline
    }
    default:
      return 50;
  }
}

// ============================================================================
// EXPERIMENT COMPUTATION
// ============================================================================

function computeActiveExperiment(
  experiment: ExperimentDefinition,
  analytics: ReturnType<typeof getUserAnalytics>,
  optimizer: ReturnType<typeof getRecommendationOptimizer>
): ActiveExperiment {
  const assignment = getOrCreateAssignment(experiment.id);
  const actualValue = computeMetricValue(experiment.successMetric, analytics, optimizer);
  const baselineValue = computeBaselineValue(experiment.successMetric, analytics);

  // Compute performance: assigned variant gets actual value, opposite gets baseline
  const perfA: VariantPerformance = {
    variant: "A",
    label: experiment.variantA,
    metricValue: assignment === "A" ? actualValue : baselineValue,
    // Sample size: for assigned variant use actual interaction count; for baseline use a fixed size
    sampleSize: assignment === "A" ? computeSampleSize(experiment.successMetric, analytics) : Math.max(computeSampleSize(experiment.successMetric, analytics), 1),
  };
  const perfB: VariantPerformance = {
    variant: "B",
    label: experiment.variantB,
    metricValue: assignment === "B" ? actualValue : baselineValue,
    sampleSize: assignment === "B" ? computeSampleSize(experiment.successMetric, analytics) : Math.max(computeSampleSize(experiment.successMetric, analytics), 1),
  };

  // Winner prediction and confidence
  const diff = Math.abs(perfA.metricValue - perfB.metricValue);
  const totalSample = perfA.sampleSize + perfB.sampleSize;
  const hasEnoughData = totalSample >= experiment.minSampleSize;

  let winnerPrediction: "A" | "B" | "none" = "none";
  let confidenceLevel = 0;

  if (hasEnoughData && diff > 5) {
    winnerPrediction = perfA.metricValue > perfB.metricValue ? "A" : "B";
    // Confidence based on difference magnitude and sample size
    const diffConfidence = Math.min(diff, 50); // up to 50 from difference
    const sampleConfidence = Math.min((totalSample / 10) * 30, 30); // up to 30 from sample
    const timeConfidence = Math.min(
      Math.floor((Date.now() - experiment.startDate) / (7 * 86_400_000)) * 10,
      20
    ); // up to 20 from time
    confidenceLevel = Math.min(diffConfidence + sampleConfidence + timeConfidence, 100);
  } else if (hasEnoughData) {
    // Close match — low confidence
    confidenceLevel = Math.min(
      Math.round((totalSample / experiment.minSampleSize) * 30),
      40
    );
  }

  const daysRunning = Math.floor(
    ((experiment.endDate ?? Date.now()) - experiment.startDate) / 86_400_000
  );

  // If the user is assigned to the "winning" variant, that's a good signal
  // Only declare winner if we have enough data and meaningful difference
  if (winnerPrediction !== "none" && confidenceLevel < 40) {
    winnerPrediction = "none";
  }

  return {
    ...experiment,
    variantAssignment: assignment,
    performance: [perfA, perfB],
    winnerPrediction,
    confidenceLevel,
    daysRunning,
  };
}

function computeSampleSize(
  metric: SuccessMetric,
  analytics: ReturnType<typeof getUserAnalytics>
): number {
  const { featureUsageMap } = analytics;
  switch (metric) {
    case "quiz_completion_rate":
      return featureUsageMap.quizzes;
    case "career_click_rate":
      return featureUsageMap.careers;
    case "workspace_creation_rate":
      return featureUsageMap.workspace > 0 ? 2 : 1;
    case "mission_completion_rate":
      return featureUsageMap.missions;
    case "return_rate":
      return analytics.retentionSignals.totalSessions;
    case "engagement_score":
      return analytics.retentionSignals.totalSessions;
    case "recommendation_acceptance":
      return featureUsageMap.recommendations;
    default:
      return 1;
  }
}

// ============================================================================
// NARRATIVE & ACTIONS
// ============================================================================

function computeExperimentNarrative(
  activeExperiments: ActiveExperiment[]
): string[] {
  const narrative: string[] = [];
  const winners = activeExperiments.filter((e) => e.winnerPrediction !== "none");
  const ongoing = activeExperiments.filter((e) => e.winnerPrediction === "none");

  if (activeExperiments.length === 0) {
    narrative.push("No active experiments. CorePath will create experiments as you engage with the platform.");
    return narrative;
  }

  narrative.push(
    `${activeExperiments.length} experiment${activeExperiments.length > 1 ? "s" : ""} running across your experience.`
  );

  if (winners.length > 0) {
    const topWinner = winners.sort((a, b) => b.confidenceLevel - a.confidenceLevel)[0];
    narrative.push(
      `Leading experiment: "${topWinner.name}" — ${topWinner.variantAssignment === topWinner.winnerPrediction ? "your assigned" : "the opposite"} variant (${topWinner.winnerPrediction === "A" ? topWinner.variantA : topWinner.variantB}) is outperforming with ${topWinner.confidenceLevel}% confidence.`
    );
  }

  if (ongoing.length > 0) {
    narrative.push(
      `${ongoing.length} experiment${ongoing.length > 1 ? "s" : ""} still gathering data — keep engaging to help determine the winner.`
    );
  }

  // Aggregate insights
  const highConfidence = activeExperiments.filter((e) => e.confidenceLevel >= 60);
  if (highConfidence.length >= 2) {
    narrative.push(
      `${highConfidence.length} experiment${highConfidence.length > 1 ? "s" : ""} show strong signal — considering rolling out winning variants.`
    );
  }

  // Check engagement impact
  const assignedWins = activeExperiments.filter(
    (e) => e.winnerPrediction !== "none" && e.variantAssignment === e.winnerPrediction
  );
  if (assignedWins.length > 0 && assignedWins.length >= activeExperiments.length * 0.5) {
    narrative.push(
      `Your current variant assignments are winning in ${assignedWins.length}/${activeExperiments.length} experiments — your experience is well-optimized.`
    );
  }

  const closeExperiments = activeExperiments.filter(
    (e) => e.winnerPrediction === "none" && e.daysRunning >= 7
  );
  if (closeExperiments.length > 0) {
    narrative.push(
      `${closeExperiments.length} experiment${closeExperiments.length > 1 ? "s" : ""} have been running for a week without a clear winner — consider extending the test or accepting the variants are equivalent.`
    );
  }

  return narrative;
}

function computeRecommendedAction(
  activeExperiments: ActiveExperiment[]
): string {
  // Find experiment with highest confidence where we have a clear recommendation
  const decisive = activeExperiments
    .filter((e) => e.winnerPrediction !== "none" && e.confidenceLevel >= 60)
    .sort((a, b) => b.confidenceLevel - a.confidenceLevel);

  if (decisive.length > 0) {
    const top = decisive[0];
    const winningLabel = top.winnerPrediction === "A" ? top.variantA : top.variantB;
    return `Rolling out "${winningLabel}" for "${top.name}" — ${top.confidenceLevel}% confidence after ${top.daysRunning} days.`;
  }

  // Check for experiments that need more data
  const lowData = activeExperiments
    .filter((e) => e.confidenceLevel < 30 && e.daysRunning >= 3)
    .sort((a, b) => a.confidenceLevel - b.confidenceLevel);

  if (lowData.length > 0) {
    const top = lowData[0];
    return `"${top.name}" needs more data — only ${top.confidenceLevel}% confidence after ${top.daysRunning} days. Continue engaging to strengthen the signal.`;
  }

  // Early stage — no strong signals yet
  return "Experiments are still in early stages. Continue exploring CorePath features to help determine winning variants.";
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full experiment intelligence state.
 */
export function computeExperimentEngine(): ExperimentEngineOutput {
  const analytics = getUserAnalytics();
  const optimizer = getRecommendationOptimizer();

  const activeExperiments = DEFAULT_EXPERIMENTS
    .filter((e) => e.endDate === null || e.endDate > Date.now())
    .map((e) => computeActiveExperiment(e, analytics, optimizer));

  const experimentNarrative = computeExperimentNarrative(activeExperiments);
  const recommendedAction = computeRecommendedAction(activeExperiments);

  const output: ExperimentEngineOutput = {
    activeExperiments,
    experimentNarrative,
    recommendedAction,
    lastComputed: new Date().toISOString(),
  };

  getStorage().set(COMPUTED_KEY, output);
  return output;
}

/**
 * Load previously computed experiment engine data.
 */
export function loadExperimentEngine(): ExperimentEngineOutput | null {
  const storage = getStorage();
  const cached = storage.get<ExperimentEngineOutput>(COMPUTED_KEY);
  if (!cached) return null;
  return cached;
}

/**
 * Get current experiment engine data, computing fresh if needed.
 */
export function getExperimentEngine(): ExperimentEngineOutput {
  const existing = loadExperimentEngine();
  if (existing) return existing;
  return computeExperimentEngine();
}

/**
 * Clear all experiment engine data including variant assignments.
 */
export function clearExperimentEngine(): void {
  const storage = getStorage();
  storage.remove(ASSIGNMENT_KEY);
  storage.remove(COMPUTED_KEY);
}
