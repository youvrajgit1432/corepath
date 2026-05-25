// CorePath — Career Decision Confidence Intelligence
// Answers "How confident should this user feel choosing this direction?"
// Sources: future-self, predictive-insights, decision-priority,
//          learning-friction, engagement-pulse, journey-memory

import { getFutureSelf } from "./future-self";
import { loadPredictiveInsights, computePredictiveInsights } from "./predictive-insights";
import { getDecisionPriority } from "./decision-priority";
import { getLearningFriction } from "./learning-friction";
import { loadEngagementPulse } from "./engagement-pulse";
import { loadJourneyMemory } from "./journey-memory";

// ── Types ──────────────────────────────────────────────────────────

export interface ConfidenceDriver {
  driver: string;
  impact: number; // -100 to +100 (negative = undermines confidence, positive = builds)
  source: string;
  detail: string;
}

export interface UncertaintySignal {
  signal: string;
  severity: "high" | "medium" | "low";
  description: string;
  source: string;
}

export interface DecisionConfidenceData {
  confidenceScore: number; // 0–100
  confidenceDrivers: ConfidenceDriver[];
  uncertaintySignals: UncertaintySignal[];
  decisionStability: "stable" | "fluctuating" | "emerging";
  explorationReadiness: number; // 0–100
  decisionNarrative: string;
  recommendedAction: {
    type: "reinforce" | "explore" | "pause";
    title: string;
    description: string;
  };
  computedAt: number;
}

// ── Cache ──────────────────────────────────────────────────────────

let cached: DecisionConfidenceData | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── Detection helpers ──────────────────────────────────────────────

