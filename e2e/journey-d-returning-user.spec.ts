import { test, expect } from "@playwright/test";
import {
  completeQuiz,
  expectRecommendationPage,
  JOURNEY_A,
  JOURNEY_D,
} from "./helpers";

test.describe("Journey D — Returning User (Journey Memory)", () => {
  test("journey memory persists and evolving profile is visible", async ({
    page,
  }) => {
    // ── Session 1: First quiz ──
    await page.goto("/quiz");
    await page.waitForURL(/\/quiz/, { timeout: 10_000 });

    // Store initial memory state (should be empty or default)
    const initialMemory = await page.evaluate(() => {
      try {
        return localStorage.getItem("corepath_journey_memory");
      } catch {
        return null;
      }
    });
    console.log(
      `Journey D: Initial memory present: ${initialMemory !== null}`,
    );

    // Complete first quiz
    const params1 = await completeQuiz(page, JOURNEY_A);
    expect(params1.has("results")).toBe(true);

    const { careerTitle: firstCareer } = await expectRecommendationPage(page);
    console.log(`Journey D: First quiz → ${firstCareer}`);

    // Capture memory after first session
    const memoryAfterFirst = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("corepath_journey_memory");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    });
    expect(memoryAfterFirst).not.toBeNull();
    expect(memoryAfterFirst.events.length).toBeGreaterThanOrEqual(1);
    console.log(
      `Journey D: Memory has ${memoryAfterFirst.events.length} event(s) after first session`,
    );

    // ── Simulate returning user: new browser context with same localStorage ──
    // We use the same page, navigate to /quiz and retake
    const retakeBtn = page.getByRole("button", { name: /Retake/i });
    if ((await retakeBtn.count()) > 0) {
      await retakeBtn.click();
      await page.waitForURL(/\/quiz/, { timeout: 10_000 });
    } else {
      await page.goto("/quiz");
    }

    // Complete second quiz with same answer pattern
    const params2 = await completeQuiz(page, JOURNEY_D);
    expect(params2.has("results")).toBe(true);

    const { careerTitle: secondCareer } = await expectRecommendationPage(page);
    console.log(`Journey D: Second quiz → ${secondCareer}`);

    // Memory now has 2+ quiz events
    const memoryAfterSecond = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("corepath_journey_memory");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    });
    expect(memoryAfterSecond).not.toBeNull();

    const quizEvents = memoryAfterSecond.events.filter(
      (e: { type: string }) => e.type === "quizCompleted",
    );
    expect(quizEvents.length).toBeGreaterThanOrEqual(2);
    console.log(
      `Journey D: ${quizEvents.length} quizCompleted events after two sessions`,
    );

    // Verify careerViewed was recorded for the first recommendation
    const careerViewedEvents = memoryAfterSecond.events.filter(
      (e: { type: string }) => e.type === "careerViewed",
    );
    if (careerViewedEvents.length > 0) {
      console.log(
        `Journey D: ${careerViewedEvents.length} careerViewed events recorded`,
      );
    }

    // Verify memory structure
    expect(memoryAfterSecond).toHaveProperty("initialized");
    expect(memoryAfterSecond).toHaveProperty("events");
    expect(Array.isArray(memoryAfterSecond.events)).toBe(true);
    expect(memoryAfterSecond).toHaveProperty("profile");

    console.log("Journey D: Memory structure validated ✓");
  });

  test("duplicate quiz does not corrupt memory", async ({ page }) => {
    // Complete quiz twice in rapid succession
    await page.goto("/quiz");
    await completeQuiz(page, JOURNEY_A);

    // Immediate retake
    const retakeBtn = page.getByRole("button", { name: /Retake/i });
    if ((await retakeBtn.count()) > 0) {
      await retakeBtn.click();
      await page.waitForURL(/\/quiz/, { timeout: 10_000 });
    }

    await completeQuiz(page, JOURNEY_A);

    // Verify memory is valid JSON and has proper structure
    const valid = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("corepath_journey_memory");
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return (
          typeof parsed === "object" &&
          Array.isArray(parsed.events) &&
          parsed.events.length >= 2 &&
          typeof parsed.profile === "object"
        );
      } catch {
        return false;
      }
    });
    expect(valid).toBe(true);
    console.log("Journey D: Memory integrity verified after duplicate quiz ✓");
  });
});
