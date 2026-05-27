# Frontend Component Map

> Generated: May 27, 2026
> Project: CorePath

---

## 1. Component Inventory Overview

| Metric | Count |
|---|---|
| Total component files | 91+ in `components/` |
| Server components (no `"use client"`) | 6 (app pages, layout) |
| Client components (`"use client"`) | 85+ |
| Quiz sub-components | 6 (`quiz/` subdirectory) |
| Internal helper components | ~15 (SkeletonPanel, SectionHeader, ExportMenu, etc.) |

---

## 2. Parent-Child Tree

### Root Layout (`app/layout.tsx`)
```
<RootLayout>
  <AnalyticsSession />            // anonymous analytics tracker
  <Header />                      // global nav + theme toggle
  <RootErrorWrapper>              // client error boundary wrapper
    {children}                    // page content
  </RootErrorWrapper>
  <Footer />                      // links: /careers, /quiz, /recommendation, /insights
</RootLayout>
```

### Home Page (`app/page.tsx`)
```
<HomePage>
  <FloatingCommandCenter />
  <GuidedOnboarding />
  <RecentCareerHistoryPanel />
  <JourneyTimelinePanel />
    <JourneyActionPanel />
  <CareerProgressPanel />
  <AchievementPanel />
  <DailyMissionPanel />
  <WeeklyReflectionPanel />
  <GoalTrackerPanel />
  <NotificationPanel />
  <CommunitySignalsPanel />
  <QuickStartPanel />
  <TrustPanel />
  <FeedbackPanel source="home" />
  <CareerCard /> (x4)
</HomePage>
```

### Quiz Page (`app/quiz/page.tsx`)
```
<QuizPage>
  <ErrorBoundary name="QuizPage">
    <QuizShell>
      <QuizProgressBar />
      <QuestionCard>
        <AnswerCard /> (x4)
      </QuestionCard>
      <NavigationRow />
      <ResultScreen />
    </QuizShell>
  </ErrorBoundary>
</QuizPage>
```

### Recommendation Page (`app/recommendation/page.tsx`)
```
<RecommendationPage>
  <Suspense>
    <ErrorBoundary name="RecommendationPage">
      <RecommendationContent>
        // Primary match section
        <SkillGapPanel />
        <ProfileAnalyzerPanel />
        <PathExamplesPanel />
        <CommunitySignalsPanel />
        <TrustPanel />
        <ProjectRecommendationPanel />
        <FeedbackPanel source="recommendation" />
        <ConfidencePanel />
        <CareerWorkspacePanel />
          // Sub-panels of workspace
        <JourneyProfileCard />
          // 43+ sub-panels (Identity, Insights, Predictions, Execution, Memory, History)
        <PersonalInsightsPanel />
        // Other matches section
      </RecommendationContent>
    </ErrorBoundary>
  </Suspense>
</RecommendationPage>
```

### Careers Page (`app/careers/page.tsx`)
```
<CareersPage>
  <CareerCategoryTabs />
  <CareerFilterBar />
  <CareerGrid>
    <CareerCard /> (xN)
  </CareerGrid>
  <CompareAnalytics />
</CareersPage>
```

### Career Detail (`app/careers/[id]/page.tsx`)
```
<CareerDetailPage (server)>
  <CareerDetailClient (client)>
    <CareerRealityPanel />
    <AIImpactIndicator />
    <AdaptiveRoadmapPanel />
    <CareerWorkspacePanel />
      // 12+ sub-panels
  </CareerDetailClient>
</CareerDetailPage>
```

### Career Compare (`app/careers/compare/page.tsx`)
```
<ComparePage>
  <CompareAnalytics />
  <CareerComparisonPanel />
    // Side-by-side career comparison
</ComparePage>
```

### Insights Pages (`app/insights/`)
```
<InsightsPage>
  <LocalInsightsDashboard />
</InsightsPage>

<InsightDetailPage>
  <InsightDetailClient />
</InsightDetailPage>
```

---

## 3. Major Component Groups

### CareerCommandCenter (`~890 lines`)
```
<CareerCommandCenter>
  <ExportMenu />
  <SkeletonPanel /> (internal)
  <SectionHeader /> (internal, x5)
  // Dashboard cards: missions, level/XP, weekly sprint, goal, momentum, notifications
  // Grouped intelligence panels:
  - Identity: [CareerIdentityPanel]
  - Insights: [10 panels]
  - Predictions: [7 panels]
  - Execution: [3 panels]
  - Memory: [5 panels]
  - History: [6 panels]
</CareerCommandCenter>
```

### JourneyProfileCard (`~500 lines`)
```
<JourneyProfileCard>
  <JourneyExportMenu /> (internal)
  <SkeletonPanel /> (internal)
  <SectionHeader /> (internal, x5)
  <ProfileRadarChart />
  <SpecializationConfidenceChart />
  <ConfidencePanel />
  - Identity: [CareerIdentityPanel]
  - Insights: [10 panels]
  - Predictions: [6 panels]
  - Execution: [8 panels]
  - Memory: [5 panels]
  - History: [11 panels]
  <DecisionAssistantPanel />
  <CareerScenarioPanel />
  <NotificationPanel />
</JourneyProfileCard>
```

### CareerWorkspacePanel (`~350 lines`)
```
<CareerWorkspacePanel>
  // Header & progress bars
  // Current phase block
  // Next action block
  // Weekly progress block
  // Stats row (projects, streak, milestones)
  <AdaptiveRoadmapPanel />
  <CareerProgressPanel />
  <AchievementPanel />
  <DailyMissionPanel />
  <WeeklyReflectionPanel />
  <GoalTrackerPanel />
  <ActionSprintPanel />
  <EngagementPulsePanel />
  <MarketPulsePanel />
  <PathExamplesPanel />
  <CommunitySignalsPanel />
  <ProfileAnalyzerPanel />
  <CareerCoachPanel />
</CareerWorkspacePanel>
```

