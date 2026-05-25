/**
 * JOURNEY REPLAY INTELLIGENCE
 *
 * Transforms existing journey history into a replayable timeline of
 * major milestones, turning points, and identity shifts.
 *
 * Sources: journey-memory, quiz-history, comparison-history,
 *          achievement-engine, career-workspace
 *
 * No backend. No auth. Persists nothing — always computed from current data.
 */

import { loadJourneyMemory } from "./journey-memory";
import { loadQuizHistory } from "./quiz-history";
import { loadComparisonHistory } from "./comparison-history";
import { computeAchievements } from "./achievement-engine";
import { loadCareerWorkspace } from "./career-workspace";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type JourneyReplayItemType =
  | "first-quiz"
  | "quiz-milestone"
  | "career-first-viewed"
  | "comparison-turning-point"
  | "achievement-unlocked"
  | "workspace-milestone"
  | "streak-milestone"
  | "identity-shift"
  | "specialization-change";

export interface JourneyReplayItem {
  id: string;
  type: JourneyReplayItemType;
  timestamp: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
  label?: string;
}

export interface JourneyReplayData {
  items: JourneyReplayItem[];
  majorMilestones: JourneyReplayItem[];
  careerTurningPoints: JourneyReplayItem[];
  firstQuizDate: string | null;
  identityEvolution: JourneyReplayItem[];
  careerSwitchMoments: JourneyReplayItem[];
  learningMomentumEvents: JourneyReplayItem[];
}

// ============================================================================
// RELATIVE TIME FORMATTING
// ============================================================================

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "just now";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatItemDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// TIMELINE CONSTRUCTION
// ============================================================================

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `replay-${Date.now()}-${idCounter}`;
}

function buildQuizItems(): JourneyReplayItem[] {
  const items: JourneyReplayItem[] = [];
  const memory = loadJourneyMemory();

  // First quiz
  if (memory.quizDates.length > 0) {
    items.push({
      id: nextId(),
      type: "first-quiz",
      timestamp: memory.quizDates[0],
      title: "First Career Quiz",
      description: "Completed your first career cognition quiz and discovered your thinking profile.",
      icon: "📝",
      href: "/quiz",
      label: "View quizzes",
    });
  }

  // Quiz milestones (every 5)
  if (memory.completedQuizzes >= 5) {
    const milestones = [5, 10, 15, 20].filter((n) => memory.completedQuizzes >= n);
    for (const m of milestones) {
      const idx = Math.min(m - 1, memory.quizDates.length - 1);
      items.push({
        id: nextId(),
        type: "quiz-milestone",
        timestamp: memory.quizDates[idx],
        title: `${m} Quizzes Completed`,
        description: `Reached ${m} career cognition quizzes, building a clearer profile with each one.`,
        icon: "🎯",
        href: "/quiz",
        label: "See history",
      });
    }
  }

  return items;
}

function buildCareerViewItems(): JourneyReplayItem[] {
  const items: JourneyReplayItem[] = [];
  const memory = loadJourneyMemory();

  // First career view
  if (memory.viewedCareerHistory.length > 0) {
    const firstView = memory.viewedCareerHistory[0];
    items.push({
      id: nextId(),
      type: "career-first-viewed",
      timestamp: firstView.timestamp,
      title: "First Career Explored",
      description: `Started exploring careers by viewing ${firstView.careerId.replace(/-/g, " ")}.`,
      icon: "🔍",
      href: `/careers/${firstView.careerId}`,
      label: "View career",
    });
  }

  // Career milestones (10, 25 unique views)
  const uniqueViews = Object.keys(memory.viewedCareers).length;
  const viewMilestones = [10, 25, 50].filter((n) => uniqueViews >= n);
  for (const m of viewMilestones) {
    items.push({
      id: nextId(),
      type: "career-first-viewed",
      timestamp: memory.viewedCareerHistory[Math.min(m - 1, memory.viewedCareerHistory.length - 1)].timestamp,
      title: `${m} Careers Explored`,
      description: `Viewed ${m} different careers to understand your options.`,
      icon: "🗺️",
      href: "/careers",
      label: "Browse careers",
    });
  }

  return items;
}

function buildComparisonItems(): JourneyReplayItem[] {
  const items: JourneyReplayItem[] = [];
  const memory = loadJourneyMemory();

  // First comparison
  if (memory.comparisonHistory.length > 0) {
    const first = memory.comparisonHistory[0];
    items.push({
      id: nextId(),
      type: "comparison-turning-point",
      timestamp: first.timestamp,
      title: "First Career Comparison",
      description: `Compared ${first.careerA.replace(/-/g, " ")} with ${first.careerB.replace(/-/g, " ")} to evaluate your fit.`,
      icon: "⚖️",
      href: "/careers/compare",
      label: "View comparisons",
    });
  }

  // Total comparisons milestone
  const comparisons = Object.keys(memory.comparedCareerPairs).length;
  if (comparisons >= 5) {
    items.push({
      id: nextId(),
      type: "comparison-turning-point",
      timestamp: memory.comparisonHistory[memory.comparisonHistory.length - 1].timestamp,
      title: "Deep Comparer",
      description: `Compared ${comparisons} career pairs — gaining clarity on what differentiates each path.`,
      icon: "🏆",
      href: "/careers/compare",
      label: "See comparisons",
    });
  }

  return items;
}

