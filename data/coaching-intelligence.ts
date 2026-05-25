/**
 * COACHING INTELLIGENCE ENGINE
 *
 * Answers: "What would a smart career coach tell this user right now?"
 *
 * Synthesizes 7 sources to detect the user's coaching mode and generate
 * personalized guidance — warnings, encouragements, blind spots, and
 * growth opportunities.
 *
 * Sources:
 *   - insight-vault          → major insights, recurring patterns, vault score
 *   - intelligence-synthesis → contradictions, confidence score, urgent signals
 *   - future-self            → trajectory strength, risk factors, growth catalysts
 *   - progress-reflection    → reflection theme, momentum signal, wins/growth areas
 *   - mission-intelligence   → mission score, mission blocks
 *   - decision-confidence    → confidence score, stability, exploration readiness
 *   - journey-memory         → confidence history, quiz counts, uncertainty patterns
 *
 * Coaching modes:
 *   mentor      → low confidence + strong trajectory (encouragement)
 *   challenger  → high friction + repeating patterns (intervention)
 *   protector   → high momentum + burnout risk (protective pacing)
 *   strategist  → good data + contradictions to resolve (tactical planning)
 *   reflective  → steady state (consolidation & awareness)
 *
 * No backend. No auth. Pure client-side computation.
 */

import type { InsightVaultData } from "./insight-vault";
import type { IntelligenceSynthesisData } from "./intelligence-synthesis";
import { getFutureSelf } from "./future-self";
import type { FutureSelfData } from "./future-self";
import type { ProgressReflectionData } from "./progress-reflection";
import { getMissionIntelligence } from "./mission-intelligence";
import type { MissionIntelligenceData } from "./mission-intelligence";
import { getDecisionConfidence } from "./decision-confidence";
import type { DecisionConfidenceData } from "./decision-confidence";
import { loadJourneyMemory } from "./journey-memory";
import type { JourneyMemory } from "./journey-memory";
import { getStored } from "./shared-context";
import { EMPTY_INSIGHT_VAULT, EMPTY_SYNTHESIS, EMPTY_PROGRESS_REFLECTION } from "./safe-context";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type CoachingMode = "mentor" | "challenger" | "protector" | "strategist" | "reflective";

export interface CoachingData {
  coachingMode: CoachingMode;
  coachMessage: string;
  focusAdvice: string;
  warnings: string[];
  encouragements: string[];
  blindSpots: string[];
  growthOpportunities: string[];
  coachConfidence: number; // 0–100
  todayCoaching: string;
}

// ============================================================================
// INTERNAL TYPES & HELPERS
// ============================================================================

interface CoachingContext {
  vault: InsightVaultData;
  synthesis: IntelligenceSynthesisData;
  future: FutureSelfData;
  reflection: ProgressReflectionData;
  mission: MissionIntelligenceData;
  confidence: DecisionConfidenceData;
  memory: JourneyMemory;
}

// ── Mode metadata ─────────────────────────────────────────────────────────

interface ModeDef {
  mode: CoachingMode;
  label: string;
  icon: string;
  description: string;
}

const MODE_DEFS: Record<CoachingMode, ModeDef> = {
  mentor: {
    mode: "mentor",
    label: "Mentor Mode",
    icon: "🎓",
    description: "Encouragement and confidence-building guidance",
  },
  challenger: {
    mode: "challenger",
    label: "Challenger Mode",
    icon: "⚡",
    description: "Intervention to break stuck patterns",
  },
  protector: {
    mode: "protector",
    label: "Protector Mode",
    icon: "🛡️",
    description: "Protective pacing to prevent burnout",
  },
  strategist: {
    mode: "strategist",
    label: "Strategist Mode",
    icon: "♟️",
    description: "Tactical planning and decision support",
  },
  reflective: {
    mode: "reflective",
    label: "Reflective Mode",
    icon: "💭",
    description: "Consolidation and awareness building",
  },
};

// ── Mode detection ────────────────────────────────────────────────────────

