# Changelog

All notable changes to the CorePath project are documented in this file.

## [3.0.0] — 2026-05-25 — Career Intelligence Evolution

### Added

- **Floating Command Center** — New floating expandable assistant panel (`FloatingCommandCenter.tsx`) replaces the inline command center. Features Framer Motion spring animations (scale/opacity/slide), glassmorphism panel (`backdrop-blur-2xl`, `rounded-3xl`), fullscreen/minimize toggle, unread notification badge, and gradient glow floating button with pulse animation.
- **Career Intelligence Engine** — 80+ new data engines powering personalized career intelligence:
  - `career-momentum.ts`, `confidence-engine.ts`, `decision-intelligence.ts`
  - `journey-memory.ts`, `profile-analyzer.ts`, `growth-analytics.ts`
  - `personal-evolution.ts`, `behavior-patterns.ts`, `learning-style.ts`
  - `market-pulse.ts`, `community-signals.ts`, `predictive-insights.ts`
  - `action-execution.ts`, `action-sprints.ts`, `habit-intelligence.ts`
- **Adaptive Roadmaps** — `AdaptiveRoadmapPanel.tsx` with dynamic roadmap computation, `adaptive-roadmap.ts` engine, and stabilization fixes for infinite re-render loops.
- **Career Intelligence Panels** — 60+ new panel components:
  - `CareerCoachPanel`, `CareerMomentumPanel`, `CareerRealityPanel`
  - `CareerScenarioPanel`, `CareerIdentityPanel`, `CareerStoryPanel`
  - `DecisionAssistantPanel`, `DecisionConfidencePanel`, `DecisionPriorityPanel`
  - `FutureSelfPanel`, `GoalTrackerPanel`, `GrowthForecastPanel`
  - `InsightVaultPanel`, `IntelligenceSynthesisPanel`, `MemoryEvolutionPanel`
  - `PersonalInsightsPanel`, `ProfileAnalyzerPanel`, `SkillGapPanel`
- **Admin Dashboard** — New `/admin` routes: accessibility viewer, debug dashboard, insights management.
- **Journey Replay** — `JourneyReplayPanel`, `JourneyReplaySummaryCard`, `journey-replay.ts` for visualizing user career path history.
- **Comparison & Evolution** — Career comparison (`CompareAnalytics`, `ComparisonHistoryPanel`), evolution tracking (`EvolutionInsights`, `RecommendationEvolutionPanel`).
- **Daily Missions & Sprint Planning** — `DailyMissionPanel`, `ActionSprintPanel`, `MissionIntelligencePanel`.
- **Weekly Reflection** — `WeeklyReflectionPanel`, `ProgressReflectionPanel`.
- **SEO Infrastructure** — `robots.ts`, `sitemap.ts`, `JsonLd.tsx`, `seo-content.ts`.
- **Testing Suite** — 152 unit tests across 10 test files using Vitest, comprehensive test coverage for core data engines.
- **E2E Testing** — Playwright configuration for end-to-end testing.
- **`safe-context.ts` & `safe-storage.ts`** — SSR-safe utilities for context and storage access.

### Improved

- **Career Workspace** — Complete redesign with `CareerWorkspacePanel` consolidation, workspace state persistence, phase progress tracking, and achievement integration.
- **Profile Radar Chart** — New `ProfileRadarChart` component for visual skill assessment.
- **Specialization Confidence** — `SpecializationConfidenceChart` for career path confidence visualization.
- **Notification System** — Enhanced `NotificationBell` and `NotificationPanel` with badge tracking and unread state management.
- **Quiz System** — Branching quiz logic (`quiz-branching.ts`), enhanced quiz engine, quiz history tracking, resume center.
- **UI Polish** — Glassmorphism design language applied across panels, consistent `border-white/[0.08]` borders, `backdrop-blur-2xl` surfaces, and subtle gradient accents.

### Fixed

- **Stack Overflow (Maximum Update Depth)** — Fixed infinite re-render loop in `AdaptiveRoadmapPanel.tsx` caused by destructured default `userSkills = []` creating new array references on every render. Stabilized defaults with `useMemo`.
- **Recursive Dependency Cycles** — Broken circular references between intelligence modules by extracting shared types and utilities into `index.ts`.
- **Hydration Mismatches** — Fixed SSR/client mismatches in components using browser-only APIs by wrapping with SSR-safe wrappers and `useEffect`-based mounting guards.
- **Null Propagation** — Added defensive null checks across all data engines and panel components (`career?.id`, `roadmap?.steps ?? []`, etc.).
- **SSR Inconsistencies** — Client component boundaries properly marked with `"use client"`, server components use async data fetching for static generation.
- **Floating Command Center Syntax** — Fixed trailing backslash syntax error in `FloatingCommandCenter.tsx` className template literal.

### Architecture

- **Intelligence Pipeline Layer** — 80+ engines in `data/` organized as a modular intelligence pipeline with `pipeline.ts` orchestrating cross-engine analysis.
- **Shared Context** — `shared-context.ts` provides centralized state management across panels, eliminating prop drilling.
- **Panel Composition** — Consistent component pattern: each panel is a self-contained client component with its own data engine, consuming shared context.
- **Server/Client Split** — Pages are async server components with data fetching; interactive panels are client components consuming server-passed data.
- **Type Safety** — TypeScript 6.0.3 with strict mode, comprehensive type definitions across all modules.

### Performance

- **Static Generation** — 172 pages statically generated at build time for instant loading.
- **Build Time** — Full production build completes in ~20s for 172 pages.
- **TypeScript Compilation** — Type-check completes in ~15s.
- **Dependency Optimization** — Minimal dependency tree: `next`, `react`, `framer-motion`, `tailwindcss`, `typescript`.
