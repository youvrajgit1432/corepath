# Missing Features Report

> Generated: May 27, 2026
> Project: CorePath

---

## 1. Missing UX Patterns

### Empty States
| Location | Current Behavior | Missing |
|---|---|---|
| `/insights` | Renders `LocalInsightsDashboard` with no data | "No insights yet — complete a quiz to generate insights" |
| `/careers/compare` (no params) | Empty compare view | Guidance to select careers first |
| `JourneyTimelinePanel` (no events) | Returns `null` | Empty state message + CTA to take quiz |
| Some intelligence panels (no data) | Returns `null` | Creates layout gaps, no visual placeholder |
| Quiz resume (no session) | No visible state | Should show "Start new quiz" instead of resume prompt |

### Loading States
| Location | Current Behavior | Missing |
|---|---|---|
| JourneyTimelinePanel | Returns `null` immediately | Skeleton animation while loading |
| ~10 intelligence panels | Returns `null` | Skeleton placeholders |
| Page transitions | Next.js native loading | Custom loading indicator |

### Error States
| Location | Current Behavior | Missing |
|---|---|---|
| `/careers/[id]` invalid ID | Redirect/error | "Career not found" page with suggestions |
| `/insights/[slug]` invalid slug | Error/blank | "Insight not found" fallback |
| `/quiz` localStorage error | Quiz may crash | Graceful error + retry |

### Confirmation States
| Action | Current | Missing |
|---|---|---|
| Quiz abandon | No confirmation | "Are you sure? Your progress will be saved." |
| Export download | No feedback | Toast/snackbar confirming download |
| Mission complete | No visual feedback | Success animation/checkmark |

---

## 2. Analytics Gaps

| Event Type | Current Coverage | Missing |
|---|---|---|
| Page views | CustomEvent tracking | No page view analytics |
| Quiz completion | ✅ logEvent("quiz_completed") | No answer-level analytics |
| Career click | ✅ logEvent("career_viewed") | No scroll depth tracking |
| Compare initiated | ✅ logEvent("comparison_initiated") | Result tracking missing |
| Notification interaction | ❌ Not tracked | Missing engagement metrics |
| Export usage | ❌ Not tracked | Missing feature adoption |
| Error events | ✅ via ErrorBoundary | No aggregation |
| Session duration | ❌ Not tracked | Missing retention signal |

---

## 3. Workflow Gaps

### Missing Workflows
| Workflow | Description | Priority |
|---|---|---|
| **Multi-quiz comparison** | Compare results across multiple quiz attempts | MED |
| **Goal setting wizard** | Step-by-step goal creation instead of direct edit | MED |
| **Milestone manual edit** | No way to adjust or correct progress | LOW |
| **Career data reset** | No way to clear workspace without debug page | MED |
| **Export history** | No archive of past exports | LOW |
| **Account/persistence** | No cross-device sync | LOW (by design) |

### Workflow Friction Points
| Friction | Description | Impact |
|---|---|---|
| Workspace → Career selection | Must navigate to /careers to select a career | MED |
| Resume quiz vs new quiz | Resume modal blocks start of new quiz | LOW |
| Compare → back to careers | Filter/comparison state lost on return | MED |
| Insight → no next action | Dead end after viewing insight | MED |

---

## 4. Settings Gaps

| Setting | Current | Missing |
|---|---|---|
| Theme | ✅ Dark/Light toggle | No system-preference detection |
| Notifications | Stored in localStorage | No notification preferences (types, frequency) |
| Privacy | None | No privacy controls or data deletion |
| Accessibility | Skip link only | No font size, contrast, or motion preferences |
| Export format | JSON/TXT only | No PDF export |
| Language | English only | No i18n structure |

---

## 5. Profile Gaps

| Profile Feature | Current | Missing |
|---|---|---|
| Skills | ✅ SkillGap analysis | Editable skill list |
| Experience | ✅ Resume text input | Structured experience timeline |
| Education | ❌ Not collected | Education background |
| Preferences | ❌ Not collected | Learning preferences, time availability |
| Social/GitHub | ProfileAnalyzerPanel reads GitHub | No account linking |
| Career history | ✅ automatic tracking | Manual history editing |

---

## 6. Accessibility Gaps

| WCAG Criterion | Status | Notes |
|---|---|---|
| Skip to content | ✅ Present | Root layout |
| ARIA labels | ✅ Partial | Header, buttons |
| Focus management | ❌ Missing | Quiz, modals, command center |
| Keyboard navigation | ❌ Partial | Timeline, panels not keyboard-accessible |
| Color contrast | 🟡 Unknown | Needs audit |
| Screen reader | ❌ Untested | No ARIA live regions |
| Motion sensitivity | ❌ No prefers-reduced-motion | Framer Motion always enabled |

---

## 7. Feature Gap Summary

| Category | Missing Count | Impact |
|---|---|---|
| Empty states | 6+ | MED — user feels lost |
| Loading states | 10+ | MED — layout gaps on slow loads |
| Error states | 3+ | MED — no graceful degradation |
| Analytics | 5+ | LOW — limited insight into user behavior |
| Workflows | 5+ | MED — missing recovery paths |
| Settings | 6+ | LOW — non-critical |
| Profile | 4+ | LOW — feature evolution |
| Accessibility | 5+ | MED — exclusion risk |

**Missing Features Score: 5.0 / 10**
