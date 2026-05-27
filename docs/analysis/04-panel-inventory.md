# Panel Inventory

> Generated: May 27, 2026
> Project: CorePath

---

## 1. Panel Count Summary

| Category | Count |
|---|---|
| Direct page panels | ~15 (home page) |
| JourneyProfileCard sub-panels | 43 |
| CareerCommandCenter sub-panels | 32 |
| CareerWorkspace sub-panels | 14 |
| Quiz sub-components | 6 |
| Layout/wrapper components | 5 |
| **Total panel components** | **~91** |

---

## 2. Comprehensive Panel Analysis

### A. CareerCommandCenter

| Property | Value |
|---|---|
| **Purpose** | Central intelligence dashboard — mission tracking, achievements, predictions, memory, history |
| **File** | `components/CareerCommandCenter.tsx` (~890 lines) |
| **Data sources** | `career-workspace`, `career-goals`, `daily-missions`, `weekly-reflection`, `achievement-engine`, `career-progress`, `notification-engine`, `journey-memory` |
| **Inputs** | `defaultExpanded?: boolean` |
| **Outputs** | Render + localStorage (`corepath-command-center-expanded`) |
| **Position** | Home page (via FloatingCommandCenter) + standalone |
| **Dependencies** | 32 imported panels, 7 useEffect calls, 1 interval (60s refresh) |
| **Risk** | HIGH — 7 useEffects, all panels render eagerly on expand, 6 independent data loads |

**Sub-panel breakdown:**
| Section | Panels | Count |
|---|---|---|
| Dashboard cards | Missions, Level/XP, Weekly Sprint, Goal Progress, Momentum, Notifications | 6 |
| Identity | CareerIdentityPanel | 1 |
| Insights | BehaviorInsights, PersonalEvolution, LearningStyle, LearningFriction, ChangeAttribution, HabitIntelligence, Uniqueness, FutureSelf, DecisionConfidence, EngagementPulse | 10 |
| Predictions | PredictiveInsights, PredictionFeedback, RecommendationEvolution, DecisionReadiness, DecisionPriority, DecisionIntelligence, GrowthForecast | 7 |
| Execution | ActionSprint, ActionExecution, MissionIntelligence | 3 |
| Memory | MemoryEvolution, InsightVault, Coaching, IntelligenceSynthesis, AdaptiveSelfCorrection | 5 |
| History | JourneyReplay, ProgressReflection, CareerStory, CareerMomentum, CareerAlignment, GrowthAnalytics | 6 |

**Actions provided:**
- Complete mission button
- Export (3 formats)
- Collapse dashboard
- Quick actions: Continue workspace, Resume quiz, View timeline, Open comparison, Open planner
- Next action CTA with dynamic href

---

### B. JourneyProfileCard

| Property | Value |
|---|---|
| **Purpose** | User journey summary — identity, insights, predictions, execution, memory, history |
| **File** | `components/JourneyProfileCard.tsx` (~480 lines) |
| **Data sources** | `journey-memory`, `quiz-enhanced` |
| **Inputs** | `event?: JourneyEvent`, `enhancedProfile?: EnhancedProfile` |
| **Outputs** | Renders 43 sub-panels, export files |
| **Position** | Recommendation page, embedded in user profile section |
| **Dependencies** | 43 imported panels, 3 useEffect, 1 useMemo |
| **Risk** | HIGH — renders 43 panels simultaneously, no virtualization |

**Sub-panel breakdown:**
| Section | Panels | Count |
|---|---|---|
| Header + Charts | ProfileRadarChart, SpecializationConfidenceChart, ConfidencePanel | 3 |
| Identity | CareerIdentityPanel | 1 |
| Insights | BehaviorInsights, PersonalEvolution, LearningStyle, LearningFriction, ChangeAttribution, HabitIntelligence, Uniqueness, FutureSelf, DecisionConfidence, EngagementPulse | 10 |
| Predictions | PredictiveInsights, RecommendationEvolution, DecisionReadiness, DecisionPriority, DecisionIntelligence, GrowthForecast | 6 |
| Execution | QuizResumeCenter, CareerProgress, Achievement, DailyMission, WeeklyReflection, GoalTracker, ActionExecution, MissionIntelligence | 8 |
| Memory | MemoryEvolution, InsightVault, Coaching, IntelligenceSynthesis, AdaptiveSelfCorrection | 5 |
| History | JourneyReplaySummaryCard, JourneyReplay, ProgressReflection, CareerStory, CareerMomentum, CareerAlignment, GrowthAnalytics, RecentCareerHistory, ComparisonHistory, QuizHistory, JourneyTimeline | 11 |
| Extras | DecisionAssistant, CareerScenario, NotificationPanel | 3 |

**Key difference from CareerCommandCenter:** Includes QuizResumeCenter, JourneyReplaySummaryCard, NotificationPanel, RecentCareerHistory, ComparisonHistory, QuizHistory, JourneyTimeline — more history-focused.

---

### C. CareerWorkspacePanel

| Property | Value |
|---|---|
| **Purpose** | Career tracking workspace — phase progress, streak, milestones, weekly progress |
| **File** | `components/CareerWorkspacePanel.tsx` (~350 lines) |
| **Data sources** | `career-workspace`, `careers`, `skill-gap`, `roadmaps`, `journey-timeline` |
| **Inputs** | `career?: Career`, `showCareersLink?: boolean` |
| **Outputs** | Phase progress, readiness, next action, weekly entries |
| **Position** | Career detail page, recommendation page |
| **Dependencies** | 14 imported panels, 1 useEffect, 1 useMemo |
| **Sub-panels:** | AdaptiveRoadmap, CareerProgress, Achievement, DailyMission, WeeklyReflection, GoalTracker, ActionSprint, EngagementPulse, MarketPulse, PathExamples, CommunitySignals, ProfileAnalyzer, CareerCoach |
| **Risk** | MED — 14 panels stacked, no collapsing |

