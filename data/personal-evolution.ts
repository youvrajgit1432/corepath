/**
 * PERSONAL EVOLUTION INTELLIGENCE
 *
 * Answers: "How have I changed since starting?"
 *
 * Detects early profile vs current profile, confidence growth,
 * interest evolution, milestone moments, turning points, behavior
 * changes, and generates a human-readable growth narrative.
 *
 * Reads from: journey-memory, achievements, career-identity,
 *             predictive-insights, recommendation-evolution,
 *             growth-analytics
 *
 * Persists via SafeStorage. No backend. No auth.
 */

import { loadJourneyMemory } from "./journey-memory";
import { loadAchievements, computeAchievements } from "./achievement-engine";
import { loadCareerIdentity, computeCareerIdentity } from "./career-identity";

import { getGrowthAnalytics } from "./growth-analytics";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-personal-evolution";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface MilestoneMoment {
  type: "first_quiz" | "first_comparison" | "first_achievement" | "level_up" | "identity_shift" | "streak_milestone" | "scenario_milestone";
  label: string;
  detail: string;
  date: string;
  icon: string;
}

export interface PersonalEvolutionData {
  /** How the user's career archetype / identity has shifted */
  identityShift: string;
  /** Confidence change from early sessions to latest (percentage points) */
  confidenceGrowth: number;
  /** How interests, themes, and categories evolved over time */
  interestEvolution: string[];
  /** Key milestone moments with dates */
  milestoneMoments: MilestoneMoment[];
  /** Points where trajectory changed direction */
  turningPoints: string[];
  /** Changes in exploration style, consistency, breadth */
  behaviorChanges: string[];
  /** Full narrative story of the journey */
  growthNarrative: string;
  /** Overall evolution score 0–100 */
  evolutionScore: number;
  computedAt: string;
}

// ============================================================================
// DETECTION HELPERS
// ============================================================================

/**
 * Detect identity shift by comparing the current archetype against
 * behavioral signals that suggest where the user started.
 */
function detectIdentityShift(
  memory: ReturnType<typeof loadJourneyMemory>,
  identity: ReturnType<typeof loadCareerIdentity>
): string {
  if (!identity) return "Your career identity is still forming — continue exploring to build a clearer picture.";

  const themeEntries = Object.entries(memory.repeatedThemes)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const viewCount = Object.keys(memory.viewedCareers).length;
  const comparisonCount = Object.keys(memory.comparedCareerPairs).length;
  const initialSpecialization = memory.specializationDepthHistory[0] ?? 0;
  const currentSpecialization =
    memory.specializationDepthHistory[memory.specializationDepthHistory.length - 1] ??
    initialSpecialization;

  // Low-activity users
  if (viewCount < 3 && memory.completedQuizzes < 2) {
    return "You're in the early stages of defining your career identity. Each quiz and career view adds clarity.";
  }

  // Detect specialization deepening
  if (currentSpecialization > initialSpecialization + 0.15 && themeEntries.length >= 2) {
    const topTheme = themeEntries[0][0];
    return `You've evolved from broad exploration to a more focused ${topTheme}-oriented identity. Your career archetype is now "${identity.identityTitle}" — a shift from a more generalized starting point.`;
  }

  // Detect broadening
  if (currentSpecialization < initialSpecialization - 0.1 && viewCount >= 8) {
    return `Your identity has broadened as you've explored ${viewCount} careers across diverse fields. You're now identified as a "${identity.identityTitle}" — reflecting a more expansive career perspective than when you started.`;
  }

  // Detect consistent path
  if (memory.completedQuizzes >= 3) {
    return `Your career identity has crystallized around "${identity.identityTitle}" as you've deepened your self-awareness through ${memory.completedQuizzes} quiz sessions and ${comparisonCount} career comparisons.`;
  }

  return `You've developed a "${identity.identityTitle}" identity based on your exploration patterns and growing self-awareness.`;
}

