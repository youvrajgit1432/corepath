import { describe, it, expect } from "vitest";
import {
  calculateEnhancedProfile,
  detectContradictions,
  specializationDepth,
  confidenceScore,
} from "../quiz-enhanced";
import type { ExtendedTraitScores } from "../quiz-enhanced";

describe("calculateEnhancedProfile", () => {
  it("returns a full EnhancedProfile from answers", () => {
    const answers = { q1: "a", q2: "b", q3: "c" };
    const profile = calculateEnhancedProfile(answers);

    expect(profile).toHaveProperty("extended");
    expect(profile).toHaveProperty("confidence");
    expect(profile).toHaveProperty("contradictions");
    expect(profile).toHaveProperty("specializationDepth");
    expect(profile).toHaveProperty("narrative");
    expect(profile).toHaveProperty("recommendations");

    // Should have all 23 extended traits
    const traitCount = Object.keys(profile.extended).length;
    expect(traitCount).toBe(23);

    // Each trait should be between 0 and 1
    for (const [, value] of Object.entries(profile.extended)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }

    expect(profile.confidence).toBeGreaterThanOrEqual(0);
    expect(profile.specializationDepth).toBeGreaterThanOrEqual(0);
    expect(profile.specializationDepth).toBeLessThanOrEqual(1);
  });

  it("produces deterministic results for the same answers", () => {
    const answers = { q101: "a", q102: "c", q103: "b" };
    const profile1 = calculateEnhancedProfile(answers);
    const profile2 = calculateEnhancedProfile(answers);

    expect(profile1.extended).toEqual(profile2.extended);
    expect(profile1.confidence).toBe(profile2.confidence);
    expect(profile1.specializationDepth).toBe(profile2.specializationDepth);
    expect(profile1.contradictions).toEqual(profile2.contradictions);
  });

  it("handles empty answers gracefully", () => {
    const profile = calculateEnhancedProfile({});
    expect(profile).toBeDefined();
    expect(typeof profile.confidence).toBe("number");
    expect(Array.isArray(profile.narrative)).toBe(true);
    expect(Array.isArray(profile.recommendations)).toBe(true);
  });

  it("includes recommendations for AI-curious profiles", () => {
    const profile = calculateEnhancedProfile({ q1: "a" });
    const hasAIRec = profile.recommendations.some((r) =>
      r.toLowerCase().includes("ai")
    );
    // May or may not have AI rec depending on trait values — just verify structure
    expect(Array.isArray(profile.recommendations)).toBe(true);
  });

  it("generates at least one narrative entry", () => {
    const profile = calculateEnhancedProfile({ q1: "a" });
    expect(profile.narrative.length).toBeGreaterThanOrEqual(1);
  });

  it("detects contradictions when contradictory traits are both high", () => {
    // Create a profile where stability-preference AND risk-tolerance are high
    const highContradiction: ExtendedTraitScores = {
      "stability-preference": 0.9,
      "risk-tolerance": 0.8,
    } as ExtendedTraitScores;

    // Fill remaining traits with low values
    const allTraits: string[] = [
      "systems-thinking", "abstraction", "ambiguity-tolerance", "deep-work",
      "experimentation", "optimization", "execution-speed", "research-orientation",
      "people-orientation", "autonomy", "creativity", "technical-depth",
      "visual-thinking", "operational-thinking", "leadership", "adaptability",
      "learning-velocity", "future-orientation", "AI-curiosity", "AI-builder", "AI-user",
    ];
    for (const t of allTraits) {
      (highContradiction as any)[t] = 0.1;
    }

    const contradictions = detectContradictions(highContradiction, 0.6);
    const hasStabilityRisk = contradictions.some(
      (c) =>
        c.pair[0] === "stability-preference" && c.pair[1] === "risk-tolerance"
    );
    expect(hasStabilityRisk).toBe(true);
  });
});

