/**
 * CAREER ALIGNMENT INTELLIGENCE
 *
 * Answers: "Is the user moving toward the right path or drifting away?"
 *
 * Detects alignment signals from career-momentum, future-self, decision-confidence,
 * mission-intelligence, personal-evolution, journey-memory, and achievement-engine.
 *
 * Behavior:
 *   alignmentScore >= 65 → reinforce direction
 *   alignmentScore <  40 → correction actions
 *
 * No backend. No auth. All data is local.
 */

import { getCareerMomentum } from "./career-momentum";
import { getFutureSelf } from "./future-self";
import { getDecisionConfidence } from "./decision-confidence";
import { getMissionIntelligence } from "./mission-intelligence";
import { getPersonalEvolution } from "./personal-evolution";
import { loadJourneyMemory } from "./journey-memory";
import { loadAchievements, computeAchievements } from "./achievement-engine";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface AlignmentSignal {
  label: string;
  value: number; // 0–100, higher = more positive alignment
  source: string;
}

export interface DriftSignal {
  label: string;
  severity: "high" | "medium" | "low";
  detail: string;
  source: string;
}

export interface CorrectionAction {
  action: string;
  reason: string;
  difficulty: "easier" | "moderate" | "challenging";
}

export interface CareerAlignmentData {
  /** Overall alignment score 0–100 */
  alignmentScore: number;
  /** Trend direction */
  alignmentTrend: "converging" | "stable" | "drifting" | "diverging";
  /** Positive signals showing path alignment */
  alignmentSignals: AlignmentSignal[];
  /** Negative signals showing drift */
  driftSignals: DriftSignal[];
  /** Description of the career fit direction */
  careerFitDirection: string;
  /** Ranked contributions from each source */
  alignmentDrivers: AlignmentSignal[];
  /** Correction recommendations when alignment is low */
  correctionActions: CorrectionAction[];
  /** Narrative summary */
  alignmentNarrative: string;
  /** When this was computed */
  computedAt: number;
}

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cached: CareerAlignmentData | null = null;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Load cached alignment data without recomputing.
 */
export function loadCareerAlignment(): CareerAlignmentData | null {
  return cached;
}

/**
 * Get current career alignment data (cached or freshly computed).
 */
export function getCareerAlignment(): CareerAlignmentData {
  if (cached && Date.now() - cached.computedAt < CACHE_TTL) {
    return cached;
  }
  cached = computeCareerAlignment();
  return cached;
}

// ============================================================================
// DETECTION HELPERS
// ============================================================================

/**
 * Detect career switching loops — repeated retakes and broad category hopping.
 */
function detectSwitchingLoops(
  journey: ReturnType<typeof loadJourneyMemory>
): { loopCount: number; severity: DriftSignal["severity"]; detail: string } {
  const retakes = journey.uncertaintyPatterns?.retakes ?? 0;
  const comparisonCount = journey.comparisonHistory.length;
  const viewedCount = Object.keys(journey.viewedCareers).length;

  // Many retakes + many comparisons across different careers → switching loop
  if (retakes >= 3 && comparisonCount >= 5 && viewedCount >= 10) {
    return {
      loopCount: Math.min(retakes + Math.floor(comparisonCount / 2), 10),
      severity: "high",
      detail: `${retakes} quiz retakes and ${comparisonCount} comparisons across ${viewedCount} careers suggest repetitive cycling without convergence.`,
    };
  }

  if (retakes >= 2 || (comparisonCount >= 3 && viewedCount >= 8)) {
    return {
      loopCount: Math.min(retakes + Math.floor(comparisonCount / 3), 6),
      severity: "medium",
      detail: `${retakes} retakes with broad exploration (${viewedCount} careers) — may indicate difficulty settling on a direction.`,
    };
  }

  if (retakes >= 1) {
    return {
      loopCount: 1,
      severity: "low",
      detail: "Minor retake activity — normal part of the exploration process.",
    };
  }

  return { loopCount: 0, severity: "low", detail: "No switching loop patterns detected." };
}

