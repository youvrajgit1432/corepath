/**
 * RECOMMENDATION OPTIMIZATION INTELLIGENCE
 *
 * Continuously improves recommendation quality from user behavior.
 *
 * Consumed Signals:
 *   feedback-intelligence, user-analytics, journey-memory,
 *   career-history, career-affinity, career-story,
 *   mission-intelligence, decision-confidence
 *
 * Behavior:
 *   Repeated revisits → increase rank
 *   Repeated dismissals → reduce rank
 *   Strong specialization → prioritize related careers
 *   Broad exploration → increase diversity
 *   High confidence → boost top paths
 *   Low confidence → widen recommendation spread
 *
 * Persists via SafeStorage. No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { getFeedbackIntelligence } from "./feedback-intelligence";
import { getUserAnalytics } from "./user-analytics";
import { computeCareerStory, type CareerStoryData } from "./career-story";
import { getDecisionConfidence } from "./decision-confidence";
import { careers, getCareerById } from "./careers";

// ============================================================================
// TYPES
// ============================================================================

export interface CareerRankAdjustment {
  careerId: string;
  careerTitle: string;
  adjustment: number; // -50 to +50 rank delta
  reason: string;
  direction: "up" | "down" | "neutral";
}

export interface ConfidenceBoost {
  careerId: string;
  careerTitle: string;
  boost: number; // 0–30 point boost to confidence
  reason: string;
}

export interface RepeatInterestSignal {
  careerId: string;
  careerTitle: string;
  revisitCount: number;
  saveCount: number;
  lastInteraction: number;
  signalStrength: "strong" | "moderate" | "weak";
}

export interface DismissalPenalty {
  careerId: string;
  careerTitle: string;
  penalty: number; // 0–30 point penalty
  totalDismissals: number;
}

export interface ExplorationBias {
  type: "specialize" | "diversify" | "balanced";
  strength: number; // 0–100
  description: string;
}

export interface SpecializationStrength {
  domain: string;
  engagement: number; // 0–100
  careerCount: number;
  topCareers: string[];
}

export interface AdaptiveRecommendationWeight {
  careerId: string;
  careerTitle: string;
  baseWeight: number; // 0–100
  adjustedWeight: number; // 0–100 (after all adjustments)
  factors: Array<{ name: string; impact: number }>; // individual factor impacts
}

export interface RecommendationOptimizerData {
  /** 0–100 quality score for the recommendation system itself */
  recommendationQualityScore: number;
  /** Per-career rank adjustments */
  careerRankAdjustments: CareerRankAdjustment[];
  /** Confidence boosts applied to specific careers */
  confidenceBoosts: ConfidenceBoost[];
  /** Careers the user keeps coming back to */
  repeatInterestSignals: RepeatInterestSignal[];
  /** Careers the user has dismissed */
  dismissalPenalties: DismissalPenalty[];
  /** Whether we should specialize or diversify recommendations */
  explorationBias: ExplorationBias;
  /** Current specialization domains */
  specializationStrength: SpecializationStrength[];
  /** Final adaptive weights per career */
  adaptiveRecommendationWeights: AdaptiveRecommendationWeight[];
  /** Human-readable narrative */
  optimizationNarrative: string[];
  lastComputed: string;
}

// ============================================================================
// STORAGE
// ============================================================================

const COMPUTED_KEY = "corepath-recommendation-optimizer-computed";

function getStorage() {
  return getSafeStorage({ silent: true });
}

// ============================================================================
// REPEAT INTEREST SIGNALS
// ============================================================================

function computeRepeatInterestSignals(
  journey: ReturnType<typeof loadJourneyMemory>
): RepeatInterestSignal[] {
  const now = Date.now();
  const signals: RepeatInterestSignal[] = [];

  // Analyze viewed career history for repeat visits
  const revisitCounts = new Map<string, number>();
  const lastVisitMap = new Map<string, number>();

  for (const entry of journey.viewedCareerHistory) {
    const id = entry.careerId;
    revisitCounts.set(id, (revisitCounts.get(id) ?? 0) + 1);
    const ts = new Date(entry.timestamp).getTime();
    const existing = lastVisitMap.get(id) ?? 0;
    if (ts > existing) {
      lastVisitMap.set(id, ts);
    }
  }

  for (const [careerId, count] of revisitCounts) {
    if (count < 2) continue; // need at least 2 visits to be "repeat"
    const career = getCareerById(careerId);
    const careerTitle = career?.title ?? careerId;
    const lastVisit = lastVisitMap.get(careerId) ?? 0;
    const daysSinceLastVisit = Math.floor((now - lastVisit) / 86_400_000);

    let signalStrength: "strong" | "moderate" | "weak" = "weak";
    if (count >= 4 && daysSinceLastVisit <= 14) signalStrength = "strong";
    else if (count >= 3 || daysSinceLastVisit <= 7) signalStrength = "moderate";

    // Check if saved in workspace
    const savedCount = journey.completedQuizzes > 0 ? 1 : 0; // proxy

    signals.push({
      careerId,
      careerTitle,
      revisitCount: count,
      saveCount: savedCount,
      lastInteraction: lastVisit,
      signalStrength,
    });
  }

  return signals.sort((a, b) => b.revisitCount - a.revisitCount);
}

