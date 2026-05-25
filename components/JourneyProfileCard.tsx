"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import DailyMissionPanel from "./DailyMissionPanel";
import WeeklyReflectionPanel from "./WeeklyReflectionPanel";
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

type Props = {
  event?: JourneyEvent;
  enhancedProfile?: EnhancedProfile;
  className?: string;
};

export default function JourneyProfileCard({ event, enhancedProfile, className = "" }: Props) {
  const [profile, setProfile] = useState<JourneyProfile | null>(null);
  const [journey, setJourney] = useState(loadJourneyMemory());
  const lastEventRef = useRef<string | null>(null);

  // ── Listen for scroll-to-attribution signal ──
  const scrollToAttribution = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as { source?: string; cause?: string } | undefined;
    if (detail?.source) {
      // Try to find a matching section by source name
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
  }, [event, enhancedProfile]);

  if (!profile) {
    return null;
  }

  const radarPoints = enhancedProfile
    ? Object.entries(enhancedProfile.extended)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value]) => ({ label, value }))
    : [];

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Your evolving profile</p>
        <h2 className="mt-2 text-2xl font-display text-core-heading">What your journey is showing</h2>
      </div>

      {enhancedProfile ? (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] mb-6">
          <ProfileRadarChart points={radarPoints} />
          <SpecializationConfidenceChart
            confidence={enhancedProfile.confidence}
            specializationDepth={enhancedProfile.specializationDepth}
          />
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-sm font-semibold text-core-heading">Your history</p>
          <ul className="space-y-3 text-sm text-core-muted">
            {profile.careerInterestProfile.map((item, index) => (
              <li key={`interest-${index}`} className="flex items-start gap-3">
                <span className="mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-sm font-semibold text-core-heading">What changed</p>
          <ul className="space-y-3 text-sm text-core-muted">
            {profile.recentChanges.length > 0 ? (
              profile.recentChanges.map((item, index) => (
                <li key={`changed-${index}`} className="flex items-start gap-3">
                  <span className="mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-3">
                <span className="mt-1">•</span>
                <span>We're tracking your profile across sessions.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Sessions tracked</p>
          <p className="mt-3 text-3xl font-semibold text-core-heading">{profile.sessions}</p>
        </div>
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Favorite themes</p>
          <p className="mt-3 text-sm text-core-text">{profile.topThemes.join(", ")}</p>
        </div>
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Strong categories</p>
          <p className="mt-3 text-sm text-core-text">{profile.favoriteCategories.join(", ")}</p>
        </div>
      </div>

      <ConfidencePanel journey={journey} profile={enhancedProfile} layout="compact" className="mt-6" />

      <QuizResumeCenter className="mt-8 pt-8 border-t border-core-border" />

      <CareerProgressPanel className="mt-6" />

      <AchievementPanel className="mt-6" />

      <DailyMissionPanel className="mt-6" />

      <WeeklyReflectionPanel className="mt-6" />

      <GoalTrackerPanel className="mt-6" />

      <GrowthAnalyticsPanel className="mt-6" />

      <CareerIdentityPanel
        enhancedProfileTraits={enhancedProfile?.extended}
        className="mt-6"
      />

      <JourneyReplaySummaryCard className="mt-6" />

      <JourneyReplayPanel className="mt-6" />

      <DecisionAssistantPanel
        careerAId=""
        careerBId=""
        enhancedProfile={enhancedProfile}
        className="mt-6"
      />

      <BehaviorInsightsPanel className="mt-6" />

      <PredictiveInsightsPanel className="mt-6" />

      <RecommendationEvolutionPanel className="mt-6" />

      <CareerScenarioPanel
        careerAId=""
        className="mt-6"
      />

      <DecisionReadinessPanel className="mt-6" />

      <EngagementPulsePanel className="mt-6" />

      <DecisionPriorityPanel className="mt-6" />

      <PersonalEvolutionPanel className="mt-6" />

      <LearningStylePanel className="mt-6" />

      <LearningFrictionPanel className="mt-6" />

      <ChangeAttributionPanel className="mt-6" />

      <HabitIntelligencePanel className="mt-6" />

      <UniquenessPanel className="mt-6" />

      <FutureSelfPanel className="mt-6" />

      <DecisionConfidencePanel className="mt-6" />

      <MissionIntelligencePanel className="mt-6" />

      <CareerMomentumPanel className="mt-6" />

      <CareerAlignmentPanel className="mt-6" />

      <CareerStoryPanel className="mt-6" />

      <ProgressReflectionPanel className="mt-6" />

      <InsightVaultPanel className="mt-6" />

      <CoachingPanel className="mt-6" />

      <DecisionIntelligencePanel className="mt-6" />

      <GrowthForecastPanel className="mt-6" />

      <IntelligenceSynthesisPanel className="mt-6" />

      <ActionExecutionPanel className="mt-6" />

      <MemoryEvolutionPanel className="mt-6" />

      <AdaptiveSelfCorrectionPanel className="mt-6" />

      <NotificationPanel className="mt-6" />

      <ComparisonHistoryPanel className="mt-8 pt-8 border-t border-core-border" />

      <QuizHistoryPanel className="mt-6" />

      <RecentCareerHistoryPanel className="mt-6" />

      <JourneyTimelinePanel className="mt-6" />
    </section>
  );
}
