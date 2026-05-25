/**
 * INTELLIGENCE SYNTHESIS HUB
 *
 * Answers: "What is the single most important thing this user needs right now?"
 *
 * Master engine that synthesises 10 intelligence sources into one unified
 * recommendation with a single dominant focus mode, contradictions summary,
 * risk/opportunity assessment, and 3-step action plan.
 *
 * Sources (10):
 *   - decision-intelligence  → decisionState, confidenceLevel
 *   - growth-forecast        → forecastState, trajectoryStrength, forecastRisks
 *   - future-self            → trajectoryStrength, riskFactors, growthCatalysts
 *   - decision-confidence    → confidenceScore, decisionStability
 *   - mission-intelligence   → missionScore, missionBlocks, missionMomentum
 *   - engagement-pulse       → pulseScore, fatigueSignals
 *   - learning-friction      → frictionScore, frictionAreas
 *   - career-story           → storyArc, momentumScore, chapterTitle
 *   - coaching-intelligence  → coachingMode, coachConfidence, warnings
 *   - insight-vault          → vaultScore, topInsight, identityChanges
 *
 * Priority ladder (first match wins):
 *   1. Burnout + high friction       → Recover
 *   2. High confidence + mission     → Execute
 *   3. Strong trajectory + low action → Focus
 *   4. Mixed signals                 → Recalibrate
 *   5. Low confidence + exploration  → Explore
 *
 * No backend. No auth. Pure client-side computation.
 */

import type { DecisionIntelligenceData } from "./decision-intelligence";
import type { GrowthForecastData } from "./growth-forecast";
import { getFutureSelf } from "./future-self";
import type { FutureSelfData } from "./future-self";
import { getDecisionConfidence } from "./decision-confidence";
import type { DecisionConfidenceData } from "./decision-confidence";
import { getMissionIntelligence } from "./mission-intelligence";
import type { MissionIntelligenceData } from "./mission-intelligence";
import { loadEngagementPulse } from "./engagement-pulse";
import type { EngagementPulseData } from "./engagement-pulse";
import { getLearningFriction } from "./learning-friction";
import type { LearningFrictionData } from "./learning-friction";
import type { CareerStoryData } from "./career-story";
import type { CoachingData } from "./coaching-intelligence";
import type { InsightVaultData } from "./insight-vault";
import { getStored, storeResult, protectExecution } from "./shared-context";
import {
  EMPTY_GROWTH_FORECAST,
  EMPTY_CAREER_STORY,
  EMPTY_COACHING,
  EMPTY_INSIGHT_VAULT,
} from "./safe-context";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type FocusMode = "recover" | "execute" | "focus" | "recalibrate" | "explore";
export type UrgencyLevel = "critical" | "high" | "medium" | "low";

export interface IntelligenceSynthesisData {
  /** The single most important signal driving this recommendation */
  primarySignal: string;
  /** Why this signal matters right now */
  primaryReason: string;
  /** Urgency of the recommendation */
  urgencyLevel: UrgencyLevel;
  /** Confidence in this synthesis (0–100) */
  confidence: number;
  /** The biggest opportunity available right now */
  topOpportunity: string;
  /** The biggest risk requiring attention */
  topRisk: string;
  /** Resolved contradictions that informed the recommendation */
  contradictions: string[];
  /** 3-step action plan */
  actionPlan: string[];
  /** Dominant focus mode */
  focusMode: FocusMode;
  /** One-paragraph narrative summary */
  summaryNarrative: string;
}

// ============================================================================
// FOCUS MODE METADATA
// ============================================================================

interface FocusModeMeta {
  label: string;
  icon: string;
  description: string;
}

const FOCUS_MODE_META: Record<FocusMode, FocusModeMeta> = {
  recover: {
    label: "Recover",
    icon: "🛌",
    description: "Burnout signals and high friction detected — prioritise rest and micro-actions over stretch goals.",
  },
  execute: {
    label: "Execute",
    icon: "🚀",
    description: "Strong confidence and mission alignment — optimal window for high-impact career work.",
  },
  focus: {
    label: "Focus",
    icon: "🎯",
    description: "Strong trajectory but low action — channel momentum into one concentrated effort.",
  },
  recalibrate: {
    label: "Recalibrate",
    icon: "🧭",
    description: "Mixed or contradictory signals — step back, resolve contradictions before committing.",
  },
  explore: {
    label: "Explore",
    icon: "🔍",
    description: "Low confidence with active exploration — gather more data before making decisions.",
  },
};

