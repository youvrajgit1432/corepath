/**
 * INSIGHT VAULT INTELLIGENCE
 *
 * A memory vault of major discoveries across the user's journey.
 * Scans 7 sources for identity changes, confidence jumps, milestones,
 * achievement unlocks, career pivots, and trajectory changes.
 *
 * Sources:
 *   - career-story           → turning points, career pivots
 *   - future-self            → trajectory strength, career evolution
 *   - career-identity        → archetype, strengths, growth style
 *   - progress-reflection    → wins, growth areas, reflection theme
 *   - decision-confidence    → confidence score, stability
 *   - journey-memory         → confidence history, quiz counts
 *   - achievement-engine     → unlocked achievements, level
 *
 * Deduplication: by type + normalized title prefix
 * Ranking: importance (50%) + recency (30%) + type frequency (20%)
 *
 * No backend. No auth. Pure client-side computation.
 */

import type { CareerStoryData } from "./career-story";
import { getFutureSelf } from "./future-self";
import { getCareerIdentity } from "./career-identity";
import { computeProgressReflection } from "./progress-reflection";
import { getDecisionConfidence } from "./decision-confidence";
import { loadJourneyMemory } from "./journey-memory";
import { computeAchievements } from "./achievement-engine";
import { getStored } from "./shared-context";
import { EMPTY_CAREER_STORY } from "./safe-context";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type InsightType =
  | "identity_change"
  | "confidence_jump"
  | "first_milestone"
  | "achievement_unlock"
  | "career_pivot"
  | "trajectory_change";

export interface InsightEntry {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  importance: number; // 0–100
  timestamp: number;
  source: string;
  tags: string[];
}

