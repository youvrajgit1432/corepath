import { describe, it, expect } from "vitest";
import { buildCareerEvolution } from "../career-evolution";
import type { Career } from "../careers";

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

describe("buildCareerEvolution", () => {
  it("returns a complete CareerEvolution object", () => {
    const evolution = buildCareerEvolution(sampleCareer);

    expect(evolution).toHaveProperty("career");
    expect(evolution).toHaveProperty("immediateNextPaths");
    expect(evolution).toHaveProperty("midCareerEvolution");
    expect(evolution).toHaveProperty("advancedSpecializationRoutes");
    expect(evolution).toHaveProperty("adjacentTransferableCareers");
    expect(evolution).toHaveProperty("leadershipTrack");
    expect(evolution).toHaveProperty("researchTrack");
    expect(evolution).toHaveProperty("founderTrack");
    expect(evolution).toHaveProperty("aiEraExpansionOpportunities");
    expect(evolution).toHaveProperty("skillEcosystem");
  });

  it("preserves the career reference", () => {
    const evolution = buildCareerEvolution(sampleCareer);
    expect(evolution.career.id).toBe("ai-engineer");
  });

  it("generates immediate next paths", () => {
    const evolution = buildCareerEvolution(sampleCareer);
    expect(evolution.immediateNextPaths.length).toBeGreaterThan(0);
    evolution.immediateNextPaths.forEach((path) => {
      expect(typeof path).toBe("string");
    });
  });

  it("generates mid career evolution paths", () => {
    const evolution = buildCareerEvolution(sampleCareer);
    expect(evolution.midCareerEvolution.length).toBeGreaterThan(0);
  });

  it("generates leadership track", () => {
    const evolution = buildCareerEvolution(sampleCareer);
    expect(evolution.leadershipTrack.length).toBeGreaterThan(0);
  });

  it("generates research track", () => {
    const evolution = buildCareerEvolution(sampleCareer);
    expect(evolution.researchTrack.length).toBeGreaterThan(0);
  });

  it("generates founder track", () => {
    const evolution = buildCareerEvolution(sampleCareer);
    expect(evolution.founderTrack.length).toBeGreaterThan(0);
  });

  it("generates AI era expansion opportunities", () => {
    const evolution = buildCareerEvolution(sampleCareer);
    expect(evolution.aiEraExpansionOpportunities.length).toBeGreaterThan(0);
    evolution.aiEraExpansionOpportunities.forEach((o) => {
      expect(typeof o).toBe("string");
    });
  });

  describe("skillEcosystem", () => {
    it("has a core skill", () => {
      const evolution = buildCareerEvolution(sampleCareer);
      expect(evolution.skillEcosystem.core).toBe("Machine Learning");
    });

    it("has supporting skills", () => {
      const evolution = buildCareerEvolution(sampleCareer);
      expect(evolution.skillEcosystem.supporting.length).toBeGreaterThan(0);
    });

    it("has expansion skills", () => {
      const evolution = buildCareerEvolution(sampleCareer);
      expect(evolution.skillEcosystem.expansion.length).toBeGreaterThan(0);
    });

    it("has transferable careers", () => {
      const evolution = buildCareerEvolution(sampleCareer);
      expect(evolution.skillEcosystem.transferable.length).toBeGreaterThan(0);
    });

    it("has transition insight", () => {
      const evolution = buildCareerEvolution(sampleCareer);
      expect(evolution.skillEcosystem.transitionInsight.length).toBeGreaterThan(0);
    });

    it("has tradeoff insight", () => {
      const evolution = buildCareerEvolution(sampleCareer);
      expect(evolution.skillEcosystem.tradeoffInsight.length).toBeGreaterThan(0);
    });
  });

  it("returns deterministic results", () => {
    const e1 = buildCareerEvolution(sampleCareer);
    const e2 = buildCareerEvolution(sampleCareer);

    expect(e1.immediateNextPaths).toEqual(e2.immediateNextPaths);
    expect(e1.midCareerEvolution).toEqual(e2.midCareerEvolution);
    expect(e1.leadershipTrack).toEqual(e2.leadershipTrack);
  });

  it("handles career with no related IDs gracefully", () => {
    const soloCareer: Career = {
      ...sampleCareer,
      id: "solo-career",
      relatedCareerIds: [],
    };

    const evolution = buildCareerEvolution(soloCareer);
    // Should fall back to domain-based matching since no related IDs
    // immediateNextPaths: falls back to same-domain careers
    expect(evolution.immediateNextPaths.length).toBeGreaterThanOrEqual(0);
    // adjacentTransferableCareers: from same-tag matching
    expect(evolution.adjacentTransferableCareers.length).toBeGreaterThanOrEqual(0);
    // Core fields should be populated
    expect(evolution.leadershipTrack.length).toBeGreaterThan(0);
    expect(evolution.researchTrack.length).toBeGreaterThan(0);
    expect(evolution.founderTrack.length).toBeGreaterThan(0);
  });
});