function detectConfidenceDrivers(
  futureSelf: ReturnType<typeof getFutureSelf>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>,
  priority: ReturnType<typeof getDecisionPriority>,
  friction: ReturnType<typeof getLearningFriction>,
  pulse: ReturnType<typeof loadEngagementPulse>,
  memory: ReturnType<typeof loadJourneyMemory>
): ConfidenceDriver[] {
  const drivers: ConfidenceDriver[] = [];

  // 1. Future self trajectory
  if (futureSelf.trajectoryStrength >= 60) {
    drivers.push({
      driver: "Strong trajectory projection",
      impact: 25,
      source: "future-self",
      detail: `Trajectory strength of ${futureSelf.trajectoryStrength}/100 suggests positive future direction.`,
    });
  } else if (futureSelf.trajectoryStrength >= 40) {
    drivers.push({
      driver: "Developing trajectory",
      impact: 8,
      source: "future-self",
      detail: `Trajectory at ${futureSelf.trajectoryStrength}/100 — building momentum.`,
    });
  } else {
    drivers.push({
      driver: "Weak trajectory signal",
      impact: -15,
      source: "future-self",
      detail: `Trajectory is low (${futureSelf.trajectoryStrength}/100) — confidence needs more exploration data.`,
    });
  }

  // 2. Predictive direction confidence
  if (predictions?.careerDirectionConfidence) {
    const dir = predictions.careerDirectionConfidence;
    if (dir.level === "strong") {
      drivers.push({
        driver: "Clear career direction",
        impact: 20,
        source: "predictive-insights",
        detail: dir.summary,
      });
    } else if (dir.level === "moderate") {
      drivers.push({
        driver: "Developing direction clarity",
        impact: 5,
        source: "predictive-insights",
        detail: dir.summary,
      });
    } else {
      drivers.push({
        driver: "Unclear career direction",
        impact: -10,
        source: "predictive-insights",
        detail: dir.summary,
      });
    }
  }

  // 3. Decision priority confidence
  if (priority.confidenceScore >= 70) {
    drivers.push({
      driver: "Strong priority confidence",
      impact: 15,
      source: "decision-priority",
      detail: `Priority engine confidence is ${priority.confidenceScore}/100 — current focus aligns with signals.`,
    });
  } else if (priority.confidenceScore < 50) {
    drivers.push({
      driver: "Weak priority signal",
      impact: -8,
      source: "decision-priority",
      detail: `Priority confidence is low (${priority.confidenceScore}/100) — competing signals create uncertainty.`,
    });
  }

  // 4. Learning friction (inverse — low friction is good)
  if (friction.frictionScore < 30) {
    drivers.push({
      driver: "Low learning friction",
      impact: 18,
      source: "learning-friction",
      detail: `Friction score is only ${friction.frictionScore}/100 — few barriers to progress.`,
    });
  } else if (friction.frictionScore >= 65) {
    drivers.push({
      driver: "High learning friction",
      impact: -20,
      source: "learning-friction",
      detail: `Friction score is ${friction.frictionScore}/100 — significant barriers may undermine confidence.`,
    });
  } else {
    drivers.push({
      driver: "Moderate friction",
      impact: friction.frictionScore >= 45 ? -5 : 5,
      source: "learning-friction",
      detail: `Friction at ${friction.frictionScore}/100 — manageable but present.`,
    });
  }

  // 5. Engagement pulse
  if (pulse && pulse.pulseScore >= 65) {
    drivers.push({
      driver: "Strong engagement pulse",
      impact: 15,
      source: "engagement-pulse",
      detail: `Pulse score of ${pulse.pulseScore}/100 — healthy engagement supports confident decision-making.`,
    });
  } else if (pulse && pulse.pulseScore < 35) {
    drivers.push({
      driver: "Low engagement pulse",
      impact: -12,
      source: "engagement-pulse",
      detail: `Pulse at ${pulse.pulseScore}/100 — low engagement weakens decision confidence.`,
    });
  }

  // 6. Future self confidence score
  if (futureSelf.confidenceScore >= 65) {
    drivers.push({
      driver: "High future projection confidence",
      impact: 12,
      source: "future-self",
      detail: `Future self projection confidence is ${futureSelf.confidenceScore}/100 — reliable forecast.`,
    });
  } else if (futureSelf.confidenceScore < 40) {
    drivers.push({
      driver: "Low projection confidence",
      impact: -8,
      source: "future-self",
      detail: `Future self projection at ${futureSelf.confidenceScore}/100 — insufficient data for reliable forecast.`,
    });
  }

  // 7. Memory confidence history — trend direction
  if (memory.confidenceHistory.length >= 3) {
    const recent = memory.confidenceHistory.slice(-3);
    const early = memory.confidenceHistory.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
    if (recentAvg > earlyAvg + 5) {
      drivers.push({
        driver: "Rising confidence trend",
        impact: 10,
        source: "journey-memory",
        detail: `Average confidence rose from ${Math.round(earlyAvg)}% to ${Math.round(recentAvg)}% — trend supports stronger conviction.`,
      });
    } else if (recentAvg < earlyAvg - 5) {
      drivers.push({
        driver: "Declining confidence trend",
        impact: -10,
        source: "journey-memory",
        detail: `Average confidence dropped from ${Math.round(earlyAvg)}% to ${Math.round(recentAvg)}% — may signal growing uncertainty.`,
      });
    }
  }

  // 8. Fatigue signals from pulse
  if (pulse?.fatigueSignals && pulse.fatigueSignals.length > 0) {
    const highFatigue = pulse.fatigueSignals.filter((s) => s.severity === "high").length;
    if (highFatigue >= 2) {
      drivers.push({
        driver: "Significant fatigue signals",
        impact: -15,
        source: "engagement-pulse",
        detail: `${highFatigue} high-severity fatigue signals — burnout risk undermines decision confidence.`,
      });
    } else if (highFatigue >= 1) {
      drivers.push({
        driver: "Fatigue detected",
        impact: -5,
        source: "engagement-pulse",
        detail: `Fatigue signal present — may affect decision quality.`,
      });
    }
  }

  return drivers;
}

