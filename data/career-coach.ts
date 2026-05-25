/**
 * CAREER COACH INTELLIGENCE
 *
 * Uses CorePath signals to produce lightweight career coaching advice.
 * No external LLMs, no backend, no auth.
 */

import type { Career } from "./careers";
import type { EnhancedProfile } from "./quiz-enhanced";
import type { SkillGapResult } from "./skill-gap";
import type { ProjectRecommendations } from "./project-recommendations";
import type { JourneyMemory } from "./journey-memory";
import type { CareerWorkspace } from "./career-workspace";
import { loadJourneyMemory } from "./journey-memory";
import { loadCareerWorkspace } from "./career-workspace";

export interface CareerCoach {
  weeklyAdvice: string[];
  focusWarnings: string[];
  progressSignals: string[];
  careerDriftDetection: string;
  motivationInsights: string[];
  prioritySuggestions: string[];
  confidenceTrends: string[];
}

function lastValue(history: number[]): number | null {
  return history.length === 0 ? null : history[history.length - 1];
}

function trendFromHistory(history: number[]): string {
  if (history.length < 2) {
    return "Confidence is still being established from your journey history.";
  }

  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const delta = Math.round((latest - previous) * 100) / 100;

  if (delta > 0) {
    return `Confidence is trending up by ${delta} points since your last quiz.`;
  }
  if (delta < 0) {
    return `Confidence dipped by ${Math.abs(delta)} points since your last quiz.`;
  }

  return "Confidence is holding steady across your most recent sessions.";
}

function buildCareerDrift(memory: JourneyMemory, workspace: CareerWorkspace | null): string {
  const viewedCareerCount = Object.keys(memory.viewedCareers).length;
  const recommendedCareerCount = Object.keys(memory.recommendedCareers).length;
  const activeCareerId = workspace?.selectedCareerId;
  const lastRecommended = memory.lastRecommendedCareer;

  const hasSwitchedCareers = viewedCareerCount >= 3 || recommendedCareerCount >= 3;
  const isDifferentRecommendation = activeCareerId && lastRecommended && activeCareerId !== lastRecommended;

  if (hasSwitchedCareers && isDifferentRecommendation) {
    return "You're switching directions frequently. Pick one direction for this phase to regain momentum.";
  }

  if (workspace && memory.uncertaintyPatterns.repeatQuizSessions > 1) {
    return "Your exploration is active, but too many repeat quizzes may slow decision momentum.";
  }

  return "Your career direction is stable and ready for consistent progress.";
}

function buildMotivationInsights(
  memory: JourneyMemory,
  enhancedProfile?: EnhancedProfile,
  workspace?: CareerWorkspace | null
): string[] {
  const insights: string[] = [];

  if (enhancedProfile) {
    const aiCuriosity = enhancedProfile.extended["AI-curiosity"] ?? 0;
    if (aiCuriosity >= 0.65) {
      insights.push("Your recent behavior suggests rising AI curiosity.");
    }

    if (enhancedProfile.confidence >= 70) {
      insights.push("Your profile shows strong confidence, which can help sustain learning momentum.");
    }
  }

  if (memory.aiInterestSignals.careerViews + memory.aiInterestSignals.compareActions + memory.aiInterestSignals.recommendations >= 4) {
    insights.push("You are actively exploring AI-aware career directions, which is a strong signal for future-focused growth.");
  }

  if (workspace?.completedProjects.length > 0) {
    insights.push("Project momentum is building; keep shipping small wins.");
  }

  if (memory.uncertaintyPatterns.lowConfidenceMatches > 1) {
    insights.push("Your decisions may feel uncertain right now; use smaller experiments to gain clarity.");
  }

  if (insights.length === 0) {
    insights.push("Keep a steady pace and let small weekly wins compound into stronger confidence.");
  }

  return insights;
}

