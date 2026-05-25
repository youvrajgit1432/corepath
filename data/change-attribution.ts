/**
 * CHANGE ATTRIBUTION INTELLIGENCE
 *
 * Explains what caused progress shifts in the user's career exploration journey.
 *
 * Reads from:
 *   personal-evolution     (confidence growth, evolution score, milestone moments, identity shift)
 *   learning-friction      (friction score, friction areas, recovery signals)
 *   engagement-pulse       (pulse score, energy forecast, consistency streak, fatigue)
 *   predictive-insights    (career direction confidence, momentum, dropoff risk)
 *   growth-analytics       (confidence trend, specialization trend, XP trend, progress history)
 *   journey-memory         (quiz timeline, comparison history, roadmap interactions, viewed history)
 *
 * Behavior:
 *   Clickable causes dispatch an event that scrolls to the related timeline/pulse event
 *
 * Persists via SafeStorage with 1-hour cache.
 * No backend. No auth.
 */

import { getPersonalEvolution } from "./personal-evolution";
import { getLearningFriction } from "./learning-friction";
import { getEngagementPulse } from "./engagement-pulse";
import { loadPredictiveInsights, computePredictiveInsights } from "./predictive-insights";
import { loadGrowthAnalytics, getGrowthAnalytics } from "./growth-analytics";
import { loadJourneyMemory } from "./journey-memory";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-change-attribution";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type ChangeDirection = "increase" | "decrease" | "stable";
export type DriverType = "positive" | "negative";

export interface MajorChange {
  /** Unique identifier for scrolling/referencing */
  id: string;
  /** Human-readable change label */
  label: string;
  /** Direction of the change */
  direction: ChangeDirection;
  /** Magnitude of the change (0–100) */
  magnitude: number;
  /** The domain where the change occurred */
  domain: "confidence" | "exploration" | "streak" | "achievement" | "comparison" | "specialization";
  /** Short description of what changed */
  detail: string;
  /** When this change was detected (approximate) */
  detectedAt: string;
}

export interface AttributedCause {
  /** What caused the change */
  cause: string;
  /** Which data source this cause comes from */
  source: string;
  /** Which major change this cause relates to */
  relatedChangeId: string;
  /** Whether this was positive or negative influence */
  influence: DriverType;
  /** Detail about the causal link */
  detail: string;
}

export interface DriverSummary {
  /** Positive drivers list */
  positive: string[];
  /** Negative drivers list */
  negative: string[];
  /** Total positive count */
  positiveCount: number;
  /** Total negative count */
  negativeCount: number;
}

export interface ConfidenceImpact {
  /** The confidence score from personal evolution */
  overallGrowth: number;
  /** Segments of confidence changes */
  segments: Array<{
    label: string;
    change: number;
    direction: ChangeDirection;
  }>;
  /** Whether confidence is trending up overall */
  trendingUp: boolean;
}

export interface BehaviorImpact {
  /** How specialization changed */
  specializationShift: string;
  /** How exploration breadth changed */
  explorationShift: string;
  /** How consistency changed */
  consistencyShift: string;
}

