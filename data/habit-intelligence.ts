/**
 * HABIT INTELLIGENCE
 *
 * Detects successful behavioral patterns and converts them into repeatable habits.
 *
 * Reads from:
 *   change-attribution   (major changes, positive drivers, confidence impact, behavior impact)
 *   action-sprints       (sprint history, completion rates, micro-goals, blocking signals)
 *   engagement-pulse     (consistency streak, pulse score, energy forecast, fatigue)
 *   learning-friction    (friction score, recovery signals, state label)
 *   achievements         (unlocked achievements, XP, level, streak bonuses)
 *   journey-memory       (quiz dates, roadmap interactions, confidence history, viewed career history)
 *
 * Behavior:
 *   If strong habits exist → reinforce (suggest maintaining/completing the habit loop)
 *   If inconsistent       → suggest micro-habits (2–5 min actions to restart momentum)
 *
 * Persists via SafeStorage with 1-hour cache.
 * No backend. No auth.
 */

import { getChangeAttribution, type ChangeAttributionData } from "./change-attribution";
import { loadActionSprint, loadSprintHistory, type SprintHistory } from "./action-sprints";
import { getEngagementPulse, type EngagementPulseData } from "./engagement-pulse";
import { getLearningFriction, type LearningFrictionData } from "./learning-friction";
import { loadAchievements, computeAchievements, type AchievementState } from "./achievement-engine";
import { loadJourneyMemory, type JourneyMemory } from "./journey-memory";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-habit-intelligence";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type HabitCategory = "timing" | "consistency" | "engagement" | "exploration" | "achievement";
export type HabitRecommendation = "reinforce" | "maintain" | "micro_habit";

export interface HabitCandidate {
  /** Unique identifier */
  id: string;
  /** Human-readable habit name */
  habit: string;
  /** Strength 0–100 */
  strength: number;
  /** Category of the habit */
  category: HabitCategory;
  /** Evidence from data sources supporting this candidate */
  evidence: string[];
  /** What the system recommends for this habit */
  recommendation: HabitRecommendation;
}

export interface HabitIntelligenceData {
  /** Overall habit score 0–100 */
  habitScore: number;
  /** All detected habit candidates */
  habitCandidates: HabitCandidate[];
  /** High-level summary of what's working */
  successfulPatterns: string[];
  /** Patterns that break or disrupt good habits */
  breakingPatterns: string[];
  /** Overall strength of all detected habits (0–100) */
  habitStrength: number;
  /** Actionable habit suggestions */
  recommendedHabits: string[];
  /** Timing and stickiness indicators */
  consistencySignals: string[];
  /** Narrative summary */
  habitNarrative: string;
  computedAt: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface HabitContext {
  attribution: ChangeAttributionData;
  sprint: ReturnType<typeof loadActionSprint>;
  sprintHistory: SprintHistory[];
  pulse: EngagementPulseData;
  friction: LearningFrictionData;
  achievements: AchievementState;
  journey: JourneyMemory;
}

function gatherContext(): HabitContext {
  const achievements = loadAchievements() ?? computeAchievements();

  return {
    attribution: getChangeAttribution(),
    sprint: loadActionSprint(),
    sprintHistory: loadSprintHistory(),
    pulse: getEngagementPulse(),
    friction: getLearningFriction(),
    achievements,
    journey: loadJourneyMemory(),
  };
}

// ============================================================================
// QUIZ TIMING CONSISTENCY
// ============================================================================

function detectQuizTimingHabit(ctx: HabitContext): HabitCandidate | null {
  const dates = ctx.journey.quizDates;
  if (dates.length < 3) return null;

  // Calculate intervals in days between consecutive quiz completions
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const diff = new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    if (days > 0 && days < 60) intervals.push(days);
  }

  if (intervals.length < 2) return null;