function buildPrioritySuggestions(
  career?: Career,
  workspace?: CareerWorkspace | null,
  skillGap?: SkillGapResult,
  projectRecommendations?: ProjectRecommendations
): string[] {
  const suggestions: string[] = [];

  if (skillGap?.learningPriorities?.length) {
    suggestions.push(`Focus on ${skillGap.learningPriorities.slice(0, 3).join(", ")} first.`);
  }

  if (workspace && workspace.completedMilestones.length === 0) {
    suggestions.push("Complete your first roadmap milestone to build a strong habit.");
  }

  if (projectRecommendations?.beginnerProjects?.length) {
    suggestions.push(`Start with a project like "${projectRecommendations.beginnerProjects[0].title}".`);
  } else if (career) {
    suggestions.push(`Pick a small project that reinforces your current phase in ${career.title}.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Choose one concrete next step and schedule it for this week.");
  }

  return suggestions;
}

function buildWeeklyAdvice(
  workspace: CareerWorkspace | null,
  skillGap?: SkillGapResult,
  memory?: JourneyMemory
): string[] {
  const advice: string[] = [];

  if (!workspace) {
    advice.push("Start by selecting a career path so the coach can track your progress.");
    return advice;
  }

  if (workspace.weeklyProgress.length === 0) {
    advice.push("No progress tracked this week. Add one milestone or project entry to keep your streak alive.");
  } else {
    advice.push("Keep a steady weekly rhythm: a small action every few days beats a single big push.");
  }

  if (skillGap) {
    if (skillGap.gapScore >= 0.7) {
      advice.push("Focus on the biggest missing skills first to reduce your readiness gap quickly.");
    } else if (skillGap.gapScore <= 0.3) {
      advice.push("You are well-positioned. Deepen the skills you already have with a focused project.");
    }
  }

  if (memory && memory.uncertaintyPatterns.repeatQuizSessions > 1) {
    advice.push("Use your next session to narrow down one path instead of comparing too many options.");
  }

  return advice;
}

function buildProgressSignals(workspace: CareerWorkspace | null, memory: JourneyMemory): string[] {
  const signals: string[] = [];

  if (workspace) {
    signals.push(`Current phase: ${workspace.activePhaseName}.`);
    signals.push(`Streak: ${workspace.streak} day${workspace.streak === 1 ? "" : "s"}.`);
    signals.push(`Milestones completed: ${workspace.completedMilestones.length}.`);
    signals.push(`Projects completed: ${workspace.completedProjects.length}.`);
  }

  if (memory.completedQuizzes > 0) {
    signals.push(`Quiz sessions completed: ${memory.completedQuizzes}.`);
  }

  if (memory.aiInterestSignals.careerViews > 0) {
    signals.push(`AI-interest activity: ${memory.aiInterestSignals.careerViews} career views.`);
  }

  return signals.length > 0 ? signals : ["No progress signals are available yet."];
}

export function buildCareerCoach(params: {
  career?: Career;
  enhancedProfile?: EnhancedProfile;
  skillGap?: SkillGapResult;
  projectRecommendations?: ProjectRecommendations;
  journeyMemory?: JourneyMemory;
  workspace?: CareerWorkspace | null;
}): CareerCoach {
  const memory = params.journeyMemory ?? loadJourneyMemory();
  const workspace = params.workspace ?? loadCareerWorkspace();

  const coach: CareerCoach = {
    weeklyAdvice: buildWeeklyAdvice(workspace, params.skillGap, memory),
    focusWarnings: [],
    progressSignals: buildProgressSignals(workspace, memory),
    careerDriftDetection: buildCareerDrift(memory, workspace),
    motivationInsights: buildMotivationInsights(memory, params.enhancedProfile, workspace),
    prioritySuggestions: buildPrioritySuggestions(
      params.career,
      workspace,
      params.skillGap,
      params.projectRecommendations
    ),
    confidenceTrends: [trendFromHistory(memory.confidenceHistory)],
  };

  if (workspace && workspace.weeklyProgress.length === 0) {
    coach.focusWarnings.push("Progress slowed this week. A small habit can keep your momentum going.");
  }

  if (params.enhancedProfile?.extended["AI-curiosity"] >= 0.65) {
    coach.focusWarnings.push("Your recent behavior suggests rising AI curiosity.");
  }

  if (memory.uncertaintyPatterns.repeatQuizSessions > 1) {
    coach.focusWarnings.push("You're exploring many options; try committing to one path for the next few weeks.");
  }

  if (coach.focusWarnings.length === 0) {
    coach.focusWarnings.push("No urgent warning signals. Keep the focus on your next milestone.");
  }

  return coach;
}
