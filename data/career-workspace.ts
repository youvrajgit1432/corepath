/**
 * CAREER EXECUTION WORKSPACE
 *
 * Tracks ongoing progress toward career goals:
 * - Selected career & active roadmap phase
 * - Completed milestones & projects
 * - Weekly progress & streak
 * - Estimated career readiness
 *
 * Persists via SafeStorage (local storage).
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { roadmaps, type RoadmapStep } from "./roadmaps";
import { analyzeSkillGap } from "./skill-gap";
import { loadJourneyMemory } from "./journey-memory";
import type { Career } from "./careers";

const STORAGE_KEY = "corepath-career-workspace";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface ProgressEntry {
  date: string; // ISO string
  action: string; // e.g., "Completed: Build Blog API"
  type: "milestone" | "project" | "study";
}

export interface CareerWorkspace {
  selectedCareerId: string;
  selectedCareerTitle: string;
  activePhaseName: string; // e.g., "Programming Foundations"
  activePhaseNumber: number;
  completedMilestones: string[]; // milestone titles
  completedProjects: string[]; // project titles
  weeklyProgress: ProgressEntry[];
  streak: number; // consecutive days with at least one entry
  lastProgressDate: string; // ISO string, to track streak
  estimatedReadiness: number; // percentage 0–100
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// INITIALIZATION & PERSISTENCE
// ============================================================================

/**
 * Load workspace from SafeStorage.
 * Returns null if no workspace exists.
 */
export function loadCareerWorkspace(): CareerWorkspace | null {
  const storage = getSafeStorage({ silent: true });
  const raw = storage.get<CareerWorkspace>(STORAGE_KEY);
  return raw ? { ...raw, weeklyProgress: raw.weeklyProgress || [] } : null;
}

/**
 * Save workspace to SafeStorage.
 */
function saveCareerWorkspace(workspace: CareerWorkspace): void {
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, workspace);
}

/**
 * Create a new workspace for a selected career.
 */
