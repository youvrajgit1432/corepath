"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { loadJourneyMemory } from "../data/journey-memory";
import { getDailyMissions, isMissionCompleted } from "../data/daily-missions";
import { loadActionSprint } from "../data/action-sprints";
import { computeCareerProgress, loadCareerProgress } from "../data/career-progress";
import { computeAchievements, loadAchievements, levelProgressPercentage } from "../data/achievement-engine";

import { getPanelVisibility, type PanelVisibilityData, type UserStage } from "../data/panel-visibility";
import { getUnreadCount } from "../data/notification-engine";
import HomeCareerPreviewGrid from "./HomeCareerPreviewGrid";
import CareerIdentityPanel from "./CareerIdentityPanel";
import RecentCareerHistoryPanel from "./RecentCareerHistoryPanel";
import ActionSprintPanel from "./ActionSprintPanel";
import CareerProgressPanel from "./CareerProgressPanel";
import AchievementPanel from "./AchievementPanel";
import GrowthSummaryCard from "./GrowthSummaryCard";
import PredictiveInsightsPanel from "./PredictiveInsightsPanel";
import MemoryEvolutionPanel from "./MemoryEvolutionPanel";
import FutureSelfPanel from "./FutureSelfPanel";
import InsightVaultPanel from "./InsightVaultPanel";
import AdaptiveSelfCorrectionPanel from "./AdaptiveSelfCorrectionPanel";

// ─── TYPES ───────────────────────────────────────────────────────────────

type TabId = "overview" | "journey" | "growth" | "intelligence";

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  description: string;
  requiredStage: UserStage;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview", icon: "🏠", description: "Your launchpad", requiredStage: "new_user" },
  { id: "journey", label: "Journey", icon: "🧭", description: "Identity & recommendations", requiredStage: "returning" },
  { id: "growth", label: "Growth", icon: "📈", description: "Learning & execution", requiredStage: "engaged" },
  { id: "intelligence", label: "Intelligence", icon: "🧠", description: "Predictions & memory", requiredStage: "power_user" },
];

const STAGE_ORDER: Record<UserStage, number> = {
  new_user: 0,
  returning: 1,
  engaged: 2,
  power_user: 3,
};

// ─── SWIPE HOOK ───────────────────────────────────────────────────────────

function useSwipe(
  ref: React.RefObject<HTMLElement | null>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 60
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX;
      const deltaY = e.changedTouches[0].clientY - startY;
      const elapsed = Date.now() - startTime;

      // Must be a quick gesture (< 300ms), horizontal enough, and beyond threshold
      if (elapsed > 300) return;
      if (Math.abs(deltaX) < threshold) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.5) return;

      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, threshold]);
}

// ─── LOCKED TAB CARD ────────────────────────────────────────────────────