  // Measure consistency: low standard deviation = regular timing
  const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
  const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Very consistent: stdDev <= 3 days between sessions
  if (stdDev <= 3 && intervals.length >= 2) {
    const evidence: string[] = [
      `${intervals.length} regular quiz intervals detected`,
      `Average ${Math.round(mean)}-day gap between sessions`,
      `Low variance (±${Math.round(stdDev)} days) — consistent timing`,
    ];

    const strength = Math.min(100, Math.round(60 + (intervals.length * 5) - (stdDev * 2)));

    return {
      id: "quiz-timing",
      habit: "Regular quiz check-ins",
      strength,
      category: "timing",
      evidence,
      recommendation: strength >= 70 ? "reinforce" : "micro_habit",
    };
  }

  // Somewhat consistent
  if (stdDev <= 7 && intervals.length >= 2) {
    const evidence: string[] = [
      `${intervals.length} quiz completions with moderate regularity`,
      `Average ${Math.round(mean)}-day gap between sessions`,
    ];

    return {
      id: "quiz-timing",
      habit: "Building quiz rhythm",
      strength: Math.min(100, Math.round(40 + (intervals.length * 3) - (stdDev * 1.5))),
      category: "timing",
      evidence,
      recommendation: "micro_habit",
    };
  }

  return null;
}

// ============================================================================
// SPRINT CONSISTENCY
// ============================================================================

function detectSprintConsistency(ctx: HabitContext): HabitCandidate | null {
  const history = ctx.sprintHistory;
  if (history.length < 2) return null;

  const rates = history.map((h) => h.completionRate);
  const meanRate = rates.reduce((s, v) => s + v, 0) / rates.length;

  // High consistency: average completion rate >= 60%
  if (meanRate >= 60) {
    const above70 = rates.filter((r) => r >= 70).length;
    const evidence: string[] = [
      `Average ${Math.round(meanRate)}% sprint completion across ${history.length} days`,
      `${above70}/${history.length} days with 70%+ completion`,
    ];

    const strength = Math.min(100, Math.round(50 + meanRate * 0.4 + above70 * 5));

    return {
      id: "sprint-consistency",
      habit: "Daily action completion",
      strength,
      category: "consistency",
      evidence,
      recommendation: strength >= 70 ? "reinforce" : "maintain",
    };
  }

  // Moderate consistency
  if (meanRate >= 35) {
    const evidence: string[] = [
      `Average ${Math.round(meanRate)}% sprint completion across ${history.length} days`,
    ];

    return {
      id: "sprint-consistency",
      habit: "Building daily action habit",
      strength: Math.min(100, Math.round(30 + meanRate * 0.3)),
      category: "consistency",
      evidence,
      recommendation: "micro_habit",
    };
  }

  return null;
}

// ============================================================================
// ROADMAP ENGAGEMENT PATTERN
// ============================================================================

function detectRoadmapEngagement(ctx: HabitContext): HabitCandidate | null {
  const interactions = ctx.journey.roadmapInteractions;
  const entries = Object.entries(interactions);

  if (entries.length < 2) return null;

  // Count distinct roadmaps with multiple interactions
  const reengaged = entries.filter(([, a]) => a.view + a.start + a.complete >= 2);
  if (reengaged.length < 2) return null;

  const totalInteractions = entries.reduce((s, [, a]) => s + a.view + a.start + a.complete, 0);
  const evidence: string[] = [
    `${reengaged.length} roadmaps revisited multiple times`,
    `${totalInteractions} total roadmap interactions`,
  ];

  const strength = Math.min(100, Math.round(40 + reengaged.length * 8 + Math.min(20, totalInteractions)));

  return {
    id: "roadmap-engagement",
    habit: "Career roadmap exploration",
    strength,
    category: "exploration",
    evidence,
    recommendation: strength >= 60 ? "maintain" : "micro_habit",
  };
}

// ============================================================================
// STREAK DEPTH
// ============================================================================