/**
 * Detect identity consistency from personal-evolution.
 */
function detectIdentityConsistency(
  evolution: ReturnType<typeof getPersonalEvolution>
): { consistent: boolean; score: number; detail: string } {
  const evolutionScore = evolution.evolutionScore;
  const identityShift = evolution.identityShift;
  const hasClearIdentity =
    identityShift.length > 0 && !identityShift.includes("still forming") && !identityShift.includes("early stages");

  if (evolutionScore >= 60 && hasClearIdentity) {
    return {
      consistent: true,
      score: evolutionScore,
      detail: `Strong identity clarity with evolution score of ${evolutionScore}/100 — career identity is well-defined.`,
    };
  }

  if (evolutionScore >= 40 || hasClearIdentity) {
    return {
      consistent: true,
      score: Math.max(40, evolutionScore),
      detail: `Developing identity consistency (${evolutionScore}/100) — direction is emerging.`,
    };
  }

  return {
    consistent: false,
    score: evolutionScore,
    detail: `Identity is still forming (${evolutionScore}/100) — continued exploration needed for clearer direction.`,
  };
}

/**
 * Detect future-self convergence — trajectory vs risk balance.
 */
function detectFutureConvergence(
  future: ReturnType<typeof getFutureSelf>
): { converging: boolean; score: number; detail: string } {
  const trajectory = future.trajectoryStrength;
  const riskCount = future.riskFactors.length;
  const catalystCount = future.growthCatalysts.length;

  const catalystStrength =
    catalystCount > 0
      ? future.growthCatalysts.reduce((sum, c) => sum + c.strength, 0) / catalystCount
      : 0;

  // Strong trajectory + strong catalysts + few risks → converging
  if (trajectory >= 65 && catalystCount >= 2 && riskCount <= 1) {
    return {
      converging: true,
      score: Math.round((trajectory + catalystStrength) / 2),
      detail: `Strong future-self convergence: trajectory ${trajectory}/100 with ${catalystCount} growth catalysts and only ${riskCount} risk factor(s).`,
    };
  }

  // Decent trajectory but balanced risks
  if (trajectory >= 45 && riskCount <= 2) {
    return {
      converging: true,
      score: Math.round((trajectory + 50) / 2),
      detail: `Moderate convergence — trajectory is ${trajectory}/100 with ${riskCount} manageable risk factor(s).`,
    };
  }

  // Low trajectory or high risks → diverging
  if (trajectory < 40 || riskCount >= 3) {
    return {
      converging: false,
      score: Math.round((trajectory + Math.max(0, 100 - riskCount * 15)) / 2),
      detail: `Future-self is diverging — trajectory ${trajectory}/100 with ${riskCount} risk factor(s) pulling in different directions.`,
    };
  }

  return {
    converging: false,
    score: trajectory,
    detail: `Convergence is unclear — trajectory ${trajectory}/100 with ${riskCount} risk factor(s) and ${catalystCount} catalyst(s).`,
  };
}

/**
 * Detect mission completion alignment.
 */
function detectMissionAlignment(
  mission: ReturnType<typeof getMissionIntelligence>
): { aligned: boolean; score: number; detail: string } {
  const missionScore = mission.missionScore;
  const missionMomentum = mission.missionMomentum;
  const risk = mission.missionRisk;

  if (missionScore >= 65 && missionMomentum >= 60 && risk === "low") {
    return {
      aligned: true,
      score: Math.round((missionScore + missionMomentum) / 2),
      detail: `Missions are well-aligned: score ${missionScore}/100, momentum ${missionMomentum}/100, low risk.`,
    };
  }

  if (missionScore >= 45 && risk !== "high") {
    return {
      aligned: true,
      score: Math.round((missionScore + missionMomentum) / 2),
      detail: `Mission alignment is developing: score ${missionScore}/100, momentum ${missionMomentum}/100.`,
    };
  }

  return {
    aligned: false,
    score: missionScore,
    detail: `Missions are misaligned: score ${missionScore}/100 with ${risk} risk and ${mission.missionBlocks.length} blocker(s).`,
  };
}