function detectUncertaintySignals(
  friction: ReturnType<typeof getLearningFriction>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>,
  priority: ReturnType<typeof getDecisionPriority>,
  pulse: ReturnType<typeof loadEngagementPulse>,
  memory: ReturnType<typeof loadJourneyMemory>
): UncertaintySignal[] {
  const signals: UncertaintySignal[] = [];

  // 1. High friction areas
  if (friction.frictionAreas && friction.frictionAreas.length > 0) {
    const highFriction = friction.frictionAreas.filter(
      (a) => a.severity === "high"
    );
    for (const area of highFriction) {
      signals.push({
        signal: area.area,
        severity: "high",
        description: area.detail,
        source: "learning-friction",
      });
    }
    // Medium severity friction areas
    const mediumFriction = friction.frictionAreas.filter(
      (a) => a.severity === "medium"
    );
    for (const area of mediumFriction) {
      signals.push({
        signal: area.area,
        severity: "medium",
        description: area.detail,
        source: "learning-friction",
      });
    }
  }

  // 2. Dropoff risk
  if (predictions?.dropoffRisk) {
    if (predictions.dropoffRisk.level === "high" || predictions.dropoffRisk.level === "elevated") {
      signals.push({
        signal: `Dropoff risk: ${predictions.dropoffRisk.level}`,
        severity: predictions.dropoffRisk.level === "high" ? "high" : "medium",
        description: predictions.dropoffRisk.summary,
        source: "predictive-insights",
      });
    }
  }

  // 3. Momentum declining
  if (predictions?.momentumForecast?.direction === "declining") {
    signals.push({
      signal: "Momentum decline forecast",
      severity: "medium",
      description: predictions.momentumForecast.summary,
      source: "predictive-insights",
    });
  }

  // 4. Priority urgency
  if (priority.urgencyLevel === "critical" || priority.urgencyLevel === "high") {
    signals.push({
      signal: `Urgent priority: ${priority.focusMode.replace(/_/g, " ")}`,
      severity: priority.urgencyLevel === "critical" ? "high" : "medium",
      description: priority.priorityReason,
      source: "decision-priority",
    });
  }

  // 5. Fatigue / burnout signals
  if (pulse?.fatigueSignals) {
    const burnoutSignal = pulse.fatigueSignals.find((s) => s.type === "burnout_risk");
    if (burnoutSignal && burnoutSignal.severity === "high") {
      signals.push({
        signal: "Burnout risk detected",
        severity: "high",
        description: burnoutSignal.detail,
        source: "engagement-pulse",
      });
    }
  }

  // 6. Memory uncertainty patterns
  if (memory.uncertaintyPatterns) {
    const retakes = memory.uncertaintyPatterns.retakes ?? 0;
    if (retakes >= 3) {
      signals.push({
        signal: "Frequent quiz retakes",
        severity: "medium",
        description: `${retakes} quiz retakes — suggests difficulty reaching satisfying conclusions.`,
        source: "journey-memory",
      });
    }
  }

  // 7. Stuck signals from friction
  if (friction.stuckSignals && friction.stuckSignals.length > 0) {
    signals.push({
      signal: "Stuck state signals",
      severity: friction.stuckSignals.length >= 3 ? "high" : "medium",
      description: `${friction.stuckSignals.length} stuck signals detected — progress has stalled in areas.`,
      source: "learning-friction",
    });
  }

  return signals;
}

