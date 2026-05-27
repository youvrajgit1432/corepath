/**
 * FEEDBACK INTELLIGENCE + RECOMMENDATION LEARNING
 *
 * Learns from user actions and feedback to improve recommendations.
 *
 * Consumed Signals:
 *   user-analytics, journey-memory, recommendation history,
 *   career history, missions, workspace, quiz results, decision-confidence
 *
 * Tracked Events:
 *   career_liked, career_disliked, recommendation_dismissed,
 *   mission_skipped, mission_helpful, career_saved, feedback_submitted,
 *   career_revisited
 *
 * Behavior:
 *   Repeated positive → increase affinity
 *   Repeated dismissals → reduce recommendation weight
 *   Repeated revisits → increase confidence
 *
 * Persists via SafeStorage. No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { getCareerById } from "./careers";
import { getDecisionConfidence } from "./decision-confidence";

// ============================================================================
// TYPES
// ============================================================================

export type FeedbackEventType =
  | "career_liked"
  | "career_disliked"
  | "recommendation_dismissed"
  | "mission_skipped"
  | "mission_helpful"
  | "career_saved"
  | "feedback_submitted"
  | "career_revisited";

export interface FeedbackRecord {
  event: FeedbackEventType;
  timestamp: number;
  /** Career, recommendation, or mission ID */
  targetId: string;
  /** Optional user-provided feedback text */
  note?: string;
  /** Optional source context */
  source?: string;
}

export interface CareerAffinityScore {
  careerId: string;
  careerTitle: string;
  affinity: number; // -100 (strongly disliked) to +100 (strongly liked)
  positiveCount: number;
  negativeCount: number;
  revisitCount: number;
  saved: boolean;
}

export interface LikedPattern {
  category: string;
  count: number;
  avgAffinity: number;
  careers: string[];
}

export interface DislikedPattern {
  category: string;
  count: number;
  avgAffinity: number;
  careers: string[];
}

export interface MissionPreference {
  category: string;
  helpfulCount: number;
  skippedCount: number;
  helpfulRate: number; // 0–1
}

export interface RecommendationWeightAdjustment {
  careerId: string;
  careerTitle: string;
  adjustment: number; // multiplier, 0.0–1.5
  reason: string;
}

export interface FeedbackInsight {
  insight: string;
  type: "positive" | "negative" | "neutral" | "suggestion";
  source: string;
}

export interface FeedbackIntelligenceData {
  /** 0–100 score based on how much feedback the user has given */
  feedbackScore: number;
  /** 0–100 trust in the recommendation system */
  recommendationTrust: number;
  /** Career affinity scores — one per interacted career */
  careerAffinities: CareerAffinityScore[];
  /** Top liked patterns (domains/themes user prefers) */
  likedPatterns: LikedPattern[];
  /** Top disliked patterns */
  dislikedPatterns: DislikedPattern[];
  /** Mission type preferences */
  missionPreference: MissionPreference[];
  /** Weight adjustments applied to recommendations */
  weightAdjustments: RecommendationWeightAdjustment[];
  /** Actionable insights */
  feedbackInsights: FeedbackInsight[];
  /** Human-readable narrative of what the system has learned */
  learningNarrative: string[];
  lastComputed: string;
}

// ============================================================================
// STORAGE
// ============================================================================

const RECORDS_KEY = "corepath-feedback-intelligence-records";
const COMPUTED_KEY = "corepath-feedback-intelligence-computed";
const MAX_RECORDS = 200;

function getStorage() {
  return getSafeStorage({ silent: true });
}

// ============================================================================
// EVENT LOGGING
// ============================================================================

function loadRecords(): FeedbackRecord[] {
  return getStorage().get<FeedbackRecord[]>(RECORDS_KEY) ?? [];
}

function saveRecords(records: FeedbackRecord[]): void {
  const trimmed = records.slice(-MAX_RECORDS);
  getStorage().set(RECORDS_KEY, trimmed);
}

/**
 * Log a single feedback event.
 */
