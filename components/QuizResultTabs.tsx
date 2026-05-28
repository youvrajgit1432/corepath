/**
 * QUIZ RESULT TABS
 *
 * App-style sectioned result page replacing the long vertical recommendation page.
 *
 * Tabs: Overview | Journey | Growth | Actions | Advanced
 *
 * Desktop: sticky top tabs
 * Mobile: bottom navigation bar
 *
 * Rules:
 *   - Only render active tab content
 *   - Persist selected tab in localStorage
 *   - Lazy-load inactive tabs (first visit only)
 *   - Low-engagement users (<3 quizzes AND <30% confidence) see locked Advanced
 *   - Sticky floating "Continue Journey" button
 */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Career } from "../data/careers";
import { getCareerById, aiImpactLabels, aiImpactColors } from "../data/careers";
import type { RecommendationExplanation } from "../data/recommendation-explanations";
import type { CareerEvolution } from "../data/career-evolution";
import type { JourneyMemory } from "../data/journey-memory";
import { loadJourneyMemory } from "../data/journey-memory";
import type { ProjectRecommendations } from "../data/project-recommendations";
import { generateConfidenceMetrics } from "../data/confidence-engine";
import { roadmaps } from "../data/roadmaps";
import { logEvent } from "../data/analytics-events";

// ─── Panel Imports ──────────────────────────────────────────────────────

import ConfidencePanel from "./ConfidencePanel";
import PersonalInsightsPanel from "./PersonalInsightsPanel";
import CareerIdentityPanel from "./CareerIdentityPanel";
import BehaviorInsightsPanel from "./BehaviorInsightsPanel";
import PersonalEvolutionPanel from "./PersonalEvolutionPanel";
import JourneyTimelinePanel from "./JourneyTimelinePanel";
import LearningStylePanel from "./LearningStylePanel";
import LearningFrictionPanel from "./LearningFrictionPanel";
import HabitIntelligencePanel from "./HabitIntelligencePanel";
import SkillGapPanel from "./SkillGapPanel";
import ActionSprintPanel from "./ActionSprintPanel";
import MissionIntelligencePanel from "./MissionIntelligencePanel";
import AdaptiveRoadmapPanel from "./AdaptiveRoadmapPanel";
import ProjectRecommendationPanel from "./ProjectRecommendationPanel";
import FutureSelfPanel from "./FutureSelfPanel";
import MemoryEvolutionPanel from "./MemoryEvolutionPanel";
import PredictiveInsightsPanel from "./PredictiveInsightsPanel";
import MarketPulsePanel from "./MarketPulsePanel";
import CommunitySignalsPanel from "./CommunitySignalsPanel";
import CareerCoachPanel from "./CareerCoachPanel";
import CareerRealityPanel from "./CareerRealityPanel";
import NextStepJourney from "./NextStepJourney";
import ProgressStreakWidget from "./ProgressStreakWidget";

// ─── Types ──────────────────────────────────────────────────────────────

type TabId = "overview" | "journey" | "growth" | "actions" | "advanced";

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "journey", label: "Journey", icon: "🧭" },
  { id: "growth", label: "Growth", icon: "🌱" },
  { id: "actions", label: "Actions", icon: "⚡" },
  { id: "advanced", label: "Advanced", icon: "🧠" },
];

const STORAGE_KEY = "corepath-quiz-result-tab";

// ─── Helper: load/save tab ──────────────────────────────────────────────

function loadPersistedTab(): TabId {
  if (typeof window === "undefined") return "overview";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TABS.some((t) => t.id === saved)) return saved as TabId;
  } catch {
    /* ignore */
  }
  return "overview";
}

