/**
 * ACTION EXECUTION INTELLIGENCE
 *
 * Answers: "Based on everything known, what should the user actually do in the next 24 hours?"
 *
 * Synthesizes 8 sources to produce a concrete, actionable plan for the next 24 hours
 * with micro-actions, blockers, energy fit, and a fallback.
 *
 * Execution modes (priority ladder):
 *   burnout/high friction   → recovery
 *   high confidence + trajectory → challenge
 *   weak momentum            → tiny
 *   mixed signals            → simplify
 *   no clear signal          → fallback
 *
 * Sources (8):
 *   - intelligence-synthesis → focusMode, contradictions, urgencyLevel, confidence
 *   - mission-intelligence   → missionScore, missionBlocks, missionMomentum
 *   - decision-priority      → focusMode, urgencyLevel, topPriority
 *   - engagement-pulse       → pulseScore, fatigueSignals, energyForecast, recommendedDifficulty
 *   - habit-intelligence     → habitScore, habitStrength, successfulPatterns
 *   - growth-forecast        → trajectoryStrength, confidenceScore, forecastState
 *   - coaching-intelligence  → coachingMode, coachConfidence, todayCoaching
 *   - learning-friction      → frictionScore, frictionAreas
 *
 * No backend. No auth. Pure client-side computation.
 */

import type { IntelligenceSynthesisData } from "./intelligence-synthesis";
import { getMissionIntelligence } from "./mission-intelligence";
import type { MissionIntelligenceData } from "./mission-intelligence";
import { getDecisionPriority } from "./decision-priority";
import type { DecisionPriorityData } from "./decision-priority";
import { getEngagementPulse } from "./engagement-pulse";
import type { EngagementPulseData } from "./engagement-pulse";
import { getHabitIntelligence } from "./habit-intelligence";
import type { HabitIntelligenceData } from "./habit-intelligence";
import type { GrowthForecastData } from "./growth-forecast";
import type { CoachingData } from "./coaching-intelligence";
import { getLearningFriction } from "./learning-friction";
import type { LearningFrictionData } from "./learning-friction";
import { getStored } from "./shared-context";
import {
  EMPTY_SYNTHESIS,
  EMPTY_GROWTH_FORECAST,
  EMPTY_COACHING,
} from "./safe-context";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type ExecutionMode = "recovery" | "challenge" | "tiny" | "simplify" | "fallback";

export interface MicroAction {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  why: string;
}

