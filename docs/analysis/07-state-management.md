# State Management Report

> Generated: May 27, 2026
> Project: CorePath

---

## 1. State Architecture Overview

CorePath uses a **distributed state model** with no centralized state management:

| State Type | Mechanism | Scope |
|---|---|---|
| Persistent state | localStorage via `safe-storage.ts` | Cross-session, cross-page |
| Ephemeral state | `useState` hooks | Per-component |
| Derived state | `useMemo` / `useCallback` | Per-component |
| Cross-component | CustomEvent dispatch | Window-scope events |
| React context | Not used | — |
| URL state | Next.js search params | Limited (compare page) |

**There is no React Context, Redux, Zustand, or any centralized store.**

---

## 2. Hook Usage Summary

### useState Usage
| Component | State Variables | Count |
|---|---|---|
| CareerCommandCenter | data, isExpanded, isTempOpen, initialised, activeSection, showExportMenu | 6 |
| JourneyProfileCard | profile, journey, loaded, showExportMenu | 4 |
| CareerWorkspacePanel | workspace, nextAction, streak | 3 |
| JourneyTimelinePanel | groups, expandedPeriods | 2 |
| ActionSprintPanel | state, showDetails | 2 |
| ActionExecutionPanel | state, showDetails | 2 |
| BehaviorInsightsPanel | data, showDetails, expanded | 3 |
| Typical intelligence panel | data, expanded | 1-2 |
| **Total useState instances across all components** | **~120+** | |

### useEffect Usage
| Component | useEffects | Purposes |
|---|---|---|
| CareerCommandCenter | 7 | Init expanded, listen for events (2), load data (60s interval), auto-scroll, persist, extra event |
| JourneyProfileCard | 3 | Scroll-to-attribution listener, load journey data, event recording |
| CareerWorkspacePanel | 1 | Load workspace on mount/career change |
| JourneyTimelinePanel | 1 | Load timeline events on mount |
| QuizShell | 4 | Resume check, answer handling, result display, navigation |
| BehaviorInsightsPanel | 1 | Load behavior data on mount |
| AdaptiveRoadmapPanel | 1 | Load roadmap + stability guard |
| **Total useEffect instances** | **~45+** | |

### useMemo Usage
| Component | Count | Purpose |
|---|---|---|
| CareerCommandCenter | 2 | isNewUser, derived values |
| JourneyProfileCard | 1 | radarPoints |
| CareerWorkspacePanel | 1 | adaptiveSteps |
| AdaptiveRoadmapPanel | 1 | prioritized steps |
| **Total useMemo instances** | **~10+** | |

### useCallback Usage
| Component | Count | Purpose |
|---|---|---|
| CareerCommandCenter | 1 | load function |
| JourneyProfileCard | 1 | scrollToAttribution |
| ActionSprintPanel | 1 | handleToggle |
| **Total useCallback instances** | **~10+** | |

### useRef Usage
| Component | Purpose |
|---|---|
| CareerCommandCenter | ExportMenu ref (click-outside) |
| JourneyProfileCard | lastEventRef (duplicate detection), ExportMenu ref |
| JourneyTimelinePanel | Not used |
| **Total useRef instances** | **~5+** |

---

## 3. Data Loading Pattern

Every intelligence panel follows the same pattern:

```typescript
// Standard pattern — repeated in ~40 panels
const [data, setData] = useState<DataType | null>(null);

useEffect(() => {
  const loaded = loadSomeData();
  setData(loaded);
}, []);
```

**This means:**
- ~40 independent `useEffect` calls on initial page load
- Each triggers a separate `loadJourneyMemory()` or `getSafeStorage()` call
- Storage is parsed independently ~40 times
- No batching, caching, or shared loading state

---

## 4. localStorage Read Amplification

| Page | Storage Reads | Unique Keys | Risk |
|---|---|---|---|
| Home | ~15 | 6+ | MED |
| Quiz | ~5 | 4 | LOW |
| Recommendation | ~30 | 8+ | HIGH |
| Career detail | ~20 | 6+ | MED |
| Command Center expanded | ~35+ | 10+ | HIGH |
| JourneyProfileCard expanded | ~45+ | 8+ | HIGH |

**Primary bottleneck:** `loadJourneyMemory()` is called independently by:
- `CareerCommandCenter`
- `JourneyProfileCard`
- `JourneyTimelinePanel`
- `BehaviorInsightsPanel`
- `CareerMomentumPanel`
- `CareerProgressPanel`
- `AchievementPanel`
- `ConfidencePanel`
- `ComparisonHistoryPanel`
- `ChangeAttributionPanel`
- `PersonalEvolutionPanel`
- `LearningStylePanel`
- And ~10 more

---

## 5. Cross-Component State Sharing

### CustomEvent Channels (3 total)

| Event | Dispatched By | Listened By | Data |
|---|---|---|---|
| `corepath:open-command-center` | NotificationPanel, NotificationBell | CareerCommandCenter | Optional `{ section }` |
| `corepath:scroll-to-attribution` | ChangeAttributionPanel | CareerCommandCenter, JourneyProfileCard | `{ source, cause }` |
| `corepath:error` | ErrorBoundary | Global (console) | `{ component, error }` |

### Shared Data (no formal mechanism)

| Shared Concept | Mechanism | Risk |
|---|---|---|
| Journey events | localStorage → each component reads independently | High — no single source of truth per render |
| Quiz session | localStorage → quiz shell reads/writes | Low — single consumer |
| Notification count | localStorage → command center + notification bell both read | MED — possible stale count |
| Workspace state | localStorage → 3+ components read independently | MED — no invalidation |

---

## 6. State Synchronization Issues

### Issue 1: Stale Data
- Component A modifies localStorage → Component B renders with stale data
- No event bus to signal "storage updated"
- Query parameters not used for state sharing (except compare)

### Issue 2: Race Conditions
- Multiple `useEffect` setters in one render cycle
- `CareerCommandCenter` sets `isExpanded`, triggers auto-scroll, triggers persist — all in separate effects
- `JourneyProfileCard` sets `profile`, `journey`, `loaded` in one effect

### Issue 3: Redundant Computation
- `loadJourneyMemory()` called ~15 times on home page load
- Each call parses the same JSON from localStorage independently
- No cache layer between storage and components

---

## 7. Memoization Opportunities

| Location | Current | Opportunity |
|---|---|---|
| JourneyProfileCard | radarPoints useMemo | No further memo needed |
| CareerCommandCenter | isNewUser + derived useMemo | Could combine into single useMemo |
| CareerWorkspacePanel | adaptiveSteps useMemo | Minimal gain |
| Panel imports | Eager at module level | `React.lazy()` or `next/dynamic` for 40+ panels |
| Data loading | No caching | `useMemo` on data load function |

---

## 8. Hook Risk Assessment

| Risk | Location | Severity |
|---|---|---|
| **React.StrictMode double-mount** | All 40+ panels with useEffect(fn, []) | LOW — safe for read-only |
| **Stale closure in interval** | CareerCommandCenter (60s load) | LOW — load is stable callback |
| **useEffect infinite loop** | AdaptiveRoadmapPanel | FIXED — has mounted guard |
| **Conditional hooks** | None found | LOW |
| **Hook order issues** | None found | LOW |
| **Missing deps** | CareerCommandCenter scroll-to-attribution (eslint-disable) | LOW |
| **useEffect cleanup missing** | CareerCommandCenter persist effect | LOW |

**State Management Score: 4.5 / 10**