export type InsightVaultData = {
  majorInsights: InsightEntry[];
  beliefShifts: string[];
  identityChanges: string[];
  decisionBreakthroughs: string[];
  recurringPatterns: string[];
  confidenceMoments: string[];
  vaultScore: number; // 0–100
  topInsight: InsightEntry | null;
};

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface VaultContext {
  story: CareerStoryData;
  future: ReturnType<typeof getFutureSelf>;
  identity: ReturnType<typeof getCareerIdentity>;
  reflection: ReturnType<typeof computeProgressReflection>;
  confidence: ReturnType<typeof getDecisionConfidence>;
  memory: ReturnType<typeof loadJourneyMemory>;
  achievements: ReturnType<typeof computeAchievements>;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

function gatherContext(): VaultContext {
  return {
    // Read pipeline modules from shared store with EMPTY fallbacks.
    story: getStored<CareerStoryData>("career-story") ??
      (EMPTY_CAREER_STORY as unknown as CareerStoryData),
    future: getFutureSelf(),
    identity: getCareerIdentity(),
    reflection: computeProgressReflection(),
    confidence: getDecisionConfidence(),
    memory: loadJourneyMemory(),
    achievements: computeAchievements(),
  };
}

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect identity changes from career-identity and future-self.
 */
function detectIdentityChanges(ctx: VaultContext): InsightEntry[] {
  const insights: InsightEntry[] = [];

  // Defined identity (not just "explorer")
  if (ctx.identity.careerArchetype !== "explorer") {
    insights.push({
      id: "identity-defined",
      type: "identity_change",
      title: `Identified as ${ctx.identity.careerArchetype}`,
      description: `Career identity shaped into "${ctx.identity.identityTitle}" — ${ctx.identity.growthStyle.replace(/-/g, " ")} growth style with ${ctx.identity.focusPattern.replace(/-/g, " ")} focus.`,
      importance: ctx.identity.dominantStrengths.length >= 3 ? 78 : 65,
      timestamp: Date.now(),
      source: "career-identity",
      tags: ["identity", "archetype", "growth-style"],
    });
  }

  // Identity evolution — current identity differs from future self
  const currentTitle = ctx.identity.identityTitle;
  const futureIdentity = ctx.future.futureIdentity;
  if (futureIdentity && !currentTitle.toLowerCase().includes(futureIdentity.toLowerCase().split(" ").slice(0, 2).join(" ").toLowerCase())) {
    insights.push({
      id: "identity-evolution",
      type: "identity_change",
      title: "Identity Evolution Underway",
      description: `Evolving toward "${futureIdentity}" with ${ctx.future.trajectoryStrength}% trajectory strength and ${ctx.future.likelyCareerEvolution.length} evolution stages identified.`,
      importance: Math.round(ctx.future.trajectoryStrength * 0.85),
      timestamp: Date.now(),
      source: "future-self",
      tags: ["identity", "evolution", "trajectory"],
    });
  }

  // Dominant strengths insight
  if (ctx.identity.dominantStrengths.length >= 3) {
    insights.push({
      id: "strengths-defined",
      type: "identity_change",
      title: "Core Strengths Identified",
      description: `Dominant strengths: ${ctx.identity.dominantStrengths.join(", ")} — shaping your career identity.`,
      importance: 72,
      timestamp: Date.now(),
      source: "career-identity",
      tags: ["strengths", "identity"],
    });
  }

  return insights;
}

/**
 * Detect confidence jumps from decision-confidence and journey-memory.
 */
function detectConfidenceJumps(ctx: VaultContext): InsightEntry[] {
  const insights: InsightEntry[] = [];
  const { confidenceScore, decisionStability, explorationReadiness } = ctx.confidence;
  const history = ctx.memory.confidenceHistory;

  // High confidence threshold
  if (confidenceScore >= 75) {
    insights.push({
      id: "high-confidence",
      type: "confidence_jump",
      title: "Strong Decision Confidence",
      description: `Confidence at ${confidenceScore}% with ${decisionStability} stability — ${explorationReadiness}% readiness to explore new paths.`,
      importance: Math.round(confidenceScore * 0.9),
      timestamp: Date.now(),
      source: "decision-confidence",
      tags: ["confidence", "decision-making", "stability"],
    });
  }

  // Confidence history trend — significant jumps
  if (history.length >= 2) {
    const recent = history.slice(-3);
    if (recent.length >= 2) {
      const delta = recent[recent.length - 1] - recent[0];
      if (delta >= 15) {
        insights.push({
          id: "confidence-surge",
          type: "confidence_jump",
          title: "Confidence Surge",
          description: `Confidence rose ${delta >= 0 ? "+" : ""}${delta} points over the last ${recent.length} sessions — strong upward momentum.`,
          importance: Math.min(85, 60 + delta),
          timestamp: Date.now(),
          source: "journey-memory",
          tags: ["confidence", "growth", "momentum"],
        });
      }
    }
  }

  // Stability shift to "stable"
  if (decisionStability === "stable" && confidenceScore >= 60) {
    insights.push({
      id: "stability-achieved",
      type: "confidence_jump",
      title: "Decision Stability Achieved",
      description: `Decision posture has stabilized at ${confidenceScore}% confidence — indicating a clear career direction.`,
      importance: 80,
      timestamp: Date.now(),
      source: "decision-confidence",
      tags: ["confidence", "stability", "clarity"],
    });
  }

  return insights;
}

/**
 * Detect milestones and achievement unlocks.
 */
function detectAchievementInsights(ctx: VaultContext): InsightEntry[] {
  const insights: InsightEntry[] = [];

  const unlocked = ctx.achievements.unlockedAchievements;
  if (unlocked.length === 0) return insights;

  // First milestone — earliest unlocked achievement
  const sorted = [...unlocked].sort((a, b) => {
    if (a.unlockedAt && b.unlockedAt) return new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime();
    if (a.unlockedAt) return -1;
    if (b.unlockedAt) return 1;
    return 0;
  });

  const first = sorted[0];
  insights.push({
    id: "first-milestone",
    type: "first_milestone",
    title: "First Achievement",
    description: first.description || `Unlocked: "${first.title}"`,
    importance: 75,
    timestamp: first.unlockedAt ? new Date(first.unlockedAt).getTime() : Date.now(),
    source: "achievement-engine",
    tags: ["milestone", "first", "achievement"],
  });

  // Achievement unlocks — top 3 by unlock order
  sorted.slice(0, 3).forEach((a, i) => {
    insights.push({
      id: `achievement-${a.id}`,
      type: "achievement_unlock",
      title: a.title,
      description: a.description,
      importance: Math.max(55, 80 - i * 10),
      timestamp: a.unlockedAt ? new Date(a.unlockedAt).getTime() : Date.now(),
      source: "achievement-engine",
      tags: ["achievement", "unlock"],
    });
  });

  // Level milestone
  if (ctx.achievements.level >= 3) {
    insights.push({
      id: "level-milestone",
      type: "achievement_unlock",
      title: `Reached Level ${ctx.achievements.level}`,
      description: `${ctx.achievements.xp} total XP earned — ${unlocked.length} achievements unlocked.`,
      importance: Math.min(90, 60 + ctx.achievements.level * 5),
      timestamp: Date.now(),
      source: "achievement-engine",
      tags: ["achievement", "level", "milestone"],
    });
  }

  return insights;
}

/**
 * Detect career pivots from career-story turning points.
 */
function detectCareerPivots(ctx: VaultContext): InsightEntry[] {
  const insights: InsightEntry[] = [];

  // Look for career_pivot turning points
  const pivots = ctx.story.turningPoints.filter((tp) => tp.type === "career_pivot");
  pivots.forEach((p, i) => {
    insights.push({
      id: `career-pivot-${i}`,
      type: "career_pivot",
      title: "Career Pivot Signal",
      description: p.description || p.title,
      importance: 85,
      timestamp: Date.now(),
      source: "career-story",
      tags: ["career", "pivot", "change"],
    });
  });

  // Story arc transitions are also pivots
  if (ctx.story.storyArc === "transition" && ctx.story.momentumScore < 50) {
    insights.push({
      id: "arc-transition",
      type: "career_pivot",
      title: "Career Arc in Transition",
      description: ctx.story.nextChapterPrediction,
      importance: 80,
      timestamp: Date.now(),
      source: "career-story",
      tags: ["career", "transition", "arc"],
    });
  }

  return insights;
}

/**
 * Detect major trajectory changes from future-self.
 */
function detectTrajectoryChanges(ctx: VaultContext): InsightEntry[] {
  const insights: InsightEntry[] = [];
  const { trajectoryStrength, likelyCareerEvolution, futureArchetype } = ctx.future;

  if (trajectoryStrength >= 50 && likelyCareerEvolution.length >= 1) {
    insights.push({
      id: "trajectory-defined",
      type: "trajectory_change",
      title: `Trajectory: ${futureArchetype}`,
      description: `${likelyCareerEvolution.length} evolution stages identified at ${trajectoryStrength}% trajectory strength — ${likelyCareerEvolution[0]?.description || "career path"} ahead.`,
      importance: Math.round(trajectoryStrength * 0.9 + likelyCareerEvolution.length * 3),
      timestamp: Date.now(),
      source: "future-self",
      tags: ["trajectory", "evolution", "career-path"],
    });
  }

  if (trajectoryStrength >= 75) {
    insights.push({
      id: "strong-trajectory",
      type: "trajectory_change",
      title: "Strong Career Trajectory",
      description: `Clear career direction with ${trajectoryStrength}% trajectory strength — your path is well-defined and gaining momentum.`,
      importance: 90,
      timestamp: Date.now(),
      source: "future-self",
      tags: ["trajectory", "momentum", "direction"],
    });
  }

  return insights;
}

// ============================================================================
// DEDUPLICATION & RANKING
// ============================================================================

/**
 * Deduplicate insights by type + normalized title (first 40 chars, lowercase).
 */
function deduplicate(insights: InsightEntry[]): InsightEntry[] {
  const seen = new Set<string>();
  return insights.filter((i) => {
    const key = `${i.type}-${i.title.toLowerCase().slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Rank insights by importance (50%) + recency (30%) + type frequency (20%).
 */
function rankInsights(insights: InsightEntry[]): InsightEntry[] {
  if (insights.length === 0) return [];

  const typeCounts: Record<string, number> = {};
  for (const i of insights) {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
  }
  const maxCount = Math.max(1, ...Object.values(typeCounts));

  const now = Date.now();
  // Find the time range for recency normalization
  const timestamps = insights.map((i) => i.timestamp);
  const minTime = Math.min(...timestamps);
  const timeRange = Math.max(1, now - minTime);

  return [...insights].sort((a, b) => {
    const aImp = a.importance * 0.5;
    const bImp = b.importance * 0.5;

    const aRecency = ((now - a.timestamp) / timeRange) * 30;
    const bRecency = ((now - b.timestamp) / timeRange) * 30;

    const aFreq = ((typeCounts[a.type] || 1) / maxCount) * 20;
    const bFreq = ((typeCounts[b.type] || 1) / maxCount) * 20;

    const aScore = aImp + (30 - aRecency) + aFreq;
    const bScore = bImp + (30 - bRecency) + bFreq;

    return bScore - aScore;
  });
}

// ============================================================================
// BELIEF SHIFTS & PATTERNS
// ============================================================================

function detectBeliefShifts(ctx: VaultContext): string[] {
  const shifts: string[] = [];

  // Theme-based shifts
  const { reflectionTheme } = ctx.reflection;
  if (reflectionTheme === "accelerating") {
    shifts.push("Shift toward confident career acceleration — belief in own trajectory is strengthening");
  }
  if (reflectionTheme === "rebuilding") {
    shifts.push("Shift toward rebuilding — recognizing that foundations need reinforcement before growth");
  }
  if (reflectionTheme === "discovering") {
    shifts.push("Shift toward discovery — openness to new career possibilities is expanding");
  }
  if (reflectionTheme === "misaligned") {
    shifts.push("Shift toward realignment — acknowledging gaps between current path and true interests");
  }
  if (reflectionTheme === "plateaued") {
    shifts.push("Shift toward consolidation — recognizing the need for new challenges to break through");
  }

  // Confidence-driven shifts
  const { confidenceScore } = ctx.confidence;
  if (confidenceScore >= 70) {
    shifts.push("Growing belief in decision-making ability — confidence is becoming self-reinforcing");
  } else if (confidenceScore < 40) {
    shifts.push("Cautious belief stance — decisions are still exploratory rather than definitive");
  }

  return shifts;
}

function detectRecurringPatterns(ctx: VaultContext): string[] {
  const patterns: string[] = [];

  // Confidence history volatility
  const history = ctx.memory.confidenceHistory;
  if (history.length >= 3) {
    const deltas: number[] = [];
    for (let i = 1; i < history.length; i++) {
      deltas.push(Math.abs(history[i] - history[i - 1]));
    }
    const avgDelta = deltas.reduce((s, d) => s + d, 0) / deltas.length;
    if (avgDelta >= 15) {
      patterns.push("Frequent confidence swings (avg ±" + Math.round(avgDelta) + " pts per session)");
    } else if (avgDelta < 5) {
      patterns.push("Steady confidence across sessions");
    }
  }

  // Quiz engagement pattern
  if (ctx.memory.completedQuizzes >= 5) {
    patterns.push("Consistent quiz engagement (" + ctx.memory.completedQuizzes + " completed)");
  }
  if (ctx.memory.uncertaintyPatterns.retakes >= 2) {
    patterns.push("Revisiting familiar careers — deepening understanding through retakes");
  }

  // Career exploration breadth
  const careerCount = Object.keys(ctx.memory.viewedCareers).length;
  if (careerCount >= 10) {
    patterns.push("Broad career exploration (" + careerCount + " careers viewed)");
  }

  // Achievement pattern
  const unlocked = ctx.achievements.unlockedAchievements.length;
  if (unlocked >= 3) {
    patterns.push("Consistent achievement unlocks (" + unlocked + " total)");
  }

  return patterns;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute full insight vault from current data sources.
 */
export function computeInsightVault(): InsightVaultData {
  const ctx = gatherContext();

  // Gather all raw insights from detectors
  const rawInsights = [
    ...detectIdentityChanges(ctx),
    ...detectConfidenceJumps(ctx),
    ...detectAchievementInsights(ctx),
    ...detectCareerPivots(ctx),
    ...detectTrajectoryChanges(ctx),
  ];

  // Deduplicate and rank
  const deduped = deduplicate(rawInsights);
  const ranked = rankInsights(deduped);

  // Derived lists
  const identityChanges = ranked
    .filter((i) => i.type === "identity_change")
    .map((i) => i.title);

  const decisionBreakthroughs = ranked
    .filter((i) => i.type === "confidence_jump")
    .map((i) => i.title);

  const confidenceMoments = ranked
    .filter((i) => i.type === "confidence_jump" || i.type === "first_milestone")
    .map((i) => i.description);

  // Belief shifts and patterns
  const beliefShifts = detectBeliefShifts(ctx);
  const recurringPatterns = detectRecurringPatterns(ctx);

  // Vault score: weighted composite of insight quality
  const vaultScore = ranked.length > 0
    ? Math.min(100, Math.round(
        ranked.reduce((sum, i) => sum + i.importance, 0) / ranked.length * 0.6 +
        ranked.length * 4 +
        (identityChanges.length > 0 ? 5 : 0) +
        (decisionBreakthroughs.length > 0 ? 5 : 0)
      ))
    : 0;

  return {
    majorInsights: ranked,
    beliefShifts,
    identityChanges,
    decisionBreakthroughs,
    recurringPatterns,
    confidenceMoments,
    vaultScore,
    topInsight: ranked[0] || null,
  };
}