// ============================================================================
// DISMISSAL PENALTIES
// ============================================================================

function computeDismissalPenalties(
  feedback: ReturnType<typeof getFeedbackIntelligence>
): DismissalPenalty[] {
  const penalties: DismissalPenalty[] = [];

  // Track dismissal counts from feedback intelligence weight adjustments
  for (const adj of feedback.weightAdjustments) {
    if (adj.adjustment < 1.0 && adj.reason.toLowerCase().includes("dismissed")) {
      const dismissMatch = adj.reason.match(/Dismissed (\d+) time/);
      const totalDismissals = dismissMatch ? parseInt(dismissMatch[1], 10) : 1;
      const penalty = Math.round((1.0 - adj.adjustment) * 100);

      penalties.push({
        careerId: adj.careerId,
        careerTitle: adj.careerTitle,
        penalty,
        totalDismissals,
      });
    }
  }

  return penalties.sort((a, b) => b.penalty - a.penalty);
}

// ============================================================================
// RANK ADJUSTMENTS
// ============================================================================

function computeCareerRankAdjustments(
  repeatSignals: RepeatInterestSignal[],
  dismissalPenalties: DismissalPenalty[],
  feedback: ReturnType<typeof getFeedbackIntelligence>,
  journey: ReturnType<typeof loadJourneyMemory>
): CareerRankAdjustment[] {
  const adjustments: CareerRankAdjustment[] = [];
  const processed = new Set<string>();

  // Revisits → increase rank (up to +50)
  for (const signal of repeatSignals) {
    if (processed.has(signal.careerId)) continue;
    processed.add(signal.careerId);

    let boost = Math.min(signal.revisitCount * 10, 40);
    if (signal.signalStrength === "strong") boost += 10;

    adjustments.push({
      careerId: signal.careerId,
      careerTitle: signal.careerTitle,
      adjustment: boost,
      direction: "up",
      reason: `Revisited ${signal.revisitCount} times — strong sustained interest signal.`,
    });
  }

  // Dismissals → reduce rank (up to -50)
  for (const penalty of dismissalPenalties) {
    if (processed.has(penalty.careerId)) continue;
    processed.add(penalty.careerId);

    adjustments.push({
      careerId: penalty.careerId,
      careerTitle: penalty.careerTitle,
      adjustment: -penalty.penalty,
      direction: "down",
      reason: `Dismissed ${penalty.totalDismissals} time${penalty.totalDismissals > 1 ? "s" : ""} — recommendation weight reduced.`,
    });
  }

  // Check feedback affinities for additional adjustments
  for (const affinity of feedback.careerAffinities) {
    if (processed.has(affinity.careerId)) continue;
    processed.add(affinity.careerId);

    // Strong likes → boost
    if (affinity.affinity >= 50) {
      adjustments.push({
        careerId: affinity.careerId,
        careerTitle: affinity.careerTitle,
        adjustment: Math.min(Math.round(affinity.affinity * 0.4), 30),
        direction: "up",
        reason: `Strongly liked (affinity ${affinity.affinity}) — increased recommendation priority.`,
      });
    }
    // Strong dislikes → reduce
    else if (affinity.affinity <= -50) {
      adjustments.push({
        careerId: affinity.careerId,
        careerTitle: affinity.careerTitle,
        adjustment: Math.max(Math.round(affinity.affinity * 0.3), -40),
        direction: "down",
        reason: `Strongly disliked (affinity ${affinity.affinity}) — decreased recommendation priority.`,
      });
    }
  }

  // Apply comparison history boost: careers that appear in comparisons get a small boost
  const comparedCareers = new Map<string, number>();
  for (const pair of journey.comparisonHistory) {
    comparedCareers.set(pair.careerA, (comparedCareers.get(pair.careerA) ?? 0) + 1);
    comparedCareers.set(pair.careerB, (comparedCareers.get(pair.careerB) ?? 0) + 1);
  }
  for (const [careerId, count] of comparedCareers) {
    if (processed.has(careerId)) continue;
    processed.add(careerId);

    const career = getCareerById(careerId);
    if (count >= 3) {
      adjustments.push({
        careerId,
        careerTitle: career?.title ?? careerId,
        adjustment: Math.min(count * 3, 15),
        direction: "up",
        reason: `Appeared in ${count} career comparisons — active evaluation signal.`,
      });
    }
  }

  // Sort: boosts first, then penalties
  return adjustments.sort((a, b) => b.adjustment - a.adjustment);
}

