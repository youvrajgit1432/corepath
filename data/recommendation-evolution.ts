/**
 * RECOMMENDATION EVOLUTION INTELLIGENCE
 *
 * Tracks how career recommendations change over time and explains why.
 * Snapshots recommendation rankings and compares consecutive snapshots
 * to detect shifts, confidence changes, and driving factors.
 *
 * Reads from:
 *   - career-matching       (current recommendations)
 *   - quiz                  (TraitScores for career matching)
 *   - quiz-enhanced         (identity traits)
 *   - behavior-patterns     (user behavior influences)
 *   - growth-analytics      (confidence/specialization trends)
 *   - journey-memory        (user activity history)
 *   - predictive-insights   (prediction context)
 *
 * No backend. No auth. Persists snapshots via SafeStorage.
 */

import { getCareerRecommendations, type CareerMatch } from "./career-matching";
import type { TraitScores } from "./quiz";
import { computeBehaviorPatterns } from "./behavior-patterns";
import { getGrowthAnalytics } from "./growth-analytics";
import { loadJourneyMemory } from "./journey-memory";
import { computePredictiveInsights } from "./predictive-insights";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-recommendation-evolution";
const TRAITS_KEY = "corepath-user-traits";
const MAX_SNAPSHOTS = 20;
const TOP_N = 10;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/** A single point-in-time snapshot of career recommendations */
export interface RecSnapshot {
  id: string;
  timestamp: string;
  /** Ranked career entries at this point */
  careers: RankedCareer[];
  /** The trait vector used for matching */
  traits: TraitScores;
}

/** A career entry within a snapshot */
export interface RankedCareer {
  id: string;
  title: string;
  score: number;
  rank: number;
}

/** A detected ranking shift between two snapshots */
export interface RankingShift {
  careerId: string;
  careerTitle: string;
  previousRank: number | null;
  currentRank: number;
  previousScore: number | null;
  currentScore: number;
  scoreDelta: number;
  direction: "up" | "down" | "new" | "gone" | "unchanged";
  reason: string;
}

/** How confidence in a career changed */
export interface ConfidenceChange {
  careerId: string;
  careerTitle: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  direction: "increased" | "decreased" | "unchanged";
}

/** Signal explaining why rankings shifted */
export interface WhyChangedSignal {
  dimension: string;
  description: string;
  impact: "high" | "medium" | "low";
}

/** How the user's identity traits influenced changes */
export interface IdentityInfluence {
  trait: string;
  impact: string;
  careersInfluenced: string[];
}

/** How behavior patterns influenced changes */
export interface BehaviorInfluence {
  pattern: string;
  description: string;
  effect: string;
}

/** Human-readable timeline summary */
export interface TimelineNarrative {
  summary: string;
  keyEvents: string[];
}

// ============================================================================
// COMPUTED OUTPUT TYPE
// ============================================================================

export interface RecommendationEvolutionData {
  recommendationHistory: RecSnapshot[];
  rankingShifts: RankingShift[];
  confidenceChanges: ConfidenceChange[];
  whyChangedSignals: WhyChangedSignal[];
  identityInfluences: IdentityInfluence[];
  behaviorInfluences: BehaviorInfluence[];
  timelineNarrative: TimelineNarrative;
  /** Total number of comparisons made */
  totalSnapshots: number;
  computedAt: string;
}

// ============================================================================
// INTERNAL STORAGE
// ============================================================================

function getStorage() {
  return getSafeStorage({ silent: true });
}

function loadSnapshots(): RecSnapshot[] {
  const stored = getStorage().get<RecSnapshot[]>(STORAGE_KEY);
  return Array.isArray(stored) ? stored : [];
}

function saveSnapshots(snapshots: RecSnapshot[]): void {
  const pruned = snapshots.slice(0, MAX_SNAPSHOTS);
  getStorage().set(STORAGE_KEY, pruned);
}

/** Attempt to load stored TraitScores from safe-storage */
function loadStoredTraits(): TraitScores | null {
  const stored = getStorage().get<TraitScores>(TRAITS_KEY);
  if (stored && typeof stored.analytical === "number") return stored;
  return null;
}

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `rec-evol-${Date.now()}-${idCounter}`;
}

// ============================================================================
// SNAPSHOT CREATION
// ============================================================================

