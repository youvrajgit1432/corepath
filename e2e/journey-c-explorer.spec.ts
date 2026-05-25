import { test, expect } from "@playwright/test";
import {
  completeQuiz,
  expectRecommendationPage,
  expectCareerDetailPage,
  expectComparePageVisible,
  expectMobileNavigation,
  expectKeyboardAccessible,
  JOURNEY_C,
} from "./helpers";

test.describe("Journey C — Explorer", () => {
  test("full journey: landing → insights → careers → compare → retake quiz", async ({
    page,
  }) => {
    // 1. Landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/CorePath|Core path|Career/i);

    // 2. Browse insights page
    const insightsLink = page.getByRole("link", { name: /Insights|Market/i });
    if ((await insightsLink.count()) > 0) {
      await insightsLink.click();
      await page.waitForURL(/\/insights/, { timeout: 10_000 });
    } else {
      await page.goto("/insights");
    }
    await page.waitForTimeout(1_000);
    const hasInsights = await page.evaluate(
      () => document.body.textContent?.includes("Insight") ?? false,
    );
    console.log(`Journey C: Insights page loaded → ${hasInsights}`);

    // 3. Browse careers listing
    await page.goto("/careers");
    await page.waitForURL(/\/careers/, { timeout: 10_000 });
    await page.waitForTimeout(1_000);

    // Count career cards
    const careerCards = page.locator('[role="list"] a, [role="list"] [class*="card"]');
    const count = await careerCards.count();
    console.log(`Journey C: ${count} career cards visible`);

    // Click first career to see detail
    const firstCareer = page.locator('a[href*="/careers/"]').first();
    if ((await firstCareer.count()) > 0) {
      await firstCareer.click();
      await page.waitForTimeout(2_000);
      await expectCareerDetailPage(page);
      console.log("Journey C: Career detail page loaded");
    }

    // 4. Compare careers
    await page.goto("/careers/compare?ids=software-engineer,product-manager");
    await expectComparePageVisible(page);
    console.log("Journey C: Compare page loaded");

    // 5. Retake quiz
    await page.goto("/quiz");
    const params = await completeQuiz(page, JOURNEY_C);
    expect(params.has("results")).toBe(true);

    const { careerTitle } = await expectRecommendationPage(page);
    console.log(`Journey C: Retake recommended → ${careerTitle}`);

    // 6. Mobile nav + keyboard
    await expectMobileNavigation(page);
    await expectKeyboardAccessible(page);
  });

  test("quiz retake updates journey memory", async ({ page }) => {
    // First quiz session
    await page.goto("/quiz");
    await completeQuiz(page, JOURNEY_C);

    // Check journey memory in localStorage
    const memory1 = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("corepath_journey_memory");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    });
    expect(memory1).not.toBeNull();
    expect(memory1.events.length).toBeGreaterThanOrEqual(1);

    // Retake quiz
    const retakeBtn = page.getByRole("button", { name: /Retake/i });
    if ((await retakeBtn.count()) > 0) {
      await retakeBtn.click();
      await page.waitForURL(/\/quiz/, { timeout: 10_000 });
    }
    await completeQuiz(page, JOURNEY_C);

    // Memory now has 2+ quiz events
    const memory2 = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("corepath_journey_memory");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    });
    expect(memory2).not.toBeNull();
    const quizEvents = memory2.events.filter(
      (e: { type: string }) => e.type === "quizCompleted",
    );
    expect(quizEvents.length).toBeGreaterThanOrEqual(2);
    console.log(
      `Journey C: Journey memory has ${memory2.events.length} total events`,
    );
  });
});