// ============================================================================
// CONFIDENCE BOOSTS
// ============================================================================

function computeConfidenceBoosts(
  repeatSignals: RepeatInterestSignal[],
  journey: ReturnType<typeof loadJourneyMemory>,
  feedback: ReturnType<typeof getFeedbackIntelligence>
): ConfidenceBoost[] {
  const boosts: ConfidenceBoost[] = [];
  const processed = new Set<string>();

  // Revisits with save → biggest boost
  for (const signal of repeatSignals) {
    if (processed.has(signal.careerId)) continue;
    processed.add(signal.careerId);

    if (signal.revisitCount >= 3 && signal.saveCount > 0) {
      boosts.push({
        careerId: signal.careerId,
        careerTitle: signal.careerTitle,
        boost: 25,
        reason: `Revisited ${signal.revisitCount}x and saved — high confidence in this path.`,
      });
    } else if (signal.revisitCount >= 4) {
      boosts.push({
        careerId: signal.careerId,
        careerTitle: signal.careerTitle,
        boost: 20,
        reason: `Consistently revisited ${signal.revisitCount}x — strong ongoing interest.`,
      });
    } else if (signal.revisitCount >= 2 && signal.signalStrength === "strong") {
      boosts.push({
        careerId: signal.careerId,
        careerTitle: signal.careerTitle,
        boost: 15,
        reason: `Strong revisit signal (${signal.revisitCount}x) — growing confidence.`,
      });
    }
  }

  // High affinity careers get boost
  for (const affinity of feedback.careerAffinities) {
    if (processed.has(affinity.careerId)) continue;
    processed.add(affinity.careerId);

    if (affinity.affinity >= 70 && affinity.positiveCount >= 2) {
      boosts.push({
        careerId: affinity.careerId,
        careerTitle: affinity.careerTitle,
        boost: 20,
        reason: `High affinity (${affinity.affinity}) with multiple positive interactions.`,
      });
    } else if (affinity.affinity >= 50) {
      boosts.push({
        careerId: affinity.careerId,
        careerTitle: affinity.careerTitle,
        boost: 10,
        reason: `Positive affinity (${affinity.affinity}) — increasing confidence.`,
      });
    }
  }

  // Roadmap engagement → confidence boost
  for (const [careerId, interaction] of Object.entries(journey.roadmapInteractions)) {
    if (processed.has(careerId)) continue;
    if (interaction.complete > 0 || interaction.start > 0) {
      const career = getCareerById(careerId);
      boosts.push({
        careerId,
        careerTitle: career?.title ?? careerId,
        boost: interaction.complete > 0 ? 20 : 10,
        reason: interaction.complete > 0
          ? "Completed roadmap milestones — deep engagement signal."
          : "Started roadmap — active progress on this path.",
      });
    }
  }

  return boosts.sort((a, b) => b.boost - a.boost);
}

// ============================================================================
// EXPLORATION BIAS
// ============================================================================

