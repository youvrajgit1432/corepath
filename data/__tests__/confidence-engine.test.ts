import { describe, it, expect } from "vitest";
import {
  generateConfidenceMetrics,
  getConfidenceSummary,
  getTopConfidenceSignals,
  getTopUncertaintySignals,
  buildConfidenceInsights,
} from "../confidence-engine";
import type { JourneyMemory } from "../journey-memory";
import type { EnhancedProfile } from "../quiz-enhanced";

function makeJourney(overrides: Partial<JourneyMemory> = {}): JourneyMemory {
  return {
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
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
      systems: 0, ai: 0, research: 0, product: 0, design: 0,
      data: 0, ops: 0, governance: 0, infrastructure: 0,
    },
    ...overrides,
  };
}

describe("generateConfidenceMetrics", () => {
  it("returns 'emerging' confidence for zero-quiz journey", () => {
    const journey = makeJourney();
    const metrics = generateConfidenceMetrics(journey);

    expect(metrics.confidenceLevel).toBe("emerging");
    expect(metrics.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(metrics.confidenceScore).toBeLessThanOrEqual(1);
    expect(Array.isArray(metrics.signals)).toBe(true);
    expect(metrics.signals.length).toBeGreaterThan(0);
  });

  it("returns confidence metrics for a single quiz session", () => {
    const journey = makeJourney({
      completedQuizzes: 1,
      confidenceHistory: [65],
      specializationDepthHistory: [0.15],
      recommendedCareers: { "ai-engineer": 1 },
    });
    const metrics = generateConfidenceMetrics(journey);

    expect(metrics.confidenceLevel).toBeTruthy();
    expect(metrics.explorationStatus).toBeTruthy();
    expect(metrics.profileMaturity).toBeTruthy();
    expect(metrics.trendDirection).toBeTruthy();
    expect(metrics.nextSteps.length).toBeGreaterThan(0);
  });

  it("returns 'high' confidence for consistent multi-session profiles", () => {
    const journey = makeJourney({
      completedQuizzes: 3,
      confidenceHistory: [70, 75, 78],
      specializationDepthHistory: [0.2, 0.3, 0.4],
      recommendedCareers: { "ai-engineer": 3 },
      viewedCareers: { "ai-engineer": 5, "ml-engineer": 3, "data-scientist": 2 },
      repeatedThemes: {
        systems: 0, ai: 8, research: 5, product: 1, design: 0,
        data: 4, ops: 0, governance: 0, infrastructure: 0,
      },
    });
    const metrics = generateConfidenceMetrics(journey);

    // Should be high or medium given the consistent signals
    expect(["high", "medium"]).toContain(metrics.confidenceLevel);
    expect(metrics.confidenceScore).toBeGreaterThan(0.5);
  });

  it("detects low confidence for contradictory profiles", () => {
    const journey = makeJourney({
      completedQuizzes: 3,
      confidenceHistory: [30, 45, 40],
      specializationDepthHistory: [0.1, 0.15, 0.12],
      recommendedCareers: { "career-a": 1, "career-b": 1, "career-c": 1 },
      viewedCareers: { "a": 1, "b": 1, "c": 1, "d": 1, "e": 1, "f": 1 },
      uncertaintyPatterns: { retakes: 3, lowConfidenceMatches: 2, repeatQuizSessions: 2 },
      repeatedThemes: {
        systems: 1, ai: 1, research: 1, product: 1, design: 1,
        data: 1, ops: 1, governance: 1, infrastructure: 1,
      },
    });
    // Add contradictions to profile
    const profile: EnhancedProfile = {
      extended: {} as any,
      confidence: 30,
      contradictions: [
        { pair: ["stability-preference", "risk-tolerance"], vals: [0.8, 0.7] },
        { pair: ["deep-work", "execution-speed"], vals: [0.7, 0.6] },
        { pair: ["experimentation", "stability-preference"], vals: [0.6, 0.7] },
      ],
      specializationDepth: 0.1,
      narrative: [],
      recommendations: [],
    };

    const metrics = generateConfidenceMetrics(journey, profile);
    // Should have some uncertainty
    expect(metrics.uncertaintyLevel).toBeTruthy();
  });

  it("generates proper narratives for each category", () => {
    const journey = makeJourney({
      completedQuizzes: 2,
      confidenceHistory: [60, 65],
      specializationDepthHistory: [0.2, 0.25],
      recommendedCareers: { "ai-engineer": 2 },
      viewedCareers: { "ai-engineer": 3, "ml-engineer": 2 },
    });
    const metrics = generateConfidenceMetrics(journey);

    expect(typeof metrics.confidenceNarrative).toBe("string");
    expect(metrics.confidenceNarrative.length).toBeGreaterThan(0);
    expect(typeof metrics.uncertaintyNarrative).toBe("string");
    expect(metrics.uncertaintyNarrative.length).toBeGreaterThan(0);
    expect(typeof metrics.explorationNarrative).toBe("string");
    expect(metrics.explorationNarrative.length).toBeGreaterThan(0);
    expect(typeof metrics.recommendationNarrative).toBe("string");
    expect(metrics.recommendationNarrative.length).toBeGreaterThan(0);
    expect(typeof metrics.evolutionNarrative).toBe("string");
    expect(metrics.evolutionNarrative.length).toBeGreaterThan(0);
  });

  it("provides next steps for exploring status", () => {
    const journey = makeJourney({
      completedQuizzes: 1,
      confidenceHistory: [55],
      viewedCareers: { "a": 1, "b": 1 },
    });
    const metrics = generateConfidenceMetrics(journey);

    expect(Array.isArray(metrics.nextSteps)).toBe(true);
    expect(metrics.nextSteps.length).toBeGreaterThan(0);
  });

  it("handles null profile gracefully", () => {
    const journey = makeJourney({ completedQuizzes: 1 });
    const metrics = generateConfidenceMetrics(journey, null);

    expect(metrics.confidenceLevel).toBeTruthy();
    expect(metrics.uncertaintyLevel).toBeTruthy();
  });

  it("returns deterministic results for the same inputs", () => {
    const journey = makeJourney({
      completedQuizzes: 2,
      confidenceHistory: [60, 65],
      specializationDepthHistory: [0.2, 0.3],
      recommendedCareers: { "data-engineer": 2 },
      viewedCareers: { "data-engineer": 4, "ml-engineer": 2 },
      comparedCareerPairs: { "a|b": 2 },
      repeatedThemes: {
        systems: 0, ai: 3, research: 2, product: 0, design: 0,
        data: 5, ops: 0, governance: 0, infrastructure: 1,
      },
    });

    const m1 = generateConfidenceMetrics(journey);
    const m2 = generateConfidenceMetrics(journey);

    expect(m1.confidenceScore).toBe(m2.confidenceScore);
    expect(m1.uncertaintyScore).toBe(m2.uncertaintyScore);
    expect(m1.confidenceLevel).toBe(m2.confidenceLevel);
    expect(m1.explorationStatus).toBe(m2.explorationStatus);
    expect(m1.recommendationStability).toBe(m2.recommendationStability);
  });
});

describe("getConfidenceSummary", () => {
  it("returns a formatted summary string", () => {
    const journey = makeJourney({ completedQuizzes: 1, confidenceHistory: [60] });
    const metrics = generateConfidenceMetrics(journey);
    const summary = getConfidenceSummary(metrics);

    expect(typeof summary).toBe("string");
    expect(summary).toContain("Confidence");
    expect(summary).toContain("Exploring");
  });
});

describe("getTopConfidenceSignals", () => {
  it("returns positive signals up to the requested count", () => {
    const journey = makeJourney({ completedQuizzes: 1 });
    const metrics = generateConfidenceMetrics(journey);
    const top = getTopConfidenceSignals(metrics, 2);

    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeLessThanOrEqual(2);
    top.forEach((s) => {
      expect(s).toHaveProperty("signal");
      expect(s).toHaveProperty("impact");
      expect(s).toHaveProperty("explanation");
    });
  });
});

describe("getTopUncertaintySignals", () => {
  it("returns negative signals", () => {
    const journey = makeJourney({ completedQuizzes: 0 });
    const metrics = generateConfidenceMetrics(journey);
    const uncertain = getTopUncertaintySignals(metrics, 1);

    expect(Array.isArray(uncertain)).toBe(true);
  });
});

describe("buildConfidenceInsights (legacy)", () => {
  it("returns legacy format", () => {
    const journey = makeJourney({ completedQuizzes: 1 });
    const insights = buildConfidenceInsights(journey);

    expect(insights).toHaveProperty("confidenceLevel");
    expect(insights).toHaveProperty("uncertaintyLevel");
    expect(insights).toHaveProperty("explorationStatus");
    expect(insights).toHaveProperty("recommendationStability");
    expect(insights).toHaveProperty("profileMaturity");
    expect(insights).toHaveProperty("trendConfidence");
  });
});
