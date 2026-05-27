# User Flow Analysis Report

**Project:** CorePath  
**Document:** 02-user-flow-report.md  
**Date:** 2026-05-27  
**Scope:** Complete user movement analysis across all pages, panels, and interaction surfaces

---

## Table of Contents

1. [First-Time User Journey](#1-first-time-user-journey)
2. [Returning User Journey](#2-returning-user-journey)
3. [Power-User Journey](#3-power-user-journey)
4. [Navigation Graph](#4-navigation-graph)
5. [Dead-End Analysis](#5-dead-end-analysis)
6. [Dropoff Risk Analysis](#6-dropoff-risk-analysis)
7. [UX Recommendations](#7-ux-recommendations)
8. [Scores](#8-scores)

---

## 1. First-Time User Journey

### 1.1 Landing (`/`)

**Entry point.** The user arrives at the home page. The page loads with:

- `FloatingCommandCenter` → collapses by default (skeleton → empty state for new users)
- Hero section with two CTAs: "Start career cognition" (`/quiz`) and "Explore intelligence cards" (`/careers`)
- Three feature cards (static)
- Strategic model sidebar (static)
- `GuidedOnboarding` → provides first-time user walkthrough
- `RecentCareerHistoryPanel` → returns `null` (empty history)
- `JourneyTimelinePanel` → returns `null` (empty timeline)
- `CareerProgressPanel` → renders empty state ("No progress yet")
- `AchievementPanel` → renders empty state ("No achievements yet")
- `DailyMissionPanel` → renders empty state or generates first mission
- `WeeklyReflectionPanel` → returns `null` (no reflection data)
- `GoalTrackerPanel` → returns `null` (no goal set)
- `NotificationPanel` → returns `null` (no notifications)
- `CommunitySignalsPanel` → renders with generic data
- `QuickStartPanel` → renders quick-start guide
- `TrustPanel` → renders trust signals
- `FeedbackPanel` → renders feedback form
- Career preview cards (4 cards)
- Three footer cards linking to `/careers`, `/quiz`, `/recommendation`

**Friction points:**
- **9 panels render empty states on first load.** The user sees many skeleton loaders or empty-state messages before any meaningful content.
- `GuidedOnboarding` pops up with minimal context — may feel abrupt.
- No clear "next step" after the hero CTA — user must decide between quiz and career browsing without guidance on which comes first.

### 1.2 Quiz (`/quiz`)

**Path:** Landing → Click "Start career cognition" → `/quiz`

**Flow:**
1. `QuizShell` loads → checks for existing `QuizSession` in localStorage
2. If no session exists, starts fresh quiz
3. User answers ~15-20 questions across multiple pages
4. On completion, `saveQuizResult()` is called, then the user is redirected to `/recommendation?results=...`

**Key observations:**
- `QuizShell` has 6 `useEffect` hooks — complex re-render chain
- `saveQuizResult()` is called in both `QuizShell` and `ResultScreen` (double save)
- Progress bar shows question progress (e.g., "5/15")
- Answer cards use `key={i}` (stable for static quiz, acceptable)

**Friction points:**
- ⚠️ **No save-and-exit for long quizzes** — reloading mid-quiz restores from `QuizSession` but user is unaware of this capability
- ⚠️ **No estimated time-to-complete shown** before starting
- ⚠️ **No "skip question" option** — user must answer every question
- Result transition is abrupt (URL change with query params)

### 1.3 Recommendation (`/recommendation?results=...`)

**Path:** Quiz completion → `/recommendation?results=careerA:85,careerB:72,careerC:61`

**Flow:**
1. `RecommendationContent` parses query params
2. Shows primary match card with percentage bar, explanation, AI outlook, next action
3. Shows "Compare careers" button linking to `/careers/compare?careerA=X&careerB=Y`
4. Shows "View Full Roadmap" linking to `/careers/{id}`
5. Shows skill gap panel, profile analyzer, path examples
6. Shows `CareerWorkspacePanel` — allows selecting the recommended career
7. Shows `JourneyProfileCard` — begins building profile data
8. Shows other matches as a list with links to each career

**Key observations:**
- `RecommendationContent` wraps the entire page in `<ErrorBoundary name="RecommendationPage">`
- Uses `useSearchParams()` from `next/navigation` — must be in `<Suspense>`
- Logs analytics event on mount (`recommendation_viewed`)
- Primary career explanation is built from `buildCareerSurfaceExplanation()`

**Friction points:**
- ⚠️ **Information overload** — 15+ panels stacked vertically on a single page
- ⚠️ **No scroll-to-top** on first render — user lands mid-page
- ⚠️ **Query params are fragile** — sharing or bookmarking a recommendation URL captures raw match data

### 1.4 Career Page (`/careers/{id}`)

**Path:** Recommendation → Click "View Full Roadmap" → `/careers/{id}`

**Flow:**
1. `CareerDetailClient` loads career data from `getCareerById()`
2. Shows career overview: icon, title, tagline, AI impact badge, core skill
3. Shows `CareerRealityPanel` with salary, difficulty, time-to-job data
4. Shows roadmap with `AdaptiveRoadmapPanel`
5. Shows `CareerWorkspacePanel` — "Select this career" button
6. Shows related careers section

**Key observations:**
- Career detail page has 6 `useEffect` hooks
- Roadmap content is loaded from `career-roadmaps.ts` (generated)
- `AdaptiveRoadmapPanel` checks `shouldAdaptRoadmap()` before computing personalized roadmap

**Friction points:**
- ⚠️ **No breadcrumb navigation** — user can't easily trace back to recommendation
- ⚠️ **Back button goes to careers list, not recommendation** — lost context
- ⚠️ **6 panels stacked vertically** — potential scroll fatigue

### 1.5 Career Workspace

**Path:** Career page → Click "Select this career" / "Start workspace"

**Flow:**
1. `CareerWorkspacePanel` calls `selectCareer(career)` which creates a `CareerWorkspace` in localStorage
2. Shows milestone tracking, streak indicator, weekly progress
3. Shows `CareerProgressPanel` with momentum score
4. Shows daily missions

**Key observations:**
- Workspace is persisted to `corepath-career-workspace` in localStorage
- Streak tracking is date-based (last progress date)
- `estimatedReadiness` is computed from completed milestones

**Friction points:**
- ⚠️ **Only one workspace at a time** — selecting a new career replaces the old one
- ⚠️ **No way to reset workspace** without clearing localStorage
- ⚠️ **Milestone completion is manual** — no auto-detection

### 1.6 Journey (`/` → JourneyProfileCard panels)

**Path:** Any page with `JourneyProfileCard` → rendered on home page and recommendation page

**Flow:**
1. `JourneyProfileCard` loads `JourneyMemory` from localStorage
2. If no data, shows empty state: "Not enough data yet. Complete a quiz or explore careers to start building your profile."
3. Once data exists, renders ~30+ sub-panels organized by sections:
   - Identity (1 panel)
   - Insights (10 panels)
   - Predictions (6 panels)
   - Execution (8 panels: QuizResumeCenter, CareerProgress, Achievement, DailyMission, WeeklyReflection, GoalTracker, ActionExecution, MissionIntelligence)      - Memory (5 panels)
      - History (11 panels: JourneyReplaySummary, JourneyReplay, ProgressReflection, CareerStory, CareerMomentum, CareerAlignment, GrowthAnalytics, RecentCareerHistory, ComparisonHistory, QuizHistory, JourneyTimeline)
   - Decision Assistant + Notifications (3 panels)

**Friction points:**
- ⚠️ **Critical: 30+ panels mount simultaneously** — severe performance impact
- ⚠️ **Each sub-panel reads localStorage independently** — 30+ storage reads on render
- ⚠️ **No lazy loading** — all panels render even if user never scrolls to them
- ⚠️ **Information overload** — new users see dozens of panels with minimal data

### 1.7 Command Center

**Path:** Click "Open Command Center" button on any page → `FloatingCommandCenter` expands

**Flow:**
1. `CareerCommandCenter` loads all data sources: workspace, goals, missions, achievements, progress, notifications
2. Shows summary cards: today's mission, level/XP, weekly sprint, goal progress, momentum, notifications
3. Shows "Next action" recommendation based on user state
4. Shows "Quick actions" links: continue workspace, resume quiz, view timeline, comparison history, planner
5. Shows full panel stack with ~30 sub-panels (same structure as JourneyProfileCard)

**Key observations:**
- Expanded state is persisted to `corepath-command-center-expanded` in localStorage
- Opens via `corepath:open-command-center` CustomEvent from notifications and bell
- Supports section-scroll via payload `{ section: "goals" | "missions" | "planner" | "achievements" | "analytics" }`

**Friction points:**
- ⚠️ **Same 30+ panel explosion issue** as JourneyProfileCard
- ⚠️ **No virtualization** — all panels render at once
- ⚠️ **Command center and JourneyProfileCard duplicate ~200 lines** of identical panel rendering logic

---

## 2. Returning User Journey

### 2.1 Resume Quiz (`/quiz`)

**Path:** Return → `/quiz`

**Flow:**
1. `QuizShell` loads → detects existing `QuizSession` in localStorage
2. Shows "Resume previous quiz?" dialog with options: Resume / Restart
3. On resume, restores to `session.pos` (last answered question)
4. On completion, same flow as first-time user

**Key observations:**
- Inactive sessions are cleaned up (no answers → session cleared)
- `QuizResumeCenter` also shows resume option on JourneyProfileCard

**Friction points:**
- ⚠️ **Resume dialog assumes user knows where they left off** — no preview of remaining questions
- ⚠️ **No "remind me later" option** — user must either resume or restart

### 2.2 History Revisit

**Path:** Home → Scroll to `QuizHistoryPanel` or `RecentCareerHistoryPanel`

**Flow:**
1. `QuizHistoryPanel` loads `loadQuizHistory()` → renders past quiz results
2. Each entry links to `/recommendation?results=...` with that quiz's match data
3. `RecentCareerHistoryPanel` loads `viewedCareerHistory` from journey memory
4. Each entry links back to `/careers/{id}` with "Reopen" button
5. `ComparisonHistoryPanel` loads comparison history → links to `/careers/compare?careerA=X&careerB=Y`

**Key observations:**
- History panels return `null` when empty — no visible placeholder
- QuizHistoryPanel shows "Clear all" button with confirmation dialog
- RecentCareerHistoryPanel supports individual entry deletion

**Friction points:**
- ⚠️ **History panels are buried deep** on the home page and JourneyProfileCard
- ⚠️ **No search** across quiz history — user must scroll through entries
- ⚠️ **Deleted entries are gone permanently** — no undo

### 2.3 Timeline (`/insights`)

**Path:** Header → `/insights` or Command Center → "View timeline"

**Flow:**
1. `InsightDetailClient` loads journey data
2. Shows aggregated timeline of events
3. Links back to `/insights` list and `/careers`

**Key observations:**
- `/insights` page shows list of intelligence insights
- `/insights/[slug]` shows detail for a specific insight
- Links from timeline entries back to relevant careers

**Friction points:**
- ⚠️ **Timeline is static** — no replay feature on this page (replay is only on JourneyProfileCard)
- ⚠️ **No filtering** — all event types mixed together

### 2.4 Notifications

**Path:** Header `NotificationBell` → dropdown → click notification → action

**Flow:**
1. `NotificationBell` polls every 60s for unread count
2. Dropdown shows top 5 notifications
3. Clicking a notification:
   - If `notificationSection()` returns a section name → dispatches `corepath:open-command-center` with section payload → opens Command Center scrolled to that section
   - If notification has `actionHref` → navigates directly to that URL
4. `NotificationPanel` on home page lists all notifications with same action logic

**Key observations:**
- 7 signal types: missedDailyMission, streakAtRisk, goalBehindSchedule, weeklyPlanIncomplete, newAchievementUnlocked, inactiveUser, careerDriftDetected
- Notifications auto-resolve when trigger condition clears
- Max 50 stored, deduplicated by signal type

**Friction points:**
- ⚠️ **Notifications that open Command Center are disruptive** — the user may not expect a full dashboard overlay
- ⚠️ **No push notifications** — only visible when user is on the site
- ⚠️ **"View all" in bell dropdown links to `/`** not a dedicated notifications page

### 2.5 Workspace Continuation

**Path:** Return → Home → JourneyActionPanel → "Continue workspace" → `/careers/{id}`

**Flow:**
1. `JourneyActionPanel` generates actions from current data state
2. Top priority: "Continue workspace" → links to `/careers/{id}`
3. Other actions: resume roadmap, revisit comparison, retake quiz, continue session, resume analysis
4. Action panel returns `null` if no actions — no visible guidance

**Key observations:**
- Actions are computed via `useMemo` with empty dependency array (computed once)
- Actions prioritize based on data presence: workspace > comparisons > quiz history > session count

**Friction points:**
- ⚠️ **Actions never re-compute** unless component remounts (empty deps in `useMemo`)
- ⚠️ **No way to dismiss completed actions** — "retake quiz" persists after retake
- ⚠️ **Action panel returns `null`** when no actions — blank space where guidance should be

---

## 3. Power-User Journey

### 3.1 High Activity Users

**Profile:** Multiple quizzes (5+), frequent career visits, active workspace

**Behavior:**
- `JourneyReplayPanel` shows rich timeline with milestones
- `AchievementPanel` shows unlocked achievements, level progression
- `GrowthAnalyticsPanel` shows trends and patterns
- `ConfidencePanel` shows confidence evolution across sessions
- `PredictionFeedbackPanel` allows rating prediction accuracy

**Friction points:**
- ⚠️ **Performance degrades with activity** — more data = more localStorage reads per panel render
- ⚠️ **30+ panels load every time** — worse for power users with rich data
- ⚠️ **No data pagination in panels** — all history loaded at once

### 3.2 Heavy Explorers (10+ careers viewed)

**Profile:** Views many careers, makes comparisons, explores categories

**Behavior:**
- `RecentCareerHistoryPanel` shows 10 most recent careers
- `ComparisonHistoryPanel` shows all comparisons
- `CareerDriftDetected` notification fires when exploration focus < 30%
- `CommunitySignalsPanel` shows broader community data

**Friction points:**
- ⚠️ **Career history is capped at 10** — earlier visits silently dropped
- ⚠️ **No "favorites" feature** — user can't bookmark careers for later
- ⚠️ **Comparison history has no pagination** — all records loaded at once

### 3.3 Comparison Power User

**Profile:** Compares 5+ career pairs

**Behavior:**
1. `/careers/compare?careerA=X&careerB=Y` shows side-by-side comparison
2. Comparison results saved to `loadComparisonHistory()`
3. `JourneyReplayPanel` shows "Deep Comparer" milestone at 5+ comparisons
4. `CompareAnalytics` component visualizes comparison data

**Friction points:**
- ⚠️ **Compare page only supports 2 careers at a time** — no multi-comparison
- ⚠️ **No comparison history visualization** — just a list of past comparisons
- ⚠️ **Compare page has no "explore alternatives" CTA** — dead end after comparison

### 3.4 Multiple Quiz Taker

**Profile:** 10+ quiz completions

**Behavior:**
- `QuizHistoryPanel` shows all results with pagination (showAll toggle)
- `JourneyReplayPanel` shows milestones at 5, 10, 15, 20 quizzes
- `RecommendationEvolutionPanel` shows how recommendations changed over time
- `PersonalEvolutionPanel` tracks cognitive profile changes

**Friction points:**
- ⚠️ **Quiz history shows top 5 by default** — user must click "Show all" to see full history
- ⚠️ **No quiz comparison** — can't see how answers changed over time
- ⚠️ **Duplicate quizzes allowed** — no deduplication mechanism

---

## 4. Navigation Graph

### 4.1 Page-to-Page Route Map

```
Home (/)
├── /quiz
│   └── /recommendation?results=... (on quiz completion)
├── /careers
│   ├── /careers/{id} (click career card)
│   │   └── /careers (back link in breadcrumb)
│   └── /careers/compare?careerA=X&careerB=Y (click compare button)
│       └── /careers (back via browser or link)
├── /recommendation
│   ├── /careers/{id} (click "View Full Roadmap")
│   ├── /quiz (click "Retake")
│   └── /careers/compare?careerA=X&careerB=Y (click "Compare careers")
├── /insights
│   └── /insights/{slug} (click insight card)
├── /careers/compare (via header or footer link)
└── /admin/* (debug pages, not in main flow)
```

### 4.2 Navigation Trigger Inventory

| Trigger | Source Component | Target | Method |
|---|---|---|---|
| "Start career cognition" | Home (hero) | `/quiz` | `<Link>` |
| "Explore intelligence cards" | Home (hero) | `/careers` | `<Link>` |
| "Take your first quiz" | JourneyProfileCard (empty) | `/quiz` | `<a href>` |
| "Continue Quiz" | QuizResumeCenter | `/quiz` | `<Link>` |
| "Open Result" | QuizResumeCenter / QuizHistoryPanel | `/recommendation?results=...` | `<Link>` |
| "View Full Roadmap" | RecommendationContent | `/careers/{id}` | `<Link>` |
| "Compare careers" | RecommendationContent | `/careers/compare?careerA=X&careerB=Y` | `<Link>` |
| "Retake" | RecommendationContent | `/quiz` | `<Link>` |
| "Browse all career paths" | RecommendationContent | `/careers` | `<Link>` |
| Career card click | CareerCard | `/careers/{id}` | `<Link>` |
| "Reopen" | RecentCareerHistoryPanel | `/careers/{id}` | `<Link>` |
| "Continue exploring" | RecentCareerHistoryPanel | `/careers` | `<Link>` |
| "Revisit Comparison" | ComparisonHistoryPanel | `/careers/compare?careerA=X&careerB=Y` | `<Link>` |
| "Open Command Center" | CareerCommandCenter (collapsed) | toggle state | `onClick` |
| Notification action | NotificationPanel / NotificationBell | command center or URL | `CustomEvent` or `<Link>` |
| Footer links | Footer | `/careers`, `/quiz`, `/recommendation`, `/insights` | `<Link>` |
| Header logo | Header | `/` | `<Link>` |
| "Continue workspace" | JourneyActionPanel | `/careers/{id}` | `<Link>` |
| "Revisit comparison" | JourneyActionPanel | `/careers/compare?careerA=X&careerB=Y` | `<Link>` |
| "Retake quiz" | JourneyActionPanel | `/quiz` | `<Link>` |
| "Continue previous session" | JourneyActionPanel | `/recommendation` | `<Link>` |
| "Resume profile analysis" | JourneyActionPanel | `/recommendation` | `<Link>` |

### 4.3 Cross-Component Event Channels

| Event | Dispatched By | Listened By | Effect |
|---|---|---|---|
| `corepath:open-command-center` | NotificationPanel, NotificationBell | CareerCommandCenter, FloatingCommandCenter | Opens command center, optionally scrolls to section |
| `corepath:scroll-to-attribution` | ChangeAttributionPanel | JourneyProfileCard, CareerCommandCenter | Scrolls to attribution source with highlight |
| `corepath:error` | ErrorBoundary (componentDidCatch) | (logging sink) | Logs error details for analytics |

### 4.4 Navigation Loops

```
Loop 1: Quiz → Recommendation → Career → Command Center → Quiz
  /quiz → /recommendation → /careers/{id} → toggle command center → /quiz

Loop 2: Home → Career → Workspace → Home
  / → /careers/{id} → select career (workspace) → / (panels load)

Loop 3: Career → Compare → Career
  /careers/{careerA} → /careers/compare?careerA=X&careerB=Y → /careers/{careerA or careerB}
```

No circular infinite loops detected — all loops terminate naturally.

---

## 5. Dead-End Analysis

### 5.1 Pages with No Clear Next Action

| Page | Dead-End Risk | Severity |
|---|---|---|
| `/insights` | **High** — no CTA to take action on insights | 🔴 Critical |
| `/insights/[slug]` | **Medium** — only links back to `/insights` and `/careers` | 🟡 Warning |
| `/careers/compare` (no params) | **Medium** — empty state with no CTA to navigate to a career | 🟡 Warning |
| `/admin/*` | **Low** — admin pages, expected behavior | 🟢 Info |

### 5.2 Trapped Flows

1. **Career Comparison dead-end**: After viewing a comparison, the only exit is "Revisit Comparison" in history panels. No "explore alternatives" or "back to results" button on the compare page itself.
2. **Insights dead-end**: `/insights` shows a list of insights. Clicking one shows detail (`/[slug]`). From detail, user can only go back to `/insights` or browse `/careers`. No action integration.
3. **Admin pages dead-end**: `/admin/debug`, `/admin/accessibility`, `/admin/insights` have no navigation back to main app flow.

### 5.3 Duplicate Routes

- `/insights` and `/insights/[slug]` — separate pages but content overlaps with JourneyProfileCard panels
- Home page `/` renders the same `JourneyProfileCard`, `NotificationPanel`, `RecentCareerHistoryPanel` that also appear in `RecommendationContent`

### 5.4 Missing Back-Navigation

- Recommendation page has no back-to-quiz link (only a retake button that restarts)
- Career detail page has no breadcrumb showing the path from recommendation
- Compare page has no link back to the career that initiated the comparison

---

## 6. Dropoff Risk Analysis

### 6.1 High-Risk Abandonment Areas

#### 6.1.1 First Load — Information Overload (Risk: 🔴 Critical)

**Problem:** Home page loads 15+ panels simultaneously. Even with skeletons, the user sees dozens of loading states, empty states, and static cards.

**Symptoms:**
- 9 panels render empty states on first visit
- 30+ panels mount when scrolling to JourneyProfileCard
- Command center shows 30+ panels when expanded

**Estimated dropoff:** **~40%** (guesstimate based on panel density) — most users will not scroll past the first few sections.

#### 6.1.2 Quiz Abandonment (Risk: 🟡 High)

**Problem:** 15-20 questions with no skip option, no estimated time, no save indicator.

**Symptoms:**
- No "save and exit" visible to user
- No progress indicator early in flow
- No skip option for difficult questions

**Estimated dropoff:** **~25%** (guesstimate based on quiz length without visible save indicators) — users may abandon mid-quiz if it feels too long.

#### 6.1.3 Recommendation Page Scroll Fatigue (Risk: 🟡 High)

**Problem:** Recommendation page renders 15+ panels vertically. After the primary match, the user must scroll through skill gap, profile analyzer, confidence, workspace, evolution, journey profile, and personal insights panels.

**Symptoms:**
- User reaches primary career match → drops off before seeing workspace option
- Secondary matches are buried at bottom of page

**Estimated dropoff:** **~35%** (guesstimate based on scroll depth required) — users see the primary match and leave before exploring further.

#### 6.1.4 Empty States (Risk: 🟡 Medium)

**Problem:** Many panels return `null` when no data is available, creating blank gaps in the layout.

**Affected panels:**
- `RecentCareerHistoryPanel` → `null` (blank gap)
- `JourneyTimelinePanel` → `null` (blank gap)
- `WeeklyReflectionPanel` → `null` (blank gap)
- `GoalTrackerPanel` → `null` (blank gap)
- `NotificationPanel` → `null` (blank gap)
- `ComparisonHistoryPanel` → `null` (blank gap)
- `QuizHistoryPanel` → `null` (blank gap)
- `JourneyReplayPanel` → `null` (blank gap)
- `JourneyActionPanel` → `null` (blank gap)
- `QuizResumeCenter` → `null` (blank gap)

**Estimated dropoff:** **~15%** (guesstimate based on visual gap frequency) — users may perceive a broken or incomplete page.

#### 6.1.5 Command Center Panel Explosion (Risk: 🟠 Warning)

**Problem:** Expanding the command center mounts 30+ intelligence panels at once. Each panel:
- Reads localStorage independently (30+ reads)
- Renders skeleton → content transition
- Computes derived data from multiple data sources

**Performance impact:**
- ~30 localStorage reads on expand
- Potential layout thrashing
- CPU-heavy renders on low-end devices

**Estimated dropoff:** **~20%** (guesstimate based on panel count vs. attention span) — users may close the command center immediately without exploring.

### 6.2 Cognitive Load Analysis

| Stage | Panels Visible | Data Sources Loaded | Cognitive Load |
|---|---|---|---|
| Home (first load) | 15+ panels | 10+ localStorage reads | 🔴 Very High |
| Quiz | 1 panel (QuizShell) | 2-3 reads | 🟢 Low |
| Recommendation | 15+ panels | 15+ reads | 🔴 Very High |
| Career detail | 6 panels | 5+ reads | 🟡 Medium |
| Journey/Profile | 30+ panels | 30+ reads | 🔴 Critical |
| Command Center | 30+ panels | 30+ reads | 🔴 Critical |

### 6.3 Mobile Dropoff Risk (Risk: 🟠 Medium)

**Observations from code:**
- Components use responsive classes (`sm:`, `md:`, `lg:`)
- Home page uses `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
- JourneyProfileCard uses `md:grid-cols-2`, `lg:grid-cols-[1.5fr_1fr]`
- CareerCommandCenter uses `sm:flex-row`, `sm:grid-cols-2`, `lg:grid-cols-3`

**Risk factors:**
- 30+ panels on mobile = endless scrolling
- Command center grid collapses to single column on mobile
- Touch interactions on radar charts may be imprecise
- No mobile-specific navigation optimizations

---

## 7. UX Recommendations

### 7.1 Critical (Must Fix)

| # | Recommendation | Impact | Effort |
|---|---|---|---|
| 1 | **Lazy-load panels below the fold** — Render only visible panels, load more on scroll (intersection observer) | Reduces initial render from 30+ panels to 5-8 | Medium |
| 2 | **Add breadcrumb navigation** — Show "Recommendation → Career → Workspace" path on detail pages | Reduces disorientation for returning users | Low |
| 3 | **Consolidate duplicate panel rendering** — Extract shared panel stack into a single component used by both JourneyProfileCard and CareerCommandCenter | Eliminates ~200 lines of duplication | Low |
| 4 | **Add "Continue" CTAs on dead-end pages** — `/insights` needs a "Apply insight to your career" button; `/careers/compare` needs "Explore more careers" | Reduces dead-end dropoff | Low |
| 5 | **Cache localStorage reads** — Memoize or batch localStorage reads to avoid 30+ individual reads on panel mount | Reduces storage I/O by ~70% | Medium |

### 7.2 High Priority

| # | Recommendation | Impact | Effort |
|---|---|---|---|
| 6 | **Show quiz time estimate** — Display "5 min remaining" before quiz starts and during quiz | Reduces quiz abandonment | Low |
| 7 | **Add "Skip question" to quiz** — Allow skipping with option to return | Reduces quiz friction | Low |
| 8 | **Surface history panels higher** — Move QuizHistoryPanel and RecentCareerHistoryPanel above the fold on home page | Improves returning user experience | Low |
| 9 | **Add favorite/bookmark careers** — Allow users to bookmark careers for quick access | Improves power-user workflow | Medium |
| 10 | **Add comparison history visualization** — Show a graph of past comparisons rather than a flat list | Improves comparison UX | Medium |

### 7.3 Medium Priority

| # | Recommendation | Impact | Effort |
|---|---|---|---|
| 11 | **Add `"useMemo` optimization to JourneyActionPanel** — Re-compute actions when data changes (add deps) | Fixes stale action recommendations | Low |
| 12 | **Replace `null` returns with subtle placeholders** — Show a thin "No data yet" bar instead of blank gaps | Improves layout consistency | Low |
| 13 | **Add scroll-to-top on recommendation page mount** — User lands at top, not mid-page | Improves first render experience | Low |
| 14 | **Add undo for history deletions** — Provide "Undo" toast when deleting quiz/comparison/career history | Reduces accidental data loss | Low |
| 15 | **Add search to quiz history** — Allow searching past results by career name or date | Improves power-user UX | Medium |

### 7.4 Lower Priority

| # | Recommendation | Impact | Effort |
|---|---|---|---|
| 16 | **Add "Save and exit" button to quiz** — Visible indicator that progress is saved | Builds user trust | Low |
| 17 | **Add breadcrumb to career detail page** — Show "Home > Careers > {Career Name}" | Improves navigation clarity | Low |
| 18 | **Create dedicated notifications page** — `/notifications` instead of "View all" linking to `/` | Improves notification UX | Low |
| 19 | **Add mobile bottom navigation** — Persistent nav bar on mobile for key routes | Improves mobile UX | Medium |
| 20 | **Add pull-to-refresh on mobile** — Refresh data without finding reload button | Improves mobile UX | Low |

---

## 8. Scores

### 8.1 Navigation Clarity Score: **6.2 / 10**

| Criterion | Score | Notes |
|---|---|---|
| Route consistency | 7/10 | RESTful routes, but no breadcrumbs |
| CTA visibility | 5/10 | Many pages lack clear next-step CTAs |
| Back-navigation | 5/10 | Browser back often loses context (e.g., recommendation → career → back) |
| Dead-end elimination | 4/10 | 3 pages identified as dead-ends |
| Cross-page relationships | 7/10 | Related pages are linked (career ↔ compare, quiz ↔ recommendation) |
| Navigation feedback | 8/10 | Links are visually clear, hover states present |
| Mobile navigation | 5/10 | No mobile nav bar, relies on browser back |

### 8.2 User Friction Score: **5.8 / 10** (lower is better)

| Friction Source | Score | Notes |
|---|---|---|
| Information overload | 3/10 | 30+ panels on journey/command center |
| Empty states | 4/10 | 10 panels return `null` creating gaps |
| Quiz friction | 7/10 | No skip, no time estimate, no visible save |
| Performance impact | 4/10 | 30+ localStorage reads per page |
| Mobile experience | 6/10 | Responsive but not optimized |
| Learning curve | 5/10 | Many panels, unclear hierarchy |
| Action clarity | 7/10 | "What should I do next?" is not always clear |

### 8.3 Complexity Score: **8.5 / 10**

| Metric | Value |
|---|---|
| Routes (pages) | 10+ |
| Components | 90+ |
| Data engines | 86 files |
| Navigation triggers | 25+ unique links/events |
| Cross-component events | 3 CustomEvent channels |
| localStorage reads per page load | 15-30 |
| Panels on single page (max) | 30+ |
| UI states per panel (avg) | 3 (loading, data, empty) |

### 8.4 Overall User Flow Health: **6.2 / 10**

**Key Strengths:**
- Comprehensive navigation coverage — most pages link to related pages
- Consistent UI patterns across panels
- Cross-component events provide rich interactivity
- JourneyActionPanel intelligently prioritizes actions

**Critical Weaknesses:**
- 30+ panel explosion on journey & command center pages
- 10 panels return `null` creating layout gaps
- Dead-end pages with no clear next action
- No breadcrumb navigation for contextual awareness
- Quiz lacks skip/time-estimate features

---

*This report was generated by deep analysis of the CorePath codebase. No code modifications were made.*
