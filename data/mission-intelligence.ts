/**
 * MISSION INTELLIGENCE
 *
 * Turns long-term goals into adaptive missions.
 *
 * Sources: daily-missions, goal-tracker (career-goals), engagement-pulse,
 *          habit-intelligence, future-self, journey-memory
 *
 * No backend. No auth.
 */

import { getDailyMissions, loadDailyMissions } from "./daily-missions";
import { loadGoalState } from "./career-goals";
import { getEngagementPulse, loadEngagementPulse } from "./engagement-pulse";
import { getHabitIntelligence, loadHabitIntelligence } from "./habit-intelligence";
import { getFutureSelf, loadFutureSelf } from "./future-self";
import { loadJourneyMemory } from "./journey-memory";

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

let cached: MissionIntelligenceData | null = null;

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type MissionRisk = "low" | "medium" | "high";
export type AdaptiveDifficulty = "tiny" | "easy" | "medium" | "hard";
export type MissionBlockType =
  | "stalled"
  | "drift"
  | "energy_mismatch"
  | "low_habit"
  | "trajectory_risk";

export interface AdaptiveMission {
  id: string;
  title: string;
  description: string;
  difficulty: AdaptiveDifficulty;
  estimatedMinutes: number;
  category: string;
  reason: string; // why this mission is suggested
}

export interface MissionBlock {
  type: MissionBlockType;
  severity: MissionRisk;
  detail: string;
  source: string;
}

export interface MissionIntelligenceData {
  missionScore: number; // 0–100
  activeMission: AdaptiveMission;
  missionMomentum: number; // 0–100
  missionRisk: MissionRisk;
  missionBlocks: MissionBlock[];
  adaptiveMissions: AdaptiveMission[];
  nextMission: AdaptiveMission;
  missionNarrative: string;
  computedAt: string;
}

// ============================================================================
// DETECTION: Stalled Missions
// ============================================================================

function detectStalledMissions(
  missions: ReturnType<typeof getDailyMissions>,
  habit: ReturnType<typeof getHabitIntelligence>
): MissionBlock | null {
  const completedCount = missions.completedMissionIds.length;
  const totalMissions = [
    missions.todayMission,
    missions.easyMission,
    missions.stretchMission,
    ...(missions.streakMission ? [missions.streakMission] : []),
  ].length;

  const completionRate = totalMissions > 0 ? completedCount / totalMissions : 0;
  const habitScore = habit.habitScore;

  // No completions + low habit → stalled
  if (completionRate === 0 && habitScore < 50) {
    return {
      type: "stalled",
      severity: habitScore < 30 ? "high" : "medium",
      detail: `No missions completed today with a habit score of ${habitScore}/100 — momentum is not carrying over into action.`,
      source: "daily-missions",
    };
  }

  // Low completion rate despite missions existing
  if (completionRate < 0.3 && totalMissions >= 3) {
    return {
      type: "stalled",
      severity: "medium",
      detail: `Only ${completedCount} of ${totalMissions} missions completed — tasks may feel overwhelming.`,
      source: "daily-missions",
    };
  }

  return null;
}

// ============================================================================
// DETECTION: Goal Drift
// ============================================================================

function detectGoalDrift(
  goalState: ReturnType<typeof loadGoalState>,
  future: ReturnType<typeof getFutureSelf>
): MissionBlock | null {
  if (!goalState.goal || !goalState.signals) {
    return {
      type: "drift",
      severity: "medium",
      detail: "No active career goal set — missions lack a long-term target to align with.",
      source: "career-goals",
    };
  }

  const { signals } = goalState;

  if (signals.paceSignal === "behind" && signals.riskSignal === "high") {
    return {
      type: "drift",
      severity: "high",
      detail: `Goal pace is behind schedule with high risk — estimated completion: ${signals.estimatedCompletion}. ${signals.nextCriticalStep}`,
      source: "career-goals",
    };
  }

  if (signals.paceSignal === "behind") {
    return {
      type: "drift",
      severity: "medium",
      detail: `Goal progress is behind schedule. ${signals.nextCriticalStep}`,
      source: "career-goals",
    };
  }

  // Trajectory misalignment: high trajectory but no goal
  if (future.trajectoryStrength >= 65 && !goalState.goal.isActive) {
    return {
      type: "drift",
      severity: "low",
      detail: "Strong trajectory detected but no active goal — consider setting a long-term target to channel momentum.",
      source: "future-self",
    };
  }

  return null;
}