export function logFeedbackEvent(
  event: FeedbackEventType,
  targetId: string,
  note?: string,
  source?: string
): void {
  const records = loadRecords();
  records.push({ event, timestamp: Date.now(), targetId, note, source });
  saveRecords(records);
}

// ── Convenience functions ────────────────────────────────────────────────

export function logCareerLiked(careerId: string, source?: string): void {
  logFeedbackEvent("career_liked", careerId, undefined, source);
}

export function logCareerDisliked(careerId: string, source?: string): void {
  logFeedbackEvent("career_disliked", careerId, undefined, source);
}

export function logRecommendationDismissed(careerId: string, source?: string): void {
  logFeedbackEvent("recommendation_dismissed", careerId, undefined, source);
}

export function logMissionSkipped(missionId: string, source?: string): void {
  logFeedbackEvent("mission_skipped", missionId, undefined, source);
}

export function logMissionHelpful(missionId: string, source?: string): void {
  logFeedbackEvent("mission_helpful", missionId, undefined, source);
}

export function logCareerSavedFeedback(careerId: string, source?: string): void {
  logFeedbackEvent("career_saved", careerId, undefined, source);
}

export function logFeedbackSubmitted(source?: string, note?: string): void {
  logFeedbackEvent("feedback_submitted", "general", note, source);
}

export function logCareerRevisited(careerId: string, source?: string): void {
  logFeedbackEvent("career_revisited", careerId, undefined, source);
}

// ============================================================================
// COMPUTATION — Career Affinity
// ============================================================================

function computeCareerAffinities(records: FeedbackRecord[]): CareerAffinityScore[] {
  const careerMap = new Map<
    string,
    { likes: number; dislikes: number; revisits: number; saved: boolean; timestamps: number[] }
  >();

  for (const r of records) {
    if (!r.targetId || r.targetId === "general") continue;
    if (!careerMap.has(r.targetId)) {
      careerMap.set(r.targetId, { likes: 0, dislikes: 0, revisits: 0, saved: false, timestamps: [] });
    }
    const entry = careerMap.get(r.targetId)!;
    entry.timestamps.push(r.timestamp);

    switch (r.event) {
      case "career_liked":
        entry.likes++;
        break;
      case "career_disliked":
        entry.dislikes++;
        break;
      case "career_revisited":
        entry.revisits++;
        break;
      case "career_saved":
        entry.saved = true;
        break;
    }
  }

  const affinities: CareerAffinityScore[] = [];

  for (const [careerId, data] of careerMap) {
    const career = getCareerById(careerId);
    const careerTitle = career?.title ?? careerId;
    const totalFeedback = data.likes + data.dislikes;
    const affinity = totalFeedback > 0
      ? Math.round(((data.likes - data.dislikes) / totalFeedback) * 100)
      : 0;

    affinities.push({
      careerId,
      careerTitle,
      affinity,
      positiveCount: data.likes,
      negativeCount: data.dislikes,
      revisitCount: data.revisits,
      saved: data.saved,
    });
  }

  // Sort by absolute affinity (most strongly felt first)
  return affinities.sort((a, b) => Math.abs(b.affinity) - Math.abs(a.affinity));
}

// ============================================================================
// COMPUTATION — Liked / Disliked Patterns
// ============================================================================