/**
 * Detect confidence trajectory alignment.
 */
function detectConfidenceAlignment(
  dc: ReturnType<typeof getDecisionConfidence>
): { aligned: boolean; score: number; detail: string } {
  const confidenceScore = dc.confidenceScore;
  const stability = dc.decisionStability;

  if (confidenceScore >= 65 && stability === "stable") {
    return {
      aligned: true,
      score: confidenceScore,
      detail: `Confidence is high (${confidenceScore}/100) and stable — strong alignment with chosen direction.`,
    };
  }

  if (confidenceScore >= 45 && stability !== "fluctuating") {
    return {
      aligned: true,
      score: confidenceScore,
      detail: `Confidence is moderate (${confidenceScore}/100) with ${stability} stability — alignment is emerging.`,
    };
  }

  return {
    aligned: false,
    score: confidenceScore,
    detail: `Confidence is low (${confidenceScore}/100) or fluctuating — suggests uncertainty about current direction.`,
  };
}

/**
 * Detect momentum mismatch — is career momentum aligned or conflicting?
 */
function detectMomentumMismatch(
  momentum: ReturnType<typeof getCareerMomentum>
): { aligned: boolean; score: number; detail: string } {
  const momentumScore = momentum.momentumScore;
  const trend = momentum.momentumTrend;
  const slowCount = momentum.slowdownSignals.length;

  if (momentumScore >= 65 && trend === "accelerating" && slowCount <= 1) {
    return {
      aligned: true,
      score: momentumScore,
      detail: `Strong, accelerating momentum (${momentumScore}/100) with minimal slowdown signals — excellent alignment.`,
    };
  }

  if (momentumScore >= 45 && slowCount <= 3) {
    return {
      aligned: true,
      score: momentumScore,
      detail: `Moderate momentum (${momentumScore}/100, ${trend}) with ${slowCount} slowdown signal(s) to monitor.`,
    };
  }

  return {
    aligned: false,
    score: momentumScore,
    detail: `Momentum mismatch: score ${momentumScore}/100 (${trend}) with ${slowCount} slowdown signal(s) — forward motion is weak.`,
  };
}

/**
 * Detect engagement depth from achievements.
 */
function detectEngagementDepth(
  achievements: ReturnType<typeof loadAchievements> | ReturnType<typeof computeAchievements>
): { deep: boolean; score: number; detail: string } {
  const level = achievements?.level ?? 1;
  const unlockedCount = achievements?.unlockedAchievements?.length ?? 0;
  const xp = achievements?.xp ?? 0;

  if (level >= 5 && unlockedCount >= 8 && xp >= 1000) {
    return {
      deep: true,
      score: Math.min(100, 50 + level * 5 + unlockedCount * 3),
      detail: `Deep engagement: Level ${level}, ${unlockedCount} achievements, ${xp} XP — committed exploration history.`,
    };
  }

  if (level >= 3 && unlockedCount >= 4) {
    return {
      deep: true,
      score: Math.min(80, 30 + level * 5 + unlockedCount * 3),
      detail: `Moderate engagement depth: Level ${level}, ${unlockedCount} achievements, ${xp} XP.`,
    };
  }

  return {
    deep: false,
    score: Math.min(40, 10 + level * 3 + unlockedCount * 2),
    detail: `Early-stage engagement: Level ${level}, ${unlockedCount} achievement(s), ${xp} XP — more data needed.`,
  };
}

// ============================================================================
// CORE COMPUTATION
// ============================================================================