function createSnapshot(traits: TraitScores): RecSnapshot {
  const result = getCareerRecommendations(traits, TOP_N);

  const careers: RankedCareer[] = result.topMatches.map((m, i) => ({
    id: m.career.id,
    title: m.career.title,
    score: Math.round(m.score * 10) / 10,
    rank: i + 1,
  }));

  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    careers,
    traits,
  };
}

// ============================================================================
// COMPARISON: Detect ranking shifts between two snapshots
// ============================================================================

function detectRankingShifts(
  previous: RecSnapshot | null,
  current: RecSnapshot
): RankingShift[] {
  if (!previous) return [];

  const prevMap = new Map(previous.careers.map((c) => [c.id, c]));
  const shifts: RankingShift[] = [];

  // Careers in current snapshot
  for (const curr of current.careers) {
    const prev = prevMap.get(curr.id);
    if (!prev) {
      shifts.push({
        careerId: curr.id,
        careerTitle: curr.title,
        previousRank: null,
        currentRank: curr.rank,
        previousScore: null,
        currentScore: curr.score,
        scoreDelta: curr.score,
        direction: "new",
        reason: "This career appeared as a new recommendation.",
      });
    } else {
      const delta = Math.round((curr.score - prev.score) * 10) / 10;
      const rankDiff = prev.rank - curr.rank; // positive = moved up
      let direction: RankingShift["direction"];
      let reason: string;

      if (rankDiff > 0) {
        direction = "up";
        reason = `Moved up ${rankDiff} position${rankDiff > 1 ? "s" : ""} (score ${delta >= 0 ? "+" : ""}${delta}).`;
      } else if (rankDiff < 0) {
        direction = "down";
        reason = `Moved down ${Math.abs(rankDiff)} position${Math.abs(rankDiff) > 1 ? "s" : ""} (score ${delta >= 0 ? "+" : ""}${delta}).`;
      } else {
        direction = "unchanged";
        reason = `Ranked #${curr.rank} (score ${delta >= 0 ? "+" : ""}${delta}).`;
      }

      shifts.push({
        careerId: curr.id,
        careerTitle: curr.title,
        previousRank: prev.rank,
        currentRank: curr.rank,
        previousScore: prev.score,
        currentScore: curr.score,
        scoreDelta: delta,
        direction,
        reason,
      });
    }

    prevMap.delete(curr.id);
  }

  // Careers that were in previous but not in current (gone)
  for (const [, prev] of prevMap) {
    shifts.push({
      careerId: prev.id,
      careerTitle: prev.title,
      previousRank: prev.rank,
      currentRank: -1,
      previousScore: prev.score,
      currentScore: 0,
      scoreDelta: -prev.score,
      direction: "gone",
      reason: "No longer in the top recommendations.",
    });
  }

  // Sort by direction importance: new > up > down > unchanged > gone
  const sortOrder: Record<string, number> = { new: 0, up: 1, down: 2, unchanged: 3, gone: 4 };
  shifts.sort((a, b) => (sortOrder[a.direction] ?? 5) - (sortOrder[b.direction] ?? 5));

  return shifts;
}

// ============================================================================
// CONFIDENCE CHANGES
// ============================================================================

function detectConfidenceChanges(
  previous: RecSnapshot | null,
  current: RecSnapshot
): ConfidenceChange[] {
  if (!previous) return [];

  const prevMap = new Map(previous.careers.map((c) => [c.id, c]));
  const changes: ConfidenceChange[] = [];

  for (const curr of current.careers) {
    const prev = prevMap.get(curr.id);
    if (!prev) continue;

    const delta = Math.round((curr.score - prev.score) * 10) / 10;
    let direction: ConfidenceChange["direction"];
    if (delta > 0) direction = "increased";
    else if (delta < 0) direction = "decreased";
    else direction = "unchanged";

    if (direction !== "unchanged") {
      changes.push({
        careerId: curr.id,
        careerTitle: curr.title,
        previousScore: prev.score,
        currentScore: curr.score,
        delta,
        direction,
      });
    }
  }

  changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return changes.slice(0, 8);
}

// ============================================================================
// WHY-CHANGED SIGNALS
// ============================================================================