function detectStreakDepth(ctx: HabitContext): HabitCandidate | null {
  const consistencyDim = ctx.pulse.dimensions.find((d) => d.name === "consistency_streak");
  if (!consistencyDim) return null;

  const score = consistencyDim.score;

  if (score >= 70) {
    const evidence: string[] = [
      `Consistency score of ${score}/100`,
      ...consistencyDim.signals.slice(0, 2),
    ];

    // Use workspace streak if available for richer evidence
    const streakBonus = ctx.achievements.activeStreakBonus;
    if (streakBonus > 0) {
      evidence.push(`Active streak bonus: +${streakBonus} XP`);
    }

    const strength = Math.min(100, score + 10);

    return {
      id: "streak-depth",
      habit: "Daily engagement streak",
      strength,
      category: "consistency",
      evidence,
      recommendation: strength >= 80 ? "reinforce" : "maintain",
    };
  }

  if (score >= 40) {
    const evidence: string[] = [
      `Consistency score of ${score}/100 — moderate streak pattern`,
    ];

    return {
      id: "streak-depth",
      habit: "Building engagement streak",
      strength: score,
      category: "consistency",
      evidence,
      recommendation: "micro_habit",
    };
  }

  return null;
}

// ============================================================================
// ACHIEVEMENT BURST PATTERN
// ============================================================================

function detectAchievementPattern(ctx: HabitContext): HabitCandidate | null {
  const achievements = ctx.achievements;
  const unlockedCount = achievements.unlockedAchievements.length;

  if (unlockedCount < 2) return null;

  // Check for milestones from change-attribution
  const achievementChanges = ctx.attribution.majorChanges.filter(
    (c) => c.domain === "achievement"
  );

  const evidence: string[] = [
    `${unlockedCount} achievements unlocked (${achievements.lockedAchievements.length} remaining)`,
    `Level ${achievements.level} with ${achievements.xp} total XP`,
  ];

  if (achievementChanges.length > 0) {
    evidence.push(achievementChanges[0].detail);
  }

  const strength = Math.min(100, Math.round(30 + unlockedCount * 6 + achievements.level * 4));

  return {
    id: "achievement-momentum",
    habit: "Career exploration momentum",
    strength,
    category: "achievement",
    evidence,
    recommendation: strength >= 65 ? "reinforce" : "maintain",
  };
}

// ============================================================================
// HIGH MOMENTUM WINDOWS
// ============================================================================

function detectMomentumWindows(ctx: HabitContext): HabitCandidate | null {
  const pulse = ctx.pulse;
  const attribution = ctx.attribution;

  // Look for confluence of positive signals
  const positiveSignals: string[] = [];

  // High pulse energy
  if (pulse.pulseScore >= 65) {
    positiveSignals.push(`Engagement pulse is strong (${pulse.pulseScore}/100)`);
  }

  // Strong energy forecast
  if (pulse.energyForecast === "sustained") {
    positiveSignals.push("Energy is forecast to remain sustained");
  }

  // Confidence trending up from attribution
  if (attribution.confidenceImpact.trendingUp) {
    positiveSignals.push(`Confidence growing (+${attribution.confidenceImpact.overallGrowth} points)`);
  }

  // Positive drivers outweigh negative
  if (attribution.positiveDrivers.positiveCount > attribution.negativeDrivers.negativeCount) {
    positiveSignals.push(
      `Positive drivers (${attribution.positiveDrivers.positiveCount}) outnumber negative (${attribution.negativeDrivers.negativeCount})`
    );
  }

  // Low friction
  if (ctx.friction.frictionScore < 30) {
    positiveSignals.push("Learning friction is low — smooth conditions for progress");
  }

  if (positiveSignals.length < 2) return null;

  const strength = Math.min(100, Math.round(50 + positiveSignals.length * 8 + pulse.pulseScore * 0.15));

  return {
    id: "momentum-window",
    habit: "High-momentum engagement windows",
    strength,
    category: "engagement",
    evidence: positiveSignals,
    recommendation: strength >= 70 ? "reinforce" : "maintain",
  };
}

// ============================================================================
// VIEWED CAREER PATTERN
// ============================================================================

function detectViewedCareerPattern(ctx: HabitContext): HabitCandidate | null {
  const history = ctx.journey.viewedCareerHistory;
  if (history.length < 4) return null;

  // Group views by career ID to see revisiting patterns
  const revisitCounts: Record<string, number> = {};
  for (const entry of history) {
    revisitCounts[entry.careerId] = (revisitCounts[entry.careerId] ?? 0) + 1;
  }

  const revisits = Object.entries(revisitCounts).filter(([, count]) => count >= 2);
  if (revisits.length < 2) return null;

  const evidence: string[] = [
    `${revisits.length} careers revisited across ${history.length} total views`,
    "Recurring browsing pattern suggests active evaluation habit",
  ];

  const strength = Math.min(100, Math.round(30 + revisits.length * 5 + history.length * 2));

  return {
    id: "viewed-career-pattern",
    habit: "Regular career browsing",
    strength,
    category: "exploration",
    evidence,
    recommendation: strength >= 60 ? "maintain" : "micro_habit",
  };
}