function computePatterns(
  affinities: CareerAffinityScore[],
  threshold = 30
): { liked: LikedPattern[]; disliked: DislikedPattern[] } {
  const likedMap = new Map<string, { count: number; totalAffinity: number; careers: string[] }>();
  const dislikedMap = new Map<string, { count: number; totalAffinity: number; careers: string[] }>();

  for (const a of affinities) {
    const career = getCareerById(a.careerId);
    if (!career) continue;
    const domain = career.domain ?? "General";

    if (a.affinity >= threshold) {
      if (!likedMap.has(domain)) {
        likedMap.set(domain, { count: 0, totalAffinity: 0, careers: [] });
      }
      const entry = likedMap.get(domain)!;
      entry.count += a.positiveCount + a.revisitCount;
      entry.totalAffinity += a.affinity;
      entry.careers.push(career.title);
    } else if (a.affinity <= -threshold) {
      if (!dislikedMap.has(domain)) {
        dislikedMap.set(domain, { count: 0, totalAffinity: 0, careers: [] });
      }
      const entry = dislikedMap.get(domain)!;
      entry.count += a.negativeCount;
      entry.totalAffinity += Math.abs(a.affinity);
      entry.careers.push(career.title);
    }
  }

  const liked: LikedPattern[] = Array.from(likedMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgAffinity: Math.round(data.totalAffinity / Math.max(1, data.careers.length)),
      careers: data.careers,
    }))
    .sort((a, b) => b.count - a.count);

  const disliked: DislikedPattern[] = Array.from(dislikedMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgAffinity: Math.round(data.totalAffinity / Math.max(1, data.careers.length)),
      careers: data.careers,
    }))
    .sort((a, b) => b.count - a.count);

  return { liked, disliked };
}

// ============================================================================
// COMPUTATION — Mission Preference
// ============================================================================

function computeMissionPreferences(records: FeedbackRecord[]): MissionPreference[] {
  const prefMap = new Map<string, { helpful: number; skipped: number }>();

  for (const r of records) {
    // Infer category from mission context (stored in source field or targetId prefix)
    const category = r.source ?? "general";
    if (r.event === "mission_helpful" || r.event === "mission_skipped") {
      if (!prefMap.has(category)) {
        prefMap.set(category, { helpful: 0, skipped: 0 });
      }
      const entry = prefMap.get(category)!;
      if (r.event === "mission_helpful") entry.helpful++;
      else entry.skipped++;
    }
  }

  return Array.from(prefMap.entries())
    .map(([category, data]) => ({
      category,
      helpfulCount: data.helpful,
      skippedCount: data.skipped,
      helpfulRate: data.helpful + data.skipped > 0
        ? Math.round((data.helpful / (data.helpful + data.skipped)) * 100) / 100
        : 0,
    }))
    .sort((a, b) => b.helpfulCount - a.helpfulCount);
}

// ============================================================================
// COMPUTATION — Weight Adjustments
// ============================================================================

function computeWeightAdjustments(
  affinities: CareerAffinityScore[],
  records: FeedbackRecord[]
): RecommendationWeightAdjustment[] {
  const adjustments: RecommendationWeightAdjustment[] = [];

  // Dismissed recommendations → reduce weight
  const dismissedCounts = new Map<string, number>();
  for (const r of records) {
    if (r.event === "recommendation_dismissed") {
      dismissedCounts.set(r.targetId, (dismissedCounts.get(r.targetId) ?? 0) + 1);
    }
  }

  for (const [careerId, count] of dismissedCounts) {
    const career = getCareerById(careerId);
    const reduction = Math.max(0, 1.0 - count * 0.2);
    adjustments.push({
      careerId,
      careerTitle: career?.title ?? careerId,
      adjustment: Math.max(0.3, reduction),
      reason: `Dismissed ${count} time${count > 1 ? "s" : ""} — recommendation weight reduced to ${Math.round(Math.max(0.3, reduction) * 100)}%.`,
    });
  }

  // Strongly liked careers → increase weight
  for (const a of affinities) {
    if (a.affinity >= 60 && a.positiveCount >= 2) {
      const boost = Math.min(1.5, 1.0 + a.positiveCount * 0.15);
      adjustments.push({
        careerId: a.careerId,
        careerTitle: a.careerTitle,
        adjustment: Math.round(boost * 100) / 100,
        reason: `Liked ${a.positiveCount} time${a.positiveCount > 1 ? "s" : ""} — recommendation weight boosted to ${Math.round(boost * 100)}%.`,
      });
    }
  }

  // Revisits increase confidence
  for (const a of affinities) {
    if (a.revisitCount >= 2 && a.affinity >= 20) {
      const existingIdx = adjustments.findIndex((adj) => adj.careerId === a.careerId);
      if (existingIdx >= 0) {
        adjustments[existingIdx].adjustment = Math.min(1.5, adjustments[existingIdx].adjustment + a.revisitCount * 0.05);
        adjustments[existingIdx].reason += ` Also revisited ${a.revisitCount} times.`;
      } else {
        const confidenceBoost = Math.min(1.3, 1.0 + a.revisitCount * 0.08);
        adjustments.push({
          careerId: a.careerId,
          careerTitle: a.careerTitle,
          adjustment: Math.round(confidenceBoost * 100) / 100,
          reason: `Revisited ${a.revisitCount} times — confidence increased to ${Math.round(confidenceBoost * 100)}%.`,
        });
      }
    }
  }

  return adjustments.sort((a, b) => b.adjustment - a.adjustment);
}

