/**
 * DECISION INTELLIGENCE ENGINE
 *
 * Answers: "What decision should the user make now?"
 *
 * Synthesizes 8 sources to detect the user's decision state and generate
 * a concrete recommendation with tradeoffs, wait signals, and conditional
 * next actions.
 *
 * Sources:
 *   - coaching-intelligence  → coaching mode, coach confidence, blind spots
 *   - insight-vault          → vault score, major insights, patterns
 *   - intelligence-synthesis → contradictions, urgent signals, focus
 *   - decision-confidence    → confidence score, stability, exploration readiness
 *   - future-self            → trajectory strength, risk factors, catalysts
 *   - mission-intelligence   → mission score, mission blocks, alignment
 *   - action-execution       → execution mode, completion probability, fallback
 *   - journey-memory         → confidence history, quiz counts, uncertainty
 *
 * Decision states:
 *   double-down  → strong mission alignment + no contradictions
 *   commit       → high confidence + strong trajectory
 *   explore      → low confidence + contradictions present
 *   pause        → burnout + low exploration readiness
 *   recalibrate  → mixed signals, contradictions, uncertainty
 *
 * No backend. No auth. Pure client-side computation.
 */

import type { CoachingData } from "./coaching-intelligence";
import type { InsightVaultData } from "./insight-vault";
import type { IntelligenceSynthesisData } from "./intelligence-synthesis";
import { getDecisionConfidence } from "./decision-confidence";
import type { DecisionConfidenceData } from "./decision-confidence";
import { getFutureSelf } from "./future-self";
import type { FutureSelfData } from "./future-self";
import { getMissionIntelligence } from "./mission-intelligence";
import type { MissionIntelligenceData } from "./mission-intelligence";
import type { ActionExecutionData } from "./action-execution";
import { loadJourneyMemory } from "./journey-memory";
import type { JourneyMemory } from "./journey-memory";
import { getStored, storeResult, protectExecution } from "./shared-context";
import {
  EMPTY_INSIGHT_VAULT,
  EMPTY_ACTION_EXECUTION,
} from "./safe-context";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type DecisionState = "commit" | "explore" | "pause" | "double-down" | "recalibrate";

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  upsides: string[];
  downsides: string[];
  fitScore: number; // 0–100 how well this option fits the user's state
}

