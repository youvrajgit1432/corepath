import { describe, it, expect } from "vitest";
import { compareCareers } from "../career-comparison";
import type { Career } from "../careers";
import type { EnhancedProfile } from "../quiz-enhanced";

const sampleCareerA: Career = {
  id: "ai-engineer",
  title: "AI Engineer",
  category: "Software Engineering",
  domain: "Software Engineering",
  coreSkill: "Machine Learning",
  difficulty: "high",
  demand: "high",
  demandLevel: "growing",
  timeToJob: "12–18 months",
  aiRelationship: "AI-Created",
  aiImpact: "transformative",
  tags: ["apis", "data", "ml", "architecture"],
  quiz_traits: ["analytical", "technical-depth"],
  aiImpactNote: "Transformative AI impact",
  futureDemand: "Exploding",
  relatedCareerIds: ["ml-engineer"],
  supportingSkills: ["Python", "PyTorch"],
};

const sampleCareerB: Career = {
  id: "product-manager",
  title: "Product Manager",
  category: "Product",
  domain: "Product",
  coreSkill: "Product Strategy",
  difficulty: "moderate",
  demand: "moderate",
  demandLevel: "growing",
  timeToJob: "6–12 months",
  aiRelationship: "AI-Augmented",
  aiImpact: "moderate",
  tags: ["product", "strategy", "ux"],
  quiz_traits: ["leadership", "social"],
  aiImpactNote: "Moderate AI impact",
  futureDemand: "High Growth",
  relatedCareerIds: ["product-designer"],
  supportingSkills: ["Roadmapping", "User Research"],
};

const sampleProfile: EnhancedProfile = {
  extended: {
    "systems-thinking": 0.8,
    "abstraction": 0.3,
    "ambiguity-tolerance": 0.5,
    "deep-work": 0.7,
    "experimentation": 0.4,
    "optimization": 0.6,
    "execution-speed": 0.3,
    "research-orientation": 0.5,
    "people-orientation": 0.2,
    "autonomy": 0.6,
    "risk-tolerance": 0.5,
    "stability-preference": 0.4,
    "creativity": 0.4,
    "technical-depth": 0.8,
    "visual-thinking": 0.3,
    "operational-thinking": 0.5,
    "leadership": 0.3,
    "adaptability": 0.6,
    "learning-velocity": 0.7,
    "future-orientation": 0.6,
    "AI-curiosity": 0.9,
    "AI-builder": 0.7,
    "AI-user": 0.5,
  },
  confidence: 70,
  contradictions: [],
  specializationDepth: 0.35,
  narrative: ["Top signals: systems-thinking, technical-depth, AI-curiosity."],
  recommendations: ["Pursue AI-augmented engineering tracks."],
};

describe("compareCareers", () => {
  it("returns a complete CareerComparison object", () => {
    const comparison = compareCareers(sampleCareerA, sampleCareerB);

    expect(comparison).toHaveProperty("careerA");
    expect(comparison).toHaveProperty("careerB");
    expect(comparison).toHaveProperty("similarities");
    expect(comparison).toHaveProperty("differences");
    expect(comparison).toHaveProperty("differences.careerA");
    expect(comparison).toHaveProperty("differences.careerB");
    expect(comparison).toHaveProperty("thinkingStyleFit");
    expect(comparison).toHaveProperty("workStyleDifferences");
    expect(comparison).toHaveProperty("aiEraDifferences");
    expect(comparison).toHaveProperty("learningDifficulty");
    expect(comparison).toHaveProperty("longTermLeverageComparison");
    expect(comparison).toHaveProperty("futureDemandComparison");
    expect(comparison).toHaveProperty("careerEvolutionDifferences");
    expect(comparison).toHaveProperty("recommendationSummary");
  });

  it("preserves career references", () => {
    const comparison = compareCareers(sampleCareerA, sampleCareerB);
    expect(comparison.careerA.id).toBe("ai-engineer");
    expect(comparison.careerB.id).toBe("product-manager");
  });

  it("generates similarity entries", () => {
    const comparison = compareCareers(sampleCareerA, sampleCareerB);
    expect(comparison.similarities.length).toBeGreaterThan(0);
    comparison.similarities.forEach((s) => {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    });
  });

  it("generates differences for each career", () => {
    const comparison = compareCareers(sampleCareerA, sampleCareerB);
    expect(comparison.differences.careerA.length).toBeGreaterThan(0);
    expect(comparison.differences.careerB.length).toBeGreaterThan(0);
  });

  it("generates a thinking style fit string", () => {
    const comparison = compareCareers(sampleCareerA, sampleCareerB);
    expect(typeof comparison.thinkingStyleFit).toBe("string");
    expect(comparison.thinkingStyleFit.length).toBeGreaterThan(0);
  });

  it("generates work style differences", () => {
    const comparison = compareCareers(sampleCareerA, sampleCareerB);
    expect(comparison.workStyleDifferences.length).toBeGreaterThan(0);
  });

  it("generates ai era differences", () => {
    const comparison = compareCareers(sampleCareerA, sampleCareerB);
    expect(comparison.aiEraDifferences.length).toBeGreaterThan(0);
  });

  it("generates a recommendation summary", () => {
    const comparison = compareCareers(sampleCareerA, sampleCareerB);
    expect(typeof comparison.recommendationSummary).toBe("string");
    expect(comparison.recommendationSummary.length).toBeGreaterThan(0);
  });

  it("uses profile when provided for thinking style fit", () => {
    const withoutProfile = compareCareers(sampleCareerA, sampleCareerB);
    const withProfile = compareCareers(sampleCareerA, sampleCareerB, sampleProfile);

    // Both should have meaningful text
    expect(withoutProfile.thinkingStyleFit.length).toBeGreaterThan(0);
    expect(withProfile.thinkingStyleFit.length).toBeGreaterThan(0);
  });

  it("returns deterministic results", () => {
    const c1 = compareCareers(sampleCareerA, sampleCareerB);
    const c2 = compareCareers(sampleCareerA, sampleCareerB);

    expect(c1.similarities).toEqual(c2.similarities);
    expect(c1.differences).toEqual(c2.differences);
    expect(c1.thinkingStyleFit).toBe(c2.thinkingStyleFit);
  });
});
