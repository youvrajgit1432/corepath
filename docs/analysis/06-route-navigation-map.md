# Route & Navigation Map

> Generated: May 27, 2026
> Project: CorePath

---

## 1. Route Registration

| Route | Page File | Type | Route Group |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Public |
| `/quiz` | `app/quiz/page.tsx` | Client (QuizShell) | Public |
| `/recommendation` | `app/recommendation/page.tsx` | Server → Client | Public |
| `/careers` | `app/careers/page.tsx` | Client | Public |
| `/careers/[id]` | `app/careers/[id]/page.tsx` | Server → Client | Public |
| `/careers/compare` | `app/careers/compare/page.tsx` | Client | Public |
| `/careers/layout.tsx` | `app/careers/layout.tsx` | Server | Layout |
| `/insights` | `app/insights/page.tsx` | Server | Public |
| `/insights/[slug]` | `app/insights/[slug]/page.tsx` | Server → Client | Public |
| `/admin/debug` | `app/admin/debug/page.tsx` | Client | Internal |
| `/admin/insights` | `app/admin/insights/page.tsx` | — | Internal |
| `/admin/accessibility` | `app/admin/accessibility/page.tsx` | Client | Internal |
| `/api/careers` | `app/api/careers/route.ts` | API | Public |

**Total routes: 12 (8 user-facing, 3 admin, 1 API)**

---

## 2. Navigation Graph (Directed)

### Direct Navigation (Link / Router)

```
                    ┌──────────────────────┐
                    │         /             │
                    │   (Home Landing)      │
                    └───────┬───┬───┬───────┘
                            │   │   │
              ┌─────────────┘   │   └─────────────┐
              ▼                 ▼                  ▼
       ┌───────────┐    ┌─────────────┐    ┌───────────────┐
       │   /quiz   │    │  /careers   │    │/recommendation│
       └─────┬─────┘    └──┬──┬──┬────┘    └────┬──┬───────┘
             │             │  │  │              │  │
             │        ┌────┘  │  └────┐    ┌────┘  │
             │        ▼       ▼       ▼    ▼       ▼
             │  ┌─────────┐ ┌──────┐ ┌────────┐ ┌─────────┐
             │  │/careers │ │/carrs│ │/carees │ │ /quiz   │
             │  │  /:id   │ │/comp.│ │  /rec  │ │ (retake)│
             │  └─────────┘ └──────┘ └────────┘ └─────────┘
             │        │         │
             │        ▼         ▼
             │  ┌───────────────────────────────┐
             └──►      /careers (back)          │
                └───────────────────────────────┘
```

### Navigation via Link Components

| Source | Target | Element | Condition |
|---|---|---|---|
| `/` | `/quiz` | "Start career cognition" button | Always |
| `/` | `/careers` | "Explore intelligence cards" button | Always |
| `/` | `/careers/${id}` | CareerCard (x4) | Always (top careers) |
| `/` | `/recommendation` | "Turn insight into action" card | Always |
| `/` | `/careers` | "Navigate specialization" card | Always |
| `/` | `/quiz` | "Reveal your decision profile" card | Always |
| `/` | `/` | Header logo | Always |
| `/` | `/careers` | Footer link | Always |
| `/` | `/quiz` | Footer link | Always |
| `/` | `/recommendation` | Footer link | Always |
| `/` | `/insights` | Footer link | Always |
| `/quiz` | `/recommendation` | Quiz completion redirect | Quiz complete |
| `/quiz` | `/` | Quiz cancel/goback | User cancels |
| `/recommendation` | `/careers/${id}` | "View Full Roadmap" | Primary career match |
| `/recommendation` | `/quiz` | "Retake" button | Always |
| `/recommendation` | `/careers/compare?careerA=X&careerB=Y` | "Compare" flow | User has matches |
| `/recommendation` | `/careers` | "Browse all career paths" | Always |
| `/recommendation` | `/careers/${id}` | Match card click (x3) | Other matches exist |
| `/careers` | `/careers/${id}` | CareerCard click | Always |
| `/careers` | `/careers/compare` | Compare mode toggle | User selects 2 careers |
| `/careers/${id}` | `/careers` | Back link | Always |
| `/careers/${id}` | `/workspace` (via panel) | CareerWorkspacePanel | Always |
| `/careers/compare` | `/careers` | Back navigation | Always |
| `/insights` | `/insights/${slug}` | Insight card click | Always |
| `/insights/${slug}` | `/insights` | Back link | Always |
| `/insights/${slug}` | `/careers` | Related career link | If career attached |
| `/insights` | `/careers` | Footer link | Always |

