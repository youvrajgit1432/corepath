import dynamic from 'next/dynamic';
import React from 'react';

export type RenderStage = 'quiz' | 'result' | 'roadmap' | 'workspace' | 'comparison';

export interface IntelligencePanel {
  id: string;
  title: string;
  priority: number;
  stageVisibility: RenderStage[];
  component: React.ComponentType<any>;
  mobileVisibility: boolean;
  desktopVisibility: boolean;
  dependencies?: string[];
}

/**
 * Central registry for all intelligence-driven UI components.
 * Standardizes how heavy logic blocks are loaded and rendered.
 */
export const INTELLIGENCE_REGISTRY: Record<string, IntelligencePanel> = {
  'confidence-panel': {
    id: 'confidence-panel',
    title: 'Confidence Engine',
    priority: 1,
    stageVisibility: ['result', 'workspace'],
    component: dynamic(() => import('../components/ConfidencePanel'), { 
      loading: () => React.createElement('div', { className: 'h-32 animate-pulse bg-core-surface rounded-3xl' }) 
    }),
    mobileVisibility: true,
    desktopVisibility: true,
  },
  'radar-profile': {
    id: 'radar-profile',
    title: 'Strength Radar',
    priority: 2,
    stageVisibility: ['result'],
    component: dynamic(() => import('../components/ProfileRadarChart'), { ssr: false }),
    mobileVisibility: false,
    desktopVisibility: true,
  },
  'specialization-depth': {
    id: 'specialization-depth',
    title: 'Profile Clarity',
    priority: 2,
    stageVisibility: ['result'],
    component: dynamic(() => import('../components/SpecializationConfidenceChart'), { ssr: false }),
    mobileVisibility: true,
    desktopVisibility: true,
  },
  'intelligence-report': {
    id: 'intelligence-report',
    title: 'Cognitive Report',
    priority: 3,
    stageVisibility: ['result'],
    component: dynamic(() => import('../components/IntelligenceReport')),
    mobileVisibility: true,
    desktopVisibility: true,
  },
  'career-reality': {
    id: 'career-reality',
    title: 'Reality Check',
    priority: 4,
    stageVisibility: ['result', 'roadmap'],
    component: dynamic(() => import('../components/CareerRealityPanel')),
    mobileVisibility: true,
    desktopVisibility: true,
  },
  'skill-gap': {
    id: 'skill-gap',
    title: 'Skill Analysis',
    priority: 5,
    stageVisibility: ['result', 'workspace'],
    component: dynamic(() => import('../components/SkillGapPanel')),
    mobileVisibility: true,
    desktopVisibility: true,
  },
  'project-recommendations': {
    id: 'project-recommendations',
    title: 'Portfolio Builder',
    priority: 6,
    stageVisibility: ['result'],
    component: dynamic(() => import('../components/ProjectRecommendationPanel')),
    mobileVisibility: true,
    desktopVisibility: true,
  },
  'career-workspace': {
    id: 'career-workspace',
    title: 'Active Workspace',
    priority: 7,
    stageVisibility: ['result', 'workspace'],
    component: dynamic(() => import('../components/CareerWorkspacePanel')),
    mobileVisibility: true,
    desktopVisibility: true,
  },
  'daily-missions': {
    id: 'daily-missions',
    title: 'Daily Action',
    priority: 1,
    stageVisibility: ['workspace'],
    component: dynamic(() => import('../components/DailyMissionPanel')),
    mobileVisibility: true,
    desktopVisibility: true,
  }
};

/**
 * Filtered accessors for the registry based on current render stage
 */
export function getPanelsForStage(stage: RenderStage) {
  return Object.values(INTELLIGENCE_REGISTRY)
    .filter(p => p.stageVisibility.includes(stage))
    .sort((a, b) => a.priority - b.priority);
}