function computeExplorationBias(
  journey: ReturnType<typeof loadJourneyMemory>,
  careerStory: CareerStoryData,
  decisionConfidence: ReturnType<typeof getDecisionConfidence>
): ExplorationBias {
  // Analyze breadth vs depth
  const viewedCount = Object.keys(journey.viewedCareers ?? {}).length;
  const comparedPairs = Object.keys(journey.comparedCareerPairs ?? {}).length;
  const completedQuizzes = journey.completedQuizzes;

  // Determine diversity vs specialization
  const uniqueDomains = new Set<string>();
  for (const careerId of Object.keys(journey.viewedCareers ?? {})) {
    const career = getCareerById(careerId);
    if (career?.domain) uniqueDomains.add(career.domain);
  }

  const domainCount = uniqueDomains.size;
  const breadthScore = viewedCount > 0 ? (domainCount / viewedCount) * 100 : 50;
  const momentumScore = careerStory.momentumScore;
  const confidenceScore = decisionConfidence.confidenceScore;

  let type: "specialize" | "diversify" | "balanced";
  let strength: number;
  let description: string;

  if (breadthScore > 40 && viewedCount >= 10 && domainCount >= 4) {
    // Broad exploration → diversify more
    type = "diversify";
    strength = Math.min(Math.round(breadthScore), 90);
    description = `Broad exploration across ${domainCount} domains (${viewedCount} careers viewed) — recommendations should increase diversity to surface unexpected fits.`;
  } else if (breadthScore < 25 && viewedCount >= 5 && domainCount <= 2) {
    // Focused on few domains → specialize more
    type = "specialize";
    strength = Math.min(Math.round((1 - breadthScore / 100) * 80 + 20), 90);
    description = `Focused exploration in ${domainCount} domain${domainCount > 1 ? "s" : ""} (${viewedCount} careers) — recommendations should prioritize related paths within these domains.`;
  } else if (momentumScore >= 60 && confidenceScore >= 65) {
    // High confidence + momentum → can specialize
    type = "specialize";
    strength = 65;
    description = `High confidence (${confidenceScore}/100) and momentum (${momentumScore}/100) — ready for focused specialization recommendations.`;
  } else if (momentumScore < 40 || confidenceScore < 40) {
    // Low confidence → diversify
    type = "diversify";
    strength = 70;
    description = `Lower confidence (${confidenceScore}/100) or momentum (${momentumScore}/100) — recommendations should widen to explore more options.`;
  } else {
    type = "balanced";
    strength = 50;
    description = "Balanced exploration pattern — maintaining a mix of focused and diverse recommendations.";
  }

  return { type, strength, description };
}

// ============================================================================
// SPECIALIZATION STRENGTH
// ============================================================================

function computeSpecializationStrength(
  journey: ReturnType<typeof loadJourneyMemory>
): SpecializationStrength[] {
  const domainEngagement = new Map<
    string,
    { count: number; careers: Set<string>; totalViews: number }
  >();

  for (const [careerId, views] of Object.entries(journey.viewedCareers ?? {})) {
    const career = getCareerById(careerId);
    if (!career || !career.domain) continue;

    if (!domainEngagement.has(career.domain)) {
      domainEngagement.set(career.domain, {
        count: 0,
        careers: new Set(),
        totalViews: 0,
      });
    }
    const entry = domainEngagement.get(career.domain)!;
    entry.count += views;
    entry.careers.add(career.title);
    entry.totalViews += views;
  }

  // Add theme engagement
  for (const [theme, count] of Object.entries(journey.repeatedThemes ?? {})) {
    if (count > 0) {
      const domain = theme.charAt(0).toUpperCase() + theme.slice(1);
      if (!domainEngagement.has(domain)) {
        domainEngagement.set(domain, { count: 0, careers: new Set(), totalViews: 0 });
      }
      const entry = domainEngagement.get(domain)!;
      entry.count += count;
      entry.totalViews += count;
    }
  }

  const totalEngagement = Array.from(domainEngagement.values()).reduce(
    (sum, e) => sum + e.totalViews,
    0
  );

  return Array.from(domainEngagement.entries())
    .map(([domain, data]) => ({
      domain,
      engagement:
        totalEngagement > 0
          ? Math.round((data.totalViews / totalEngagement) * 100)
          : 0,
      careerCount: data.careers.size,
      topCareers: Array.from(data.careers).slice(0, 4),
    }))
    .filter((s) => s.engagement > 0)
    .sort((a, b) => b.engagement - a.engagement);
}

// ============================================================================
// ADAPTIVE RECOMMENDATION WEIGHTS
// ============================================================================