function detectCoachingMode(ctx: CoachingContext): {
  mode: CoachingMode;
  score: number;
} {
  // Signal detection
  const burnoutRisk =
    ctx.synthesis.contradictions.some((c) => c.includes("momentum") || c.includes("burnout")) ||
    (ctx.future.riskFactors?.length ?? 0) >= 2;

  const highMomentum =
    ctx.future.trajectoryStrength >= 60 ||
    ctx.reflection.momentumSignal === "rising";

  const lowConfidence = ctx.confidence.confidenceScore < 50;

  const strongTrajectory =
    ctx.future.trajectoryStrength >= 60 &&
    (ctx.future.likelyCareerEvolution?.length ?? 0) >= 1;

  const highFriction =
    ctx.mission.missionBlocks.length >= 2 ||
    ctx.synthesis.contradictions.some((c) => c.includes("friction") || c.includes("habit"));

  const repeatingPatterns = ctx.vault.recurringPatterns.length >= 2;

  const hasContradictions = ctx.synthesis.contradictions.length >= 1;

  const hasInsightData = ctx.vault.vaultScore >= 30;

  const steadyState =
    !highMomentum &&
    !burnoutRisk &&
    !highFriction &&
    ctx.confidence.decisionStability === "stable" &&
    ctx.reflection.momentumSignal !== "slipping";

  // Score each mode (higher = more relevant)
  const scores: Record<CoachingMode, number> = {
    protector: 0,
    challenger: 0,
    mentor: 0,
    strategist: 0,
    reflective: 0,
  };

  // Protector: high momentum + burnout risk
  if (highMomentum && burnoutRisk) {
    scores.protector = 90 + (ctx.future.riskFactors?.length ?? 0) * 3;
  } else if (burnoutRisk) {
    scores.protector = 60;
  }

  // Challenger: high friction + repeating patterns
  if (highFriction && repeatingPatterns) {
    scores.challenger = 85 + ctx.mission.missionBlocks.length * 3;
  } else if (highFriction) {
    scores.challenger = 60;
  }

  // Mentor: low confidence + strong trajectory
  if (lowConfidence && strongTrajectory) {
    scores.mentor = 80 + Math.round((100 - ctx.confidence.confidenceScore) * 0.3);
  } else if (lowConfidence) {
    scores.mentor = 50;
  }

  // Strategist: has data + contradictions to resolve
  if (hasInsightData && hasContradictions) {
    scores.strategist = 70 + ctx.synthesis.contradictions.length * 5;
  } else if (hasInsightData) {
    scores.strategist = 45;
  }

  // Reflective: steady state fallback
  if (steadyState) {
    scores.reflective = 40;
  } else {
    scores.reflective = Math.min(30, ctx.reflection.progressRate * 0.3);
  }

  // Pick the mode with the highest score
  const sorted = (Object.entries(scores) as [CoachingMode, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  return { mode: sorted[0][0], score: sorted[0][1] };
}

// ── Message generation ────────────────────────────────────────────────────

function generateMentorCoaching(ctx: CoachingContext, score: number) {
  const trajectoryDesc =
    ctx.future.futureIdentity || "a clear direction";
  return {
    coachMessage: `You may not see it yet, but your trajectory is strong. Every signal points toward "${trajectoryDesc}" — and the data shows you're closer than you feel. Trust the path you're building.`,
    focusAdvice: `Focus on small, winnable actions today. Each completed step is proof that your doubt doesn't define your direction. Your confidence will catch up to your capability.`,
    todayCoaching: `Start with one action that feels achievable. Don't aim for perfect — aim for done. Each completion strengthens the evidence that you're on the right track.`,
    warnings: [
      "Don't let low confidence talk you out of pursuing strong-fit opportunities",
      "Overthinking delays progress — set a timer and act before you second-guess",
    ],
    encouragements: [
      `Your trajectory strength of ${ctx.future.trajectoryStrength}% shows real momentum building beneath the surface`,
      `The gap between how you feel and where you're headed will close with consistency`,
      "You've already gathered enough data to trust your direction",
    ],
    blindSpots: [
      "You underestimate how much progress you've actually made",
      "Your internal narrative is more critical than the data supports",
    ],
    growthOpportunities: [
      "Keep taking small risks — each one recalibrates your confidence upward",
      `Explore careers aligned with "${trajectoryDesc}" to close the gap between doubt and certainty`,
    ],
  };
}

function generateProtectorCoaching(ctx: CoachingContext, score: number) {
  return {
    coachMessage: `You're pushing hard — and it's working. But I'm seeing signs that your pace may not be sustainable. Let's protect your momentum by pacing it wisely.`,
    focusAdvice: `Identify one area where you can dial back without losing progress. The goal isn't to stop — it's to build something that lasts.`,
    todayCoaching: `Do one less thing today. Seriously. Protect one hour for rest or reflection. Your trajectory will thank you tomorrow.`,
    warnings: [
      `Burnout risk detected — ${ctx.future.riskFactors?.length || "multiple"} risk factors present`,
      "High momentum + high effort without recovery leads to crash cycles",
      "Watch for declining engagement quality — more isn't always better",
    ],
    encouragements: [
      "Your drive is remarkable — that energy will take you far when channeled sustainably",
      `Strong trajectory (${ctx.future.trajectoryStrength}%) gives you room to pace without losing momentum`,
      "The best performers optimize for consistency, not intensity",
    ],
    blindSpots: [
      "You may not notice the early signs of fatigue until they compound",
      "Rest is not a reward — it's a strategic input to sustained performance",
    ],
    growthOpportunities: [
      "Use this high-momentum period to build systems, not just output",
      "Channel excess energy into reflection — the insights will compound",
    ],
  };
}

function generateChallengerCoaching(ctx: CoachingContext, score: number) {
  const blocks = ctx.mission.missionBlocks;
  const blockDetails = blocks.length > 0
    ? blocks.map((b) => b.detail).filter(Boolean).slice(0, 2).join("; ")
    : "repeated friction points";
  return {
    coachMessage: `You've been hitting the same wall. The pattern is clear — and staying in it won't produce different results. Let's find a new angle.`,
    focusAdvice: `Identify which of these friction points is within your control to change. One shift in approach can unlock the whole system.`,
    todayCoaching: `Pick one friction point and do the opposite of what you'd normally try. A new approach — even a small one — breaks the pattern.`,
    warnings: [
      `Repeating patterns detected: ${ctx.vault.recurringPatterns.slice(0, 2).join(", ") || "persistent friction"}`,
      `Mission blocks (${blocks.length}) suggest systemic issues, not one-time obstacles`,
      "Patterns that repeat without intervention tend to deepen",
    ],
    encouragements: [
      "Pattern awareness is the first breakthrough — you're already past the hardest part",
      "Your willingness to engage with friction is a strength most people avoid",
      `You have ${ctx.vault.majorInsights.length} insights available to inform a new approach`,
    ],
    blindSpots: [
      "You may be treating symptoms rather than the root cause",
      "The approach that got you here may not be the one that gets you there",
    ],
    growthOpportunities: [
      `Explore careers or skills outside your usual pattern — novelty breaks loops`,
      "Consider a different entry point into the same goal",
    ],
  };
}

function generateStrategistCoaching(ctx: CoachingContext, score: number) {    const primary = ctx.synthesis.focusMode;
  const contradictions = ctx.synthesis.contradictions;
  return {
    coachMessage: `You have good data — now let's turn it into a plan. The signals are clear enough to act on, but there are tensions to resolve first. Here's how to navigate them.`,
    focusAdvice: `Your primary focus should be "${primary}". Let's build a tactical plan around it while keeping ${contradictions.length} contradiction${contradictions.length > 1 ? "s" : ""} in check.`,
    todayCoaching: `Take one contradiction and design a small experiment around it. Action clarifies what analysis cannot.`,
    warnings: [
      `${contradictions.length} unresolved contradiction${contradictions.length > 1 ? "s" : ""} could lead to decision paralysis if left unaddressed`,
      `Avoid overplanning — the goal is action with awareness, not perfect certainty`,
    ],
    encouragements: [
      `Your insight vault score (${ctx.vault.vaultScore}%) means you have quality data to work with`,
      `Clear primary focus identified: "${primary}" — this gives direction to your plan`,
      "You're in a strong position to make informed, strategic moves",
    ],
    blindSpots: [
      "You may be waiting for complete clarity before acting — that's a trap",
      "The contradictions you see are normal; they don't mean you're off track",
    ],
    growthOpportunities: [
      `Explore "${primary}"-adjacent careers to test your assumptions`,
      "Use your contradictions as a map — each one points to a growth edge",
    ],
  };
}

function generateReflectiveCoaching(ctx: CoachingContext, score: number) {
  return {
    coachMessage: `You're in a good place. Not everything needs to change right now — sometimes the most valuable thing you can do is notice how far you've come.`,
    focusAdvice: `Take today to consolidate. Review your insights, acknowledge your progress, and let your direction clarify through reflection rather than force.`,
    todayCoaching: `Write down three things that went well recently. That's it. Recognition is a form of progress too.`,
    warnings: [
      "Steady states can slip into stagnation without periodic recalibration",
      "Comfort with stability shouldn't block future exploration",
    ],
    encouragements: [
      `Your progress rate of ${ctx.reflection.progressRate}% shows consistent growth`,
      `${ctx.reflection.winsSummary || "You've built meaningful career intelligence"}`,
      "Stability is a foundation, not a ceiling",
    ],
    blindSpots: [
      "You may not notice opportunities that require stepping out of your current comfort zone",
      "Reflection is valuable, but don't let it replace action indefinitely",
    ],
    growthOpportunities: [
      `Consider: ${ctx.reflection.reflectionPrompt || "What would growth look like without urgency?"}`,
      "Explore one area outside your current focus to keep your perspective fresh",
    ],
  };
}

function generateCoaching(
  mode: CoachingMode,
  ctx: CoachingContext,
  score: number
): {
  coachMessage: string;
  focusAdvice: string;
  warnings: string[];
  encouragements: string[];
  blindSpots: string[];
  growthOpportunities: string[];
  todayCoaching: string;
} {
  switch (mode) {
    case "mentor":
      return generateMentorCoaching(ctx, score);
    case "protector":
      return generateProtectorCoaching(ctx, score);
    case "challenger":
      return generateChallengerCoaching(ctx, score);
    case "strategist":
      return generateStrategistCoaching(ctx, score);
    case "reflective":
      return generateReflectiveCoaching(ctx, score);
  }
}

// ── Coach confidence ──────────────────────────────────────────────────────

function computeCoachConfidence(
  mode: CoachingMode,
  ctx: CoachingContext,
  modeScore: number
): number {
  // Base confidence from mode score
  let confidence = Math.round(modeScore * 0.6);

  // Boost based on data quality
  if (ctx.vault.vaultScore >= 50) confidence += 10;
  if (ctx.synthesis.confidence >= 60) confidence += 5;
  if (ctx.memory.completedQuizzes >= 5) confidence += 5;
  if (ctx.reflection.progressRate >= 50) confidence += 5;

  // Cap
  return Math.min(95, Math.max(30, confidence));
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

function gatherContext(): CoachingContext {
  return {
    vault: getStored<InsightVaultData>("insight-vault") ?? (EMPTY_INSIGHT_VAULT as unknown as InsightVaultData),
    synthesis: getStored<IntelligenceSynthesisData>("intelligence-synthesis") ?? (EMPTY_SYNTHESIS as unknown as IntelligenceSynthesisData),
    future: getFutureSelf(),
    reflection: getStored<ProgressReflectionData>("progress-reflection") ?? (EMPTY_PROGRESS_REFLECTION as unknown as ProgressReflectionData),
    mission: getMissionIntelligence(),
    confidence: getDecisionConfidence(),
    memory: loadJourneyMemory(),
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute full coaching intelligence from current data sources.
 * Returns personalized coaching guidance including mode, message, warnings,
 * encouragements, blind spots, and growth opportunities.
 */
export function computeCoachingIntelligence(): CoachingData {
  const ctx = gatherContext();

  // Detect coaching mode
  const { mode, score } = detectCoachingMode(ctx);

  // Generate coaching content for the detected mode
  const coaching = generateCoaching(mode, ctx, score);

  // Compute coach confidence
  const coachConfidence = computeCoachConfidence(mode, ctx, score);

  return {
    coachingMode: mode,
    ...coaching,
    coachConfidence,
  };
}

/**
 * Get metadata for a coaching mode (label, icon, description).
 */
export function getCoachingModeMeta(mode: CoachingMode): ModeDef {
  return MODE_DEFS[mode];
}