// ============================================================================
// COMPUTATION — Feedback Score
// ============================================================================

function computeFeedbackScore(records: FeedbackRecord[]): number {
  if (records.length === 0) return 0;
  let score = 0;

  // Base: having any feedback
  score += 5;

  // Diversity bonus: unique event types
  const uniqueTypes = new Set(records.map((r) => r.event)).size;
  score += Math.min(uniqueTypes * 8, 40);

  // Depth bonus: total interactions
  score += Math.min(records.length, 30);

  // Quality bonus: feedback_submitted + career_saved indicate thoughtful engagement
  const thoughtful = records.filter(
    (r) => r.event === "feedback_submitted" || r.event === "career_saved"
  ).length;
  score += Math.min(thoughtful * 5, 25);

  return Math.min(Math.round(score), 100);
}

// ============================================================================
// COMPUTATION — Recommendation Trust
// ============================================================================

function computeRecommendationTrust(
  affinities: CareerAffinityScore[],
  records: FeedbackRecord[],
  decisionConfidence: ReturnType<typeof getDecisionConfidence>
): number {
  let trust = 50; // baseline

  // Positive affinity signals boost trust
  const positiveCareers = affinities.filter((a) => a.affinity > 0).length;
  const totalCareers = affinities.length;
  if (totalCareers > 0) {
    const positiveRate = positiveCareers / totalCareers;
    trust += Math.round(positiveRate * 20);
  }

  // Dismissals reduce trust
  const dismissals = records.filter((r) => r.event === "recommendation_dismissed").length;
  trust -= Math.min(dismissals * 5, 20);

  // Mission helpful rate boosts trust
  const helpfulMissions = records.filter((r) => r.event === "mission_helpful").length;
  const skippedMissions = records.filter((r) => r.event === "mission_skipped").length;
  const totalMissions = helpfulMissions + skippedMissions;
  if (totalMissions > 0) {
    const helpfulRate = helpfulMissions / totalMissions;
    trust += Math.round(helpfulRate * 15);
  }

  // Decision confidence alignment
  trust += Math.round((decisionConfidence.confidenceScore - 50) * 0.15);

  return Math.max(0, Math.min(100, Math.round(trust)));
}

// ============================================================================
// COMPUTATION — Insights
// ============================================================================

