# Recommendation Roadmap

> Generated: May 27, 2026
> Project: CorePath

---

## 1. Priority Matrix

| Priority | Count | Definition |
|---|---|---|
| 🔴 Critical | 3 | Blocks scale, causes data loss, or crashes |
| 🟡 High | 6 | Significant UX damage, performance degradation, or dev velocity |
| 🟢 Medium | 5 | Feature completeness, quality of life |
| ⚪ Low | 5 | Nice-to-have, future evolution |

---

## 2. 🔴 Critical Items

### C1. Add Schema Versioning to localStorage

| Property | Value |
|---|---|
| **Area** | Data layer — `safe-storage.ts` |
| **Impact** | HIGH — prevents data loss on schema changes |
| **Complexity** | LOW — add migration system |
| **Risk** | LOW — well-understood pattern |
| **Effort** | ~2 hours |

**Description:** All localStorage keys (`corepath_journey_memory`, `corepath_workspace_*`, etc.) have no version field. If the data schema changes, existing stored data becomes corrupt or throws parse errors. A versioned storage wrapper with migration functions is needed.

**Recommendation:** Add a `SCHEMA_VERSION` constant and migration registry to `safe-storage.ts`. Each storage key gets a version prefix. On read, check version and apply migrations sequentially.

---

### C2. Lazy-Load Panels Below the Fold

| Property | Value |
|---|---|
| **Area** | Components — JourneyProfileCard, CareerCommandCenter, CareerWorkspacePanel |
| **Impact** | HIGH — reduce initial render from 60+ panels to 8-10 |
| **Complexity** | MED — needs dynamic imports + intersection observer |
| **Risk** | LOW — pure optimization |
| **Effort** | ~4 hours |

**Description:** Both JourneyProfileCard (43 panels) and CareerCommandCenter (32 panels) render all sub-panels eagerly on mount. Use `next/dynamic` with `React.lazy()` and an `IntersectionObserver` to render panels only when they scroll into view.

**Recommendation:** Create a `LazyPanel` wrapper component:
```typescript
const LazyPanel = dynamic(() => import('./PanelName'), { 
  loading: () => <SkeletonPanel lines={3} />,
  ssr: false,
});
```

---

### C3. Consolidate Duplicate Code Between Hub Components

| Property | Value |
|---|---|
| **Area** | Components — CareerCommandCenter, JourneyProfileCard |
| **Impact** | MED — reduces codebase by ~200 lines |
| **Complexity** | LOW — extract to shared file |
| **Risk** | LOW — pure refactor |
| **Effort** | ~1 hour |

**Description:** `SkeletonPanel`, `SectionHeader`, `ExportMenu`, and 3 export helper functions are duplicated verbatim between CareerCommandCenter.tsx and JourneyProfileCard.tsx. Extract to `components/ui/SkeletonPanel.tsx`, `components/ui/SectionHeader.tsx`, and `components/ui/ExportMenu.tsx`.

---

## 3. 🟡 High Priority Items

### H1. Batch/Cache localStorage Reads

| Property | Value |
|---|---|
| **Area** | Data layer — `safe-storage.ts` / `journey-memory.ts` |
| **Impact** | HIGH — reduces 15+ reads to 1 |
| **Complexity** | MED — needs in-memory cache with invalidation |
| **Risk** | LOW — no behavioral change |
| **Effort** | ~3 hours |

**Description:** Every panel independently calls `loadJourneyMemory()` on mount, parsing the same JSON ~15 times per page load. Introduce a module-level cache that returns cached data within the same event loop tick.

**Recommendation:**
```typescript
let cache: JourneyMemory | null = null;
export function loadJourneyMemory(): JourneyMemory {
  if (cache) return cache;
  cache = parseFromStorage();
  return cache;
}
export function invalidateCache() { cache = null; }
```

---

### H2. Remove Dead Code (CareerComponents.tsx)

| Property | Value |
|---|---|
| **Area** | Components — `CareerComponents.tsx` |
| **Impact** | LOW — removes 330 unused lines |
| **Complexity** | LOW — delete file |
| **Risk** | LOW — never imported |
| **Effort** | ~15 minutes |

**Description:** `components/CareerComponents.tsx` (~330 lines) contains duplicate quiz and career matching components. It is never imported by any file.

---

### H3. Add Breadcrumb Navigation

| Property | Value |
|---|---|
| **Area** | UI — career detail, compare, insight pages |
| **Impact** | MED — improves navigation clarity |
| **Complexity** | LOW — reusable component |
| **Risk** | LOW |
| **Effort** | ~2 hours |

**Description:** Add breadcrumb trail to `/careers/[id]`, `/careers/compare`, `/insights/[slug]` showing: Home → Careers → [Career Name].

---

### H4. Add Empty States for Null-Returning Panels