function computeWhyChangedSignals(
  shifts: RankingShift[],
  previous: RecSnapshot | null,
  current: RecSnapshot
): WhyChangedSignal[] {
  const signals: WhyChangedSignal[] = [];
  const behavior = computeBehaviorPatterns();
  const analytics = getGrowthAnalytics();
  const memory = loadJourneyMemory();
  const insights = computePredictiveInsights();

  // 1. Quiz retake → trait shift
  if (memory.completedQuizzes > 0) {
    const hasScoreChanges = shifts.some((s) => s.direction === "up" || s.direction === "down");
    if (hasScoreChanges && previous) {
      signals.push({
        dimension: "quiz_retake",
        description: "Recent quiz or identity changes may have shifted your trait profile, affecting career alignment scores.",
        impact: "high",
      });
    }
  }

  // 2. Exploration expansion
  if (behavior.explorationHabits.style === "scattered" || behavior.explorationHabits.categoriesExplored >= 4) {
    signals.push({
      dimension: "exploration_breadth",
      description: "You've been exploring broadly across many career categories, which dilutes focused alignment signals.",
      impact: "medium",
    });
  }

  // 3. Confidence shift
  if (analytics.confidenceTrend > 5) {
    signals.push({
      dimension: "confidence_growth",
      description: `Your confidence has trended upward (${analytics.confidenceTrend}%), strengthening alignment with careers that match your growing self-awareness.`,
      impact: "medium",
    });
  } else if (analytics.confidenceTrend < -5) {
    signals.push({
      dimension: "confidence_decline",
      description: "Your confidence has dipped, which may reduce alignment clarity across all career matches.",
      impact: "medium",
    });
  }

  // 4. Specialization shift
  if (analytics.specializationTrend === "deepening") {
    signals.push({
      dimension: "specialization_deepening",
      description: "You're moving toward deeper specialization, which strengthens alignment with focused technical careers.",
      impact: "high",
    });
  } else if (analytics.specializationTrend === "broadening") {
    signals.push({
      dimension: "specialization_broadening",
      description: "You're exploring broadly, which may increase alignment with generalist or hybrid career paths.",
      impact: "medium",
    });
  }

  // 5. Momentum / dropoff signals
  if (insights.momentumForecast.direction === "accelerating") {
    signals.push({
      dimension: "momentum_increasing",
      description: "Your learning momentum is accelerating, potentially improving alignment with ambitious or growth-oriented careers.",
      impact: "low",
    });
  }

  return signals;
}

// ============================================================================
// IDENTITY INFLUENCES
// ============================================================================

function computeIdentityInfluences(
  current: RecSnapshot,
  shifts: RankingShift[]
): IdentityInfluence[] {
  const influences: IdentityInfluence[] = [];
  const behavior = computeBehaviorPatterns();
  const analytics = getGrowthAnalytics();

  // Map trait vectors to influence descriptions
  const traitMap: Record<string, { label: string; careers: string[] }> = {};

  // Analytical → careers with strong problem-solving alignment
  const analyticalVal = current.traits.analytical ?? 0;
  if (analyticalVal > 0.6) {
    traitMap["analytical"] = {
      label: `Strong analytical thinking (${Math.round(analyticalVal * 100)}%)`,
      careers: [],
    };
  }

  // Technical depth → technical careers
  const techVal = current.traits["technical-depth"] ?? 0;
  if (techVal > 0.5) {
    traitMap["technical-depth"] = {
      label: `Technical depth preference (${Math.round(techVal * 100)}%)`,
      careers: [],
    };
  }

  // Creativity → creative/innovative careers
  const creativeVal = current.traits.creativity ?? 0;
  if (creativeVal > 0.5) {
    traitMap["creativity"] = {
      label: `Creative orientation (${Math.round(creativeVal * 100)}%)`,
      careers: [],
    };
  }

  // Social / people → people-oriented careers
  const socialVal = current.traits.social ?? 0;
  if (socialVal > 0.5) {
    traitMap["social"] = {
      label: `People-orientation (${Math.round(socialVal * 100)}%)`,
      careers: [],
    };
  }

  // Risk tolerance → dynamic careers
  const riskVal = current.traits["risk-tolerance"] ?? 0;
  if (riskVal > 0.5) {
    traitMap["risk-tolerance"] = {
      label: `Risk tolerance (${Math.round(riskVal * 100)}%)`,
      careers: [],
    };
  }

  // Associate shifted careers with identity traits based on career categories
  const shiftedIds = new Set(shifts.filter((s) => s.direction === "up" || s.direction === "new").map((s) => s.careerId));
  if (shiftedIds.size > 0) {
    const allCareers = current.careers.filter((c) => shiftedIds.has(c.id));
    for (const career of allCareers) {
      // Heuristic: assign to strongest trait
      const sorted = Object.entries(current.traits)
        .filter(([, v]) => typeof v === "number")
        .sort(([, a], [, b]) => b - a);
      const topTrait = sorted[0]?.[0];
      if (topTrait && traitMap[topTrait]) {
        traitMap[topTrait].careers.push(career.title);
      }
    }
  }

  for (const [trait, info] of Object.entries(traitMap)) {
    if (info.careers.length > 0 || Object.keys(traitMap).length <= 3) {
      influences.push({
        trait: info.label,
        impact: info.careers.length > 0
          ? `Influencing alignment with ${info.careers.slice(0, 3).join(", ")}`
          : "Shaping overall career alignment direction",
        careersInfluenced: info.careers.slice(0, 3),
      });
    }
  }

  // Add specialization trend influence
  if (analytics.specializationTrend === "deepening") {
    influences.push({
      trait: "Specialization trajectory",
      impact: "Deepening focus is concentrating match scores around fewer, more aligned careers",
      careersInfluenced: [],
    });
  }

  return influences;
}