function computeFeedbackInsights(
  affinities: CareerAffinityScore[],
  likedPatterns: LikedPattern[],
  dislikedPatterns: DislikedPattern[],
  missionPrefs: MissionPreference[],
  feedbackScore: number,
  records: FeedbackRecord[]
): FeedbackInsight[] {
  const insights: FeedbackInsight[] = [];

  // No feedback yet
  if (records.length === 0) {
    insights.push({
      insight: "Start providing feedback by liking or saving careers you're interested in.",
      type: "suggestion",
      source: "feedback-intelligence",
    });
    return insights;
  }

  // Career preference insights
  if (likedPatterns.length > 0) {
    const topLiked = likedPatterns[0];
    insights.push({
      insight: `Strong preference for ${topLiked.category} careers (${topLiked.count} positive signals across ${topLiked.careers.length} careers).`,
      type: "positive",
      source: "feedback-intelligence",
    });
  }

  if (dislikedPatterns.length > 0) {
    const topDisliked = dislikedPatterns[0];
    insights.push({
      insight: `Detected disinterest in ${topDisliked.category} careers (${topDisliked.count} negative signals).`,
      type: "negative",
      source: "feedback-intelligence",
    });
  }

  // Career affinity diversity
  const strongOpinions = affinities.filter(
    (a) => Math.abs(a.affinity) >= 50
  ).length;
  if (strongOpinions >= 5) {
    insights.push({
      insight: `Strong opinions on ${strongOpinions} careers — your preferences are becoming well-defined.`,
      type: "positive",
      source: "feedback-intelligence",
    });
  }

  // Saved career insight
  const savedCareers = affinities.filter((a) => a.saved);
  if (savedCareers.length >= 3) {
    insights.push({
      insight: `You've saved ${savedCareers.length} careers — consider narrowing to one workspace for focused progress.`,
      type: "suggestion",
      source: "feedback-intelligence",
    });
  }

  // Mission preference insights
  for (const pref of missionPrefs) {
    if (pref.helpfulRate >= 0.8 && pref.helpfulCount >= 2) {
      insights.push({
        insight: `High helpful rate for "${pref.category}" missions (${Math.round(pref.helpfulRate * 100)}%) — you respond well to this mission type.`,
        type: "positive",
        source: "feedback-intelligence",
      });
    } else if (pref.skippedCount >= 2 && pref.helpfulRate < 0.3) {
      insights.push({
        insight: `Frequent skips in "${pref.category}" missions (skipped ${pref.skippedCount} times) — consider adjusting difficulty or focus.`,
        type: "negative",
        source: "feedback-intelligence",
      });
    }
  }

  // Revisit insight
  const revisitCareers = affinities.filter((a) => a.revisitCount >= 2);
  if (revisitCareers.length > 0) {
    const topRevisit = revisitCareers.sort((a, b) => b.revisitCount - a.revisitCount)[0];
    insights.push({
      insight: `You've revisited ${topRevisit.careerTitle} ${topRevisit.revisitCount} times — strong sustained interest signal.`,
      type: "positive",
      source: "feedback-intelligence",
    });
  }

  // Feedback submission
  const feedbackSubmitted = records.filter((r) => r.event === "feedback_submitted").length;
  if (feedbackSubmitted >= 3) {
    insights.push({
      insight: "Consistently submitting open feedback — your input helps refine recommendations over time.",
      type: "positive",
      source: "feedback-intelligence",
    });
  }

  // General suggestion if feedback is low
  if (feedbackScore < 30) {
    insights.push({
      insight: "More feedback helps CorePath learn your preferences. Try liking or dismissing recommendations as you browse.",
      type: "suggestion",
      source: "feedback-intelligence",
    });
  }

  return insights;
}

// ============================================================================
// COMPUTATION — Learning Narrative
// ============================================================================