function buildAchievementItems(): JourneyReplayItem[] {
  const items: JourneyReplayItem[] = [];
  const achievements = computeAchievements();

  // Use achievements.computedAt as the approximate timestamp for all achievement items
  // (achievement-engine doesn't track per-achievement unlock times)
  const achievementTimestamp = achievements.computedAt;

  // Each unlocked achievement
  for (const a of achievements.unlockedAchievements) {
    items.push({
      id: nextId(),
      type: "achievement-unlocked",
      timestamp: achievementTimestamp,
      title: `Achievement: ${a.title}`,
      description: a.description,
      icon: a.icon,
      href: "/",
      label: "View achievements",
    });
  }

  // Level milestones (only when level is notable and we don't have too many items)
  if (achievements.level >= 3 && achievements.unlockedAchievements.length <= 3) {
    items.push({
      id: nextId(),
      type: "achievement-unlocked",
      timestamp: achievementTimestamp,
      title: `Reached Level ${achievements.level}`,
      description: `Earned ${achievements.xp} XP across your career exploration journey.`,
      icon: "⭐",
      href: "/",
      label: "Check progress",
    });
  }

  return items;
}

function buildWorkspaceItems(): JourneyReplayItem[] {
  const items: JourneyReplayItem[] = [];
  const workspace = loadCareerWorkspace();
  if (!workspace) return items;

  // Workspace created
  items.push({
    id: nextId(),
    type: "workspace-milestone",
    timestamp: workspace.createdAt,
    title: "Career Workspace Started",
    description: `Selected ${workspace.selectedCareerTitle} as your target career.`,
    icon: "🚀",
    href: `/careers/${workspace.selectedCareerId}`,
    label: "Open workspace",
  });

  // First milestone completed
  if (workspace.completedMilestones.length > 0) {
    items.push({
      id: nextId(),
      type: "workspace-milestone",
      timestamp: workspace.updatedAt, // approximate
      title: "First Milestone Complete",
      description: `Completed "${workspace.completedMilestones[0]}" in your ${workspace.selectedCareerTitle} journey.`,
      icon: "🎖️",
      href: `/careers/${workspace.selectedCareerId}`,
      label: "View milestones",
    });
  }

  // Multi-milestone milestone
  if (workspace.completedMilestones.length >= 5) {
    items.push({
      id: nextId(),
      type: "workspace-milestone",
      timestamp: workspace.updatedAt,
      title: "Milestone Master",
      description: `Completed ${workspace.completedMilestones.length} milestones toward ${workspace.selectedCareerTitle}.`,
      icon: "🏅",
      href: `/careers/${workspace.selectedCareerId}`,
      label: "See progress",
    });
  }

  return items;
}

function buildStreakItems(): JourneyReplayItem[] {
  const items: JourneyReplayItem[] = [];
  const workspace = loadCareerWorkspace();
  if (!workspace || workspace.streak < 3) return items;

  const streakMilestones = [3, 7, 14, 30, 60].filter((n) => workspace!.streak >= n);

  for (const s of streakMilestones) {
    const labels: Record<number, string> = {
      3: "Streak Starter — 3-day consistency",
      7: "Streak Master — one full week",
      14: "Dedicated — two weeks strong",
      30: "Unstoppable — one month!",
      60: "Legendary — two months!",
    };
    items.push({
      id: nextId(),
      type: "streak-milestone",
      timestamp: workspace.lastProgressDate,
      title: labels[s] ?? `${s}-Day Streak`,
      description: `Maintained a ${s}-day streak of consistent career progress.`,
      icon: s >= 14 ? "⚡" : s >= 7 ? "💪" : "🔥",
      href: `/careers/${workspace.selectedCareerId}`,
      label: "Log progress",
    });
  }

  return items;
}

