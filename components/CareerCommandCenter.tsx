"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { loadCareerWorkspace, getNextRecommendedAction } from "../data/career-workspace";
import { loadGoalState } from "../data/career-goals";
import { getDailyMissions, isMissionCompleted, completeMission } from "../data/daily-missions";
import { getWeeklyReflection } from "../data/weekly-reflection";
import { computeAchievements, levelProgressPercentage } from "../data/achievement-engine";
import { computeCareerProgress } from "../data/career-progress";
import { getUnreadCount, getNotifications } from "../data/notification-engine";
import { getCareerById } from "../data/careers";
import { getSafeStorage } from "../data/safe-storage";
import { loadJourneyMemory } from "../data/journey-memory";
import { computePanelVisibility, getPanelVisibility, getUnlockHint } from "../data/panel-visibility";
import AdaptivePanelContainer from "./AdaptivePanelContainer";
import type { PanelVisibilityData, UserStage } from "../data/panel-visibility";
import GrowthAnalyticsPanel from "./GrowthAnalyticsPanel";
import JourneyReplayPanel from "./JourneyReplayPanel";
import CareerIdentityPanel from "./CareerIdentityPanel";
import BehaviorInsightsPanel from "./BehaviorInsightsPanel";
import PredictiveInsightsPanel from "./PredictiveInsightsPanel";
import PredictionFeedbackPanel from "./PredictionFeedbackPanel";
import RecommendationEvolutionPanel from "./RecommendationEvolutionPanel";
import ActionSprintPanel from "./ActionSprintPanel";
import DecisionReadinessPanel from "./DecisionReadinessPanel";
import DecisionPriorityPanel from "./DecisionPriorityPanel";
import PersonalEvolutionPanel from "./PersonalEvolutionPanel";
import LearningStylePanel from "./LearningStylePanel";
import LearningFrictionPanel from "./LearningFrictionPanel";
import ChangeAttributionPanel from "./ChangeAttributionPanel";
import HabitIntelligencePanel from "./HabitIntelligencePanel";
import UniquenessPanel from "./UniquenessPanel";
import FutureSelfPanel from "./FutureSelfPanel";
import DecisionConfidencePanel from "./DecisionConfidencePanel";
import MissionIntelligencePanel from "./MissionIntelligencePanel";
import CareerMomentumPanel from "./CareerMomentumPanel";
import CareerAlignmentPanel from "./CareerAlignmentPanel";
import CareerStoryPanel from "./CareerStoryPanel";
import IntelligenceSynthesisPanel from "./IntelligenceSynthesisPanel";
import ActionExecutionPanel from "./ActionExecutionPanel";
import ProgressReflectionPanel from "./ProgressReflectionPanel";
import InsightVaultPanel from "./InsightVaultPanel";
import DecisionIntelligencePanel from "./DecisionIntelligencePanel";
import GrowthForecastPanel from "./GrowthForecastPanel";
import MemoryEvolutionPanel from "./MemoryEvolutionPanel";
import AdaptiveSelfCorrectionPanel from "./AdaptiveSelfCorrectionPanel";
import UserAnalyticsPanel from "./UserAnalyticsPanel";
import FeedbackLearningPanel from "./FeedbackLearningPanel";
import RecommendationOptimizerPanel from "./RecommendationOptimizerPanel";
import ExperimentPanel from "./ExperimentPanel";
import GrowthSummaryCard from "./GrowthSummaryCard";

const EXPANDED_STORAGE_KEY = "corepath-command-center-expanded";

interface CareerCommandCenterProps {
  /** When true, the dashboard starts in expanded mode (used by FloatingCommandCenter) */
  defaultExpanded?: boolean;
}

// ─── Skeleton Panel ──────────────────────────────────────────────────────

const SKELETON_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-4/5", "w-3/5"];