function computeLearningNarrative(
  feedbackScore: number,
  recommendationTrust: number,
  affinities: CareerAffinityScore[],
  likedPatterns: LikedPattern[],
  weightAdjustments: RecommendationWeightAdjustment[],
  missionPrefs: MissionPreference[]
): string[] {
  const narrative: string[] = [];

  // Opening
  if (feedbackScore < 20) {
    narrative.push("CorePath is still learning your preferences. The more feedback you provide, the more personalized recommendations become.");
  } else if (feedbackScore >= 60) {
    narrative.push("CorePath has a strong understanding of your preferences based on your feedback patterns.");
  } else {
    narrative.push("CorePath has a developing understanding of your preferences.");
  }

  // Recommendation trust
  if (recommendationTrust >= 70) {
    narrative.push(`Recommendation trust is high (${recommendationTrust}/100) — your feedback history suggests good alignment with suggestions.`);
  } else if (recommendationTrust < 40) {
    narrative.push(`Recommendation trust is building (${recommendationTrust}/100) — more positive feedback will improve alignment.`);
  } else {
    narrative.push(`Recommendation trust is at ${recommendationTrust}/100 and improving as the system learns your preferences.`);
  }

  // Career affinities
  const strongPositive = affinities.filter((a) => a.affinity >= 50).length;
  const strongNegative = affinities.filter((a) => a.affinity <= -50).length;
  if (strongPositive > 0) {
    narrative.push(`Strong affinity for ${strongPositive} career${strongPositive > 1 ? "s" : ""}.`);
  }
  if (strongNegative > 0) {
    narrative.push(`Identified ${strongNegative} career${strongNegative > 1 ? "s" : ""} that don't align well.`);
  }

  // Liked domains
  if (likedPatterns.length > 0) {
    const domains = likedPatterns.map((p) => p.category).join(", ");
    narrative.push(`Preferred domains: ${domains}.`);
  }

  // Weight adjustments applied
  if (weightAdjustments.length > 0) {
    const boosted = weightAdjustments.filter((w) => w.adjustment > 1.0).length;
    const reduced = weightAdjustments.filter((w) => w.adjustment < 1.0).length;
    if (boosted > 0) narrative.push(`${boosted} career recommendation${boosted > 1 ? "s" : ""} boosted based on positive signals.`);
    if (reduced > 0) narrative.push(`${reduced} career recommendation${reduced > 1 ? "s" : ""} reduced based on dismissals.`);
  }

  // Mission preference
  const highHelpful = missionPrefs.filter((p) => p.helpfulRate >= 0.7);
  if (highHelpful.length > 0) {
    const cats = highHelpful.map((p) => p.category).join(", ");
    narrative.push(`Best mission categories: ${cats}.`);
  }

  // Recency
  narrative.push("Feedback intelligence continuously updates as you interact with careers, recommendations, and missions.");

  return narrative;
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

export function computeFeedbackIntelligence(): FeedbackIntelligenceData {
  const records = loadRecords();
  const decisionConfidence = getDecisionConfidence();

  // Core computations
  const careerAffinities = computeCareerAffinities(records);
  const { liked: likedPatterns, disliked: dislikedPatterns } = computePatterns(careerAffinities);
  const missionPreference = computeMissionPreferences(records);
  const weightAdjustments = computeWeightAdjustments(careerAffinities, records);
  const feedbackScore = computeFeedbackScore(records);
  const recommendationTrust = computeRecommendationTrust(careerAffinities, records, decisionConfidence);
  const feedbackInsights = computeFeedbackInsights(
    careerAffinities, likedPatterns, dislikedPatterns, missionPreference, feedbackScore, records
  );
  const learningNarrative = computeLearningNarrative(
    feedbackScore, recommendationTrust, careerAffinities, likedPatterns, weightAdjustments, missionPreference
  );

  const data: FeedbackIntelligenceData = {
    feedbackScore,
    recommendationTrust,
    careerAffinities,
    likedPatterns,
    dislikedPatterns,
    missionPreference,
    weightAdjustments,
    feedbackInsights,
    learningNarrative,
    lastComputed: new Date().toISOString(),
  };

  getStorage().set(COMPUTED_KEY, data);
  return data;
}

/**
 * Load previously computed feedback intelligence data.
 */
export function loadFeedbackIntelligence(): FeedbackIntelligenceData | null {
  const storage = getStorage();
  const cached = storage.get<FeedbackIntelligenceData>(COMPUTED_KEY);
  if (!cached) return null;
  return cached;
}

/**
 * Get current feedback intelligence, computing fresh if needed.
 */
export function getFeedbackIntelligence(): FeedbackIntelligenceData {
  const existing = loadFeedbackIntelligence();
  if (existing) return existing;
  return computeFeedbackIntelligence();
}

/**
 * Clear all feedback intelligence data.
 */
export function clearFeedbackIntelligence(): void {
  const storage = getStorage();
  storage.remove(RECORDS_KEY);
  storage.remove(COMPUTED_KEY);
}