---

## 4. Duplicate UI Patterns

### SkeletonPanel — DUPLICATE (~30 lines each)
- Defined in `CareerCommandCenter.tsx` (internal function)
- Defined in `JourneyProfileCard.tsx` (internal function)
- **~60 lines of identical code across 2 files**

### SectionHeader — DUPLICATE (~10 lines each)
- Defined in `CareerCommandCenter.tsx` (internal function)
- Defined in `JourneyProfileCard.tsx` (internal function)
- **~20 lines of identical code across 2 files**

### Export Menu — DUPLICATE (~70 lines each)
- `JourneyExportMenu` in `JourneyProfileCard.tsx`
- `ExportMenu` in `CareerCommandCenter.tsx`
- Nearly identical structure (click-outside + escape + 3 export options)
- **~140 lines of near-duplicate code**

### Export Helper Functions — DUPLICATE (~80 lines total)
- `exportAsFile`, `exportJourneySnapshot`, `exportCareerIdentity`, `exportProgressSummary`
- Defined in both `JourneyProfileCard.tsx` and `CareerCommandCenter.tsx`
- **~160 lines of duplicated business logic**

### Panel Rendering Pattern — DUPLICATE
Both `JourneyProfileCard` and `CareerCommandCenter` render identical panel groups:
- Identity section
- Insights section (10 identical panels)
- Predictions section (6-7 panels, mostly identical)
- Execution section (subset overlap)
- Memory section (5 identical panels)
- History section (6-11 panels, mostly identical)

---

## 5. Component Sizing (LOC)

### Top 10 Largest Components
| Component | Lines | Risk |
|---|---|---|
| CareerCommandCenter.tsx | ~890 | HIGH — 7 useEffects, 35+ panel imports |
| JourneyProfileCard.tsx | ~480 | HIGH — 43+ panel imports |
| CareerWorkspacePanel.tsx | ~350 | MED — 14+ imported sub-panels |
| CareerComponents.tsx | ~330 | HIGH — DEAD CODE (never imported) |
| AdaptiveRoadmapPanel.tsx | ~430 | MED — complex roadmap rendering |
| JourneyTimelinePanel.tsx | ~200 | LOW — focused timeline component |
| FloatingCommandCenter.tsx | ~120 | LOW — thin wrapper |
| CareerScenarioPanel.tsx | ~270 | LOW — self-contained |
| CareerAlignmentPanel.tsx | ~290 | LOW — self-contained |
| DecisionReadinessPanel.tsx | ~280 | LOW — self-contained |

### Inline CSS/Style Consistency
- All components use Tailwind CSS with custom CSS variables (`var(--core-accent)`, `var(--core-muted)`, etc.)
- Consistent design token usage across components
- `animate-skeleton` class used for loading states
- `rounded-card`, `panel-stack`, `section-title`, `section-heading` as reusable utility classes

---

## 6. Dependency Graph (Component → Data Engine)

```
Component Layer                          Data Engine Layer
│                                        │
├─ CareerCommandCenter ────────────────► career-workspace, career-goals,
│                                        daily-missions, weekly-reflection,
│                                        achievement-engine, career-progress,
│                                        notification-engine, careers,
│                                        safe-storage, journey-memory
│
├─ JourneyProfileCard ─────────────────► journey-memory, quiz-enhanced
│
├─ CareerWorkspacePanel ───────────────► career-workspace, careers,
│                                        skill-gap, roadmaps, journey-timeline
│
├─ JourneyTimelinePanel ───────────────► journey-timeline
│
├─ QuizShell ──────────────────────────► quiz, quiz-enhanced, quiz-session,
│                                        quiz-history, journey-memory,
│                                        career-matching
│
├─ All Intelligence Panels ────────────► Respective data engines
│   (BehaviorInsightsPanel,             (behavior-patterns, learning-style,
│    PredictiveInsightsPanel,            predictive-insights, etc.)
│    etc.)
│
└─ app/page.tsx ───────────────────────► careers (direct import)
```

---

## 7. Component Import Hub Analysis

`JourneyProfileCard` and `CareerCommandCenter` act as **import hubs** — they import 30-40+ panel components each. This creates:

1. **Bundle size concerns**: All sub-panels are eagerly imported (no dynamic imports / `next/dynamic`)
2. **Startup cost**: ~40 component chunks must be loaded before rendering
3. **No lazy loading**: Every panel mounts immediately, even those below the fold

---

## 8. Dead Code

| File | Lines | Status |
|---|---|---|
| `components/CareerComponents.tsx` | ~330 | **DEAD** — never imported by any component |
| `components/CareerCard.tsx` (exported) | ~100 | **PARTIALLY DEAD** — compare mode path may not be reachable |
| `data/careers.json` | ~1500 | **INDIRECTLY USED** — consumed via `careers.ts` (not direct import) |

---

## 9. Component Composition Score

| Criterion | Score | Notes |
|---|---|---|
| **Component granularity** | 7/10 | Reasonably small individual panels |
| **Reuse** | 4/10 | Major duplicate patterns (SkeletonPanel, ExportMenu, SectionHeader) |
| **Separation of concerns** | 6/10 | Panels mix data loading + rendering + export logic |
| **Lazy loading** | 1/10 | No dynamic imports anywhere |
| **Server/client split** | 7/10 | Good use of `"use client"` boundaries |
| **Bundle optimization** | 3/10 | Eager imports of 40+ panels in hub components |

**Overall Component Health Score: 5.1 / 10**
