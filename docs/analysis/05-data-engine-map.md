# Data Engine Map

> Generated: May 27, 2026
> Project: CorePath

---

## 1. Engine Inventory

| Category | File Count | Approx. LOC |
|---|---|---|
| Core data engines | 86 files (incl. tests) | ~12,000 |
| Quiz system | 8 files | ~1,500 |
| Career intelligence | 15 files | ~2,500 |
| User journey | 5 files | ~1,200 |
| Behavior & learning | 6 files | ~800 |
| Forecasting & predictions | 6 files | ~1,000 |
| Workspace & execution | 7 files | ~1,200 |
| Memory & adaptation | 5 files | ~800 |
| Infrastructure | 8 files | ~1,000 |
| Configuration | 5 files | ~500 |
| Tests | 9 files | ~1,200 |

---

## 2. Engine Type Classification

### A. Source Engines (generate raw data)
These engines produce primary data from user interaction and do not depend on other engines.

| Engine | Input | Output | Storage Key |
|---|---|---|---|
| `quiz.ts` | User answers → trait scores | Match results | — |
| `quiz-enhanced.ts` | Trait scores + profile | EnhancedProfile | — |
| `quiz-session.ts` | Session state | Quiz state | `corepath_quiz_session` |
| `quiz-history.ts` | Completed quizzes | History entries | `corepath_quiz_history` |
| `journey-memory.ts` | All events | JourneyProfile | `corepath_journey_memory` |
| `career-workspace.ts` | Career selection, milestones | CareerWorkspace | `corepath_workspace_*` |
| `career-goals.ts` | Goal setting | GoalState | `corepath-goal-state` |
| `achievement-engine.ts` | Events → XP | Achievements | `corepath_achievements` |
| `daily-missions.ts` | Date-based missions | DailyMission | `corepath_daily_missions` |
| `weekly-reflection.ts` | Weekly data | WeeklySummary | `corepath_weekly_reflection` |
| `notification-engine.ts` | System events | Notifications | `corepath_notifications` |
| `engagement-signals.ts` | User activity | Engagement data | `corepath_engagement` |

### B. Analysis Engines (process source data)
These engines read from source engines or storage and produce derived insights.

| Engine | Reads From | Produces |
|---|---|---|
| `behavior-patterns.ts` | journey-memory | BehaviorPatterns |
| `learning-style.ts` | journey-memory, quiz-enhanced | LearningStyle |
| `learning-friction.ts` | journey-memory | LearningFriction |
| `skill-gap.ts` | careers, quiz-enhanced | SkillGapResult |
| `profile-analyzer.ts` | careers, skill-gap | ProfileAnalysis |
| `career-matching.ts` | quiz, careers | CareerMatch[] |
| `career-alignment.ts` | career-workspace | AlignmentScore |
| `career-momentum.ts` | journey-memory | MomentumScore |
| `career-progress.ts` | career-workspace | CareerProgress |
| `career-evolution.ts` | careers, quiz-history | CareerEvolution |
| `career-identity.ts` | journey-memory | CareerIdentity |
| `confidence-engine.ts` | journey-memory | ConfidenceInsights |
| `change-attribution.ts` | journey-memory | ChangeAttribution |

### C. Predictive Engines (project forward)
These engines use historical data to predict future outcomes.

| Engine | Reads From | Produces |
|---|---|---|
| `predictive-insights.ts` | journey-memory, behavior-patterns | Predictions |
| `future-self.ts` | career-matching, behavior-patterns | FutureScenarios |
| `growth-forecast.ts` | career-workspace, progress | GrowthForecast |
| `growth-analytics.ts` | journey-memory, achievements | GrowthAnalytics |
| `recommendation-evolution.ts` | quiz-history, journey-memory | EvolvingRecommendations |
| `decision-readiness.ts` | multiple | Readiness score |
| `decision-priority.ts` | career-goals, missions | Priority matrix |
| `decision-confidence.ts` | multiple | Confidence score |

### D. Synthesis Engines (combine multiple sources)
These engines aggregate across engine outputs.

| Engine | Source Engines | Produces |
|---|---|---|
| `intelligence-synthesis.ts` | All prediction + analysis engines | SynthesisReport |
| `coaching-intelligence.ts` | behavior, learning, confidence | CoachingAdvice |
| `insight-vault.ts` | All analysis engines | StoredInsights |
| `memory-evolution.ts` | journey-memory, achievements | MemoryEvolution |
| `adaptive-self-correction.ts` | execution, confidence | SelfCorrectionActions |
| `adaptive-roadmap.ts` | career-workspace, skill-gap | AdaptiveSteps |
| `uniqueness-intelligence.ts` | profile, behavior | UniquenessScore |

### E. Utility Engines (infrastructure)

| Engine | Purpose |
|---|---|
| `safe-storage.ts` | localStorage wrapper with in-memory fallback + corruption recovery |
| `sanitize.ts` | Input sanitization helpers |
| `safe-context.ts` | Safe context extraction |
| `shared-context.ts` | Cross-component shared state |
| `analytics-events.ts` | Event logging (console dispatching) |
| `performance-debug.ts` | Performance monitoring helpers |
| `storage-health.ts` | Storage integrity checks |
| `system-config.ts` | System-level configuration |
| `pipeline.ts` | Data pipeline orchestration |

---

