import { describe, it, expect } from "vitest";
import {
  buildRecommendationExplanation,
  buildCareerSurfaceExplanation,
} from "../recommendation-explanations";
import type { TraitScores } from "../quiz";
import type { Career } from "../careers";

const sampleTraits: TraitScores = {
  analytical: 0.8,
  creativity: 0.6,
  leadership: 0.4,
  social: 0.3,
  structure: 0.7,
  "risk-tolerance": 0.5,
  "technical-depth": 0.9,
  visual: 0.2,
};

const sampleCareer: Career = {
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

const alternateCareer: Career = {
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

describe("buildRecommendationExplanation", () => {
  it("returns a complete RecommendationExplanation", () => {
    const explanation = buildRecommendationExplanation(sampleTraits, sampleCareer);

    expect(explanation).toHaveProperty("whyMatched");
    expect(explanation).toHaveProperty("strengthSignals");
    expect(explanation).toHaveProperty("potentialRisks");
    expect(explanation).toHaveProperty("longTermLeverage");
    expect(explanation).toHaveProperty("aiOutlook");
    expect(explanation).toHaveProperty("nextAction");
    expect(explanation).toHaveProperty("thirtyDayPlan");
  });

  it("generates whyMatched reasons", () => {
    const explanation = buildRecommendationExplanation(sampleTraits, sampleCareer);
    expect(explanation.whyMatched.length).toBeGreaterThan(0);
    explanation.whyMatched.forEach((reason) => {
      expect(typeof reason).toBe("string");
      expect(reason.length).toBeGreaterThan(0);
    });
  });

  it("generates strength signals", () => {
    const explanation = buildRecommendationExplanation(sampleTraits, sampleCareer);
    expect(explanation.strengthSignals.length).toBeGreaterThan(0);
  });

  it("generates potential risks", () => {
    const explanation = buildRecommendationExplanation(sampleTraits, sampleCareer);
    expect(explanation.potentialRisks.length).toBeGreaterThan(0);
  });

  it("generates AI outlook", () => {
    const explanation = buildRecommendationExplanation(sampleTraits, sampleCareer);
    expect(explanation.aiOutlook.length).toBeGreaterThan(0);
  });

  it("generates next action", () => {
    const explanation = buildRecommendationExplanation(sampleTraits, sampleCareer);
    expect(explanation.nextAction.length).toBeGreaterThan(0);
  });

  it("generates thirtyDayPlan with 4 weeks", () => {
    const explanation = buildRecommendationExplanation(sampleTraits, sampleCareer);
    expect(explanation.thirtyDayPlan).toHaveLength(4);
    explanation.thirtyDayPlan.forEach((step) => {
      expect(step).toHaveProperty("week");
      expect(step).toHaveProperty("focus");
    });
  });

  it("includes alternative insight when career and delta provided", () => {
    const explanation = buildRecommendationExplanation(
      sampleTraits,
      sampleCareer,
      alternateCareer,
      5
    );
    expect(explanation.alternativeInsight).toBeDefined();
    expect(explanation.alternativeInsight!.length).toBeGreaterThan(0);
  });

  it("omits alternative insight when scoreDelta > 12", () => {
    const explanation = buildRecommendationExplanation(
      sampleTraits,
      sampleCareer,
      alternateCareer,
      15
    );
    expect(explanation.alternativeInsight).toBeUndefined();
  });

  it("returns deterministic results", () => {
    const e1 = buildRecommendationExplanation(sampleTraits, sampleCareer);
    const e2 = buildRecommendationExplanation(sampleTraits, sampleCareer);

    expect(e1.whyMatched).toEqual(e2.whyMatched);
    expect(e1.strengthSignals).toEqual(e2.strengthSignals);
    expect(e1.thirtyDayPlan).toEqual(e2.thirtyDayPlan);
  });
});

describe("buildCareerSurfaceExplanation", () => {
  it("returns a valid explanation without traits", () => {
    const explanation = buildCareerSurfaceExplanation(sampleCareer);

    expect(explanation).toHaveProperty("whyMatched");
    expect(explanation).toHaveProperty("strengthSignals");
    expect(explanation).toHaveProperty("potentialRisks");
    expect(explanation).toHaveProperty("longTermLeverage");
    expect(explanation).toHaveProperty("aiOutlook");
    expect(explanation).toHaveProperty("nextAction");
    expect(explanation).toHaveProperty("thirtyDayPlan");
  });

  it("includes alternative insight with close score delta", () => {
    const explanation = buildCareerSurfaceExplanation(sampleCareer, alternateCareer, 8);
    expect(explanation.alternativeInsight).toBeDefined();
  });

  it("generates 4-week plan for any career", () => {
    const explanation = buildCareerSurfaceExplanation(sampleCareer);
    expect(explanation.thirtyDayPlan).toHaveLength(4);
  });

  it("returns a default plan for unknown domain", () => {
    const unknown: Career = {
      ...sampleCareer,
      domain: "UnknownDomain",
    };
    const explanation = buildCareerSurfaceExplanation(unknown);
    expect(explanation.thirtyDayPlan).toHaveLength(4);
  });
});