// ============================================================================
// DETECTION: Energy Mismatch
// ============================================================================

function detectEnergyMismatch(
  pulse: ReturnType<typeof getEngagementPulse>,
  missions: ReturnType<typeof getDailyMissions>
): MissionBlock | null {
  const completedCount = missions.completedMissionIds.length;
  const pulseScore = pulse.pulseScore;

  // Low pulse but high mission load
  if (pulseScore < 40 && pulse.missionLoad === "high") {
    return {
      type: "energy_mismatch",
      severity: "high",
      detail: `Pulse score is low (${pulseScore}/100) but mission load is high — risk of overwhelm and disengagement.`,
      source: "engagement-pulse",
    };
  }

  // Low pulse but missions exist that could be done
  if (pulseScore < 50 && pulse.energyForecast === "declining") {
    return {
      type: "energy_mismatch",
      severity: "medium",
      detail: `Energy forecast is declining (pulse: ${pulseScore}/100) — missions should be scaled back to easier tasks.`,
      source: "engagement-pulse",
    };
  }

  // High pulse but no completions
  if (pulseScore >= 65 && completedCount === 0) {
    return {
      type: "energy_mismatch",
      severity: "low",
      detail: `Energy is high (pulse: ${pulseScore}/100) but no missions completed — potential misalignment between energy and focus.`,
      source: "engagement-pulse",
    };
  }

  return null;
}

// ============================================================================
// DETECTION: Habit Alignment
// ============================================================================

function detectHabitAlignment(
  habit: ReturnType<typeof getHabitIntelligence>
): MissionBlock | null {
  const breakPatternCount = habit.breakingPatterns.length;
  const habitScore = habit.habitScore;

  if (breakPatternCount >= 3 && habitScore < 45) {
    return {
      type: "low_habit",
      severity: "high",
      detail: `${breakPatternCount} breaking patterns found with a habit score of ${habitScore}/100 — current missions may not align with natural behavior rhythms.`,
      source: "habit-intelligence",
    };
  }

  if (breakPatternCount >= 1 && habitScore < 50) {
    return {
      type: "low_habit",
      severity: "medium",
      detail: `${breakPatternCount} breaking pattern(s) detected — mission structure may need adjustment to match habit cycles.`,
      source: "habit-intelligence",
    };
  }

  if (habit.habitCandidates.length === 0) {
    return {
      type: "low_habit",
      severity: "low",
      detail: "No habit candidates detected — missions may feel disconnected from established routines.",
      source: "habit-intelligence",
    };
  }

  return null;
}

// ============================================================================
// DETECTION: Trajectory Risk
// ============================================================================

function detectTrajectoryRisk(
  future: ReturnType<typeof getFutureSelf>
): MissionBlock | null {
  const riskCount = future.riskFactors.length;

  if (riskCount >= 3 && future.trajectoryStrength < 50) {
    return {
      type: "trajectory_risk",
      severity: "high",
      detail: `${riskCount} risk factors identified with trajectory strength of ${future.trajectoryStrength}/100 — missions need to address core trajectory blockers.`,
      source: "future-self",
    };
  }

  if (riskCount >= 2) {
    return {
      type: "trajectory_risk",
      severity: "medium",
      detail: `${riskCount} trajectory risk factors present — consider adjusting mission difficulty to build sustainable momentum.`,
      source: "future-self",
    };
  }

  if (future.trajectoryStrength < 35) {
    return {
      type: "trajectory_risk",
      severity: "low",
      detail: `Trajectory strength is low (${future.trajectoryStrength}/100) — missions should focus on building foundational momentum.`,
      source: "future-self",
    };
  }

  return null;
}

// ============================================================================
// MISSION GENERATION
// ============================================================================