export function selectCareer(career: Career): CareerWorkspace {
  const roadmap = roadmaps.find((r) => r.careerId === career.id);
  const firstPhase = roadmap?.steps[0];

  const workspace: CareerWorkspace = {
    selectedCareerId: career.id,
    selectedCareerTitle: career.title,
    activePhaseName: firstPhase?.title || "Phase 1",
    activePhaseNumber: firstPhase?.phase || 1,
    completedMilestones: [],
    completedProjects: [],
    weeklyProgress: [],
    streak: 0,
    lastProgressDate: "",
    estimatedReadiness: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveCareerWorkspace(workspace);
  return workspace;
}

/**
 * Ensure a workspace exists for the selected career.
 * If no workspace exists, initialize one for this career.
 */
export function ensureCareerWorkspace(career: Career): CareerWorkspace {
  const workspace = loadCareerWorkspace();
  if (workspace) return workspace;
  return selectCareer(career);
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Record a milestone completion.
 * Updates streak if new date. Returns updated workspace.
 */
export function recordMilestoneCompletion(milestoneName: string): CareerWorkspace | null {
  const workspace = loadCareerWorkspace();
  if (!workspace) return null;

  // Avoid duplicates
  if (workspace.completedMilestones.includes(milestoneName)) {
    return workspace;
  }

  workspace.completedMilestones.push(milestoneName);
  _updateProgressAndStreak(workspace, `Completed: ${milestoneName}`, "milestone");
  _calculateReadiness(workspace);
  workspace.updatedAt = new Date().toISOString();

  saveCareerWorkspace(workspace);
  return workspace;
}

/**
 * Record a project completion.
 * Updates streak if new date. Returns updated workspace.
 */
export function recordProjectCompletion(projectName: string): CareerWorkspace | null {
  const workspace = loadCareerWorkspace();
  if (!workspace) return null;

  // Avoid duplicates
  if (workspace.completedProjects.includes(projectName)) {
    return workspace;
  }

  workspace.completedProjects.push(projectName);
  _updateProgressAndStreak(workspace, `Project: ${projectName}`, "project");
  _calculateReadiness(workspace);
  workspace.updatedAt = new Date().toISOString();

  saveCareerWorkspace(workspace);
  return workspace;
}

/**
 * Record a study session (generic progress).
 * Updates streak if new date. Returns updated workspace.
 */
export function recordStudySession(action: string): CareerWorkspace | null {
  const workspace = loadCareerWorkspace();
  if (!workspace) return null;

  _updateProgressAndStreak(workspace, action, "study");
  workspace.updatedAt = new Date().toISOString();

  saveCareerWorkspace(workspace);
  return workspace;
}

/**
 * Advance to next roadmap phase.
 * Returns updated workspace.
 */
export function advancePhase(): CareerWorkspace | null {
  const workspace = loadCareerWorkspace();
  if (!workspace) return null;

  const roadmap = roadmaps.find((r) => r.careerId === workspace.selectedCareerId);
  if (!roadmap) return null;

  const nextPhase = roadmap.steps.find((s) => s.phase === workspace.activePhaseNumber + 1);
  if (!nextPhase) return null; // Already at final phase

  workspace.activePhaseNumber = nextPhase.phase;
  workspace.activePhaseName = nextPhase.title;
  workspace.updatedAt = new Date().toISOString();

  _updateProgressAndStreak(workspace, `Advanced to phase: ${nextPhase.title}`);
  saveCareerWorkspace(workspace);
  return workspace;
}

// ============================================================================
// READINESS CALCULATION
// ============================================================================

/**
 * Calculate estimated readiness as percentage of milestones completed.
 */
export function calculateReadiness(careerId?: string): number {
  const workspace = loadCareerWorkspace();
  if (!workspace) return 0;

  if (careerId && workspace.selectedCareerId !== careerId) {
    return 0;
  }

  return _calculateReadiness(workspace);
}

function _calculateReadiness(workspace: CareerWorkspace): number {
  const roadmap = roadmaps.find((r) => r.careerId === workspace.selectedCareerId);
  if (!roadmap || roadmap.steps.length === 0) {
    workspace.estimatedReadiness = 0;
    return 0;
  }

  // Count total milestones in current phase and earlier
  const currentPhaseIndex = workspace.activePhaseNumber - 1;
  const phasesMilestonesCount = roadmap.steps
    .slice(0, currentPhaseIndex + 1)
    .reduce((sum, step) => sum + 1, 0);

  const readiness = Math.round(
    (workspace.completedMilestones.length / phasesMilestonesCount) * 100
  );
  workspace.estimatedReadiness = Math.min(100, Math.max(0, readiness));
  return workspace.estimatedReadiness;
}

// ============================================================================
// NEXT ACTION RECOMMENDATION
// ============================================================================

/**
 * Get the recommended next action based on:
 * - Current phase
 * - Skill gaps
 * - Completed milestones
 */
export function getNextRecommendedAction(career?: Career): string {
  const workspace = loadCareerWorkspace();
  if (!workspace) return "Select a career to get started.";

  const roadmap = roadmaps.find((r) => r.careerId === workspace.selectedCareerId);
  if (!roadmap) return "No roadmap available for this career.";

  // Find current phase
  const currentPhase = roadmap.steps.find((s) => s.phase === workspace.activePhaseNumber);
  if (!currentPhase) return "Roadmap phase not found.";

  // Check if current phase is complete
  if (
    workspace.completedMilestones.some((m) =>
      currentPhase.milestone.toLowerCase().includes(m.toLowerCase())
    )
  ) {
    // Check if there's a next phase
    const nextPhase = roadmap.steps.find((s) => s.phase === workspace.activePhaseNumber + 1);
    if (nextPhase) {
      return `✓ Ready for next phase: "${nextPhase.title}". Start with: ${nextPhase.description.slice(0, 50)}...`;
    }
    return "✓ You've completed all phases!";
  }

  // Return current phase milestone
  return `Current: ${currentPhase.milestone}`;
}

// ============================================================================
// WEEKLY PROGRESS
// ============================================================================

/**
 * Get this week's progress entries.
 */
export function getWeeklyProgress(): ProgressEntry[] {
  const workspace = loadCareerWorkspace();
  if (!workspace) return [];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return workspace.weeklyProgress.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= weekAgo && entryDate <= now;
  });
}

/**
 * Get streak information.
 */
export function getStreakInfo(): { streak: number; lastDate: string } {
  const workspace = loadCareerWorkspace();
  if (!workspace) return { streak: 0, lastDate: "" };

  return {
    streak: workspace.streak,
    lastDate: workspace.lastProgressDate,
  };
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Update progress entry and recalculate streak.
 */
function _updateProgressAndStreak(
  workspace: CareerWorkspace,
  action: string,
  type: ProgressEntry["type"] = "milestone"
): void {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Check if today's entry exists
  const todayEntry = workspace.weeklyProgress.find((e) => e.date.startsWith(today));

  if (!todayEntry) {
    // New day entry
    workspace.weeklyProgress.push({
      date: now.toISOString(),
      action,
      type,
    });

    // Update streak
    if (workspace.lastProgressDate) {
      const lastDate = new Date(workspace.lastProgressDate);
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

      if (daysDiff === 1) {
        workspace.streak += 1;
      } else if (daysDiff > 1) {
        workspace.streak = 1;
      }
      // If daysDiff === 0, it's same day, don't update streak
    } else {
      workspace.streak = 1;
    }

    workspace.lastProgressDate = now.toISOString();
  }

  // Keep only last 30 days of progress
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  workspace.weeklyProgress = workspace.weeklyProgress.filter((e) => e.date > thirtyDaysAgo);
}
