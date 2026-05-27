# CorePath System Architecture

> **Document**: 01-system-architecture.md
> **Generated**: 2026-05-27
> **Scope**: Full-stack Next.js App Router application — intelligence engines, component tree, storage layer, routing, data flow
> **Analysis Depth**: Full

---

## 1. High-Level Architecture

### 1.1 Architecture Style

CorePath uses a **client-heavy, server-light** architecture built on Next.js 14+ App Router. The server primarily handles static generation (SSG) of career pages, insight pages, and metadata. All interactive logic—quiz progression, career matching, workspace tracking, journey memory, notifications—runs entirely on the client via `"use client"` components.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  App      │  │  Panel   │  │  Quiz    │  │  Command │        │
│  │  Pages   │──│Components│──│  System  │──│  Center  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│       │              │              │              │            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                  Intelligence Engines                    │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │     │
│  │  │  Quiz    │  │ Career   │  │ Journey  │  │ Notif. │ │     │
│  │  │  Engine  │  │ Matching │  │ Memory   │  │ Engine │ │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │     │
│  │  │ Decision │  │ Behavior │  │ Growth   │  │ Career │ │     │
│  │  │ Intel.   │  │ Patterns │  │ Forecast │  │ Space  │ │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │     │
│  └────────────────────────────────────────────────────────┘     │
│                          │                                       │
│                    ┌──────────────┐                              │
│                    │  SafeStorage  │                              │
│                    │  (localStorage wrapper)                      │
│                    └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Next.js Server   │
                    │  (API + SSG)      │
                    └──────────────────┘
```

### 1.2 Data Flow

```
User Action → Panel Component → Intelligence Engine API
    → Read/Write via SafeStorage → React State Update → Re-render
```

All data flows from **user interaction → client component → data engine function → SafeStorage → react state → UI update**. There is no server-side persistence. The `/api/careers` endpoint provides career facets for filtering but is optional (fetch fails silently).

### 1.3 UI Flow

```
Home (/)
  ├── Hero / CTAs → Quiz (/quiz)
  ├── Career Cards → /careers
  ├── GuidedOnboarding
  ├── RecentCareerHistoryPanel
  ├── JourneyTimelinePanel
  ├── CareerProgressPanel
  ├── AchievementPanel
  ├── DailyMissionPanel
  ├── WeeklyReflectionPanel
  ├── GoalTrackerPanel
  ├── NotificationPanel
  ├── CommunitySignalsPanel
  ├── QuickStartPanel + TrustPanel
  └── FeedbackPanel

Quiz (/quiz)
  └── QuizShell → QuestionCard → ResultScreen → /recommendation?results=...

Careers (/careers)
  ├── FilterBar + CategoryTabs + CareerGrid
  ├── Career Detail (/careers/[id])
  │     ├── CareerRealityPanel, SkillGapPanel, ProfileAnalyzerPanel
  │     ├── CareerWorkspacePanel, AdaptiveRoadmapPanel
  │     ├── SkillTree, LearningRoadmap, Evolution Insights
  │     └── Related Careers → Compare
  └── Compare (/careers/compare?careerA=X&careerB=Y)

Recommendation (/recommendation?results=...)
  └── Career Results → SkillGap, Projects, Workspace, Evolution

Command Center (Floating via FloatingCommandCenter or inline)
  ├── Identity: CareerIdentityPanel
  ├── Insights: BehaviorInsights, PersonalEvolution, LearningStyle, etc.
  ├── Predictions: PredictiveInsights, DecisionReadiness, etc.
  ├── Execution: ActionSprints, DailyMissions, etc.
  ├── Memory: InsightVault, Coaching, IntelligenceSynthesis
  └── History: Replay, Timeline, CareerStory, Momentum

Insights (/insights + /insights/[slug])
  └── SEO content pages — static generation from seo-content.ts