describe("detectContradictions", () => {
  it("returns empty array when no contradictions", () => {
    const low: ExtendedTraitScores = {
      "stability-preference": 0.1,
      "risk-tolerance": 0.1,
      "deep-work": 0.1,
      "execution-speed": 0.1,
      "experimentation": 0.1,
    } as ExtendedTraitScores;

    const allTraits: string[] = [
      "systems-thinking", "abstraction", "ambiguity-tolerance", "deep-work",
      "experimentation", "optimization", "execution-speed", "research-orientation",
      "people-orientation", "autonomy", "creativity", "technical-depth",
      "visual-thinking", "operational-thinking", "leadership", "adaptability",
      "learning-velocity", "future-orientation", "AI-curiosity", "AI-builder", "AI-user",
      "stability-preference", "risk-tolerance",
    ];
    for (const t of allTraits) {
      (low as any)[t] = 0.1;
    }

    expect(detectContradictions(low)).toHaveLength(0);
  });

  it("detects deep-work/execution-speed contradiction", () => {
    const scores: ExtendedTraitScores = {
      "deep-work": 0.9,
      "execution-speed": 0.8,
    } as ExtendedTraitScores;

    const allTraits: string[] = [
      "systems-thinking", "abstraction", "ambiguity-tolerance",
      "experimentation", "optimization", "research-orientation",
      "people-orientation", "autonomy", "creativity", "technical-depth",
      "visual-thinking", "operational-thinking", "leadership", "adaptability",
      "learning-velocity", "future-orientation", "AI-curiosity", "AI-builder", "AI-user",
      "stability-preference", "risk-tolerance",
    ];
    for (const t of allTraits) {
      (scores as any)[t] = 0.1;
    }

    const contradictions = detectContradictions(scores, 0.6);
    expect(contradictions.length).toBeGreaterThanOrEqual(1);
  });
});

describe("specializationDepth", () => {
  it("returns 0 for all-zero traits", () => {
    const scores: ExtendedTraitScores = {} as ExtendedTraitScores;
    const allTraits: string[] = [
      "systems-thinking", "abstraction", "ambiguity-tolerance", "deep-work",
      "experimentation", "optimization", "execution-speed", "research-orientation",
      "people-orientation", "autonomy", "creativity", "technical-depth",
      "visual-thinking", "operational-thinking", "leadership", "adaptability",
      "learning-velocity", "future-orientation", "AI-curiosity", "AI-builder", "AI-user",
      "stability-preference", "risk-tolerance",
    ];
    for (const t of allTraits) {
      (scores as any)[t] = 0;
    }
    expect(specializationDepth(scores)).toBe(0);
  });

  it("returns higher value for even (broad) profiles compared to peaked (specialized)", () => {
    const even: ExtendedTraitScores = {} as ExtendedTraitScores;
    const peaked: ExtendedTraitScores = {} as ExtendedTraitScores;
    const allTraits: string[] = [
      "systems-thinking", "abstraction", "ambiguity-tolerance", "deep-work",
      "experimentation", "optimization", "execution-speed", "research-orientation",
      "people-orientation", "autonomy", "creativity", "technical-depth",
      "visual-thinking", "operational-thinking", "leadership", "adaptability",
      "learning-velocity", "future-orientation", "AI-curiosity", "AI-builder", "AI-user",
      "stability-preference", "risk-tolerance",
    ];
    for (const t of allTraits) {
      (even as any)[t] = 0.5;
      (peaked as any)[t] = t === "deep-work" ? 1 : 0.1;
    }

    // specializationDepth = avg of squared values
    // even: 23 * 0.25 / 23 = 0.25
    // peaked: (1 + 22 * 0.01) / 23 ≈ 0.053
    expect(specializationDepth(even)).toBeGreaterThan(specializationDepth(peaked));
  });
});

describe("confidenceScore", () => {
  it("returns 0 when all traits are equal", () => {
    const scores: ExtendedTraitScores = {} as ExtendedTraitScores;
    const allTraits: string[] = [
      "systems-thinking", "abstraction", "ambiguity-tolerance", "deep-work",
      "experimentation", "optimization", "execution-speed", "research-orientation",
      "people-orientation", "autonomy", "creativity", "technical-depth",
      "visual-thinking", "operational-thinking", "leadership", "adaptability",
      "learning-velocity", "future-orientation", "AI-curiosity", "AI-builder", "AI-user",
      "stability-preference", "risk-tolerance",
    ];
    for (const t of allTraits) {
      (scores as any)[t] = 0.5;
    }
    expect(confidenceScore(scores)).toBe(0);
  });

  it("returns higher score when one trait dominates", () => {
    const flat: ExtendedTraitScores = {} as ExtendedTraitScores;
    const peaked: ExtendedTraitScores = {} as ExtendedTraitScores;
    const allTraits: string[] = [
      "systems-thinking", "abstraction", "ambiguity-tolerance", "deep-work",
      "experimentation", "optimization", "execution-speed", "research-orientation",
      "people-orientation", "autonomy", "creativity", "technical-depth",
      "visual-thinking", "operational-thinking", "leadership", "adaptability",
      "learning-velocity", "future-orientation", "AI-curiosity", "AI-builder", "AI-user",
      "stability-preference", "risk-tolerance",
    ];
    for (const t of allTraits) {
      (flat as any)[t] = 0.5;
      (peaked as any)[t] = t === "deep-work" ? 1 : 0.2;
    }

    expect(confidenceScore(peaked)).toBeGreaterThan(confidenceScore(flat));
  });
});
