/**
 * ADAPTIVE ROADMAP INTELLIGENCE
 *
 * Turns static roadmaps into living roadmaps by analyzing user signals:
 * - Portfolio evidence → skip beginner steps
 * - High progress → accelerate
 * - Large skill gaps → slow pace
 * - Low confidence → insert reinforcement milestones
 *
 * No backend. Pure signal analysis from existing data sources.
 * Persists computed state via SafeStorage.
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { loadCareerWorkspace } from "./career-workspace";
import type { Career } from "./careers";
import { analyzeSkillGap, type SkillGapResult } from "./skill-gap";
import type { RoadmapStep } from "./roadmaps";
import type { EnhancedProfile } from "./quiz-enhanced";

const STORAGE_KEY = "corepath-adaptive-roadmap";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface SkipSuggestion {
  phase: number;
  title: string;
  reason: string;
}

export interface AccelerateSignal {
  signal: string;
  impact: number; // 0–1 how strongly to accelerate
  reason: string;
}

export interface DifficultyAdjustment {
  multiplier: number; // < 1 = easier/faster, > 1 = harder/slower
  reason: string;
}

export interface PersonalizedMilestone {
  phase: number;
  title: string;
  description: string;
  type: "reinforcement" | "stretch";
}

export interface AdaptiveWarning {
  type: "info" | "warning" | "critical";
  message: string;
  source: "skill_gap" | "confidence" | "progress" | "portfolio";
}

export interface EstimatedTimelineAdjustment {
  /** Percentage adjustment: positive = faster, negative = slower */
  percentChange: number;
  originalEstimate: string;
  adjustedEstimate: string;
  reasons: string[];
}

export interface AdaptiveRoadmapState {
  recommendedOrder: RoadmapStep[];
  skipSuggestions: SkipSuggestion[];
  accelerateSignals: AccelerateSignal[];
  difficultyAdjustment: DifficultyAdjustment;
  personalizedMilestones: PersonalizedMilestone[];
  adaptiveWarnings: AdaptiveWarning[];
  estimatedTimelineAdjustment: EstimatedTimelineAdjustment;
  computedAt: string;
  careerId: string;
}

// ============================================================================
// THRESHOLDS
// ============================================================================

const CONFIDENCE_LOW_THRESHOLD = 40;
const CONFIDENCE_MEDIUM_THRESHOLD = 60;
const GAP_LARGE_THRESHOLD = 0.6;
const GAP_CRITICAL_THRESHOLD = 0.8;
const MOMENTUM_HIGH_THRESHOLD = 70;
const MOMENTUM_MEDIUM_THRESHOLD = 40;
const MILESTONE_ACCELERATE_THRESHOLD = 2;

// ============================================================================
// HELPERS
// ============================================================================

function getAverageConfidence(): number {
  const memory = loadJourneyMemory();
  if (memory.confidenceHistory.length === 0) return 0;
  return (
    memory.confidenceHistory.reduce((sum, v) => sum + v, 0) /
    memory.confidenceHistory.length
  );
}

function getConfidenceTrend(): "rising" | "falling" | "stable" {
  const memory = loadJourneyMemory();
  const history = memory.confidenceHistory;
  if (history.length < 2) return "stable";
  const recent = history.slice(-3);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  if (diff > 5) return "rising";
  if (diff < -5) return "falling";
  return "stable";
}

function hasPortfolioEvidence(): boolean {
  const memory = loadJourneyMemory();
  // Derive portfolio evidence from journey signals:
  // multiple quiz completions + viewed careers + roadmap engagement
  // indicate an active, engaged user with enough context
  const hasMultipleQuizzes = memory.completedQuizzes >= 2;
  const hasViewedCareers = Object.keys(memory.viewedCareers).length >= 3;
  const hasRoadmapEngagement = Object.keys(memory.roadmapInteractions).length > 0;
  return hasMultipleQuizzes || (hasViewedCareers && hasRoadmapEngagement);
}