function computeCareerAlignment(): CareerAlignmentData {
  // ── Gather context from all 7 sources ─────────────────────────────────
  const momentum = getCareerMomentum();
  const future = getFutureSelf();
  const dc = getDecisionConfidence();
  const mission = getMissionIntelligence();
  const evolution = getPersonalEvolution();
  const journey = loadJourneyMemory();
  const achievements = loadAchievements() ?? computeAchievements();

  // ── Run detectors ─────────────────────────────────────────────────────
  const switching = detectSwitchingLoops(journey);
  const identity = detectIdentityConsistency(evolution);
  const convergence = detectFutureConvergence(future);
  const missionAlign = detectMissionAlignment(mission);
  const confidenceAlign = detectConfidenceAlignment(dc);
  const momentumMatch = detectMomentumMismatch(momentum);
  const engagement = detectEngagementDepth(achievements);

  // ── Alignment signals (positive) ──────────────────────────────────────
  const alignmentSignals: AlignmentSignal[] = [];

  if (identity.consistent && identity.score >= 60) {
    alignmentSignals.push({
      label: "Consistent career identity",
      value: identity.score,
      source: "personal-evolution",
    });
  }
  if (convergence.converging && convergence.score >= 60) {
    alignmentSignals.push({
      label: "Future-self converging",
      value: convergence.score,
      source: "future-self",
    });
  }
  if (missionAlign.aligned && missionAlign.score >= 60) {
    alignmentSignals.push({
      label: "Missions aligned with direction",
      value: missionAlign.score,
      source: "mission-intelligence",
    });
  }
  if (confidenceAlign.aligned && confidenceAlign.score >= 60) {
    alignmentSignals.push({
      label: "Confidence in current path",
      value: confidenceAlign.score,
      source: "decision-confidence",
    });
  }
  if (momentumMatch.aligned && momentumMatch.score >= 60) {
    alignmentSignals.push({
      label: "Momentum supports direction",
      value: momentumMatch.score,
      source: "career-momentum",
    });
  }
  if (engagement.deep && engagement.score >= 60) {
    alignmentSignals.push({
      label: "Deep engagement history",
      value: engagement.score,
      source: "achievement-engine",
    });
  }
  if (future.growthCatalysts.length >= 2) {
    alignmentSignals.push({
      label: `${future.growthCatalysts.length} active growth catalysts`,
      value: Math.min(100, 40 + future.growthCatalysts.length * 15),
      source: "future-self",
    });
  }
  if (future.trajectoryStrength >= 65) {
    alignmentSignals.push({
      label: "Strong future trajectory",
      value: future.trajectoryStrength,
      source: "future-self",
    });
  }

  // ── Drift signals (negative) ──────────────────────────────────────────
  const driftSignals: DriftSignal[] = [];

  if (switching.severity !== "low") {
    driftSignals.push({
      label: "Career switching loop",
      severity: switching.severity,
      detail: switching.detail,
      source: "journey-memory",
    });
  }

  if (!identity.consistent && identity.score < 40) {
    driftSignals.push({
      label: "Unclear career identity",
      severity: "high",
      detail: identity.detail,
      source: "personal-evolution",
    });
  } else if (!identity.consistent) {
    driftSignals.push({
      label: "Developing identity",
      severity: "medium",
      detail: identity.detail,
      source: "personal-evolution",
    });
  }

  if (!convergence.converging) {
    const convergenceSeverity: DriftSignal["severity"] =
      future.trajectoryStrength < 35 ? "high" : "medium";
    driftSignals.push({
      label: "Future-self diverging",
      severity: convergenceSeverity,
      detail: convergence.detail,
      source: "future-self",
    });
  }

  if (!missionAlign.aligned) {
    driftSignals.push({
      label: "Mission-path misalignment",
      severity: mission.missionRisk === "high" ? "high" : "medium",
      detail: missionAlign.detail,
      source: "mission-intelligence",
    });
  }

  if (!confidenceAlign.aligned) {
    driftSignals.push({
      label: "Confidence uncertainty",
      severity: dc.confidenceScore < 35 ? "high" : "medium",
      detail: confidenceAlign.detail,
      source: "decision-confidence",
    });
  }

  if (!momentumMatch.aligned) {
    driftSignals.push({
      label: "Momentum mismatch",
      severity: momentum.momentumScore < 30 ? "high" : "medium",
      detail: momentumMatch.detail,
      source: "career-momentum",
    });
  }

  // Check for goal-drift indicators from journey-memory
  const viewedCareerCount = Object.keys(journey.viewedCareers).length;
  const comparisonCount = journey.comparisonHistory.length;
  if (viewedCareerCount >= 12 && comparisonCount >= 6 && switching.severity === "high") {
    driftSignals.push({
      label: "Excessive broad exploration",
      severity: "medium",
      detail: `Exploring ${viewedCareerCount} careers with ${comparisonCount} comparisons — breadth without convergence suggests drift.`,
      source: "journey-memory",
    });
  }

  // ── Alignment score ───────────────────────────────────────────────────
  const rawScore =
    (identity.consistent ? identity.score : Math.max(0, identity.score * 0.5)) * 0.18 +
    (convergence.converging ? convergence.score : Math.max(0, convergence.score * 0.4)) * 0.18 +
    (missionAlign.aligned ? missionAlign.score : Math.max(0, missionAlign.score * 0.5)) * 0.16 +
    (confidenceAlign.aligned ? confidenceAlign.score : Math.max(0, confidenceAlign.score * 0.5)) * 0.16 +
    (momentumMatch.aligned ? momentumMatch.score : Math.max(0, momentumMatch.score * 0.4)) * 0.16 +
    engagement.score * 0.10 +
    (switching.severity === "high" ? 0 : switching.severity === "medium" ? 50 : 80) * 0.06;

  // Penalty for high-severity drift signals
  const highDriftCount = driftSignals.filter((s) => s.severity === "high").length;
  const driftPenalty = highDriftCount * 8;

  const alignmentScore = Math.round(Math.max(0, Math.min(100, rawScore - driftPenalty)));

  // ── Alignment trend ───────────────────────────────────────────────────
  const alignedCount = alignmentSignals.length;
  const driftedCount = driftSignals.length;
  const highDrift = driftSignals.filter((s) => s.severity === "high").length;

  let alignmentTrend: CareerAlignmentData["alignmentTrend"];
  if (alignmentScore >= 65 && alignedCount >= 3 && highDrift === 0) {
    alignmentTrend = "converging";
  } else if (alignmentScore >= 45 && driftedCount <= alignedCount) {
    alignmentTrend = "stable";
  } else if (alignmentScore >= 35 && driftedCount > alignedCount) {
    alignmentTrend = "drifting";
  } else {
    alignmentTrend = "diverging";
  }

  // ── Career fit direction ──────────────────────────────────────────────
  const careerFitDirection = buildCareerFitDirection(
    alignmentScore,
    alignmentTrend,
    future.futureArchetype,
    identity.consistent,
    identity.score,
    evolution.identityShift
  );

  // ── Alignment drivers (ranked) ──────────────────────────────────────
  const drivers: AlignmentSignal[] = [];

  drivers.push({ label: "Identity consistency", value: identity.score, source: "personal-evolution" });
  drivers.push({ label: "Future-self convergence", value: convergence.score, source: "future-self" });
  drivers.push({ label: "Mission alignment", value: missionAlign.score, source: "mission-intelligence" });
  drivers.push({ label: "Confidence trajectory", value: confidenceAlign.score, source: "decision-confidence" });
  drivers.push({ label: "Momentum match", value: momentumMatch.score, source: "career-momentum" });
  drivers.push({ label: "Engagement depth", value: engagement.score, source: "achievement-engine" });

  drivers.sort((a, b) => b.value - a.value);

  // ── Correction actions ────────────────────────────────────────────────
  const correctionActions = buildCorrectionActions(
    alignmentScore,
    driftSignals,
    switching,
    identity,
    convergence,
    future,
    mission,
    dc,
    momentum,
    engagement,
    missionAlign,
    confidenceAlign,
    momentumMatch
  );

  // ── Narrative ─────────────────────────────────────────────────────────
  const alignmentNarrative = buildAlignmentNarrative(
    alignmentScore,
    alignmentTrend,
    alignmentSignals.length,
    driftSignals.length,
    careerFitDirection,
    future.futureArchetype,
    momentum.momentumScore
  );

  return {
    alignmentScore,
    alignmentTrend,
    alignmentSignals,
    driftSignals,
    careerFitDirection,
    alignmentDrivers: drivers,
    correctionActions,
    alignmentNarrative,
    computedAt: Date.now(),
  };
}