function buildIdentityItems(): JourneyReplayItem[] {
  const items: JourneyReplayItem[] = [];
  const memory = loadJourneyMemory();

  // Identify theme shifts from repeatedThemes
  const themes = Object.entries(memory.repeatedThemes)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (themes.length > 0) {
    const topTheme = themes[0][0];
    const themeLabels: Record<string, string> = {
      systems: "systems thinker",
      ai: "AI explorer",
      research: "research-oriented",
      product: "product-minded",
      design: "design-driven",
      data: "data-focused",
      ops: "operations-oriented",
      governance: "governance-aware",
      infrastructure: "infrastructure-minded",
    };

    const label = themeLabels[topTheme] ?? "career explorer";

    // Use the last quiz date as approximate identity timestamp
    const lastQuizDate = memory.quizDates[memory.quizDates.length - 1];
    if (lastQuizDate) {
      items.push({
        id: nextId(),
        type: "identity-shift",
        timestamp: lastQuizDate,
        title: "Career Identity Emerging",
        description: `Your journey shows a pattern of a ${label} — ${themes[0][1]} interactions across this theme.`,
        icon: "🧭",
        href: "/",
        label: "View profile",
      });
    }
  }

  // Favorite categories signal
  const favCats = Object.entries(memory.favoriteCategories)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  if (favCats.length > 0) {
    const lastDate = memory.updatedAt;
    items.push({
      id: nextId(),
      type: "identity-shift",
      timestamp: lastDate,
      title: "Focus Pattern Detected",
      description: `Strongest exploration zones: ${favCats.map(([c]) => c).join(" and ")}.`,
      icon: "🎯",
      href: "/",
      label: "Explore focus",
    });
  }

  return items;
}

function buildSpecializationItems(): JourneyReplayItem[] {
  const items: JourneyReplayItem[] = [];
  const memory = loadJourneyMemory();

  if (
    memory.specializationDepthHistory.length >= 3 &&
    memory.confidenceHistory.length >= 3
  ) {
    const firstHalf = Math.floor(memory.specializationDepthHistory.length / 2);
    const earlyAvg =
      memory.specializationDepthHistory.slice(0, firstHalf).reduce((a, b) => a + b, 0) /
      Math.max(1, firstHalf);
    const lateAvg =
      memory.specializationDepthHistory.slice(firstHalf).reduce((a, b) => a + b, 0) /
      Math.max(1, memory.specializationDepthHistory.length - firstHalf);

    if (lateAvg - earlyAvg > 15) {
      items.push({
        id: nextId(),
        type: "specialization-change",
        timestamp: memory.quizDates[memory.quizDates.length - 1],
        title: "Deepening Specialization",
        description: "Your quiz profile shows increasing depth — you're narrowing toward a specific career fit.",
        icon: "📈",
        href: "/quiz",
        label: "Review results",
      });
    } else if (earlyAvg - lateAvg > 15) {
      items.push({
        id: nextId(),
        type: "specialization-change",
        timestamp: memory.quizDates[memory.quizDates.length - 1],
        title: "Broadening Exploration",
        description: "You're exploring more broadly, keeping multiple career paths open.",
        icon: "🌊",
        href: "/quiz",
        label: "See trends",
      });
    }
  }

  return items;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Build the full journey replay timeline from all data sources.
 * Always computes fresh — no caching.
 */
export function getJourneyReplay(): JourneyReplayData {
  const allItems: JourneyReplayItem[] = [
    ...buildQuizItems(),
    ...buildCareerViewItems(),
    ...buildComparisonItems(),
    ...buildAchievementItems(),
    ...buildWorkspaceItems(),
    ...buildStreakItems(),
    ...buildIdentityItems(),
    ...buildSpecializationItems(),
  ];

  // Sort chronologically (oldest first for timeline display)
  allItems.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Deduplicate by type + title to avoid duplicates from overlapping signals
  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    const key = `${item.type}-${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Categorize
  const majorMilestones = deduped.filter(
    (i) =>
      i.type === "achievement-unlocked" ||
      i.type === "workspace-milestone" ||
      i.type === "first-quiz" ||
      i.type === "streak-milestone"
  );

  const careerTurningPoints = deduped.filter(
    (i) =>
      i.type === "comparison-turning-point" ||
      i.type === "career-first-viewed" ||
      i.type === "specialization-change"
  );

  const identityEvolution = deduped.filter(
    (i) => i.type === "identity-shift"
  );

  const careerSwitchMoments = deduped.filter(
    (i) => i.type === "career-first-viewed"
  );

  const learningMomentumEvents = deduped.filter(
    (i) =>
      i.type === "streak-milestone" ||
      i.type === "quiz-milestone"
  );

  const firstQuizDate =
    deduped.find((i) => i.type === "first-quiz")?.timestamp ?? null;

  return {
    items: deduped,
    majorMilestones,
    careerTurningPoints,
    firstQuizDate,
    identityEvolution,
    careerSwitchMoments,
    learningMomentumEvents,
  };
}

/**
 * Get a summary count of journey replay items for display in cards.
 */
export function getJourneyReplaySummary(): {
  total: number;
  milestones: number;
  firstDate: string | null;
} {
  const data = getJourneyReplay();
  return {
    total: data.items.length,
    milestones: data.majorMilestones.length,
    firstDate: data.firstQuizDate,
  };
}