| Property | Value |
|---|---|
| **Area** | Components — 10+ panels returning `null` |
| **Impact** | MED — eliminates layout gaps |
| **Complexity** | LOW — add placeholder |
| **Risk** | LOW |
| **Effort** | ~2 hours |

**Description:** Replace `return null` with consistent empty state component showing: "No data yet" + suggested next action (e.g., "Take a quiz to generate insights").

---

### H5. Add Error Boundaries to Remaining Pages

| Property | Value |
|---|---|
| **Area** | App — `/careers`, `/careers/[id]`, `/careers/compare`, `/insights`, `/insights/[slug]` |
| **Impact** | MED — prevents full page crash |
| **Complexity** | LOW — wrap page content |
| **Risk** | LOW |
| **Effort** | ~1 hour |

---

### H6. Add Auth Protection for Admin Routes

| Property | Value |
|---|---|
| **Area** | App — `/admin/*` |
| **Impact** | MED — security hardening |
| **Complexity** | LOW — middleware |
| **Risk** | LOW |
| **Effort** | ~30 minutes |

**Description:** Add simple auth check to prevent public access to `/admin/debug`, `/admin/insights`, `/admin/accessibility`.

---

## 4. 🟢 Medium Priority Items

### M1. Fix Double `saveQuizResult()` Call
- **Impact:** MED — prevents duplicate history entries
- **Complexity:** LOW — guard with session flag
- **Effort:** ~30 minutes

### M2. Add System-Preference Theme Detection
- **Impact:** LOW — respects user OS preference
- **Complexity:** LOW — `prefers-color-scheme` media query
- **Effort:** ~30 minutes

### M3. Add `IntersectionObserver` for Performance Monitoring
- **Impact:** MED — enables data-driven decisions
- **Complexity:** LOW — analytics hook
- **Effort:** ~1 hour

### M4. Add Toast/Snackbar for Export + Mission Completion Feedback
- **Impact:** LOW — confirms user action
- **Complexity:** LOW — simple toast component
- **Effort:** ~2 hours

### M5. Add Unit Tests for Top 10 Data Engines
- **Impact:** MED — improve test coverage from 10% to 25%
- **Complexity:** MED — mock localStorage
- **Effort:** ~4 hours

---

## 5. ⚪ Low Priority Items

| Item | Area | Effort |
|---|---|---|
| PDF export format | Export features | ~3 hours |
| Quiz answer-level analytics | Analytics | ~2 hours |
| i18n structure for localization | Infrastructure | ~8 hours |
| Manual career history editing | Profile | ~4 hours |
| CI/CD pipeline configuration | DevOps | ~2 hours |

---

## 6. Implementation Roadmap

### Phase 1: Safety & Stability (Week 1)
1. 🔴 **C1** Schema versioning for localStorage
2. 🟡 **H5** Error boundaries on remaining pages
3. 🟡 **H2** Remove dead code
4. 🟡 **H6** Admin route protection

### Phase 2: Performance (Week 2)
1. 🔴 **C2** Lazy-load panels below fold
2. 🟡 **H1** Batch localStorage reads

### Phase 3: Code Quality (Week 3)
1. 🔴 **C3** Consolidate duplicate components
2. 🟡 **H3** Breadcrumb navigation
3. 🟡 **H4** Empty state placeholders

### Phase 4: Polish (Week 4)
1. 🟢 M1 — M5 Medium items
2. ⚪ L1 — L5 Low items

---

## 7. Effort Estimate

| Phase | Hours | Panels | Data Engines |
|---|---|---|---|
| Phase 1 (Safety) | ~6h | 5 | 2 |
| Phase 2 (Performance) | ~7h | 5 | 1 |
| Phase 3 (Code Quality) | ~5h | 12 | 0 |
| Phase 4 (Polish) | ~12h | 8 | 5 |
| **Total** | **~30 hours** | **30** | **8** |

---

## 8. Risk vs. Impact Matrix

```
Impact
  ↑
10│  C1(7,10)     C2(4,10)
  │  H1(3,9)      H5(1,8)
  │  H4(2,8)
  │
 5│  H3(2,6)      M1(0.5,7)
  │  M2(0.5,4)    M5(4,6)
  │
 0│  L1-L5
  └─────────────────────────→ Complexity
  0    2     4     6     8   10

  C = Critical, H = High, M = Medium, L = Low
  (complexity, impact)
```

---

## 9. Recommendation Confidence Score

| Metric | Value |
|---|---|
| **Findings confidence** | 85% (based on actual code inspection) |
| **Impact estimates** | 75% (performance estimates are approximations) |
| **Effort estimates** | 70% (refactoring unknowns) |
| **Priority ordering** | 90% (critical items are clear) |

**Overall Confidence Score: 80%**
