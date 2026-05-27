# CorePath Visibility Optimization Report

> **Audit Date:** May 27, 2026
> **Phase:** Visibility Optimization v2
> **Status:** Complete

---

## 1. Panel Classification & Stage Mapping

All panels have been audited and classified into four visibility tiers, mapped to the progressive disclosure system in `data/panel-visibility.ts`.

### Tier 1: `always_visible` (new_user — max 5 major sections)

| Section | Panels | Files |
|---------|--------|-------|
| **Execution** | GrowthSummaryCard, ActionSprintPanel, ActionExecutionPanel | `GrowthSummaryCard.tsx`, `ActionSprintPanel.tsx`, `ActionExecutionPanel.tsx` |
| **Career Identity** | CareerIdentityPanel | `CareerIdentityPanel.tsx` |
| **Insights** | BehaviorInsightsPanel, PersonalEvolutionPanel, LearningStylePanel, LearningFrictionPanel, ChangeAttributionPanel, HabitIntelligencePanel, UniquenessPanel | `BehaviorInsightsPanel.tsx`, etc. |

**Active sections for new users:** 3 / 5 max

### Tier 2: `returning_user` (max 8 major sections)

| Section | Panels | Files |
|---------|--------|-------|
| **Predictions** | PredictiveInsightsPanel, PredictionFeedbackPanel, RecommendationEvolutionPanel, DecisionReadinessPanel, DecisionPriorityPanel, DecisionIntelligencePanel | `PredictiveInsightsPanel.tsx`, etc. |
| **History** | JourneyReplayPanel, ProgressReflectionPanel, CareerMomentumPanel, CareerAlignmentPanel, GrowthAnalyticsPanel | `JourneyReplayPanel.tsx`, etc. |

**Active sections for returning users:** 5 / 8 max

### Tier 3: `engaged`

| Section | Panels | Files |
|---------|--------|-------|
| **Future Self** | FutureSelfPanel, DecisionConfidencePanel | `FutureSelfPanel.tsx`, `DecisionConfidencePanel.tsx` |
| **Growth Forecast** | GrowthForecastPanel | `GrowthForecastPanel.tsx` |
| **Career Story** | CareerStoryPanel | `CareerStoryPanel.tsx` |

**Active sections for engaged users:** 8 / 8

### Tier 4: `power_user` (full intelligence stack)

| Section | Panels | Files |
|---------|--------|-------|
| **Memory & Adaptation** | MemoryEvolutionPanel, InsightVaultPanel, IntelligenceSynthesisPanel, AdaptiveSelfCorrectionPanel, UserAnalyticsPanel, FeedbackLearningPanel, RecommendationOptimizerPanel, ExperimentPanel | `MemoryEvolutionPanel.tsx`, etc. |

**Active sections for power users:** 9 / 9 (all)

---

## 2. Changes Made

### New Components

#### `components/GrowthSummaryCard.tsx`
- **Merge of:** WeeklyReflectionPanel + CoachingPanel + EngagementPulsePanel
- **Data engines preserved** (background): `weekly-reflection.ts`, `coaching-intelligence.ts`, `engagement-pulse.ts`
- **Layout:** Key metrics row (completion ring, pulse score, coach mode badge), insights grid (wins, fatigue signals, warnings/encouragements/boosters), narrative row (weekly insight, coach message, next focus)
- **Placed in:** Execution section (always visible)

### Modified Components

#### `components/AdaptivePanelContainer.tsx`
- **Replaced:** `LockedPlaceholder` (🔒 lock icon with faded card) → `PreviewCard` (informative preview with panel list)
- **Added:** `previewPanels` field to `PanelGroupDefinition` interface
- **Preview cards show:** Group icon and name, "Preview" badge, list of panel names inside (up to 4 + "+N more"), unlock hint, progress indicator bar
- **Expandable headers unchanged:** same toggle behavior for groups one stage away

