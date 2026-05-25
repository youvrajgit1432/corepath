import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JourneyMemory } from "../journey-memory";
import type { QuizHistoryEntry } from "../quiz-history";
import type { ComparisonRecord } from "../comparison-history";
import type { AchievementState } from "../achievement-engine";
import type { CareerWorkspace } from "../career-workspace";

// ─── Mock all data dependencies ────────────────────────────────────────────

const mockJourneyMemory = vi.hoisted(() => {
  const base: JourneyMemory = {
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-06-01T10:00:00.000Z",
    completedQuizzes: 0,
    quizDates: [],
    confidenceHistory: [],
    specializationDepthHistory: [],
    recommendedCareers: {},
    viewedCareers: {},
    comparedCareerPairs: {},
    comparisonHistory: [],
    viewedCareerHistory: [],
    roadmapInteractions: {},
    favoriteCategories: {},
    aiInterestSignals: { careerViews: 0, compareActions: 0, recommendations: 0 },
    uncertaintyPatterns: { retakes: 0, lowConfidenceMatches: 0, repeatQuizSessions: 0 },
    repeatedThemes: {
      systems: 0, ai: 0, research: 0, product: 0,
      design: 0, data: 0, ops: 0, governance: 0, infrastructure: 0,
    },
  };
  let current = { ...base };
  return {
    __default: base,
    get current() { return current; },
    set current(val) { current = val; },
    reset() { current = { ...base }; },
  };
});

const mockQuizHistory = vi.hoisted(() => {
  let current: QuizHistoryEntry[] = [];
  return {
    get current() { return current; },
    set current(val) { current = val; },
    reset() { current = []; },
  };
});

const mockComparisonHistory = vi.hoisted(() => {
  let current: ComparisonRecord[] = [];
  return {
    get current() { return current; },
    set current(val) { current = val; },
    reset() { current = []; },
  };
});

const mockAchievements = vi.hoisted(() => {
  const base: AchievementState = {
    xp: 0, level: 1,
    unlockedAchievements: [],
    lockedAchievements: [],
    activeStreakBonus: 0,
    nextUnlock: null,
    computedAt: "2025-06-01T10:00:00.000Z",
  };
  let current = { ...base };
  return {
    get current() { return current; },
    set current(val) { current = val; },
    reset() { current = { ...base }; },
  };
});

const mockWorkspace = vi.hoisted(() => {
  const base: CareerWorkspace = {
    selectedCareerId: "software-engineer",
    selectedCareerTitle: "Software Engineer",
    activePhaseName: "Phase 1",
    activePhaseNumber: 1,
    completedMilestones: [],
    completedProjects: [],
    weeklyProgress: [],
    streak: 0,
    lastProgressDate: "",
    estimatedReadiness: 0,
    createdAt: "2025-06-01T10:00:00.000Z",
    updatedAt: "2025-06-01T10:00:00.000Z",
  };
  let current: CareerWorkspace | null = { ...base };
  return {
    get current() { return current; },
    set current(val) { current = val; },
    reset() { current = { ...base }; },
    asNull() { current = null; },
  };
});

vi.mock("../journey-memory", () => ({
  loadJourneyMemory: () => mockJourneyMemory.current,
}));

vi.mock("../quiz-history", () => ({
  loadQuizHistory: () => mockQuizHistory.current,
}));

vi.mock("../comparison-history", () => ({
  loadComparisonHistory: () => mockComparisonHistory.current,
}));

vi.mock("../achievement-engine", () => ({
  computeAchievements: () => mockAchievements.current,
}));

vi.mock("../career-workspace", () => ({
  loadCareerWorkspace: () => mockWorkspace.current,
}));

// ─── Import after mocks ────────────────────────────────────────────────────

import {
  getJourneyReplay,
  getJourneyReplaySummary,
  formatRelativeTime,
  formatItemDate,
} from "../journey-replay";

// ============================================================================
// Tests
// ============================================================================

describe("formatRelativeTime", () => {
  it("returns 'today' for current date", () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe("today");
  });

  it("returns 'yesterday' for 1 day ago", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(yesterday)).toBe("yesterday");
  });

  it("returns days count for under a week", () => {
    const threeDays = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDays)).toBe("3 days ago");
  });

  it("returns weeks count for under a month", () => {
    const twoWeeks = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoWeeks)).toBe("2 weeks ago");
  });

  it("returns months count for under a year", () => {
    const threeMonths = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeMonths)).toBe("3 months ago");
  });

  it("returns years count for over a year", () => {
    const twoYears = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoYears)).toBe("2 years ago");
  });

  it("returns 'just now' for future dates", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    expect(formatRelativeTime(future)).toBe("just now");
  });
});

