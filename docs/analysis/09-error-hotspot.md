# Error Hotspot Report

> Generated: May 27, 2026
> Project: CorePath

---

## 1. Hook Order & Conditional Hook Risks

### Status: ✅ No hook order issues detected

All 80+ components with hooks use consistent ordering. The AdaptiveRoadmapPanel had a conditional hook issue but it was fixed with a mounted state guard.

### Verified Safe Patterns
```typescript
// ✅ All hooks called unconditionally before any early return
const [state, setState] = useState(null);
useEffect(() => { load(); }, []);
// ... conditional rendering after hooks
if (loading) return <Skeleton />;
```

### Exception to Verify
- `JourneyTimelinePanel` returns `null` on empty — hooks are called before any return ✅
- `CareerWorkspacePanel` computes `roadmap` and `adaptiveSteps` BEFORE early return — intentional ✅

---

## 2. State Race Conditions

### Race Condition 1: Multiple setState in one useEffect
**File:** `JourneyProfileCard.tsx`
```typescript
useEffect(() => {
  // ...
  setJourney(memory);
  setProfile(updatedProfile);
  setLoaded(true);
}, [event, enhancedProfile]);
```
**Risk:** LOW — all setters are batched in React 18+.

### Race Condition 2: Data load vs. scroll
**File:** `CareerCommandCenter.tsx`
```typescript
useEffect(() => {
  load(); // async data load
  const interval = setInterval(load, 60_000);
  return () => clearInterval(interval);
}, [load]);

// Separate effect reads state set by load()
```
**Risk:** LOW — interval fires after first load completes.

### Race Condition 3: Persistent state vs temp state
**File:** `CareerCommandCenter.tsx`
```typescript
useEffect(() => {
  if (!isTempOpen) storage.set(EXPANDED_STORAGE_KEY, isExpanded);
}, [isExpanded, isTempOpen, initialised]);
```
**Risk:** 🟡 MED — `isTempOpen` might change before persist effect fires, potentially persisting unwanted state.

---

## 3. Unsafe Assumptions

### Assumption 1: SafeStorage always returns data
**Throughout:** All panels assume `loadJourneyMemory()` returns valid data.
**Risk:** LOW — safe-storage has fallback and corruption recovery.

### Assumption 2: Career exists in getCareerById
**File:** `CareerWorkspacePanel.tsx`
```typescript
const activeCareer = career ?? getCareerById(workspace.selectedCareerId);
```
**Risk:** 🟡 MED — if `selectedCareerId` is stale/wrong ID returns `undefined`; falls through gracefully but could cause silent nulls.

### Assumption 3: Workspace always has selectedCareerId
**Throughout:** Multiple components access `workspace.selectedCareer` properties.
**Risk:** LOW — guarded by `if (!workspace)` early return.

### Assumption 4: CustomEvent detail exists
**Throughout:**
```typescript
const detail = (e as CustomEvent).detail as { source?: string };
```
**Risk:** LOW — optional chaining not used but access is guarded.

### Assumption 5: HTML elements exist for scroll targets
**File:** `CareerCommandCenter.tsx`
```typescript
const el = document.getElementById(`section-${detail.source}`);
```
**Risk:** 🟡 MED — if element doesn't exist, `scrollIntoView` throws; surrounded by `if (el)` guard ✅.

---

## 4. Undefined/Null Risks

### Risk 1: CareerCommandCenter data spread
```typescript
const { workspace, goalState, missions, weekly, achievements, progress, unreadCount, topNotifications } = data ?? {};
```
**Risk:** LOW — destructured from `data ?? {}`, usage is guarded. But `achievements` is `undefined` in the `??` fallback.

### Risk 2: JourneyProfileCard profile spread
```typescript
const radarPoints = useMemo(() => {
  if (!enhancedProfile) return [];
  // ...
}, [enhancedProfile]);
```
**Risk:** LOW — guarded.

### Risk 3: Window undefined in SSR
- ✅ All localStorage access through `safe-storage` which guards against SSR
- ✅ CustomEvent dispatch only in `useEffect` (client-only)
- ❌ **Potential risk:** Next.js SSR server components that reference `window`

### Risk 4: Nested optional chaining
**Risk:** LOW — codebase doesn't use deeply nested optional chains that could fail.

---

## 5. try-catch Coverage

| Area | Coverage | Risk |
|---|---|---|
| safe-storage localStorage read | ✅ Wrapped | LOW |
| safe-storage localStorage write | ✅ Wrapped | LOW |
| Data engine calculations | ❌ Not wrapped | 🟡 MED — calculation errors propagate to component |
| Quiz result calculation | ❌ Not wrapped | 🟡 MED — could crash quiz flow |
| Event dispatch | ❌ Not wrapped | LOW — non-critical |
| Export file generation | ✅ Wrapped | LOW |
| JSON parse (from storage) | ✅ Wrapped | LOW |
| recharts/chart rendering | ❌ Not wrapped | LOW — recharts handles internally |

---

## 6. Component Error Boundaries

| Boundary | Coverage | Risk |
|---|---|---|
| **Root layout** | ✅ ErrorBoundary wraps all content | Protected |
| **Quiz page** | ✅ ErrorBoundary wraps QuizShell | Protected |
| **Recommendation page** | ✅ ErrorBoundary wraps content | Protected |
| **All other pages** | ❌ No ErrorBoundary | 🟡 MED — errors crash page |

**Coverage gap:** `/careers`, `/careers/[id]`, `/careers/compare`, `/insights`, `/insights/[slug]` have no ErrorBoundary.

---

## 7. Async/Await Error Handling

| Area | Pattern | Risk |
|---|---|---|
| Data engines | ✅ Synchronous (no async data) | LOW |
| API routes | ❌ No explicit error handler | 🟡 MED — unhandled rejections |

---

## 8. JSON Parsing Risks

| Location | Input | Risk |
|---|---|---|
| safe-storage.ts | localStorage value | ✅ Corruption recovery |
| quiz-session.ts | Session JSON | ✅ Graceful fallback |
| journey-memory.ts | Memory JSON | ✅ Graceful fallback |
| quiz-history.ts | History JSON | ✅ Graceful fallback |

---

## 9. Error Score

| Category | Score |
|---|---|
| **Hook order safety** | 10/10 |
| **Race condition risk** | 7/10 |
| **Unsafe assumptions** | 6/10 |
| **Null/undefined safety** | 6/10 |
| **try-catch coverage** | 5/10 |
| **Error boundary coverage** | 4/10 |
| **JSON parsing safety** | 8/10 |

**Overall Error Safety Score: 6.6 / 10**