// ============================================================================
// CAREER FIT DIRECTION
// ============================================================================

function buildCareerFitDirection(
  alignmentScore: number,
  alignmentTrend: string,
  futureArchetype: string,
  identityConsistent: boolean,
  identityScore: number,
  identityShift: string
): string {
  if (alignmentScore >= 65 && alignmentTrend === "converging") {
    return `You are converging toward a "${futureArchetype}" path. Your career identity is clear and your momentum supports this direction. Continue deepening your commitment.`;
  }

  if (alignmentScore >= 45) {
    const shiftHint =
      identityConsistent && identityShift.length > 0
        ? identityShift.length > 100
          ? identityShift.slice(0, identityShift.indexOf(".", 50) + 1)
          : identityShift
        : "";
    const base = `You are on a "${futureArchetype}" trajectory with moderate alignment.`;
    return shiftHint ? `${base} ${shiftHint}` : base;
  }

  if (alignmentTrend === "diverging") {
    return `Your direction is currently unclear. Multiple drift signals suggest you may be exploring paths that don't fully align with your strengths. Consider narrowing your focus to 2–3 career clusters for deeper evaluation.`;
  }

  return `Your career fit direction is still emerging — continued exploration will clarify whether current paths truly align with your values and strengths.`;
}

// ============================================================================
// CORRECTION ACTIONS
// ============================================================================