/**
 * Compute confidence growth from early sessions to now.
 */
function detectConfidenceGrowth(
  memory: ReturnType<typeof loadJourneyMemory>
): number {
  const history = memory.confidenceHistory;
  if (history.length < 2) return 0;

  // Early: average of first 2 entries
  const earlyAvg = (history[0] + (history[1] ?? history[0])) / 2;
  // Recent: average of last 2 entries
  const recent = history.slice(-2);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

  return Math.round((recentAvg - earlyAvg) * 10) / 10;
}

/**
 * Detect how interests and themes have evolved.
 */
function detectInterestEvolution(
  memory: ReturnType<typeof loadJourneyMemory>,
  analytics: ReturnType<typeof getGrowthAnalytics>
): string[] {
  const signals: string[] = [];
  const themeEntries = Object.entries(memory.repeatedThemes)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const viewCount = Object.keys(memory.viewedCareers).length;
  const catCount = Object.keys(memory.favoriteCategories).length;

  // Theme dominance
  if (themeEntries.length >= 2) {
    const top = themeEntries[0];
    const second = themeEntries[1];
    const ratio = top[1] / Math.max(1, second[1]);

    if (ratio >= 3 && top[1] >= 3) {
      signals.push(`Your interest in "${top[0]}" has become dominant — ${top[1]} interactions compared to ${second[1]} for "${second[0]}". This suggests a clear thematic preference emerging.`);
    } else {
      signals.push(`You maintain balanced interest across ${themeEntries.length} themes, with "${top[0]}" and "${second[0]}" leading your exploration.`);
    }
  }

  // Exploration breadth growth
  if (viewCount >= 10 && catCount >= 3) {
    signals.push(`Your career exploration has expanded to ${viewCount} careers across ${catCount} categories — a broad foundation for making informed decisions.`);
  } else if (viewCount >= 5) {
    signals.push(`You've explored ${viewCount} careers so far, building awareness across ${Math.max(1, catCount)} categories.`);
  }

  // AI interest evolution
  const aiSignal = memory.aiInterestSignals;
  const totalAi = aiSignal.careerViews + aiSignal.compareActions + aiSignal.recommendations;
  if (totalAi >= 3) {
    signals.push(`Your engagement with AI-related careers has grown (${totalAi} signals), indicating an emerging interest in AI-augmented or AI-adjacent roles.`);
  }

  // Specialization trend from analytics
  if (analytics.specializationTrend === "deepening") {
    signals.push("Your specialization is deepening — you're moving from broad exploration toward focused expertise in specific career areas.");
  } else if (analytics.specializationTrend === "broadening") {
    signals.push("Your interests are broadening — you're exploring more diverse career options than when you started.");
  }

  return signals;
}

/**
 * Identify key milestone moments from the user's journey.
 */
function detectMilestoneMoments(
  memory: ReturnType<typeof loadJourneyMemory>,
  achievements: ReturnType<typeof loadAchievements>,
  identity: ReturnType<typeof loadCareerIdentity>
): MilestoneMoment[] {
  const moments: MilestoneMoment[] = [];

  // First quiz
  if (memory.quizDates.length > 0) {
    moments.push({
      type: "first_quiz",
      label: "First Career Quiz",
      detail: `Completed your first career cognition quiz with ${memory.confidenceHistory[0] ?? "?"}% confidence.`,
      date: memory.quizDates[0],
      icon: "📝",
    });
  }

  // First comparison
  if (memory.comparisonHistory.length > 0) {
    moments.push({
      type: "first_comparison",
      label: "First Career Comparison",
      detail: `Compared ${memory.comparisonHistory[0].careerA} vs ${memory.comparisonHistory[0].careerB} to evaluate fit.`,
      date: memory.comparisonHistory[0].timestamp,
      icon: "⚖️",
    });
  }

  // First achievement
  if (achievements && achievements.unlockedAchievements.length > 0) {
    const first = achievements.unlockedAchievements[0];
    moments.push({
      type: "first_achievement",
      label: first.title,
      detail: first.description,
      date: first.unlockedAt ?? memory.createdAt,
      icon: first.icon,
    });
  }

  // Level progression
  if (achievements && achievements.level >= 2) {
    moments.push({
      type: "level_up",
      label: `Reached Level ${achievements.level}`,
      detail: `Earned ${achievements.xp} XP through quizzes, comparisons, and career exploration.`,
      date: achievements.computedAt,
      icon: "⭐",
    });
  }

  // Identity shift (if identity was ever computed)
  if (identity) {
    moments.push({
      type: "identity_shift",
      label: `Identity Formed: ${identity.identityTitle}`,
      detail: `Career identity crystallized as a "${identity.careerArchetype}" with ${identity.dominantStrengths.length > 0 ? identity.dominantStrengths.slice(0, 2).join(", ") : "emerging"} strengths.`,
      date: identity.computedAt,
      icon: "🎭",
    });
  }

  // Sort by date
  moments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return moments;
}