function totalDurationMonths(steps: RoadmapStep[]): number {
  let total = 0;
  for (const step of steps) {
    const monthMatch = step.duration.match(/(\d+)\s*months?/i);
    if (monthMatch) {
      const parts = step.duration.match(/(\d+)/g);
      if (parts) {
        total += parseInt(parts[parts.length - 1], 10);
      }
      continue;
    }
    const weekMatch = step.duration.match(/(\d+)\s*weeks?/i);
    if (weekMatch) {
      total += parseInt(weekMatch[1], 10) / 4;
    }
  }
  return Math.round(total);
}

function monthsToDuration(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}–${years + 1} years` : `${years} years`;
  }
  return `${months} months`;
}

// ============================================================================
// COMPUTATION FUNCTIONS
// ============================================================================

/**
 * Compute the recommended order of roadmap phases based on user strengths.
 * Phases marked for skipping are excluded. Known skills move up.
 */
function computeRecommendedOrder(
  steps: RoadmapStep[],
  skillGap: SkillGapResult | null,
  skipSuggestions: SkipSuggestion[]
): RoadmapStep[] {
  // Filter out skipped phases first
  const skipPhaseSet = new Set(skipSuggestions.map((s) => s.phase));
  const remaining = steps.filter((s) => !skipPhaseSet.has(s.phase));

  if (remaining.length === 0) return steps; // Don't skip everything

  if (!skillGap || skillGap.existingStrengths.length === 0) {
    return remaining; // No reordering needed, just filtered
  }

  const existingLower = skillGap.existingStrengths.map((s) =>
    s.toLowerCase()
  );

  // Score each remaining phase by how many existing skills it covers
  const scored = remaining.map((step) => {
    let matchCount = 0;
    for (const skill of step.skills) {
      const skillLower = skill.toLowerCase();
      if (existingLower.some((s) => skillLower.includes(s) || s.includes(skillLower))) {
        matchCount++;
      }
    }
    return { step, matchCount };
  });

  // Sort: phases with more matching skills first (preserve relative order among ties)
  const sorted = [...scored].sort((a, b) => {
    if (a.matchCount !== b.matchCount) return b.matchCount - a.matchCount;
    return steps.indexOf(a.step) - steps.indexOf(b.step);
  });

  return sorted.map((s) => s.step);
}

/**
 * Determine which phases can be skipped based on portfolio evidence.
 */
function computeSkipSuggestions(
  steps: RoadmapStep[],
  career: Career | null,
  hasEvidence: boolean,
  skillGap: SkillGapResult | null
): SkipSuggestion[] {
  const suggestions: SkipSuggestion[] = [];

  if (!hasEvidence) {
    return suggestions; // Not enough evidence to skip
  }

  // Skip phase 1 (beginners/foundations) if user has portfolio evidence
  const firstPhase = steps[0];
  if (firstPhase && firstPhase.phase === 1) {
    suggestions.push({
      phase: firstPhase.phase,
      title: firstPhase.title,
      reason:
        "Your portfolio shows existing project evidence. Skip foundational phase and start with core skill work.",
    });
  }

  // Skip additional phases if core skill is already covered
  if (skillGap && career) {
    const coreSkillLower = career.coreSkill?.toLowerCase() ?? "";
    const hasCoreSkill = skillGap.existingStrengths.some((s) =>
      s.toLowerCase().includes(coreSkillLower)
    );
    if (hasCoreSkill) {
      const corePhase = steps.find((s) =>
        s.title.toLowerCase().includes("core") ||
        s.title.toLowerCase().includes(career.coreSkill?.toLowerCase() ?? "")
      );
      if (corePhase && steps.length > 1) {
        // Don't skip the core phase itself, but the phases before it
        const phasesBefore = steps.filter(
          (s) => s.phase < corePhase.phase && s.phase > 1
        );
        for (const phase of phasesBefore) {
          if (!suggestions.find((sg) => sg.phase === phase.phase)) {
            suggestions.push({
              phase: phase.phase,
              title: phase.title,
              reason: `You already demonstrate ${career.coreSkill} expertise. Skip prerequisites and focus on advanced work.`,
            });
          }
        }
      }
    }
  }

  return suggestions;
}

/**
 * Detect signals that suggest the roadmap should be accelerated.
 */
function computeAccelerateSignals(
  skillGap: SkillGapResult | null,
  hasEvidence: boolean,
  confidenceTrend: string
): AccelerateSignal[] {
  const signals: AccelerateSignal[] = [];
  const workspace = loadCareerWorkspace();
  const progress = workspace ? workspace.completedMilestones.length : 0;
  const momentum = workspace
    ? Math.min(50, workspace.streak * 10) +
      Math.min(50, workspace.weeklyProgress.length * 10)
    : 0;

  // High milestone completion → accelerate
  if (progress >= MILESTONE_ACCELERATE_THRESHOLD) {
    signals.push({
      signal: "milestone_completion",
      impact: 0.6,
      reason: `Completed ${progress} milestones — ready to move faster.`,
    });
  }

  // High learning momentum → accelerate
  if (momentum >= MOMENTUM_HIGH_THRESHOLD) {
    signals.push({
      signal: "high_momentum",
      impact: 0.5,
      reason: "Strong learning momentum detected — accelerating recommended pace.",
    });
  } else if (momentum >= MOMENTUM_MEDIUM_THRESHOLD) {
    signals.push({
      signal: "moderate_momentum",
      impact: 0.2,
      reason: "Consistent engagement — slight acceleration recommended.",
    });
  }

  // Rising confidence → modest acceleration
  if (confidenceTrend === "rising") {
    signals.push({
      signal: "rising_confidence",
      impact: 0.3,
      reason: "Confidence is increasing — suggests readiness to advance.",
    });
  }

  // Portfolio evidence → accelerate
  if (hasEvidence) {
    signals.push({
      signal: "strong_portfolio",
      impact: 0.4,
      reason: "Portfolio evidence shows experience — can move through content faster.",
    });
  }

  // Small skill gap → accelerate slightly
  if (skillGap && skillGap.gapScore < 0.3) {
    signals.push({
      signal: "small_skill_gap",
      impact: 0.3,
      reason: "Most skills already covered — focus on depth and real-world projects.",
    });
  }

  return signals;
}

/**
 * Determine difficulty/multiplier adjustment based on skill gaps.
 */
function computeDifficultyAdjustment(
  skillGap: SkillGapResult | null
): DifficultyAdjustment {
  if (!skillGap) {
    return { multiplier: 1, reason: "No skill gap data available." };
  }

  if (skillGap.gapScore >= GAP_CRITICAL_THRESHOLD) {
    return {
      multiplier: 1.8,
      reason: `Large skill gap (${Math.round(skillGap.gapScore * 100)}%). Significant foundational work needed before advancing.`,
    };
  }

  if (skillGap.gapScore >= GAP_LARGE_THRESHOLD) {
    return {
      multiplier: 1.4,
      reason: `Substantial skill gap (${Math.round(skillGap.gapScore * 100)}%). Plan extra time for foundational building.`,
    };
  }

  if (skillGap.gapScore > 0.3) {
    return {
      multiplier: 1.15,
      reason: `Moderate skill gap (${Math.round(skillGap.gapScore * 100)}%). Some extra time recommended for missing skills.`,
    };
  }

  return {
    multiplier: 1,
    reason: "Skills are well-aligned. No adjustment needed.",
  };
}

/**
 * Insert reinforcement milestones when confidence is low or gaps are large.
 */
function computePersonalizedMilestones(
  skillGap: SkillGapResult | null,
  averageConfidence: number,
  steps: RoadmapStep[]
): PersonalizedMilestone[] {
  const milestones: PersonalizedMilestone[] = [];

  // Low confidence → add reinforcement milestone
  if (averageConfidence < CONFIDENCE_LOW_THRESHOLD && steps.length > 0) {
    milestones.push({
      phase: steps[0].phase,
      title: "Confidence Builder: Practice Project",
      description:
        "Build a small practice project to reinforce what you've learned and build confidence before moving to the next phase.",
      type: "reinforcement",
    });
  }

  // Medium-low confidence → add stretch milestone
  if (
    averageConfidence >= CONFIDENCE_LOW_THRESHOLD &&
    averageConfidence < CONFIDENCE_MEDIUM_THRESHOLD &&
    steps.length > 1
  ) {
    milestones.push({
      phase: steps[Math.min(1, steps.length - 1)].phase,
      title: "Guided Implementation",
      description:
        "Follow a structured tutorial to build a real-world example. This bridges understanding and independent work.",
      type: "reinforcement",
    });
  }

  // Large gap → add fundamentals milestone
  if (skillGap && skillGap.gapScore >= GAP_LARGE_THRESHOLD && steps.length > 0) {
    milestones.push({
      phase: steps[0].phase,
      title: "Foundations Deep Dive",
      description:
        `Address missing skills: ${skillGap.missingSkills.slice(0, 3).join(", ")}. Complete targeted exercises before progressing.`,
      type: "reinforcement",
    });
  }

  return milestones;
}

/**
 * Generate adaptive warnings based on all signals.
 */
function computeAdaptiveWarnings(
  skillGap: SkillGapResult | null,
  averageConfidence: number,
  hasEvidence: boolean,
  confidenceTrend: string
): AdaptiveWarning[] {
  const warnings: AdaptiveWarning[] = [];

  // Skill gap warnings
  if (skillGap) {
    if (skillGap.gapScore >= GAP_CRITICAL_THRESHOLD) {
      warnings.push({
        type: "critical",
        message: `Large skill gap (${Math.round(skillGap.gapScore * 100)}%). Focus on fundamentals before progressing.`,
        source: "skill_gap",
      });
    } else if (skillGap.gapScore >= GAP_LARGE_THRESHOLD) {
      warnings.push({
        type: "warning",
        message: `Significant skill gap (${Math.round(skillGap.gapScore * 100)}%). Consider allocating extra study time.`,
        source: "skill_gap",
      });
    }
  }

  // Confidence warnings
  if (averageConfidence < CONFIDENCE_LOW_THRESHOLD) {
    warnings.push({
      type: "warning",
      message:
        "Confidence is low. Build small wins with practice projects before advancing to complex topics.",
      source: "confidence",
    });
  } else if (
    averageConfidence >= CONFIDENCE_LOW_THRESHOLD &&
    averageConfidence < CONFIDENCE_MEDIUM_THRESHOLD
  ) {
    warnings.push({
      type: "info",
      message:
        "Moderate confidence. Keep reinforcing through hands-on projects.",
      source: "confidence",
    });
  }

  // Confidence trend warning
  if (confidenceTrend === "falling") {
    warnings.push({
      type: "warning",
      message:
        "Confidence is declining. Consider retaking the quiz or reviewing your chosen path.",
      source: "confidence",
    });
  }

  // Portfolio warnings
  if (!hasEvidence) {
    warnings.push({
      type: "info",
      message:
        "No portfolio evidence detected. Adding resume or GitHub projects helps personalize your roadmap.",
      source: "portfolio",
    });
  }

  // Progress warnings
  const workspace = loadCareerWorkspace();
  if (workspace && workspace.weeklyProgress.length === 0) {
    warnings.push({
      type: "info",
      message:
        "No recent progress tracked. Even small daily actions maintain momentum.",
      source: "progress",
    });
  }

  return warnings;
}

/**
 * Compute the overall timeline adjustment as a combined percentage.
 */
function computeTimelineAdjustment(
  steps: RoadmapStep[],
  accelerateSignals: AccelerateSignal[],
  difficultyAdjustment: DifficultyAdjustment,
  skipSuggestions: SkipSuggestion[]
): EstimatedTimelineAdjustment {
  const totalMonths = totalDurationMonths(steps);

  // Calculate acceleration from signals (take the strongest signal as primary)
  const maxAcceleration =
    accelerateSignals.length > 0
      ? Math.max(...accelerateSignals.map((s) => s.impact))
      : 0;

  // Net change: acceleration (negative = faster) vs difficulty (positive = slower)
  const accelerationPercent = maxAcceleration * -30; // up to 30% faster
  const difficultyPercent = (difficultyAdjustment.multiplier - 1) * 100; // positive = slower
  const skipPercent = skipSuggestions.length * -15; // each skip saves ~15%

  const totalPercentChange = Math.round(
    accelerationPercent + difficultyPercent + skipPercent
  );

  // Clamp between -60% and +100%
  const clampedPercent = Math.max(-60, Math.min(100, totalPercentChange));

  const adjustedMonths = Math.round(
    totalMonths * (1 + clampedPercent / 100)
  );
  const finalMonths = Math.max(1, adjustedMonths);

  const reasons: string[] = [];

  if (accelerateSignals.length > 0) {
    reasons.push(accelerateSignals[0].reason);
  }
  if (difficultyAdjustment.multiplier > 1) {
    reasons.push(difficultyAdjustment.reason);
  }
  if (skipSuggestions.length > 0) {
    reasons.push(
      `Skipping ${skipSuggestions.length} phase(s) reduces total time.`
    );
  }
  if (reasons.length === 0) {
    reasons.push("No significant adjustment needed based on current signals.");
  }

  return {
    percentChange: clampedPercent,
    originalEstimate: monthsToDuration(totalMonths),
    adjustedEstimate: monthsToDuration(finalMonths),
    reasons,
  };
}

// ============================================================================
// MAIN PUBLIC API
// ============================================================================

/**
 * Compute the full adaptive roadmap state for a given career and its steps.
 *
 * @param steps - The original roadmap steps
 * @param career - The target career (optional)
 * @param userSkills - Explicit user skills (optional)
 * @param profile - Enhanced profile (optional)
 * @returns AdaptiveRoadmapState
 */
export function computeAdaptiveRoadmap(
  steps: RoadmapStep[],
  career?: Career | null,
  userSkills: string[] = [],
  profile?: EnhancedProfile | null
): AdaptiveRoadmapState {
  const skillGap = career
    ? analyzeSkillGap(career, userSkills, profile ?? null)
    : null;

  const avgConfidence = getAverageConfidence();
  const confidenceTrend = getConfidenceTrend();
  const hasEvidence = hasPortfolioEvidence();

  // Compute skip suggestions first since recommendedOrder depends on them
  const skipSuggestions = computeSkipSuggestions(
    steps,
    career ?? null,
    hasEvidence,
    skillGap
  );
  const recommendedOrder = computeRecommendedOrder(steps, skillGap, skipSuggestions);
  const accelerateSignals = computeAccelerateSignals(
    skillGap,
    hasEvidence,
    confidenceTrend
  );
  const difficultyAdjustment = computeDifficultyAdjustment(skillGap);
  const personalizedMilestones = computePersonalizedMilestones(
    skillGap,
    avgConfidence,
    steps
  );
  const adaptiveWarnings = computeAdaptiveWarnings(
    skillGap,
    avgConfidence,
    hasEvidence,
    confidenceTrend
  );
  const estimatedTimelineAdjustment = computeTimelineAdjustment(
    steps,
    accelerateSignals,
    difficultyAdjustment,
    skipSuggestions
  );

  // Build the final state
  const state: AdaptiveRoadmapState = {
    recommendedOrder,
    skipSuggestions,
    accelerateSignals,
    difficultyAdjustment,
    personalizedMilestones,
    adaptiveWarnings,
    estimatedTimelineAdjustment,
    computedAt: new Date().toISOString(),
    careerId: career?.id ?? "unknown",
  };

  // Persist to local storage
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, state);

  return state;
}

/**
 * Load the most recently computed adaptive roadmap from storage.
 */
export function loadAdaptiveRoadmap(): AdaptiveRoadmapState | null {
  const storage = getSafeStorage({ silent: true });
  return storage.get<AdaptiveRoadmapState>(STORAGE_KEY);
}

/**
 * Compute adaptive roadmap and return only the warnings.
 * Useful for lightweight integration.
 */
export function getAdaptiveWarnings(
  steps: RoadmapStep[],
  career?: Career | null
): AdaptiveWarning[] {
  return computeAdaptiveRoadmap(steps, career).adaptiveWarnings;
}

/**
 * Check if the roadmap should be adapted for this career (user has enough data).
 */
export function shouldAdaptRoadmap(): boolean {
  const memory = loadJourneyMemory();
  const workspace = loadCareerWorkspace();
  return (
    memory.completedQuizzes > 0 ||
    (workspace !== null && workspace.completedMilestones.length > 0)
  );
}