export interface DecisionIntelligenceData {
  /** The overall decision state */
  decisionState: DecisionState;
  /** 2–3 discrete decision options */
  decisionOptions: DecisionOption[];
  /** The engine's best recommendation */
  recommendedDecision: string;
  /** Why this decision is recommended right now */
  decisionReason: string;
  /** Key tradeoffs (pros/cons pairs) */
  decisionTradeoffs: { pro: string; con: string }[];
  /** Confidence in this recommendation 0–100 */
  confidenceLevel: number;
  /** Signals to watch before/after deciding */
  waitSignals: string[];
  /** Concrete first step if user says yes */
  actionIfYes: string;
  /** Concrete alternative if user hesitates */
  actionIfNo: string;
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface DecisionContext {
  vault: InsightVaultData;
  synthesis: IntelligenceSynthesisData;
  confidence: DecisionConfidenceData;
  future: FutureSelfData;
  mission: MissionIntelligenceData;
  execution: ActionExecutionData;
  memory: JourneyMemory;
}

// ── Decision state metadata ─────────────────────────────────────────────

interface StateDef {
  state: DecisionState;
  label: string;
  icon: string;
  description: string;
}

const STATE_DEFS: Record<DecisionState, StateDef> = {
  "double-down": {
    state: "double-down",
    label: "Double Down",
    icon: "🎯",
    description: "Strong mission alignment — go deeper on current focus",
  },
  commit: {
    state: "commit",
    label: "Commit",
    icon: "🚀",
    description: "High confidence and strong trajectory — commit to the path",
  },
  explore: {
    state: "explore",
    label: "Explore",
    icon: "🔍",
    description: "Low confidence with contradictions — explore before deciding",
  },
  pause: {
    state: "pause",
    label: "Pause",
    icon: "⏸️",
    description: "Burnout risk or low readiness — pause and recover first",
  },
  recalibrate: {
    state: "recalibrate",
    label: "Recalibrate",
    icon: "🔄",
    description: "Mixed signals — adjust direction before committing",
  },
};

// ============================================================================
// DECISION STATE DETECTION
// ============================================================================

function detectDecisionState(ctx: DecisionContext): {
  state: DecisionState;
  reason: string;
} {
  // Detect signals
  const strongMissionAlignment =
    ctx.mission.missionScore >= 60 &&
    ctx.mission.missionBlocks.length === 0 &&
    ctx.mission.missionMomentum >= 50;

  const highConfidence = ctx.confidence.confidenceScore >= 65;
  const strongTrajectory = ctx.future.trajectoryStrength >= 60;

  const lowConfidence = ctx.confidence.confidenceScore < 50;
  const hasContradictions = ctx.synthesis.contradictions.length >= 1;

  const burnoutRisk =
    ctx.synthesis.contradictions.some((c) => c.includes("momentum") || c.includes("burnout")) ||
    ctx.execution.executionMode === "recovery";

  const lowReadiness = ctx.confidence.explorationReadiness < 40;

  const hasMixedSignals =
    ctx.synthesis.contradictions.length >= 1 ||
    ctx.confidence.decisionStability === "fluctuating";

  const hasUncertaintyPatterns =
    ctx.memory.uncertaintyPatterns.retakes >= 2 ||
    ctx.memory.uncertaintyPatterns.lowConfidenceMatches >= 2;

  // Priority order: double-down > pause > explore > commit > recalibrate

  // 1. Double-down: strong mission alignment + no contradictions
  if (strongMissionAlignment && !hasContradictions && ctx.vault.vaultScore >= 40) {
    return {
      state: "double-down",
      reason: `Strong mission alignment (${ctx.mission.missionScore}/100) with clean signals — your current focus has clear momentum and no contradictory signals. This is the optimal time to deepen investment in your chosen direction.`,
    };
  }

  // 2. Pause: burnout risk + low readiness
  if (burnoutRisk && lowReadiness) {
    return {
      state: "pause",
      reason: `Burnout signals detected alongside low exploration readiness (${ctx.confidence.explorationReadiness}/100). Pushing forward now risks compounding fatigue. A deliberate pause protects your long-term trajectory.`,
    };
  }

  // 3. Explore: low confidence + contradictions
  if (lowConfidence && (hasContradictions || hasUncertaintyPatterns)) {
    return {
      state: "explore",
      reason: `Low confidence (${ctx.confidence.confidenceScore}/100) combined with ${ctx.synthesis.contradictions.length} unresolved contradiction${ctx.synthesis.contradictions.length !== 1 ? "s" : ""}. More information is needed before committing — exploration will surface clearer signals.`,
    };
  }

  // 4. Commit: high confidence + strong trajectory
  if (highConfidence && strongTrajectory) {
    return {
      state: "commit",
      reason: `Strong confidence (${ctx.confidence.confidenceScore}/100) aligned with a solid trajectory (${ctx.future.trajectoryStrength}/100). All signals point toward committing to your current path with conviction.`,
    };
  }

  // 5. Recalibrate: mixed signals but not extreme enough for other states
  if (hasMixedSignals || hasUncertaintyPatterns) {
    return {
      state: "recalibrate",
      reason: `Mixed signals detected — ${ctx.synthesis.contradictions.length > 0 ? ctx.synthesis.contradictions.length + " contradiction(s)" : ""}${ctx.synthesis.contradictions.length > 0 && hasUncertaintyPatterns ? " and " : ""}${hasUncertaintyPatterns ? "uncertainty patterns" : ""} suggest a course adjustment before full commitment.`,
    };
  }

  // Fallback: reassess
  return {
    state: "recalibrate",
    reason: "No strong directional signals detected. A recalibration session will help clarify your next move by reviewing available data.",
  };
}

// ============================================================================
// DECISION OPTIONS GENERATORS
// ============================================================================

function generateDecisionOptions(
  state: DecisionState,
  ctx: DecisionContext
): DecisionOption[] {
  switch (state) {
    case "double-down":
      return generateDoubleDownOptions(ctx);
    case "commit":
      return generateCommitOptions(ctx);
    case "explore":
      return generateExploreOptions(ctx);
    case "pause":
      return generatePauseOptions(ctx);
    case "recalibrate":
      return generateRecalibrateOptions(ctx);
  }
}

function generateDoubleDownOptions(ctx: DecisionContext): DecisionOption[] {
  return [
    {
      id: "deepen-mission",
      label: "Deepen Mission Engagement",
      description: "Invest more time in your current mission — tackle advanced milestones and stretch goals while alignment is strong.",
      upsides: [
        "Compounds momentum during high-alignment window",
        "Accelerates career progression in a well-matched direction",
        "Builds specialized expertise faster",
      ],
      downsides: [
        "May narrow exploration too early",
        "Could miss emerging opportunities in adjacent areas",
      ],
      fitScore: 92,
    },
    {
      id: "accelerate-roadmap",
      label: "Accelerate Roadmap Progress",
      description: "Review your career roadmap for phases you can skip or fast-track given your strong alignment.",
      upsides: [
        "Shortens time to career milestone completion",
        "Leverages existing momentum for faster progress",
        "Reveals opportunities for compressed timelines",
      ],
      downsides: [
        "Skipping phases may leave gaps in preparation",
        "Fast-tracking requires sustained high effort",
      ],
      fitScore: 78,
    },
  ];
}

function generateCommitOptions(ctx: DecisionContext): DecisionOption[] {
  return [
    {
      id: "commit-path",
      label: "Commit to Current Path",
      description: "Double down on your chosen career direction with a structured commitment plan — set milestones, track progress, and reduce exploration scope.",
      upsides: [
        "Focuses energy on a single, high-confidence direction",
        "Eliminates decision fatigue from keeping options open",
        "Builds deep expertise faster than broad exploration",
      ],
      downsides: [
        "Reduces flexibility to pivot if conditions change",
        "May create sunk-cost attachment to a suboptimal path",
      ],
      fitScore: 88,
    },
    {
      id: "test-commitment",
      label: "Test Commitment with a Trial Period",
      description: "Set a 30-day trial period where you fully commit to this direction. Reassess at the end with fresh data.",
      upsides: [
        "Reduces the psychological weight of a permanent decision",
        "Generates concrete data on whether this path fits",
        "Preserves optionality while still focusing effort",
      ],
      downsides: [
        "May not be enough time to see real results",
        "Trial mindset can reduce full engagement",
      ],
      fitScore: 75,
    },
  ];
}

function generateExploreOptions(ctx: DecisionContext): DecisionOption[] {
  return [
    {
      id: "broaden-exploration",
      label: "Broaden Career Exploration",
      description: "Explore 3–5 new career categories you haven't considered. Cast a wider net before narrowing down.",
      upsides: [
        "Surfaces unexpected career fits you'd otherwise miss",
        "Builds a more complete picture of the landscape",
        "Low pressure — no commitment required",
      ],
      downsides: [
        "Can feel unfocused without a structured approach",
        "May increase rather than reduce uncertainty initially",
      ],
      fitScore: 82,
    },
    {
      id: "deepen-understanding",
      label: "Deepen Understanding of Top Options",
      description: "Take your top 2–3 career matches and research them in depth — day-to-day realities, salary ranges, skill requirements, and growth trajectories.",
      upsides: [
        "Builds concrete knowledge for informed comparison",
        "Resolves uncertainty through detailed information",
        "Creates clear decision criteria for choosing",
      ],
      downsides: [
        "May reinforce existing biases if not done objectively",
        "Time-intensive compared to broad exploration",
      ],
      fitScore: 79,
    },
    {
      id: "quiz-retake",
      label: "Retake Career Assessment",
      description: "Complete the career cognition quiz again — your preferences may have shifted, and fresh data will produce more accurate recommendations.",
      upsides: [
        "Updates your profile with current preferences",
        "Quick and low-effort way to gather new signals",
        "May reveal confidence shifts you weren't aware of",
      ],
      downsides: [
        "Results may not change significantly if preferences are stable",
        "Repeated retakes can lead to diminishing returns",
      ],
      fitScore: 70,
    },
  ];
}

function generatePauseOptions(ctx: DecisionContext): DecisionOption[] {
  return [
    {
      id: "full-rest",
      label: "Full Recovery Day",
      description: "Take a complete break from career planning. Close the app, rest, and return tomorrow with fresh energy.",
      upsides: [
        "Allows full mental recovery without partial engagement",
        "Prevents burnout from compounding",
        "Often leads to clearer insights after the break",
      ],
      downsides: [
        "May feel unproductive or guilty for taking time off",
        "Breaks current streak momentum",
      ],
      fitScore: 90,
    },
    {
      id: "light-reflection",
      label: "Light Reflection Session",
      description: "Spend 5 minutes writing down what's been going well and what feels heavy. No decisions — just awareness.",
      upsides: [
        "Low-effort way to stay connected to your journey",
        "Builds self-awareness without pressure",
        "Can reveal root causes of burnout",
      ],
      downsides: [
        "May not provide enough disengagement for true recovery",
        "Reflection can sometimes amplify negative feelings",
      ],
      fitScore: 75,
    },
  ];
}

function generateRecalibrateOptions(ctx: DecisionContext): DecisionOption[] {
  return [
    {
      id: "resolve-contradictions",
      label: "Resolve Signal Contradictions",
      description: `Address ${ctx.synthesis.contradictions.length} conflicting signal${ctx.synthesis.contradictions.length !== 1 ? "s" : ""} by examining each contradiction and what action it points toward.`,
      upsides: [
        "Clears confusion by naming specific tensions",
        "Each resolved contradiction increases decision clarity",
        "Builds a more reliable signal foundation",
      ],
      downsides: [
        "Contradictions may reflect genuine complexity, not resolvable confusion",
        "Analysis paralysis risk if over-examined",
      ],
      fitScore: 85,
    },
    {
      id: "compare-top-paths",
      label: "Structured Comparison of Top Paths",
      description: "Use the comparison tool to evaluate your top 2 career paths side by side with written pros, cons, and fit scores.",
      upsides: [
        "Structured format reduces emotional decision-making",
        "Surface tradeoffs that aren't obvious from separate evaluations",
        "Creates a clear decision document for later reference",
      ],
      downsides: [
        "May oversimplify complex career decisions",
        "Comparison depends on having accurate data for both paths",
      ],
      fitScore: 80,
    },
    {
      id: "coach-session",
      label: "Review Coaching Intelligence",
      description: "Review the coaching guidance — it's designed for exactly this kind of recalibration moment.",
      upsides: [
        "Leverages existing intelligence rather than starting from scratch",
        "Coaching is specifically calibrated to your current state",
        "Quick win that builds on previous analysis",
      ],
      downsides: [
        "May not surface information you haven't already seen",
        "Coaching insights may be limited by available data",
      ],
      fitScore: 73,
    },
  ];
}

// ============================================================================
// TRADEOFFS & SIGNALS
// ============================================================================

function generateTradeoffs(
  state: DecisionState,
  ctx: DecisionContext
): { pro: string; con: string }[] {
  switch (state) {
    case "double-down":
      return [
        { pro: "Strong mission alignment maximizes ROI on effort", con: "May narrow focus too early and miss emerging opportunities" },
        { pro: `Mission momentum at ${ctx.mission.missionMomentum}/100 supports deep work`, con: "High focus limits serendipitous discovery" },
        { pro: "Fewer contradictions mean cleaner decision-making", con: "Deepening in one area increases switching costs later" },
      ];
    case "commit":
      return [
        { pro: "Commitment focuses energy and eliminates decision fatigue", con: "Reduces flexibility if conditions or preferences change" },
        { pro: `Strong confidence (${ctx.confidence.confidenceScore}/100) supports conviction`, con: "Confidence may not account for unknown unknowns" },
        { pro: "Clear direction accelerates skill-building and progress", con: "May create sunk-cost attachment to the chosen path" },
      ];
    case "explore":
      return [
        { pro: `Low confidence (${ctx.confidence.confidenceScore}/100) means more data is needed before committing`, con: "Extended exploration can delay meaningful progress" },
        { pro: "Exploration broadens awareness and surfaces hidden options", con: "Too many options can increase rather than reduce uncertainty" },
        { pro: "No commitment pressure reduces decision anxiety", con: "Without structure, exploration becomes aimless browsing" },
      ];
    case "pause":
      return [
        { pro: "Rest prevents burnout from compounding into extended disengagement", con: "Pausing breaks current momentum and streak" },
        { pro: `Low readiness (${ctx.confidence.explorationReadiness}/100) means decisions made now would be poor quality`, con: "Recovery time may feel like lost progress" },
        { pro: "Strategic pauses often lead to clearer insights afterward", con: "May be hard to return if pause extends indefinitely" },
      ];
    case "recalibrate":
      return [
        { pro: "Addressing contradictions now prevents poor decisions later", con: "Over-analysis can lead to decision paralysis" },
        { pro: `Correcting course early is less costly than after full commitment`, con: "Recalibration without clear signals can feel like spinning" },
        { pro: "Awareness of mixed signals is itself valuable intelligence", con: "Uncertainty may persist even after analysis" },
      ];
  }
}

function generateWaitSignals(
  state: DecisionState,
  ctx: DecisionContext
): string[] {
  const signals: string[] = [];

  switch (state) {
    case "double-down":
      if (ctx.synthesis.contradictions.length > 0) {
        signals.push("Watch for contradictions that may challenge the current direction as you deepen engagement");
      }
      signals.push("Monitor for burnout signals — strong engagement can tip into overextension");
      signals.push("Reassess after completing 2–3 milestones to confirm alignment holds");
      break;

    case "commit":
      if (ctx.confidence.decisionStability === "fluctuating") {
        signals.push("Monitor confidence stability — fluctuating confidence may need revisiting soon");
      }
      signals.push("Set a 30-day review checkpoint to validate the commitment decision");
      if (ctx.mission.missionBlocks.length > 0) {
        signals.push(`Address ${ctx.mission.missionBlocks.length} mission block(s) early to prevent them from stalling progress`);
      }
      break;

    case "explore":
      signals.push("Track whether exploration is reducing or increasing uncertainty each session");
      signals.push("Watch for recurring themes across explored careers — patterns signal genuine preferences");
      if (ctx.memory.uncertaintyPatterns.retakes >= 3) {
        signals.push("Frequent retakes without convergence suggest deeper uncertainty — consider a coaching session");
      }
      break;

    case "pause":
      signals.push("Return when exploration readiness exceeds 50 — a sign you're ready to re-engage");
      signals.push("Watch for natural curiosity signals rather than forcing re-engagement");
      signals.push("One small action (2 min) can test readiness without full commitment");
      break;

    case "recalibrate":
      signals.push("Resolution of the top contradiction is the clearest signal that recalibration is complete");
      signals.push("If contradictions persist beyond 3 sessions, deeper coaching support may be needed");
      signals.push("Stable confidence for 2+ sessions after recalibration signals readiness to commit");
      break;
  }

  return signals;
}

// ============================================================================
// ACTION GENERATORS
// ============================================================================

function generateActionIfYes(state: DecisionState, ctx: DecisionContext): string {
  switch (state) {
    case "double-down":
      return `Open your current mission (\"${ctx.mission.activeMission.title || "current focus"}\") and commit to completing the next milestone this week. Set a specific deadline and block time for it.`;
    case "commit":
      return "Write down your career decision in one clear sentence. Then share it with someone you trust — commitment that's articulated and witnessed is 40% more likely to stick.";
    case "explore":
      return "Open the career browser and explore 3 careers from a category you haven't visited before. Take notes on 3 things that surprise you about each one.";
    case "pause":
      return "Close the app. Set a reminder to check back tomorrow. No career decisions needed for the rest of the day. Rest is productive.";
    case "recalibrate":
      return `Start with the most urgent contradiction: \"${ctx.synthesis.contradictions[0] || "mixed signals"}\". Write down what each side of the contradiction is telling you, then decide on one small action that addresses both.`;
  }
}

function generateActionIfNo(state: DecisionState, ctx: DecisionContext): string {
  switch (state) {
    case "double-down":
      return "If you're not ready to double down: run a comparison between your current path and one alternative. Seeing them side by side may surface what's holding you back.";
    case "commit":
      return "If commitment feels too final: set a 7-day 'trial focus' instead. Tell yourself you're not committing — you're just testing. Revisit the decision in a week.";
    case "explore":
      return "If exploration feels aimless: retake the career quiz. Fresh assessment data will guide your exploration toward careers that fit your current preferences.";
    case "pause":
      return "If you can't fully disconnect: do one 2-minute recovery action — write one thing that went well this week. That's enough. Then stop.";
    case "recalibrate":
      return "If recalibration isn't clicking: take a step back and list the top 3 contradictions you're feeling. Organizing them often clarifies which deserves priority.";
  }
}

// ============================================================================
// CONFIDENCE LEVEL
// ============================================================================

function computeConfidenceLevel(
  state: DecisionState,
  ctx: DecisionContext
): number {
  let level = 70; // baseline

  // Boost from aligned signals
  if (ctx.vault.vaultScore >= 60) level += 7;
  if (ctx.confidence.confidenceScore >= 60) level += 5;
  if (    ctx.synthesis.confidence >= 60) level += 5;

  // Penalties from conflicting signals
  if (ctx.synthesis.contradictions.length >= 2) level -= 10;
  if (ctx.execution.executionMode === "recovery") level -= 10;
  if (ctx.mission.missionBlocks.length >= 2) level -= 5;

  // State-specific adjustments
  switch (state) {
    case "double-down":
      level += 5; // clean signals = highest confidence
      break;
    case "commit":
      level += 3; // good signals
      break;
    case "explore":
      level -= 3; // uncertainty reduces confidence
      break;
    case "pause":
      level -= 5; // incomplete data
      break;
    case "recalibrate":
      level -= 8; // most uncertainty
      break;
  }

  return Math.max(20, Math.min(95, level));
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

/**
 * Default synthesis data used when Intelligence Synthesis hasn't been
 * computed yet (first pass of the pipeline).
 * Provides safe fallback values that won't crash downstream consumers.
 */
const DEFAULT_SYNTHESIS: IntelligenceSynthesisData = {
  primarySignal: "Awaiting synthesis computation",
  primaryReason: "Intelligence Synthesis data is not yet available — this will update after the pipeline completes.",
  urgencyLevel: "low",
  confidence: 50,
  topOpportunity: "Pipeline completion will reveal current opportunities",
  topRisk: "No risks assessed yet — data pipeline still in progress",
  contradictions: [],
  actionPlan: ["Wait for the intelligence pipeline to complete", "Data will be available momentarily"],
  focusMode: "explore",
  summaryNarrative: "Intelligence Synthesis data is being computed — check back after pipeline completion.",
};

function gatherContext(): DecisionContext {
  // Read dependencies from shared context store first.
  // If a module hasn't been computed yet (e.g., during pipeline Phase 3),
  // fall back to computing it directly or using default data.
  //
  // This breaks the circular dependency between decision-intelligence and
  // intelligence-synthesis because synthesis is only read from the store,
  // never imported and called directly.
  return {
    vault: getStored<InsightVaultData>("insight-vault") ??
      (EMPTY_INSIGHT_VAULT as unknown as InsightVaultData),
    synthesis:
      getStored<IntelligenceSynthesisData>("intelligence-synthesis") ??
      DEFAULT_SYNTHESIS,
    confidence:
      getStored<DecisionConfidenceData>("decision-confidence") ??
      getDecisionConfidence(),
    future: getStored<FutureSelfData>("future-self") ?? getFutureSelf(),
    mission:
      getStored<MissionIntelligenceData>("mission-intelligence") ??
      getMissionIntelligence(),
    execution:
      getStored<ActionExecutionData>("action-execution") ??
      (EMPTY_ACTION_EXECUTION as unknown as ActionExecutionData),
    memory: getStored<JourneyMemory>("journey-memory") ?? loadJourneyMemory(),
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute full decision intelligence from current data sources.
 * Returns the best decision recommendation with options, tradeoffs,
 * wait signals, and conditional next actions.
 */
/**
 * Core implementation of decision intelligence computation.
 * Separated from the public API to allow the pipeline to call
 * it directly without cycle protection interference.
 */
function computeDecisionIntelligenceImpl(): DecisionIntelligenceData {
  const ctx = gatherContext();

  // Detect decision state
  const { state, reason } = detectDecisionState(ctx);

  // Generate decision options
  const decisionOptions = generateDecisionOptions(state, ctx);

  // Generate tradeoffs and wait signals
  const decisionTradeoffs = generateTradeoffs(state, ctx);
  const waitSignals = generateWaitSignals(state, ctx);

  // Compute confidence
  const confidenceLevel = computeConfidenceLevel(state, ctx);

  // Generate actions
  const actionIfYes = generateActionIfYes(state, ctx);
  const actionIfNo = generateActionIfNo(state, ctx);

  // Pick the best recommendation from options
  const bestOption = [...decisionOptions].sort(
    (a, b) => b.fitScore - a.fitScore
  )[0];
  const recommendedDecision = bestOption?.label ?? "Review available options";
  const decisionReason = reason;

  return {
    decisionState: state,
    decisionOptions,
    recommendedDecision,
    decisionReason,
    decisionTradeoffs,
    confidenceLevel,
    waitSignals,
    actionIfYes,
    actionIfNo,
  };
}

/**
 * Compute full decision intelligence from current data sources.
 * Returns the best decision recommendation with options, tradeoffs,
 * wait signals, and conditional next actions.
 *
 * Uses shared context to read synthesis data (breaking the circular
 * dependency with intelligence-synthesis). If called before the
 * pipeline completes, synthesis data defaults to safe empty values.
 */
export function computeDecisionIntelligence(): DecisionIntelligenceData {
  return protectExecution("decision-intelligence", () => {
    // Always compute fresh — caching is handled by pipeline.ts via
    // storeResult(). This ensures the two-pass pipeline works correctly:
    // Phase 3 computes DI without synthesis, Phase 4 computes IS,
    // Phase 5 recomputes DI with the real synthesis data from Phase 4.
    const result = computeDecisionIntelligenceImpl();
    storeResult("decision-intelligence", result);
    return result;
  })!;
}

/**
 * Get metadata for a decision state (label, icon, description).
 */
export function getDecisionStateMeta(state: DecisionState): StateDef {
  return STATE_DEFS[state];
}