function SkeletonPanel({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 space-y-3">
      <div className="h-3 w-1/3 animate-skeleton" />
      <div className="h-5 w-1/2 animate-skeleton" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 ${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]} animate-skeleton`} />
      ))}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────

function SectionHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-3 mt-8 first:mt-0">
      <p className="text-[10px] uppercase tracking-[0.24em] text-core-muted font-semibold">
        {label}
      </p>
      <p className="text-xs text-core-muted/60 mt-0.5">{description}</p>
    </div>
  );
}

// ─── Export Helpers ──────────────────────────────────────────────────────

function exportAsFile(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJourneySnapshot(data: {
  workspace: ReturnType<typeof loadCareerWorkspace>;
  goalState: ReturnType<typeof loadGoalState>;
  achievements: ReturnType<typeof computeAchievements>;
  progress: ReturnType<typeof computeCareerProgress>;
}) {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    workspace: data.workspace
      ? {
          career: data.workspace.selectedCareerTitle,
          streak: data.workspace.streak,
          milestonesCompleted: data.workspace.completedMilestones.length,
          phase: data.workspace.activePhaseName,
        }
      : null,
    goal: data.goalState.goal
      ? {
          target: data.goalState.goal.selectedCareerGoal,
          progress: data.goalState.goal.goalProgress,
          pace: data.goalState.signals?.paceSignal,
        }
      : null,
    achievements: {
      level: data.achievements.level,
      xp: data.achievements.xp,
      unlockedCount: data.achievements.unlockedAchievements.length,
    },
    progress: {
      momentum: data.progress?.learningMomentum ?? 0,
      milestones: data.progress?.milestonesCompleted ?? 0,
    },
  };
  exportAsFile(JSON.stringify(snapshot, null, 2), `corepath-snapshot-${Date.now()}.json`, "application/json");
}

function exportCareerIdentity() {
  const memory = loadJourneyMemory();
  const identity = {
    exportedAt: new Date().toISOString(),
    completedQuizzes: memory.completedQuizzes,
    topThemes: Object.entries(memory.repeatedThemes)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([theme]) => theme),
    favoriteCategories: Object.entries(memory.favoriteCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat),
    confidenceTrend: memory.confidenceHistory,
    specializationTrend: memory.specializationDepthHistory,
  };
  exportAsFile(JSON.stringify(identity, null, 2), `corepath-identity-${Date.now()}.json`, "application/json");
}

function exportProgressSummary(data: {
  workspace: ReturnType<typeof loadCareerWorkspace>;
  goalState: ReturnType<typeof loadGoalState>;
  achievements: ReturnType<typeof computeAchievements>;
  progress: ReturnType<typeof computeCareerProgress>;
}) {
  const lines: string[] = [
    "=== CorePath Progress Summary ===",
    `Exported: ${new Date().toLocaleDateString()}`,
    "",
    `Level: ${data.achievements.level} (${data.achievements.xp} XP)`,
    `Momentum: ${data.progress?.learningMomentum ?? 0}%`,
    `Milestones Completed: ${data.progress?.milestonesCompleted ?? 0}`,
    `Achievements Unlocked: ${data.achievements.unlockedAchievements.length}`,
    "",
  ];
  if (data.workspace) {
    lines.push("--- Workspace ---");
    lines.push(`Career: ${data.workspace.selectedCareerTitle}`);
    lines.push(`Streak: ${data.workspace.streak} days`);
    lines.push(`Phase: ${data.workspace.activePhaseName}`);
    lines.push(`Total Milestones: ${data.workspace.completedMilestones.length}`);
    lines.push("");
  }
  if (data.goalState.goal) {
    lines.push("--- Goal ---");
    lines.push(`Target: ${data.goalState.goal.selectedCareerGoal}`);
    lines.push(`Progress: ${data.goalState.goal.goalProgress}%`);
    lines.push(`Pace: ${data.goalState.signals?.paceSignal ?? "unknown"}`);
    lines.push("");
  }
  lines.push("Generated by CorePath (corepath.io)");
  exportAsFile(lines.join("\n"), `corepath-progress-${Date.now()}.txt`);
}

// ─── Export Menu (with click-outside + escape handling) ─────────────────

function ExportMenu({ data, onClose }: { data: ReturnType<typeof loadCareerWorkspace> | any; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-core-border bg-core-surface p-2 shadow-soft backdrop-blur-xl">
      <button
        type="button"
        onClick={() => { exportJourneySnapshot(data); onClose(); }}
        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-core-text hover:bg-core-accent/10 transition-colors"
      >
        Export Journey Snapshot
      </button>
      <button
        type="button"
        onClick={() => { exportCareerIdentity(); onClose(); }}
        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-core-text hover:bg-core-accent/10 transition-colors"
      >
        Export Career Identity
      </button>
      <button
        type="button"
        onClick={() => { exportProgressSummary(data); onClose(); }}
        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-core-text hover:bg-core-accent/10 transition-colors"
      >
        Export Progress Summary
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function CareerCommandCenter({ defaultExpanded = false }: CareerCommandCenterProps) {
  const [data, setData] = useState<{
    workspace: ReturnType<typeof loadCareerWorkspace>;
    goalState: ReturnType<typeof loadGoalState>;
    missions: ReturnType<typeof getDailyMissions>;
    weekly: ReturnType<typeof getWeeklyReflection>;
    achievements: ReturnType<typeof computeAchievements>;
    progress: ReturnType<typeof computeCareerProgress>;
    unreadCount: number;
    topNotifications: ReturnType<typeof getNotifications>;
  } | null>(null);

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isTempOpen, setIsTempOpen] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "goals" | "missions" | "planner" | "achievements" | "analytics" | null
  >(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibilityData | null>(null);

  const load = useCallback(() => {
    const workspace = loadCareerWorkspace();
    const goalState = loadGoalState();
    const missions = getDailyMissions();
    const weekly = getWeeklyReflection();
    const achievements = computeAchievements();
    const progress = computeCareerProgress();
    const notifs = getNotifications();
    const unreadCount = notifs.filter((n) => !n.read).length;

    setData({
      workspace,
      goalState,
      missions,
      weekly,
      achievements,
      progress,
      unreadCount,
      topNotifications: notifs.filter((n) => !n.read).slice(0, 3),
    });

    const vis = getPanelVisibility();
    setPanelVisibility(vis);
  }, []);

  // ── Initialise expanded state from storage ──
  useEffect(() => {
    const storage = getSafeStorage({ silent: true });
    const stored = storage.get<boolean>(EXPANDED_STORAGE_KEY);
    if (stored === true) {
      setIsExpanded(true);
    }
    setInitialised(true);
  }, []);

  // ── Listen for external temp-open signal with optional section payload ──
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { section?: string } | undefined;
      openDashboard(true);
      if (detail?.section) {
        setActiveSection(detail.section as "goals" | "missions" | "planner" | "achievements" | "analytics");
      }
    };
    window.addEventListener("corepath:open-command-center", handler as EventListener);
    return () =>
      window.removeEventListener("corepath:open-command-center", handler as EventListener);
  }, []);

  // ── Listen for scroll-to-attribution signal ──
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { source?: string; cause?: string } | undefined;
      if (detail?.source) {
        const el = document.getElementById(`section-${detail.source}`);
        if (el) {
          openDashboard(true);
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-core-accent/60", "ring-offset-2", "ring-offset-core-bg");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-core-accent/60", "ring-offset-2", "ring-offset-core-bg");
            }, 2000);
          }, 200);
        }
      }
    };
    window.addEventListener("corepath:scroll-to-attribution", handler as EventListener);
    return () =>
      window.removeEventListener("corepath:scroll-to-attribution", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // ── Auto-scroll to active section after expansion ──
  useEffect(() => {
    if (!isExpanded || !activeSection) return;
    const el = document.getElementById(`section-${activeSection}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-core-accent/60", "ring-offset-2", "ring-offset-core-bg");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-core-accent/60", "ring-offset-2", "ring-offset-core-bg");
        }, 2000);
      }, 100);
    }
    setActiveSection(null);
  }, [isExpanded, activeSection]);

  // ── Persist expanded state (unless temp-open) ──
  useEffect(() => {
    if (!initialised) return;
    const storage = getSafeStorage({ silent: true });
    if (!isTempOpen) {
      storage.set(EXPANDED_STORAGE_KEY, isExpanded);
    }
  }, [isExpanded, isTempOpen, initialised]);

  const handleCompleteMission = (id: string) => {
    completeMission(id);
    load();
  };

  const openDashboard = (temporary = false) => {
    setIsExpanded(true);
    setIsTempOpen(temporary);
  };

  const closeDashboard = () => {
    setIsExpanded(false);
    setIsTempOpen(false);
    setActiveSection(null);
  };

  // ── Memoised derived values ──
  const { workspace, goalState, missions, weekly, achievements, progress, unreadCount, topNotifications } = data ?? {};

  const isNewUser = useMemo(() => {
    if (!data) return true;
    return !data.workspace && !data.missions && (data.achievements?.xp ?? 0) === 0;
  }, [data]);

  const derived = useMemo(() => {
    if (!data) return null;
    return {
      targetCareerTitle:
        data.workspace?.selectedCareerTitle ??
        (data.goalState.goal?.selectedCareerGoal
          ? getCareerById(data.goalState.goal.selectedCareerGoal)?.title ?? data.goalState.goal.selectedCareerGoal
          : null),
      goalProgress: data.goalState.signals?.paceSignal ?? null,
      levelProgressPct: levelProgressPercentage(data.achievements),
      momentum: data.progress?.learningMomentum ?? 0,
      weeklyRate: data.weekly?.missionCompletionRate ?? 0,
      todayId: data.missions?.todayMission.id ?? null,
      todayComplete: data.missions?.todayMission.id ? isMissionCompleted(data.missions.todayMission.id) : false,
    };
  }, [data]);

  if (!data) {
    // ── Skeleton loading state ──
    return (
      <section className="rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-2">
            <div className="h-3 w-28 animate-skeleton" />
            <div className="h-6 w-56 animate-skeleton" />
          </div>
          <div className="h-8 w-20 animate-skeleton" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonPanel lines={4} />
          <SkeletonPanel lines={3} />
          <SkeletonPanel lines={3} />
          <SkeletonPanel lines={3} />
          <SkeletonPanel lines={4} />
          <SkeletonPanel lines={2} />
        </div>
      </section>
    );
  }

  // ── Next action logic ──
  let nextAction: string;
  let nextActionHref: string;
  let nextActionLabel: string;

  if (!workspace) {
    if (missions?.todayMission.category === "quiz") {
      nextAction = "Take your first career cognition quiz to discover your thinking profile.";
      nextActionHref = "/quiz";
      nextActionLabel = "Start quiz";
    } else {
      nextAction = "Select a career to start tracking your progress.";
      nextActionHref = "/careers";
      nextActionLabel = "Browse careers";
    }
  } else if (derived?.goalProgress === "behind") {
    nextAction = "Your goal is behind schedule — increase weekly time or focus on high-impact milestones.";
    nextActionHref = "/";
    nextActionLabel = "Review goal";
  } else if (workspace.streak === 0) {
    nextAction = "Resume your streak — log a small action today to rebuild momentum.";
    nextActionHref = `/careers/${workspace.selectedCareerId}`;
    nextActionLabel = "Log progress";
  } else if (!derived?.todayComplete && missions) {
    nextAction = `Complete today's mission: ${missions.todayMission.title}`;
    nextActionHref = "/";
    nextActionLabel = "View mission";
  } else if ((derived?.momentum ?? 0) < 30) {
    nextAction = "Your momentum is low. Try a quick quiz or career comparison to build it up.";
    nextActionHref = "/quiz";
    nextActionLabel = "Take quiz";
  } else {
    nextAction = getNextRecommendedAction();
    nextActionHref = `/careers/${workspace?.selectedCareerId}`;
    nextActionLabel = "Open workspace";
  }

  return (
    <section className="rounded-2xl border border-core-border bg-core-surface p-4 sm:p-6 shadow-soft overflow-hidden">
      {/* ───── COMPACT SUMMARY (collapsed) ───── */}
      {!isExpanded && (
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Command center</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-core-heading truncate max-w-[180px] sm:max-w-xs">
                {derived?.targetCareerTitle ?? "Your career intelligence"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-core-muted">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-core-accent/15 text-[10px] font-bold text-core-accent">
                {achievements.level}
              </span>
              Level {achievements.level}
            </div>
            {missions && !derived?.todayComplete && (
              <div className="flex items-center gap-1.5 text-xs text-core-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {missions.todayMission.title.length > 28
                  ? missions.todayMission.title.slice(0, 28) + "..."
                  : missions.todayMission.title}
              </div>
            )}
            {unreadCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <span className="flex h-2 w-2 rounded-full bg-red-400" />
                {unreadCount} unread
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-core-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  (derived?.momentum ?? 0) >= 50 ? "bg-emerald-500" : (derived?.momentum ?? 0) >= 20 ? "bg-amber-500" : "bg-core-accent/60"
                }`}
              />
              {derived?.momentum ?? 0}% momentum
            </div>
          </div>

          <button
            type="button"
            onClick={() => openDashboard(false)}
            className="mt-4 w-full rounded-full bg-core-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Open Command Center
          </button>
        </div>
      )}

      {/* ───── EXPANDED DASHBOARD ───── */}
      {isExpanded && (
        <div className="overflow-safe">
          {/* Header */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Command center</p>
              <h2 className="mt-1 text-lg sm:text-xl font-semibold text-core-heading truncate">
                {derived?.targetCareerTitle
                  ? `${typeof derived.targetCareerTitle === "string" && derived.targetCareerTitle.length > 25 ? "Tracking: " : ""}${derived.targetCareerTitle}`
                  : "Your career intelligence overview"}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
                >
                  Export
                </button>
                {showExportMenu && <ExportMenu data={data} onClose={() => setShowExportMenu(false)} />}
              </div>
              {unreadCount > 0 && (
                <Link
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    openDashboard(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                >
                  <span className="flex h-2 w-2 rounded-full bg-red-400" />
                  {unreadCount} unread
                </Link>
              )}
              <button
                type="button"
                onClick={closeDashboard}
                className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* ─── ONBOARDING HINTS (new users) ─── */}
          {isNewUser && (
            <div className="mb-5 rounded-2xl border border-core-accent/20 bg-core-accent/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-core-accent font-semibold">
                Getting started
              </p>
              <p className="mt-1 text-sm text-core-text">
                You haven&apos;t started your career journey yet. Here are a few ways to begin:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/quiz"
                  className="rounded-full bg-core-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
                >
                  Start quiz
                </Link>
                <Link
                  href="/careers"
                  className="rounded-full border border-core-border bg-core-bg/60 px-4 py-2 text-xs font-medium text-core-text transition hover:bg-white/10 hover:border-core-accent"
                >
                  Explore careers
                </Link>
              </div>
            </div>
          )}

          {/* Dashboard grid */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {missions && (
              <div id="section-missions" className="rounded-2xl border border-core-border bg-core-bg/60 p-4 scroll-mt-28">
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Today&apos;s mission
                </p>
                <p className="mt-1.5 text-sm font-semibold text-core-heading leading-snug line-clamp-2">
                  {missions.todayMission.title}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-core-muted flex-wrap">
                  <span>+{missions.todayMission.rewardXP} XP</span>
                  <span className="capitalize">{missions.todayMission.difficulty}</span>
                  <span>{missions.todayMission.estimatedMinutes}m</span>
                </div>
                {!derived?.todayComplete ? (
                  <button
                    type="button"
                    onClick={() => handleCompleteMission(missions.todayMission.id)}
                    className="mt-3 w-full rounded-full bg-core-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
                  >
                    Complete mission
                  </button>
                ) : (
                  <p className="mt-3 text-xs font-medium text-emerald-400">✓ Completed</p>
                )}
              </div>
            )}

            <div id="section-achievements" className="rounded-2xl border border-core-border bg-core-bg/60 p-4 scroll-mt-28">
              <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                Level & XP
              </p>
              <p className="mt-1.5 text-2xl font-bold text-core-heading">
                Lv.{achievements.level}
              </p>
              <p className="text-xs text-core-muted">{achievements.xp} XP total</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-core-accent to-indigo-400 transition-all duration-500"
                  style={{ width: `${derived?.levelProgressPct ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-core-muted/70">
                {derived?.levelProgressPct ?? 0}% to next level
              </p>
            </div>

            {weekly && (
              <div id="section-planner" className="rounded-2xl border border-core-border bg-core-bg/60 p-4 scroll-mt-28">
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Weekly sprint
                </p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-core-heading">{derived?.weeklyRate ?? 0}%</span>
                  <span className="text-xs text-core-muted">completion</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-core-muted">
                  {weekly.wins.length > 0 && <span>{weekly.wins.length} wins</span>}
                  <span className={`capitalize ${weekly.streakTrend === "growing" ? "text-emerald-400" : weekly.streakTrend === "declining" ? "text-amber-400" : "text-core-muted"}`}>
                    {weekly.streakTrend} streak
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (derived?.weeklyRate ?? 0) >= 60
                        ? "bg-emerald-500"
                        : (derived?.weeklyRate ?? 0) >= 30
                          ? "bg-amber-500"
                          : "bg-core-accent/60"
                    }`}
                    style={{ width: `${derived?.weeklyRate ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            {goalState.signals && (
              <div id="section-goals" className="rounded-2xl border border-core-border bg-core-bg/60 p-4 scroll-mt-28">
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Goal progress
                </p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-core-heading">
                    {goalState.goal?.goalProgress ?? 0}%
                  </span>
                  <span className="text-xs text-core-muted">progress</span>
                </div>
                <p className="text-[11px] text-core-muted">
                  Est. completion: {goalState.signals.estimatedCompletion}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`font-medium ${
                      goalState.signals.paceSignal === "ahead"
                        ? "text-emerald-400"
                        : goalState.signals.paceSignal === "behind"
                          ? "text-red-400"
                          : "text-core-muted"
                    }`}
                  >
                    {goalState.signals.paceSignal === "ahead"
                      ? "Ahead of schedule"
                      : goalState.signals.paceSignal === "behind"
                        ? "Behind schedule"
                        : "On track"}
                  </span>
                  <span
                    className={`${
                      goalState.signals.riskSignal === "high"
                        ? "text-red-400"
                        : goalState.signals.riskSignal === "medium"
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {goalState.signals.riskSignal} risk
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, goalState.goal?.goalProgress ?? 0)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                Momentum
              </p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-core-heading">{derived?.momentum ?? 0}%</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-core-muted">
                {workspace ? (
                  <span>
                    {workspace.streak > 0
                      ? `${workspace.streak}-day streak`
                      : "No active streak"}
                  </span>
                ) : (
                  <span>No workspace yet</span>
                )}
                <span>&bull;</span>
                <span>{progress?.milestonesCompleted ?? 0} milestones</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (derived?.momentum ?? 0) >= 50 ? "bg-emerald-500" : (derived?.momentum ?? 0) >= 20 ? "bg-amber-500" : "bg-core-accent/60"
                  }`}
                  style={{ width: `${derived?.momentum ?? 0}%` }}
                />
              </div>
            </div>

            {unreadCount > 0 && (
              <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Notifications
                </p>
                <p className="mt-1.5 text-2xl font-bold text-core-heading">{unreadCount}</p>
                <p className="text-xs text-core-muted">unread notifications</p>
                {topNotifications.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {topNotifications.map((n) => (
                      <li key={n.id} className="flex items-center gap-2 text-xs text-core-muted">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-core-accent/60" />
                        <span className="truncate">{n.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* ─── GROUPED INTELLIGENCE PANELS ─── */}

          {/* ─── ADAPTIVE PANEL GROUPS ─── */}
          {panelVisibility && (
            <>
              {/* Identity — recommended (returning+) */}
              <AdaptivePanelContainer
                group={{
                  id: "identity",
                  label: "Career Identity",
                  description: "Who you are as a professional",
                  icon: "🧑",
                  visibility: panelVisibility.visibilityMap["identity"],
                  unlockHint: panelVisibility.visibilityMap["identity"] !== "visible"
                    ? "Complete 2+ quizzes to unlock your career identity."
                    : undefined,
                }}
              >
                <CareerIdentityPanel className="mt-0" />
              </AdaptivePanelContainer>

              {/* Insights — recommended (returning+) */}
              <AdaptivePanelContainer
                group={{
                  id: "insights",
                  label: "Insights",
                  description: "Behavior, learning, and growth patterns",
                  icon: "💡",
                  visibility: panelVisibility.visibilityMap["insights"],
                  unlockHint: panelVisibility.visibilityMap["insights"] !== "visible"
                    ? "Complete 2+ quizzes to unlock these insights."
                    : undefined,
                }}
              >
                <BehaviorInsightsPanel className="mt-0" />
                <PersonalEvolutionPanel className="mt-0" />
                <LearningStylePanel className="mt-0" />
                <LearningFrictionPanel className="mt-0" />
                <ChangeAttributionPanel className="mt-0" />
                <HabitIntelligencePanel className="mt-0" />
                <UniquenessPanel className="mt-0" />
              </AdaptivePanelContainer>

              {/* Predictions — recommended (returning+) */}
              <AdaptivePanelContainer
                group={{
                  id: "predictions",
                  label: "Predictions",
                  description: "Forecasts, fit, and decision intelligence",
                  icon: "🔮",
                  visibility: panelVisibility.visibilityMap["predictions"],
                  unlockHint: panelVisibility.visibilityMap["predictions"] !== "visible"
                    ? "Complete 2+ quizzes to unlock predictions."
                    : undefined,
                }}
              >
                <PredictiveInsightsPanel className="mt-0" />
                <PredictionFeedbackPanel className="mt-0" />
                <RecommendationEvolutionPanel className="mt-0" />
                <DecisionReadinessPanel className="mt-0" />
                <DecisionPriorityPanel className="mt-0" />
                <DecisionIntelligencePanel className="mt-0" />
              </AdaptivePanelContainer>

              {/* Execution — always visible */}
              <SectionHeader label="Execution" description="Sprints, actions, and weekly growth" />
              <div className="panel-stack">
                <GrowthSummaryCard className="mt-0" />
                <ActionSprintPanel className="mt-0" />
                <ActionExecutionPanel className="mt-0" />
              </div>

              {/* Memory & Adaptation — hidden (power_user only) */}
              <AdaptivePanelContainer
                group={{
                  id: "memory",
                  label: "Memory & Adaptation",
                  description: "Vault, coaching, and system self-correction",
                  icon: "🧠",
                  visibility: panelVisibility.visibilityMap["memory"],
                  unlockHint: "Reach Power User status (15+ sessions, active workspace, 7-day streak) to unlock memory systems.",
                }}
              >
                <MemoryEvolutionPanel className="mt-0" />
                <InsightVaultPanel className="mt-0" />
                <IntelligenceSynthesisPanel className="mt-0" />
                <AdaptiveSelfCorrectionPanel className="mt-0" />
                <UserAnalyticsPanel className="mt-0" />
                <FeedbackLearningPanel className="mt-0" />
                <RecommendationOptimizerPanel className="mt-0" />
                <ExperimentPanel className="mt-0" />
              </AdaptivePanelContainer>

              {/* History — recommended (returning+) */}
              <AdaptivePanelContainer
                group={{
                  id: "history",
                  label: "History",
                  description: "Replay, reflection, and progress intelligence",
                  icon: "📜",
                  visibility: panelVisibility.visibilityMap["history"],
                  unlockHint: panelVisibility.visibilityMap["history"] !== "visible"
                    ? "Complete 2+ quizzes to unlock your history."
                    : undefined,
                }}
              >
                <JourneyReplayPanel className="mt-0" />
                <ProgressReflectionPanel className="mt-0" />
                <CareerMomentumPanel className="mt-0" />
                <CareerAlignmentPanel className="mt-0" />
                <GrowthAnalyticsPanel className="mt-0" />
              </AdaptivePanelContainer>

              {/* Future Self — advanced (engaged+) */}
              <AdaptivePanelContainer
                group={{
                  id: "future",
                  label: "Future Self",
                  description: "Projected trajectory and decision confidence",
                  icon: "🚀",
                  visibility: panelVisibility.visibilityMap["future"],
                  unlockHint: panelVisibility.visibilityMap["future"] !== "visible"
                    ? "Complete 5+ quizzes and set up your workspace to unlock Future Self."
                    : undefined,
                }}
              >
                <FutureSelfPanel className="mt-0" />
                <DecisionConfidencePanel className="mt-0" />
              </AdaptivePanelContainer>

              {/* Growth Forecast — advanced (engaged+) */}
              <AdaptivePanelContainer
                group={{
                  id: "growth",
                  label: "Growth Forecast",
                  description: "Forecasts, trends, and confidence evolution",
                  icon: "📈",
                  visibility: panelVisibility.visibilityMap["growth"],
                  unlockHint: panelVisibility.visibilityMap["growth"] !== "visible"
                    ? "Complete 5+ quizzes and set up your workspace to unlock Growth Forecast."
                    : undefined,
                }}
              >
                <GrowthForecastPanel className="mt-0" />
              </AdaptivePanelContainer>

              {/* Career Story — advanced (engaged+) */}
              <AdaptivePanelContainer
                group={{
                  id: "story",
                  label: "Career Story",
                  description: "Your evolving career narrative and trajectory",
                  icon: "📖",
                  visibility: panelVisibility.visibilityMap["story"],
                  unlockHint: panelVisibility.visibilityMap["story"] !== "visible"
                    ? "Complete 5+ quizzes and set up your workspace to unlock your Career Story."
                    : undefined,
                }}
              >
                <CareerStoryPanel className="mt-0" />
              </AdaptivePanelContainer>
            </>
          )}

          {/* ─── FALLBACK: if panelVisibility not yet loaded, show identity + execution ─── */}
          {!panelVisibility && (
            <>
              <SectionHeader label="Identity" description="Who you are as a professional" />
              <div className="panel-stack">
                <CareerIdentityPanel className="mt-0" />
              </div>
              <SectionHeader label="Execution" description="Sprints, actions, and mission tracking" />
              <div className="panel-stack">
                <ActionSprintPanel className="mt-0" />
                <ActionExecutionPanel className="mt-0" />
                <MissionIntelligencePanel className="mt-0" />
              </div>
            </>
          )}

          {/* ─── NEXT ACTION ─── */}
          <div className="mt-6 rounded-2xl border border-core-accent/20 bg-core-accent/5 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Next action
                </p>
                <p className="mt-0.5 text-sm text-core-text leading-snug">{nextAction}</p>
              </div>
              <Link
                href={nextActionHref}
                className="shrink-0 rounded-full bg-core-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
              >
                {nextActionLabel}
              </Link>
            </div>
          </div>

          {/* ─── QUICK ACTIONS (reduced to 3 core navigations) ─── */}
          <div className="mt-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Quick links
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={workspace ? `/careers/${workspace.selectedCareerId}` : "/careers"}
                className="rounded-full border border-core-border bg-core-bg/60 px-3.5 py-2 text-xs font-medium text-core-text transition hover:bg-white/10 hover:border-core-accent"
              >
                {workspace ? "Continue workspace" : "Start workspace"}
              </Link>
              <Link
                href="/quiz"
                className="rounded-full border border-core-border bg-core-bg/60 px-3.5 py-2 text-xs font-medium text-core-text transition hover:bg-white/10 hover:border-core-accent"
              >
                {workspace ? "Resume quiz" : "Take quiz"}
              </Link>
              <Link
                href="/insights"
                className="rounded-full border border-core-border bg-core-bg/60 px-3.5 py-2 text-xs font-medium text-core-text transition hover:bg-white/10 hover:border-core-accent"
              >
                View timeline
              </Link>
            </div>
          </div>

          {/* ─── COLLAPSE FOOTER ─── */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={closeDashboard}
              className="rounded-full border border-core-border px-4 py-2 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
            >
              Collapse dashboard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
