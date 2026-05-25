"use client";

import { useState, useEffect, useCallback } from "react";
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
import GrowthAnalyticsPanel from "./GrowthAnalyticsPanel";
import JourneyReplayPanel from "./JourneyReplayPanel";
import CareerIdentityPanel from "./CareerIdentityPanel";
import BehaviorInsightsPanel from "./BehaviorInsightsPanel";
import PredictiveInsightsPanel from "./PredictiveInsightsPanel";
import PredictionFeedbackPanel from "./PredictionFeedbackPanel";
import RecommendationEvolutionPanel from "./RecommendationEvolutionPanel";
import ActionSprintPanel from "./ActionSprintPanel";
import DecisionReadinessPanel from "./DecisionReadinessPanel";
import EngagementPulsePanel from "./EngagementPulsePanel";
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
import CoachingPanel from "./CoachingPanel";
import DecisionIntelligencePanel from "./DecisionIntelligencePanel";
import GrowthForecastPanel from "./GrowthForecastPanel";
import MemoryEvolutionPanel from "./MemoryEvolutionPanel";
import AdaptiveSelfCorrectionPanel from "./AdaptiveSelfCorrectionPanel";

const EXPANDED_STORAGE_KEY = "corepath-command-center-expanded";

interface CareerCommandCenterProps {
  /** When true, the dashboard starts in expanded mode (used by FloatingCommandCenter) */
  defaultExpanded?: boolean;
}

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
        // Brief highlight effect
        el.classList.add("ring-2", "ring-core-accent/60", "ring-offset-2", "ring-offset-core-bg");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-core-accent/60", "ring-offset-2", "ring-offset-core-bg");
        }, 2000);
      }, 100);
    }
    // Always clear activeSection so the effect doesn't linger
    setActiveSection(null);
  }, [isExpanded, activeSection]);

  // ── Persist expanded state (unless temp-open) ──
  useEffect(() => {
    if (!initialised) return;
    const storage = getSafeStorage({ silent: true });
    // Only persist if this is a permanent toggle, not a temp-open from notification
    if (!isTempOpen) {
      storage.set(EXPANDED_STORAGE_KEY, isExpanded);
    }
  }, [isExpanded, isTempOpen, initialised]);

  // Handle complete mission
  const handleCompleteMission = (id: string) => {
    completeMission(id);
    load();
  };

  // ── Open/close helpers ──
  const openDashboard = (temporary = false) => {
    setIsExpanded(true);
    setIsTempOpen(temporary);
  };

  const closeDashboard = () => {
    setIsExpanded(false);
    setIsTempOpen(false);
    setActiveSection(null);
  };

  if (!data) return null;

  const { workspace, goalState, missions, weekly, achievements, progress, unreadCount, topNotifications } = data;
  const hasData = workspace || goalState.goal || missions || weekly || achievements.xp > 0;

  // Derived values
  const targetCareerTitle =
    workspace?.selectedCareerTitle ??
    (goalState.goal?.selectedCareerGoal
      ? getCareerById(goalState.goal.selectedCareerGoal)?.title ?? goalState.goal.selectedCareerGoal
      : null);
  const goalProgress = goalState.signals?.paceSignal ?? null;
  const levelProgressPct = levelProgressPercentage(achievements);
  const momentum = progress?.learningMomentum ?? 0;
  const weeklyRate = weekly?.missionCompletionRate ?? 0;
  const todayId = missions?.todayMission.id ?? null;
  const todayComplete = todayId ? isMissionCompleted(todayId) : false;

  // Next action — use workspace baseline, then layer mission/goal checks on top
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
  } else if (goalProgress === "behind") {
    nextAction = "Your goal is behind schedule — increase weekly time or focus on high-impact milestones.";
    nextActionHref = "/";
    nextActionLabel = "Review goal";
  } else if (workspace.streak === 0) {
    nextAction = "Resume your streak — log a small action today to rebuild momentum.";
    nextActionHref = `/careers/${workspace.selectedCareerId}`;
    nextActionLabel = "Log progress";
  } else if (!todayComplete && missions) {
    nextAction = `Complete today's mission: ${missions.todayMission.title}`;
    nextActionHref = "/";
    nextActionLabel = "View mission";
  } else if (momentum < 30) {
    nextAction = "Your momentum is low. Try a quick quiz or career comparison to build it up.";
    nextActionHref = "/quiz";
    nextActionLabel = "Take quiz";
  } else {
    nextAction = getNextRecommendedAction();
    nextActionHref = `/careers/${workspace.selectedCareerId}`;
    nextActionLabel = "Open workspace";
  }

  return (
    <section className="rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft">
      {/* ───── COMPACT SUMMARY (collapsed) ───── */}
      {!isExpanded && (
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Command center</p>

          {/* Summary row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {/* Career title */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-core-heading truncate max-w-[220px] sm:max-w-xs">
                {targetCareerTitle ?? "Your career intelligence"}
              </p>
            </div>

            {/* Level */}
            <div className="flex items-center gap-1.5 text-xs text-core-muted">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-core-accent/15 text-[10px] font-bold text-core-accent">
                {achievements.level}
              </span>
              Level {achievements.level}
            </div>

            {/* Mission snippet */}
            {missions && !todayComplete && (
              <div className="flex items-center gap-1.5 text-xs text-core-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {missions.todayMission.title.length > 28
                  ? missions.todayMission.title.slice(0, 28) + "…"
                  : missions.todayMission.title}
              </div>
            )}

            {/* Notification count */}
            {unreadCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <span className="flex h-2 w-2 rounded-full bg-red-400" />
                {unreadCount} unread
              </div>
            )}

            {/* Momentum */}
            <div className="flex items-center gap-1.5 text-xs text-core-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  momentum >= 50 ? "bg-emerald-500" : momentum >= 20 ? "bg-amber-500" : "bg-core-accent/60"
                }`}
              />
              {momentum}% momentum
            </div>
          </div>

          {/* Open button */}
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
        <>
          {/* Header with collapse button */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Command center</p>
              <h2 className="mt-1 text-xl font-semibold text-core-heading">
                {targetCareerTitle
                  ? `${typeof targetCareerTitle === "string" && targetCareerTitle.length > 25 ? "Tracking: " : ""}${targetCareerTitle}`
                  : "Your career intelligence overview"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Dashboard grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* ─── CARD: Today's Mission ─── */}
            {missions && (
              <div id="section-missions" className="rounded-2xl border border-core-border bg-core-bg/60 p-4 scroll-mt-28">
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Today&apos;s mission
                </p>
                <p className="mt-1.5 text-sm font-semibold text-core-heading leading-snug line-clamp-2">
                  {missions.todayMission.title}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-core-muted">
                  <span>+{missions.todayMission.rewardXP} XP</span>
                  <span className="capitalize">{missions.todayMission.difficulty}</span>
                  <span>{missions.todayMission.estimatedMinutes}m</span>
                </div>
                {!todayComplete ? (
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

            {/* ─── CARD: XP & Level ─── */}
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
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-core-muted/70">
                {levelProgressPct}% to next level
              </p>
            </div>

            {/* ─── CARD: Weekly Sprint ─── */}
            {weekly && (
              <div id="section-planner" className="rounded-2xl border border-core-border bg-core-bg/60 p-4 scroll-mt-28">
                <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                  Weekly sprint
                </p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-core-heading">{weeklyRate}%</span>
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
                      weeklyRate >= 60
                        ? "bg-emerald-500"
                        : weeklyRate >= 30
                          ? "bg-amber-500"
                          : "bg-core-accent/60"
                    }`}
                    style={{ width: `${weeklyRate}%` }}
                  />
                </div>
              </div>
            )}

            {/* ─── CARD: Goal Progress ─── */}
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
                <div className="mt-1 flex items-center gap-2 text-xs">
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
                      ? "🚀 Ahead of schedule"
                      : goalState.signals.paceSignal === "behind"
                        ? "⚠️ Behind schedule"
                        : "✅ On track"}
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

            {/* ─── CARD: Momentum ─── */}
            <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                Momentum
              </p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-core-heading">{momentum}%</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-core-muted">
                {workspace ? (
                  <span>
                    {workspace.streak > 0
                      ? `${workspace.streak}-day streak`
                      : "No active streak"}
                  </span>
                ) : (
                  <span>No workspace yet</span>
                )}
                <span>•</span>
                <span>{progress?.milestonesCompleted ?? 0} milestones</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    momentum >= 50 ? "bg-emerald-500" : momentum >= 20 ? "bg-amber-500" : "bg-core-accent/60"
                  }`}
                  style={{ width: `${momentum}%` }}
                />
              </div>
            </div>

            {/* ─── CARD: Notifications ─── */}
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

          {/* ─── GROWTH ANALYTICS ─── */}
          <div id="section-analytics">
            <GrowthAnalyticsPanel className="mt-4" />
          </div>

          {/* ─── JOURNEY REPLAY ─── */}
          <JourneyReplayPanel className="mt-4" />

          {/* ─── BEHAVIOR INSIGHTS ─── */}
          <BehaviorInsightsPanel className="mt-4" />

          {/* ─── PREDICTIVE INSIGHTS ─── */}
          <PredictiveInsightsPanel className="mt-4" />

          {/* ─── PREDICTION FEEDBACK ─── */}
          <PredictionFeedbackPanel className="mt-4" />

          {/* ─── RECOMMENDATION EVOLUTION ─── */}
          <RecommendationEvolutionPanel className="mt-4" />

          {/* ─── ACTION SPRINT ─── */}
          <ActionSprintPanel className="mt-4" />

          {/* ─── DECISION READINESS ─── */}
          <DecisionReadinessPanel className="mt-4" />

          {/* ─── ENGAGEMENT PULSE ─── */}
          <EngagementPulsePanel className="mt-4" />

          {/* ─── DECISION PRIORITY ─── */}
          <DecisionPriorityPanel className="mt-4" />

          {/* ─── PERSONAL EVOLUTION ─── */}
          <PersonalEvolutionPanel className="mt-4" />

          {/* ─── LEARNING STYLE INTELLIGENCE ─── */}
          <LearningStylePanel className="mt-4" />

          {/* ─── LEARNING FRICTION ─── */}
          <LearningFrictionPanel className="mt-4" />

          {/* ─── CHANGE ATTRIBUTION ─── */}
          <ChangeAttributionPanel className="mt-4" />

          {/* ─── HABIT INTELLIGENCE ─── */}
          <HabitIntelligencePanel className="mt-4" />

          {/* ─── UNIQUENESS INTELLIGENCE ─── */}
          <UniquenessPanel className="mt-4" />

          {/* ─── FUTURE SELF INTELLIGENCE ─── */}
          <FutureSelfPanel className="mt-4" />

          {/* ─── DECISION CONFIDENCE INTELLIGENCE ─── */}
          <DecisionConfidencePanel className="mt-4" />

          {/* ─── MISSION INTELLIGENCE ─── */}
          <MissionIntelligencePanel className="mt-4" />

          {/* ─── CAREER MOMENTUM INTELLIGENCE ─── */}
          <CareerMomentumPanel className="mt-4" />

          {/* ─── CAREER ALIGNMENT INTELLIGENCE ─── */}
          <CareerAlignmentPanel className="mt-4" />

          {/* ─── CAREER STORY INTELLIGENCE ─── */}
          <CareerStoryPanel className="mt-4" />

          {/* ─── PROGRESS REFLECTION ─── */}
          <ProgressReflectionPanel className="mt-4" />

          {/* ─── INSIGHT VAULT ─── */}
          <InsightVaultPanel className="mt-4" />

          {/* ─── COACHING INTELLIGENCE ─── */}
          <CoachingPanel className="mt-4" />

          {/* ─── DECISION INTELLIGENCE ─── */}
          <DecisionIntelligencePanel className="mt-4" />

          {/* ─── GROWTH FORECAST INTELLIGENCE ─── */}
          <GrowthForecastPanel className="mt-4" />

          {/* ─── INTELLIGENCE SYNTHESIS HUB ─── */}
          <IntelligenceSynthesisPanel className="mt-4" />

          {/* ─── ACTION EXECUTION ─── */}
          <ActionExecutionPanel className="mt-4" />

          {/* ─── MEMORY EVOLUTION ─── */}
          <MemoryEvolutionPanel className="mt-4" />

          {/* ─── ADAPTIVE SELF-CORRECTION ─── */}
          <AdaptiveSelfCorrectionPanel className="mt-4" />

          {/* ─── CAREER IDENTITY ─── */}
          <CareerIdentityPanel className="mt-4" />

          {/* ─── NEXT ACTION ─── */}
          <div className="mt-4 rounded-2xl border border-core-accent/20 bg-core-accent/5 p-4">
            <div className="flex items-center justify-between gap-4">
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

          {/* ─── QUICK ACTIONS ─── */}
          <div className="mt-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
              Quick actions
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
                Resume quiz
              </Link>
              <Link
                href="/insights"
                className="rounded-full border border-core-border bg-core-bg/60 px-3.5 py-2 text-xs font-medium text-core-text transition hover:bg-white/10 hover:border-core-accent"
              >
                View timeline
              </Link>
              <Link
                href="/careers/compare"
                className="rounded-full border border-core-border bg-core-bg/60 px-3.5 py-2 text-xs font-medium text-core-text transition hover:bg-white/10 hover:border-core-accent"
              >
                Open comparison history
              </Link>
              <Link
                href="/"
                className="rounded-full border border-core-border bg-core-bg/60 px-3.5 py-2 text-xs font-medium text-core-text transition hover:bg-white/10 hover:border-core-accent"
              >
                Open planner
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
        </>
      )}
    </section>
  );
}