describe("formatItemDate", () => {
  it("formats a date in short format", () => {
    const result = formatItemDate("2025-06-15T10:00:00.000Z");
    expect(result).toMatch(/Jun 15, 2025/);
  });

  it("handles different months", () => {
    const result = formatItemDate("2025-01-01T00:00:00.000Z");
    expect(result).toMatch(/Jan 1, 2025/);
  });
});

describe("getJourneyReplay", () => {
  beforeEach(() => {
    mockJourneyMemory.reset();
    mockQuizHistory.reset();
    mockComparisonHistory.reset();
    mockAchievements.reset();
    mockWorkspace.reset();
  });

  it("returns empty items when no data exists", () => {
    mockWorkspace.asNull();
    const result = getJourneyReplay();
    expect(result.items).toHaveLength(0);
    expect(result.majorMilestones).toHaveLength(0);
    expect(result.careerTurningPoints).toHaveLength(0);
    expect(result.firstQuizDate).toBeNull();
    expect(result.identityEvolution).toHaveLength(0);
    expect(result.careerSwitchMoments).toHaveLength(0);
    expect(result.learningMomentumEvents).toHaveLength(0);
  });

  it("creates a first-quiz item when quizzes exist", () => {
    mockJourneyMemory.current = {
      ...mockJourneyMemory.current,
      completedQuizzes: 1,
      quizDates: ["2025-03-10T10:00:00.000Z"],
    };

    const result = getJourneyReplay();
    const quizItems = result.items.filter((i) => i.type === "first-quiz");
    expect(quizItems).toHaveLength(1);
    expect(quizItems[0].title).toBe("First Career Quiz");
    expect(quizItems[0].href).toBe("/quiz");
    expect(result.firstQuizDate).toBe("2025-03-10T10:00:00.000Z");
  });

  it("creates quiz milestone items at 5 and 10 completions", () => {
    const dates = Array.from({ length: 10 }, (_, i) =>
      new Date(2025, 0, 10 + i).toISOString()
    );
    mockJourneyMemory.current = {
      ...mockJourneyMemory.current,
      completedQuizzes: 10,
      quizDates: dates,
    };

    const result = getJourneyReplay();
    const milestones = result.items.filter((i) => i.type === "quiz-milestone");
    expect(milestones).toHaveLength(2);
    expect(milestones[0].title).toContain("5");
    expect(milestones[1].title).toContain("10");
  });

  it("creates career-first-viewed item from history", () => {
    mockJourneyMemory.current = {
      ...mockJourneyMemory.current,
      viewedCareerHistory: [
        { careerId: "software-engineer", timestamp: "2025-04-01T10:00:00.000Z" },
      ],
      viewedCareers: { "software-engineer": 1 },
    };

    const result = getJourneyReplay();
    const views = result.items.filter((i) => i.type === "career-first-viewed");
    expect(views.length).toBeGreaterThanOrEqual(1);
    expect(views[0].title).toContain("First Career Explored");
  });

  it("creates career milestone at 10+ unique views", () => {
    const careers: Record<string, number> = {};
    const history: Array<{ careerId: string; timestamp: string }> = [];
    for (let i = 0; i < 12; i++) {
      const id = `career-${i}`;
      careers[id] = i + 1;
      history.push({ careerId: id, timestamp: new Date(2025, 3, 1 + i).toISOString() });
    }

    mockJourneyMemory.current = {
      ...mockJourneyMemory.current,
      viewedCareers: careers,
      viewedCareerHistory: history,
    };

    const result = getJourneyReplay();
    const milestones = result.items.filter((i) => i.title === "10 Careers Explored");
    expect(milestones).toHaveLength(1);
  });

  it("creates comparison items from comparison history", () => {
    mockJourneyMemory.current = {
      ...mockJourneyMemory.current,
      comparisonHistory: [
        {
          careerA: "software-engineer",
          careerB: "data-scientist",
          timestamp: "2025-05-01T10:00:00.000Z",
        },
      ],
      comparedCareerPairs: { "software-engineer|data-scientist": 1 },
    };

    const result = getJourneyReplay();
    const comparisons = result.items.filter((i) => i.type === "comparison-turning-point");
    expect(comparisons.length).toBeGreaterThanOrEqual(1);
  });

  it("creates workspace items when workspace exists", () => {
    mockWorkspace.current = {
      ...mockWorkspace.current!,
      selectedCareerTitle: "Software Engineer",
      streak: 0,
      completedMilestones: [],
      createdAt: "2025-06-01T10:00:00.000Z",
      updatedAt: "2025-06-01T10:00:00.000Z",
    };

    const result = getJourneyReplay();
    const workspaceItems = result.items.filter((i) => i.type === "workspace-milestone");
    expect(workspaceItems).toHaveLength(1);
    expect(workspaceItems[0].title).toBe("Career Workspace Started");
  });

  it("creates streak items when streak >= 3", () => {
    mockWorkspace.current = {
      ...mockWorkspace.current!,
      streak: 7,
      lastProgressDate: "2025-06-07T10:00:00.000Z",
      completedMilestones: [],
    };

    const result = getJourneyReplay();
    const streaks = result.items.filter((i) => i.type === "streak-milestone");
    expect(streaks.length).toBeGreaterThanOrEqual(2); // 3-day and 7-day
    expect(streaks[0].title).toBe("Streak Starter — 3-day consistency");
    expect(streaks[1].title).toBe("Streak Master — one full week");
  });

  it("creates achievement items for unlocked achievements", () => {
    mockAchievements.current = {
      ...mockAchievements.current,
      unlockedAchievements: [
        {
          id: "first-quiz",
          title: "First Quiz",
          description: "Complete your first career cognition quiz",
          icon: "📝",
          unlocked: true,
        },
        {
          id: "explorer",
          title: "Explorer",
          description: "View 10+ careers",
          icon: "🔍",
          unlocked: true,
        },
      ],
      computedAt: "2025-06-01T10:00:00.000Z",
    };

    const result = getJourneyReplay();
    const achievements = result.items.filter((i) => i.type === "achievement-unlocked");
    // First quiz achievement + explorer achievement = 2
    expect(achievements.length).toBeGreaterThanOrEqual(2);
    expect(achievements.some((a) => a.title.includes("First Quiz"))).toBe(true);
    expect(achievements.some((a) => a.title.includes("Explorer"))).toBe(true);
  });

  it("sorts items chronologically", () => {
    mockJourneyMemory.current = {
      ...mockJourneyMemory.current,
      completedQuizzes: 1,
      quizDates: ["2025-05-01T10:00:00.000Z"],
      viewedCareerHistory: [
        { careerId: "software-engineer", timestamp: "2025-03-01T10:00:00.000Z" },
      ],
      viewedCareers: { "software-engineer": 1 },
    };

    const result = getJourneyReplay();
    for (let i = 1; i < result.items.length; i++) {
      const prev = new Date(result.items[i - 1].timestamp).getTime();
      const curr = new Date(result.items[i].timestamp).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it("deduplicates items with same type and title", () => {
    // Two comparisons with same type but different pair → not duplicate
    mockJourneyMemory.current = {
      ...mockJourneyMemory.current,
      comparisonHistory: [
        { careerA: "a", careerB: "b", timestamp: "2025-05-01T10:00:00.000Z" },
        { careerA: "a", careerB: "b", timestamp: "2025-05-02T10:00:00.000Z" },
      ],
      comparedCareerPairs: { "a|b": 2 },
    };

    const result = getJourneyReplay();
    // Both comparisons have same type+title, so only 1 should survive
    const pairs = result.items.filter((i) => i.type === "comparison-turning-point" && i.title === "First Career Comparison");
    expect(pairs).toHaveLength(1);
  });
});

describe("getJourneyReplaySummary", () => {
  beforeEach(() => {
    mockJourneyMemory.reset();
    mockQuizHistory.reset();
    mockComparisonHistory.reset();
    mockAchievements.reset();
    mockWorkspace.reset();
  });

  it("returns zeros when no data exists", () => {
    mockWorkspace.asNull();
    const summary = getJourneyReplaySummary();
    expect(summary.total).toBe(0);
    expect(summary.milestones).toBe(0);
    expect(summary.firstDate).toBeNull();
  });

  it("returns correct counts with data", () => {
    mockJourneyMemory.current = {
      ...mockJourneyMemory.current,
      completedQuizzes: 5,
      quizDates: ["2025-03-10T10:00:00.000Z", "2025-03-15T10:00:00.000Z", "2025-04-01T10:00:00.000Z", "2025-04-10T10:00:00.000Z", "2025-04-20T10:00:00.000Z"],
      viewedCareerHistory: [
        { careerId: "software-engineer", timestamp: "2025-03-12T10:00:00.000Z" },
      ],
      viewedCareers: { "software-engineer": 1 },
    };

    mockWorkspace.current = {
      ...mockWorkspace.current!,
      streak: 0,
      completedMilestones: [],
    };

    const summary = getJourneyReplaySummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.milestones).toBeGreaterThan(0);
    expect(summary.firstDate).toBe("2025-03-10T10:00:00.000Z");
  });
});