// ============================================================================
// SCORE & PATTERN COMPUTATION
// ============================================================================

function computeHabitScore(candidates: HabitCandidate[]): number {
  if (candidates.length === 0) return 0;

  // Weighted average of candidate strengths, with bonus for having more candidates
  const avgStrength = candidates.reduce((s, c) => s + c.strength, 0) / candidates.length;
  const countBonus = Math.min(20, candidates.length * 4);

  return Math.max(0, Math.min(100, Math.round(avgStrength * 0.8 + countBonus)));
}

function computeOverallStrength(candidates: HabitCandidate[]): number {
  if (candidates.length === 0) return 0;

  // Highest strength represents the strongest habit
  const maxStrength = Math.max(...candidates.map((c) => c.strength));
  const avgStrength = candidates.reduce((s, c) => s + c.strength, 0) / candidates.length;

  return Math.round(maxStrength * 0.6 + avgStrength * 0.4);
}

function computeSuccessfulPatterns(
  candidates: HabitCandidate[],
  ctx: HabitContext
): string[] {
  const patterns: string[] = [];

  for (const candidate of candidates) {
    if (candidate.strength >= 55) {
      patterns.push(
        `You consistently ${candidate.habit.toLowerCase()} — ${candidate.evidence[0]?.toLowerCase() ?? "a reliable pattern"}.`
      );
    }
  }

  // From change-attribution positive drivers
  if (ctx.attribution.positiveDrivers.positiveCount > 0) {
    patterns.push(
      `${ctx.attribution.positiveDrivers.positive.length} positive drivers identified in your change attribution.`
    );
  }

  // Low friction = good conditions
  if (ctx.friction.frictionScore < 30) {
    patterns.push("Your learning friction is low, creating ideal conditions for habit formation.");
  }

  // Strong confidence growth
  if (ctx.attribution.confidenceImpact.trendingUp && ctx.attribution.confidenceImpact.overallGrowth > 0) {
    patterns.push(
      `Confidence is growing (+${ctx.attribution.confidenceImpact.overallGrowth} points) — a positive feedback loop reinforcing your habits.`
    );
  }

  if (patterns.length === 0) {
    patterns.push("Your engagement patterns are still forming. Consistent small actions will build momentum.");
  }

  return patterns;
}

function computeBreakingPatterns(
  candidates: HabitCandidate[],
  ctx: HabitContext
): string[] {
  const patterns: string[] = [];

  // Fatigue signals that disrupt habits
  for (const signal of ctx.pulse.fatigueSignals) {
    if (signal.severity === "high") {
      patterns.push(`Fatigue signal detected: ${signal.detail}`);
    }
  }

  // High friction areas that block habit formation
  for (const area of ctx.friction.frictionAreas) {
    if (area.severity === "high") {
      patterns.push(`High friction: ${area.area} — ${area.detail}`);
    }
  }

  // From change-attribution negative drivers
  if (ctx.attribution.negativeDrivers.negativeCount > 0) {
    patterns.push(
      `${ctx.attribution.negativeDrivers.negative.length} negative factors may be disrupting your consistency.`
    );
  }

  // Inconsistent sprint completion
  const lowSprintCompletion = ctx.sprintHistory.filter((h) => h.completionRate < 30).length;
  if (lowSprintCompletion >= 2 && ctx.sprintHistory.length >= 3) {
    patterns.push(
      `${lowSprintCompletion} of your last ${ctx.sprintHistory.length} sprints had <30% completion — inconsistency breaks the habit loop.`
    );
  }

  // Declining energy forecast
  if (ctx.pulse.energyForecast === "declining") {
    patterns.push("Energy is forecast to decline — sustained habits may be harder to maintain without adjustments.");
  }

  if (patterns.length === 0) {
    patterns.push("No significant habit-breaking patterns detected.");
  }

  return patterns;
}