function savePersistedTab(id: TabId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

// ─── Props ──────────────────────────────────────────────────────────────

interface QuizResultTabsProps {
  primaryCareer: Career;
  allResults: Array<{ careerId: string; percentage: number }>;
  primaryExplanation: RecommendationExplanation | null;
  evolution: CareerEvolution | null;
  projectRecommendations: ProjectRecommendations | undefined;
}

// ─── Overview Tab ───────────────────────────────────────────────────────

function OverviewTab({
  primaryCareer,
  allResults,
  primaryExplanation,
  evolution,
  journey,
}: {
  primaryCareer: Career;
  allResults: Array<{ careerId: string; percentage: number }>;
  primaryExplanation: RecommendationExplanation | null;
  evolution: CareerEvolution | null;
  journey: JourneyMemory;
}) {
  const primary = allResults[0];
  const others = allResults.slice(1);
  const comparison = others[0]
    ? primary.percentage - others[0].percentage
    : undefined;

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* ── NEXT STEP JOURNEY ── */}
      <NextStepJourney primaryCareer={primaryCareer} />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-3">
            Your Result
          </p>
          <h1 className="font-display text-4xl text-core-heading mb-2">
            Your CorePath is ready.
          </h1>
          <p className="text-core-muted">
            Based on your answers, here is your recommended specialization.
          </p>
        </div>
        {/* Desktop streak widget */}
        <div className="hidden sm:block w-48 shrink-0">
          <ProgressStreakWidget />
        </div>
      </div>

      {/* Mobile streak widget */}
      <div className="sm:hidden mb-5">
        <ProgressStreakWidget compact />
      </div>

      {/* ── WHY THIS MATCH ── */}
      {primaryExplanation && (
        <div className="rounded-lg border border-core-border bg-core-surface p-5">
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-2">
            Why this recommendation happened
          </p>
          <ul className="space-y-2 text-sm text-core-text">
            {primaryExplanation.whyMatched.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {primaryExplanation.alternativeInsight && (
            <div className="mt-4 rounded-lg bg-core-accent/5 p-4 border border-core-accent/20 text-sm text-core-text">
              <p className="font-semibold mb-2">Comparing nearby matches</p>
              <p>{primaryExplanation.alternativeInsight}</p>
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-core-accent/5 p-4 border border-core-accent/20">
              <p className="text-xs uppercase font-mono text-core-muted mb-2">
                AI-era outlook
              </p>
              <p className="text-sm text-core-text">
                {primaryExplanation.aiOutlook}
              </p>
            </div>
            <div className="rounded-lg bg-core-accent/5 p-4 border border-core-accent/20">
              <p className="text-xs uppercase font-mono text-core-muted mb-2">
                Immediate next action
              </p>
              <p className="text-sm text-core-text">
                {primaryExplanation.nextAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── BEST MATCH CARD ── */}
      <div className="rounded-card border border-core-accent/40 bg-core-surface p-6 glow-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{primaryCareer.icon}</span>
            <div>
              <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-1">
                Best Match &mdash; {primary.percentage}% alignment
              </p>
              <h2 className="font-display text-2xl text-core-heading">
                {primaryCareer.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="h-1.5 bg-core-border rounded-full overflow-hidden">
            <div
              className="h-full bg-core-accent rounded-full transition-all duration-700"
              style={{ width: `${primary.percentage}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-core-muted mb-4">
          {primaryCareer.tagline}
        </p>

        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-core-accent/5 border border-core-accent/20">
          <span className="text-core-accent text-lg">★</span>
          <div>
            <p className="text-xs font-mono text-core-muted">Your One Core Skill</p>
            <p className="text-sm font-medium text-core-accent">
              {primaryCareer.coreSkill}
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-mono mb-5 ${aiImpactColors[primaryCareer.aiImpact]}`}
        >
          {aiImpactLabels[primaryCareer.aiImpact]}
        </div>

        <CareerRealityPanel career={primaryCareer} />

        <div className="flex flex-col gap-3 sm:flex-row mt-5">
          <Link
            href={`/careers/${primaryCareer.id}`}
            onClick={() =>
              logEvent("recommendation_clicked", {
                careerId: primaryCareer.id,
                category: primaryCareer.category,
                action: "view_roadmap",
              })
            }
            className="flex-1 text-center px-4 py-2.5 rounded-lg bg-core-accent text-core-bg text-sm font-medium hover:bg-core-accent/90 transition-colors"
          >
            View Full Roadmap →
          </Link>
          <Link
            href="/quiz"
            onClick={() => logEvent("quiz_retaken")}
            className="px-4 py-2.5 rounded-lg border border-core-border text-core-muted text-sm hover:border-core-accent/40 transition-colors"
          >
            Retake
          </Link>
          {others[0] && (
            <Link
              href={`/careers/compare?careerA=${primaryCareer.id}&careerB=${others[0].careerId}`}
              onClick={() =>
                logEvent("comparison_initiated", {
                  careerA: primaryCareer.id,
                  careerB: others[0].careerId,
                })
              }
              className="px-4 py-2.5 rounded-lg border border-core-accent text-core-accent text-sm font-medium hover:bg-core-accent/10 transition-colors"
            >
              Compare careers
            </Link>
          )}
        </div>
      </div>

      {/* ── CONFIDENCE + PERSONAL INSIGHTS ── */}
      <ConfidencePanel journey={journey} layout="compact" />
      <PersonalInsightsPanel variant="compact" />

      {/* ── TOP 3 OTHER MATCHES ── */}
      {others.length > 0 && (
        <div>
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-3">
            Other Matches
          </p>
          <div className="space-y-3">
            {others.slice(0, 3).map((r) => {
              const career = getCareerById(r.careerId);
              if (!career) return null;
              return (
                <Link
                  key={r.careerId}
                  href={`/careers/${r.careerId}`}
                  onClick={() =>
                    logEvent("career_viewed", {
                      careerId: r.careerId,
                      category: career.category,
                      careerCategory: career.category,
                      source: "recommendation_matches",
                    })
                  }
                  className="flex items-center justify-between p-4 rounded-lg border border-core-border bg-core-surface hover:border-core-accent/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{career.icon}</span>
                    <div>
                      <p className="text-sm text-core-text group-hover:text-core-accent transition-colors">
                        {career.title}
                      </p>
                      <p className="text-xs text-core-muted font-mono">
                        {career.coreSkill}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-core-muted">
                      {r.percentage}%
                    </p>
                    <div className="w-16 h-1 bg-core-border rounded-full mt-1">
                      <div
                        className="h-full bg-core-muted rounded-full"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CAREER EVOLUTION ── */}
      {evolution && (
        <section className="rounded-card border border-core-border bg-core-surface p-6">
          <p className="text-xs uppercase font-mono text-core-muted tracking-widest mb-4">
            Where this path can take you
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="text-sm font-semibold text-core-heading mb-3">
                Career evolution
              </p>
              <ul className="space-y-3 text-sm text-core-muted">
                <li>
                  <span className="font-semibold text-core-text">Next roles:</span>{" "}
                  {evolution.immediateNextPaths.join(", ")}
                </li>
                <li>
                  <span className="font-semibold text-core-text">Mid-career moves:</span>{" "}
                  {evolution.midCareerEvolution.join(", ")}
                </li>
                <li>
                  <span className="font-semibold text-core-text">Specializations:</span>{" "}
                  {evolution.advancedSpecializationRoutes.join(", ")}
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="text-sm font-semibold text-core-heading mb-3">
                Skill ecosystem
              </p>
              <p className="text-sm text-core-muted mb-3">
                Core skill:{" "}
                <span className="font-semibold text-core-text">
                  {evolution.skillEcosystem.core}
                </span>
              </p>
              <p className="text-sm text-core-muted mb-2">
                Supporting: {evolution.skillEcosystem.supporting.join(", ")}
              </p>
              <p className="text-sm text-core-muted mb-2">
                Expansion: {evolution.skillEcosystem.expansion.join(", ")}
              </p>
              <p className="text-sm text-core-muted">
                Transferable: {evolution.skillEcosystem.transferable.join(", ")}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── BROWSE ALL ── */}
      <div className="text-center">
        <Link
          href="/careers"
          className="text-sm text-core-muted hover:text-core-accent transition-colors"
        >
          Browse all career paths →
        </Link>
      </div>
    </div>
  );
}

// ─── Journey Tab ────────────────────────────────────────────────────────

function JourneyTab() {
  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h2 className="text-lg font-semibold text-core-heading">
          Your Career Journey
        </h2>
        <p className="text-sm text-core-muted">
          Identity, behavior, evolution, and timeline
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CareerIdentityPanel className="mt-0" />
        <BehaviorInsightsPanel className="mt-0" />
        <PersonalEvolutionPanel className="mt-0" />
        <JourneyTimelinePanel className="mt-0" />
      </div>
    </div>
  );
}

// ─── Growth Tab ─────────────────────────────────────────────────────────

function GrowthTab({ primaryCareer }: { primaryCareer: Career }) {
  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h2 className="text-lg font-semibold text-core-heading">
          Growth &amp; Learning
        </h2>
        <p className="text-sm text-core-muted">
          Learning style, friction, habits, and skill gaps
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LearningStylePanel className="mt-0" />
        <LearningFrictionPanel className="mt-0" />
        <HabitIntelligencePanel className="mt-0" />
        <SkillGapPanel career={primaryCareer} className="mt-0" />
      </div>
    </div>
  );
}

// ─── Actions Tab ────────────────────────────────────────────────────────

function ActionsTab({
  primaryCareer,
  projectRecommendations,
}: {
  primaryCareer: Career;
  projectRecommendations: ProjectRecommendations | undefined;
}) {
  const roadmapSteps = useMemo(() => {
    const rm = roadmaps.find((r) => r.careerId === primaryCareer.id);
    return rm?.steps ?? [];
  }, [primaryCareer.id]);

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h2 className="text-lg font-semibold text-core-heading">
          Your Action Plan
        </h2>
        <p className="text-sm text-core-muted">
          Sprint, missions, roadmaps, and project recommendations
        </p>
      </div>

      <ActionSprintPanel className="mt-0" />
      <MissionIntelligencePanel className="mt-0" />
      <AdaptiveRoadmapPanel
        steps={roadmapSteps}
        career={primaryCareer}
        className="mt-0"
      />
      {projectRecommendations && (
        <ProjectRecommendationPanel
          recommendations={projectRecommendations}
          careerTitle={primaryCareer.title}
        />
      )}
    </div>
  );
}

// ─── Advanced Tab ───────────────────────────────────────────────────────

function UnlockPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-core-border/50 bg-core-bg/30 p-6 text-center">
      <span className="text-3xl mb-3 block">🔒</span>
      <p className="text-sm font-semibold text-core-heading mb-1">{title}</p>
      <p className="text-xs text-core-muted leading-relaxed">{description}</p>
    </div>
  );
}

function AdvancedTab({
  primaryCareer,
  showUnlocked,
}: {
  primaryCareer: Career;
  showUnlocked: boolean;
}) {
  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h2 className="text-lg font-semibold text-core-heading">
          Advanced Intelligence
        </h2>
        <p className="text-sm text-core-muted">
          Future self, memory, predictions, market insights, and coaching
        </p>
      </div>

      {showUnlocked ? (
        <>
          {/* Future Self */}
          <FutureSelfPanel />
          {/* Memory Evolution */}
          <MemoryEvolutionPanel />
          {/* Predictive Insights */}
          <PredictiveInsightsPanel />
          {/* Market Pulse */}
          <MarketPulsePanel career={primaryCareer} />
          {/* Community Intelligence */}
          <CommunitySignalsPanel career={primaryCareer} />
          {/* Career Coach */}
          <CareerCoachPanel career={primaryCareer} />
        </>
      ) : (
        <>
          <UnlockPlaceholder
            title="Future Self Intelligence"
            description="Complete 3+ quizzes to unlock your future trajectory projection and career evolution path."
          />
          <UnlockPlaceholder
            title="Memory Evolution"
            description="Complete 3+ quizzes to see how your thinking and career preferences have evolved over time."
          />
          <UnlockPlaceholder
            title="Predictive Insights"
            description="Complete 3+ quizzes to unlock forward-looking predictions about your career momentum and direction."
          />
          <UnlockPlaceholder
            title="Market Intelligence"
            description="Complete 3+ quizzes to see market demand signals, AI transformation risk, and future career outlook."
          />
          <UnlockPlaceholder
            title="Community Intelligence"
            description="Complete 3+ quizzes to discover what learners like you are exploring and trending career signals."
          />
          <UnlockPlaceholder
            title="AI Career Coach"
            description="Complete 3+ quizzes to unlock personalized coaching insights, weekly advice, and direction checks."
          />
        </>
      )}
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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const btn = el.querySelector(
      `[data-desktop-tab="${activeTab}"]`
    ) as HTMLElement | null;
    if (btn)
      btn.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
  }, [activeTab]);

  return (
    <nav className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-xl bg-[var(--bg)]/80 border-b border-core-border/40 hidden md:block">
      <div className="max-w-2xl mx-auto relative">
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
                    layoutId="desktop-result-tab-active"
                    className="absolute inset-0 rounded-full bg-core-accent/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

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
              <span
                className={`text-[9px] font-medium leading-tight ${
                  isActive ? "opacity-100" : "opacity-60"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobile-result-tab-active"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-core-accent"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Sticky Continue Journey Button ─────────────────────────────────────

function ContinueJourneyButton({ careerId }: { careerId: string }) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-xl bg-[var(--bg)]/90 border-t border-core-border/40 md:hidden">
      <Link
        href={`/careers/${careerId}`}
        onClick={() =>
          logEvent("continue_journey_clicked", { careerId })
        }
        className="flex items-center justify-center gap-2 w-full rounded-full bg-core-accent px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-core-accent/90 transition-colors"
      >
        Continue Journey →
      </Link>
    </div>
  );
}

// ─── Tab Content Wrapper (smooth transitions) ──────────────────────────

function TabContent({
  activeTab,
  primaryCareer,
  allResults,
  primaryExplanation,
  evolution,
  projectRecommendations,
  journey,
  showAdvanced,
}: {
  activeTab: TabId;
  primaryCareer: Career;
  allResults: Array<{ careerId: string; percentage: number }>;
  primaryExplanation: RecommendationExplanation | null;
  evolution: CareerEvolution | null;
  projectRecommendations: ProjectRecommendations | undefined;
  journey: JourneyMemory;
  showAdvanced: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pt-4 sm:pt-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              primaryCareer={primaryCareer}
              allResults={allResults}
              primaryExplanation={primaryExplanation}
              evolution={evolution}
              journey={journey}
            />
          )}
          {activeTab === "journey" && <JourneyTab />}
          {activeTab === "growth" && <GrowthTab primaryCareer={primaryCareer} />}
          {activeTab === "actions" && (
            <ActionsTab
              primaryCareer={primaryCareer}
              projectRecommendations={projectRecommendations}
            />
          )}
          {activeTab === "advanced" && (
            <AdvancedTab
              primaryCareer={primaryCareer}
              showUnlocked={showAdvanced}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <ContinueJourneyButton careerId={primaryCareer.id} />
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-4">
      <div className="h-8 w-56 animate-skeleton" />
      <div className="h-5 w-96 animate-skeleton" />
      <div className="grid gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-core-border bg-core-surface p-5 space-y-3"
          >
            <div className="h-3 w-1/3 animate-skeleton" />
            <div className="h-5 w-2/3 animate-skeleton" />
            <div className="h-3 w-1/2 animate-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Quiz Result Tabs Component ────────────────────────────────────

export default function QuizResultTabs({
  primaryCareer,
  allResults,
  primaryExplanation,
  evolution,
  projectRecommendations,
}: QuizResultTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [mounted, setMounted] = useState(false);
  const [journey, setJourney] = useState<JourneyMemory | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Hydrate persisted tab + journey after mount
  useEffect(() => {
    setActiveTab(loadPersistedTab());
    const j = loadJourneyMemory();
    setJourney(j);

    // Check engagement for advanced tab
    const metrics = generateConfidenceMetrics(j);
    const isLowEngagement =
      j.completedQuizzes < 3 || metrics.confidenceScore < 0.3;
    setShowAdvanced(!isLowEngagement);

    setMounted(true);
  }, []);

  const handleTabChange = useCallback((id: TabId) => {
    setActiveTab(id);
    savePersistedTab(id);
  }, []);

  if (!mounted || !journey) return <Skeleton />;

  return (
    <main className="page-shell">
      {/* Desktop: sticky top tabs */}
      <DesktopTabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tab content */}
      <TabContent
        activeTab={activeTab}
        primaryCareer={primaryCareer}
        allResults={allResults}
        primaryExplanation={primaryExplanation}
        evolution={evolution}
        projectRecommendations={projectRecommendations}
        journey={journey}
        showAdvanced={showAdvanced}
      />

      {/* Mobile: bottom navigation bar */}
      <MobileBottomNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </main>
  );
}