// ============================================================================
// BEHAVIOR INFLUENCES
// ============================================================================

function computeBehaviorInfluences(
  shifts: RankingShift[]
): BehaviorInfluence[] {
  const influences: BehaviorInfluence[] = [];
  const behavior = computeBehaviorPatterns();
  const analytics = getGrowthAnalytics();

  // Learning consistency
  if (behavior.learningConsistency.score >= 50) {
    influences.push({
      pattern: "learning_consistency",
      description: `Consistent learning engagement (${behavior.learningConsistency.score}/100)`,
      effect: "Regular engagement builds clearer career signals and more stable rankings",
    });
  } else if (behavior.learningConsistency.score < 20) {
    influences.push({
      pattern: "low_consistency",
      description: "Inconsistent learning engagement",
      effect: "Low consistency may cause recommendation volatility as signals fluctuate",
    });
  }

  // Dropoff patterns
  if (behavior.dropoffPatterns.length > 0) {
    const avgRate = behavior.dropoffPatterns.reduce((a, d) => a + d.rate, 0) / behavior.dropoffPatterns.length;
    if (avgRate > 0.5) {
      influences.push({
        pattern: "dropoff_tendency",
        description: "Higher disengagement rate from career exploration activities",
        effect: "Frequent dropoffs may reduce signal clarity, making recommendations less decisive",
      });
    }
  }

  // Career looping
  if (behavior.careerLoopSignals.length >= 2) {
    influences.push({
      pattern: "career_comparison_looping",
      description: `Returning to the same ${behavior.careerLoopSignals.length} career comparisons repeatedly`,
      effect: "Indecision between a few careers keeps their rankings close and volatile",
    });
  }

  // Curiosity signals
  const strongCuriosity = behavior.curiositySignals.filter((s) => s.strength === "strong").length;
  if (strongCuriosity >= 2) {
    influences.push({
      pattern: "strong_curiosity",
      description: "High curiosity activity — exploring diverse career themes and AI-related content",
      effect: "Broad curiosity may surface new career recommendations that weren't previously considered",
    });
  }

  // Learning momentum
  if (analytics.xpTrend > 5) {
    influences.push({
      pattern: "xp_momentum",
      description: "Accelerating XP accumulation",
      effect: "Growing momentum correlates with clearer career direction and more confident rankings",
    });
  }

  return influences;
}

// ============================================================================
// TIMELINE NARRATIVE
// ============================================================================