function buildCorrectionActions(
  alignmentScore: number,
  driftSignals: DriftSignal[],
  switching: ReturnType<typeof detectSwitchingLoops>,
  identity: ReturnType<typeof detectIdentityConsistency>,
  convergence: ReturnType<typeof detectFutureConvergence>,
  future: ReturnType<typeof getFutureSelf>,
  mission: ReturnType<typeof getMissionIntelligence>,
  dc: ReturnType<typeof getDecisionConfidence>,
  momentum: ReturnType<typeof getCareerMomentum>,
  engagement: ReturnType<typeof detectEngagementDepth>,
  missionAlign: { aligned: boolean; score: number; detail: string },
  confidenceAlign: { aligned: boolean; score: number; detail: string },
  momentumMatch: { aligned: boolean; score: number; detail: string }
): CorrectionAction[] {
  const actions: CorrectionAction[] = [];

  if (alignmentScore >= 65) {
    // Reinforce direction
    actions.push({
      action: "Commit to your current path — set a specific milestone for the next 2 weeks",
      reason: "Strong alignment means your current direction is working. Deepening commitment accelerates growth.",
      difficulty: "moderate",
    });

    if (future.growthCatalysts.length >= 2) {
      actions.push({
        action: "Activate top growth catalysts with targeted skill-building roadmaps",
        reason: "Your growth catalysts are well-positioned — channeling them into concrete skills will amplify alignment.",
        difficulty: "challenging",
      });
    }

    if (engagement.score >= 60) {
      actions.push({
        action: "Share your career direction with a mentor or peer for external validation",
        reason: "Strong internal alignment combined with external feedback creates the most robust career decisions.",
        difficulty: "moderate",
      });
    }
  } else if (alignmentScore < 40) {
    // Low alignment → correction actions
    const highDrift = driftSignals.filter((s) => s.severity === "high");

    if (switching.severity === "high") {
      actions.push({
        action: "Limit exploration to 2–3 career clusters for the next 2 weeks",
        reason: "Broad switching loops prevent convergence — narrowing focus helps identify genuine fit.",
        difficulty: "moderate",
      });
    }

    if (!identity.consistent) {
      actions.push({
        action: "Complete a career identity worksheet to clarify your core values and strengths",
        reason: "An unclear identity makes it difficult to assess whether any path truly fits.",
        difficulty: "easier",
      });
    }

    if (!convergence.converging && future.riskFactors.length >= 2) {
      actions.push({
        action: "Address top risk factors before making new career commitments",
        reason: `${future.riskFactors.length} risk factors are creating divergence — resolving them restores alignment.`,
        difficulty: "moderate",
      });
    }

    if (!missionAlign.aligned) {
      actions.push({
        action: "Reset missions to match your current energy and focus level",
        reason: "Misaligned missions drain momentum — simpler missions rebuild alignment faster.",
        difficulty: "easier",
      });
    }

    if (!confidenceAlign.aligned) {
      actions.push({
        action: "Take a focused career quiz on your top 2 potential paths",
        reason: "Low confidence signals uncertainty — targeted quizzes reduce ambiguity and restore direction.",
        difficulty: "easier",
      });
    }

    if (!momentumMatch.aligned && momentum.momentumScore < 40) {
      actions.push({
        action: "Complete one tiny win today — any small career action counts",
        reason: "Low momentum compounds misalignment — the smallest forward step breaks the stall.",
        difficulty: "easier",
      });
    }

    if (engagement.score < 30) {
      actions.push({
        action: "Commit to 3 sessions of career exploration over the next week",
        reason: "Insufficient engagement data makes it hard to assess true alignment — building data clarifies direction.",
        difficulty: "easier",
      });
    }

    // Fallback if no specific high-severity issues
    if (highDrift.length === 0 && actions.length === 0) {
      actions.push({
        action: "Review your career exploration history to identify patterns",
        reason: "Reviewing past discoveries can reveal hidden alignment signals you may have overlooked.",
        difficulty: "easier",
      });
    }
  } else {
    // Moderate alignment — maintenance
    actions.push({
      action: "Maintain current cadence with one focused career comparison per week",
      reason: "Moderate alignment benefits from steady, focused exploration without broadening scope.",
      difficulty: "easier",
    });

    if (driftSignals.length > 0) {
      actions.push({
        action: `Monitor ${driftSignals.length} drift signal(s) and reassess in 1 week`,
        reason: "Early drift detection prevents misalignment from escalating — regular check-ins keep you on track.",
        difficulty: "easier",
      });
    }
  }

  return actions;
}

