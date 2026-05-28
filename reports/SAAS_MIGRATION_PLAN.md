# CorePath SaaS Migration Plan

## Current Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  ┌─────────────────────────────────────────────────┐│
│  │  Next.js App (Static/Client-rendered)            ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ ││
│  │  │  UI       │ │ Auth     │ │  Intelligence    │ ││
│  │  │  Components│ │ (Mock)   │ │  Engines         │ ││
│  │  └──────────┘ └──────────┘ └──────────────────┘ ││
│  │                    │                              ││
│  │              ┌─────▼──────┐                      ││
│  │              │ SafeStorage │                      ││
│  │              │ (localStorage)│                    ││
│  │              └────────────┘                      ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Current Status
- **Framework:** Next.js (Pages: 12+ routes)
- **Auth:** Mock password gate (localStorage "admin" password)
- **Data:** All localStorage via SafeStorage wrapper
- **Database:** None (localStorage only)
- **Analytics:** Custom localStorage event tracking
- **Deployment:** Static export capable

---

## Target Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser                                  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Next.js App (SSR/ISR)                                    ││
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────────────────┐  ││
│  │  │  UI       │ │ Clerk Auth   │ │  Intelligence        │  ││
│  │  │  Components│ │ (Google/Email)│ │  Engines             │  ││
│  │  └──────────┘ └──────────────┘ └──────────────────────┘  ││
│  │                    │                    │                  ││
│  │              ┌─────▼──────────────────▼──────┐           ││
│  │              │  Persistence Abstraction Layer │           ││
│  │              │  (localStorage ↔ Server)       │           ││
│  │              └─────┬──────────────────▲──────┘           ││
│  └────────────────────│──────────────────│──────────────────┘│
└────────────────────────│──────────────────│──────────────────┘
                         │                  │
                    ┌────▼──────────────────▼────┐
                    │     PostgreSQL (via Prisma) │
                    │  ┌──────────────────────┐  │
                    │  │ Users                │  │
                    │  │ QuizResults           │  │
                    │  │ CareerWorkspaces     │  │
                    │  │ MissionProgress       │  │
                    │  │ JourneyMemories       │  │
                    │  │ AnalyticsEvents       │  │
                    │  │ StreakData            │  │
                    │  │ KeyValueStore         │  │
                    │  └──────────────────────┘  │
                    └────────────────────────────┘
```

---

## Migration Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Data loss** during localStorage → server migration | High | Keep localStorage as fallback; prompt user to sync on first login; verify data integrity post-migration |
| **Auth migration** breaking existing local protoype | Medium | Clerk middleware only protects new routes (/dashboard, /journey, /workspace, /command-center, /admin); public routes (/quiz, /careers, /) remain accessible |
| **Prisma model mismatch** with existing data shapes | Medium | KeyValueStore model stores JSON blobs, preserving existing data shapes; schema validation on write |
| **Performance degradation** from DB queries | Low | KeyValueStore is simple key-value; low query complexity |
| **Environment configuration** errors | Low | .env.example documents all vars; missing vars fail gracefully |
| **CSP conflicts** with Clerk CDN | Low | Updated CSP to allow Clerk domains |

---

## Data Flow

### Write Path
```
Intelligence Engine (e.g., journey-memory)
  → persistence.set("journey-memory", data)
     → if target === "local":
         → SafeStorage.set() → localStorage
     → if target === "server":
         → Prisma.keyValueStore.upsert() → PostgreSQL
```

### Read Path
```
Intelligence Engine
  → persistence.get("journey-memory")
     → if target === "local":
         → SafeStorage.get() ← localStorage
     → if target === "server":
         → Prisma.keyValueStore.findUnique() ← PostgreSQL
```

### Migration Path
```
User authenticates (first time with Clerk)
  → persistence.migrateLocalToServer()
     → Reads all keys from localStorage
     → Writes each key to server
     → Returns { migrated: N, failed: M }
  → Optionally: clear localStorage after successful migration
```

---

## Auth Flow

```
User visits /dashboard
  → Next.js middleware (clerkMiddleware)
     → If not authenticated:
         → Redirect to /sign-in
     → If authenticated:
         → Continue to dashboard page

Sign-in page:
  → Clerk <SignIn /> component
     → Google OAuth button
     → Email/password form
  → On success:
     → Redirect to /dashboard (configurable via env)
     → Clerk sets persistent session cookie

UserMenu component (in Header):
  → Shows avatar/initials when signed in
  → Dropdown with: Dashboard link, Journey link, Sign Out
  → Sign Out calls Clerk signOut() → redirects to /
