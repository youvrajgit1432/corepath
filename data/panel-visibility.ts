/**
 * ADAPTIVE PANEL VISIBILITY INTELLIGENCE
 *
 * Computes user stage and panel priority to prevent information overload
 * through progressive disclosure.
 *
 * Visibility Optimization (v2):
 *   - new_user:   max 5 major sections — execution, identity, insights
 *   - returning:  max 8 sections — + predictions, history
 *   - engaged:    8 sections — + future, growth, story
 *   - power_user: all 9 sections — + memory
 *
 * Inputs:
 *   journey-memory      (sessions, quiz completions, viewed careers)
 *   engagement-pulse    (pulse score, energy forecast, consistency)
 *   habit-intelligence  (habit score, breaking patterns)
 *   mission-intelligence (mission score, blocks, risk)
 *   achievement-engine  (level, XP, unlocked count)
 *   career-workspace    (workspace existence, streak, milestones)
 *
 * Outputs:
 *   userStage: new_user | returning | engaged | power_user
 *   panelGroupVisibility: map of group → PanelPriority
 *
 * No backend. No auth. Persists computed state via SafeStorage.
 */

import { loadJourneyMemory } from "./journey-memory";
import { loadEngagementPulse } from "./engagement-pulse";
import { loadHabitIntelligence } from "./habit-intelligence";
import { loadMissionIntelligence } from "./mission-intelligence";
import { loadAchievements } from "./achievement-engine";
import { loadCareerWorkspace } from "./career-workspace";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-panel-visibility";
const EXPANDED_STORAGE_PREFIX = "corepath-panel-expanded-";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type UserStage = "new_user" | "returning" | "engaged" | "power_user";

export type PanelPriority = "critical" | "recommended" | "advanced" | "hidden";

/** Visibility result for a panel group */
export type GroupVisibility = "visible" | "expandable" | "hidden";

/** Configuration per panel group */
export interface PanelGroupConfig {
  id: string;
  label: string;
  description: string;
  priority: PanelPriority;
  /** Icon shown in the expandable section header */
  icon?: string;
}

/** Full visibility output */
export interface PanelVisibilityData {
  userStage: UserStage;
  sessionCount: number;
  quizCount: number;
  hasWorkspace: boolean;
  streak: number;
  missionCompletions: number;
  /** Per-group visibility status */
  groups: PanelGroupConfig[];
  /** Map of groupId → visibility */
  visibilityMap: Record<string, GroupVisibility>;
  /** Narrative describing what's available */
  narrative: string;
  computedAt: string;
}

// ============================================================================
// STAGE DEFINITIONS
// ============================================================================

const STAGE_THRESHOLDS = {
  power_user: {
    sessions: 15,
    quizzes: 5,
    streak: 7,
    label: "Power User",
    description: "Full access to all intelligence systems",
  },
  engaged: {
    sessions: 5,
    quizzes: 3,
    streak: 0,
    label: "Engaged Explorer",
    description: "Unlocked: Future self, Growth forecast, Decision confidence, Career story",
  },
  returning: {
    sessions: 2,
    quizzes: 1,
    streak: 0,
    label: "Returning User",
    description: "Unlocked: Predictions & History panels",
  },
  new_user: {
    sessions: 0,
    quizzes: 0,
    streak: 0,
    label: "New User",
    description: "Showing: Execution, Identity, Insights — up to 3 core sections",
  },
} as const;

// ============================================================================
// PANEL GROUP DEFINITIONS
// ============================================================================
//
// Visibility Optimization — section limits per stage:
//   new_user   max 5 → execution + identity + insights = 3
//   returning  max 8 → + predictions + history = 5
//   engaged    8     → + future + growth + story = 8
//   power_user full  → + memory = 9
//