const URGENCY_META: Record<UrgencyLevel, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-red-400" },
  high: { label: "High", color: "text-amber-400" },
  medium: { label: "Medium", color: "text-sky-400" },
  low: { label: "Low", color: "text-slate-400" },
};

// ============================================================================
// CONTEXT
// ============================================================================

interface HubContext {
  decision: DecisionIntelligenceData;
  forecast: GrowthForecastData;
  future: FutureSelfData;
  confidence: DecisionConfidenceData;
  mission: MissionIntelligenceData;
  pulse: EngagementPulseData;
  friction: LearningFrictionData;
  story: CareerStoryData;
  coaching: CoachingData;
  vault: InsightVaultData;
}

/**
 * Default decision intelligence data used when Decision Intelligence
 * hasn't been computed yet (should not normally happen since the pipeline
 * computes DI first, but provides safety for edge cases).
 */
const DEFAULT_DECISION: DecisionIntelligenceData = {
  decisionState: "explore",
  decisionOptions: [],
  recommendedDecision: "Awaiting pipeline completion",
  decisionReason: "Decision Intelligence data is not yet available — pipeline is still computing.",
  decisionTradeoffs: [],
  confidenceLevel: 50,
  waitSignals: ["Pipeline in progress — results will update momentarily"],
  actionIfYes: "Proceed with current exploration until pipeline completes",
  actionIfNo: "Take a brief pause and check back for updated recommendations",
};

function gatherContext(): HubContext {
  // Read ALL dependencies from shared context store first with EMPTY fallbacks.
  // This breaks all circular dependency chains. The pipeline runs modules in
  // dependency order and stores results — gatherContext() must never call
  // compute functions directly.
  return {
    decision:
      getStored<DecisionIntelligenceData>("decision-intelligence") ??
      DEFAULT_DECISION,
    forecast:
      getStored<GrowthForecastData>("growth-forecast") ??
      (EMPTY_GROWTH_FORECAST as unknown as GrowthForecastData),
    future: getStored<FutureSelfData>("future-self") ?? getFutureSelf(),
    confidence:
      getStored<DecisionConfidenceData>("decision-confidence") ??
      getDecisionConfidence(),
    mission:
      getStored<MissionIntelligenceData>("mission-intelligence") ??
      getMissionIntelligence(),
    pulse:
      getStored<EngagementPulseData>("engagement-pulse") ?? loadEngagementPulse(),
    friction:
      getStored<LearningFrictionData>("learning-friction") ?? getLearningFriction(),
    story: getStored<CareerStoryData>("career-story") ??
      (EMPTY_CAREER_STORY as unknown as CareerStoryData),
    coaching:
      getStored<CoachingData>("coaching-intelligence") ??
      (EMPTY_COACHING as unknown as CoachingData),
    vault: getStored<InsightVaultData>("insight-vault") ??
      (EMPTY_INSIGHT_VAULT as unknown as InsightVaultData),
  };
}

// ============================================================================
// SIGNAL DETECTORS
// ============================================================================

function hasBurnoutWithFriction(ctx: HubContext): boolean {
  const hasBurnout = ctx.pulse.fatigueSignals.some(
    (s) => s.type === "burnout_risk" && (s.severity === "high" || s.severity === "medium")
  );
  const hasHighFriction = ctx.friction.frictionScore >= 50;
  const hasPulseDecline = ctx.pulse.pulseScore < 45;
  return (hasBurnout || hasPulseDecline) && hasHighFriction;
}

function hasConfidenceWithMission(ctx: HubContext): boolean {
  const highConfidence = ctx.confidence.confidenceScore >= 60 || ctx.decision.confidenceLevel >= 60;
  const strongMission = ctx.mission.missionScore >= 55 && ctx.mission.missionBlocks.length <= 1;
  return highConfidence && strongMission;
}

function hasTrajectoryWithLowAction(ctx: HubContext): boolean {
  const strongTrajectory = ctx.forecast.trajectoryStrength >= 55 || ctx.future.trajectoryStrength >= 55;
  const lowAction = ctx.mission.missionMomentum < 40 || (ctx.pulse.pulseScore >= 40 && ctx.pulse.pulseScore < 60);
  return strongTrajectory && lowAction;
}

function hasMixedSignals(ctx: HubContext): boolean {
  const contradictions = ctx.forecast.forecastRisks.length + ctx.coaching.warnings.length + ctx.vault.majorInsights.length;
  const unstableForecast = ctx.forecast.forecastState === "unstable" || ctx.forecast.forecastState === "stalled";
  return contradictions >= 3 || unstableForecast;
}