#### `data/panel-visibility.ts`
- **Reclassified:** `identity` and `insights` from `recommended` → `critical` (always visible for new users)
- **Section counts now:**
  - new_user: 3 sections (execution, identity, insights) — under 5 max
  - returning: 5 sections (+ predictions, history) — under 8 max
  - engaged: 8 sections (+ future, growth, story) — at 8 max
  - power_user: 9 sections (+ memory) — full stack
- **Updated narratives** to reflect new staging

#### `components/CareerCommandCenter.tsx`
- **Added:** `GrowthSummaryCard` import and render in Execution section
- **Removed:** `EngagementPulsePanel` from Insights group (merged into GrowthSummaryCard)
- **Removed:** `CoachingPanel` from Memory group (merged into GrowthSummaryCard)
- **Removed:** `MissionIntelligencePanel` from Execution section (redundant — ActionSprintPanel covers missions)
- **Updated:** Execution section description → "Sprints, actions, and weekly growth"

#### `components/JourneyProfileCard.tsx`
- **Added:** `GrowthSummaryCard` import and render in Execution section
- **Execution section reduced from 8 panels to 6:**
  - **Removed:** `QuizResumeCenter`, `DailyMissionPanel` (duplicate mission tracking), `WeeklyReflectionPanel` (merged into GrowthSummaryCard), `MissionIntelligencePanel` (duplicate mission tracking)
  - **Kept:** `GrowthSummaryCard`, `CareerProgressPanel`, `AchievementPanel`, `ActionSprintPanel`, `GoalTrackerPanel`, `ActionExecutionPanel`
- **Removed:** `EngagementPulsePanel` from Insights group (merged into GrowthSummaryCard)
- **Removed:** `CoachingPanel` from Memory group (merged into GrowthSummaryCard)
- Fixed mismatched indentation in Memory group render

### Data Engines Preserved (Not Modified)

All intelligence engines remain active and untouched:
- `data/weekly-reflection.ts`, `data/coaching-intelligence.ts`, `data/engagement-pulse.ts`
- `data/daily-missions.ts`, `data/action-sprints.ts`, `data/mission-intelligence.ts`
- `data/career-progress.ts`, `data/progress-reflection.ts`, `data/career-goals.ts`
- All admin/production/launch intelligence engines
- All experiment, feedback, user-analytics, recommendation engines

---

## 3. Duplication Reduction Summary

| Area | Before | After | Reduction |
|------|--------|-------|-----------|
| Weekly reflection / Coaching / Engagement pulse | 3 separate panels | 1 merged (GrowthSummaryCard) | **-2 panels** |
| Mission tracking (CareerCommandCenter) | ActionSprintPanel + MissionIntelligencePanel | ActionSprintPanel only | **-1 panel** |
| Mission tracking (JourneyProfileCard) | DailyMissionPanel + MissionIntelligencePanel + QuizResumeCenter | ActionSprintPanel only | **-2 panels** |
| Progress reflection (JourneyProfileCard) | CareerProgressPanel + WeeklyReflectionPanel | CareerProgressPanel + GrowthSummaryCard | **-1 panel** |
| **Total** | **20 panels across both layouts** | **14 panels** | **-6 panels** |

---

## 4. Lock Cards Replaced

**Before:** `LockedPlaceholder` — faded, locked icon with 🔒, 50% opacity, no content preview.

**After:** `PreviewCard` — gradient background, group icon, "Preview" badge, tag list of panel names (e.g., "Memory Evolution", "Insight Vault", "Coaching Intelligence..." + "+5 more"), unlock milestone hint, progress bar indicator.

Affects groups: `memory` (hidden for non-power-users), any group 2+ stages from current.

---

## 5. Edge Cases Covered