const ALL_GROUPS: PanelGroupConfig[] = [
  // ── Critical — always_visible (new_user) ──
  {
    id: "execution",
    label: "Execution",
    description: "Sprints, actions, and mission tracking",
    priority: "critical",
    icon: "🎯",
  },
  {
    id: "identity",
    label: "Career Identity",
    description: "Who you are as a professional",
    priority: "critical",
    icon: "🧑",
  },
  {
    id: "insights",
    label: "Insights",
    description: "Behavior, learning, and growth patterns",
    priority: "critical",
    icon: "💡",
  },

  // ── Recommended — returning_user ──
  {
    id: "predictions",
    label: "Predictions",
    description: "Forecasts, fit, and decision intelligence",
    priority: "recommended",
    icon: "🔮",
  },
  {
    id: "history",
    label: "History",
    description: "Replay, reflection, and progress intelligence",
    priority: "recommended",
    icon: "📜",
  },

  // ── Advanced — engaged ──
  // Future self, Growth forecast, Decision confidence, Career story
  {
    id: "future",
    label: "Future Self",
    description: "Projected trajectory and decision confidence",
    priority: "advanced",
    icon: "🚀",
  },
  {
    id: "growth",
    label: "Growth Forecast",
    description: "Forecasts, trends, and confidence evolution",
    priority: "advanced",
    icon: "📈",
  },
  {
    id: "story",
    label: "Career Story",
    description: "Your evolving career narrative and trajectory",
    priority: "advanced",
    icon: "📖",
  },

  // ── Hidden — power_user only ──
  {
    id: "memory",
    label: "Memory & Adaptation",
    description: "Vault, coaching, and system self-correction",
    priority: "hidden",
    icon: "🧠",
  },
];

// ============================================================================
// STAGE COMPUTATION
// ============================================================================

const STAGE_LEVEL: Record<UserStage, number> = {
  new_user: 0,
  returning: 1,
  engaged: 2,
  power_user: 3,
};

const PRIORITY_LEVEL: Record<PanelPriority, number> = {
  critical: 0,
  recommended: 1,
  advanced: 2,
  hidden: 3,
};

/**
 * Compute user stage from available data.
 */
export function computeUserStage(
  sessions: number,
  completedQuizzes: number,
  hasWorkspace: boolean,
  streak: number,
  _missionCompletions: number
): UserStage {
  if (
    sessions >= STAGE_THRESHOLDS.power_user.sessions &&
    completedQuizzes >= STAGE_THRESHOLDS.power_user.quizzes &&
    hasWorkspace &&
    streak >= STAGE_THRESHOLDS.power_user.streak
  ) {
    return "power_user";
  }
  if (
    sessions >= STAGE_THRESHOLDS.engaged.sessions &&
    completedQuizzes >= STAGE_THRESHOLDS.engaged.quizzes &&
    hasWorkspace
  ) {
    return "engaged";
  }
  if (
    sessions >= STAGE_THRESHOLDS.returning.sessions &&
    completedQuizzes >= STAGE_THRESHOLDS.returning.quizzes
  ) {
    return "returning";
  }
  return "new_user";
}

/**
 * Determine the visibility of a group based on user stage and group priority.
 */
export function computeGroupVisibility(
  groupPriority: PanelPriority,
  userStage: UserStage
): GroupVisibility {
  const userLevel = STAGE_LEVEL[userStage];
  const requiredLevel = PRIORITY_LEVEL[groupPriority];

  if (userLevel >= requiredLevel) return "visible";
  // If the user is one stage below, show as expandable (tease the content)
  if (userLevel >= requiredLevel - 1) return "expandable";
  return "hidden";
}

// ============================================================================
// EXPANDED STATE PERSISTENCE
// ============================================================================

/**
 * Get the stored expanded state for a panel group.
 */
export function getGroupExpanded(groupId: string): boolean {
  const storage = getSafeStorage({ silent: true });
  return storage.get<boolean>(EXPANDED_STORAGE_PREFIX + groupId) ?? false;
}

/**
 * Set the expanded state for a panel group.
 */
