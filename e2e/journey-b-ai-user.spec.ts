import { test, expect } from "@playwright/test";
import {
  completeQuiz,
  expectRecommendationPage,
  expectComparePageVisible,
  expectCareerDetailPage,
  JOURNEY_B,
} from "./helpers";

test.describe("Journey B — AI-Focused User", () => {
  test("full journey: landing → AI route → compare → roadmap", async ({
    page,
  }) => {
    // 1. Landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/CorePath|Core path|Career/i);

    // 2. Navigate to quiz directly (AI-focused user clicks through quickly)
    await page.goto("/quiz");
    await page.waitForURL(/\/quiz/, { timeout: 10_000 });

    // 3. Complete quiz with AI-biased answers
    const params = await completeQuiz(page, JOURNEY_B);
    expect(params.has("results")).toBe(true);

    // 4. Verify recommendation
    const { careerTitle } = await expectRecommendationPage(page);
    console.log(`Journey B: Recommended top career → ${careerTitle}`);

    // 5. Navigate to compare careers
    const compareLink = page.getByRole("link", { name: /Compare careers/i });
    if ((await compareLink.count()) > 0) {
      await compareLink.click();
      await page.waitForURL(/\/careers\/compare/, { timeout: 10_000 });
      await expectComparePageVisible(page);
      console.log("Journey B: Compare page loaded");
    }

    // 6. Navigate back to career detail
    const roadmapLink = page.getByRole("link", { name: /View Full Roadmap/i });
    if ((await roadmapLink.count()) > 0) {
      await roadmapLink.click();
      await page.waitForTimeout(2_000);
      await expectCareerDetailPage(page);
      console.log("Journey B: Career detail page loaded");
    }
  });

  test("compare page shows key sections", async ({ page }) => {
    // Go to compare page directly with two career IDs
    await page.goto("/careers/compare?ids=software-engineer,ai-engineer");
    await expectComparePageVisible(page);

    // Verify similarity/difference sections
    const hasSections = await page.evaluate(() => {
      const text = document.body.textContent ?? "";
      return (
        text.includes("Similarities") ||
        text.includes("Core differences") ||
        text.includes("Future positioning")
      );
    });
    expect(hasSections).toBe(true);
    console.log("Journey B: Compare sections verified");
  });
});