```

### 1.4 Intelligence Engine Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTELLIGENCE ECOSYSTEM                       │
│                                                                     │
│  INPUT LAYER                                                        │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐                    │
│  │ Quiz     │  │ Career       │  │ User       │                    │
│  │ Answers  │  │ Selections   │  │ Actions    │                    │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘                    │
│       │               │                │                           │
│       ▼               ▼                ▼                           │
│  PROCESSING LAYER                                                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐                        │
│  │ Quiz     │─►│ Career   │─►│ Career    │                        │
│  │ Enhanced │  │ Matching │  │ Evolution  │                        │
│  └──────────┘  └──────────┘  └───────────┘                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐                        │
│  │ Trait    │  │ Skill    │  │ Confidence │                        │
│  │ Analysis │  │ Gap      │  │ Engine    │                        │
│  └──────────┘  └──────────┘  └───────────┘                        │
│                                                                     │
│  MEMORY LAYER                                                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐                        │
│  │ Journey  │  │ Journey  │  │ Career    │                        │
│  │ Memory   │─►│ Timeline │  │ Workspace │                        │
│  └────┬─────┘  └──────────┘  └───────────┘                        │
│       │                                                            │
│       ▼                                                            │
│  ANALYTICS LAYER                                                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐         │
│  │ Behavior │  │ Growth   │  │ Decision  │  │ Market   │         │
│  │ Patterns │  │ Forecast │  │ Intel.   │  │ Pulse    │         │
│  └──────────┘  └──────────┘  └───────────┘  └──────────┘         │
│                                                                     │
│  FEEDBACK LAYER                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐                        │
│  │ Change   │  │ Prediction│  │ Adaptive  │                        │
│  │ Attrib. │  │ Feedback  │  │ Self-Corr │                        │
│  └──────────┘  └──────────┘  └───────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.5 Storage Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        STORAGE ARCHITECTURE                      │
│                                                                  │
│  Component Layer                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │ QuizShell    │  │ CareerCommand│  │ JourneyTimeline  │       │
│  │              │  │ Center       │  │                  │       │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘       │
│         │                 │                    │                  │
│         ▼                 ▼                    ▼                  │
│  Intelligence Engine Layer                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │ saveQuizResult│  │ loadCareer  │  │ buildTimeline()  │       │
│  │ loadQuizResult│  │ Workspace() │  │                  │       │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘       │
│         │                 │                    │                  │
│         ▼                 ▼                    ▼                  │
│  SafeStorage Layer                                                │
│  ┌────────────────────────────────────────────────────────┐      │
│  │                  safe-storage.ts                        │      │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │      │
│  │  │ get<T>(key) │  │ set<T>(key)  │  │ delete(key)  │  │      │
│  │  │ + JSON.parse│  │ + JSON.stringify                  │  │      │
│  │  │ + try/catch │  │               │  │               │  │      │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │      │
│  └────────────────────────────────────────────────────────┘      │
│                          │                                       │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────┐      │
│  │                window.localStorage                      │      │
│  │  Core keys:                                              │      │
│  │  • corepath_journey_memory — journey events + profile   │      │
│  │  • corepath_workspace_* — career workspace data         │      │
│  │  • corepath_quiz_session — in-progress quiz             │      │
│  │  • corepath_quiz_history — past results                 │      │
│  │  • corepath_notifications — notification state          │      │
│  │  • corepath_analytics — event logs                      │      │
│  │  • corepath-compare-basket — compare selections         │      │
│  │  • corepath-goal-state — career goal tracking           │      │
│  └────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Folder Responsibility Map

### 2.1 `/app` — Routing & Page Shells

| Subdirectory | Purpose | Depends On | Risk |
|---|---|---|---|
| `/` (root page) | Home page: hero, CTAs, dashboard panels | 15+ panel components, `data/careers` | **High** — renders 15+ panels, layout density |
| `/careers` | Career listing + filters | `data/careers`, CareerGrid, FilterBar | **Medium** — filter state complexity |
| `/careers/[id]` | Career detail (SSG) | `data/careers`, `data/roadmaps`, `data/career-evolution`, 12+ panels | **High** — SSR hybrid, heavy panel chain |
| `/careers/compare` | Side-by-side comparison (SSR) | `data/career-comparison`, CompareAnalytics, DecisionAssistant, CareerScenario | **Medium** — linear layout |
| `/quiz` | Quiz page | QuizShell, all quiz sub-components | **Medium** — branching logic, session restore |
| `/recommendation` | Results page | RecommendationContent, 10+ panels | **High** — heavy render chain |
| `/insights` + `/[slug]` | SEO content pages (SSG) | `data/seo-content`, InsightDetailClient | **Low** — mostly static |

### 2.2 `/components` — UI Panels

| Group | Count | Purpose | Risk |
|---|---|---|---|
| **Quiz** (`/quiz/`) | 6 files | QuizShell, QuestionCard, AnswerCard, NavigationRow, ProgressBar, ResultScreen | **Medium** — state machine, animation |
| **Panels** (root) | 80+ files | Individual dashboard panels for every intelligence engine | **High** — 60+ panels in command center, many read from storage on mount |
| **Layout** | Header, Footer, ThemeToggle, NotificationBell, FloatingCommandCenter | **Low** — stable layout |
| **Error handling** | ErrorBoundary, ErrorFallbackShell, RootErrorWrapper | **Low** — safety net |

### 2.3 `/data` — Intelligence Engines

| Group | Count | Purpose | Risk |
|---|---|---|---|
| **Quiz** | 10 files | Quiz logic, branching, enhanced profiles, session, history, reports | **Medium** — algorithm complexity |
| **Journey & Memory** | 6 files | Journey memory, timeline, replay, memory evolution | **High** — read/write heavy, cross-cutting |
| **Career Analysis** | 12+ files | Career matching, alignment, evolution, scenarios, workspace, coach | **Medium** — algorithmic |
| **Decision & Prediction** | 10+ files | Decision intel, confidence, readiness, priority, predictive insights | **High** — many dependent engines |
| **Behavior & Growth** | 10+ files | Behavior patterns, growth analytics, learning friction, habit intel | **Medium** — derived data |
| **Infrastructure** | safe-storage, sanitize, system-config, performance-debug, pipeline | **Low** — foundational |
| **Storage Health** | storage-health.ts | **Low** — diagnostic |

### 2.4 `/e2e` — Playwright Tests

| File | Purpose |
|---|---|
| `journey-a-confused-student.spec.ts` | First-time quiz → recommendation flow |
| `journey-b-ai-user.spec.ts` | Returning user with AI-focused quiz |
| `journey-c-explorer.spec.ts` | Broad career exploration flow |
| `journey-d-returning-user.spec.ts` | Existing user with saved state |
| `helpers.ts` | Playwright test utilities |

---

## 3. Intelligence Engine Dependency Graph

### 3.1 Engine-to-Engine Dependencies

```
quizQuestions.ts ────────────────────────────────────────────┐
      │                                                      │
      ▼                                                      │