## 3. Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        STORAGE LAYER                             │
│  localStorage ← safe-storage.ts ← storage-health.ts             │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SOURCE ENGINES                                │
│  quiz.ts ─► quiz-enhanced.ts ─► journey-memory.ts                │
│  quiz-session.ts ─► quiz-history.ts                               │
│  career-workspace.ts ─► career-goals.ts                           │
│  achievement-engine.ts ─► daily-missions.ts                       │
│  notification-engine.ts ─► engagement-signals.ts                  │
│  weekly-reflection.ts                                             │
└─────────────────────────────────────────────────────────────────┘
          │                    │                     │
          ▼                    ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ ANALYSIS ENGINES  │ │ PREDICTIVE       │ │ SYNTHESIS ENGINES     │
│                    │ │ ENGINES           │ │                        │
│ behavior-patterns  │ │ predictive-insights│ │ intelligence-synthesis│
│ learning-style     │ │ future-self       │ │ coaching-intelligence  │
│ skill-gap          │ │ growth-forecast   │ │ insight-vault          │
│ career-matching    │ │ decision-*        │ │ memory-evolution       │
│ profile-analyzer   │ │ recommendation-   │ │ adaptive-self-         │
│ career-alignment   │ │   evolution       │ │   correction           │
│ career-momentum    │ │                   │ │ adaptive-roadmap       │
│ career-evolution   │ │                   │ │ uniqueness-intelligence│
│ careeer-identity   │ │                   │ │                        │
│ confidence-engine  │ │                   │ │                        │
│ change-attribution │ │                   │ │                        │
└──────────────────┘ └──────────────────┘ └──────────────────────┘
          │                    │                     │
          ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT LAYER                               │
│  CareerCommandCenter ─► 7 direct data calls                       │
│  JourneyProfileCard ─► 1-2 direct data calls                      │
│  All Panels ─► Respective engines                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Feedback Loops

### Loop 1: Quiz → Memory → Behavior → Predictions
```
User takes quiz → quiz-session saves → journey-memory records
  → behavior-patterns analyzes → predictive-insights forecasts
  → components render predictions → user acts → quiz again
```

### Loop 2: Workspace → Achievements → Missions → Engagement
```
Career selected → workspace tracks milestones → achievements unlock
  → mission completion → engagement pulse calculates
  → next action recommended → user advances phase
```

### Loop 3: Self-Correction → Execution → Confidence
```
Action attempted → adaptive-self-correction evaluates
  → adjusts execution mode → confidence recalculates
  → next action adjusted based on past performance
```

### Loop 4: Notifications → Command Center → Actions
```
System generates notification → unread count triggers
  → user opens command center → views next action
  → completes action → notification cleared
```

---

## 5. Engine Risk Areas

### 🔴 HIGH — critical path engines

| Engine | Risk | Reason |
|---|---|---|
| `safe-storage.ts` | HIGH | Every engine depends on it; corruption affects all |
| `journey-memory.ts` | HIGH | Central data store; 10+ engines read from it |
| `career-workspace.ts` | HIGH | 7+ components depend on workspace state |
| `quiz-enhanced.ts` | HIGH | Profile calculation used by matching + predictions |

### 🟡 MEDIUM — complex analytics

| Engine | Risk | Reason |
|---|---|---|
| `intelligence-synthesis.ts` | MED | Combines 10+ engine outputs; error cascade risk |
| `coaching-intelligence.ts` | MED | Multiple branching logic paths |
| `adaptive-self-correction.ts` | MED | Self-referential (reads confidence it helped generate) |
| `career-matching.ts` | MED | Large matrix operations on 95+ careers |

### 🟢 LOW — self-contained

| Engine | Risk | Reason |
|---|---|---|
| `weekly-reflection.ts` | LOW | Single-purpose, small dataset |
| `daily-missions.ts` | LOW | Date-driven, no chain dependencies |
| `notifications.ts` | LOW | Isolated event system |
| `sanitize.ts` | LOW | Pure utility functions |

---

## 6. Storage Key Map

| Key | Engine | Read Frequency | Write Frequency |
|---|---|---|---|
| `corepath_journey_memory` | journey-memory | VERY HIGH (15+ panels) | MED |
| `corepath_quiz_session` | quiz-session | LOW | MED |
| `corepath_quiz_history` | quiz-history | MED | LOW |
| `corepath_notifications` | notification-engine | HIGH | MED |
| `corepath_workspace_*` | career-workspace | MED | MED |
| `corepath-goal-state` | career-goals | LOW | LOW |
| `corepath-compare-basket` | comparison-history | LOW | LOW |
| `corepath_analytics` | analytics-events | LOW | MED |
| `corepath_daily_missions` | daily-missions | MED | MED |
| `corepath_weekly_reflection` | weekly-reflection | MED | LOW |
| `corepath_achievements` | achievement-engine | MED | MED |
| `corepath-command-center-expanded` | safe-storage (direct) | LOW | LOW |
| `corepath_engagement` | engagement-signals | LOW | LOW |

---

## 7. Engine Complexity Score

| Metric | Score |
|---|---|
| **Total engine files** | 86 |
| **Engine cross-dependencies** | HIGH (10+ read from journey-memory) |
| **Self-referential engines** | 1 (adaptive-self-correction) |
| **Feedback loops** | 4 major loops |
| **Storage read amplification** | HIGH (15+ independent reads per page load) |
| **Test coverage** | 9 test files for 86 engines (~10%) |

**Overall Engine Complexity: 8.5 / 10**
