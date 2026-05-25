/**
 * PROGRESS REFLECTION INTELLIGENCE
 *
 * Answers: "What progress has been made and what should I reflect on?"
 *
 * Synthesizes from: weekly-reflection, career-progress, personal-evolution,
 *                   achievement-engine, journey-memory
 *
 * Outputs: progressRate, reflectionTheme, winsSummary, growthAreas,
 *          nextMilestone, reflectionPrompt, momentumSignal, keyMetric,
 *          oneLineReflection
 *
 * No backend. No auth. Stateless — computed fresh on each call.
 */

import { getWeeklyReflection } from "./weekly-reflection";
import { computeCareerProgress } from "./career-progress";
import { getPersonalEvolution } from "./personal-evolution";
import { computeAchievements } from "./achievement-engine";
import { loadJourneyMemory } from "./journey-memory";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type ReflectionTheme =
  | "accelerating"
  | "consistent"
  | "rebuilding"
  | "discovering"
  | "plateaued"
  | "misaligned";

export type MomentumSignal = "rising" | "steady" | "slipping";

export interface KeyMetric {
  label: string;
  value: string | number;
  change: "up" | "down" | "stable";
}

export interface ProgressReflectionData {
  /** Overall progress velocity (0–100) */
  progressRate: number;
  /** Core theme describing the current phase of progress */
  reflectionTheme: ReflectionTheme;
  /** Top wins to celebrate (max 3) */
  winsSummary: string[];
  /** Areas identified for growth or improvement (max 3) */
  growthAreas: string[];
  /** The next milestone or achievement to work toward */
  nextMilestone: string;
  /** A human-readable prompt inviting reflection */
  reflectionPrompt: string;
  /** Direction of momentum */
  momentumSignal: MomentumSignal;
  /** The single most important metric to watch right now */
  keyMetric: KeyMetric;
  /** A concise one-sentence reflection on progress */
  oneLineReflection: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface ReflectionContext {
  weekly: ReturnType<typeof getWeeklyReflection>;
  progress: ReturnType<typeof computeCareerProgress>;
  evolution: ReturnType<typeof getPersonalEvolution>;
  achievements: ReturnType<typeof computeAchievements>;
  memory: ReturnType<typeof loadJourneyMemory>;
}

function gatherContext(): ReflectionContext {
  return {
    weekly: getWeeklyReflection(),
    progress: computeCareerProgress(),
    evolution: getPersonalEvolution(),
    achievements: computeAchievements(),
    memory: loadJourneyMemory(),
  };
}

// ============================================================================
// METRIC COMPUTATION
// ============================================================================

function computeProgressRate(ctx: ReflectionContext): number {
  const { progress, evolution, weekly, achievements } = ctx;

  // evolutionScore (30%), overallProgressScore (25%), learningMomentum (20%),
  // missionCompletionRate (15%), XP-derived rate (10%)
  const evolutionScore = evolution?.evolutionScore ?? 0;
  const overallProgressScore = progress?.overallProgressScore ?? 0;
  const momentum = progress?.learningMomentum ?? 0;
  const completionRate = weekly?.missionCompletionRate ?? 0;

  // XP rate: normalize XP to a 0–100 scale (cap at 2000 XP for full score)
  const xpRate = Math.min(100, Math.round((achievements.xp / 2000) * 100));

  const weighted =
    evolutionScore * 0.3 +
    overallProgressScore * 0.25 +
    momentum * 0.2 +
    completionRate * 0.15 +
    xpRate * 0.1;

  return Math.min(100, Math.max(0, Math.round(weighted)));
}

function detectReflectionTheme(ctx: ReflectionContext): ReflectionTheme {
  const { evolution, progress, weekly, memory } = ctx;

  const evolutionScore = evolution?.evolutionScore ?? 0;
  const momentum = progress?.learningMomentum ?? 0;
  const milestones = progress?.milestonesCompleted ?? 0;
  const quizzes = memory.completedQuizzes;
  const streakTrend = weekly?.streakTrend ?? "stable";

  // Discovering: early stage, few actions taken
  if (quizzes <= 2 && milestones === 0) {
    return "discovering";
  }

  // Rebuilding: low momentum, declining streak
  if (momentum < 30 || streakTrend === "declining") {
    return "rebuilding";
  }

  // Misaligned: high progress score but low evolution (doing without growing)
  if ((overallProgressScore(ctx) >= 70 && evolutionScore < 40) || 
      (evolutionScore >= 70 && (overallProgressScore(ctx) ?? 0) < 40)) {
    return "misaligned";
  }

  // Accelerating: high evolution + high momentum
  if (evolutionScore >= 70 && momentum >= 60) {
    return "accelerating";
  }

  // Plateaued: steady but not growing across key metrics
  if (evolutionScore >= 40 && evolutionScore < 60 && 
      momentum >= 30 && momentum < 50 &&
      streakTrend === "stable") {
    return "plateaued";
  }

  // Consistent: everything stable and moderate
  return "consistent";
}

function overallProgressScore(ctx: ReflectionContext): number {
  return ctx.progress?.overallProgressScore ?? 0;
}

function detectMomentumSignal(ctx: ReflectionContext): MomentumSignal {
  const { progress, weekly, memory } = ctx;

  // Check confidence trend
  const confHistory = memory.confidenceHistory;
  const hasConfidenceTrend = confHistory.length >= 3;
  let confidenceRising = false;
  let confidenceFalling = false;

  if (hasConfidenceTrend) {
    const recent = confHistory.slice(-3);
    const first = recent[0];
    const last = recent[recent.length - 1];
    confidenceRising = last > first + 5;
    confidenceFalling = last < first - 5;
  }

  const streakTrend = weekly?.streakTrend ?? "stable";
  const momentum = progress?.learningMomentum ?? 0;

  if (streakTrend === "growing" && (confidenceRising || momentum >= 50)) {
    return "rising";
  }

  if (streakTrend === "declining" || confidenceFalling || momentum < 30) {
    return "slipping";
  }

  return "steady";
}

function computeWinsSummary(ctx: ReflectionContext): string[] {
  const wins: string[] = [];
  const { weekly, achievements, evolution } = ctx;

  // From weekly reflection
  if (weekly && weekly.wins.length > 0) {
    wins.push(...weekly.wins.slice(0, 2));
  }

  // From achievements
  if (achievements && achievements.unlockedAchievements.length > 0) {
    const latest = achievements.unlockedAchievements
      .filter((a) => a.unlocked)
      .sort(
        (a, b) =>
          new Date(b.unlockedAt ?? 0).getTime() -
          new Date(a.unlockedAt ?? 0).getTime()
      )[0];
    if (latest) {
      wins.push(`Unlocked "${latest.title}" — ${latest.description}`);
    }
  }

  // From evolution
  if (evolution && evolution.confidenceGrowth > 5) {
    wins.push(
      `Confidence grew by ${evolution.confidenceGrowth} points across your journey`
    );
  }

  // Level milestone
  if (achievements && achievements.level >= 2) {
    wins.push(`Reached Level ${achievements.level} with ${achievements.xp} XP`);
  }

  return [...new Set(wins)].slice(0, 3);
}

function computeGrowthAreas(ctx: ReflectionContext): string[] {
  const areas: string[] = [];
  const { weekly, evolution, progress } = ctx;

  // From weekly slowdowns
  if (weekly && weekly.slowdowns.length > 0) {
    areas.push(...weekly.slowdowns.slice(0, 2));
  }

  // From evolution behavior changes (inverted — look for what hasn't changed)
  if (evolution) {
    const quizCount = ctx.memory.completedQuizzes;
    const viewCount = Object.keys(ctx.memory.viewedCareers).length;
    const comparisonCount = Object.keys(ctx.memory.comparedCareerPairs).length;

    if (quizCount < 3 && viewCount >= 5) {
      areas.push(
        "Exploring careers but not deepening understanding through quizzes — try retaking the quiz with a specific career in mind"
      );
    }
    if (viewCount >= 10 && comparisonCount < 3) {
      areas.push(
        "Viewed many careers but haven't compared them side-by-side — comparisons reveal fit preferences"
      );
    }
  }

  // From progress
  if (progress) {
    if (progress.quizConsistency < 40 && ctx.memory.completedQuizzes > 0) {
      areas.push("Quiz consistency is low — regular self-assessment builds clearer career intelligence");
    }
    if (progress.explorationFocus > 80 && progress.milestonesCompleted === 0) {
      areas.push("Very focused exploration but no milestones yet — consider selecting a workspace to track structured progress");
    }
  }

  return [...new Set(areas)].slice(0, 3);
}

function computeNextMilestone(ctx: ReflectionContext): string {
  const { achievements, progress, weekly } = ctx;

  // Check if there's a next unlock in achievements
  if (achievements && achievements.nextUnlock) {
    return `Unlock "${achievements.nextUnlock.title}": ${achievements.nextUnlock.description}`;
  }

  // Check weekly focus
  if (weekly && weekly.nextWeekFocus) {
    return weekly.nextWeekFocus;
  }

  // Milestone-based
  if (progress && progress.milestonesCompleted === 0) {
    return "Complete your first milestone in a career workspace";
  }

  // Default
  if (ctx.memory.completedQuizzes === 0) {
    return "Take your first career cognition quiz to begin tracking progress";
  }

  return "Continue building your career intelligence — consistency compounds";
}

function generateReflectionPrompt(
  theme: ReflectionTheme,
  ctx: ReflectionContext
): string {
  const { evolution, weekly, memory } = ctx;

  switch (theme) {
    case "accelerating":
      return `You're in a strong growth phase with ${evolution?.evolutionScore ?? 0}% evolution and ${weekly?.wins.length ?? 0} wins this week. What's driving this momentum? Consider doubling down on what's working.`;
    case "consistent":
      return `Your progress is steady and reliable. Are there areas where you'd like to push harder, or is this pace sustainable for your long-term goals? Consistency is powerful, but small challenges can accelerate growth.`;
    case "rebuilding":
      const streakTip =
        memory.completedQuizzes > 0
          ? "Try one small action today — a quiz retake or career comparison — to rebuild your streak."
          : "Start with a single step: take a career quiz or view a career that interests you.";
      return `Momentum has dipped recently. ${streakTip} Reflecting on what changed can help identify the right next move.`;
    case "discovering":
      return `You're in the early stages of career exploration. What's sparking your curiosity? Each career you view and quiz you take adds clarity to your path. What would you like to learn more about?`;
    case "plateaued":
      return `Your progress has stabilized. Sometimes plateaus are necessary consolidation phases before the next leap. What new challenge or career area could reignite your growth?`;
    case "misaligned":
      return `There's a gap between your activity level and your sense of evolution. Are you doing the right things, or just staying busy? Consider whether your current actions align with where you want to go.`;
  }
}

function computeKeyMetric(ctx: ReflectionContext): KeyMetric {
  const { progress, evolution, weekly, achievements } = ctx;

  // Priority: evolution score if notable, otherwise momentum, otherwise weekly rate
  const evolutionScore = evolution?.evolutionScore ?? 0;
  const momentum = progress?.learningMomentum ?? 0;
  const weeklyRate = weekly?.missionCompletionRate ?? 0;
  const level = achievements.level;
  const xp = achievements.xp;

  // If evolution is high, highlight it
  if (evolutionScore >= 60) {
    return {
      label: "Evolution Score",
      value: `${evolutionScore}%`,
      change: evolution && evolution.confidenceGrowth > 5 ? "up" : "stable",
    };
  }

  // If momentum is notable
  if (momentum >= 50 || momentum <= 30) {
    return {
      label: "Learning Momentum",
      value: `${momentum}%`,
      change:
        weekly?.streakTrend === "growing"
          ? "up"
          : weekly?.streakTrend === "declining"
            ? "down"
            : "stable",
    };
  }

  // If weekly engagement is strong or weak
  if (weeklyRate >= 60 || weeklyRate <= 30) {
    return {
      label: "Weekly Engagement",
      value: `${weeklyRate}%`,
      change:
        weekly && weekly.streakTrend === "growing"
          ? "up"
          : weekly && weekly.streakTrend === "declining"
            ? "down"
            : "stable",
    };
  }

  // Default: level & XP
  return {
    label: "Career Level",
    value: `Lv.${level} · ${xp} XP`,
    change: xp > 0 ? "up" : "stable",
  };
}

function generateOneLineReflection(
  theme: ReflectionTheme,
  progressRate: number,
  winsSummary: string[],
  growthAreas: string[]
): string {
  if (winsSummary.length === 0 && growthAreas.length === 0) {
    return "Your career journey is just beginning — every action adds to your intelligence and clarity.";
  }

  const winsIntro =
    winsSummary.length > 0
      ? `${winsSummary.length} win${winsSummary.length > 1 ? "s" : ""} to celebrate`
      : "";

  const growthIntro =
    growthAreas.length > 0
      ? `${growthAreas.length} area${growthAreas.length > 1 ? "s" : ""} to develop`
      : "";

  const combined = [winsIntro, growthIntro].filter(Boolean).join(" and ");

  switch (theme) {
    case "accelerating":
      return `Progress is accelerating at ${progressRate}% — ${combined}. Keep leaning into what's working.`;
    case "consistent":
      return `Steady progress at ${progressRate}% — ${combined}. Reliability builds long-term career intelligence.`;
    case "rebuilding":
      return `Progress rate is ${progressRate}% — ${combined}. Small, consistent actions will rebuild momentum.`;
    case "discovering":
      return `Exploring at ${progressRate}% — ${combined}. Each discovery adds a piece to your career puzzle.`;
    case "plateaued":
      return `Holding steady at ${progressRate}% — ${combined}. Plateaus often precede breakthroughs.`;
    case "misaligned":
      return `${progressRate}% progress rate — ${combined}. Consider recalibrating your focus to align effort with growth.`;
  }
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full progress reflection from all available data sources.
 */
export function computeProgressReflection(): ProgressReflectionData {
  const ctx = gatherContext();

  const progressRate = computeProgressRate(ctx);
  const reflectionTheme = detectReflectionTheme(ctx);
  const momentumSignal = detectMomentumSignal(ctx);
  const winsSummary = computeWinsSummary(ctx);
  const growthAreas = computeGrowthAreas(ctx);
  const nextMilestone = computeNextMilestone(ctx);
  const reflectionPrompt = generateReflectionPrompt(reflectionTheme, ctx);
  const keyMetric = computeKeyMetric(ctx);
  const oneLineReflection = generateOneLineReflection(
    reflectionTheme,
    progressRate,
    winsSummary,
    growthAreas
  );

  return {
    progressRate,
    reflectionTheme,
    winsSummary,
    growthAreas,
    nextMilestone,
    reflectionPrompt,
    momentumSignal,
    keyMetric,
    oneLineReflection,
  };
}
