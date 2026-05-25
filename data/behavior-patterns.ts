/**
 * BEHAVIORAL PATTERN INTELLIGENCE
 *
 * Detects hidden behavior patterns across sessions and converts them into
 * actionable insights. Reads exclusively from existing data sources:
 *   - analytics-events   (event log, session tracking)
 *   - journey-memory     (quizzes, comparisons, viewing history)
 *   - growth-analytics   (confidence trend, specialization, XP velocity)
 *   - career-goals       (pace signal, risk signal)
 *   - journey-replay     (timeline milestones)
 *   - adaptive-roadmap   (accelerate signals, warnings)
 *
 * No backend. No auth. Persists computed state locally.
 */

import { getAllEvents, type AnalyticsEvent } from "./analytics-events";
import { loadJourneyMemory, type JourneyMemory } from "./journey-memory";
import { getGrowthAnalytics, type GrowthAnalytics } from "./growth-analytics";
import { loadGoalState } from "./career-goals";
import { getJourneyReplay } from "./journey-replay";
import { loadCareerWorkspace } from "./career-workspace";
import { computeAchievements } from "./achievement-engine";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-behavior-patterns";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

/** Derived insights about how the user browses and explores careers */
export interface ExplorationHabits {
  /** Primary browsing style: focused, balanced, or scattered */
  style: "focused" | "balanced" | "scattered";
  /** Number of distinct categories explored */
  categoriesExplored: number;
  /** Average time (ms) between career views in a browsing session */
  avgTimeBetweenViews: number;
  /** Peak browsing hour of day (0–23) or null if insufficient data */
  peakBrowsingHour: number | null;
  /** Human-readable summary */
  summary: string;
}

/** Identified points where the user disengaged */
export interface DropoffPattern {
  type: "quiz" | "comparison" | "roadmap" | "session";
  count: number;
  rate: number; // 0-1 proportion relative to starts
  description: string;
}

/** Repeated comparison pairs indicating indecision */
export interface RepeatComparisonPattern {
  careerA: string;
  careerB: string;
  count: number;
  indecisionSignal: boolean; // high count = indecision
}

/** Consistency metrics from session regularity */
export interface LearningConsistency {
  /** Overall consistency score 0–100 */
  score: number;
  /** Whether the user maintains a regular cadence */
  hasRegularCadence: boolean;
  /** Average days between sessions */
  avgDaysBetweenSessions: number;
  /** Current streak length */
  currentStreak: number;
  /** Summary of pattern */
  summary: string;
}

/** Signals of curiosity and exploration breadth */
export interface CuriositySignal {
  signal: string;
  strength: "strong" | "moderate" | "emerging";
  detail: string;
}

/** Overall hesitation/decisiveness score 0–100 */
export interface DecisionHesitationScore {
  score: number; // 0 = highly decisive, 100 = highly hesitant
  level: "decisive" | "moderate" | "hesitant" | "very_hesitant";
  contributingFactors: string[];
}

/** Signals that the user is looping back to previously explored careers */
export interface CareerLoopSignal {
  careerId: string;
  revisitCount: number;
  firstViewed: string; // ISO date
  lastViewed: string;  // ISO date
  indecisionPotential: boolean;
}

/** Indicators of personal growth over time */
export interface PersonalGrowthSignal {
  signal: string;
  trend: "improving" | "stable" | "declining";
  value: string;
}

// ============================================================================
// COMPUTED OUTPUT TYPE
// ============================================================================

export interface BehaviorPatternsData {
  explorationHabits: ExplorationHabits;
  dropoffPatterns: DropoffPattern[];
  repeatComparisonPatterns: RepeatComparisonPattern[];
  learningConsistency: LearningConsistency;
  curiositySignals: CuriositySignal[];
  decisionHesitationScore: DecisionHesitationScore;
  careerLoopSignals: CareerLoopSignal[];
  personalGrowthSignals: PersonalGrowthSignal[];
  computedAt: string;
}

// ============================================================================
// THRESHOLDS
// ============================================================================