quiz.ts ──────────► career-matching.ts                      │
      │                                                      │
      ▼                                                      │
quiz-enhanced.ts ─► career-alignment.ts ─────────────────┐  │
      │                    │                              │  │
      ▼                    ▼                              ▼  ▼
quiz-session.ts     career-progress.ts ──────────► career-workspace.ts
      │                    │                              │
      ▼                    ▼                              ▼
quiz-history.ts      career-momentum.ts ──────────► career-evolution.ts
      │                    │                              │
      ▼                    ▼                              ▼
quiz-report.ts       career-scenarios.ts ─────────► career-story.ts
                           │                              │
                           ▼                              ▼
                    decision-intelligence.ts ◄────► career-coach.ts
                           │                              │
                           ▼                              ▼
                    confidence-engine.ts ◄────────► predictive-insights.ts
                           │                              │
                           ▼                              ▼
                    decision-readiness.ts ────────► growth-forecast.ts
                           │                              │
                           ▼                              ▼
                    decision-priority.ts ────────────► growth-analytics.ts
                           │
                           ▼
                    decision-confidence.ts
```

### 3.2 Source Engines (data producers)

| Engine | Produces | Consumed By |
|---|---|---|
| `quiz.ts` | Trait scores, raw results | quiz-enhanced, career-matching, ResultScreen |
| `quiz-enhanced.ts` | Enhanced profile, contradictions | ResultScreen, journey-memory, all decision engines |
| `journey-memory.ts` | Journey events, profile | career-workspace, timeline, behavior-patterns, confidence-engine, all panels |
| `career-workspace.ts` | Workspace state, streak | CareerCommandCenter, CareerWorkspacePanel |

### 3.3 Consumer Engines (data readers)

| Engine | Reads From | Purpose |
|---|---|---|
| `behavior-patterns.ts` | journey-memory | User behavior clustering |
| `confidence-engine.ts` | journey-memory, quiz-enhanced | Recommendation confidence scoring |
| `decision-intelligence.ts` | journey-memory, career-workspace | Decision framing |
| `growth-forecast.ts` | career-progress, career-momentum | Momentum prediction |
| `intelligence-synthesis.ts` | All engine outputs | Cross-cutting insight generation |

### 3.4 Feedback Loops

```
Quiz → Enhanced Profile → Career Match → Journey Memory
                                                │
                     ┌──────────────────────────┘
                     ▼
             Behavior Patterns ──► Change Attribution
                                        │
                                        ▼
                              Adaptive Self-Correction
                                        │
                                        ▼
                              Career Confidence Update
                                        │
                                        ▼
                              Better Quiz Suggestions