/**
 * Detect turning points — moments where the trajectory changed.
 */
function detectTurningPoints(
  memory: ReturnType<typeof loadJourneyMemory>,
  analytics: ReturnType<typeof getGrowthAnalytics>
): string[] {
  const points: string[] = [];
  const confHistory = memory.confidenceHistory;

  // Confidence direction flips
  if (confHistory.length >= 4) {
    const mid = Math.floor(confHistory.length / 2);
    const firstHalf = confHistory.slice(0, mid);
    const secondHalf = confHistory.slice(mid);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 10) {
      points.push(`Confidence shifted upward around session ${mid + 1} — from ~${Math.round(firstAvg)}% to ~${Math.round(secondAvg)}%, indicating growing self-awareness.`);
    } else if (secondAvg < firstAvg - 10) {
      points.push(`Confidence moderated after session ${mid + 1} — from ~${Math.round(firstAvg)}% to ~${Math.round(secondAvg)}%, reflecting more nuanced self-assessment.`);
    }
  }

  // Specialization shift
  const specHistory = memory.specializationDepthHistory;
  if (specHistory.length >= 3) {
    const mid = Math.floor(specHistory.length / 2);
    const firstSpecAvg = specHistory.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondSpecAvg = specHistory.slice(mid).reduce((a, b) => a + b, 0) / (specHistory.length - mid);

    if (secondSpecAvg > firstSpecAvg + 0.1) {
      points.push(`Specialization deepened around session ${mid + 1} — your interests converged toward more focused career areas.`);
    } else if (secondSpecAvg < firstSpecAvg - 0.08) {
      points.push(`Exploration broadened around session ${mid + 1} — you expanded into new career categories beyond initial preferences.`);
    }
  }

  // Exploration activity shift
  const viewedHistory = memory.viewedCareerHistory;
  if (viewedHistory.length >= 4) {
    const recent = viewedHistory.slice(-3);
    const early = viewedHistory.slice(0, 3);
    const recentCategories = new Set(recent.map((v) => v.careerId));
    const earlyCategories = new Set(early.map((v) => v.careerId));
    const newCats = [...recentCategories].filter((c) => !earlyCategories.has(c)).length;

    if (newCats >= 2) {
      points.push(`Recent activity shows exploration of ${newCats} new career areas — your interests are expanding beyond initial preferences.`);
    }
  }

  // XP/engagement trend
  if (analytics.xpTrend > 100) {
    points.push(`Strong recent engagement with ${analytics.xpTrend} XP gained — your activity level has accelerated compared to earlier periods.`);
  }

  if (points.length === 0) {
    points.push("Your journey is still in its early stages — turning points will emerge as you continue exploring.");
  }

  return points;
}

/**
 * Detect changes in exploration behavior.
 */