function LockedTabPreview({ tab, userStage }: { tab: TabConfig; userStage: UserStage }) {
  const hints: Record<string, string> = {
    returning: "Complete 2+ quizzes to unlock your Journey tab with career identity, workspace, and recommendations.",
    engaged: "Complete 5+ quizzes and set up a workspace to unlock the Growth tab with learning style, habits, and execution tools.",
    power_user: "Reach Power User status (15+ sessions, active workspace, 7-day streak) to unlock the Intelligence tab with predictions, memory, and future self systems.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-core-border/50 bg-core-bg/40 text-2xl opacity-50">
        {tab.icon}
      </div>
      <p className="text-lg font-semibold text-core-heading">{tab.label}</p>
      <p className="mt-2 max-w-md text-sm text-core-muted leading-relaxed">
        {hints[tab.requiredStage] ?? `Keep exploring to unlock ${tab.label}.`}
      </p>
      <div className="mt-6 flex items-center gap-2">
        <div className="h-1.5 w-24 rounded-full bg-core-border/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-core-accent/40 transition-all"
            style={{ width: `${(STAGE_ORDER[userStage] / STAGE_ORDER.power_user) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-core-muted/50 uppercase tracking-wider">
          {userStage === "new_user" ? "New" : userStage === "returning" ? "Returning" : "Engaged"} · {STAGE_ORDER[userStage] + 1}/{4} stages
        </span>
      </div>
    </div>
  );
}

// ─── TAB HEADER ──────────────────────────────────────────────────────────

function TabNav({
  tabs,
  activeTab,
  setActiveTab,
  userStage,
}: {
  tabs: TabConfig[];
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  userStage: UserStage;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
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

  // Scroll active tab into view on change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeButton = el.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null;
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  return (
    <nav className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-xl bg-[var(--bg)]/80 border-b border-core-border/40">
      <div className="max-w-6xl mx-auto relative">
        {/* Left scroll fade */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/80 to-transparent transition-opacity duration-200 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Scrollable tabs */}
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory"
        >
          {tabs.map((tab) => {
            const isLocked = STAGE_ORDER[userStage] < STAGE_ORDER[tab.requiredStage];
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                type="button"
                onClick={() => !isLocked && setActiveTab(tab.id)}
                disabled={isLocked}
                className={`
                  relative flex items-center gap-1.5 sm:gap-2
                  px-3 sm:px-4 py-2 sm:py-2.5
                  rounded-full
                  text-[11px] sm:text-xs
                  font-medium whitespace-nowrap
                  transition-all duration-200 shrink-0
                  snap-start
                  ${isActive
                    ? "bg-core-accent/15 text-core-accent shadow-sm"
                    : isLocked
                      ? "text-core-muted/30 cursor-not-allowed"
                      : "text-core-muted hover:text-core-heading hover:bg-white/5"
                  }
                `}
              >
                <span className={`${isLocked ? "opacity-30" : ""} text-sm sm:text-base`}>{tab.icon}</span>
                <span>{tab.label}</span>
                {isLocked && (
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {isActive && (
                  <motion.div
                    layoutId="tab-active"
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

      {/* Mobile scroll hint — fades out after scrolling */}
      {canScrollRight && (
        <div className="flex justify-center mt-1.5 sm:hidden">
          <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-core-muted/40 animate-pulse">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Scroll for more
          </span>
        </div>
      )}
    </nav>
  );
}

// ─── STAGE BADGE ─────────────────────────────────────────────────────────

function StageBadge({ userStage }: { userStage: UserStage }) {
  const labels: Record<UserStage, { label: string; color: string }> = {
    new_user: { label: "New Explorer", color: "text-sky-400 border-sky-400/30 bg-sky-400/5" },
    returning: { label: "Returning", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5" },
    engaged: { label: "Engaged", color: "text-amber-400 border-amber-400/30 bg-amber-400/5" },
    power_user: { label: "Power User", color: "text-purple-400 border-purple-400/30 bg-purple-400/5" },
  };
  const info = labels[userStage];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${info.color}`}>
      {info.label}
    </span>
  );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────

function OverviewTab({
  userStage,
  hasCompletedQuiz,
  onAction,
}: {
  userStage: UserStage;
  hasCompletedQuiz: boolean;
  onAction: () => void;
}) {
  const [missions, setMissions] = useState<ReturnType<typeof getDailyMissions> | null>(null);
  const [sprint, setSprint] = useState<ReturnType<typeof loadActionSprint> | null>(null);

  useEffect(() => {
    setMissions(getDailyMissions());
    setSprint(loadActionSprint());
  }, []);

  const missionComplete = missions ? isMissionCompleted(missions.todayMission.id) : false;
  const isNewUser = !hasCompletedQuiz;

  // New user: only show Quiz CTA + Continue Journey + Trending Careers
  // Returning user: show full overview with missions, stats, and progress
  if (isNewUser) {
    return (
      <div className="space-y-5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start Quiz CTA */}
          <div className="rounded-2xl border border-core-accent/20 bg-gradient-to-br from-core-accent/5 to-transparent p-5 sm:p-6 shadow-soft">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent font-semibold">First step</p>
            <p className="mt-2 text-sm font-semibold text-core-heading">Discover your career profile</p>
            <p className="mt-1 text-xs text-core-muted leading-relaxed">
              Take the 5-minute career cognition quiz to unlock personalized insights.
            </p>
            <Link
              href="/quiz"
              onClick={onAction}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-core-accent px-4 py-2.5 text-xs font-medium text-white shadow-glow transition hover:bg-indigo-500"
            >
              Start the quiz →
            </Link>
          </div>

          {/* Continue Journey */}
          <div className="rounded-2xl border border-core-border bg-core-surface p-5 sm:p-6 shadow-soft">
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Next action</p>
            <p className="mt-2 text-sm font-semibold text-core-heading leading-snug">
              Explore your next career move
            </p>
            <p className="mt-1 text-xs text-core-muted leading-relaxed line-clamp-2">
              Browse careers to find roles that match your interests and strengths.
            </p>
            <Link
              href="/careers"
              onClick={onAction}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-core-border px-4 py-2.5 text-xs font-medium text-core-text transition hover:border-core-accent hover:text-core-accent"
            >
              Browse careers
            </Link>
          </div>
        </div>

        {/* Trending AI Careers */}
        <div className="pt-2">
          <HomeCareerPreviewGrid />
        </div>
      </div>
    );
  }

  // Returning user view
  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Current Mission */}
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
                onClick={onAction}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-core-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
              >
                Start mission
              </Link>
            ) : (
              <p className="mt-3 text-xs font-medium text-emerald-400">✓ Completed</p>
            )}
          </div>
        )}

        {/* Continue Journey Card */}
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
            onClick={onAction}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-text transition hover:border-core-accent hover:text-core-accent"
          >
            Continue journey
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl border border-core-border bg-core-surface p-5 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Your progress</p>
          <div className="mt-3 flex items-center gap-4">
            <ProgressStat value={missions?.completedMissionIds.length ?? 0} label="missions" />
            <ProgressStat value={userStage === "power_user" ? "Lv.Max" : `${STAGE_ORDER[userStage] + 1}/4`} label="stage" />
          </div>
          <Link
            href="/insights"
            onClick={onAction}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-text transition hover:border-core-accent hover:text-core-accent"
          >
            View insights
          </Link>
        </div>

        {/* Level & XP */}
        <AchievementMiniCard />
      </div>

      {/* Trending AI Careers */}
      <div className="pt-2">
        <HomeCareerPreviewGrid />
      </div>
    </div>
  );
}

function ProgressStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-core-heading">{value}</p>
      <p className="text-[10px] text-core-muted uppercase tracking-wider">{label}</p>
    </div>
  );
}

function AchievementMiniCard() {
  const [achievements, setAchievements] = useState<ReturnType<typeof loadAchievements> | null>(null);
  const [progress, setProgress] = useState<ReturnType<typeof loadCareerProgress> | null>(null);

  useEffect(() => {
    const ach = loadAchievements() ?? computeAchievements();
    setAchievements(ach);
    const prog = loadCareerProgress() ?? computeCareerProgress();
    setProgress(prog);
  }, []);

  if (!achievements) return null;

  const pct = levelProgressPercentage(achievements);

  return (
    <div className="rounded-2xl border border-core-border bg-core-surface p-5 shadow-soft">
      <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Level & XP</p>
      <p className="mt-1.5 text-2xl font-bold text-core-heading">Lv.{achievements.level}</p>
      <p className="text-xs text-core-muted">{achievements.xp} XP · {achievements.unlockedAchievements.length} achievements</p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-core-accent to-indigo-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-core-muted/70">{pct}% to next level</p>
    </div>
  );
}

// ─── JOURNEY TAB ─────────────────────────────────────────────────────────

function JourneyTab({ onAction }: { onAction: () => void }) {
  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <CareerIdentityPanel className="mt-0" />
        <div className="space-y-4">
          <RecentCareerHistoryPanel />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CareerProgressPanel />
        <AchievementPanel />
      </div>
    </div>
  );
}

// ─── GROWTH TAB ──────────────────────────────────────────────────────────

function GrowthTab({ onAction }: { onAction: () => void }) {
  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GrowthSummaryCard className="mt-0" />
        <ActionSprintPanel className="mt-0" />
      </div>
    </div>
  );
}

// ─── INTELLIGENCE TAB ────────────────────────────────────────────────────

function IntelligenceTab({ onAction }: { onAction: () => void }) {
  return (
    <div className="space-y-5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PredictiveInsightsPanel className="mt-0" />
        <FutureSelfPanel className="mt-0" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MemoryEvolutionPanel className="mt-0" />
        <InsightVaultPanel className="mt-0" />
        <AdaptiveSelfCorrectionPanel className="mt-0" />
      </div>
    </div>
  );
}

// ─── FLOATING CONTINUE JOURNEY BUTTON ──────────────────────────────────

