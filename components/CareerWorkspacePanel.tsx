/**
 * CAREER WORKSPACE PANEL
 *
 * Display ongoing career progress:
 * - Current path & phase
 * - Progress bar
 * - Current milestone
 * - Recommended next action
 * - Projects completed
 * - Weekly streak
 * - Career readiness
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Career } from "../data/careers";
import { getCareerById } from "../data/careers";
import {
  loadCareerWorkspace,
  selectCareer,
  getNextRecommendedAction,
  getStreakInfo,
  getWeeklyProgress,
  type CareerWorkspace,
} from "../data/career-workspace";
import { analyzeSkillGap } from "../data/skill-gap";
import { roadmaps } from "../data/roadmaps";
import { recordTimelineEvent } from "../data/journey-timeline";
import CareerCoachPanel from "./CareerCoachPanel";
import ProfileAnalyzerPanel from "./ProfileAnalyzerPanel";
import PathExamplesPanel from "./PathExamplesPanel";
import MarketPulsePanel from "./MarketPulsePanel";
import CommunitySignalsPanel from "./CommunitySignalsPanel";
import CareerProgressPanel from "./CareerProgressPanel";
import AchievementPanel from "./AchievementPanel";
import DailyMissionPanel from "./DailyMissionPanel";
import WeeklyReflectionPanel from "./WeeklyReflectionPanel";
import GoalTrackerPanel from "./GoalTrackerPanel";
import AdaptiveRoadmapPanel from "./AdaptiveRoadmapPanel";
import ActionSprintPanel from "./ActionSprintPanel";
import EngagementPulsePanel from "./EngagementPulsePanel";

interface Props {
  career?: Career;
  showCareersLink?: boolean;
}

export default function CareerWorkspacePanel({ career, showCareersLink = true }: Props) {
  const [workspace, setWorkspace] = useState<CareerWorkspace | null>(null);
  const [nextAction, setNextAction] = useState<string>("");
  const [streak, setStreak] = useState<{ streak: number; lastDate: string }>({ streak: 0, lastDate: "" });

  useEffect(() => {
    const loaded = loadCareerWorkspace();
    let activeWorkspace = loaded;

    if (!loaded && career) {
      activeWorkspace = selectCareer(career);
    }

    setWorkspace(activeWorkspace);
    setNextAction(getNextRecommendedAction(career));
    setStreak(getStreakInfo());
  }, [career]);

  // Compute roadmap before early return so hooks execute unconditionally
  const roadmap = roadmaps.find((r) => r.careerId === workspace?.selectedCareerId);
  const adaptiveSteps = useMemo(() => roadmap?.steps ?? [], [roadmap?.steps]);

  if (!workspace) {
    return (
      <section className="rounded-card border border-core-border bg-core-surface p-4 sm:p-6 min-w-0">
        <p className="text-sm font-semibold text-core-heading mb-3">Career Execution Workspace</p>
        <p className="text-sm text-core-muted mb-4">
          Select a career to start tracking your progress toward your goal.
        </p>
        {career ? (
          <button
            type="button"
            onClick={() => {
              const created = selectCareer(career);
              setWorkspace(created);
              setNextAction(getNextRecommendedAction(career));
              setStreak(getStreakInfo());
              recordTimelineEvent({
                type: "workspace_started",
                timestamp: new Date().toISOString(),
                title: `Started workspace for ${career.title}`,
                icon: "🚀",
                description: "Began tracking career progress",
                metadata: { careerId: career.id },
              });
            }}
            className="inline-flex items-center rounded-full bg-core-accent px-4 py-2 text-sm font-medium text-white hover:bg-core-accent/90 transition"
          >
            Start tracking this career
          </button>
        ) : null}
        {showCareersLink && (
          <Link href="/careers" className="inline-flex items-center text-core-accent hover:underline text-sm gap-2 mt-4 block">
            Explore Careers →
          </Link>
        )}
      </section>
    );
  }

  const activeCareer = career ?? getCareerById(workspace.selectedCareerId);
  const totalPhases = roadmap?.steps.length || 1;
  const phaseProgress = (workspace.activePhaseNumber / totalPhases) * 100;

  // Get current phase details
  const currentPhase = roadmap?.steps.find((s) => s.phase === workspace.activePhaseNumber);
  const nextPhase = roadmap?.steps.find((s) => s.phase === workspace.activePhaseNumber + 1);

  const skillsInCurrentPhase = currentPhase?.skills || [];
  const weeklyProgress = getWeeklyProgress();

  return (
    <section className="rounded-card border border-core-border bg-core-surface p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-core-muted mb-1">Career Path</p>
          <h3 className="text-lg font-semibold text-core-heading">{workspace.selectedCareerTitle}</h3>
        </div>
        {showCareersLink && (
          <Link
            href={`/careers/${workspace.selectedCareerId}`}
            className="text-xs text-core-accent hover:underline"
          >
            View Details →
          </Link>
        )}
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mb-6">
        {/* Phase Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-core-muted">
              Phase Progress: {workspace.activePhaseNumber}/{totalPhases}
            </span>
            <span className="text-xs font-semibold text-core-accent">{Math.round(phaseProgress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-core-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-core-accent to-core-accent/70 transition-all duration-300"
              style={{ width: `${phaseProgress}%` }}
            />
          </div>
        </div>

        {/* Readiness Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-core-muted">Career Readiness</span>
            <span className="text-xs font-semibold text-core-accent">
              {workspace.estimatedReadiness}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-core-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500/70 to-green-500/50 transition-all duration-300"
              style={{ width: `${workspace.estimatedReadiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Milestone */}
      {currentPhase && (
        <div className="mb-6 p-4 rounded-lg bg-core-bg/40 border border-core-border/50">
          <p className="text-xs uppercase tracking-wider text-core-muted mb-1">Current Phase</p>
          <p className="text-sm font-semibold text-core-heading">{workspace.activePhaseName}</p>
          <p className="text-xs text-core-muted mt-1">{currentPhase.milestone}</p>
          <p className="text-xs text-core-muted mt-2">{currentPhase.description}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {skillsInCurrentPhase.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="inline-flex px-2 py-1 rounded-full bg-core-accent/10 text-xs text-core-accent"
              >
                {skill}
              </span>
            ))}
            {skillsInCurrentPhase.length > 4 && (
              <span className="inline-flex px-2 py-1 rounded-full bg-core-border text-xs text-core-muted">
                +{skillsInCurrentPhase.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recommended Next Action */}
      <div className="mb-6 p-4 rounded-lg bg-core-accent/5 border border-core-accent/20">
        <p className="text-xs uppercase tracking-wider text-core-accent mb-1">Next Action</p>
        <p className="text-sm text-core-heading">{nextAction}</p>
      </div>

      {/* Weekly Progress */}
      <div className="mb-6 p-4 rounded-lg bg-core-bg/40 border border-core-border/50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-core-muted">Weekly Progress</p>
          <p className="text-xs font-semibold text-core-accent">{weeklyProgress.length} entries</p>
        </div>
        {weeklyProgress.length ? (
          <ul className="space-y-2 text-sm text-core-muted">
            {weeklyProgress.slice(-3).reverse().map((entry) => (
              <li key={entry.date} className="flex items-center justify-between gap-3">
                <span>{entry.action}</span>
                <span className="text-xs text-core-accent">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-core-muted">No progress tracked this week. Complete a milestone or project to build your streak.</p>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        {/* Projects Completed */}
        <div className="p-3 rounded-lg bg-core-bg/40 border border-core-border/50">
          <p className="text-2xl font-bold text-core-accent">{workspace.completedProjects.length}</p>
          <p className="text-xs text-core-muted mt-1">Projects</p>
        </div>

        {/* Weekly Streak */}
        <div className="p-3 rounded-lg bg-core-bg/40 border border-core-border/50">
          <p className="text-2xl font-bold text-core-accent">{streak.streak}</p>
          <p className="text-xs text-core-muted mt-1">Day Streak 🔥</p>
        </div>

        {/* Milestones Completed */}
        <div className="p-3 rounded-lg bg-core-bg/40 border border-core-border/50">
          <p className="text-2xl font-bold text-core-accent">{workspace.completedMilestones.length}</p>
          <p className="text-xs text-core-muted mt-1">Milestones</p>
        </div>
      </div>

      <AdaptiveRoadmapPanel
        steps={adaptiveSteps}
        career={activeCareer}
        className="mt-6"
      />

      <CareerProgressPanel className="mt-6" />

      <AchievementPanel className="mt-6" />

      <DailyMissionPanel className="mt-6" />

      <WeeklyReflectionPanel className="mt-6" />

      <GoalTrackerPanel className="mt-6" />

      <ActionSprintPanel className="mt-6" />

      <EngagementPulsePanel className="mt-6" />

      <div className="mt-6 space-y-6">
        <MarketPulsePanel career={activeCareer} />
        <PathExamplesPanel career={activeCareer} skillGap={activeCareer ? analyzeSkillGap(activeCareer, []) : undefined} />
        <CommunitySignalsPanel career={activeCareer} />
        <ProfileAnalyzerPanel career={activeCareer} skillGap={activeCareer ? analyzeSkillGap(activeCareer, []) : undefined} />
        <CareerCoachPanel career={career} />
      </div>

      {/* Next Phase CTA (if available) */}
      {nextPhase && workspace.completedMilestones.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-core-border/30 border border-core-border">
          <p className="text-xs font-medium text-core-accent mb-2">🎯 Ready to advance?</p>
          <p className="text-sm text-core-heading mb-3">Next phase: "{nextPhase.title}"</p>
          <p className="text-xs text-core-muted">{nextPhase.description}</p>
        </div>
      )}
    </section>
  );
}