---

### D. JourneyTimelinePanel

| Property | Value |
|---|---|
| **Purpose** | Chronological activity timeline with event type icons |
| **File** | `components/JourneyTimelinePanel.tsx` (~200 lines) |
| **Data sources** | `journey-timeline` |
| **Inputs** | `className?: string` |
| **Outputs** | Timeline groups (today, last week, earlier), expandable periods |
| **Position** | Home page, JourneyProfileCard's History section |
| **Dependencies** | JourneyActionPanel (1 imported), 1 useEffect |
| **Actions on events** | Action Href links for each timeline event |
| **Risk** | LOW — well-contained, returns `null` when empty |

---

### E. QuizShell

| Property | Value |
|---|---|
| **Purpose** | Full quiz flow — questions, answers, resume, result display |
| **File** | `components/quiz/QuizShell.tsx` (~380 lines) |
| **Data sources** | `quiz`, `quiz-enhanced`, `quiz-session`, `quiz-history`, `journey-memory`, `career-matching` |
| **Inputs** | None (self-contained) |
| **Outputs** | Quiz results → localStorage → recommendation page navigation |
| **Sub-components** | QuestionCard, AnswerCard, NavigationRow, ProgressBar, ResultScreen |
| **Risk** | MED — handles resume modal, branching, session persistence, results calculation |

---

### F. Intelligence Panels (Standard Pattern)

Each intelligence panel follows a consistent pattern:
1. `"use client"` directive
2. Import respective data engine from `data/`
3. `useEffect` + `useState` pattern to load data on mount
4. Render loading state (skeleton) or data display
5. Accept `className?: string` prop

**Example — BehaviorInsightsPanel:**
| Property | Value |
|---|---|
| **Data source** | `behavior-patterns.ts` |
| **Inputs** | `className?: string` |
| **State** | `expanded: boolean`, loaded data |
| **Pattern** | Load → render details or empty state |

**Example — PredictiveInsightsPanel:**
| Property | Value |
|---|---|
| **Data source** | `predictive-insights.ts` |
| **Inputs** | `className?: string` |
| **State** | Loaded predictions |
| **Pattern** | Confidence score + career trends |

---

### G. FloatingCommandCenter

| Property | Value |
|---|---|
| **Purpose** | Floating action button that toggles CareerCommandCenter |
| **File** | `components/FloatingCommandCenter.tsx` (~120 lines) |
| **Data sources** | None directly (passes `defaultExpanded` to CareerCommandCenter) |
| **Inputs** | None |
| **Outputs** | Toggle visibility of CareerCommandCenter |
| **Position** | Bottom-right corner of home page |
| **Risk** | LOW — thin wrapper, uses Framer Motion |

---

### H. Panel Stack Pattern

All panel groups render in a **vertical stack** using `panel-stack` CSS class:
```css
.panel-stack > * + * { margin-top: 1rem; }
```

This means:
- No grid/layout variation within sections
- All panels full-width, stacked vertically
- No side-by-side or column layouts
- Significant vertical scroll required for 10+ panel sections

---

## 3. Panel Rendering Patterns

| Pattern | Frequency | Example |
|---|---|---|
| `useEffect` on mount | ~40+ panels | Standard data loading pattern |
| `useEffect` + interval | 1 panel | CareerCommandCenter (60s refresh) |
| `useMemo` for derived data | ~8 panels | CareerCommandCenter, JourneyProfileCard |
| `useCallback` for handlers | ~10 panels | Event handlers |
| CustomEvent listeners | 3 channels | `corepath:open-command-center`, `corepath:scroll-to-attribution`, `corepath:error` |
| Returns `null` on empty | ~10 panels | JourneyTimelinePanel, some intelligence panels |

---

## 4. Panel Risk Assessment

| Panel | Risk | Reason |
|---|---|---|
| **CareerCommandCenter** | 🔴 HIGH | 7 useEffects, 32 panels, 60s polling interval |
| **JourneyProfileCard** | 🔴 HIGH | 43 panels rendered simultaneously, no virtualization |
| **CareerWorkspacePanel** | 🟡 MED | 14 panels stacked, heavy data dependency |
| **QuizShell** | 🟡 MED | Complex state machine (resume, branching, results) |
| **AdaptiveRoadmapPanel** | 🟡 MED | Complex roadmap rendering with phase calculations |
| **JourneyTimelinePanel** | 🟢 LOW | Well-contained, returns null when empty |
| **FloatingCommandCenter** | 🟢 LOW | Simple toggle wrapper |
| **Intelligence Panels (individual)** | 🟢 LOW | ~50-150 lines each, single data load pattern |

---

## 5. Consolidation Opportunities

| Opportunity | Panels Involved | Est. Savings |
|---|---|---|
| Extract shared SkeletonPanel | JourneyProfileCard, CareerCommandCenter | ~30 lines per file |
| Extract shared SectionHeader | JourneyProfileCard, CareerCommandCenter | ~10 lines per file |
| Extract shared Export components | JourneyProfileCard, CareerCommandCenter | ~80 lines per file |
| Lazy-load panels in stack | All 90+ panels | ~90% reduction in initial mount |
| Virtualize timeline | JourneyTimelinePanel | Constant render cost |