function detectBehaviorChanges(
  memory: ReturnType<typeof loadJourneyMemory>
): string[] {
  const changes: string[] = [];
  const viewCount = Object.keys(memory.viewedCareers).length;
  const comparisonCount = Object.keys(memory.comparedCareerPairs).length;
  const roadmapIds = Object.keys(memory.roadmapInteractions);
  const quizCount = memory.completedQuizzes;

  // Exploration style
  if (viewCount >= 8 && comparisonCount >= 3) {
    changes.push("You've shifted from passive browsing to active comparison — systematically evaluating career options side-by-side.");
  } else if (viewCount >= 5) {
    changes.push("You're building a habit of career exploration — regularly viewing new careers to expand awareness.");
  }

  // Roadmap engagement
  if (roadmapIds.length >= 3) {
    changes.push("Your engagement has progressed from surface-level browsing to deep-diving into career roadmaps and skill requirements.");
  }

  // Quiz consistency
  if (quizCount >= 3) {
    changes.push(`You've completed ${quizCount} quiz sessions — consistent self-assessment shows commitment to understanding your fit.`);
  }

  // Category concentration vs expansion
  const catCount = Object.keys(memory.favoriteCategories).length;
  const viewedPerCategory = viewCount / Math.max(1, catCount);
  if (catCount >= 4 && viewedPerCategory < 3) {
    changes.push("You're sampling broadly across many categories rather than deep-diving into a few — a discovery-oriented exploration style.");
  } else if (catCount <= 2 && viewCount >= 6) {
    changes.push("You're concentrating exploration within specific categories — a focused approach that accelerates specialization.");
  }

  if (changes.length === 0) {
    changes.push("Your exploration patterns are still developing. Continue engaging with careers and quizzes to reveal your style.");
  }

  return changes;
}

/**
 * Build a narrative growth story from all detected signals.
 */
function buildGrowthNarrative(
  identityShift: string,
  confidenceGrowth: number,
  interestEvolution: string[],
  turningPoints: string[],
  behaviorChanges: string[],
  milestoneMoments: MilestoneMoment[],
  memory: ReturnType<typeof loadJourneyMemory>,
  achievements: ReturnType<typeof loadAchievements>
): string {
  const parts: string[] = [];
  const quizCount = memory.completedQuizzes;
  const viewCount = Object.keys(memory.viewedCareers).length;
  const totalXp = achievements?.xp ?? 0;
  const level = achievements?.level ?? 1;

  // Opening
  if (quizCount === 0 && viewCount === 0) {
    return "Your career journey has just begun. As you explore careers, complete quizzes, and compare options, your personal evolution story will unfold here.";
  }

  // Stage 1: Beginning
  if (quizCount > 0) {
    parts.push(`Your journey started with a career cognition quiz, establishing a baseline of how you think about your fit. Since then, you've built ${totalXp} XP of career intelligence across ${quizCount} sessions.`);
  } else {
    parts.push(`You began by exploring careers, viewing ${viewCount} different paths to understand what's available.`);
  }

  // Stage 2: Growth
  if (confidenceGrowth > 5) {
    parts.push(`Your confidence has grown by ${confidenceGrowth} points — a sign that your self-assessment is becoming more refined and decisive.`);
  } else if (confidenceGrowth < -5) {
    parts.push(`Your confidence has moderated by ${Math.abs(confidenceGrowth)} points — this reflects a more nuanced, realistic understanding of career fit.`);
  } else if (quizCount >= 3) {
    parts.push(`Your confidence has remained steady across sessions, showing consistent self-awareness as you explore.`);
  }

  // Stage 3: Key insights
  if (interestEvolution.length > 0) {
    parts.push(interestEvolution[0]);
  }

  if (turningPoints.length > 0 && !turningPoints[0].includes("early stages")) {
    parts.push(turningPoints[0]);
  }

  // Stage 4: Current state
  const latestAchievement = achievements?.unlockedAchievements.filter((a) => a.unlocked).pop();
  if (latestAchievement) {
    parts.push(`Most recently, you unlocked "${latestAchievement.title}" — ${latestAchievement.description.toLowerCase()}.`);
  }

  if (level >= 2) {
    parts.push(`You've reached Level ${level}, reflecting meaningful engagement with your career exploration journey.`);
  }

  // Closing
  if (milestoneMoments.length >= 3) {
    parts.push(`With ${milestoneMoments.length} key milestones behind you, your career evolution story continues to build with each session.`);
  }

  return parts.join(" ");
}