function hasLowConfidenceWithExploration(ctx: HubContext): boolean {
  const lowConfidence = ctx.confidence.confidenceScore < 45 && ctx.decision.confidenceLevel < 50;
  const exploring = ctx.mission.missionScore < 50 || ctx.future.riskFactors.length >= 2;
  return lowConfidence && exploring;
}

// ============================================================================
// PRIORITY LADDER
// ============================================================================

function resolveFocusMode(ctx: HubContext): FocusMode {
  if (hasBurnoutWithFriction(ctx)) return "recover";
  if (hasConfidenceWithMission(ctx)) return "execute";
  if (hasTrajectoryWithLowAction(ctx)) return "focus";
  if (hasMixedSignals(ctx)) return "recalibrate";
  if (hasLowConfidenceWithExploration(ctx)) return "explore";
  // Default — best guess from coaching mode
  if (ctx.coaching.coachingMode === "mentor") return "explore";
  if (ctx.coaching.coachingMode === "strategist") return "recalibrate";
  if (ctx.coaching.coachingMode === "protector") return "recover";
  return "focus";
}

// ============================================================================
// OUTPUT GENERATORS
// ============================================================================

function computeUrgencyLevel(focusMode: FocusMode, ctx: HubContext): UrgencyLevel {
  switch (focusMode) {
    case "recover":
      return "critical";
    case "execute":
      return ctx.confidence.confidenceScore >= 75 ? "high" : "medium";
    case "focus":
      return ctx.forecast.confidenceScore >= 60 ? "high" : "medium";
    case "recalibrate":
      return "medium";
    case "explore":
      return "low";
  }
}

function computePrimarySignal(focusMode: FocusMode, ctx: HubContext): string {
  switch (focusMode) {
    case "recover": {
      const fatigueCount = ctx.pulse.fatigueSignals.length;
      return `Burnout risk with high friction (${ctx.friction.frictionScore}/100) — ${fatigueCount} fatigue signal${fatigueCount !== 1 ? "s" : ""} active`;
    }
    case "execute":
      return `Strong decision confidence (${ctx.confidence.confidenceScore}/100) aligned with high mission score (${ctx.mission.missionScore}/100)`;
    case "focus": {
      const trajectory = ctx.forecast.trajectoryStrength || ctx.future.trajectoryStrength;
      return `Strong trajectory (${trajectory}/100) but low action momentum (${ctx.mission.missionMomentum}/100) — ready for one concentrated effort`;
    }
    case "recalibrate": {
      const signalCount = ctx.forecast.forecastRisks.length + ctx.coaching.warnings.length + ctx.vault.identityChanges.length;
      return `${signalCount} mixed or contradictory signals — step back for clarity`;
    }
    case "explore":
      return `Low confidence (${ctx.confidence.confidenceScore}/100) with active exploration signals — gather more data before committing`;
  }
}

function computePrimaryReason(focusMode: FocusMode, ctx: HubContext): string {
  switch (focusMode) {
    case "recover":
      return ctx.coaching.coachMessage.length > 200
        ? ctx.coaching.coachMessage.slice(0, 200) + "…"
        : ctx.coaching.coachMessage;
    case "execute":
      return `Your decision confidence (${ctx.confidence.confidenceScore}/100) and mission alignment (${ctx.mission.missionScore}/100) are both strong. This is the optimal window for high-impact career decisions — your signals are aligned and contradictions are minimal.`;
    case "focus":
      return `Your trajectory is strong (${ctx.forecast.trajectoryStrength || ctx.future.trajectoryStrength}/100) but momentum is lagging (${ctx.mission.missionMomentum}/100). The gap suggests you have direction but need a single focused push to convert trajectory into action.`;
    case "recalibrate":
      return `Mixed signals detected across ${ctx.forecast.forecastRisks.length} risk area${ctx.forecast.forecastRisks.length !== 1 ? "s" : ""} and ${ctx.coaching.warnings.length + ctx.vault.identityChanges.length} contradiction${ctx.coaching.warnings.length + ctx.vault.identityChanges.length !== 1 ? "s" : ""}. A structured step-back will resolve which signals matter most.`;
    case "explore":
      return `Low decision confidence (${ctx.confidence.confidenceScore}/100) combined with active exploration means the data isn't conclusive yet. Continue gathering signal through quizzes, career comparisons, and reflection sessions.`;
  }
}