```

---

## 4. Critical Render Path

### 4.1 Home → Quiz → Career → Workspace → Journey → Command Center

```
Step 1: HOME PAGE (/)
  ├── Server: static HTML + metadata
  ├── Client mount: Header, Footer, FloatingCommandCenter, AnalyticsSession
  ├── 12+ panel components mount in parallel:
  │     - Each reads localStorage via safe-storage
  │     - Early returns if data is empty (null states)
  │     - Hooks execute before returns (verified)
  └── FloatingCommandCenter listens for corepath:open-command-center event

Step 2: → QUIZ (/quiz)
  ├── QuizShell mounts
  ├── LoadQuizSession() checks for saved progress → resume prompt
  ├── 14 questions rendered sequentially
  ├── Branching: buildAdaptiveSequence() after 3rd answer
  ├── On finish: calculateResults() → calculateEnhancedProfile()
  ├── saveQuizResult() → recordJourneyEvent() → clearQuizSession()
  └── navigate to /recommendation?results=careerId:percentage,...

Step 3: → RECOMMENDATION (/recommendation)
  ├── RecommendationContent reads search params
  ├── Calls: getCareerById, buildCareerSurfaceExplanation, buildCareerEvolution
  ├── Calls: analyzeSkillGap, getProjectsForCareer, loadJourneyMemory
  ├── Renders: primary card + skill gap + profile analyzer + evolution + workspace
  └── Heavy render: 10+ panels, dynamic imports in ResultScreen

Step 4: → CAREER DETAIL (/careers/[id])
  ├── Server: generateStaticParams → SSG
  ├── Server: getCareerById, getRoadmapById, buildCareerEvolution
  ├── Client mount: CareerDetailClient logs analytics event
  ├── Client: CareerRealityPanel, SkillGapPanel, ProfileAnalyzerPanel, PathExamplesPanel
  ├── Client: CareerWorkspacePanel (may auto-select career if no workspace exists)
  ├── Client: AdaptiveRoadmapPanel, SkillTree, LearningRoadmap
  └── Client: JourneyProfileCard (records journey event)

Step 5: → WORKSPACE (within CareerDetail or Recommendation)
  ├── loadCareerWorkspace() → selectCareer() if none exists
  ├── Computes: phase progress, readiness, streak, weekly progress
  ├── Renders: 8 sub-panels (CareerProgress, Achievement, DailyMission, etc.)
  └── Next action recommendation logic