export interface ActionExecutionData {
  /** The execution mode driving the plan */
  executionMode: ExecutionMode;
  /** Urgency level of today's plan */
  actionUrgency: "low" | "medium" | "high" | "critical";
  /** Narrative plan for the next 24 hours */
  next24HourPlan: string;
  /** 3 micro-actions to execute */
  microActions: MicroAction[];
  /** Blockers or warnings that may prevent execution */
  blockers: string[];
  /** Confidence that the plan will be executed 0–100 */
  executionConfidence: number;
  /** How well the plan fits the user's current energy state */
  energyFit: string;
  /** What to do if user can't execute the main plan */
  fallbackAction: string;
  /** Narrative summary of the execution recommendation */
  executionNarrative: string;
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface ExecutionContext {
  synthesis: IntelligenceSynthesisData;
  mission: MissionIntelligenceData;
  priority: DecisionPriorityData;
  pulse: EngagementPulseData;
  habit: HabitIntelligenceData;
  forecast: GrowthForecastData;
  coaching: CoachingData;
  friction: LearningFrictionData;
}

function gatherContext(): ExecutionContext {
  return {
    // Read pipeline modules from shared store with EMPTY fallbacks
    // to prevent circular dependency chains.
    synthesis: getStored<IntelligenceSynthesisData>("intelligence-synthesis") ??
      (EMPTY_SYNTHESIS as unknown as IntelligenceSynthesisData),
    mission: getMissionIntelligence(),
    priority: getDecisionPriority(),
    pulse: getEngagementPulse(),
    habit: getHabitIntelligence(),
    forecast: getStored<GrowthForecastData>("growth-forecast") ??
      (EMPTY_GROWTH_FORECAST as unknown as GrowthForecastData),
    coaching: getStored<CoachingData>("coaching-intelligence") ??
      (EMPTY_COACHING as unknown as CoachingData),
    friction: getLearningFriction(),
  };
}

// ============================================================================
// EXECUTION MODE DETECTION — Priority Ladder
// ============================================================================

function detectExecutionMode(ctx: ExecutionContext): {
  mode: ExecutionMode;
  reason: string;
} {
  // 1. Burnout / high friction → recovery
  const isBurnout =
    ctx.coaching.coachingMode === "protector" ||
    ctx.pulse.fatigueSignals.some((s) => s.severity === "high") ||
    ctx.synthesis.focusMode === "recover";

  const highFriction = ctx.friction.frictionScore >= 50;

  if (isBurnout || highFriction) {
    const detail = isBurnout
      ? "Burnout signals detected — recovery actions will protect long-term engagement"
      : `High learning friction (${ctx.friction.frictionScore}/100) — micro-recovery breaks the stuck pattern`;
    return { mode: "recovery", reason: detail };
  }

  // 2. High confidence + strong trajectory → challenge
  const highConfidence =
    ctx.forecast.confidenceScore >= 60 && ctx.coaching.coachConfidence >= 65;
  const strongTrajectory = ctx.forecast.trajectoryStrength >= 55;

  if (highConfidence && strongTrajectory) {
    return {
      mode: "challenge",
      reason: `Strong confidence (${ctx.forecast.confidenceScore}/100) aligned with solid trajectory (${ctx.forecast.trajectoryStrength}/100) — this is the time for stretch actions`,
    };
  }

  // 3. Weak momentum → tiny actions
  const lowPulse = ctx.pulse.pulseScore < 40;
  const lowHabit = ctx.habit.habitStrength < 35;
  const weakTrajectory = ctx.forecast.trajectoryStrength < 30;

  if (lowPulse || (lowHabit && weakTrajectory)) {
    return {
      mode: "tiny",
      reason: `Engagement pulse is low (${ctx.pulse.pulseScore}/100)${ctx.habit.habitStrength < 35 ? ` and habit strength is weak (${ctx.habit.habitStrength}/100)` : ""} — tiny actions rebuild momentum without pressure`,
    };
  }

  // 4. Mixed signals → simplify
  const hasContradictions = ctx.synthesis.contradictions.length >= 1;
  const mixedUrgency = ctx.pulse.energyForecast === "declining" && ctx.synthesis.contradictions.length > 0;
  const competingPriorities =
    ctx.priority.focusMode === "maintain" && ctx.synthesis.contradictions.length > 0;

  if (hasContradictions || mixedUrgency || competingPriorities) {
    return {
      mode: "simplify",
      reason: `Mixed signals detected — ${ctx.synthesis.contradictions.length} contradiction(s) and ${ctx.pulse.energyForecast} energy. Narrowing focus prevents decision fatigue`,
    };
  }

  // 5. Fallback: no clear signal
  return {
    mode: "fallback",
    reason: "No dominant signal detected. A 2-minute fallback action keeps you engaged without pressure",
  };
}

// ============================================================================
// URGENCY DETECTION
// ============================================================================

function detectUrgency(ctx: ExecutionContext, mode: ExecutionMode): "low" | "medium" | "high" | "critical" {
  switch (mode) {
    case "recovery":
      return ctx.pulse.fatigueSignals.some((s) => s.severity === "high") ? "high" : "medium";
    case "challenge":
      return "medium";
    case "tiny":
      return "low";
    case "simplify":
      return "medium";
    case "fallback":
      return "low";
  }
}

// ============================================================================
// ENERGY FIT
// ============================================================================

function computeEnergyFit(ctx: ExecutionContext, mode: ExecutionMode): string {
  const pulse = ctx.pulse;
  const forecast = pulse.energyForecast;
  const difficulty = pulse.recommendedDifficulty;

  switch (mode) {
    case "recovery":
      return `Energy forecast is "${forecast}" — recovery actions need minimal effort (${difficulty} difficulty recommended)`;
    case "challenge":
      return `Strong energy signals (${pulse.pulseScore}/100 pulse, "${forecast}" forecast) — energy fit is ideal for challenging work`;
    case "tiny":
      return `Low energy detected (${pulse.pulseScore}/100 pulse) — tiny actions fit your current capacity perfectly`;
    case "simplify":
      return `Mixed energy signals (${pulse.pulseScore}/100 pulse, "${forecast}" forecast) — simplified actions match your current energy without overloading`;
    case "fallback":
      return `Engagement is low (${pulse.pulseScore}/100 pulse) — the fallback action is designed to fit the lowest possible energy state`;
  }
}

// ============================================================================
// NEXT 24-HOUR PLAN GENERATOR
// ============================================================================

function generate24HourPlan(ctx: ExecutionContext, mode: ExecutionMode): string {
  const actionsSummary = ctx.synthesis.primarySignal || "advance your career intelligence";

  switch (mode) {
    case "recovery":
      return `The next 24 hours are about recovery. Your top priority: ${actionsSummary}. Complete the micro-actions below at your own pace — no stretch goals. Each small step rebuilds capacity without adding pressure.`;
    case "challenge":
      return `This is a challenge window. Your top priority: ${actionsSummary}. With strong confidence (${ctx.forecast.confidenceScore}/100) and trajectory (${ctx.forecast.trajectoryStrength}/100), the next 24 hours are ideal for high-impact work. Complete the challenge actions below.`;
    case "tiny":
      return `Start small with ${ctx.synthesis.primarySignal || "a tiny step forward"}. The next 24 hours are about micro-momentum — each tiny action is a win. No pressure, no stretch goals, just forward movement.`;
    case "simplify":
      return `Simplify your focus. ${ctx.synthesis.primarySignal}. The next 24 hours are about narrowing down — pick the single most important action and let the rest wait.`;
    case "fallback":
      return `The next 24 hours need just one thing: a 2-minute action to stay engaged. ${ctx.synthesis.primarySignal}. No decisions, no commitments — just one small step.`;
  }
}

// ============================================================================
// MICRO-ACTION GENERATORS
// ============================================================================

function generateMicroActions(ctx: ExecutionContext, mode: ExecutionMode): MicroAction[] {
  switch (mode) {
    case "recovery":
      return generateRecoveryActions(ctx);
    case "challenge":
      return generateChallengeActions(ctx);
    case "tiny":
      return generateTinyActions(ctx);
    case "simplify":
      return generateSimplifyActions(ctx);
    case "fallback":
      return generateFallbackActions(ctx);
  }
}

function generateRecoveryActions(ctx: ExecutionContext): MicroAction[] {
  return [
    {
      id: "recovery-rest",
      title: "Take a deliberate 5-minute break",
      description: "Step away from career planning. Stretch, breathe, or close your eyes. No career decisions needed right now.",
      estimatedMinutes: 5,
      difficulty: "easy",
      why: "Burnout recovery starts with deliberate rest. A short mental reset prevents extended disengagement.",
    },
    {
      id: "recovery-one-win",
      title: "Write down one career win from this week",
      description: "Jot down one positive career moment — a skill you used, something you learned, or a connection you made.",
      estimatedMinutes: 2,
      difficulty: "easy",
      why: "Brief positive reflection shifts focus from overwhelm to progress, reducing burnout spiral risk.",
    },
    {
      id: "recovery-clear-clutter",
      title: "Dismiss or complete one stale item",
      description: "Pick one notification, stale goal, or incomplete task — either complete it or dismiss it. Reduce mental clutter.",
      estimatedMinutes: 3,
      difficulty: "easy",
      why: "Each unresolved item adds cognitive load. Clearing one reduces friction for tomorrow's actions.",
    },
  ];
}

function generateChallengeActions(ctx: ExecutionContext): MicroAction[] {
  return [
    {
      id: "challenge-milestone",
      title: "Complete one high-impact milestone",
      description: `Your trajectory (${ctx.forecast.trajectoryStrength}/100) supports deep work. Tackle the most important milestone in your current mission.`,
      estimatedMinutes: 25,
      difficulty: "hard",
      why: "Strong confidence + trajectory = peak productivity window. Stretch milestones now compound faster.",
    },
    {
      id: "challenge-deep-comparison",
      title: "Deep-compare 2 career paths",
      description: "Use the comparison tool to evaluate 2 careers side by side. Write down 3 key differences in skills, salary, or lifestyle fit.",
      estimatedMinutes: 20,
      difficulty: "hard",
      why: "Deep comparison builds decision clarity and is most effective when engagement is high.",
    },
    {
      id: "challenge-roadmap",
      title: "Review roadmap for acceleration",
      description: "Check if you can skip or accelerate any roadmap phases. Strong progress may qualify you for a faster track.",
      estimatedMinutes: 15,
      difficulty: "medium",
      why: "Momentum creates opportunities for acceleration. Reviewing now ensures you don't waste time on unnecessary steps.",
    },
  ];
}

function generateTinyActions(ctx: ExecutionContext): MicroAction[] {
  return [
    {
      id: "tiny-view-career",
      title: "View one career page you haven't explored",
      description: "Pick a career you're curious about and spend 2 minutes reading its overview. No decisions needed.",
      estimatedMinutes: 2,
      difficulty: "easy",
      why: "Low-stakes exploration keeps engagement alive without requiring deep focus or commitment.",
    },
    {
      id: "tiny-quiz-questions",
      title: "Answer 2 quiz questions",
      description: "Open the career cognition quiz and answer just 2 questions. That's enough to keep your profile fresh.",
      estimatedMinutes: 3,
      difficulty: "easy",
      why: "Micro-quiz sessions maintain data freshness and build consistency without overwhelming effort.",
    },
    {
      id: "tiny-log-entry",
      title: "Log one progress entry",
      description: "Record one small progress entry in your workspace — even opening a page counts.",
      estimatedMinutes: 2,
      difficulty: "easy",
      why: "The smallest progress entry breaks inertia. One action today makes tomorrow's first step easier.",
    },
  ];
}

function generateSimplifyActions(ctx: ExecutionContext): MicroAction[] {
  const topContradiction = ctx.synthesis.contradictions[0] || "mixed signals";
  return [
    {
      id: "simplify-top-contradiction",
      title: `Write down what "${topContradiction}" means to you`,
      description: "Name the top signal conflict in one sentence. Naming it reduces its power to create indecision.",
      estimatedMinutes: 3,
      difficulty: "easy",
      why: "Labelling a contradiction turns vague unease into a concrete problem, making it easier to resolve.",
    },
    {
      id: "simplify-one-action",
      title: "Pick the single most important action for today",
      description: `From your priority "${ctx.priority.topPriority}", choose exactly one action. Write it down. Do only that.`,
      estimatedMinutes: 2,
      difficulty: "easy",
      why: "Narrowing to one action eliminates decision fatigue and makes forward movement inevitable.",
    },
    {
      id: "simplify-review-habits",
      title: "Review your strongest habit pattern",
      description: `Your strongest habit: "${ctx.habit.successfulPatterns[0] || "consistent engagement"}". How can you lean into it today?`,
      estimatedMinutes: 5,
      difficulty: "easy",
      why: "Leaning into established habits reduces cognitive load during mixed-signal periods.",
    },
  ];
}

function generateFallbackActions(_ctx: ExecutionContext): MicroAction[] {
  return [
    {
      id: "fallback-2min-quiz",
      title: "Answer 1 quiz question (2 minutes)",
      description: "Open the career quiz and answer just one question. That's it. One question is a win.",
      estimatedMinutes: 2,
      difficulty: "easy",
      why: "The 2-minute rule makes it nearly impossible to say no. Micro-actions prevent complete disengagement.",
    },
    {
      id: "fallback-view-career",
      title: "View one career page (2 minutes)",
      description: "Pick any career you're curious about and skim its overview page. No decisions, just browsing.",
      estimatedMinutes: 2,
      difficulty: "easy",
      why: "A single 2-minute view keeps your career awareness alive and can spark unexpected curiosity.",
    },
    {
      id: "fallback-write-one-thing",
      title: "Write one thing you learned recently",
      description: "Jot down one thing you learned about yourself or a career in the past week. One sentence is enough.",
      estimatedMinutes: 2,
      difficulty: "easy",
      why: "Writing one sentence builds reflection without pressure, keeping the learning loop active.",
    },
  ];
}

// ============================================================================
// BLOCKERS
// ============================================================================

function generateBlockers(ctx: ExecutionContext, mode: ExecutionMode): string[] {
  const blockers: string[] = [];

  if (ctx.friction.frictionScore >= 40) {
    blockers.push(`Learning friction is ${ctx.friction.frictionScore}/100 — may make execution feel harder than usual`);
  }
  if (ctx.synthesis.contradictions.length > 0) {
    blockers.push(`${ctx.synthesis.contradictions.length} signal contradiction(s) may create hesitation — pick the simplest action and start without overthinking`);
  }
  if (ctx.pulse.energyForecast === "declining") {
    blockers.push("Energy is forecast to decline — start earlier in the day or split actions into smaller chunks");
  }
  if (ctx.mission.missionBlocks.length > 0) {
    const top = ctx.mission.missionBlocks[0];
    if (top && top.detail) {
      blockers.push(`Mission block: ${top.detail} — address this before it stalls progress`);
    }
  }
  if (ctx.habit.habitStrength < 30) {
    blockers.push(`Habit strength is low (${ctx.habit.habitStrength}/100) — consistency will feel harder, so celebrate every completed action`);
  }

  if (blockers.length === 0) {
    blockers.push("No blockers detected — conditions are favorable for today's plan");
  }

  return blockers;
}

// ============================================================================
// EXECUTION CONFIDENCE
// ============================================================================

function computeExecutionConfidence(ctx: ExecutionContext, mode: ExecutionMode): number {
  let confidence = 65; // baseline

  // Boosters
  if (ctx.coaching.coachConfidence >= 70) confidence += 8;
  if (ctx.forecast.confidenceScore >= 65) confidence += 7;
  if (ctx.pulse.pulseScore >= 60) confidence += 5;
  if (ctx.habit.habitStrength >= 50) confidence += 5;

  // Mode boosters
  if (mode === "challenge") confidence += 5;
  if (mode === "tiny" || mode === "fallback") confidence += 10; // easier to complete

  // Reducers
  if (ctx.friction.frictionScore >= 50) confidence -= 10;
  if (ctx.synthesis.contradictions.length >= 2) confidence -= 8;
  if (ctx.mission.missionBlocks.length >= 2) confidence -= 5;
  if (ctx.pulse.energyForecast === "declining") confidence -= 5;

  return Math.max(20, Math.min(95, confidence));
}

// ============================================================================
// NARRATIVE GENERATOR
// ============================================================================

function generateNarrative(ctx: ExecutionContext, mode: ExecutionMode, plan: string, blockers: string[]): string {
  const primary = ctx.synthesis.primarySignal || "advance your career intelligence";
  const blockersCount = blockers.filter((b) => !b.includes("No blockers")).length;

  const narrativeParts: string[] = [];

  // Opening based on mode
  switch (mode) {
    case "recovery":
      narrativeParts.push(`The data shows you need recovery right now. Your coaching mode is "${ctx.coaching.coachingMode}" and ${ctx.friction.frictionScore >= 50 ? "learning friction is elevated" : "burnout signals are present"}. The best action is the smallest one.`);
      break;
    case "challenge":
      narrativeParts.push(`You're in a strong position. Confidence is ${ctx.forecast.confidenceScore}/100, trajectory is ${ctx.forecast.trajectoryStrength}/100, and your engagement pulse supports deep work. This is the window for meaningful progress.`);
      break;
    case "tiny":
      narrativeParts.push(`Momentum is low right now, but that's temporary. The goal isn't big progress today — it's tiny forward motion. Each micro-action rebuilds capacity.`);
      break;
    case "simplify":
      narrativeParts.push(`You're getting mixed signals from your data. The most powerful response isn't analysis — it's simplification. Pick one thread and pull it.`);
      break;
    case "fallback":
      narrativeParts.push(`No dominant signal stands out today. That's fine — the best move is a micro-action that keeps you in the game without requiring a decision.`);
      break;
  }

  // Add primary signal
  narrativeParts.push(`Your primary focus: "${primary}".`);

  // Blocker awareness
  if (blockersCount > 0) {
    narrativeParts.push(`${blockersCount} potential blocker(s) identified — awareness alone reduces their impact.`);
  }

  // Closing
  narrativeParts.push("The plan below is designed to match your exact current state — each action is calibrated for what you can handle right now.");

  return narrativeParts.join(" ");
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute a fresh action execution plan for the next 24 hours.
 * Synthesizes 8 sources — intelligence-synthesis, mission-intelligence,
 * decision-priority, engagement-pulse, habit-intelligence, growth-forecast,
 * coaching-intelligence, and learning-friction — into a concrete plan
 * with micro-actions, blockers, energy fit, and a fallback.
 */
export function computeActionExecution(): ActionExecutionData {
  const ctx = gatherContext();

  // 1. Detect execution mode
  const { mode } = detectExecutionMode(ctx);

  // 2. Detect urgency
  const actionUrgency = detectUrgency(ctx, mode);

  // 3. Generate 24-hour plan
  const next24HourPlan = generate24HourPlan(ctx, mode);

  // 4. Generate micro-actions
  const microActions = generateMicroActions(ctx, mode);

  // 5. Generate blockers
  const blockers = generateBlockers(ctx, mode);

  // 6. Compute execution confidence
  const executionConfidence = computeExecutionConfidence(ctx, mode);

  // 7. Compute energy fit
  const energyFit = computeEnergyFit(ctx, mode);

  // 8. Generate fallback action
  const fallbackAction = generateFallbackAction(mode);

  // 9. Generate narrative
  const executionNarrative = generateNarrative(ctx, mode, next24HourPlan, blockers);

  return {
    executionMode: mode,
    actionUrgency,
    next24HourPlan,
    microActions,
    blockers,
    executionConfidence,
    energyFit,
    fallbackAction,
    executionNarrative,
  };
}

// ============================================================================
// FALLBACK GENERATOR
// ============================================================================

function generateFallbackAction(mode: ExecutionMode): string {
  switch (mode) {
    case "recovery":
      return "If even recovery actions feel like too much: close the app, take a full rest day, and return tomorrow. One day off preserves long-term engagement.";
    case "challenge":
      return "If the stretch task feels overwhelming: switch to the fallback — answer one quiz question (2 min). Forward movement at any pace beats stagnation.";
    case "tiny":
      return "If you can't start the first tiny action: set a 2-minute timer and open one career page. Just 2 minutes — that's all it takes to break inertia.";
    case "simplify":
      return "If simplifying isn't clicking: do the easiest thing — dismiss one notification or stale item. A clean slate often clarifies priorities naturally.";
    case "fallback":
      return "The ultimate fallback: do nothing career-related for 24 hours. Sometimes the best action is a deliberate pause. You'll return with fresh perspective.";
  }
}