const SCATTERED_THRESHOLD = 5; // switching between 5+ categories = scattered
const FOCUSED_THRESHOLD = 2; // staying in <= 2 categories = focused
const INDECISION_COMPARISON_THRESHOLD = 3; // same pair compared 3+ times
const HESITATION_RETAKE_THRESHOLD = 3; // 3+ retakes = hesitating
const LOOP_THRESHOLD = 3; // same career viewed 3+ times = looping
const MIN_VIEWS_FOR_TIME = 3;
const SLOW_BROWSING_MS = 120_000; // 2 minutes between views = deliberate
const FAST_BROWSING_MS = 15_000; // 15 seconds = rapid scanning

// ============================================================================
// PER-SIGNAL COMPUTATION
// ============================================================================

function computeExplorationHabits(
  memory: JourneyMemory,
  events: AnalyticsEvent[]
): ExplorationHabits {
  const viewedHistory = memory.viewedCareerHistory;
  const favCats = Object.keys(memory.favoriteCategories);
  const categoriesExplored = favCats.length;

  // Determine style based on category breadth
  let style: ExplorationHabits["style"] = "balanced";
  if (categoriesExplored >= SCATTERED_THRESHOLD) {
    style = "scattered";
  } else if (categoriesExplored <= FOCUSED_THRESHOLD && memory.completedQuizzes > 0) {
    style = "focused";
  }

  // Average time between consecutive career views
  let avgTimeBetweenViews = 0;
  if (viewedHistory.length >= MIN_VIEWS_FOR_TIME) {
    let totalGap = 0;
    let gaps = 0;
    for (let i = 1; i < viewedHistory.length; i++) {
      const gap =
        new Date(viewedHistory[i].timestamp).getTime() -
        new Date(viewedHistory[i - 1].timestamp).getTime();
      if (gap > 0 && gap < 24 * 60 * 60 * 1000) {
        // Only count gaps within a day
        totalGap += gap;
        gaps++;
      }
    }
    avgTimeBetweenViews = gaps > 0 ? Math.round(totalGap / gaps) : 0;
  }

  // Peak browsing hour from analytics events
  const careerViewEvents = events.filter(
    (e) => e.type === "career_viewed" || e.type === "career_category_viewed"
  );
  const hourCounts: Record<number, number> = {};
  for (const evt of careerViewEvents) {
    const hour = new Date(evt.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  let peakHour: number | null = null;
  let peakCount = 0;
  for (const [h, c] of Object.entries(hourCounts)) {
    if (c > peakCount) {
      peakCount = c;
      peakHour = parseInt(h, 10);
    }
  }

  // Build summary
  const parts: string[] = [];
  if (style === "focused") {
    parts.push("You tend to explore within a focused set of career categories.");
  } else if (style === "scattered") {
    parts.push("You explore broadly across many career categories.");
  } else {
    parts.push("Your exploration spans a balanced range of categories.");
  }
  if (avgTimeBetweenViews > 0) {
    if (avgTimeBetweenViews > SLOW_BROWSING_MS) {
      parts.push("You take time to review each career carefully.");
    } else if (avgTimeBetweenViews < FAST_BROWSING_MS) {
      parts.push("You browse careers quickly, scanning for high-level fit.");
    } else {
      parts.push("You browse at a measured pace.");
    }
  }
  if (peakHour !== null) {
    const period =
      peakHour < 12 ? "morning" : peakHour < 17 ? "afternoon" : "evening";
    parts.push(`Most active browsing happens in the ${period}.`);
  }

  return {
    style,
    categoriesExplored,
    avgTimeBetweenViews,
    peakBrowsingHour: peakHour,
    summary: parts.join(" "),
  };
}

function computeDropoffPatterns(
  events: AnalyticsEvent[],
  memory: JourneyMemory
): DropoffPattern[] {
  const patterns: DropoffPattern[] = [];

  // Quiz dropoffs: quiz_started vs quiz_completed
  const quizStarts = events.filter((e) => e.type === "quiz_started").length;
  // Count from journey memory as well for total quizzes taken
  const quizCompletions = memory.completedQuizzes;
  if (quizStarts > 0) {
    const completionRate = Math.min(1, quizCompletions / Math.max(1, quizStarts));
    const dropoffRate = 1 - completionRate;
    if (dropoffRate > 0) {
      patterns.push({
        type: "quiz",
        count: Math.max(0, quizStarts - quizCompletions),
        rate: Math.round(dropoffRate * 100) / 100,
        description:
          dropoffRate > 0.5
            ? "Many quizzes started but not completed — consider shorter quiz options."
            : dropoffRate > 0.2
              ? "Some quizzes are left incomplete. Check if timing or length is a factor."
              : "Most quizzes are completed once started. Good engagement.",
      });
    }
  }

  // Comparison dropoffs: comparison_opened without comparison_initiated
  const comparisonOpens = events.filter(
    (e) => e.type === "comparison_opened"
  ).length;
  const comparisonInits = events.filter(
    (e) => e.type === "comparison_initiated"
  ).length;
  if (comparisonOpens > 0) {
    const conversionRate = Math.min(
      1,
      comparisonInits / Math.max(1, comparisonOpens)
    );
    const dropoffRate = 1 - conversionRate;
    patterns.push({
      type: "comparison",
      count: Math.max(0, comparisonOpens - comparisonInits),
      rate: Math.round(dropoffRate * 100) / 100,
      description:
        dropoffRate > 0.5
          ? "Comparison page is opened but often without initiating a comparison."
          : dropoffRate > 0.2
            ? "Some comparison views don't lead to active comparisons."
            : "Most comparison views lead to active comparisons.",
    });
  }

  // Roadmap dropoffs: roadmap_viewed without roadmap_interacted
  const roadmapViews = events.filter(
    (e) => e.type === "roadmap_viewed"
  ).length;
  const roadmapInteract = events.filter(
    (e) => e.type === "roadmap_interacted"
  ).length;
  if (roadmapViews > 0) {
    const interactionRate = Math.min(
      1,
      roadmapInteract / Math.max(1, roadmapViews)
    );
    const dropoffRate = 1 - interactionRate;
    patterns.push({
      type: "roadmap",
      count: Math.max(0, roadmapViews - roadmapInteract),
      rate: Math.round(dropoffRate * 100) / 100,
      description:
        dropoffRate > 0.5
          ? "Roadmaps are often viewed but not engaged with."
          : dropoffRate > 0.2
            ? "Some roadmaps are viewed without further interaction."
            : "Most roadmaps viewed lead to further engagement.",
    });
  }

  // Session dropoffs: sessions with only start event, no end
  const sessionStarts = events.filter((e) => e.type === "session_started").length;
  const sessionEnds = events.filter((e) => e.type === "session_ended").length;
  if (sessionStarts > 0 && sessionStarts > sessionEnds) {
    patterns.push({
      type: "session",
      count: sessionStarts - sessionEnds,
      rate: Math.round(((sessionStarts - sessionEnds) / sessionStarts) * 100) / 100,
      description:
        "Some sessions end without explicit close — normal for single-page visits.",
    });
  }

  return patterns;
}

function computeRepeatComparisonPatterns(
  memory: JourneyMemory
): RepeatComparisonPattern[] {
  const pairs = memory.comparedCareerPairs;
  const patterns: RepeatComparisonPattern[] = [];

  for (const [key, count] of Object.entries(pairs)) {
    if (count >= 2) {
      const [careerA, careerB] = key.split("|");
      patterns.push({
        careerA,
        careerB,
        count,
        indecisionSignal: count >= INDECISION_COMPARISON_THRESHOLD,
      });
    }
  }

  // Sort by count descending
  patterns.sort((a, b) => b.count - a.count);
  return patterns;
}

function computeLearningConsistency(
  memory: JourneyMemory,
  events: AnalyticsEvent[]
): LearningConsistency {
  const quizDates = memory.quizDates;
  const workspace = loadCareerWorkspace();
  const streak = workspace?.streak ?? 0;
  const weeklyProgress = workspace?.weeklyProgress ?? [];
  const weeklyEntries = weeklyProgress.length;

  // Average days between quiz sessions
  let avgDaysBetweenSessions = 0;
  if (quizDates.length >= 2) {
    let totalDays = 0;
    for (let i = 1; i < quizDates.length; i++) {
      totalDays +=
        (new Date(quizDates[i]).getTime() -
          new Date(quizDates[i - 1]).getTime()) /
        (1000 * 60 * 60 * 24);
    }
    avgDaysBetweenSessions = Math.round((totalDays / (quizDates.length - 1)) * 10) / 10;
  }

  // Consistency score components: streak, weekly entries, session regularity
  let score = 0;

  // Streak contributes up to 40 points
  score += Math.min(40, streak * 5);

  // Weekly entries contribute up to 30 points
  score += Math.min(30, weeklyEntries * 10);

  // Session regularity contributes up to 30 points
  if (avgDaysBetweenSessions > 0) {
    if (avgDaysBetweenSessions <= 3) {
      score += 30; // Multiple times a week
    } else if (avgDaysBetweenSessions <= 7) {
      score += 20; // Weekly
    } else if (avgDaysBetweenSessions <= 14) {
      score += 10; // Biweekly
    } else {
      score += 5; // Sporadic
    }
  } else if (quizDates.length === 1) {
    score += 5; // Just started
  }

  const hasRegularCadence = score >= 40;

  const summary =
    score >= 70
      ? "Strong learning consistency — you maintain a regular cadence of career exploration."
      : score >= 40
        ? "Moderate consistency — some regularity in sessions with room to build a stronger cadence."
        : score >= 20
          ? "Occasional engagement — try setting a weekly schedule to build momentum."
          : "Early in your journey — consistency will build naturally as you explore more.";

  return {
    score,
    hasRegularCadence,
    avgDaysBetweenSessions,
    currentStreak: streak,
    summary,
  };
}

function computeCuriositySignals(
  memory: JourneyMemory,
  analytics: GrowthAnalytics | null
): CuriositySignal[] {
  const signals: CuriositySignal[] = [];

  // 1. Theme diversity
  const activeThemes = Object.entries(memory.repeatedThemes).filter(
    ([, count]) => count > 0
  );
  if (activeThemes.length >= 4) {
    signals.push({
      signal: "broad_theme_exploration",
      strength: "strong",
      detail: `Exploring ${activeThemes.length} distinct thinking themes — indicates wide intellectual curiosity.`,
    });
  } else if (activeThemes.length >= 2) {
    signals.push({
      signal: "focused_theme_exploration",
      strength: "moderate",
      detail: `Exploring ${activeThemes.length} core themes with room to expand into adjacent areas.`,
    });
  }

  // 2. AI interest
  const aiSignals = memory.aiInterestSignals;
  const totalAI = aiSignals.careerViews + aiSignals.compareActions + aiSignals.recommendations;
  if (totalAI >= 3) {
    signals.push({
      signal: "ai_curiosity",
      strength: totalAI >= 6 ? "strong" : "moderate",
      detail: `Shown interest in AI-related careers ${totalAI} times — growing curiosity in AI-enabled roles.`,
    });
  }

  // 3. Category breadth
  const catCount = Object.keys(memory.favoriteCategories).length;
  if (catCount >= 4) {
    signals.push({
      signal: "cross_category_exploration",
      strength: "strong",
      detail: `Exploring ${catCount} different career categories — demonstrates openness to diverse paths.`,
    });
  } else if (catCount >= 2) {
    signals.push({
      signal: "cross_category_exploration",
      strength: "moderate",
      detail: `Exploring ${catCount} career categories with potential to discover more.`,
    });
  }

  // 4. Comparison curiosity
  const compareCount = Object.keys(memory.comparedCareerPairs).length;
  if (compareCount >= 3) {
    signals.push({
      signal: "active_comparison",
      strength: compareCount >= 5 ? "strong" : "moderate",
      detail: `Compared ${compareCount} career pairs — actively seeking fit through side-by-side evaluation.`,
    });
  }

  // 5. Specialization trend
  if (analytics) {
    if (analytics.specializationTrend === "broadening") {
      signals.push({
        signal: "broadening_interests",
        strength: "moderate",
        detail: "Specialization trend shows broadening — you're expanding rather than narrowing your focus.",
      });
    }
  }

  // 6. Career shift signals from growth analytics
  if (analytics && analytics.careerShiftSignals.length > 0) {
    signals.push({
      signal: "career_evolution",
      strength: "emerging",
      detail: analytics.careerShiftSignals[0],
    });
  }

  return signals;
}

function computeDecisionHesitationScore(
  memory: JourneyMemory,
  events: AnalyticsEvent[],
  analytics: GrowthAnalytics | null
): DecisionHesitationScore {
  let score = 0;
  const factors: string[] = [];

  // 1. Retake frequency (0–25 points)
  const retakes = memory.uncertaintyPatterns.retakes;
  if (retakes >= HESITATION_RETAKE_THRESHOLD) {
    score += 25;
    factors.push(`Retaken quizzes ${retakes} times — suggests uncertainty about results.`);
  } else if (retakes > 0) {
    score += retakes * 8;
    factors.push(`Some quiz retakes (${retakes}).`);
  }

  // 2. Low confidence matches (0–20 points)
  const lowConf = memory.uncertaintyPatterns.lowConfidenceMatches;
  if (lowConf >= 3) {
    score += 20;
    factors.push(`${lowConf} low-confidence quiz matches — profiles may feel unclear.`);
  } else if (lowConf > 0) {
    score += lowConf * 6;
    factors.push(`${lowConf} low-confidence matches detected.`);
  }

  // 3. Repeated comparisons (0–20 points)
  const repeatedPairs = Object.entries(memory.comparedCareerPairs).filter(
    ([, count]) => count >= 2
  );
  if (repeatedPairs.length >= 2) {
    score += 20;
    factors.push(
      `${repeatedPairs.length} career pairs compared multiple times — weighing options carefully.`
    );
  } else if (repeatedPairs.length === 1) {
    score += 10;
    factors.push("One career pair compared repeatedly — close evaluation in progress.");
  }

  // 4. Career looping (0–20 points)
  const careerLoops = Object.entries(memory.viewedCareers).filter(
    ([, count]) => count >= LOOP_THRESHOLD
  );
  if (careerLoops.length >= 2) {
    score += 20;
    factors.push(
      `${careerLoops.length} careers revisited ${LOOP_THRESHOLD}+ times — cycling between options.`
    );
  } else if (careerLoops.length === 1) {
    score += 10;
    factors.push("One career revisited frequently — strong pull but may indicate indecision.");
  }

  // 5. Goal pace signal (0–15 points)
  const goalState = loadGoalState();
  if (goalState.signals && goalState.signals.paceSignal === "behind") {
    score += 15;
    factors.push("Goal progress is behind schedule — pace may reflect hesitation.");
  }

  // 6. Confidence trend (negative adjustment or bonus)
  if (analytics) {
    if (analytics.confidenceTrend < -5) {
      score += 10;
      factors.push(`Declining confidence trend (${analytics.confidenceTrend}%).`);
    } else if (analytics.confidenceTrend > 5) {
      score = Math.max(0, score - 10); // Rising confidence reduces hesitation
      factors.push("Rising confidence trend — decision clarity is improving.");
    }
  }

  // Clamp to 0–100
  score = Math.max(0, Math.min(100, score));

  let level: DecisionHesitationScore["level"];
  if (score <= 20) level = "decisive";
  else if (score <= 45) level = "moderate";
  else if (score <= 70) level = "hesitant";
  else level = "very_hesitant";

  return { score, level, contributingFactors: factors };
}

function computeCareerLoopSignals(memory: JourneyMemory): CareerLoopSignal[] {
  const viewedCareers = memory.viewedCareers;
  const viewHistory = memory.viewedCareerHistory;
  const loops: CareerLoopSignal[] = [];

  for (const [careerId, count] of Object.entries(viewedCareers)) {
    if (count >= LOOP_THRESHOLD) {
      const careerViews = viewHistory.filter((v) => v.careerId === careerId);
      loops.push({
        careerId,
        revisitCount: count,
        firstViewed: careerViews[0]?.timestamp ?? "",
        lastViewed: careerViews[careerViews.length - 1]?.timestamp ?? "",
        indecisionPotential: count >= LOOP_THRESHOLD + 2,
      });
    }
  }

  loops.sort((a, b) => b.revisitCount - a.revisitCount);
  return loops;
}

function computePersonalGrowthSignals(
  memory: JourneyMemory,
  analytics: GrowthAnalytics | null,
  events: AnalyticsEvent[]
): PersonalGrowthSignal[] {
  const signals: PersonalGrowthSignal[] = [];

  // 1. Confidence growth
  if (memory.confidenceHistory.length >= 2) {
    const first = memory.confidenceHistory[0];
    const last = memory.confidenceHistory[memory.confidenceHistory.length - 1];
    const diff = last - first;
    signals.push({
      signal: "confidence_evolution",
      trend: diff > 5 ? "improving" : diff < -5 ? "declining" : "stable",
      value: `From ${Math.round(first)}% to ${Math.round(last)}% (${diff > 0 ? "+" : ""}${Math.round(diff)}%)`,
    });
  }

  // 2. Specialization depth
  if (memory.specializationDepthHistory.length >= 2) {
    const first = memory.specializationDepthHistory[0];
    const last = memory.specializationDepthHistory[memory.specializationDepthHistory.length - 1];
    const diff = last - first;
    signals.push({
      signal: "specialization_development",
      trend: diff > 10 ? "improving" : diff < -10 ? "declining" : "stable",
      value: `Depth ${diff > 0 ? "increased" : diff < 0 ? "decreased" : "stable"} by ${Math.abs(Math.round(diff))} points`,
    });
  }

  // 3. XP velocity from growth analytics
  if (analytics) {
    if (analytics.xpTrend > 0) {
      signals.push({
        signal: "xp_momentum",
        trend: analytics.xpTrend >= 100 ? "improving" : "stable",
        value: `+${analytics.xpTrend} XP in recent period`,
      });
    }
  }

  // 4. Quiz completion growth
  if (memory.completedQuizzes > 0) {
    signals.push({
      signal: "quiz_engagement",
      trend: memory.completedQuizzes >= 5 ? "improving" : "stable",
      value: `${memory.completedQuizzes} total quizzes completed`,
    });
  }

  // 5. Level progression from achievements
  const achievements = computeAchievements();
  if (achievements.level > 1) {
    signals.push({
      signal: "level_progression",
      trend: achievements.level >= 3 ? "improving" : "stable",
      value: `Reached Level ${achievements.level} with ${achievements.xp} total XP`,
    });
  }

  // 6. Journey replay milestone count
  const replay = getJourneyReplay();
  if (replay.majorMilestones.length > 0) {
    signals.push({
      signal: "milestone_progression",
      trend: replay.majorMilestones.length >= 3 ? "improving" : "stable",
      value: `${replay.majorMilestones.length} major milestones reached`,
    });
  }

  return signals;
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute all behavioral pattern signals from existing data sources.
 */
export function computeBehaviorPatterns(): BehaviorPatternsData {
  const memory = loadJourneyMemory();
  const events = getAllEvents(200);
  const analytics = getGrowthAnalytics();

  const explorationHabits = computeExplorationHabits(memory, events);
  const dropoffPatterns = computeDropoffPatterns(events, memory);
  const repeatComparisonPatterns = computeRepeatComparisonPatterns(memory);
  const learningConsistency = computeLearningConsistency(memory, events);
  const curiositySignals = computeCuriositySignals(memory, analytics);
  const decisionHesitationScore = computeDecisionHesitationScore(memory, events, analytics);
  const careerLoopSignals = computeCareerLoopSignals(memory);
  const personalGrowthSignals = computePersonalGrowthSignals(memory, analytics, events);

  const result: BehaviorPatternsData = {
    explorationHabits,
    dropoffPatterns,
    repeatComparisonPatterns,
    learningConsistency,
    curiositySignals,
    decisionHesitationScore,
    careerLoopSignals,
    personalGrowthSignals,
    computedAt: new Date().toISOString(),
  };

  // Persist to local storage
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

/**
 * Load previously computed behavior patterns from storage.
 */
export function loadBehaviorPatterns(): BehaviorPatternsData | null {
  const storage = getSafeStorage({ silent: true });
  return storage.get<BehaviorPatternsData>(STORAGE_KEY);
}