/**
 * Compute an overall evolution score (0–100).
 */
function computeEvolutionScore(
  confidenceGrowth: number,
  memory: ReturnType<typeof loadJourneyMemory>,
  analytics: ReturnType<typeof getGrowthAnalytics>,
  achievements: ReturnType<typeof loadAchievements>,
  milestoneMoments: MilestoneMoment[]
): number {
  let score = 0;

  // Confidence trajectory (0–25 points)
  if (memory.confidenceHistory.length >= 3) {
    score += Math.max(0, Math.min(25, 12.5 + confidenceGrowth));
  } else if (memory.confidenceHistory.length >= 1) {
    score += 5;
  }

  // Exploration breadth (0–25 points)
  const viewCount = Object.keys(memory.viewedCareers).length;
  const comparisonCount = Object.keys(memory.comparedCareerPairs).length;
  score += Math.min(15, viewCount * 2.5);
  score += Math.min(10, comparisonCount * 3);

  // Milestone achievement (0–25 points)
  score += Math.min(25, milestoneMoments.length * 6);

  // Level & XP (0–25 points)
  if (achievements) {
    score += Math.min(15, achievements.level * 3);
    score += Math.min(10, Math.floor(achievements.xp / 200) * 2);
  }

  // Specialization clarity (0–10 bonus)
  const specHistory = memory.specializationDepthHistory;
  if (specHistory.length >= 3) {
    const latest = specHistory.slice(-2);
    const trend = latest[1] - latest[0];
    if (trend > 0.02) score += 5;
    else if (Math.abs(trend) <= 0.02) score += 3;
  }

  // Clamp to 0–100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full personal evolution data from all available sources.
 */
export function computePersonalEvolution(): PersonalEvolutionData {
  const memory = loadJourneyMemory();
  const achievements = loadAchievements() ?? computeAchievements();
  const identity = loadCareerIdentity() ?? computeCareerIdentity();
  const analytics = getGrowthAnalytics();

  const identityShift = detectIdentityShift(memory, identity);
  const confidenceGrowth = detectConfidenceGrowth(memory);
  const interestEvolution = detectInterestEvolution(memory, analytics);
  const milestoneMoments = detectMilestoneMoments(memory, achievements, identity);
  const turningPoints = detectTurningPoints(memory, analytics);
  const behaviorChanges = detectBehaviorChanges(memory);
  const growthNarrative = buildGrowthNarrative(
    identityShift,
    confidenceGrowth,
    interestEvolution,
    turningPoints,
    behaviorChanges,
    milestoneMoments,
    memory,
    achievements
  );
  const evolutionScore = computeEvolutionScore(
    confidenceGrowth,
    memory,
    analytics,
    achievements,
    milestoneMoments
  );

  const result: PersonalEvolutionData = {
    identityShift,
    confidenceGrowth,
    interestEvolution,
    milestoneMoments,
    turningPoints,
    behaviorChanges,
    growthNarrative,
    evolutionScore,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

/**
 * Load previously computed personal evolution from storage.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadPersonalEvolution(): PersonalEvolutionData | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<PersonalEvolutionData>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  return cached;
}

/**
 * Get personal evolution, computing fresh if needed.
 */
export function getPersonalEvolution(): PersonalEvolutionData {
  const existing = loadPersonalEvolution();
  if (existing) return existing;
  return computePersonalEvolution();
}