function computeRecommendedHabits(
  candidates: HabitCandidate[],
  ctx: HabitContext
): string[] {
  const recommendations: string[] = [];

  // Strong habits → reinforce
  const strongHabits = candidates.filter((c) => c.strength >= 60);
  for (const habit of strongHabits) {
    if (habit.recommendation === "reinforce") {
      recommendations.push(
        `Reinforce your "${habit.habit.toLowerCase()}" habit — it's strong at ${habit.strength}/100. Keep the cadence going.`
      );
    }
  }

  // Weak/inconsistent → micro-habits
  const weakCandidates = candidates.filter((c) => c.strength < 50);
  for (const habit of weakCandidates) {
    if (habit.recommendation === "micro_habit") {
      if (habit.category === "timing") {
        recommendations.push(
          `Try a micro-habit: set a recurring calendar reminder for career exploration every 3 days to build quiz timing consistency.`
        );
      } else if (habit.category === "consistency") {
        recommendations.push(
          `Try a micro-habit: commit to one 2-minute career action daily — even opening a career page counts toward consistency.`
        );
      } else {
        recommendations.push(
          `Build a micro-habit around "${habit.habit.toLowerCase()}": start with <5 minutes per session and increase gradually.`
        );
      }
    }
  }

  // If no candidates at all → beginner suggestions
  if (candidates.length === 0) {
    recommendations.push(
      "Your habit journey is just beginning. Start with one micro-habit: view one career page every day for a week."
    );
    recommendations.push(
      "Complete at least one action in your daily sprint — consistency beats intensity when building new habits."
    );
  }

  // If momentum windows exist → capitalize on them
  const momentumCandidates = candidates.filter((c) => c.id === "momentum-window" && c.strength >= 60);
  if (momentumCandidates.length > 0) {
    recommendations.push(
      "You're in a high-momentum window — this is the best time to establish a new habit or level up an existing one."
    );
  }

  // General consistency
  if (ctx.pulse.energyForecast === "declining") {
    recommendations.push(
      "Energy is forecast to decline — double down on your strongest habit to maintain momentum through the dip."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Maintain your current habits. Consistency compounds over time — even small actions add up."
    );
  }

  return recommendations.slice(0, 4);
}

function computeConsistencySignals(
  candidates: HabitCandidate[],
  ctx: HabitContext
): string[] {
  const signals: string[] = [];

  // Timing signal
  const timingCandidate = candidates.find((c) => c.category === "timing");
  if (timingCandidate && timingCandidate.strength >= 50) {
    signals.push(`Regular timing: ${timingCandidate.evidence[0]}`);
  } else {
    signals.push("Timing: Irregular — no consistent schedule detected yet.");
  }

  // Streak signal
  const streakCandidate = candidates.find((c) => c.id === "streak-depth");
  if (streakCandidate) {
    signals.push(`Streak: ${streakCandidate.habit} (${streakCandidate.strength}/100)`);
  } else {
    signals.push("Streak: No sustained streak pattern detected.");
  }

  // Achievement signal
  const achieveCandidate = candidates.find((c) => c.id === "achievement-momentum");
  if (achieveCandidate) {
    signals.push(`Achievement: ${achieveCandidate.evidence[0]}`);
  }

  // Sprint stickiness
  if (ctx.sprintHistory.length >= 2) {
    const avgRate = Math.round(
      ctx.sprintHistory.reduce((s, h) => s + h.completionRate, 0) / ctx.sprintHistory.length
    );
    signals.push(
      `Sprint stickiness: ${avgRate}% average daily completion across ${ctx.sprintHistory.length} days.`
    );
  }

  // Energy forecast
  signals.push(`Energy outlook: ${ctx.pulse.energyForecast} — ${
    ctx.pulse.energyForecast === "sustained"
      ? "favorable for habit maintenance"
      : ctx.pulse.energyForecast === "recovering"
        ? "improving conditions for habit building"
        : "adjust habits to lower intensity"
  }.`);

  return signals;
}

