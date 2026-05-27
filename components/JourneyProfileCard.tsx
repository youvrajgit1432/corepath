"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  buildJourneyProfile,
  loadJourneyMemory,
  recordJourneyEvent,
  type JourneyEvent,
  type JourneyProfile,
} from "../data/journey-memory";
import type { EnhancedProfile } from "../data/quiz-enhanced";
import ConfidencePanel from "./ConfidencePanel";
import ProfileRadarChart from "./ProfileRadarChart";
import SpecializationConfidenceChart from "./SpecializationConfidenceChart";
import QuizHistoryPanel from "./QuizHistoryPanel";
import JourneyTimelinePanel from "./JourneyTimelinePanel";
import RecentCareerHistoryPanel from "./RecentCareerHistoryPanel";
import ComparisonHistoryPanel from "./ComparisonHistoryPanel";
import QuizResumeCenter from "./QuizResumeCenter";
import CareerProgressPanel from "./CareerProgressPanel";
import AchievementPanel from "./AchievementPanel";
import GoalTrackerPanel from "./GoalTrackerPanel";
import GrowthAnalyticsPanel from "./GrowthAnalyticsPanel";
import JourneyReplayPanel from "./JourneyReplayPanel";
import JourneyReplaySummaryCard from "./JourneyReplaySummaryCard";
import CareerIdentityPanel from "./CareerIdentityPanel";
import NotificationPanel from "./NotificationPanel";
import DecisionAssistantPanel from "./DecisionAssistantPanel";
import BehaviorInsightsPanel from "./BehaviorInsightsPanel";
import PredictiveInsightsPanel from "./PredictiveInsightsPanel";
import RecommendationEvolutionPanel from "./RecommendationEvolutionPanel";
import CareerScenarioPanel from "./CareerScenarioPanel";
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
import CareerMomentumPanel from "./CareerMomentumPanel";
import CareerAlignmentPanel from "./CareerAlignmentPanel";
import CareerStoryPanel from "./CareerStoryPanel";
import IntelligenceSynthesisPanel from "./IntelligenceSynthesisPanel";
import ActionSprintPanel from "./ActionSprintPanel";
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
import { getPanelVisibility } from "../data/panel-visibility";
import AdaptivePanelContainer from "./AdaptivePanelContainer";
import type { PanelVisibilityData } from "../data/panel-visibility";

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

function exportJourneySnapshot(profile: JourneyProfile | null) {
  if (!profile) return;
  const snapshot = {
    exportedAt: new Date().toISOString(),
    sessions: profile.sessions,
    topThemes: profile.topThemes,
    favoriteCategories: profile.favoriteCategories,
    careerInterestProfile: profile.careerInterestProfile,
    recentChanges: profile.recentChanges,
  };
  exportAsFile(
    JSON.stringify(snapshot, null, 2),
    `corepath-snapshot-${Date.now()}.json`,
    "application/json"
  );
}

function exportCareerIdentity(profile: JourneyProfile | null) {
  if (!profile) return;
  const identity = {
    exportedAt: new Date().toISOString(),
    sessions: profile.sessions,
    topThemes: profile.topThemes,
    favoriteCategories: profile.favoriteCategories,
    interestProfile: profile.careerInterestProfile,
    specializationSignals: profile.evolvingSpecializationSignals,
    confidenceTrends: profile.confidenceTrends,
  };
  exportAsFile(
    JSON.stringify(identity, null, 2),
    `corepath-identity-${Date.now()}.json`,
    "application/json"
  );
}

function exportProgressSummary(profile: JourneyProfile | null) {
  if (!profile) return;
  const lines: string[] = [
    "=== CorePath Progress Summary ===",
    `Exported: ${new Date().toLocaleDateString()}`,
    "",
    `Sessions Tracked: ${profile.sessions}`,
    `Top Themes: ${profile.topThemes.join(", ")}`,
    `Favorite Categories: ${profile.favoriteCategories.join(", ")}`,
    "",
    "--- Interest Profile ---",
    ...profile.careerInterestProfile.map((p) => `  - ${p}`),
    "",
    "--- Recent Changes ---",
    ...profile.recentChanges.map((c) => `  - ${c}`),
    "",
    "--- Confidence Trends ---",
    ...profile.confidenceTrends.map((t) => `  - ${t}`),
    "",
    "Generated by CorePath (corepath.io)",
  ];
  exportAsFile(lines.join("\n"), `corepath-progress-${Date.now()}.txt`);
}

// ─── Export Menu (with click-outside + escape handling) ─────────────────