Step 6: → COMMAND CENTER (Floating or Expanded)
  ├── loadCareerWorkspace(), loadGoalState(), getDailyMissions(), etc.
  ├── computeAchievements(), computeCareerProgress()
  ├── Renders 5 sections with 30+ sub-panels
  │     Identity (1) → Insights (9) → Predictions (6) → Execution (3) → Memory (5) → History (6)
  ├── Cross-component communication via CustomEvent
  └── Polls every 60 seconds for data refresh
```

### 4.2 Bundle & Render Impact

| Page | Panel Count | Storage Reads | Risk |
|---|---|---|---|
| Home (`/`) | 15+ panels | 15+ reads (parallel) | **High** — initial load |
| Quiz (`/quiz`) | 2-3 active | 3 reads | **Low** |
| Career Detail (`/careers/[id]`) | 12+ panels | 6+ reads | **Medium** |
| Compare (`/careers/compare`) | 5 panels | 2 reads | **Low** |
| Recommendation (`/recommendation`) | 15+ panels | 8+ reads | **High** |
| Command Center (expanded) | 30+ panels | 20+ reads | **Critical** — extreme |

---

## 5. State Flow Map

### 5.1 localStorage Keys & Ownership

| Key | Owner | Format | Written By | Read By |
|---|---|---|---|---|
| `corepath_journey_memory` | journey-memory.ts | JSON | recordJourneyEvent | All panels via loadJourneyMemory |
| `corepath_quiz_session` | quiz-session.ts | JSON | QuizShell auto-save | QuizShell mount |
| `corepath_quiz_history` | quiz-history.ts | JSON | saveQuizResult | QuizHistoryPanel |
| `corepath_notifications` | notification-engine.ts | JSON | notification engine | NotificationPanel, Command Center |
| `corepath_workspace_*` | career-workspace.ts | JSON | selectCareer, trackProgress | CareerWorkspacePanel, Command Center |
| `corepath-goal-state` | career-goals.ts | JSON | GoalTrackerPanel | GoalTrackerPanel, Command Center |
| `corepath-compare-basket` | careers/page.tsx | JSON array | Toggle compare | CareersPage |
| `corepath_analytics` | analytics-events.ts | JSON | logEvent | AnalyticsSession (on unmount) |
| `corepath_daily_missions` | daily-missions.ts | JSON | completeMission | DailyMissionPanel, Command Center |
| `corepath_weekly_reflection` | weekly-reflection.ts | JSON | reflection engine | WeeklyReflectionPanel |
| `corepath_achievements` | achievement-engine.ts | JSON | computeAchievements | AchievementPanel, Command Center |

### 5.2 SafeStorage Wrapper

All localStorage access routes through **SafeStorage** (`safe-storage.ts`):

```
SafeStorage.get<T>(key): T | null
  ├── Try localStorage.getItem(key)
  ├── Try JSON.parse(raw)
  ├── Catch → log warning, return null
  └── Never throws

SafeStorage.set<T>(key, value): void
  ├── Try JSON.stringify(value)
  ├── Try localStorage.setItem(key, stringified)
  └── Catch → log warning, silently fail