export function setGroupExpanded(groupId: string, expanded: boolean): void {
  const storage = getSafeStorage({ silent: true });
  storage.set(EXPANDED_STORAGE_PREFIX + groupId, expanded);
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

function buildNarrative(
  userStage: UserStage,
  visibleCount: number,
  expandableCount: number,
  hiddenCount: number
): string {
  const stageInfo = STAGE_THRESHOLDS[userStage];

  if (userStage === "new_user") {
    return `Welcome! You're in the **${stageInfo.label}** stage. ${visibleCount} core sections are active — your execution tools, career identity, and behavior insights. Complete your first quiz and explore a career to unlock predictions and history panels.`;
  }

  if (userStage === "returning") {
    return `You're a **${stageInfo.label}** with ${visibleCount} sections active. ${stageInfo.description}. Continue taking quizzes and setting up your workspace to reach **Engaged Explorer** and unlock Future Self, Growth Forecast, and Career Story.`;
  }

  if (userStage === "engaged") {
    return `Great momentum! You're an **${stageInfo.label}** — ${visibleCount} sections are active. ${stageInfo.description}. Maintain your streak and complete more missions to become a **Power User** with full access to all ${visibleCount + expandableCount + hiddenCount} intelligence systems.`;
  }

  return `You're a **${stageInfo.label}** — all ${visibleCount} intelligence systems are unlocked. Your engagement depth qualifies you for the full CorePath experience.`;
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute full panel visibility state from all available data sources.
 */
export function computePanelVisibility(): PanelVisibilityData {
  const journey = loadJourneyMemory();
  const pulse = loadEngagementPulse();
  const habit = loadHabitIntelligence();
  const mission = loadMissionIntelligence();
  const achievements = loadAchievements();
  const workspace = loadCareerWorkspace();

  // ── Gather inputs ──
  const sessionCount = journey.completedQuizzes;
  const quizCount = journey.completedQuizzes;
  const hasWorkspace = workspace !== null;
  const streak = workspace?.streak ?? 0;
  const missionCompletions = mission?.activeMission ? 1 : 0;

  // ── Compute stage ──
  const userStage = computeUserStage(
    sessionCount,
    quizCount,
    hasWorkspace,
    streak,
    missionCompletions
  );

  // ── Compute visibility per group ──
  const visibilityMap: Record<string, GroupVisibility> = {};
  const groups = ALL_GROUPS.map((group) => {
    const visibility = computeGroupVisibility(group.priority, userStage);
    visibilityMap[group.id] = visibility;
    return { ...group };
  });

  const visibleCount = Object.values(visibilityMap).filter((v) => v === "visible").length;
  const expandableCount = Object.values(visibilityMap).filter((v) => v === "expandable").length;
  const hiddenCount = Object.values(visibilityMap).filter((v) => v === "hidden").length;

  const narrative = buildNarrative(userStage, visibleCount, expandableCount, hiddenCount);

  const data: PanelVisibilityData = {
    userStage,
    sessionCount,
    quizCount,
    hasWorkspace,
    streak,
    missionCompletions,
    groups,
    visibilityMap,
    narrative,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, data);

  return data;
}

/**
 * Load previously computed panel visibility data.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadPanelVisibility(): PanelVisibilityData | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<PanelVisibilityData>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  return cached;
}

/**
 * Get the current panel visibility, computing fresh if needed.
 */
export function getPanelVisibility(): PanelVisibilityData {
  const existing = loadPanelVisibility();
  if (existing) return existing;
  return computePanelVisibility();
}

/**
 * Check if a specific group is currently visible (returns true for both visible and expandable).
 */
export function isGroupActive(groupId: string, data: PanelVisibilityData): boolean {
  const visibility = data.visibilityMap[groupId];
  return visibility === "visible" || visibility === "expandable";
}

/**
 * Get the minimum user stage requirement for a given priority level.
 */
export function getMinimumStageForPriority(priority: PanelPriority): UserStage {
  const stageByPriority: Record<PanelPriority, UserStage> = {
    critical: "new_user",
    recommended: "returning",
    advanced: "engaged",
    hidden: "power_user",
  };
  return stageByPriority[priority];
}

/**
 * Get unlock message for a group — what the user needs to do to unlock it.
 */
export function getUnlockHint(group: PanelGroupConfig, userStage: UserStage): string {
  const requiredStage = getMinimumStageForPriority(group.priority);

  if (requiredStage === "returning") {
    return "Complete 2+ quizzes to unlock these insights.";
  }
  if (requiredStage === "engaged") {
    return "Complete 5+ quizzes and set up your workspace to unlock Future Self, Growth Forecast, and Career Story.";
  }
  if (requiredStage === "power_user") {
    return "Reach Power User status (15+ sessions, active workspace, 7-day streak) to unlock all systems.";
  }

  return "";
}
