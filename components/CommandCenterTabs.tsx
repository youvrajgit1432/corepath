/**
 * COMMAND CENTER TABS
 *
 * App-style navigation dashboard replacing the long vertical Command Center.
 *
 * Tabs: Overview | Journey | Growth | Intelligence | Workspace
 *
 * Desktop: sticky top tabs
 * Mobile: bottom navigation bar
 *
 * Rules:
 *   - Only render active tab content (no hidden DOM)
 *   - Lazy-load each tab (first visit only)
 *   - Smooth transitions via framer-motion
 *   - Persist selected tab in localStorage
 *   - Reduce scroll length by 70%+
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { loadJourneyMemory } from "../data/journey-memory";
import { getDailyMissions, isMissionCompleted } from "../data/daily-missions";
import { loadActionSprint } from "../data/action-sprints";
import { computeCareerProgress, loadCareerProgress } from "../data/career-progress";
import { computeAchievements, loadAchievements, levelProgressPercentage } from "../data/achievement-engine";
import { loadCareerWorkspace } from "../data/career-workspace";
import { getCareerById } from "../data/careers";
import { roadmaps } from "../data/roadmaps";
import { getUnreadCount } from "../data/notification-engine";

// ─── Panel Imports ──────────────────────────────────────────────────────

import HomeCareerPreviewGrid from "./HomeCareerPreviewGrid";
import CareerStoryPanel from "./CareerStoryPanel";
import MemoryEvolutionPanel from "./MemoryEvolutionPanel";
import JourneyReplayPanel from "./JourneyReplayPanel";
import LearningStylePanel from "./LearningStylePanel";
import LearningFrictionPanel from "./LearningFrictionPanel";
import HabitIntelligencePanel from "./HabitIntelligencePanel";
import ActionExecutionPanel from "./ActionExecutionPanel";
import FutureSelfPanel from "./FutureSelfPanel";
import PredictiveInsightsPanel from "./PredictiveInsightsPanel";
import DecisionConfidencePanel from "./DecisionConfidencePanel";
import InsightVaultPanel from "./InsightVaultPanel";
import UserAnalyticsPanel from "./UserAnalyticsPanel";
import CareerWorkspacePanel from "./CareerWorkspacePanel";
import ActionSprintPanel from "./ActionSprintPanel";
import CareerIdentityPanel from "./CareerIdentityPanel";
import AdaptiveRoadmapPanel from "./AdaptiveRoadmapPanel";

// ─── Types ──────────────────────────────────────────────────────────────

type TabId = "overview" | "journey" | "growth" | "intelligence" | "workspace";

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "journey", label: "Journey", icon: "🧭" },
  { id: "growth", label: "Growth", icon: "📈" },
  { id: "intelligence", label: "Intelligence", icon: "🧠" },
  { id: "workspace", label: "Workspace", icon: "🛠️" },
];

const STORAGE_KEY = "corepath-active-tab";

// ─── Helper: load/save tab ──────────────────────────────────────────────

function loadPersistedTab(): TabId {
  if (typeof window === "undefined") return "overview";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TABS.some((t) => t.id === saved)) return saved as TabId;
  } catch { /* ignore */ }
  return "overview";
}

function savePersistedTab(id: TabId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch { /* ignore */ }
}

// ─── Overview Tab ───────────────────────────────────────────────────────

