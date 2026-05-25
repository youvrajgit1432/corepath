import { describe, it, expect, beforeEach } from "vitest";
import {
  loadJourneyMemory,
  recordJourneyEvent,
  buildJourneyProfile,
  clearJourneyMemory,
} from "../journey-memory";
import type { JourneyMemory } from "../journey-memory";

describe("loadJourneyMemory", () => {
  beforeEach(() => {
    // Clear stored memory between tests
    clearJourneyMemory();
  });

  it("returns initial memory when nothing is stored", () => {
    const memory = loadJourneyMemory();
    expect(memory.completedQuizzes).toBe(0);
    expect(memory.quizDates).toEqual([]);
    expect(memory.confidenceHistory).toEqual([]);
    expect(memory.specializationDepthHistory).toEqual([]);
    expect(memory.recommendedCareers).toEqual({});
    expect(memory.viewedCareers).toEqual({});
  });

  it("returns persistent memory after recording events", () => {
    const m1 = recordJourneyEvent({
      type: "quizCompleted",
      careerId: "ai-engineer",
      careerCategory: "Software Engineering",
      careerTags: ["ai", "ml"],
      confidence: 70,
      specializationDepth: 0.3,
      aiInterest: true,
    });

    const m2 = loadJourneyMemory();
    expect(m2.completedQuizzes).toBe(m1.completedQuizzes);
    expect(m2.confidenceHistory).toEqual(m1.confidenceHistory);
  });
});

describe("recordJourneyEvent", () => {
  beforeEach(() => {
    clearJourneyMemory();
  });

  it("records quizCompleted event", () => {
    const memory = recordJourneyEvent({
      type: "quizCompleted",
      careerId: "data-scientist",
      careerCategory: "AI & Data",
      careerTags: ["data", "ml"],
      confidence: 75,
      specializationDepth: 0.4,
      aiInterest: true,
    });

    expect(memory.completedQuizzes).toBe(1);
    expect(memory.quizDates).toHaveLength(1);
    expect(memory.confidenceHistory).toEqual([75]);
    expect(memory.specializationDepthHistory).toEqual([0.4]);
    expect(memory.recommendedCareers["data-scientist"]).toBe(1);
  });

  it("records careerViewed event", () => {
    const memory = recordJourneyEvent({
      type: "careerViewed",
      careerId: "ai-engineer",
      careerCategory: "Software Engineering",
      careerTags: ["ai", "architecture"],
      hasRoadmap: true,
    });

    expect(memory.viewedCareers["ai-engineer"]).toBe(1);
    expect(memory.roadmapInteractions["ai-engineer"]).toBeDefined();
    expect(memory.roadmapInteractions["ai-engineer"].view).toBe(1);
  });

  it("records careerCompared event", () => {
    const memory = recordJourneyEvent({
      type: "careerCompared",
      careerA: "ai-engineer",
      careerB: "ml-engineer",
      categoryA: "Software Engineering",
      categoryB: "Software Engineering",
      tagsA: ["ai", "architecture"],
      tagsB: ["ai", "ml"],
      aiRelated: true,
    });

    const key = "ai-engineer|ml-engineer";
    expect(memory.comparedCareerPairs[key]).toBe(1);
    expect(memory.aiInterestSignals.compareActions).toBe(1);
  });

  it("records roadmapInteraction event", () => {
    const memory = recordJourneyEvent({
      type: "roadmapInteraction",
      careerId: "ai-engineer",
      interaction: "start",
    });

    expect(memory.roadmapInteractions["ai-engineer"]).toBeDefined();
    expect(memory.roadmapInteractions["ai-engineer"].start).toBe(1);
  });

  it("increments quiz counts on repeated completions", () => {
    const ev = {
      type: "quizCompleted" as const,
      careerId: "data-scientist",
      careerCategory: "AI & Data",
      careerTags: ["data", "ml"],
      confidence: 80,
      specializationDepth: 0.5,
      aiInterest: false,
    };

    const m1 = recordJourneyEvent(ev);
    expect(m1.completedQuizzes).toBe(1);

    const m2 = recordJourneyEvent(ev);
    expect(m2.completedQuizzes).toBe(2);
    expect(m2.quizDates).toHaveLength(2);
    expect(m2.confidenceHistory).toEqual([80, 80]);
  });

  it("tracks low confidence matches", () => {
    const memory = recordJourneyEvent({
      type: "quizCompleted",
      careerId: "some-career",
      careerCategory: "General",
      careerTags: [],
      confidence: 30,
      specializationDepth: 0.1,
      aiInterest: false,
    });

    expect(memory.uncertaintyPatterns.lowConfidenceMatches).toBe(1);
  });
});