function computeAdaptiveWeights(
  rankAdjustments: CareerRankAdjustment[],
  confidenceBoosts: ConfidenceBoost[],
  explorationBias: ExplorationBias
): AdaptiveRecommendationWeight[] {
  const weightMap = new Map<string, { base: number; factors: Array<{ name: string; impact: number }> }>();

  // Start with base weights for all careers
  for (const career of careers) {
    weightMap.set(career.id, { base: 50, factors: [] });
  }

  // Apply rank adjustments
  for (const adj of rankAdjustments) {
    const entry = weightMap.get(adj.careerId);
    if (!entry) continue;

    // Adjust base weight
    entry.base += adj.adjustment;
    entry.factors.push({
      name: adj.direction === "up" ? "Rank boost (revisit/like)" : "Rank penalty (dismissal)",
      impact: adj.adjustment,
    });
  }

  // Apply confidence boosts
  for (const boost of confidenceBoosts) {
    const entry = weightMap.get(boost.careerId);
    if (!entry) continue;

    entry.base += boost.boost;
    entry.factors.push({
      name: "Confidence boost (engagement)",
      impact: boost.boost,
    });
  }

  // Apply exploration bias modifier
  const biasModifier = explorationBias.type === "specialize" ? 10 : explorationBias.type === "diversify" ? -5 : 0;
  for (const [, entry] of weightMap) {
    if (biasModifier !== 0) {
      entry.base += biasModifier;
      entry.factors.push({
        name: `Exploration bias: ${explorationBias.type}`,
        impact: biasModifier,
      });
    }
  }

  // Clamp and build result
  const weights: AdaptiveRecommendationWeight[] = [];
  for (const [careerId, entry] of weightMap) {
    const career = getCareerById(careerId);
    const baseWeight = 50;
    const adjustedWeight = Math.max(0, Math.min(100, entry.base));

    // Only include careers with significant adjustments
    if (Math.abs(adjustedWeight - baseWeight) > 5) {
      weights.push({
        careerId,
        careerTitle: career?.title ?? careerId,
        baseWeight,
        adjustedWeight,
        factors: entry.factors,
      });
    }
  }

  return weights.sort((a, b) => b.adjustedWeight - a.adjustedWeight);
}

// ============================================================================
// QUALITY SCORE
// ============================================================================