function buildHabitNarrative(
  habitScore: number,
  candidates: HabitCandidate[],
  successfulPatterns: string[],
  breakingPatterns: string[],
  recommendedHabits: string[],
  ctx: HabitContext
): string {
  const parts: string[] = [];

  // Opening based on score
  if (habitScore >= 65) {
    parts.push(
      `Your habit intelligence score is **${habitScore}/100** — you've built strong, repeatable patterns in your career exploration.`
    );
  } else if (habitScore >= 40) {
    parts.push(
      `Your habit intelligence score is **${habitScore}/100** — some patterns are forming, but there's room to strengthen consistency.`
    );
  } else {
    parts.push(
      `Your habit intelligence score is **${habitScore}/100** — you're in the early stages of habit formation. Small, consistent actions will build momentum.`
    );
  }

  // Strongest habit highlight
  if (candidates.length > 0) {
    const strongest = [...candidates].sort((a, b) => b.strength - a.strength)[0];
    if (strongest.strength >= 50) {
      parts.push(
        `Your strongest habit is **${strongest.habit.toLowerCase()}** at ${strongest.strength}/100 — ${strongest.evidence[0]?.toLowerCase() ?? "a reliable pattern"}.`
      );
    } else {
      parts.push(
        `Your most developed pattern is **${strongest.habit.toLowerCase()}** at ${strongest.strength}/100 — with more consistency, this could become a stable habit.`
      );
    }
  }

  // Successful patterns vs breaking patterns
  const strongPatterns = successfulPatterns.filter((p) => !p.includes("hasn") && !p.includes("still"));
  if (strongPatterns.length > 0) {
    const highlight = strongPatterns.slice(0, 2).join(" ");
    parts.push(highlight);
  }

  const negativePatterns = breakingPatterns.filter((p) => !p.includes("No significant"));
  if (negativePatterns.length > 0) {
    const highlight = negativePatterns.slice(0, 1)[0];
    parts.push(`One area to watch: ${highlight}`);
  }

  // Closing recommendation
  if (recommendedHabits.length > 0) {
    const topRec = recommendedHabits[0];
    parts.push(topRec);
  } else {
    parts.push("Continue your current trajectory — consistency is the foundation of lasting habits.");
  }

  return parts.join(" ");
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute a full habit intelligence assessment from all available data sources.
 */
export function computeHabitIntelligence(): HabitIntelligenceData {
  const ctx = gatherContext();

  // Detect all habit candidates
  const candidates: HabitCandidate[] = [
    detectQuizTimingHabit(ctx),
    detectSprintConsistency(ctx),
    detectRoadmapEngagement(ctx),
    detectStreakDepth(ctx),
    detectAchievementPattern(ctx),
    detectMomentumWindows(ctx),
    detectViewedCareerPattern(ctx),
  ].filter((c): c is HabitCandidate => c !== null);

  const habitScore = computeHabitScore(candidates);
  const habitStrength = computeOverallStrength(candidates);
  const successfulPatterns = computeSuccessfulPatterns(candidates, ctx);
  const breakingPatterns = computeBreakingPatterns(candidates, ctx);
  const recommendedHabits = computeRecommendedHabits(candidates, ctx);
  const consistencySignals = computeConsistencySignals(candidates, ctx);
  const habitNarrative = buildHabitNarrative(
    habitScore,
    candidates,
    successfulPatterns,
    breakingPatterns,
    recommendedHabits,
    ctx
  );

  const result: HabitIntelligenceData = {
    habitScore,
    habitCandidates: candidates,
    successfulPatterns,
    breakingPatterns,
    habitStrength,
    recommendedHabits,
    consistencySignals,
    habitNarrative,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Load the most recently computed habit intelligence assessment.
 */
export function loadHabitIntelligence(): HabitIntelligenceData | null {
  const storage = getSafeStorage({ silent: true });
  return storage.get<HabitIntelligenceData>(STORAGE_KEY);
}

/**
 * Get the current habit intelligence, computing fresh if needed.
 */
export function getHabitIntelligence(): HabitIntelligenceData {
  const existing = loadHabitIntelligence();
  if (existing) return existing;
  return computeHabitIntelligence();
}