// ============================================================================
// NARRATIVE
// ============================================================================

function buildAlignmentNarrative(
  alignmentScore: number,
  alignmentTrend: string,
  alignmentCount: number,
  driftCount: number,
  careerFitDirection: string,
  futureArchetype: string,
  momentumScore: number
): string {
  const parts: string[] = [];

  // Opening — alignment status
  if (alignmentScore >= 65 && alignmentTrend === "converging") {
    parts.push(`You're strongly aligned (${alignmentScore}/100) and converging on the right path.`);
  } else if (alignmentScore >= 45) {
    parts.push(`Your alignment is moderate (${alignmentScore}/100) — you're heading in a generally positive direction with some areas to refine.`);
  } else if (alignmentTrend === "diverging") {
    parts.push(`Your path is diverging (${alignmentScore}/100) — multiple signals suggest you may be drifting away from your best-fit direction.`);
  } else {
    parts.push(`Alignment is low (${alignmentScore}/100) — your career direction needs clearer signals to assess fit.`);
  }

  // Signal summary
  if (alignmentCount > 0) {
    parts.push(`${alignmentCount} alignment signal(s) support your direction`);
  }
  if (driftCount > 0) {
    parts.push(`${driftCount} drift signal(s) indicate areas to address`);
  }

  // Archetype context
  if (futureArchetype && alignmentScore >= 40) {
    parts.push(`Your trajectory suggests a "${futureArchetype}" path.`);
  }

  // Closing — actionable guidance
  if (alignmentScore >= 65) {
    parts.push("Reinforce your direction — your confidence, momentum, and identity are converging.");
  } else if (alignmentScore >= 45) {
    parts.push("Small adjustments can strengthen alignment — address drift signals before they grow.");
  } else {
    parts.push("Prioritize correction actions to realign before making major career decisions.");
  }

  return parts.join(" ");
}
