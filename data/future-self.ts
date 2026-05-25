// CorePath — Future Self Intelligence
// Predicts and visualizes "Who is this user becoming?"
// Sources: uniqueness-intelligence, predictive-insights, personal-evolution,
//          growth-analytics, journey-memory, achievements

import { getUniqueness } from "./uniqueness-intelligence";
import { loadPredictiveInsights, computePredictiveInsights } from "./predictive-insights";
import { getPersonalEvolution } from "./personal-evolution";
import { getGrowthAnalytics } from "./growth-analytics";
import { loadJourneyMemory } from "./journey-memory";
import { loadAchievements, computeAchievements } from "./achievement-engine";

// ── Types ──────────────────────────────────────────────────────────

export interface RiskFactor {
  factor: string;
  severity: "high" | "medium" | "low";
  description: string;
  source: string;
}

export interface GrowthCatalyst {
  catalyst: string;
  strength: number; // 0–100
  description: string;
  action: string;
}

export interface CareerEvolutionStep {
  timeframe: string; // e.g., "short-term", "medium-term", "long-term"
  description: string;
  confidence: number; // 0–100
}

export interface FutureSelfData {
  futureIdentity: string;
  trajectoryStrength: number; // 0–100
  futureArchetype: string;
  likelyCareerEvolution: CareerEvolutionStep[];
  riskFactors: RiskFactor[];
  growthCatalysts: GrowthCatalyst[];
  futureNarrative: string;
  confidenceScore: number; // 0–100
  computedAt: number;
}

// ── Cache ──────────────────────────────────────────────────────────

let cached: FutureSelfData | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── Detection helpers ──────────────────────────────────────────────

function detectIdentityShift(
  evolution: ReturnType<typeof getPersonalEvolution>,
  uniqueness: ReturnType<typeof getUniqueness>
): string {
  const shift = evolution.identityShift ?? "";
  const style = uniqueness.explorationStyle;
  const signals = uniqueness.strengthSignals;
  const strongSignals = signals.filter((s) => s.strength >= 70);

  // If identity has a clear shift description, use part of it
  if (shift.length > 0 && evolution.evolutionScore >= 50) {
    // Extract key narrative fragments
    const shortShift =
      shift.length > 100 ? shift.slice(0, shift.indexOf(".") + 1) : shift;
    if (style === "specialist") {
      return `Deepening specialization — ${shortShift}`;
    }
    if (style === "explorer") {
      return `Expanding horizons — ${shortShift}`;
    }
    return shortShift;
  }

  // Fallback: construct from available data
  if (style === "specialist" && strongSignals.length >= 2) {
    return `Moving from broad exploration toward focused expertise, with ${strongSignals.length} strong strengths defining an increasingly clear professional identity.`;
  }
  if (style === "explorer" && evolution.confidenceGrowth > 5) {
    return `Growing confidence (${evolution.confidenceGrowth} point gain) alongside expanding career curiosity — an evolving, multi-faceted identity.`;
  }
  if (evolution.evolutionScore >= 40) {
    return `Steady identity formation — ${evolution.evolutionScore}/100 evolution score reflects maturing career self-awareness.`;
  }
  return "Identity is still in early formation — continued exploration will crystallize who you are becoming.";
}