function computeDecisionStability(
  memory: ReturnType<typeof loadJourneyMemory>,
  futureSelf: ReturnType<typeof getFutureSelf>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>,
  friction: ReturnType<typeof getLearningFriction>
): "stable" | "fluctuating" | "emerging" {
  const confHistory = memory.confidenceHistory;

  // Need enough data to judge
  if (confHistory.length < 2) return "emerging";

  // Check variance in confidence history
  const avg = confHistory.reduce((a, b) => a + b, 0) / confHistory.length;
  const variance = confHistory.reduce((a, b) => a + (b - avg) ** 2, 0) / confHistory.length;
  const stdDev = Math.sqrt(variance);

  // High variance = fluctuating
  if (stdDev > 15) return "fluctuating";

  // Low friction + positive trajectory + clear direction = stable
  const positiveTrajectory = futureSelf.trajectoryStrength >= 55;
  const clearDirection = predictions?.careerDirectionConfidence?.level === "strong";
  const lowFriction = friction.frictionScore < 35;

  if (positiveTrajectory && clearDirection && lowFriction) return "stable";
  if (positiveTrajectory || clearDirection) return "stable";

  return "emerging";
}

function computeExplorationReadiness(
  friction: ReturnType<typeof getLearningFriction>,
  pulse: ReturnType<typeof loadEngagementPulse>,
  futureSelf: ReturnType<typeof getFutureSelf>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>,
  priority: ReturnType<typeof getDecisionPriority>
): number {
  let score = 50; // baseline

  // Low friction = more ready (0–15)
  if (friction.frictionScore < 25) score += 15;
  else if (friction.frictionScore < 45) score += 8;
  else if (friction.frictionScore > 65) score -= 12;

  // High pulse = more ready (0–15)
  if (pulse && pulse.pulseScore >= 65) score += 15;
  else if (pulse && pulse.pulseScore >= 40) score += 5;
  else if (pulse && pulse.pulseScore < 30) score -= 10;

  // Not in burnout/critical priority (0–10)
  if (priority.focusMode !== "reduce_workload" && priority.urgencyLevel !== "critical") {
    score += 10;
  } else {
    score -= 15;
  }

  // Momentum direction (0–10)
  if (predictions?.momentumForecast) {
    if (predictions.momentumForecast.direction === "accelerating") score += 10;
    else if (predictions.momentumForecast.direction === "stable") score += 5;
    else score -= 5;
  }

  // Trajectory bonus (0–10)
  if (futureSelf.trajectoryStrength >= 60) score += 10;
  else if (futureSelf.trajectoryStrength >= 40) score += 5;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function computeConfidenceScore(
  drivers: ConfidenceDriver[],
  uncertaintySignals: UncertaintySignal[]
): number {
  let score = 50; // baseline

  // Sum driver impacts (capped)
  let driverSum = 0;
  for (const d of drivers) {
    driverSum += d.impact;
  }
  score += Math.max(-30, Math.min(40, driverSum));

  // Penalize high-severity uncertainty signals
  const highUncertainty = uncertaintySignals.filter((s) => s.severity === "high").length;
  score -= highUncertainty * 8;
  const mediumUncertainty = uncertaintySignals.filter((s) => s.severity === "medium").length;
  score -= mediumUncertainty * 3;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function determineRecommendedAction(
  confidenceScore: number,
  stability: "stable" | "fluctuating" | "emerging",
  explorationReadiness: number
): { type: "reinforce" | "explore" | "pause"; title: string; description: string } {
  if (confidenceScore >= 65 && stability !== "fluctuating") {
    return {
      type: "reinforce",
      title: "Reinforce your direction",
      description: "Your decision confidence is strong. Commit to your current career path and deepen your engagement with targeted roadmaps and milestone completions.",
    };
  }

  if (confidenceScore < 40 || stability === "fluctuating") {
    return {
      type: "explore",
      title: "Explore before deciding",
      description: "Confidence is still forming. Broaden your exploration with new career categories, comparison sessions, and quizzes to gather more signal before committing.",
    };
  }

  // Moderate or emerging — consider readiness
  if (explorationReadiness >= 60) {
    return {
      type: "explore",
      title: "Ready to explore further",
      description: "Moderate confidence with good exploration readiness. Continue exploring with focus — try targeted career comparisons to strengthen conviction.",
    };
  }

  return {
    type: "pause",
    title: "Pause and reflect",
    description: "Confidence is moderate but exploration readiness is low. Take stock of what you've learned so far before expanding. A brief reflection session may clarify your next move.",
  };
}

function buildDecisionNarrative(
  score: number,
  stability: "stable" | "fluctuating" | "emerging",
  drivers: ConfidenceDriver[],
  uncertainties: UncertaintySignal[],
  action: { type: string; title: string }
): string {
  const parts: string[] = [];

  // Opening — confidence level
  if (score >= 65) {
    parts.push("You have solid decision confidence right now.");
  } else if (score >= 45) {
    parts.push("Your decision confidence is developing — there's good signal but some uncertainty remains.");
  } else {
    parts.push("Decision confidence is low — more information is needed before making a commitment.");
  }

  // Stability context
  if (stability === "stable") {
    parts.push("Your confidence pattern is stable, indicating consistent self-assessment.");
  } else if (stability === "fluctuating") {
    parts.push("Your confidence fluctuates — this is common when exploring unfamiliar career territory.");
  } else {
    parts.push("Your confidence pattern is still emerging as you gather more career data.");
  }

  // Key driver highlight
  const posDrivers = drivers.filter((d) => d.impact > 0).sort((a, b) => b.impact - a.impact);
  const negDrivers = drivers.filter((d) => d.impact < 0).sort((a, b) => a.impact - b.impact);

  if (posDrivers.length > 0) {
    const top = posDrivers[0];
    parts.push(`Key positive: ${top.driver.toLowerCase()}.`);
  }
  if (negDrivers.length > 0) {
    const top = negDrivers[0];
    parts.push(`Key concern: ${top.driver.toLowerCase()}.`);
  }

  // Uncertainty count
  if (uncertainties.length > 0) {
    const highCount = uncertainties.filter((u) => u.severity === "high").length;
    if (highCount > 0) {
      parts.push(`${highCount} high-severity uncertainty signal${highCount > 1 ? "s" : ""} to address.`);
    } else {
      parts.push(`${uncertainties.length} uncertainty signal${uncertainties.length > 1 ? "s" : ""} to monitor.`);
    }
  }

  // Closing — action
  parts.push(`Recommended: ${action.title}.`);

  return parts.join(" ");
}

// ── Main entry points ──────────────────────────────────────────────

export function computeDecisionConfidence(): DecisionConfidenceData {
  const memory = loadJourneyMemory();
  const futureSelf = getFutureSelf();
  const predictions = loadPredictiveInsights() ?? computePredictiveInsights();
  const priority = getDecisionPriority();
  const friction = getLearningFriction();
  const pulse = loadEngagementPulse();

  const confidenceDrivers = detectConfidenceDrivers(
    futureSelf, predictions, priority, friction, pulse, memory
  );
  const uncertaintySignals = detectUncertaintySignals(
    friction, predictions, priority, pulse, memory
  );
  const decisionStability = computeDecisionStability(
    memory, futureSelf, predictions, friction
  );
  const explorationReadiness = computeExplorationReadiness(
    friction, pulse, futureSelf, predictions, priority
  );
  const confidenceScore = computeConfidenceScore(
    confidenceDrivers, uncertaintySignals
  );
  const recommendedAction = determineRecommendedAction(
    confidenceScore, decisionStability, explorationReadiness
  );
  const decisionNarrative = buildDecisionNarrative(
    confidenceScore, decisionStability, confidenceDrivers,
    uncertaintySignals, recommendedAction
  );

  return {
    confidenceScore,
    confidenceDrivers,
    uncertaintySignals,
    decisionStability,
    explorationReadiness,
    decisionNarrative,
    recommendedAction,
    computedAt: Date.now(),
  };
}

export function loadDecisionConfidence(): DecisionConfidenceData | null {
  return cached;
}

export function getDecisionConfidence(): DecisionConfidenceData {
  if (cached && Date.now() - cached.computedAt < CACHE_TTL) {
    return cached;
  }
  cached = computeDecisionConfidence();
  return cached;
}