function computeTopOpportunity(focusMode: FocusMode, ctx: HubContext): string {
  switch (focusMode) {
    case "recover":
      return ctx.coaching.growthOpportunities.length > 0
        ? ctx.coaching.growthOpportunities[0]
        : "A recovery period resets your baseline — returning with lower friction and clearer priorities";
    case "execute":
      return ctx.vault.topInsight
        ? ctx.vault.topInsight.title
        : `Mission execution window open — estimated ${ctx.mission.missionScore}/100 alignment with career goals`;
    case "focus":
      return ctx.future.growthCatalysts.length > 0
        ? `Growth catalyst: ${ctx.future.growthCatalysts[0].catalyst} (strength: ${ctx.future.growthCatalysts[0].strength}%)`
        : "A single focused action today can close the trajectory-momentum gap";
    case "recalibrate":
      return ctx.vault.majorInsights.length > 0
        ? `Key insight: ${ctx.vault.majorInsights[0].title}`
        : "A structured contradiction audit reveals which career paths truly align";
    case "explore":
      return "Low-stakes exploration now prevents costly misaligned decisions later — each quiz and comparison adds clarity";
  }
}

function computeTopRisk(focusMode: FocusMode, ctx: HubContext): string {
  const fromForecast = ctx.forecast.forecastRisks.length > 0 ? ctx.forecast.forecastRisks[0] : null;
  const fromCoaching = ctx.coaching.warnings.length > 0 ? ctx.coaching.warnings[0] : null;
  const fromFuture = ctx.future.riskFactors.length > 0
    ? `Future risk: ${ctx.future.riskFactors[0].factor} (severity: ${ctx.future.riskFactors[0].severity})`
    : null;

  switch (focusMode) {
    case "recover":
      return fromCoaching || fromForecast || "Ignoring burnout signals leads to extended disengagement and loss of accumulated momentum";
    case "execute":
      return fromForecast || "High confidence can lead to premature commitment — ensure the decision is backed by data, not just momentum";
    case "focus":
      return fromFuture || fromForecast || "Trajectory without action creates a gap that widens over time — momentum decays faster than trajectory";
    case "recalibrate":
      return fromCoaching || "Mixed signals left unresolved compound over time, making direction-setting progressively harder";
    case "explore":
      return fromFuture || "Extended exploration without periodic synthesis can lead to decision paralysis — set regular reflection checkpoints";
  }
}

function detectContradictions(ctx: HubContext): string[] {
  const contradictions: string[] = [];

  // High confidence + unstable forecast
  if (ctx.confidence.confidenceScore >= 60 && ctx.forecast.forecastState === "unstable") {
    contradictions.push("High decision confidence contradicts an unstable growth forecast — confidence may be premature or the forecast overly pessimistic");
  }

  // Strong trajectory + fatigue
  if ((ctx.future.trajectoryStrength >= 55 || ctx.forecast.trajectoryStrength >= 55) && ctx.pulse.fatigueSignals.length > 0) {
    contradictions.push("Strong career trajectory coexists with active fatigue signals — progress may be masking burnout risk");
  }

  // High vault score + coaching warnings
  if (ctx.vault.vaultScore >= 60 && ctx.coaching.warnings.length >= 2) {
    contradictions.push(`Rich insight vault (score: ${ctx.vault.vaultScore}) but ${ctx.coaching.warnings.length} coaching warnings suggest insight-action gap`);
  }

  // High mission + low trajectory
  if (ctx.mission.missionScore >= 60 && ctx.forecast.trajectoryStrength < 40) {
    contradictions.push("High mission alignment but low trajectory strength — direction is clear but execution path needs reinforcement");
  }

  // Low friction + low confidence
  if (ctx.friction.frictionScore < 35 && ctx.confidence.confidenceScore < 40) {
    contradictions.push("Low learning friction (no barriers) but low confidence — the block is internal, not environmental");
  }

  return contradictions.slice(0, 4);
}

function computeActionPlan(focusMode: FocusMode, ctx: HubContext): string[] {
  const base: string[] = [];

  switch (focusMode) {
    case "recover":
      base.push("Skip all stretch goals today — complete one 2-minute micro-action only");
      base.push("Take a structured break: review your wins summary from the last 7 days to reinforce progress");
      base.push("Return tomorrow with a single, low-effort task — consistency > intensity during recovery");
      break;
    case "execute":
      base.push("Identify the single highest-impact career action for today and complete it first");
      base.push("Use comparison and reflection tools to validate your direction before committing further");
      base.push("Set a 7-day execution checkpoint to review progress and adjust course if needed");
      break;
    case "focus":
      base.push("Choose one career path or milestone to concentrate on for the next 3 days");
      base.push("Complete a deep work session (45+ minutes) on that single focus area");
      base.push("Schedule a reflection session at day 3 to evaluate if the focus is producing results");
      break;
    case "recalibrate":
      base.push("List your top 3 conflicting signals and rank them by importance — discard the weakest signal");
      base.push("Run a structured comparison between your top 2 career options to surface tradeoffs");
      base.push("Set a 5-day decision deadline — recalibration is productive but open-ended exploration is not");
      break;
    case "explore":
      base.push("Complete one career quiz or comparison session to add signal to your exploration data");
      base.push("Review your recent insight vault entries — patterns may already be emerging");
      base.push("Set a 2-week exploration checkpoint to evaluate if enough signal exists for a direction decision");
      break;
  }

  return base;
}

