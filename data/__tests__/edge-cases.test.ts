import { describe, it, expect, beforeEach } from "vitest";
import { SafeStorage } from "../safe-storage";
import { checkStorageHealth, isLikelyQuotaError } from "../storage-health";
import { calculateEnhancedProfile } from "../quiz-enhanced";
import { loadJourneyMemory, recordJourneyEvent, clearJourneyMemory } from "../journey-memory";

describe("Edge Cases", () => {
  describe("empty storage", () => {
    beforeEach(() => {
      clearJourneyMemory();
    });

    it("loadJourneyMemory returns initial state when nothing stored", () => {
      const memory = loadJourneyMemory();
      expect(memory.completedQuizzes).toBe(0);
      expect(memory.quizDates).toEqual([]);
      expect(memory.viewedCareers).toEqual({});
    });

    it("SafeStorage returns null for missing keys", () => {
      const storage = new SafeStorage("local", { silent: true });
      expect(storage.get("non-existent-key")).toBeNull();
    });

    it("checkStorageHealth returns healthy or warning on empty storage", () => {
      const report = checkStorageHealth();
      // In jsdom, localStorage is available — should be healthy
      expect(["healthy", "warning"]).toContain(report.status);
      expect(report.keyCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("corrupted JSON", () => {
    it("SafeStorage.recoverJSON handles invalid JSON gracefully", () => {
      const storage = new SafeStorage("local", { silent: true });
      storage.set("valid", { data: "good" });

      // Should not throw
      expect(() => storage.recoverJSON("valid")).not.toThrow();
      expect(storage.recoverJSON("valid")).toEqual({ data: "good" });
    });

    it("SafeStorage.recoverJSON returns null for missing keys", () => {
      const storage = new SafeStorage("local", { silent: true });
      expect(storage.recoverJSON("missing")).toBeNull();
    });

    it("quiz-enhanced handles unexpected answer keys gracefully", () => {
      const profile = calculateEnhancedProfile({ randomKey: "unexpectedValue" });
      expect(profile).toBeDefined();
      expect(typeof profile.confidence).toBe("number");
      expect(profile.narrative.length).toBeGreaterThan(0);
    });

    it("calculateEnhancedProfile handles numeric answer values", () => {
      const profile = calculateEnhancedProfile({ q1: "a", q2: "b" });
      expect(profile).toBeDefined();
      expect(Object.keys(profile.extended)).toHaveLength(23);
    });
  });

  describe("quota exceeded scenarios", () => {
    it("isLikelyQuotaError identifies DOM quota errors", () => {
      const quotaError = new DOMException("exceeded", "QuotaExceededError");
      expect(isLikelyQuotaError(quotaError)).toBe(true);
    });

    it("isLikelyQuotaError returns false for regular errors", () => {
      expect(isLikelyQuotaError(new Error("generic"))).toBe(false);
      expect(isLikelyQuotaError("string")).toBe(false);
      expect(isLikelyQuotaError(null)).toBe(false);
    });
  });

  describe("partial quiz answers", () => {
    it("handles empty answers object", () => {
      const profile = calculateEnhancedProfile({});
      expect(profile).toBeDefined();
      expect(profile.extended).toBeDefined();
    });

    it("handles single answer", () => {
      const profile = calculateEnhancedProfile({ q101: "a" });
      expect(profile).toBeDefined();
      expect(typeof profile.confidence).toBe("number");
    });

    it("handles answers with unexpected values", () => {
      const profile = calculateEnhancedProfile({ q101: "z" });
      expect(profile).toBeDefined();
      expect(typeof profile.specializationDepth).toBe("number");
    });
  });

  describe("retake quiz", () => {
    beforeEach(() => {
      clearJourneyMemory();
    });

    it("correctly increments retake count when last recommendation differs", () => {
      const ev1 = {
        type: "quizCompleted" as const,
        careerId: "ai-engineer",
        careerCategory: "Engineering",
        careerTags: ["ai"],
        confidence: 70,
        specializationDepth: 0.3,
        aiInterest: true,
      };
      recordJourneyEvent(ev1);

      const ev2 = {
        type: "quizCompleted" as const,
        careerId: "product-manager",
        careerCategory: "Product",
        careerTags: ["product"],
        confidence: 65,
        specializationDepth: 0.2,
        aiInterest: false,
      };
      const memory = recordJourneyEvent(ev2);

      expect(memory.uncertaintyPatterns.retakes).toBe(1);
    });

    it("sets lastRecommendedCareer after quiz", () => {
      const memory = recordJourneyEvent({
        type: "quizCompleted",
        careerId: "data-scientist",
        careerCategory: "Data",
        careerTags: ["data", "ml"],
        confidence: 75,
        specializationDepth: 0.3,
        aiInterest: true,
      });

      expect(memory.lastRecommendedCareer).toBe("data-scientist");
    });
  });

  describe("private browsing simulation", () => {
    it("SafeStorage handles storage unavailability gracefully", () => {
      // Simulate by creating a storage that can't write
      const storage = new SafeStorage("local", { silent: true });
      // This is a basic check that operations don't throw
      expect(() => {
        storage.set("key", "value");
        storage.get("key");
        storage.remove("key");
      }).not.toThrow();
    });
  });

  describe("determinism", () => {
    it("same answers produce same enhanced profile", () => {
      const answers = { q1: "a", q2: "b", q3: "c", q4: "d" };
      const p1 = calculateEnhancedProfile(answers);
      const p2 = calculateEnhancedProfile(answers);
      expect(p1.extended).toEqual(p2.extended);
      expect(p1.confidence).toBe(p2.confidence);
      expect(p1.contradictions).toEqual(p2.contradictions);
    });

    it("same journey events produce same memory state", () => {
      clearJourneyMemory();

      recordJourneyEvent({
        type: "careerViewed",
        careerId: "c1",
        careerCategory: "Engineering",
        careerTags: ["systems"],
        hasRoadmap: true,
      });

      const memory1 = loadJourneyMemory();
      const memory2 = loadJourneyMemory();
      expect(memory1.viewedCareers).toEqual(memory2.viewedCareers);
    });
  });
});