function computeQualityScore(
  journey: ReturnType<typeof loadJourneyMemory>,
  feedback: ReturnType<typeof getFeedbackIntelligence>,
  analytics: ReturnType<typeof getUserAnalytics>,
  decisionConfidence: ReturnType<typeof getDecisionConfidence>,
  careerStory: CareerStoryData,
  repeatSignals: RepeatInterestSignal[],
  dismissalPenalties: DismissalPenalty[]
): number {
  let score = 50; // baseline

  // Engagement quality: user has completed quizzes → system has data
  if (journey.completedQuizzes >= 5) score += 15;
  else if (journey.completedQuizzes >= 2) score += 8;

  // Feedback quality: user actively provides feedback
  if (feedback.feedbackScore >= 60) score += 10;
  else if (feedback.feedbackScore >= 30) score += 5;

  // Recommendation trust: how much user trusts suggestions
  score += Math.round((feedback.recommendationTrust - 50) * 0.2);

  // Analytics variety: user uses multiple features
  const featuresUsed = Object.values(analytics.featureUsageMap).filter((c) => c > 0).length;
  if (featuresUsed >= 6) score += 10;
  else if (featuresUsed >= 3) score += 5;

  // Career story shows active journey
  if (careerStory.momentumScore >= 50) score += 8;
  else if (careerStory.storyStage !== "early") score += 4;

  // Decision confidence provides signal
  if (decisionConfidence.confidenceScore >= 60) score += 5;
  else if (decisionConfidence.confidenceScore >= 35) score += 2;

  // Repeat signals show learning
  const strongSignals = repeatSignals.filter((s) => s.signalStrength === "strong").length;
  score += Math.min(strongSignals * 3, 12);

  // Dismissal penalties show refinement
  if (dismissalPenalties.length > 0) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// NARRATIVE
// ============================================================================

function computeOptimizationNarrative(
  qualityScore: number,
  explorationBias: ExplorationBias,
  specializationStrength: SpecializationStrength[],
  repeatSignals: RepeatInterestSignal[],
  dismissalPenalties: DismissalPenalty[],
  rankAdjustments: CareerRankAdjustment[],
  confidenceBoosts: ConfidenceBoost[]
): string[] {
  const narrative: string[] = [];

  // Opening quality assessment
  if (qualityScore >= 75) {
    narrative.push(`Recommendation quality is strong (${qualityScore}/100) — the system has robust data to make personalized suggestions.`);
  } else if (qualityScore >= 50) {
    narrative.push(`Recommendation quality is developing (${qualityScore}/100) — more engagement will improve personalization.`);
  } else {
    narrative.push(`Recommendation quality is building (${qualityScore}/100) — start by completing quizzes and exploring careers.`);
  }

  // Exploration bias
  narrative.push(explorationBias.description);

  // Specialization insights
  if (specializationStrength.length > 0) {
    const topDomain = specializationStrength[0];
    narrative.push(`Strongest domain: ${topDomain.domain} (${topDomain.engagement}% engagement across ${topDomain.careerCount} careers).`);
    if (specializationStrength.length >= 2) {
      narrative.push(`Secondary domain: ${specializationStrength[1].domain} (${specializationStrength[1].engagement}%).`);
    }
  }

  // Repeat signals
  const strongRepeats = repeatSignals.filter((s) => s.signalStrength === "strong");
  if (strongRepeats.length > 0) {
    const topRepeat = strongRepeats[0];
    narrative.push(`Strong repeat interest in ${topRepeat.careerTitle} (${topRepeat.revisitCount} visits).`);
  }

  // Dismissal summary
  if (dismissalPenalties.length > 0) {
    narrative.push(`${dismissalPenalties.length} career${dismissalPenalties.length > 1 ? "s" : ""} have been deprioritized based on dismissals.`);
  }

  // Rank adjustments summary
  const boosted = rankAdjustments.filter((a) => a.direction === "up").length;
  const reduced = rankAdjustments.filter((a) => a.direction === "down").length;
  if (boosted > 0 || reduced > 0) {
    narrative.push(`${boosted} career${boosted > 1 ? "s" : ""} boosted, ${reduced} career${reduced > 1 ? "s" : ""} reduced by adaptive rank adjustments.`);
  }

  // Confidence boosts
  if (confidenceBoosts.length > 0) {
    narrative.push(`${confidenceBoosts.length} confidence boost${confidenceBoosts.length > 1 ? "s" : ""} applied to careers with strong engagement signals.`);
  }

  // Closing
  narrative.push("Recommendation optimization continuously adapts as you interact with careers, quizzes, and feedback.");

  return narrative;
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full recommendation optimization intelligence.
 */
export function computeRecommendationOptimizer(): RecommendationOptimizerData {
  const journey = loadJourneyMemory();
  const feedback = getFeedbackIntelligence();
  const analytics = getUserAnalytics();
  const decisionConfidence = getDecisionConfidence();
  const careerStory = computeCareerStory();
  // Core computations
  const repeatInterestSignals = computeRepeatInterestSignals(journey);
  const dismissalPenalties = computeDismissalPenalties(feedback);
  const careerRankAdjustments = computeCareerRankAdjustments(
    repeatInterestSignals, dismissalPenalties, feedback, journey
  );
  const confidenceBoosts = computeConfidenceBoosts(repeatInterestSignals, journey, feedback);
  const explorationBias = computeExplorationBias(journey, careerStory, decisionConfidence);
  const specializationStrength = computeSpecializationStrength(journey);
  const adaptiveRecommendationWeights = computeAdaptiveWeights(
    careerRankAdjustments, confidenceBoosts, explorationBias
  );
  const recommendationQualityScore = computeQualityScore(
    journey, feedback, analytics, decisionConfidence, careerStory,
    repeatInterestSignals, dismissalPenalties
  );
  const optimizationNarrative = computeOptimizationNarrative(
    recommendationQualityScore, explorationBias, specializationStrength,
    repeatInterestSignals, dismissalPenalties,
    careerRankAdjustments, confidenceBoosts
  );

  const data: RecommendationOptimizerData = {
    recommendationQualityScore,
    careerRankAdjustments,
    confidenceBoosts,
    repeatInterestSignals,
    dismissalPenalties,
    explorationBias,
    specializationStrength,
    adaptiveRecommendationWeights,
    optimizationNarrative,
    lastComputed: new Date().toISOString(),
  };

  getStorage().set(COMPUTED_KEY, data);
  return data;
}

/**
 * Load previously computed recommendation optimizer data.
 */
export function loadRecommendationOptimizer(): RecommendationOptimizerData | null {
  const storage = getStorage();
  const cached = storage.get<RecommendationOptimizerData>(COMPUTED_KEY);
  if (!cached) return null;
  return cached;
}

/**
 * Get current recommendation optimizer, computing fresh if needed.
 */
export function getRecommendationOptimizer(): RecommendationOptimizerData {
  const existing = loadRecommendationOptimizer();
  if (existing) return existing;
  return computeRecommendationOptimizer();
}

/**
 * Clear all recommendation optimizer data.
 */
export function clearRecommendationOptimizer(): void {
  const storage = getStorage();
  storage.remove(COMPUTED_KEY);
}