function computeMissionScore(
  habit: ReturnType<typeof getHabitIntelligence>,
  pulse: ReturnType<typeof getEngagementPulse>,
  future: ReturnType<typeof getFutureSelf>,
  missions: ReturnType<typeof getDailyMissions>,
  goalState: ReturnType<typeof loadGoalState>,
  blocks: MissionBlock[],
  journey: ReturnType<typeof loadJourneyMemory>
): number {
  let score = 50; // baseline

  // Habit alignment (+20 to -20)
  if (habit.habitScore >= 70) score += 20;
  else if (habit.habitScore >= 50) score += 10;
  else if (habit.habitScore < 30) score -= 20;
  else if (habit.habitScore < 50) score -= 5;

  // Pulse energy (+15 to -15)
  if (pulse.pulseScore >= 70) score += 15;
  else if (pulse.pulseScore < 35) score -= 15;
  else if (pulse.pulseScore < 50) score -= 5;

  // Future trajectory (+15 to -15)
  if (future.trajectoryStrength >= 70) score += 15;
  else if (future.trajectoryStrength >= 50) score += 5;
  else if (future.trajectoryStrength < 30) score -= 15;

  // Mission completion (+10)
  const total = [
    missions.todayMission,
    missions.easyMission,
    missions.stretchMission,
    ...(missions.streakMission ? [missions.streakMission] : []),
  ].length;
  const rate = total > 0 ? missions.completedMissionIds.length / total : 0;
  if (rate >= 0.7) score += 10;
  else if (rate === 0 && total > 0) score -= 10;

  // Journey engagement (+5 to -5)
  if (journey.completedQuizzes >= 5) score += 5;
  else if (journey.completedQuizzes <= 1) score -= 5;

  // Goal pace (+5 to -10)
  if (goalState.signals?.paceSignal === "ahead") score += 5;
  else if (goalState.signals?.paceSignal === "behind") score -= 10;

  // Block penalty (-5 per high block)
  const highBlocks = blocks.filter((b) => b.severity === "high").length;
  score -= highBlocks * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeMissionMomentum(
  habit: ReturnType<typeof getHabitIntelligence>,
  pulse: ReturnType<typeof getEngagementPulse>,
  future: ReturnType<typeof getFutureSelf>,
  missions: ReturnType<typeof getDailyMissions>,
  journey: ReturnType<typeof loadJourneyMemory>
): number {
  let momentum = 50;

  // Habit momentum
  if (habit.habitScore >= 65) momentum += 15;
  else if (habit.habitScore < 35) momentum -= 15;

  // Pulse momentum
  if (pulse.energyForecast === "sustained") momentum += 10;
  else if (pulse.energyForecast === "declining") momentum -= 10;

  // Future trajectory
  if (future.trajectoryStrength >= 65) momentum += 10;
  else if (future.trajectoryStrength < 35) momentum -= 10;

  // Journey exploration breadth
  const viewedCount = Object.keys(journey.viewedCareers ?? {}).length;
  if (viewedCount >= 8) momentum += 5;
  else if (viewedCount <= 2) momentum -= 5;

  // Recent completions
  const total = [
    missions.todayMission,
    missions.easyMission,
    missions.stretchMission,
    ...(missions.streakMission ? [missions.streakMission] : []),
  ].length;
  const rate = total > 0 ? missions.completedMissionIds.length / total : 0;
  if (rate >= 0.5) momentum += 10;
  else if (rate === 0) momentum -= 5;

  return Math.max(0, Math.min(100, Math.round(momentum)));
}

function computeMissionRisk(
  blocks: MissionBlock[],
  future: ReturnType<typeof getFutureSelf>
): MissionRisk {
  const highBlocks = blocks.filter((b) => b.severity === "high").length;
  const mediumBlocks = blocks.filter((b) => b.severity === "medium").length;
  const futureRiskCount = future.riskFactors.length;

  if (highBlocks >= 2 || futureRiskCount >= 4) return "high";
  if (highBlocks >= 1 || mediumBlocks >= 2 || futureRiskCount >= 2) return "medium";
  return "low";
}

function generateTinyMission(
  missions: ReturnType<typeof getDailyMissions>,
  source: string
): AdaptiveMission {
  // Pick the easiest existing mission and simplify it
  if (missions.easyMission) {
    return {
      id: `tiny-${missions.easyMission.id}`,
      title: `Mini: ${missions.easyMission.title}`,
      description: `A bite-sized version: ${missions.easyMission.description.slice(0, 80)}`,
      difficulty: "tiny",
      estimatedMinutes: Math.max(2, Math.round(missions.easyMission.estimatedMinutes / 3)),
      category: missions.easyMission.category,
      reason: source,
    };
  }

  return {
    id: "tiny-quick-action",
    title: "Take one small action",
    description: "Spend 2 minutes on a single career-related task — any small step counts.",
    difficulty: "tiny",
    estimatedMinutes: 2,
    category: "explore",
    reason: source,
  };
}

function generateChallengeMission(
  missions: ReturnType<typeof getDailyMissions>
): AdaptiveMission {
  if (missions.stretchMission) {
    return {
      id: `challenge-${missions.stretchMission.id}`,
      title: `Challenge: ${missions.stretchMission.title}`,
      description: missions.stretchMission.description,
      difficulty: "hard",
      estimatedMinutes: missions.stretchMission.estimatedMinutes,
      category: missions.stretchMission.category,
      reason: "Momentum is strong — increasing challenge to maintain growth trajectory.",
    };
  }

  return {
    id: "challenge-roadmap-start",
    title: "Start a roadmap milestone",
    description: "Pick a career roadmap and commit to completing the first milestone.",
    difficulty: "hard",
    estimatedMinutes: 20,
    category: "roadmap",
    reason: "Momentum is strong — increasing challenge to maintain growth trajectory.",
  };
}

function generateMaintainMission(
  missions: ReturnType<typeof getDailyMissions>
): AdaptiveMission {
  // Use today's mission as the maintain mission
  return {
    id: `maintain-${missions.todayMission.id}`,
    title: missions.todayMission.title,
    description: missions.todayMission.description,
    difficulty: missions.todayMission.difficulty === "hard" ? "medium" : missions.todayMission.difficulty,
    estimatedMinutes: missions.todayMission.estimatedMinutes,
    category: missions.todayMission.category,
    reason: "Maintaining current pace — steady progress builds sustainable momentum.",
  };
}

function generateAdaptiveMissions(
  missionScore: number,
  missions: ReturnType<typeof getDailyMissions>,
  blocks: MissionBlock[]
): AdaptiveMission[] {
  const adaptive: AdaptiveMission[] = [];

  if (missionScore < 40) {
    // Low momentum → tiny, easy missions
    adaptive.push(generateTinyMission(missions, "Low momentum — starting with the smallest possible step."));
    adaptive.push({
      id: "tiny-complete-one",
      title: "Complete one existing mission",
      description: "Pick any single mission from today's list and finish it — just one.",
      difficulty: "tiny",
      estimatedMinutes: 3,
      category: "review",
      reason: "One completion breaks the stall and rebuilds momentum.",
    });
    // Add a simplified version of the today mission
    adaptive.push({
      id: `simplified-${missions.todayMission.id}`,
      title: `Simplified: ${missions.todayMission.title}`,
      description: `A lighter version: ${missions.todayMission.description.slice(0, 100)}`,
      difficulty: "easy",
      estimatedMinutes: Math.max(5, Math.round(missions.todayMission.estimatedMinutes / 2)),
      category: missions.todayMission.category,
      reason: "Full mission feels too heavy — a lighter version keeps progress alive.",
    });
  } else if (missionScore >= 65) {
    // High momentum → challenge missions
    adaptive.push(generateChallengeMission(missions));
    adaptive.push(generateMaintainMission(missions));
    adaptive.push({
      id: "streak-challenge",
      title: "Extend your streak",
      description: "Complete at least two missions today to extend or maintain your progress streak.",
      difficulty: "medium",
      estimatedMinutes: 10,
      category: "streak",
      reason: "Strong momentum — capitalizing on the streak to build lasting habits.",
    });
  } else {
    // Moderate → maintain
    adaptive.push(generateMaintainMission(missions));
    adaptive.push({
      id: "moderate-complete-easy",
      title: "Complete today's easy mission",
      description: missions.easyMission.description,
      difficulty: "easy",
      estimatedMinutes: missions.easyMission.estimatedMinutes,
      category: missions.easyMission.category,
      reason: "A quick win builds momentum without overcommitment.",
    });
  }

  // If blocks exist, add a block-targeting mission
  const highSeverityBlocks = blocks.filter((b) => b.severity === "high");
  if (highSeverityBlocks.length > 0) {
    adaptive.push({
      id: "address-blocks",
      title: "Address one blocker",
      description: `Focus on resolving one key blocker: ${highSeverityBlocks[0].detail.slice(0, 100)}`,
      difficulty: "medium",
      estimatedMinutes: 10,
      category: "review",
      reason: "Directly addressing the highest-severity blocker to unstick progress.",
    });
  }

  return adaptive;
}

function selectNextMission(
  adaptiveMissions: AdaptiveMission[],
  missionScore: number
): AdaptiveMission {
  if (adaptiveMissions.length === 0) {
    return {
      id: "fallback-mission",
      title: "Take any small step",
      description: "Start with one small action to begin building momentum.",
      difficulty: "tiny",
      estimatedMinutes: 2,
      category: "explore",
      reason: "No adaptive missions available — starting fresh with the smallest possible step.",
    };
  }

  // Low score → pick the easiest
  if (missionScore < 40) {
    const tiny = adaptiveMissions.find((m) => m.difficulty === "tiny");
    if (tiny) return tiny;
  }

  // High score → pick the hardest
  if (missionScore >= 65) {
    const hard = adaptiveMissions.find((m) => m.difficulty === "hard");
    if (hard) return hard;
  }

  // Default: pick the first mission
  return adaptiveMissions[0];
}

// ============================================================================
// NARRATIVE
// ============================================================================

function computeNarrative(
  missionScore: number,
  missionMomentum: number,
  missionRisk: MissionRisk,
  blocks: MissionBlock[],
  future: ReturnType<typeof getFutureSelf>
): string {
  if (missionScore >= 70 && missionMomentum >= 65) {
    const catalystCount = future.growthCatalysts.length;
    const catalystHint = catalystCount > 0
      ? ` ${catalystCount} growth catalyst(s) are amplifying your trajectory.`
      : "";
    return `Strong mission momentum (${missionMomentum}/100) with a mission score of ${missionScore}/100.${catalystHint} Your habits and energy are aligned — this is the time to push harder and take on more challenging missions that accelerate your career trajectory.`;
  }

  if (missionScore >= 50) {
    return `Moderate mission momentum (${missionMomentum}/100) with a score of ${missionScore}/100. You're making steady progress${
      missionRisk !== "low" ? `, though ${missionRisk} risk factors need attention` : ""
    }. Continue with balanced missions that maintain momentum without overwhelming your energy.`;
  }

  if (missionScore < 30) {
    const blockTypes = blocks.map((b) => b.type.replace(/_/g, " ")).join(", ");
    return `Mission momentum is low (${missionMomentum}/100) with a score of ${missionScore}/100. Key blockers detected: ${blockTypes}. The priority is tiny, confidence-building actions that restart momentum without pressure. Small wins compound quickly.`;
  }

  return `Mission score is ${missionScore}/100 with ${missionMomentum}/100 momentum${
    missionRisk !== "low" ? ` and ${missionRisk} risk` : ""
  }. Focus on consistent, manageable missions that build toward your long-term goals without risking burnout.`;
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

function computeMissionIntelligence(): MissionIntelligenceData {
  const missions = getDailyMissions();
  const goalState = loadGoalState();
  const pulse = getEngagementPulse();
  const habit = getHabitIntelligence();
  const future = getFutureSelf();
  const journey = loadJourneyMemory();

  // Detect blocks
  const blocks: MissionBlock[] = [
    detectStalledMissions(missions, habit),
    detectGoalDrift(goalState, future),
    detectEnergyMismatch(pulse, missions),
    detectHabitAlignment(habit),
    detectTrajectoryRisk(future),
  ].filter((b): b is MissionBlock => b !== null);

  // Compute core metrics
  const missionScore = computeMissionScore(habit, pulse, future, missions, goalState, blocks, journey);
  const missionMomentum = computeMissionMomentum(habit, pulse, future, missions, journey);
  const missionRisk = computeMissionRisk(blocks, future);

  // Generate adaptive missions
  const adaptiveMissions = generateAdaptiveMissions(missionScore, missions, blocks);
  const nextMission = selectNextMission(adaptiveMissions, missionScore);

  // Select active mission (the most relevant one)
  const activeMission = adaptiveMissions[0];

  // Narrative
  const missionNarrative = computeNarrative(missionScore, missionMomentum, missionRisk, blocks, future);

  const data: MissionIntelligenceData = {
    missionScore,
    activeMission,
    missionMomentum,
    missionRisk,
    missionBlocks: blocks,
    adaptiveMissions,
    nextMission,
    missionNarrative,
    computedAt: new Date().toISOString(),
  };

  cached = data;
  return data;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function loadMissionIntelligence(): MissionIntelligenceData | null {
  return cached;
}

export function getMissionIntelligence(): MissionIntelligenceData {
  if (cached && Date.now() - new Date(cached.computedAt).getTime() < CACHE_TTL) {
    return cached;
  }
  return computeMissionIntelligence();
}