export interface ChangeAttributionData {
  /** All detected major changes, ordered by significance */
  majorChanges: MajorChange[];
  /** Possible causes attributed to each change */
  possibleCauses: AttributedCause[];
  /** Consolidated positive vs negative driver summary */
  positiveDrivers: DriverSummary;
  /** Refined negative driver sub-section */
  negativeDrivers: DriverSummary;
  /** Impact on user's confidence across different domains */
  confidenceImpact: ConfidenceImpact;
  /** Impact on user's behavior patterns */
  behaviorImpact: BehaviorImpact;
  /** Full narrative connecting changes to their likely causes */
  attributionNarrative: string;
  computedAt: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface AttributionContext {
  evolution: ReturnType<typeof getPersonalEvolution>;
  friction: ReturnType<typeof getLearningFriction>;
  pulse: ReturnType<typeof getEngagementPulse>;
  predictions: ReturnType<typeof loadPredictiveInsights>;
  analytics: ReturnType<typeof getGrowthAnalytics>;
  journey: ReturnType<typeof loadJourneyMemory>;
}

function gatherContext(): AttributionContext {
  const evolution = getPersonalEvolution();
  return {
    evolution,
    friction: getLearningFriction(),
    pulse: getEngagementPulse(),
    predictions: loadPredictiveInsights() ?? computePredictiveInsights(),
    analytics: loadGrowthAnalytics() ?? getGrowthAnalytics(),
    journey: loadJourneyMemory(),
  };
}

// ============================================================================
// MAJOR CHANGE DETECTION
// ============================================================================

function detectConfidenceChanges(ctx: AttributionContext): MajorChange[] {
  const changes: MajorChange[] = [];
  const growth = ctx.evolution.confidenceGrowth;

  // Significant confidence change
  if (Math.abs(growth) >= 5) {
    const direction: ChangeDirection = growth > 0 ? "increase" : "decrease";
    const magnitude = Math.min(100, Math.abs(growth) * 5);

    if (direction === "increase") {
      changes.push({
        id: "confidence-rise",
        label: "Confidence Growth",
        direction: "increase",
        magnitude,
        domain: "confidence",
        detail: `Your confidence has risen by ${growth} points across ${ctx.journey.confidenceHistory.length} quiz sessions, reflecting growing self-awareness and decisiveness.`,
        detectedAt: ctx.evolution.computedAt,
      });
    } else {
      changes.push({
        id: "confidence-drop",
        label: "Confidence Moderation",
        direction: "decrease",
        magnitude,
        domain: "confidence",
        detail: `Your confidence has moderated by ${Math.abs(growth)} points — this often reflects a more nuanced, realistic self-assessment as you learn more.`,
        detectedAt: ctx.evolution.computedAt,
      });
    }
  }

  // Direction shift from predictive insights
  if (ctx.predictions.careerDirectionConfidence.level === "strong") {
    changes.push({
      id: "direction-clarity",
      label: "Career Direction Clarity",
      direction: "increase",
      magnitude: Math.min(100, ctx.predictions.careerDirectionConfidence.score),
      domain: "confidence",
      detail: ctx.predictions.careerDirectionConfidence.summary,
      detectedAt: ctx.predictions.computedAt,
    });
  }

  return changes;
}

function detectExplorationChanges(ctx: AttributionContext): MajorChange[] {
  const changes: MajorChange[] = [];
  const analytics = ctx.analytics;
  const journey = ctx.journey;

  const viewedCount = Object.keys(journey.viewedCareers).length;
  const catCount = Object.keys(journey.favoriteCategories).length;

  // Broadening exploration
  if (analytics.specializationTrend === "broadening" && viewedCount >= 5) {
    changes.push({
      id: "exploration-broadening",
      label: "Exploration Broadening",
      direction: "increase",
      magnitude: Math.min(100, viewedCount * 6),
      domain: "exploration",
      detail: `Your exploration has broadened across ${catCount} categories and ${viewedCount} careers, expanding your awareness of available paths.`,
      detectedAt: analytics.computedAt,
    });
  }

  // Deepening specialization
  if (analytics.specializationTrend === "deepening" && viewedCount >= 3) {
    changes.push({
      id: "specialization-deepening",
      label: "Specialization Deepening",
      direction: "increase",
      magnitude: Math.min(100, 50 + analytics.confidenceTrend * 3),
      domain: "specialization",
      detail: "Your interests are converging into a focused specialization — moving from broad exploration toward targeted expertise.",
      detectedAt: analytics.computedAt,
    });
  }

  return changes;
}

function detectStreakChanges(ctx: AttributionContext): MajorChange[] {
  const changes: MajorChange[] = [];
  const pulse = ctx.pulse;
  const consistencyDim = pulse.dimensions.find((d) => d.name === "consistency_streak");

  if (!consistencyDim) return changes;

  // Significant streak score
  if (consistencyDim.score >= 70) {
    changes.push({
      id: "streak-strong",
      label: "Strong Consistency Streak",
      direction: "increase",
      magnitude: consistencyDim.score,
      domain: "streak",
      detail: `Your consistency score is ${consistencyDim.score}/100 with signals: ${consistencyDim.signals.slice(0, 2).join(", ")}.`,
      detectedAt: pulse.computedAt,
    });
  } else if (consistencyDim.score < 30) {
    changes.push({
      id: "streak-low",
      label: "Consistency Decline",
      direction: "decrease",
      magnitude: 100 - consistencyDim.score,
      domain: "streak",
      detail: `Your consistency score is ${consistencyDim.score}/100 — irregular engagement makes it hard to build momentum.`,
      detectedAt: pulse.computedAt,
    });
  }

  return changes;
}

function detectAchievementBursts(ctx: AttributionContext): MajorChange[] {
  const changes: MajorChange[] = [];
  const milestones = ctx.evolution.milestoneMoments;

  if (milestones.length >= 3) {
    changes.push({
      id: "achievement-burst",
      label: "Achievement Milestone Burst",
      direction: "increase",
      magnitude: Math.min(100, milestones.length * 20),
      domain: "achievement",
      detail: `You've reached ${milestones.length} milestones: ${milestones.slice(0, 3).map((m) => m.label).join(", ")}${milestones.length > 3 ? `, and ${milestones.length - 3} more` : ""}.`,
      detectedAt: ctx.evolution.computedAt,
    });
  }

  // XP trend surge
  if (ctx.analytics.xpTrend >= 200) {
    changes.push({
      id: "xp-surge",
      label: "XP Momentum Surge",
      direction: "increase",
      magnitude: Math.min(100, Math.round(ctx.analytics.xpTrend / 3)),
      domain: "achievement",
      detail: `You've gained ${ctx.analytics.xpTrend} XP recently — a surge in engagement and activity.`,
      detectedAt: ctx.analytics.computedAt,
    });
  }

  return changes;
}

function detectComparisonSpikes(ctx: AttributionContext): MajorChange[] {
  const changes: MajorChange[] = [];
  const history = ctx.journey.comparisonHistory;

  if (history.length >= 3) {
    // Calculate recent comparison frequency
    const now = Date.now();
    const recentThreshold = now - 7 * 24 * 60 * 60 * 1000; // 7 days
    const recentComparisons = history.filter(
      (c) => new Date(c.timestamp).getTime() >= recentThreshold
    ).length;

    if (recentComparisons >= 2) {
      changes.push({
        id: "comparison-spike",
        label: "Career Comparison Spike",
        direction: "increase",
        magnitude: Math.min(100, recentComparisons * 20),
        domain: "comparison",
        detail: `${recentComparisons} career comparisons in the last 7 days (${history.length} total) — actively evaluating options side-by-side.`,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return changes;
}

function detectAllMajorChanges(ctx: AttributionContext): MajorChange[] {
  const all = [
    ...detectConfidenceChanges(ctx),
    ...detectExplorationChanges(ctx),
    ...detectStreakChanges(ctx),
    ...detectAchievementBursts(ctx),
    ...detectComparisonSpikes(ctx),
  ];

  // Sort by magnitude descending
  return all.sort((a, b) => b.magnitude - a.magnitude);
}

// ============================================================================
// CAUSE ATTRIBUTION
// ============================================================================

function attributeCauses(ctx: AttributionContext, changes: MajorChange[]): AttributedCause[] {
  const causes: AttributedCause[] = [];
  const journey = ctx.journey;

  for (const change of changes) {
    switch (change.domain) {
      case "confidence": {
        if (change.direction === "increase") {
          // Quiz completions build confidence
          if (journey.completedQuizzes >= 2) {
            causes.push({
              cause: `Completed ${journey.completedQuizzes} career cognition quizzes`,
              source: "journey-memory",
              relatedChangeId: change.id,
              influence: "positive",
              detail: "Each quiz session sharpens self-assessment and builds career awareness.",
            });
          }
          // Comparisons provide clarity
          if (journey.comparisonHistory.length >= 2) {
            causes.push({
              cause: `${journey.comparisonHistory.length} career comparisons made`,
              source: "journey-memory",
              relatedChangeId: change.id,
              influence: "positive",
              detail: "Systematic comparison helps clarify preferences and builds confidence in direction.",
            });
          }
          // Predictive insights momentum
          if (ctx.predictions.momentumForecast.direction === "accelerating") {
            causes.push({
              cause: "Accelerating momentum trajectory",
              source: "predictive-insights",
              relatedChangeId: change.id,
              influence: "positive",
              detail: "Forward-looking momentum signals reinforce that you're on the right track.",
            });
          }
        } else {
          // Confidence drop — could be learning friction
          if (ctx.friction.frictionScore >= 40) {
            causes.push({
              cause: `Learning friction score of ${ctx.friction.frictionScore}/100`,
              source: "learning-friction",
              relatedChangeId: change.id,
              influence: "negative",
              detail: `Friction areas like ${ctx.friction.frictionAreas.slice(0, 2).map((a) => a.area).join(" and ")} may be contributing to lower confidence.`,
            });
          }
          // Dropoff risk
          if (ctx.predictions.dropoffRisk.level === "elevated" || ctx.predictions.dropoffRisk.level === "high") {
            causes.push({
              cause: "Elevated disengagement risk",
              source: "predictive-insights",
              relatedChangeId: change.id,
              influence: "negative",
              detail: ctx.predictions.dropoffRisk.summary,
            });
          }
          // Fatigue
          const highFatigue = ctx.pulse.fatigueSignals.filter((f) => f.severity === "high");
          if (highFatigue.length > 0) {
            causes.push({
              cause: highFatigue[0].type.replace(/_/g, " "),
              source: "engagement-pulse",
              relatedChangeId: change.id,
              influence: "negative",
              detail: highFatigue[0].detail,
            });
          }
        }
        break;
      }

      case "exploration":
      case "specialization": {
        if (change.direction === "increase") {
          // Broad exploration driven by curiosity
          const themeCount = Object.keys(journey.repeatedThemes).filter(
            (t) => journey.repeatedThemes[t as keyof typeof journey.repeatedThemes] > 0
          ).length;
          if (themeCount >= 3) {
            causes.push({
              cause: `Exploring ${themeCount} distinct career themes`,
              source: "journey-memory",
              relatedChangeId: change.id,
              influence: "positive",
              detail: "Broad thematic exploration indicates genuine curiosity and openness to possibilities.",
            });
          }
          // Roadmap deep-dives
          const roadmapCount = Object.keys(journey.roadmapInteractions).length;
          if (roadmapCount >= 2) {
            causes.push({
              cause: `Deep-dived into ${roadmapCount} career roadmaps`,
              source: "journey-memory",
              relatedChangeId: change.id,
              influence: "positive",
              detail: "Roadmap exploration shows commitment to understanding career requirements in depth.",
            });
          }
          // Specialization driven by focused comparisons
          if (change.domain === "specialization" && ctx.friction.frictionScore < 40) {
            causes.push({
              cause: "Low friction during focused exploration",
              source: "learning-friction",
              relatedChangeId: change.id,
              influence: "positive",
              detail: "You're specializing without hitting significant obstacles — a sign of good career fit alignment.",
            });
          }
        }
        break;
      }

      case "streak": {
        if (change.direction === "increase") {
          causes.push({
            cause: "Consistent daily engagement",
            source: "engagement-pulse",
            relatedChangeId: change.id,
            influence: "positive",
            detail: "Regular daily sessions compound into a strong consistency streak, reinforcing the habit loop.",
          });
          // Missions completed
          const pulseMissionDim = ctx.pulse.dimensions.find((d) => d.name === "mission_momentum");
          if (pulseMissionDim && pulseMissionDim.score >= 60) {
            causes.push({
              cause: "Strong mission completion momentum",
              source: "engagement-pulse",
              relatedChangeId: change.id,
              influence: "positive",
              detail: "Completing daily missions builds the routine that sustains your streak.",
            });
          }
        } else {
          causes.push({
            cause: "Gap in recent engagement",
            source: "engagement-pulse",
            relatedChangeId: change.id,
            influence: "negative",
            detail: "Irregular sessions break the consistency loop. Even small daily actions help rebuild.",
          });
          if (ctx.pulse.fatigueSignals.some((f) => f.type === "disengagement")) {
            causes.push({
              cause: "Disengagement pattern detected",
              source: "engagement-pulse",
              relatedChangeId: change.id,
              influence: "negative",
              detail: "Low activity and incomplete missions suggest a motivation or energy dip.",
            });
          }
        }
        break;
      }

      case "achievement": {
        // Milestones unlocked
        const latestMilestones = ctx.evolution.milestoneMoments.slice(-3);
        for (const m of latestMilestones) {
          causes.push({
            cause: m.label,
            source: "personal-evolution",
            relatedChangeId: change.id,
            influence: "positive",
            detail: m.detail,
          });
        }
        // Identity formed
        if (ctx.evolution.evolutionScore >= 50) {
          causes.push({
            cause: "Career identity crystallization",
            source: "personal-evolution",
            relatedChangeId: change.id,
            influence: "positive",
            detail: "A clear career identity provides direction and motivation for continued engagement.",
          });
        }
        break;
      }

      case "comparison": {
        causes.push({
          cause: "Active career evaluation phase",
          source: "journey-memory",
          relatedChangeId: change.id,
          influence: "positive",
          detail: "Comparing careers side-by-side shows you're moving beyond browsing into active decision-making.",
        });
        // If high hesitation, also note that
        if (ctx.friction.frictionAreas.some((a) => a.area === "Career Switching")) {
          causes.push({
            cause: "Career switching loops detected",
            source: "learning-friction",
            relatedChangeId: change.id,
            influence: "negative",
            detail: "Frequent switching between the same pairs without resolution may indicate decision difficulty.",
          });
        }
        break;
      }
    }
  }

  return causes;
}

// ============================================================================
// DRIVER SUMMARIES
// ============================================================================

function buildDriverSummary(causes: AttributedCause[]): DriverSummary {
  const positive = causes
    .filter((c) => c.influence === "positive")
    .map((c) => c.cause);
  const negative = causes
    .filter((c) => c.influence === "negative")
    .map((c) => c.cause);

  return {
    positive: [...new Set(positive)],
    negative: [...new Set(negative)],
    positiveCount: new Set(positive).size,
    negativeCount: new Set(negative).size,
  };
}

// ============================================================================
// CONFIDENCE IMPACT
// ============================================================================

function computeConfidenceImpact(ctx: AttributionContext): ConfidenceImpact {
  const segments: ConfidenceImpact["segments"] = [];
  const history = ctx.journey.confidenceHistory;

  // Split confidence history into segments
  if (history.length >= 4) {
    const mid = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, mid);
    const secondHalf = history.slice(mid);

    const firstAvg = Math.round(firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length);
    const secondAvg = Math.round(secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length);
    const diff = secondAvg - firstAvg;

    segments.push({
      label: "Early sessions vs recent",
      change: diff,
      direction: diff > 0 ? "increase" : diff < 0 ? "decrease" : "stable",
    });

    // Further segment if enough data
    if (history.length >= 6) {
      const recent = history.slice(-2);
      const recentAvg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
      const prevAvg = Math.round(
        history.slice(-4, -2).reduce((a, b) => a + b, 0) / 2
      );
      const recentDiff = recentAvg - prevAvg;

      segments.push({
        label: "Very recent trend",
        change: recentDiff,
        direction: recentDiff > 0 ? "increase" : recentDiff < 0 ? "decrease" : "stable",
      });
    }
  } else if (history.length >= 2) {
    const diff = Math.round((history[history.length - 1] - history[0]) * 10) / 10;
    segments.push({
      label: "Overall change",
      change: diff,
      direction: diff > 0 ? "increase" : diff < 0 ? "decrease" : "stable",
    });
  }

  const trendingUp = ctx.analytics.confidenceTrend > 0;

  return {
    overallGrowth: ctx.evolution.confidenceGrowth,
    segments,
    trendingUp,
  };
}

// ============================================================================
// BEHAVIOR IMPACT
// ============================================================================

function computeBehaviorImpact(ctx: AttributionContext): BehaviorImpact {
  const analytics = ctx.analytics;
  const journey = ctx.journey;
  const evolution = ctx.evolution;

  // Specialization shift
  let specializationShift: string;
  if (analytics.specializationTrend === "deepening") {
    specializationShift = "You're moving from broad exploration toward focused specialization — your interests are converging on specific career areas.";
  } else if (analytics.specializationTrend === "broadening") {
    specializationShift = "Your exploration is expanding across more career categories — you're keeping options open while gathering broader perspective.";
  } else {
    specializationShift = "Your specialization range has remained steady — a balanced approach to career discovery.";
  }

  // Exploration shift
  const viewCount = Object.keys(journey.viewedCareers).length;
  const comparisonCount = Object.keys(journey.comparedCareerPairs).length;
  let explorationShift: string;
  if (comparisonCount >= 3 && viewCount >= 8) {
    explorationShift = "Your behavior shifted from browsing to active comparison — you're now systematically evaluating career options rather than just exploring.";
  } else if (viewCount >= 5) {
    explorationShift = "Your exploration has grown steadily — viewing more careers and building a broader awareness of your options.";
  } else {
    explorationShift = "Your exploration patterns are still forming — continue engaging with careers to reveal your style.";
  }

  // Consistency shift
  const pulseConsistency = ctx.pulse.dimensions.find((d) => d.name === "consistency_streak");
  const consistencyScore = pulseConsistency?.score ?? 50;
  let consistencyShift: string;
  if (consistencyScore >= 60) {
    consistencyShift = "You've built a strong engagement habit with consistent daily or near-daily sessions — this regular cadence compounds your career intelligence.";
  } else if (consistencyScore >= 35) {
    consistencyShift = "Your engagement is moderately consistent — you participate regularly but may have occasional gaps.";
  } else {
    consistencyShift = "Your engagement has been irregular — building a more consistent routine would accelerate your progress.";
  }

  return { specializationShift, explorationShift, consistencyShift };
}

// ============================================================================
// NARRATIVE
// ============================================================================

function buildAttributionNarrative(
  changes: MajorChange[],
  positiveDrivers: DriverSummary,
  negativeDrivers: DriverSummary,
  confidenceImpact: ConfidenceImpact,
  behaviorImpact: BehaviorImpact
): string {
  if (changes.length === 0) {
    return "Your career journey is still in its early stages. As you explore more careers, complete quizzes, and compare options, your change story will begin to unfold — revealing what drives your progress and what holds you back.";
  }

  const parts: string[] = [];

  // Opening — most significant change
  const topChange = changes[0];
  const changeVerb = topChange.direction === "increase" ? "accelerated" : "shifted";
  parts.push(
    `Your career journey has ${changeVerb} most notably in **${topChange.domain}** — ${topChange.detail.toLowerCase()}`
  );

  // What's driving changes
  if (positiveDrivers.positiveCount > 0) {
    parts.push(
      `The main forces behind your progress include: ${positiveDrivers.positive.slice(0, 3).join(", ")}.`
    );
  }

  // What's holding back
  if (negativeDrivers.negativeCount > 0) {
    parts.push(
      `Factors tempering your momentum: ${negativeDrivers.negative.slice(0, 2).join(", ")}.`
    );
  }

  // Confidence trajectory
  if (confidenceImpact.segments.length > 0) {
    const latest = confidenceImpact.segments[confidenceImpact.segments.length - 1];
    if (latest.direction === "increase") {
      parts.push(
        `Your confidence has grown by ${confidenceImpact.overallGrowth} points overall${latest.change >= 0 ? `, with a recent uptick of ${latest.change} points in your most recent sessions` : ""}.`
      );
    } else if (latest.direction === "decrease") {
      parts.push(
        `Your confidence has moderated by ${Math.abs(confidenceImpact.overallGrowth)} points overall — this reflects a more nuanced, realistic understanding of career fit.`
      );
    }
  }

  // Behavior impact highlight
  if (changes.some((c) => c.domain === "exploration" || c.domain === "specialization")) {
    parts.push(behaviorImpact.specializationShift);
  }
  if (changes.some((c) => c.domain === "streak")) {
    parts.push(behaviorImpact.consistencyShift);
  }

  // Closing
  if (positiveDrivers.positiveCount > negativeDrivers.negativeCount) {
    parts.push("Your positive drivers outweigh the negative — continued engagement will build on this momentum.");
  } else if (negativeDrivers.negativeCount > 0) {
    parts.push("Addressing the key friction areas will help unlock your next growth phase.");
  } else {
    parts.push("Continue exploring and comparing — each session adds to your career intelligence.");
  }

  return parts.join(" ");
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute a full change attribution assessment from all available data sources.
 */
export function computeChangeAttribution(): ChangeAttributionData {
  const ctx = gatherContext();

  const majorChanges = detectAllMajorChanges(ctx);
  const possibleCauses = attributeCauses(ctx, majorChanges);
  const driverSummary = buildDriverSummary(possibleCauses);
  const confidenceImpact = computeConfidenceImpact(ctx);
  const behaviorImpact = computeBehaviorImpact(ctx);
  const attributionNarrative = buildAttributionNarrative(
    majorChanges,
    driverSummary,
    driverSummary, // negative drivers same as driverSummary.negative
    confidenceImpact,
    behaviorImpact
  );

  const result: ChangeAttributionData = {
    majorChanges,
    possibleCauses,
    positiveDrivers: {
      positive: driverSummary.positive,
      negative: [],
      positiveCount: driverSummary.positiveCount,
      negativeCount: 0,
    },
    negativeDrivers: {
      positive: [],
      negative: driverSummary.negative,
      positiveCount: 0,
      negativeCount: driverSummary.negativeCount,
    },
    confidenceImpact,
    behaviorImpact,
    attributionNarrative,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

/**
 * Load previously computed change attribution from storage.
 */
export function loadChangeAttribution(): ChangeAttributionData | null {
  const storage = getSafeStorage({ silent: true });
  return storage.get<ChangeAttributionData>(STORAGE_KEY);
}

/**
 * Get the current change attribution, computing fresh if needed.
 */
export function getChangeAttribution(): ChangeAttributionData {
  const existing = loadChangeAttribution();
  if (existing) return existing;
  return computeChangeAttribution();
}
