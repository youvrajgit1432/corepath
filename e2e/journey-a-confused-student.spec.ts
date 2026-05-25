import { test, expect } from "@playwright/test";
import {
  completeQuiz,
  expectRecommendationPage,
  expectCareerDetailPage,
  expectMobileNavigation,
  expectKeyboardAccessible,
  JOURNEY_A,
} from "./helpers";

test.describe("Journey A — Confused BSc CSIT Student", () => {
  test("full journey: landing → onboarding → quiz → recommendation → roadmap", async ({
    page,
  }) => {
    // 1. Landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/CorePath|Core path|Career/i);

    // 2. Onboarding — find and interact with guided onboarding
    const onboardingTrigger = page.getByRole("button", {
      name: /Start|Begin|Explore|Get started/i,
    });
    if ((await onboardingTrigger.count()) > 0) {
      await onboardingTrigger.click();
      await page.waitForTimeout(500);
    }

    // 3. Navigate to quiz
    const quizLink = page.getByRole("link", { name: /Take.*quiz|Start.*quiz|Discovery/i });
    if ((await quizLink.count()) > 0) {
      await quizLink.click();
    } else {
      await page.goto("/quiz");
    }
    await page.waitForURL(/\/quiz/, { timeout: 10_000 });

    // 4. Complete quiz
    const params = await completeQuiz(page, JOURNEY_A);
    expect(params.has("results")).toBe(true);

    // 5. Verify recommendation page
    const { careerTitle } = await expectRecommendationPage(page);
    console.log(`Journey A: Recommended top career → ${careerTitle}`);

    // 6. Navigate to career detail / roadmap
    const roadmapLink = page.getByRole("link", { name: /View Full Roadmap/i });
    if ((await roadmapLink.count()) > 0) {
      await roadmapLink.click();
      await page.waitForTimeout(2_000);
      await expectCareerDetailPage(page);
      console.log("Journey A: Career detail page loaded");
    }

    // 7. Mobile navigation (if mobile-sized)
    await expectMobileNavigation(page);

    // 8. Keyboard accessibility
    await expectKeyboardAccessible(page);
  });

  test("quiz completion and analytics logged", async ({ page }) => {
    await page.goto("/quiz");
    await completeQuiz(page, JOURNEY_A);

    // Verify analytics events were logged (stored in localStorage by analytics-events)
    const events = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem("corepath_analytics");
        if (!raw) return [];
        return JSON.parse(raw);
      } catch {
        return [];
      }
    });
    expect(events.length).toBeGreaterThanOrEqual(2);

    const eventTypes = events.map((e: { event: string }) => e.event);
    expect(eventTypes).toContain("quiz_started");
    expect(eventTypes).toContain("quiz_completed");
    console.log(`Journey A: ${events.length} analytics events logged`);
  });
});