### Navigation via Events (CustomEvent)

| Source Event | Listener | Action | Effect |
|---|---|---|---|
| `corepath:open-command-center` | CareerCommandCenter | Opens expanded view | Could include `section` in detail |
| `corepath:scroll-to-attribution` | CareerCommandCenter + JourneyProfileCard | Scrolls to section | Smooth scroll + highlight |
| `corepath:error` | ErrorBoundary | Console + analytics | Logs error details |

### Navigation via Notification Actions

| Notification Action | Target | Behavior |
|---|---|---|
| Notification.click | `/quiz`, `/careers/${id}`, `/` | Depends on notification type |
| Notifications link | `/careers/compare` | From "Compare" buttons |
| Notifications link | `/quiz` | From "Mission" notifications |

### Timeline Action Links

| Event Type | Target | Label |
|---|---|---|
| `quiz_completed` | `/recommendation` | "View results" |
| `career_viewed` | `/careers/${id}` | "View career" |
| `comparison_created` | `/careers/compare?careerA=X&careerB=Y` | "View comparison" |
| `workspace_started` | `/careers/${id}` | "Open workspace" |
| `roadmap_milestone` | `/careers/${id}` | "View milestone" |
| `resume_analysis` | `/careers/${id}` | "View analysis" |

### Command Center Quick Actions

| Label | Target | Condition |
|---|---|---|
| "Continue workspace" | `/careers/${id}` | Workspace exists |
| "Start workspace" | `/careers` | No workspace |
| "Resume quiz" | `/quiz` | Always |
| "View timeline" | `/insights` | Always |
| "Open comparison history" | `/careers/compare` | Always |
| "Open planner" | `/` | Always (scroll to planner) |
| "Start quiz" | `/quiz` | New user |
| "Explore careers" | `/careers` | New user |
| "Create workspace" | `/careers` | New user |

---

## 3. Navigation Complexity Map

### Simple Paths (2 clicks)
```
Home → Quiz
Home → Careers
Home → Careers/compare
Home → Insights
```

### Medium Paths (2-3 clicks)
```
Home → Quiz → Recommendation
Home → Careers → Career detail
Home → Careers → Compare
Home → Insights → Insight detail
```

### Complex Paths (3-4+ clicks)
```
Home → Quiz → Recommendation → Career detail → Workspace
Home → Quiz → Recommendation → Compare → Career detail
Home → Career card → Career detail → Workspace → Panel interaction
Home → Quiz → Recommendation → Workspace → JourneyProfile (43 panels)
```

---

## 4. Navigation Gaps

### Missing Navigation Elements

| Missing | Impact |
|---|---|
| **Breadcrumbs** | No breadcrumb trail on career detail, compare, or insight pages |
| **Back button state** | Compare page loses filter state on return to careers |
| **Sidebar/nav drawer** | No secondary navigation once on a page |
| **Active state indicators** | No "current page" highlight in header or footer |
| **URL state persistence** | Quiz session stored in localStorage, not URL params |
| **Keyboard navigation** | No obvious keyboard shortcuts or skip links (except root layout) |

### Ambiguous Navigation States

| Situation | Current Behavior | Problem |
|---|---|---|
| Quiz completion | Redirects to `/recommendation` | User may not want to leave |
| Recommendation → workspace click | Opens workspace on same page | No clear separation |
| Compare (no params) | Shows empty compare | User must navigate back manually |
| Insights → slug (invalid) | Returns null/error | No error state fallback |

---

## 5. Route Group Analysis

| Route Group | Pages | State Persistence | Authentication |
|---|---|---|---|
| Public routes | 8 | localStorage only | None |
| Admin routes | 3 | localStorage | None (no auth) |
| API routes | 1 | Server-side | None |

**Note:** Admin routes (`/admin/*`) have no authentication guard. These are publicly accessible if URL is known.

---

## 6. Navigation Metrics

| Metric | Value |
|---|---|
| Total navigable routes | 12 |
| Direct Link navigations | 30+ |
| Event-driven navigations | 3 CustomEvent channels |
| Timeline action links | 6 types |
| Command Center quick actions | 7 |
| Notification action types | ~4 |
| **Navigation paths** | ~50 distinct user paths |
| **Dead-end pages** | 3 (/insights, /insights/[slug], /careers/compare no-params) |
| **Loops** | /recommendation → /quiz → /recommendation |

**Navigation Complexity Score: 7.5 / 10**
