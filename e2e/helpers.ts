import { Page, expect } from "@playwright/test";

/**
 * Answer INDEX patterns for each journey.
 * Each entry is the 0-based answer button position (0=A, 1=B, 2=C, 3=D)
 * to click for the corresponding question asked — works regardless of
 * adaptive branching because it clicks the Nth button in whatever
 * question happens to be displayed.
 */

/** Journey A — Systems-oriented BSc CSIT student */
export const JOURNEY_A: number[] = [
  0, // q1: Designing dependable systems
  0, // q2: Tinkering with APIs
  0, // q3: Small core engineering team
  0, // q4: Strong role quickly
  1, // q5: AI supports but not central
  1, // q6: Polished interfaces
  0, // q7: Slow delivery frustrating
  1, // q8: High challenge, learn fast
  0, // q9: Learn by building
  0, // q10: Backend that works
  1, // q11: Dig into failing service
  1, // q12: Clear expectations
  0, // q13: Build lightweight experiment
  0, // q14: Invest in existing system
  0, // q15: Define user problem first
  1, // q16: Pause to check assumptions
];

/** Journey B — AI-focused user */
export const JOURNEY_B: number[] = [
  2, // q1: Experimenting with data & AI
  3, // q2: Learning AI tricks
  3, // q3: Research teams testing models
  3, // q4: Ready for challenge
  2, // q5: Build models & systems
  3, // q6: Models that learn
  2, // q7: Unreliable data frustrating
  1, // q8: High challenge roles
  3, // q9: Experiment until it works
  3, // q10: AI system helping people
  2, // q11: Shape practical fix
  0, // q12: Enjoy shaping direction
  2, // q13: Clear hypothesis
  1, // q14: Shape new initiative
  1, // q15: Build model, see what it can do
  0, // q16: Decisions that unblock
];

/** Journey C — Explorer (product/design leaning) */
export const JOURNEY_C: number[] = [
  1, // q1: Polished experiences
  2, // q2: Analyzing data
  1, // q3: Creative product squad
  0, // q4: Strong role quickly
  3, // q5: Curious about AI
  2, // q6: Data platforms
  1, // q7: Products ignoring users
  2, // q8: Balanced with creativity
  2, // q9: Pairing with others
  1, // q10: Product people love
  0, // q11: Align teams
  2, // q12: Ownership without unpredictability
  0, // q13: Build experiment
  3, // q14: Hybrid stabilize + build new
  3, // q15: AI with clear efficiency
  2, // q16: Keep people calm
];

/** Journey D — Returning user (same choices as A) */
export const JOURNEY_D: number[] = JOURNEY_A;

// ────────────────────────────────────────────────
// Quizz interaction helpers — DOM-position based
// ────────────────────────────────────────────────

/**
 * Click the nth answer button in the current question card.
 * Uses DOM position (not text matching) to avoid issues with smart quotes,
 * emoji, and adaptive branching.
 */
async function clickAnswerByIndex(page: Page, answerIndex: number) {
  await page.evaluate((idx) => {
    const quizCard = document.querySelector<HTMLDivElement>(".quiz-card-appear");
    if (!quizCard) throw new Error("Quiz card not found");

    const grid = quizCard.querySelector<HTMLDivElement>(".grid");
    if (!grid) throw new Error("Answer grid not found");

    const buttons = grid.querySelectorAll<HTMLButtonElement>("button");
    const button = buttons[idx];
    if (!button) {
      throw new Error(
        `Answer button at index ${idx} not found (${buttons.length} available)`,
      );
    }

    button.click();
  }, answerIndex);

  // Give React state time to update
  await page.waitForTimeout(150);
}

/**
 * Click the Next button (Continue or Reveal your match).
 * Waits for it to become enabled after answer selection.
 */
async function clickNext(page: Page) {
  await page.waitForTimeout(200);
  const nextBtn = page.getByRole("button", { name: /Continue|Reveal|match/i });
  await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
  await nextBtn.click();
  await page.waitForTimeout(250);
}

/**
 * Complete the full 16-question quiz.
 * @param answerIndices — array of 0-based answer indices, one per question
 * @returns URL search params from /recommendation redirect
 */
export async function completeQuiz(
  page: Page,
  answerIndices: number[],
): Promise<URLSearchParams> {
  for (const idx of answerIndices) {
    await clickAnswerByIndex(page, idx);
    await clickNext(page);
  }

  await page.waitForURL(/\/recommendation/, { timeout: 20_000 });
  return new URL(page.url()).searchParams;
}

// ────────────────────────────────────────────────
// Assertion helpers
// ────────────────────────────────────────────────

/** Assert recommendation page rendered with key elements */
export async function expectRecommendationPage(page: Page) {
  await expect(
    page.getByText("Your CorePath is ready"),
  ).toBeVisible({ timeout: 15_000 });

  const pctText = await page
    .getByText(/% alignment/)
    .first()
    .textContent({ timeout: 10_000 });
  const matchPct = pctText ?? "unknown";

  const title = await page.locator("h2").first().textContent({ timeout: 5_000 });
  const careerTitle = title ?? "unknown";

  await expect(
    page.getByRole("link", { name: /View Full Roadmap/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Retake/i })).toBeVisible();

  return { careerTitle, matchPct };
}

/** Assert career detail page has key sections */
export async function expectCareerDetailPage(page: Page) {
  const hasSkillTree = await page.evaluate(
    () => document.body.textContent?.includes("Skill Tree") ?? false,
  );
  const hasLearning = await page.evaluate(
    () => document.body.textContent?.includes("Learning Roadmap") ?? false,
  );
  const hasAIImpact = await page.evaluate(
    () => document.body.textContent?.includes("AI Impact") ?? false,
  );
  expect(hasSkillTree || hasLearning || hasAIImpact).toBe(true);
}

/** Assert mobile hamburger menu opens/closes */
export async function expectMobileNavigation(page: Page) {
  const menuBtn = page
    .locator("button")
    .filter({ has: page.locator("svg") })
    .first();
  if ((await menuBtn.count()) === 0) return;

  await expect(menuBtn).toBeVisible({ timeout: 5_000 });
  await menuBtn.click();
  await page.waitForTimeout(600);

  const modal = page.locator('[role="dialog"]');
  if ((await modal.count()) > 0) {
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    await expect(modal).not.toBeVisible();
  }
}

/** Assert keyboard can reach interactive elements */
export async function expectKeyboardAccessible(page: Page) {
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(150);
  }
  const hasFocus = await page.evaluate(
    () => document.activeElement !== document.body,
  );
  expect(hasFocus).toBe(true);
}

/** Assert compare page loaded */
export async function expectComparePageVisible(page: Page) {
  const hasContent = await page.evaluate(
    () => document.body.textContent?.includes("Career Comparison") ?? false,
  );
  const hasSimilarities = await page.evaluate(
    () => document.body.textContent?.includes("Similarities") ?? false,
  );
  expect(hasContent || hasSimilarities).toBe(true);
}