describe("buildJourneyProfile", () => {
  beforeEach(() => {
    clearJourneyMemory();
  });

  it("returns a profile with all required fields", () => {
    const memory = loadJourneyMemory();
    const profile = buildJourneyProfile(memory);

    expect(profile).toHaveProperty("sessions");
    expect(profile).toHaveProperty("careerInterestProfile");
    expect(profile).toHaveProperty("evolvingSpecializationSignals");
    expect(profile).toHaveProperty("confidenceTrends");
    expect(profile).toHaveProperty("curiosityPatterns");
    expect(profile).toHaveProperty("recommendationAdjustments");
    expect(profile).toHaveProperty("recentChanges");
    expect(profile).toHaveProperty("topThemes");
    expect(profile).toHaveProperty("favoriteCategories");
  });

  it("includes career interest signals after exploration", () => {
    recordJourneyEvent({
      type: "quizCompleted",
      careerId: "ai-engineer",
      careerCategory: "Software Engineering",
      careerTags: ["ai", "systems"],
      confidence: 70,
      specializationDepth: 0.3,
      aiInterest: true,
    });

    const memory = loadJourneyMemory();
    const profile = buildJourneyProfile(memory);

    expect(profile.sessions).toBe(1);
    expect(Array.isArray(profile.careerInterestProfile)).toBe(true);
  });

  it("shows specialization trend after multiple sessions", () => {
    recordJourneyEvent({
      type: "quizCompleted",
      careerId: "ai-engineer",
      careerCategory: "Software Engineering",
      careerTags: ["ai", "systems"],
      confidence: 60,
      specializationDepth: 0.2,
      aiInterest: false,
    });

    recordJourneyEvent({
      type: "quizCompleted",
      careerId: "ai-engineer",
      careerCategory: "Software Engineering",
      careerTags: ["ai", "systems"],
      confidence: 75,
      specializationDepth: 0.4,
      aiInterest: false,
    });

    const memory = loadJourneyMemory();
    const profile = buildJourneyProfile(memory);

    expect(profile.sessions).toBe(2);
    expect(profile.confidenceTrends.length).toBeGreaterThan(0);
  });
});

describe("clearJourneyMemory", () => {
  it("resets memory to initial state", () => {
    recordJourneyEvent({
      type: "quizCompleted",
      careerId: "test",
      careerCategory: "Test",
      careerTags: [],
      confidence: 50,
      specializationDepth: 0.2,
      aiInterest: false,
    });

    clearJourneyMemory();

    const memory = loadJourneyMemory();
    expect(memory.completedQuizzes).toBe(0);
    expect(memory.quizDates).toEqual([]);
  });
});

describe("event determinism", () => {
  beforeEach(() => {
    clearJourneyMemory();
  });

  it("produces same result for same sequence of events", () => {
    const events = [
      {
        type: "careerViewed" as const,
        careerId: "c1",
        careerCategory: "Engineering",
        careerTags: ["systems"],
        hasRoadmap: false,
      },
      {
        type: "quizCompleted" as const,
        careerId: "c1",
        careerCategory: "Engineering",
        careerTags: ["systems"],
        confidence: 65,
        specializationDepth: 0.3,
        aiInterest: true,
      },
    ];

    for (const ev of events) {
      recordJourneyEvent(ev);
    }

    const memory1 = loadJourneyMemory();
    const memory2 = loadJourneyMemory();

    expect(memory1.completedQuizzes).toBe(memory2.completedQuizzes);
    expect(memory1.viewedCareers).toEqual(memory2.viewedCareers);
    expect(memory1.confidenceHistory).toEqual(memory2.confidenceHistory);
  });
});