function OverviewTab() {
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [missions, setMissions] = useState<ReturnType<typeof getDailyMissions> | null>(null);
  const [sprint, setSprint] = useState<ReturnType<typeof loadActionSprint> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [achievements, setAchievements] = useState<ReturnType<typeof loadAchievements> | null>(null);
  const [progress, setProgress] = useState<ReturnType<typeof loadCareerProgress> | null>(null);

  useEffect(() => {
    const memory = loadJourneyMemory();
    setHasCompletedQuiz(memory.completedQuizzes > 0);
    setMissions(getDailyMissions());
    setSprint(loadActionSprint());
    setUnreadCount(getUnreadCount());
    const ach = loadAchievements() ?? computeAchievements();
    setAchievements(ach);
    const prog = loadCareerProgress() ?? computeCareerProgress();
    setProgress(prog);
  }, []);

  const missionComplete = missions ? isMissionCompleted(missions.todayMission.id) : false;
  const pct = achievements ? levelProgressPercentage(achievements) : 0;

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-core-heading">
          {hasCompletedQuiz ? "Your career intelligence dashboard" : "Find your AI-era specialization"}
        </h1>
        <p className="mt-1 text-sm text-core-muted">
          {hasCompletedQuiz
            ? "Track your progress, explore recommendations, and deepen your career strategy."
            : "Take the quiz to discover your ideal specialization."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Mission */}
        {missions && (
          <div className="rounded-2xl border border-core-border bg-core-surface p-5 shadow-soft">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Today&apos;s mission</p>
            <p className="mt-2 text-sm font-semibold text-core-heading leading-snug line-clamp-2">{missions.todayMission.title}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-core-muted">
              <span>+{missions.todayMission.rewardXP} XP</span>
              <span className="capitalize">{missions.todayMission.difficulty}</span>
              <span>{missions.todayMission.estimatedMinutes}m</span>
            </div>
            {!missionComplete ? (
              <Link
                href={missions.todayMission.actionHref ?? "/quiz"}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-core-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
              >
                Start mission
              </Link>
            ) : (
              <p className="mt-3 text-xs font-medium text-emerald-400">✓ Completed</p>
            )}
          </div>
        )}

        {/* XP / Progress */}
        {achievements && (
          <div className="rounded-2xl border border-core-border bg-core-surface p-5 shadow-soft">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Level &amp; XP</p>
            <p className="mt-1.5 text-2xl font-bold text-core-heading">Lv.{achievements.level}</p>
            <p className="text-xs text-core-muted">{achievements.xp} XP · {achievements.unlockedAchievements.length} achievements</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-core-accent to-indigo-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-core-muted/70">{pct}% to next level</p>
          </div>
        )}

        {/* Continue Journey */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Next action</p>
          <p className="mt-2 text-sm font-semibold text-core-heading leading-snug">
            {sprint?.todayActions?.[0]?.title ?? "Explore your next career move"}
          </p>
          <p className="mt-1 text-xs text-core-muted leading-relaxed line-clamp-2">
            {sprint?.todayActions?.[0]?.description ?? "Browse careers or retake the quiz to refine your recommendations."}
          </p>
          <Link
            href={hasCompletedQuiz ? "/recommendation" : "/careers"}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-text transition hover:border-core-accent hover:text-core-accent"
          >
            Continue journey
          </Link>
        </div>

        {/* Unread updates */}
        {unreadCount > 0 && (
          <Link
            href="/"
            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 shadow-soft flex items-center justify-between"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-red-400">
              <span className="flex h-2 w-2 rounded-full bg-red-400" />
              {unreadCount} update{unreadCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-red-400/60">View →</span>
          </Link>
        )}

        {/* Start Quiz CTA for new users */}
        {!hasCompletedQuiz && (
          <div className="rounded-2xl border border-core-accent/20 bg-gradient-to-br from-core-accent/5 to-transparent p-5 shadow-soft sm:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent font-semibold">First step</p>
            <p className="mt-2 text-sm font-semibold text-core-heading">Discover your career profile</p>
            <p className="mt-1 text-xs text-core-muted leading-relaxed">
              Take the 5-minute career cognition quiz to unlock personalized insights.
            </p>
            <Link
              href="/quiz"
              className="mt-3 inline-flex items-center justify-center rounded-full bg-core-accent px-4 py-2 text-xs font-medium text-white shadow-glow transition hover:bg-indigo-500"
            >
              Start the quiz →
            </Link>
          </div>
        )}
      </div>

      {/* Trending Careers */}
      <div className="pt-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">Trending AI Careers</p>
        <HomeCareerPreviewGrid />
      </div>
    </div>
  );
}

// ─── Journey Tab ────────────────────────────────────────────────────────

function JourneyTab() {
  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h2 className="text-lg font-semibold text-core-heading">Your Career Journey</h2>
        <p className="text-sm text-core-muted">Identity, story, memory, and replay</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <CareerIdentityPanel className="mt-0" />
        <CareerStoryPanel className="mt-0" />
        <MemoryEvolutionPanel className="mt-0" />
        <JourneyReplayPanel className="mt-0" />
      </div>
    </div>
  );
}

// ─── Growth Tab ─────────────────────────────────────────────────────────

function GrowthTab() {
  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h2 className="text-lg font-semibold text-core-heading">Growth &amp; Learning</h2>
        <p className="text-sm text-core-muted">Learning style, friction, habits, and execution</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <LearningStylePanel className="mt-0" />
        <LearningFrictionPanel className="mt-0" />
        <HabitIntelligencePanel className="mt-0" />
        <ActionExecutionPanel className="mt-0" />
      </div>
    </div>
  );
}

// ─── Intelligence Tab ───────────────────────────────────────────────────