```

### 5.3 useState Locations

| Component | State Variables | Purpose |
|---|---|---|
| QuizShell | sequence, pos, currentIndex, selectedIndex, answers, finished, isSubmitting, pendingSession, sessionTracked, quizStartedLogged | Full quiz lifecycle |
| CareersPage | category, query, aiImpact, difficulty, futureDemand, aiRelationship, remotePotential, startupFriendly, badge, visible, compareMode, selectedCompare, isFilterVisible | Filter-heavy browse page |
| CareerCommandCenter | data, isExpanded, isTempOpen, initialised, activeSection, showExportMenu | Dashboard state |
| FloatingCommandCenter | isOpen, isFullscreen, unreadBadge | Floating UI state |
| NotificationPanel | notifications | Notification list |
| JourneyProfileCard | profile, journey, loaded, showExportMenu | Profile state |

### 5.4 useEffect Dependency Patterns

The codebase uses `useEffect` extensively (94+ instances across `.tsx` files). Common patterns:

| Pattern | Frequency | Risk |
|---|---|---|
| `useEffect(() => { load(); }, [load])` | Common | **Low** — stable callback ref |
| `useEffect(() => { logEvent(...); }, [])` | Common | **Low** — mount-only analytics |
| `useEffect(() => { autoSave(data); }, [data])` | Several | **Medium** — could trigger on every render if not careful |
| `useEffect(() => { window.addEventListener(...); }, [])` | Several | **Low** — mount/unmount |
| `useEffect(() => { fetch(...).catch() }, [])` | Isolated | **Low** — optional data |

**No infinite rerender patterns found.** All dependency arrays are stable (either `[]`, `[stableCallback]`, or `[data]` controlled by user action).

### 5.5 Cross-Component Events

| Event | Dispatched By | Received By | Payload |
|---|---|---|---|
| `corepath:open-command-center` | NotificationPanel, Footer? | CareerCommandCenter (via Floating) | `{ section?: string }` |
| `corepath:scroll-to-attribution` | ChangeAttributionPanel? | JourneyProfileCard, CareerCommandCenter | `{ source: string, cause: string }` |
| `corepath:error` | ErrorBoundary | (analytics listener) | `{ message, stack, component, timestamp, url }` |

---

## 6. Performance Risk Areas

### 6.1 Repeated Storage Reads

| Location | Issue | Impact |
|---|---|---|
| **Home page** — 15+ panels each call `loadJourneyMemory()` | Each call parses the entire journey memory JSON. On a heavy user with 100+ events, this is ~50KB parsed 15+ times per page load. | **Medium** — cumulative parse time |
| **Command Center** — 30+ sub-panels each call `loadJourneyMemory()` on mount | Same JSON parsed 30+ times when dashboard expands | **High** — could cause visible lag on low-end devices |
| **Timer-based poll** — Command Center + NotificationPanel poll every 60s | Periodic full re-read of all storage keys | **Low** — infrequent |

### 6.2 Large Panel Hierarchies

| Page | Panel Tree Depth | Estimated DOM Nodes |
|---|---|---|
| Command Center expanded | 30+ panels nested | 1000+ DOM nodes |
| Home page | 15 panels, some nested | 800+ DOM nodes |
| Recommendation | 15+ panels + dynamic imports | 700+ DOM nodes |
| Career Detail | 12+ panels | 600+ DOM nodes |

### 6.3 Heavy Render Chains

| Path | Reason | Mitigation |
|---|---|---|
| Quiz → ResultScreen | 7 dynamic imports (ProfileRadarChart, SpecializationConfidenceChart, IntelligenceReport, etc.) | ✅ Uses `next/dynamic` with `ssr: false` |
| Home page on fresh mount | 15+ panels all calling storage + setting state simultaneously | **No mitigation** — all mount in parallel |
| Command Center expand | 30+ sub-panels mount simultaneously | **No mitigation** — container uses CSS grid, no virtualization |

### 6.4 Possible Memory Leaks

| Location | Issue | Verdict |
|---|---|---|
| `useEffect` with `setInterval` (FloatingCommandCenter, CommandCenter, NotificationPanel) | Intervals cleared in return ✅ | **Low risk** |
| `window.addEventListener` (QuizShell, JourneyProfileCard, CareerCommandCenter) | Listeners removed in return ✅ | **Low risk** |
| `URL.createObjectURL` in export helpers | `revokeObjectURL` called ✅ | **Low risk** |
| Dynamic imports result cache | React keeps dynamic components in memory | **Acceptable** |

### 6.5 Bundle Size Concerns

| Area | Issue |
|---|---|
| **Framer Motion** (dependency) | ~32KB gzipped — used only by FloatingCommandCenter for animations |
| **Panel explosion** | 80+ panel components all importable from command center — likely leads to large initial JS bundle |
| **No code splitting on panels** | All panels imported statically in CareerCommandCenter and JourneyProfileCard |

---

## 7. Technical Debt

### 7.1 Duplicate Logic

| Location | Duplication | Impact |
|---|---|---|
| `CareerCommandCenter.tsx` + `JourneyProfileCard.tsx` | Both contain identical `SkeletonPanel`, `SectionHeader`, `exportAsFile`, `exportJourneySnapshot`, `exportCareerIdentity`, `exportProgressSummary`, and `ExportMenu` components | **High** — ~200 lines duplicated verbatim |
| `data/quiz-enhanced.ts` + `data/quiz.ts` | Both calculate trait scores with similar logic | **Medium** |
| `components/quiz/ProgressBar.tsx` + inline progress bars in careers page | Similar progress bar rendering | **Low** |

### 7.2 Dead or Unused Code

| File | Code | Status |
|---|---|---|
| `components/CareerComponents.tsx` | `CareerQuizComponent`, `CareerResultsComponent`, `CareerCard`, `CareerRecommendationPage` | **Dead** — example/demo components, not imported anywhere in production routes. Uses `@/data` imports that don't match project import style |
| `data/careers.json` | Raw JSON careers data | **Possibly unused** — `careers.ts` re-exports from this JSON but also adds derived types |

### 7.3 Complex Areas (high cyclomatic complexity)

| File | Complexity | Reason |
|---|---|---|
| `CareerCommandCenter.tsx` | **Critical** — ~550 lines | Massive component with 8+ state variables, nested sections, conditional rendering, export logic |
| `JourneyProfileCard.tsx` | **Critical** — ~500 lines | Near-identical duplicate of CareerCommandCenter |
| `QuizShell.tsx` | **High** — ~350 lines | Quiz state machine with branching, resume, auto-save, analytics |
| `CareerWorkspacePanel.tsx` | **High** — ~300 lines | Workspace lifecycle, phase tracking, conditional rendering |
| `RecommendationContent.tsx` | **High** — ~350 lines | 15+ panel orchestration with conditional rendering |
| `app/careers/page.tsx` | **High** — 300+ lines | 10 filter states, 5 useEffects, complex filtering logic |

### 7.4 Type Safety Issues

| File | Issue | Severity |
|---|---|---|
| `CareerCommandCenter.tsx` (ExportMenu) | `data` prop typed as `any` | **Low** — runtime-safe, only used for export |
| `data/quiz-enhanced.ts` | Extended profile trait names as string keys | **Medium** — no enum for trait names |
| `components/quiz/ResultScreen.tsx` | `saveQuizResult` called with duplicate logic in both QuizShell and ResultScreen | **Medium** — potential inconsistency |

### 7.5 Storage Schema Evolution

| Issue | Impact |
|---|---|
| No migration system for localStorage schema changes | **High** — old data may cause parse failures after code changes |
| No version field in stored objects | **High** — impossible to detect stale data |
| SafeStorage silently returns null on parse failure | **Low** — safe but silently drops user data |

### 7.6 Project Complexity Score

```
Complexity Score: 8.2 / 10