function JourneyExportMenu({ profile, onClose }: { profile: JourneyProfile | null; onClose: () => void }) {
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
        onClick={() => { exportJourneySnapshot(profile); onClose(); }}
        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-core-text hover:bg-core-accent/10 transition-colors"
      >
        Export Journey Snapshot
      </button>
      <button
        type="button"
        onClick={() => { exportCareerIdentity(profile); onClose(); }}
        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-core-text hover:bg-core-accent/10 transition-colors"
      >
        Export Career Identity
      </button>
      <button
        type="button"
        onClick={() => { exportProgressSummary(profile); onClose(); }}
        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-core-text hover:bg-core-accent/10 transition-colors"
      >
        Export Progress Summary
      </button>
    </div>
  );
}

type Props = {
  event?: JourneyEvent;
  enhancedProfile?: EnhancedProfile;
  className?: string;
};

export default function JourneyProfileCard({ event, enhancedProfile, className = "" }: Props) {
  const [profile, setProfile] = useState<JourneyProfile | null>(null);
  const [journey, setJourney] = useState(loadJourneyMemory());
  const [loaded, setLoaded] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibilityData | null>(null);
  const lastEventRef = useRef<string | null>(null);

  const scrollToAttribution = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as { source?: string; cause?: string } | undefined;
    if (detail?.source) {
      const attrSection = document.querySelector(`[data-attribution-source="${detail.source}"]`);
      if (attrSection) {
        attrSection.scrollIntoView({ behavior: "smooth", block: "center" });
        attrSection.classList.add("ring-2", "ring-core-accent/60", "ring-offset-2", "ring-offset-core-bg");
        setTimeout(() => {
          attrSection.classList.remove("ring-2", "ring-core-accent/60", "ring-offset-2", "ring-offset-core-bg");
        }, 2000);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("corepath:scroll-to-attribution", scrollToAttribution as EventListener);
    return () =>
      window.removeEventListener("corepath:scroll-to-attribution", scrollToAttribution as EventListener);
  }, [scrollToAttribution]);

  useEffect(() => {
    const eventJson = event ? JSON.stringify(event) : null;
    if (event && eventJson !== lastEventRef.current) {
      recordJourneyEvent(event);
      lastEventRef.current = eventJson;
    }
    const memory = loadJourneyMemory();
    setJourney(memory);
    const updatedProfile = buildJourneyProfile(memory);
    if (updatedProfile.sessions > 0) {
      setProfile(updatedProfile);
    }
    setLoaded(true);

    // Load panel visibility
    setPanelVisibility(getPanelVisibility());
  }, [event, enhancedProfile]);

  // ── Memoised radar points ──
  const radarPoints = useMemo(() => {
    if (!enhancedProfile) return [];
    return Object.entries(enhancedProfile.extended)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [enhancedProfile]);

  // ── Skeleton while loading ──
  if (!loaded) {
    return (
      <section className={`rounded-2xl border border-core-border bg-core-surface p-4 sm:p-6 ${className}`}>
        <div className="mb-6 space-y-2">
          <div className="h-3 w-32 animate-skeleton" />
          <div className="h-7 w-64 animate-skeleton" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <SkeletonPanel lines={5} />
          <SkeletonPanel lines={3} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonPanel lines={2} />
          <SkeletonPanel lines={2} />
          <SkeletonPanel lines={2} />
        </div>
      </section>
    );
  }

  // ── Empty state ──
  if (!profile) {
    return (
      <section className={`rounded-2xl border border-core-border bg-core-surface p-4 sm:p-6 ${className}`}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Your evolving profile</p>
          <h2 className="mt-2 text-xl sm:text-2xl font-display text-core-heading">What your journey is showing</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-core-border bg-core-bg/30 p-8 text-center">
          <p className="text-sm text-core-muted">Not enough data yet.</p>
          <p className="mt-2 text-xs text-core-muted/60">
            Complete a quiz or explore careers to start building your profile.
          </p>
          <a
            href="/quiz"
            className="mt-4 inline-block rounded-full bg-core-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
          >
            Take your first quiz
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-4 sm:p-6 overflow-hidden ${className}`}>
      {/* Header with export */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Your evolving profile</p>
          <h2 className="mt-2 text-xl sm:text-2xl font-display text-core-heading">What your journey is showing</h2>
        </div>
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
          >
            Export
          </button>
          {showExportMenu && <JourneyExportMenu profile={profile} onClose={() => setShowExportMenu(false)} />}
        </div>
      </div>

      {/* Radar + Confidence */}
      {enhancedProfile ? (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] mb-6">
          <ProfileRadarChart points={radarPoints} />
          <SpecializationConfidenceChart
            confidence={enhancedProfile.confidence}
            specializationDepth={enhancedProfile.specializationDepth}
          />
        </div>
      ) : null}

      {/* Profile summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="space-y-4 rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-sm font-semibold text-core-heading">Your history</p>
          {profile.careerInterestProfile.length > 0 ? (
            <ul className="space-y-3 text-sm text-core-muted">
              {profile.careerInterestProfile.map((item, index) => (
                <li key={`interest-${index}`} className="flex items-start gap-3">
                  <span className="mt-1 shrink-0">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-core-muted">Not enough data yet. Complete a quiz to see your interests.</p>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-sm font-semibold text-core-heading">What changed</p>
          <ul className="space-y-3 text-sm text-core-muted">
            {profile.recentChanges.length > 0 ? (
              profile.recentChanges.map((item, index) => (
                <li key={`changed-${index}`} className="flex items-start gap-3">
                  <span className="mt-1 shrink-0">&bull;</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="mt-1 shrink-0">&bull;</span>
                <span>We&apos;re tracking your profile across sessions.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Sessions tracked</p>
          <p className="mt-3 text-3xl font-semibold text-core-heading">{profile.sessions}</p>
        </div>
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Favorite themes</p>
          <p className="mt-3 text-sm text-core-text">
            {profile.topThemes.length > 0 ? profile.topThemes.join(", ") : "None yet"}
          </p>
        </div>
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Strong categories</p>
          <p className="mt-3 text-sm text-core-text">
            {profile.favoriteCategories.length > 0 ? profile.favoriteCategories.join(", ") : "None yet"}
          </p>
        </div>
      </div>

      {/* Confidence */}
      <ConfidencePanel journey={journey} profile={enhancedProfile} layout="compact" className="mt-6" />

      {/* ─── ADAPTIVE PANEL GROUPS ─── */}
      {panelVisibility ? (
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
            <CareerIdentityPanel
              enhancedProfileTraits={enhancedProfile?.extended}
              className="mt-0"
            />
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
            <RecommendationEvolutionPanel className="mt-0" />
            <DecisionReadinessPanel className="mt-0" />
            <DecisionPriorityPanel className="mt-0" />
            <DecisionIntelligencePanel className="mt-0" />
          </AdaptivePanelContainer>

          {/* Execution — always visible */}
          <SectionHeader label="Execution" description="Sprints, actions, and weekly growth" />
          <div className="panel-stack">
            <GrowthSummaryCard className="mt-0" />
            <CareerProgressPanel className="mt-0" />
            <AchievementPanel className="mt-0" />
            <ActionSprintPanel className="mt-0" />
            <GoalTrackerPanel className="mt-0" />
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
            <JourneyReplaySummaryCard className="mt-0" />
            <JourneyReplayPanel className="mt-0" />
            <ProgressReflectionPanel className="mt-0" />
            <CareerMomentumPanel className="mt-0" />
            <CareerAlignmentPanel className="mt-0" />
            <GrowthAnalyticsPanel className="mt-0" />
            <RecentCareerHistoryPanel className="mt-0" />
            <ComparisonHistoryPanel className="mt-0" />
            <QuizHistoryPanel className="mt-0" />
            <JourneyTimelinePanel className="mt-0" />
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

          {/* Decision Assistant + Notifications — always visible */}
          <div className="panel-stack mt-6">
            <DecisionAssistantPanel
              careerAId=""
              careerBId=""
              enhancedProfile={enhancedProfile}
              className="mt-0"
            />
            <CareerScenarioPanel
              careerAId=""
              className="mt-0"
            />
            <NotificationPanel className="mt-0" />
          </div>
        </>
      ) : (
        /* ─── FALLBACK: show Identity + Execution + Decisions while visibility loads ─── */
        <>
          <SectionHeader label="Identity" description="Who you are as a professional" />
          <div className="panel-stack">
            <CareerIdentityPanel
              enhancedProfileTraits={enhancedProfile?.extended}
              className="mt-0"
            />
          </div>
          <SectionHeader label="Execution" description="Sprints, actions, and mission tracking" />
          <div className="panel-stack">
            <GrowthSummaryCard className="mt-0" />
            <CareerProgressPanel className="mt-0" />
            <AchievementPanel className="mt-0" />
            <ActionSprintPanel className="mt-0" />
            <GoalTrackerPanel className="mt-0" />
            <ActionExecutionPanel className="mt-0" />
          </div>
          <div className="panel-stack mt-6">
            <DecisionAssistantPanel
              careerAId=""
              careerBId=""
              enhancedProfile={enhancedProfile}
              className="mt-0"
            />
            <CareerScenarioPanel
              careerAId=""
              className="mt-0"
            />
            <NotificationPanel className="mt-0" />
          </div>
        </>
      )}
    </section>
  );
}
