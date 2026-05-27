# Performance Analysis

> Generated: May 27, 2026
> Project: CorePath

---

## 1. Bundle Size Analysis

### Entry Points
| Page | Estimated JS | Estimated CSS |
|---|---|---|
| `/` (Home) | ~150KB (40+ panels) | ~50KB |
| `/quiz` | ~60KB | ~20KB |
| `/recommendation` | ~200KB (45+ panels) | ~50KB |
| `/careers` | ~80KB | ~25KB |
| `/careers/[id]` | ~180KB (35+ panels) | ~50KB |

**Note:** These are estimates based on component count. All panels are eagerly imported — no `next/dynamic` used.

### Largest Dependencies (from package.json)
| Package | Estimated Size | Used In |
|---|---|---|
| `framer-motion` | ~32KB gzipped | FloatingCommandCenter only |
| `next` | Framework | All pages |
| `react` / `react-dom` | Framework | All pages |
| `recharts` | ~20KB gzipped | ProfileRadarChart |

**Majority of bundle is application code** (~85% custom components, ~15% libraries).

---

## 2. Render Performance

### Panel Mount Cascades

**Home page render chain (worst case):**
```
RootLayout → Header + Footer (static)
  → page.tsx renders:
    → FloatingCommandCenter (Framer Motion)
    → GuidedOnboarding
    → RecentCareerHistoryPanel
    → JourneyTimelinePanel → JourneyActionPanel
    → CareerProgressPanel
    → AchievementPanel
    → DailyMissionPanel
    → WeeklyReflectionPanel
    → GoalTrackerPanel
    → NotificationPanel
    → CommunitySignalsPanel
    → QuickStartPanel
    → TrustPanel
    → FeedbackPanel
    → 4x CareerCard
  Total: ~15 panels + sub-panels
```

**Recommendation page render chain (worst case):**
```
RootLayout → Header + Footer
  → RecommendationContent:
    → SkillGapPanel
    → ProfileAnalyzerPanel
    → PathExamplesPanel
    → CommunitySignalsPanel
    → TrustPanel
    → ProjectRecommendationPanel
    → FeedbackPanel
    → ConfidencePanel
    → CareerWorkspacePanel
      → 12+ sub-panels
    → JourneyProfileCard
      → 43 sub-panels
    → PersonalInsightsPanel
  Total: ~60+ panels
```

### Render Costs

| Operation | Estimated Cost | Notes |
|---|---|---|
| 43 panels rendering for JourneyProfileCard | HIGH | ~30ms per panel ≈ 1.3s layout |
| 32 panels rendering for CareerCommandCenter | HIGH | ~1s layout |
| 14 panels for CareerWorkspacePanel | MED | ~400ms layout |
| 40+ useEffect calls on mount | MED | ~2-5ms each, ~200ms total |
| 15+ independent localStorage reads | MED | ~1ms each, serialized |
| Framer Motion animations | LOW | Single component |

---

## 3. Hydration Risks

| Risk | Location | Severity |
|---|---|---|
| **Large client component tree** | Recommendation page (60+ client panels) | HIGH — hydration could block for 500ms+ |
| **Multiple "use client" boundaries** | 85+ client components | HIGH — increased JS bundle |
| **Server component under-utilization** | Only 6 server components | LOW — most content is dynamic anyway |
| **Hydration mismatch** | localStorage data vs server render | MED — data-dependent content will always differ |

---

## 4. Memory Leak Potential

| Risk | Location | Status |
|---|---|---|
| **Uncleaned intervals** | CareerCommandCenter (60s refresh) | ✅ Cleaned on unmount |
| **Event listeners not removed** | All CustomEvent listeners | ✅ Cleaned in useEffect return |
| **Large component trees** | JourneyProfileCard (43 panels) | 🟡 Memory grows with panel count |
| **Blob URLs** | Export functions | ✅ Revoked after download |
| **Image/asset leaks** | None | 🟢 |

---

## 5. Scroll Performance

| Page | Content Height | Overflow | Risk |
|---|---|---|---|
| Home | ~5000px+ (15 panels) | Vertical scroll | MED — long scroll |
| Recommendation | ~12000px+ (60+ panels) | Very long scroll | HIGH — extreme scroll length |
| Career detail | ~6000px+ (20+ panels) | Vertical scroll | MED |
| Quiz | ~1500px | Minimal scroll | LOW |
| Command Center expanded | ~15000px+ (32 panels) | Extreme scroll | 🔴 HIGH — no section collapsing |
| JourneyProfileCard expanded | ~12000px+ (43 panels) | Extreme scroll | 🔴 HIGH |

### Missing Virtualization
- No `<VirtualList>`, `IntersectionObserver`, or lazy loading
- All panels render immediately regardless of viewport position
- Above-fold panels wait for all panels to render
- No `react-window` or `react-virtuoso` in dependencies

---

## 6. render Optimization Opportunities

| Optimization | Impact | Complexity |
|---|---|---|
| **`React.lazy()` for panels below fold** | HIGH (reduce initial bundle 60%) | LOW |
| **`next/dynamic` with `ssr: false`** | HIGH (skip SSR for non-critical) | LOW |
| **Memoize panel list rendering** | MED (skip re-renders) | LOW |
| **IntersectionObserver lazy loading** | HIGH (delay 30/43 panels) | MED |
| **Consolidate localStorage reads** | MED (reduce from 15 to 1) | MED |
| **Remove unused ExportMenu duplicate** | LOW (save ~200 lines) | LOW |
| **`useMemo` for data processing** | MED (in 10+ panels) | LOW |

---

## 7. Loading State Analysis

| Loading Pattern | Frequency | UX Quality |
|---|---|---|
| Skeleton panels | ~20 components | GOOD — smooth skeleton animation |
| `null` return during loading | ~10 components | BAD — layout collapse/gaps |
| No loading indicator | ~5 components | BAD — perceived stutter |
| Full-page load | Quiz (single calculation) | GOOD — fast |

### Skeleton Animation Coverage
- ✅ CareerCommandCenter
- ✅ JourneyProfileCard
- ✅ CareerWorkspacePanel
- ✅ Most intelligence panels
- ❌ JourneyTimelinePanel (returns `null`)
- ❌ Some smaller panels return null

---

## 8. Performance Score

| Metric | Score | Notes |
|---|---|---|
| **Initial load time** | 5/10 | 40+ panels eagerly loaded |
| **Render performance** | 4/10 | No virtualization, 60+ panels cascading |
| **Bundle optimization** | 3/10 | No dynamic imports |
| **Hydration** | 5/10 | All client components hydrate on load |
| **Memory management** | 7/10 | Clean intervals/events |
| **Scroll performance** | 3/10 | Extreme scroll lengths, no virtualization |
| **Loading states** | 6/10 | Skeletons common, but gaps exist |

**Overall Performance Score: 4.7 / 10**