```

### Protected Routes
| Route | Protection |
|-------|------------|
| `/dashboard` | Clerk auth required |
| `/journey` | Clerk auth required |
| `/workspace` | Clerk auth required |
| `/command-center` | Clerk auth required |
| `/admin/*` | Clerk auth required |
| `/quiz` | Public |
| `/careers/*` | Public |
| `/sign-in` | Public |
| `/sign-up` | Public |

---

## Persistence Flow

```
┌───────────────────────────────────────────────────┐
│              PersistenceManager                     │
│                                                     │
│  target: "local" | "server"                         │
│  syncMode: "immediate" | "debounced" | "manual"     │
│                                                     │
│  Methods:                                            │
│  ├── get(key)     → reads from active target        │
│  ├── set(key,val) → writes to active target         │
│  │   └── optionally syncs to server                 │
│  ├── remove(key)  → deletes from active target      │
│  ├── clear()      → clears active target            │
│  ├── migrateLocalToServer() → batch migration       │
│  └── setUser(id)  → sets user ID for namespacing    │
└───────────────────────────────────────────────────┘
```

### Usage in Intelligence Engines
Intelligence engines (journey-memory, career-workspace, analytics-events, etc.) already use `SafeStorage` for their operations. The persistence layer wraps SafeStorage and provides an identical interface. Engines can be updated gradually:

1. Replace `import { getSafeStorage } from "./safe-storage"` with `import { persistence } from "./persistence-layer"`
2. Or keep using SafeStorage directly (it still works)
3. When server persistence is needed, switch via `persistence.setTarget("server")`

---

## Scalability Concerns

| Concern | Assessment |
|---------|------------|
| **Database load** | Low — CorePath is user-facing with per-user data; no massive shared tables |
| **KeyValueStore growth** | Linear with users; each user stores ~50-200KB; 10K users ≈ 500MB-2GB |
| **Auth overhead** | Clerk handles auth at edge; no server load for authentication |
| **Next.js SSR/ISR** | Static pages need no DB; only /dashboard and protected routes need SSR |
| **CDN caching** | Public pages (/, /careers, /quiz) are fully static — ideal for CDN |
| **API routes** | Currently minimal (1 route); can scale with Vercel serverless functions |

### Bottlenecks
- **KeyValueStore** is a simple key-value table. At scale (100K+ users), consider:
  - Adding read replicas for the database
  - Implementing Redis caching layer for frequently accessed keys
  - Sharding by namespace prefix
- **localStorage → server migration** could cause a spike on first login. Implement:
  - Chunked migration (migrate N keys per request)
  - Progress indicator for users
  - Background migration via web worker

---

## Cost Considerations

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| **Clerk** | Free tier: 10K MAU | Pro: $25/mo for 100K MAU |
| **PostgreSQL (Vercel Postgres/Neon)** | Free tier: 0.5GB / $0 | Scaling: ~$10-50/mo |
| **Vercel Hosting** | Free tier: 100GB bandwidth | Pro: $20/mo |
| **PostHog** | Free tier: 1M events/mo | Self-hosted option available |
| **Vercel Analytics** | Free with Pro | ~$20/mo bundled |
| **Total (estimated)** | **$0-100/mo** | Scales with usage |

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend API key |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Default: /sign-in |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Default: /sign-up |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | Default: /dashboard |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | Default: /dashboard |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog instance URL |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | No | Vercel Analytics ID |
| `NEXT_PUBLIC_APP_URL` | No | App URL for redirects |

---

## Deployment Checklist

### Pre-deployment
- [ ] Set up Clerk application in [Clerk Dashboard](https://dashboard.clerk.com)
  - [ ] Configure Google OAuth
  - [ ] Configure email/password authentication
  - [ ] Copy API keys to environment variables
- [ ] Provision PostgreSQL database (Vercel Postgres, Neon, or Supabase)
- [ ] Run `npx prisma migrate dev` to create tables
- [ ] Configure all environment variables in hosting provider
- [ ] Update CSP in next.config.js for Clerk domains

### Post-deployment
- [ ] Verify auth flow end-to-end
- [ ] Test protected route redirects
- [ ] Run `npm run build` and verify no errors
- [ ] Test localStorage → server migration
- [ ] Monitor PostHog for event capture
- [ ] Verify Vercel Analytics dashboard

### Rollback Plan
1. Revert to last working commit
2. Disable Clerk middleware (remove middleware.ts)
3. Switch persistence back to localStorage-only
4. Verify public routes still work

---

## File Structure (New/Modified)

### New Files
```
.env.example                          → Environment variable template
middleware.ts                          → Clerk route protection
lib/prisma.ts                          → Prisma client singleton
prisma/schema.prisma                  → Database schema
data/persistence-layer.ts             → Storage abstraction layer
hooks/useAnalytics.ts                 → PostHog + Vercel Analytics
components/UserMenu.tsx               → Auth avatar dropdown
app/dashboard/page.tsx                → Protected dashboard home
app/journey/page.tsx                  → Protected journey page
app/workspace/page.tsx               → Protected workspace page
app/command-center/page.tsx           → Protected command center
app/sign-in/page.tsx                  → Sign-in page
app/sign-up/page.tsx                  → Sign-up page
reports/SAAS_MIGRATION_PLAN.md        → This report
```

### Modified Files
```
app/layout.tsx                        → Added ClerkProvider wrapper
components/Header.tsx                 → Added UserMenu component
next.config.js                        → Updated CSP for Clerk domains
```

---

## Next Steps

1. **Set up Clerk** — Create a Clerk application and configure OAuth
2. **Provision database** — Create a PostgreSQL instance and run Prisma migrations
3. **Configure environment** — Fill in all environment variables
4. **Test authentication** — Verify Google login, email login, and session persistence
5. **Test persistence** — Verify localStorage ↔ server switching works
6. **Deploy** — Deploy to Vercel with environment variables configured
7. **Monitor** — Watch PostHog/Vercel Analytics for errors