function IntelligenceTab() {
  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h2 className="text-lg font-semibold text-core-heading">Intelligence &amp; Analytics</h2>
        <p className="text-sm text-core-muted">Future self, predictions, confidence, vault, and usage</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FutureSelfPanel className="mt-0" />
        <PredictiveInsightsPanel className="mt-0" />
        <DecisionConfidencePanel className="mt-0" />
        <InsightVaultPanel className="mt-0" />
        <div className="sm:col-span-2 lg:col-span-3">
          <UserAnalyticsPanel className="mt-0" />
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Tab ──────────────────────────────────────────────────────

function WorkspaceTab() {
  const [workspace, setWorkspace] = useState<ReturnType<typeof loadCareerWorkspace> | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setWorkspace(loadCareerWorkspace());
    setLoaded(true);
  }, []);

  const career = useMemo(() => {
    if (!workspace?.selectedCareerId) return undefined;
    return getCareerById(workspace.selectedCareerId) ?? undefined;
  }, [workspace?.selectedCareerId]);

  const roadmapSteps = useMemo(() => {
    if (!workspace?.selectedCareerId) return [];
    const rm = roadmaps.find((r) => r.careerId === workspace.selectedCareerId);
    return rm?.steps ?? [];
  }, [workspace?.selectedCareerId]);

  if (!loaded) return null;

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h2 className="text-lg font-semibold text-core-heading">Career Workspace</h2>
        <p className="text-sm text-core-muted">Workspace, roadmaps, and execution sprints</p>
      </div>
      <CareerWorkspacePanel career={career} showCareersLink={true} />
      <div className="grid gap-4 sm:grid-cols-2">
        <AdaptiveRoadmapPanel steps={roadmapSteps} career={career} className="mt-0" />
        <ActionSprintPanel className="mt-0" />
      </div>
    </div>
  );
}

// ─── Desktop Tab Bar (sticky top) ──────────────────────────────────────

function DesktopTabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  // Scroll active tab into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const btn = el.querySelector(`[data-desktop-tab="${activeTab}"]`) as HTMLElement | null;
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab]);

  return (
    <nav className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-xl bg-[var(--bg)]/80 border-b border-core-border/40 hidden md:block">
      <div className="max-w-6xl mx-auto relative">
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-none"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-desktop-tab={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? "bg-core-accent/15 text-core-accent shadow-sm"
                    : "text-core-muted hover:text-core-heading hover:bg-white/5"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="desktop-tab-active"
                    className="absolute inset-0 rounded-full bg-core-accent/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right scroll fade */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-[var(--bg)] via-[var(--bg)]/80 to-transparent transition-opacity duration-200 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </nav>
  );
}

// ─── Mobile Bottom Nav ──────────────────────────────────────────────────

function MobileBottomNav({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-core-border/40 bg-[var(--bg)]/95 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-1 sm:px-2 py-1 gap-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                isActive
                  ? "text-core-accent"
                  : "text-core-muted/50 hover:text-core-muted"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className={`text-[9px] font-medium leading-tight ${isActive ? "opacity-100" : "opacity-60"}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-active"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-core-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Tab Content Wrapper (smooth transitions) ──────────────────────────

function TabContent({ activeTab }: { activeTab: TabId }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "journey" && <JourneyTab />}
          {activeTab === "growth" && <GrowthTab />}
          {activeTab === "intelligence" && <IntelligenceTab />}
          {activeTab === "workspace" && <WorkspaceTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <main className="page-shell py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-8 w-56 animate-skeleton" />
        <div className="h-5 w-96 animate-skeleton" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-core-border bg-core-surface p-5 space-y-3">
              <div className="h-3 w-1/3 animate-skeleton" />
              <div className="h-5 w-2/3 animate-skeleton" />
              <div className="h-3 w-1/2 animate-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Main Command Center Tabs Component ─────────────────────────────────

export default function CommandCenterTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [mounted, setMounted] = useState(false);

  // Hydrate persisted tab after mount
  useEffect(() => {
    setActiveTab(loadPersistedTab());
    setMounted(true);
  }, []);

  const handleTabChange = useCallback((id: TabId) => {
    setActiveTab(id);
    savePersistedTab(id);
  }, []);

  if (!mounted) return <Skeleton />;

  return (
    <main className="page-shell">
      {/* Desktop: sticky top tabs */}
      <DesktopTabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab content — only active tab renders */}
      <TabContent activeTab={activeTab} />

      {/* Mobile: bottom navigation bar */}
      <MobileBottomNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
    </main>
  );
}