function computeSummaryNarrative(focusMode: FocusMode, ctx: HubContext): string {
  const focusMeta = FOCUS_MODE_META[focusMode];
  const chapter = ctx.story.chapterTitle;
  const momentum = ctx.story.momentumScore;
  const mission = ctx.mission.missionScore;

  const statePhrase =
    momentum >= 60
      ? "momentum is strong"
      : momentum >= 40
        ? "momentum is building"
        : "momentum needs attention";

  const missionPhrase =
    mission >= 60
      ? "mission alignment is solid"
      : mission >= 40
        ? "mission alignment is moderate"
        : "mission alignment needs work";

  return `Primary focus: ${focusMeta.label}. ${chapter} — ${statePhrase}, ${missionPhrase}. ${focusMeta.description} Confidence in this synthesis: ${computeConfidence(ctx)}%.`;
}

function computeConfidence(ctx: HubContext): number {
  let score = 65; // baseline

  // Boost from aligned signals
  if (ctx.confidence.confidenceScore >= 60) score += 8;
  if (ctx.forecast.confidenceScore >= 60) score += 7;
  if (ctx.coaching.coachConfidence >= 65) score += 5;
  if (ctx.vault.vaultScore >= 55) score += 5;
  if (ctx.mission.missionScore >= 55) score += 5;

  // Penalties
  if (ctx.pulse.fatigueSignals.length > 0) score -= 10;
  if (ctx.friction.frictionScore >= 60) score -= 8;
  if (ctx.forecast.forecastRisks.length >= 3) score -= 7;
  if (ctx.forecast.forecastState === "unstable") score -= 8;
  if (ctx.forecast.forecastState === "stalled") score -= 5;

  return Math.max(20, Math.min(95, Math.round(score)));
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute the full intelligence synthesis hub — the single most important
 * thing this user needs right now.
 */
/**
 * Core implementation of intelligence synthesis computation.
 * Separated from the public API so the pipeline can call it
 * without cycle protection overhead.
 */
function computeIntelligenceSynthesisImpl(): IntelligenceSynthesisData {
  const ctx = gatherContext();

  // Resolve the dominant focus mode via priority ladder
  const focusMode = resolveFocusMode(ctx);

  // Compute all outputs
  const urgencyLevel = computeUrgencyLevel(focusMode, ctx);
  const primarySignal = computePrimarySignal(focusMode, ctx);
  const primaryReason = computePrimaryReason(focusMode, ctx);
  const topOpportunity = computeTopOpportunity(focusMode, ctx);
  const topRisk = computeTopRisk(focusMode, ctx);
  const contradictions = detectContradictions(ctx);
  const actionPlan = computeActionPlan(focusMode, ctx);
  const confidence = computeConfidence(ctx);
  const summaryNarrative = computeSummaryNarrative(focusMode, ctx);

  return {
    primarySignal,
    primaryReason,
    urgencyLevel,
    confidence,
    topOpportunity,
    topRisk,
    contradictions,
    actionPlan,
    focusMode,
    summaryNarrative,
  };
}

/**
 * Compute the full intelligence synthesis hub — the single most important
 * thing this user needs right now.
 *
 * Uses shared context to read decision intelligence data (breaking the
 * circular dependency with decision-intelligence).
 */
export function computeIntelligenceSynthesis(): IntelligenceSynthesisData {
  return protectExecution("intelligence-synthesis", () => {
    // Always compute fresh — caching is handled by pipeline.ts.
    // This ensures that when the pipeline calls this after Phase 3 (DI),
    // it always uses the latest DI data available in the shared store.
    const result = computeIntelligenceSynthesisImpl();
    storeResult("intelligence-synthesis", result);
    return result;
  })!;
}

/**
 * Get metadata for a focus mode (label, icon, description).
 */
export function getFocusModeMeta(mode: FocusMode): FocusModeMeta {
  return FOCUS_MODE_META[mode];
}

/**
 * Get metadata for an urgency level (label, color).
 */
export function getUrgencyMeta(level: UrgencyLevel): { label: string; color: string } {
  return URGENCY_META[level];
}