function detectTrajectoryStrength(
  evolution: ReturnType<typeof getPersonalEvolution>,
  analytics: ReturnType<typeof getGrowthAnalytics>,
  achievements: ReturnType<typeof loadAchievements> | ReturnType<typeof computeAchievements>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>
): number {
  let score = 30; // baseline

  // Evolution score contribution (0–25)
  score += evolution.evolutionScore * 0.25;

  // Confidence growth contribution (0–15)
  if (evolution.confidenceGrowth > 0) score += Math.min(15, evolution.confidenceGrowth * 1.5);

  // XP trend contribution (0–15)
  if (analytics.xpTrend > 0) {
    score += Math.min(15, analytics.xpTrend * 0.05);
  }

  // Momentum direction contribution (0–15)
  if (predictions?.momentumForecast) {
    if (predictions.momentumForecast.direction === "accelerating") score += 15;
    else if (predictions.momentumForecast.direction === "stable") score += 8;
  }

  // Achievement/Lever contribution (0–15)
  const unlockedCount = achievements?.unlockedAchievements?.length ?? 0;
  score += Math.min(15, unlockedCount * 3);

  // Milestone count (0–10)
  const milestoneCount = evolution.milestoneMoments?.length ?? 0;
  score += Math.min(10, milestoneCount * 2);

  // Specialization trend bonus (0–5)
  if (analytics.specializationTrend === "deepening") score += 5;
  else if (analytics.specializationTrend === "stable") score += 2;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function projectFutureArchetype(
  evolution: ReturnType<typeof getPersonalEvolution>,
  analytics: ReturnType<typeof getGrowthAnalytics>,
  uniqueness: ReturnType<typeof getUniqueness>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>
): string {
  const style = uniqueness.explorationStyle;
  const specTrend = analytics.specializationTrend;
  const momentum = predictions?.momentumForecast?.direction;

  // Specialist + deepening → expert
  if (style === "specialist" && specTrend === "deepening") {
    return momentum === "accelerating"
      ? "Rising Expert"
      : "Deep Domain Specialist";
  }

  // Explorer + broadening → polymath / connector
  if (style === "explorer" && specTrend === "broadening") {
    return momentum === "accelerating"
      ? "Emerging Polymath"
      : "Multi-Domain Connector";
  }

  // Balanced → hybrid / strategist
  if (style === "balanced") {
    if (analytics.confidenceTrend > 5) return "Versatile Strategist";
    if (evolution.evolutionScore >= 60) return "Balanced Practitioner";
    return "Adaptive Generalist";
  }

  // Specialist but still narrowing → focused learner
  if (style === "specialist") {
    return "Focused Career Builder";
  }

  // Explorer / default
  return momentum === "declining" ? "Curious Navigator" : "Career Explorer";
}

function detectCareerEvolution(
  evolution: ReturnType<typeof getPersonalEvolution>,
  analytics: ReturnType<typeof getGrowthAnalytics>,
  uniqueness: ReturnType<typeof getUniqueness>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>,
  memory: ReturnType<typeof loadJourneyMemory>
): CareerEvolutionStep[] {
  const steps: CareerEvolutionStep[] = [];
  const style = uniqueness.explorationStyle;
  const specTrend = analytics.specializationTrend;

  // Short-term (next 1-2 weeks)
  if (style === "specialist" || specTrend === "deepening") {
    steps.push({
      timeframe: "short-term",
      description: "Deepening expertise in your strongest areas through targeted roadmap engagement and skill-focused quizzes.",
      confidence: 75,
    });
  } else if (style === "explorer" || specTrend === "broadening") {
    steps.push({
      timeframe: "short-term",
      description: "Continuing broad exploration to identify 2-3 promising career clusters for deeper evaluation.",
      confidence: 70,
    });
  } else {
    steps.push({
      timeframe: "short-term",
      description: "Balanced engagement — completing assessments and roadmaps to refine career preferences.",
      confidence: 68,
    });
  }

  // Medium-term (next 1-3 months)
  const momentumConf = predictions?.momentumForecast?.confidence ?? 50;
  const futureSigCount = predictions?.futureSignals?.length ?? 0;

  if (analytics.xpTrend >= 100 && evolution.evolutionScore >= 55) {
    steps.push({
      timeframe: "medium-term",
      description: "Accelerating toward career clarity — momentum and self-awareness compound into confident decision-making. Likely convergence on a top career path.",
      confidence: Math.min(85, 65 + Math.round(analytics.confidenceTrend)),
    });
  } else if (futureSigCount >= 3) {
    steps.push({
      timeframe: "medium-term",
      description: `Building on ${futureSigCount} detected future signals — consistent engagement will translate exploration into concrete career direction.`,
      confidence: 60,
    });
  } else {
    steps.push({
      timeframe: "medium-term",
      description: "Gradual preference crystallization as repeated exposure to career options reveals authentic priorities.",
      confidence: 55,
    });
  }

  // Long-term (3-12 months)
  const milestoneCount = evolution.milestoneMoments?.length ?? 0;
  const achievementsCount = (loadAchievements() ?? computeAchievements()).unlockedAchievements?.length ?? 0;
  const totalProgress = milestoneCount + achievementsCount + memory.completedQuizzes;

  if (totalProgress >= 10 && analytics.xpTrend >= 50) {
    steps.push({
      timeframe: "long-term",
      description: "Well-established career intelligence with sufficient data to make informed, confident career moves. Ready for active career transitions or focused upskilling.",
      confidence: Math.min(90, 60 + totalProgress * 2),
    });
  } else if (totalProgress >= 5) {
    steps.push({
      timeframe: "long-term",
      description: "Developing a robust career profile — sufficient exploration history to begin narrowing toward actionable paths.",
      confidence: 55,
    });
  } else {
    steps.push({
      timeframe: "long-term",
      description: "Building the foundation for career intelligence — more exploration data will strengthen predictions and recommendations.",
      confidence: 40,
    });
  }

  return steps;
}

function detectRiskFactors(
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>,
  analytics: ReturnType<typeof getGrowthAnalytics>,
  evolution: ReturnType<typeof getPersonalEvolution>,
  memory: ReturnType<typeof loadJourneyMemory>
): RiskFactor[] {
  const risks: RiskFactor[] = [];

  // Dropoff risk from predictions
  if (predictions?.dropoffRisk) {
    if (predictions.dropoffRisk.level === "high") {
      risks.push({
        factor: "Disengagement risk",
        severity: "high",
        description: predictions.dropoffRisk.summary,
        source: "predictive-insights",
      });
    } else if (predictions.dropoffRisk.level === "elevated") {
      risks.push({
        factor: "Moderate disengagement risk",
        severity: "medium",
        description: predictions.dropoffRisk.summary,
        source: "predictive-insights",
      });
    }
  }

  // Confidence decline
  if (analytics.confidenceTrend < -5) {
    risks.push({
      factor: "Confidence decline",
      severity: analytics.confidenceTrend < -10 ? "high" : "medium",
      description: `Confidence has dropped by ${Math.abs(analytics.confidenceTrend)} points — may indicate uncertainty or reassessment.`,
      source: "growth-analytics",
    });
  }

  // Momentum declining
  if (predictions?.momentumForecast?.direction === "declining") {
    risks.push({
      factor: "Momentum slowdown",
      severity: "medium",
      description: "Engagement momentum is forecast to decline without intervention.",
      source: "predictive-insights",
    });
  }

  // Low consistency
  if (memory.completedQuizzes < 3 && Object.keys(memory.viewedCareers).length < 5) {
    risks.push({
      factor: "Insufficient exploration data",
      severity: "medium",
      description: "Less than 3 quiz sessions and 5 career views — predictions have limited signal resolution.",
      source: "journey-memory",
    });
  }

  // Stagnant evolution
  if (evolution.evolutionScore < 30 && memory.completedQuizzes >= 2) {
    risks.push({
      factor: "Slow evolution velocity",
      severity: "low",
      description: "Evolution score is below 30 despite multiple sessions — consider more varied career exploration.",
      source: "personal-evolution",
    });
  }

  // Direction unclear
  if (predictions?.careerDirectionConfidence) {
    const dir = predictions.careerDirectionConfidence;
    if (dir.level === "unclear" || dir.level === "early") {
      risks.push({
        factor: "Unclear career direction",
        severity: dir.level === "unclear" ? "medium" : "low",
        description: dir.summary,
        source: "predictive-insights",
      });
    }
  }

  return risks;
}

function detectGrowthCatalysts(
  evolution: ReturnType<typeof getPersonalEvolution>,
  analytics: ReturnType<typeof getGrowthAnalytics>,
  uniqueness: ReturnType<typeof getUniqueness>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>,
  achievements: ReturnType<typeof loadAchievements> | ReturnType<typeof computeAchievements>
): GrowthCatalyst[] {
  const catalysts: GrowthCatalyst[] = [];

  // Strong evolution momentum
  if (evolution.evolutionScore >= 60) {
    catalysts.push({
      catalyst: "Strong evolution momentum",
      strength: evolution.evolutionScore,
      description: `Overall evolution at ${evolution.evolutionScore}/100 — above-average growth trajectory provides a foundation for accelerated development.`,
      action: "Continue current cadence and take on progressively challenging milestones.",
    });
  }

  // Rising confidence
  if (evolution.confidenceGrowth > 10) {
    catalysts.push({
      catalyst: "Rapid confidence growth",
      strength: Math.min(100, 50 + evolution.confidenceGrowth * 2),
      description: `Confidence has grown by ${evolution.confidenceGrowth} points — indicates increasing self-awareness and decision clarity.`,
      action: "Channel confidence into committing to a focused career roadmap.",
    });
  }

  // Accelerating XP
  if (analytics.xpTrend >= 100) {
    catalysts.push({
      catalyst: "Accelerating engagement",
      strength: Math.min(95, 50 + analytics.xpTrend * 0.15),
      description: `${analytics.xpTrend} XP gained recently — engagement is compounding, which accelerates career intelligence growth.`,
      action: "Maintain or slightly increase weekly session frequency to sustain acceleration.",
    });
  }

  // Strong uniqueness / differentiation
  if (uniqueness.uniquenessScore >= 60) {
    catalysts.push({
      catalyst: "Distinctive career profile",
      strength: uniqueness.uniquenessScore,
      description: `Uniqueness score of ${uniqueness.uniquenessScore}/100 — a differentiated profile creates clearer market positioning opportunities.`,
      action: "Document your unique combination of strengths and articulate how they solve specific problems.",
    });
  }

  // Achievement momentum
  const unlockedCount = achievements?.unlockedAchievements?.length ?? 0;
  if (unlockedCount >= 5) {
    catalysts.push({
      catalyst: "Achievement momentum",
      strength: Math.min(90, 40 + unlockedCount * 8),
      description: `${unlockedCount} achievements unlocked — consistent progress reinforces engagement and motivation.`,
      action: "Target next achievement milestones to maintain momentum and unlock new insights.",
    });
  }

  // Positive future signals
  if (predictions?.futureSignals && predictions.futureSignals.length >= 2) {
    const topSignal = predictions.futureSignals[0];
    catalysts.push({
      catalyst: `Forward signal: ${topSignal.signal.replace(/_/g, " ")}`,
      strength: topSignal.likelihood === "high" ? 80 : topSignal.likelihood === "moderate" ? 60 : 45,
      description: topSignal.detail,
      action: "Act on emerging signals by doing targeted deep-dives into related career areas.",
    });
  }

  return catalysts;
}

function computeConfidenceScore(
  memory: ReturnType<typeof loadJourneyMemory>,
  evolution: ReturnType<typeof getPersonalEvolution>,
  analytics: ReturnType<typeof getGrowthAnalytics>,
  predictions: ReturnType<typeof loadPredictiveInsights> | ReturnType<typeof computePredictiveInsights>
): number {
  let score = 30; // baseline

  // Data quantity (0–25)
  const quizCount = memory.completedQuizzes;
  const viewCount = Object.keys(memory.viewedCareers).length;
  const totalDataPoints = quizCount + viewCount + memory.comparisonHistory.length;
  score += Math.min(25, totalDataPoints * 3);

  // Data quality — variance in confidence suggests more nuanced data (0–15)
  if (memory.confidenceHistory.length >= 3) {
    const avg = memory.confidenceHistory.reduce((a, b) => a + b, 0) / memory.confidenceHistory.length;
    const variance = memory.confidenceHistory.reduce((a, b) => a + (b - avg) ** 2, 0) / memory.confidenceHistory.length;
    // Some variance is good (signals thoughtfulness), too little is bad
    if (variance > 5 && variance < 400) score += 10;
    else score += 5;
  }

  // Trend stability (0–15)
  if (analytics.specializationTrend !== "stable") score += 5;
  if (evolution.evolutionScore >= 50) score += 10;
  else if (evolution.evolutionScore >= 30) score += 5;

  // Prediction consistency (0–20)
  if (predictions?.momentumForecast) {
    score += predictions.momentumForecast.confidence * 0.1;
  }
  if (predictions?.careerDirectionConfidence) {
    const dirScore = predictions.careerDirectionConfidence.score;
    score += Math.min(10, dirScore * 0.1);
  }

  // Time elapsed bonus (0–10)
  const timeElapsed = Date.now() - new Date(memory.createdAt).getTime();
  const daysElapsed = timeElapsed / (1000 * 60 * 60 * 24);
  score += Math.min(10, Math.floor(daysElapsed));

  return Math.round(Math.max(0, Math.min(100, score)));
}

function buildFutureNarrative(
  futureIdentity: string,
  trajectory: number,
  archetype: string,
  catalysts: GrowthCatalyst[],
  risks: RiskFactor[],
  evolution: ReturnType<typeof getPersonalEvolution>,
  confidence: number
): string {
  const parts: string[] = [];

  // Opening — future identity statement
  if (trajectory >= 65) {
    parts.push(`You are on a strong trajectory toward becoming a "${archetype}."`);
  } else if (trajectory >= 40) {
    parts.push(`You are developing toward a "${archetype}" profile with steady progress.`);
  } else {
    parts.push(`Your future career profile is still forming — you have the foundation to become a "${archetype}."`);
  }

  // Identity shift context
  if (futureIdentity.length > 0) {
    parts.push(futureIdentity.length > 120
      ? futureIdentity.slice(0, futureIdentity.indexOf(".", 80) + 1)
      : futureIdentity
    );
  }

  // Catalysts highlight
  if (catalysts.length > 0) {
    const top = catalysts.slice(0, 2);
    const catalystDesc = top.map((c) => c.catalyst.toLowerCase()).join(" and ");
    parts.push(`Key growth accelerators include ${catalystDesc}.`);
  }

  // Risk acknowledgment
  const highRisks = risks.filter((r) => r.severity === "high");
  if (highRisks.length > 0) {
    parts.push(`Addressing ${highRisks.length} high-severity risk${highRisks.length > 1 ? "s" : ""} will strengthen your trajectory.`);
  } else if (risks.length > 0) {
    parts.push(`${risks.length} minor risk${risks.length > 1 ? "s" : ""} to monitor as you progress.`);
  }

  // Closing
  if (confidence >= 70) {
    parts.push("This projection is based on substantial career intelligence data and is highly reliable.");
  } else if (confidence >= 45) {
    parts.push("This projection will become more refined as you continue exploring and gathering career data.");
  } else {
    parts.push("More career exploration data will significantly improve the accuracy of this projection.");
  }

  return parts.join(" ");
}

// ── Main entry points ──────────────────────────────────────────────

export function computeFutureSelf(): FutureSelfData {
  const memory = loadJourneyMemory();
  const evolution = getPersonalEvolution();
  const analytics = getGrowthAnalytics();
  const uniqueness = getUniqueness();
  const predictions = loadPredictiveInsights() ?? computePredictiveInsights();
  const achievements = loadAchievements() ?? computeAchievements();

  const futureIdentity = detectIdentityShift(evolution, uniqueness);
  const trajectoryStrength = detectTrajectoryStrength(evolution, analytics, achievements, predictions);
  const futureArchetype = projectFutureArchetype(evolution, analytics, uniqueness, predictions);
  const likelyCareerEvolution = detectCareerEvolution(evolution, analytics, uniqueness, predictions, memory);
  const riskFactors = detectRiskFactors(predictions, analytics, evolution, memory);
  const growthCatalysts = detectGrowthCatalysts(evolution, analytics, uniqueness, predictions, achievements);
  const confidenceScore = computeConfidenceScore(memory, evolution, analytics, predictions);
  const futureNarrative = buildFutureNarrative(
    futureIdentity, trajectoryStrength, futureArchetype,
    growthCatalysts, riskFactors, evolution, confidenceScore
  );

  return {
    futureIdentity,
    trajectoryStrength,
    futureArchetype,
    likelyCareerEvolution,
    riskFactors,
    growthCatalysts,
    futureNarrative,
    confidenceScore,
    computedAt: Date.now(),
  };
}

export function loadFutureSelf(): FutureSelfData | null {
  return cached;
}

export function getFutureSelf(): FutureSelfData {
  if (cached && Date.now() - cached.computedAt < CACHE_TTL) {
    return cached;
  }
  cached = computeFutureSelf();
  return cached;
}