Breakdown:
  Data Engine Files:    86 files     → 2.5/3.0
  Component Files:      90+ files    → 2.5/3.0
  State Management:     All useState + localStorage → 1.0/1.5
  Cross-cutting Events: 3 custom events → 0.5/1.0
  Testing:              9 unit + 4 e2e → 0.7/1.0
  Dead Code:            1 dead file   → 0.5/0.5 (penalty)
  Duplicate Logic:      ~200 lines    → 0.5/0.5 (penalty)
  Architecture Doc:     Now exists    → 0.0/0.5 (bonus)

Interpretation:
  • Above 7: Significant complexity — dedicated maintenance effort required
  • Panel explosion (80+ panels) is the dominant complexity driver
  • Duplicate code between CommandCenter and JourneyProfileCard should be extracted
  • No centralized state management (Redux/Zustand) — all state is component-local + localStorage
```

---

## 8. Suggested Architecture Improvements

> **Note**: These are recommendations only. No code changes have been made.

### 8.1 Critical (high impact, moderate effort)

1. **Extract shared panel infrastructure**
   Extract `SkeletonPanel`, `SectionHeader`, `ExportMenu`, and export helper functions from `CareerCommandCenter.tsx` and `JourneyProfileCard.tsx` into a shared `components/shared/PanelShell.tsx` or similar.

2. **Add localStorage schema versioning**
   Introduce a version field in all stored objects. On load, if version < current, run a migration or invalidate stale data. Prevents "silent data loss" when SafeStorage catches parse errors.

3. **Memoize storage reads across panels**
   Introduce a `JourneyMemoryProvider` (React Context) that loads journey memory once and provides it to all child panels, rather than each panel reading + parsing from localStorage independently.

### 8.2 High (high impact, low effort)

4. **Remove dead code**
   Delete `components/CareerComponents.tsx` (example/demo components not used in production). If the demo patterns are useful, move them to a `/examples` or `/docs` directory.

5. **Lazy-load command center section panels**
   The 30+ panels in the expanded command center could be code-split by section (Identity, Insights, Predictions, etc.) using `next/dynamic`, reducing initial JS payload.

6. **Fix `ResultScreen` double-save**
   `saveQuizResult()` is called in both `QuizShell` (on completion) and `ResultScreen` (on mount). Remove the duplicate call in `ResultScreen` to prevent double-writes.

### 8.3 Medium (moderate impact, low effort)

7. **Consolidate trait label definitions**
   Create a shared enum/record for trait names (e.g., `TRAITS.ANALYTICAL`, `TRAITS.CREATIVITY`) instead of using string literals across `quiz-enhanced.ts`, `ResultScreen.tsx`, and `CareerComponents.tsx`.

8. **Centralize polling logic**
   Extract the 60-second polling pattern used by CommandCenter and NotificationPanel into a shared `usePoll(callback, interval)` hook.

9. **Add PanelShell wrapper component**
   Create a reusable panel wrapper with consistent `rounded-card`, `border`, `bg-core-surface`, `p-6` styling to eliminate repetitive Tailwind class strings.

### 8.4 Long-term (high impact, high effort)

10. **Evaluate state management library**
    With 80+ panels sharing data across the component tree, a lightweight state manager (Zustand or Jotai) could replace the custom event bus + localStorage pattern, reducing render counts and improving predictability.

11. **Server-side persistence**
    Currently all data lives in localStorage (client-only). Adding server-side persistence (IndexedDB for offline, or a backend API for sync) would enable cross-device journey continuity.

12. **Virtualize panel grid in command center**
    The expanded command center renders 30+ panels in a CSS grid. Using a virtualizer (react-window) would significantly reduce DOM node count on low-end devices.

---

## Appendix A: File Count & Size Summary

| Directory | Files | Estimated LOC |
|---|---|---|
| `app/` | 14 | ~2,200 |
| `components/` | 90+ | ~15,000 |
| `components/quiz/` | 6 | ~1,200 |
| `data/` | 86 | ~12,000 |
| `data/__tests__/` | 9 | ~1,500 |
| `e2e/` | 5 | ~800 |
| **Total** | **~210** | **~32,700** |

## Appendix B: Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | latest | App Router, SSR/SSG, routing |
| `react` / `react-dom` | latest | UI framework |
| `framer-motion` | ^12.40.0 | FloatingCommandCenter animations |
| `tailwindcss` | ^3.4.4 | Utility CSS |
| `typescript` | 6.0.3 | Type safety |
| `vitest` | ^4.1.7 | Unit testing |
| `@playwright/test` | ^1.60.0 | E2E testing |
| `@testing-library/react` | ^16.3.2 | Component testing |

---

*End of report — 01-system-architecture.md*