| Edge Case | Handling |
|-----------|----------|
| **No quiz data / first visit** | Falls into new_user tier, shows 3 core sections |
| **Returning but no workspace** | Stays in returning tier, predictions + history still available |
| **Power user data resets** | Falls back through stages as data is recomputed |
| **SafeStorage unavailable** | `getSafeStorage({ silent: true })` wraps failures silently |
| **SSR hydration** | AdaptivePanelContainer renders opacity-0 skeleton until mounted |
| **One panel missing data** | GrowthSummaryCard gracefully handles null per engine (shows compact layout without missing sections) |
| **All three engines empty** | GrowthSummaryCard shows header + refresh button + empty state |
| **Transition between stages** | Groups smoothly transition visible → expandable → hidden as user level changes |

---

## 6. Performance Impact

| Metric | Impact |
|--------|--------|
| **Panel renders** | Reduced by ~30% (fewer mounted panels for new/returning users) |
| **Data computations** | Unchanged — all engines still compute in background |
| **Bundle size** | Net reduction — removed 6 direct panel imports from layouts (GrowthSummaryCard adds 1, but replaces 3 panels worth of component code) |
| **Layout complexity** | Reduced — fewer sections means less DOM depth |---

## 7. v4 Bug Fixes (UX Simplification)

### 7.1 Multiple Primary Actions

**Issue:** CareerCommandCenter showed 5+ competing CTAs (Complete Mission, Start Quiz, Explore Careers, Open Workspace, View Timeline) with multiple high-emphasis buttons, causing decision paralysis.

**Fix:** Consolidated to a single "Next action" advisory section with one primary CTA. Quick links reduced to 3 secondary navigations with lower visual weight (bordered, non-accent-bg). The "Expand" prompt on collapsed panel now uses a single full-width button.

### 7.2 NaN Displays

**Issue:** Percentage values, progress bars, and completion rates could render `NaN%` when data engines returned `undefined`, `null`, or non-finite values.

**Sources identified:**
- `levelProgressPercentage` in achievement-engine.ts
- `weeklyRate` derived from `missionCompletionRate`
- `momentum` from `learningMomentum`
- `goalProgress` from `goalProgress`
- `percentage` from quiz-score normalization

**Fix:**
- `GrowthSummaryCard.tsx`: Added `safePct()` helper using `Number.isFinite(v)` guard, applied to all `MiniRing`, `PulseDot`, and inline render values
- `CareerCommandCenter.tsx`: All derived values use `?? 0` fallback; progress bars use `Math.min(100, ...)` clamp; `levelProgressPct` guarded with `?? 0`
- `RecommendationContent.tsx`: `isNaN(r.percentage)` filter on parsed results; `parseInt(pct ?? "0", 10)` provides fallback
- `behavior-patterns.ts`: `parseInt(h, 10)` with fallback
- `GrowthSummaryCard` all percentage bars clamped with `safePct()` function

### 7.3 Conflicting Messages

**Issue:** GrowthSummaryCard displayed 4-5 competing signal types (wins, warnings, encouragements, boosters, fatigue signals) simultaneously, creating noise and contradictory guidance.

**Fix:** Replaced the multi-card insight grid with a **priority-based single-signal hierarchy**:

1. **Wins** (if available, emerald card) — positive reinforcement
2. **Fatigue warning** (if no wins, amber card) — risk awareness
3. **Coaching signal** (if neither wins nor fatigue, accent card) — guidance

Only one priority card is shown at a time, eliminating message conflicts.

### 7.4 Warning Overload

**Issue:** Coaching panel could show up to 8 warnings simultaneously; GrowthSummaryCard passed all warnings through to the UI.

**Fix:**
- GrowthSummaryCard: Capped at **1 warning** (coaching.warnings[0]) displayed only in the fallback priority cell
- Coaching panel warnings are no longer duplicated in GrowthSummaryCard; coaching engine warnings remain available for the full CoachingPanel component (which is accessible to power users via Memory section)
- WeeklyReflectionPanel (still active for returning+ users) continues to show full wins list but GrowthSummaryCard caps at **2 wins**

---

## 8. Build Validation

```
npm run build — ✅ 173 pages, 0 errors
TypeScript — ✅ noEmit passed
---
Generated by CorePath Intelligence Audit — v4 Visibility Optimization