function FloatingContinueButton({ visible, onScroll }: { visible: boolean; onScroll: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AnimatePresence>
      {mounted && visible && (
        <motion.button
          type="button"
          onClick={onScroll}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-core-accent to-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-core-accent/25 transition hover:shadow-xl hover:from-indigo-500 hover:to-indigo-600"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Continue Journey
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── HERO SECTION (compact) ────────────────────────────────────────────

function CompactHero({ hasCompletedQuiz }: { hasCompletedQuiz: boolean }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-core-accent font-semibold">AI-era career intelligence</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-core-heading leading-tight max-w-2xl">
            {hasCompletedQuiz
              ? "Your career intelligence dashboard"
              : "Find your AI-era specialization"}
          </h1>
          <p className="mt-2 text-sm text-core-muted max-w-xl leading-relaxed">
            {hasCompletedQuiz
              ? "Track your progress, explore recommendations, and deepen your career strategy."
              : "CorePath surfaces the specialization that gives you long-term advantage, future clarity, and a confident next move."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto min-w-0">
          {!hasCompletedQuiz && (
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center rounded-full bg-core-accent px-5 py-2.5 text-xs font-semibold text-white shadow-glow transition hover:bg-indigo-500 w-full sm:w-auto"
            >
              Start quiz
            </Link>
          )}
          <Link
            href="/careers"
            className="inline-flex items-center justify-center rounded-full border border-core-border px-5 py-2.5 text-xs font-semibold text-core-heading transition hover:bg-white/10 w-full sm:w-auto"
          >
            Browse careers
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── MAIN PROGRESSIVE HOME COMPONENT ─────────────────────────────────────

export default function ProgressiveHome() {
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState<boolean | null>(null);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibilityData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const memory = loadJourneyMemory();
    setHasCompletedQuiz(memory.completedQuizzes > 0);
    setPanelVisibility(getPanelVisibility());
  }, []);

  // Determine user stage
  const userStage: UserStage = panelVisibility?.userStage ?? "new_user";
  const isNewUser = !hasCompletedQuiz;
  const stageLevel = STAGE_ORDER[userStage];

  // Hide advanced tabs for new users - only show Overview
  const visibleTabs = isNewUser ? TABS.filter((t) => t.id === "overview") : TABS;

  // Show floating button when scrolled past the hero
  useEffect(() => {
    if (!mounted || isNewUser) return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowFloatingButton(scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted, isNewUser]);

  // Scroll to the top of the main content
  const scrollToContent = useCallback(() => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Available (unlocked) tabs for swipe navigation
  const availableTabs = visibleTabs.filter((t) => STAGE_ORDER[userStage] >= STAGE_ORDER[t.requiredStage]);

  const handleSwipeLeft = useCallback(() => {
    const currentIndex = availableTabs.findIndex((t) => t.id === activeTab);
    if (currentIndex < availableTabs.length - 1) {
      setActiveTab(availableTabs[currentIndex + 1].id);
    }
  }, [availableTabs, activeTab]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = availableTabs.findIndex((t) => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(availableTabs[currentIndex - 1].id);
    }
  }, [availableTabs, activeTab]);

  useSwipe(contentRef, handleSwipeLeft, handleSwipeRight, 50);

  // If not mounted yet, show skeleton
  if (!mounted || hasCompletedQuiz === null) {
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

  return (
    <main ref={mainRef} className="page-shell pb-16 sm:pb-24">
      {/* Compact Hero */}
      <CompactHero hasCompletedQuiz={hasCompletedQuiz} />

      {/* Sticky Tab Navigation - hidden for new users since only Overview is visible */}
      {!isNewUser && (
        <TabNav
          tabs={visibleTabs}
          activeTab={activeTab}
          setActiveTab={(id) => {
            setActiveTab(id);
            window.scrollTo({ top: 280, behavior: "smooth" });
          }}
          userStage={userStage}
        />
      )}

      {/* Tab Content */}
      <div ref={contentRef} className={`mt-4 sm:mt-6 ${isNewUser ? "" : ""}`}>
        {activeTab === "overview" && (
          <OverviewTab
            userStage={userStage}
            hasCompletedQuiz={hasCompletedQuiz}
            onAction={() => {}}
          />
        )}

        {!isNewUser && activeTab === "journey" && (
          stageLevel >= STAGE_ORDER.returning ? (
            <JourneyTab onAction={() => {}} />
          ) : (
            <LockedTabPreview tab={TABS[1]} userStage={userStage} />
          )
        )}

        {!isNewUser && activeTab === "growth" && (
          stageLevel >= STAGE_ORDER.engaged ? (
            <GrowthTab onAction={() => {}} />
          ) : (
            <LockedTabPreview tab={TABS[2]} userStage={userStage} />
          )
        )}

        {!isNewUser && activeTab === "intelligence" && (
          stageLevel >= STAGE_ORDER.power_user ? (
            <IntelligenceTab onAction={() => {}} />
          ) : (
            <LockedTabPreview tab={TABS[3]} userStage={userStage} />
          )
        )}
      </div>

      {/* Floating Continue Journey Button - only for non-new users */}
      {!isNewUser && (
        <FloatingContinueButton
          visible={showFloatingButton}
          onScroll={scrollToContent}
        />
      )}
    </main>
  );
}