function buildTimelineNarrative(
  history: RecSnapshot[],
  shifts: RankingShift[],
  previous: RecSnapshot | null
): TimelineNarrative {
  const events: string[] = [];

  if (history.length <= 1) {
    return {
      summary: "Initial recommendation snapshot recorded. Rankings will be tracked and compared as new data accumulates.",
      keyEvents: ["First recommendation snapshot captured"],
    };
  }

  if (previous) {
    events.push(`Compared against previous snapshot (${history.length - 1} snapshot${history.length - 1 > 1 ? "s" : ""} ago).`);
  }

  // Detect major shifts
  const upShifts = shifts.filter((s) => s.direction === "up");
  const downShifts = shifts.filter((s) => s.direction === "down");
  const newCareers = shifts.filter((s) => s.direction === "new");
  const goneCareers = shifts.filter((s) => s.direction === "gone");

  if (newCareers.length > 0) {
    events.push(`${newCareers.length} new career${newCareers.length > 1 ? "s" : ""} entered the top recommendations: ${newCareers.map((s) => s.careerTitle).slice(0, 3).join(", ")}${newCareers.length > 3 ? ` +${newCareers.length - 3} more` : ""}.`);
  }

  if (upShifts.length > 0) {
    const topUp = upShifts.slice(0, 2);
    events.push(`${topUp.map((s) => `${s.careerTitle} moved up to #${s.currentRank}`).join(", ")}.`);
  }

  if (downShifts.length > 0) {
    const topDown = downShifts.slice(0, 2);
    events.push(`${topDown.map((s) => `${s.careerTitle} moved down to #${s.currentRank}`).join(", ")}.`);
  }

  if (goneCareers.length > 0) {
    events.push(`${goneCareers.map((s) => s.careerTitle).slice(0, 2).join(", ")} ${goneCareers.length > 2 ? `and ${goneCareers.length - 2} other` : ""} dropped from the top recommendations.`);
  }

  const summary = events.length > 0
    ? `Since the last snapshot: ${events.join(" ")}`
    : "No significant ranking changes detected between snapshots.";

  return { summary, keyEvents: events };
}

// ============================================================================
// MAIN PUBLIC API
// ============================================================================

/**
 * Compute recommendation evolution: snapshots current recommendations,
 * compares against history, and generates explanatory signals.
 *
 * Provide `currentTraits` if available; otherwise tries to load from storage.
 * If no traits can be found, returns history-based analysis without a new snapshot.
 */
export function computeRecommendationEvolution(
  currentTraits?: TraitScores | null
): RecommendationEvolutionData {
  const history = loadSnapshots();
  const traits = currentTraits ?? loadStoredTraits();

  let snapshots = history;

  if (traits) {
    // Store traits for future use
    getStorage().set(TRAITS_KEY, traits);

    // Create new snapshot
    const snapshot = createSnapshot(traits);
    snapshots = [snapshot, ...history];

    // Persist
    saveSnapshots(snapshots);
  }

  // Get the two most recent snapshots for comparison
  const current = snapshots[0] ?? null;
  const previous = snapshots[1] ?? null;

  // Detect shifts
  const rankingShifts = current && previous
    ? detectRankingShifts(previous, current)
    : [];

  // Detect confidence changes
  const confidenceChanges = current && previous
    ? detectConfidenceChanges(previous, current)
    : [];

  // Compute why-changed signals
  const whyChangedSignals = current && previous
    ? computeWhyChangedSignals(rankingShifts, previous, current)
    : [];

  // Compute identity influences
  const identityInfluences = current
    ? computeIdentityInfluences(current, rankingShifts)
    : [];

  // Compute behavior influences
  const behaviorInfluences = computeBehaviorInfluences(rankingShifts);

  // Build timeline narrative
  const timelineNarrative = buildTimelineNarrative(snapshots, rankingShifts, previous);

  return {
    recommendationHistory: snapshots,
    rankingShifts,
    confidenceChanges,
    whyChangedSignals,
    identityInfluences,
    behaviorInfluences,
    timelineNarrative,
    totalSnapshots: snapshots.length,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Load previously computed recommendation evolution data from storage.
 */
export function loadRecommendationEvolution(): RecommendationEvolutionData | null {
  const history = loadSnapshots();
  if (history.length === 0) return null;

  const current = history[0] ?? null;
  const previous = history[1] ?? null;

  const rankingShifts = current && previous
    ? detectRankingShifts(previous, current)
    : [];

  const confidenceChanges = current && previous
    ? detectConfidenceChanges(previous, current)
    : [];

  const whyChangedSignals = current && previous
    ? computeWhyChangedSignals(rankingShifts, previous, current)
    : [];

  const identityInfluences = current
    ? computeIdentityInfluences(current, rankingShifts)
    : [];

  const behaviorInfluences = computeBehaviorInfluences(rankingShifts);
  const timelineNarrative = buildTimelineNarrative(history, rankingShifts, previous);

  return {
    recommendationHistory: history,
    rankingShifts,
    confidenceChanges,
    whyChangedSignals,
    identityInfluences,
    behaviorInfluences,
    timelineNarrative,
    totalSnapshots: history.length,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Store user TraitScores so the recommendation evolution engine can use them.
 * Call this after the quiz is completed or when trait data is available.
 */
export function storeUserTraits(traits: TraitScores): void {
  getStorage().set(TRAITS_KEY, traits);
}
