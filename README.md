# CorePath

AI-Powered Career Guidance & Learning Roadmap Platform

CorePath helps users explore AI-era career paths, assess strengths and interests, compare professions, understand future career impact, and build actionable learning journeys.

<p align="center">
  <img src="docs/images/corepath/home.png" alt="CorePath AI Career Guidance Platform" width="100%">
</p>

---

## Overview

CorePath is a comprehensive career intelligence platform featuring:

- **Career Exploration** — Browse 100+ careers across categories with AI impact indicators, salary data, growth projections, and required skills
- **Personalized Career Assessment** — Interactive quiz evaluating interests, strengths, and work preferences to generate tailored recommendations
- **Career Comparison** — Side-by-side evaluation of multiple career paths with detailed intelligence metrics
- **Career Intelligence** — Detailed career pages with market trends, skill gap analysis, and learning roadmaps
- **Personalized Dashboard** — Career intelligence hub with recommendations, progress tracking, and quick actions
- **Career Workspace** — Persistent exploration space for saving and organizing career research
- **Journey & Progress** — Visual timeline tracking career exploration history and milestone achievements
- **Command Center** — Career/system intelligence command interface for deep analysis
- **Insights** — AI-driven career intelligence and predictive analytics
- **Responsive Design** — Mobile-first experience with bottom navigation and touch-optimized layouts
- **Light / Dark Experience** — Full theme support with system preference detection

---

## Feature Showcase

### Career Exploration

Browse careers by category with AI impact indicators, salary ranges, growth projections, and core skills. Drill into detailed career intelligence pages with market trends, skill gap analysis, and personalized learning roadmaps.

<table>
<tr>
<td width="50%">
<img src="docs/images/corepath/career-explorer.png" alt="CorePath Career Explorer">
</td>
<td width="50%">
<img src="docs/images/corepath/career-details.png" alt="CorePath Career Intelligence">
</td>
</tr>
</table>

### Personalized Career Assessment

An interactive multi-step quiz evaluates your interests, strengths, work style preferences, and values to build a comprehensive trait profile.

<img src="docs/images/corepath/career-quiz.png" alt="CorePath Career Quiz" width="100%">

Based on quiz results, CorePath generates personalized career recommendations with match scores, reasoning, and confidence levels.

<img src="docs/images/corepath/personalized-results.png" alt="CorePath Personalized Recommendations" width="100%">

> **Note:** Portfolio screenshots use fictional local demonstration data for presentation. Production authentication remains Clerk-based.

### Career Comparison

Side-by-side career evaluation with detailed metrics across salary, growth, AI impact, required skills, and personalized fit scores.

<img src="docs/images/corepath/career-comparison.png" alt="CorePath Career Comparison" width="100%">

### Personalized Dashboard

Career intelligence hub displaying personalized recommendations, progress tracking, quick actions, and adaptive insights based on your profile and activity.

<img src="docs/images/corepath/dashboard.png" alt="CorePath Dashboard" width="100%">

> **Note:** Screenshots use fictional local demonstration data for portfolio presentation. Production authentication remains Clerk-based.

### Career Workspace

Persistent exploration space for saving careers, tracking research phases, organizing notes, and building custom learning plans.

<img src="docs/images/corepath/workspace.png" alt="CorePath Career Workspace" width="100%">

### Journey & Progress

Visual timeline tracking your career exploration history, completed assessments, saved careers, and milestone achievements.

<details>
<summary>View full journey screenshot (1440×2375)</summary>
<img src="docs/images/corepath/journey.png" alt="CorePath Journey" width="85%">
</details>

### Command Center

Career and system intelligence command interface providing deep analytical views, cross-career synthesis, and strategic planning tools.

<img src="docs/images/corepath/command-center.png" alt="CorePath Command Center" width="100%">

### Insights

AI-driven career intelligence including predictive analytics, market pulse indicators, skill trend forecasting, and personalized action recommendations.

<img src="docs/images/corepath/insights.png" alt="CorePath Insights" width="100%">

### Responsive Design

Mobile-first experience with bottom navigation, touch-optimized cards, and adaptive layouts.

<p align="center">
  <img src="docs/images/corepath/mobile-home.png" width="30%" alt="CorePath Mobile Home">
  &nbsp;&nbsp;
  <img src="docs/images/corepath/mobile-careers.png" width="30%" alt="CorePath Mobile Career Explorer">
</p>

### Light / Dark Experience

Full theme support with system preference detection, manual toggle, and consistent styling across all views.

<img src="docs/images/corepath/dark-mode.png" alt="CorePath Dark Mode" width="100%">

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma v7 (`@prisma/client` + `@prisma/adapter-pg`) |
| **Analytics** | PostHog (optional) / Vercel Analytics |
| **Animation** | Framer Motion |
| **Testing** | Vitest (unit) + Playwright (e2e) |

---

## Architecture

- **Next.js App Router** — Server components by default, client components for interactivity
- **UI Components** — Reusable component library with Framer Motion animations
- **Career/Intelligence Data Layer** — 80+ modular engines in `data/` organized as an intelligence pipeline
- **Clerk Authentication** — Email/password and OAuth providers with webhook sync
- **Prisma + PostgreSQL** — Type-safe database access with 8 models
- **Analytics** — Structured event tracking with PostHog and Vercel Analytics
- **Testing** — Vitest for unit tests, Playwright for e2e coverage

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- A **Clerk** account (free tier)
- A **PostgreSQL** database (Neon free tier recommended)

### 1. Clone and install

```bash
git clone https://github.com/youvrajgit1432/corepath.git
cd corepath
npm install
```

### 2. Set up environment variables

Copy these into a `.env.local` file (never commit this file):

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# PostgreSQL Database (Neon)
DATABASE_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

```bash
# Generate the Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000` — you should see the home page.

> **Important:** Protected/authenticated functionality (dashboard, workspace, journey, etc.) requires valid Clerk credentials and a configured PostgreSQL database. The application will redirect to sign-in for protected routes.

---

## Project Structure

```
├── app/                          # Next.js App Router pages & API
│   ├── admin/                    # Admin/debug routes
│   ├── api/
│   │   └── webhooks/clerk/       # Clerk user sync webhook
│   ├── careers/                  # Career browsing & detail pages
│   ├── command-center/           # Intelligence command interface
│   ├── dashboard/                # Main dashboard (protected)
│   ├── insights/                 # AI insights page (protected)
│   ├── journey/                  # User journey timeline (protected)
│   ├── quiz/                     # Career quiz pages
│   ├── recommendation/           # Personalized recommendations (protected)
│   ├── sign-in/                  # Clerk sign-in page
│   ├── sign-up/                  # Clerk sign-up page
│   ├── workspace/                # Career workspace (protected)
│   └── layout.tsx                # Root layout with ClerkProvider
├── components/                   # Reusable UI components
├── data/                         # Career, quiz, and intelligence data
│   ├── careers.ts                # Career definitions
│   ├── persistence-layer.ts      # localStorage ↔ server sync
│   ├── analytics-events.ts       # Structured analytics events
│   └── ...                       # Intelligence engines (80+ modules)
├── hooks/                        # Custom React hooks
│   └── useAnalytics.ts           # Event tracking hooks
├── lib/
│   └── prisma.ts                 # Prisma v7 client (adapter-pg)
├── prisma/
│   └── schema.prisma             # Database schema (8 models)
├── docs/                         # Documentation
│   ├── images/corepath/          # Product showcase screenshots
│   ├── CLERK_SETUP_GUIDE.md
│   └── POSTHOG_DASHBOARD_GUIDE.md
├── reports/                      # Release notes & reports
├── proxy.ts                      # Next.js proxy/middleware configuration
├── prisma.config.ts              # Prisma v7 CLI configuration
└── next.config.js                # Next.js config with CSP headers
```

---

## Database Schema

The Prisma schema includes 8 models:

| Model | Purpose |
|-------|---------|
| `User` | Synced from Clerk via webhook |
| `QuizResult` | User quiz answers and trait scores |
| `CareerWorkspace` | User's career exploration workspace |
| `MissionProgress` | Daily mission tracking |
| `JourneyMemory` | Full journey state snapshots |
| `AnalyticsEvent` | Server-side event logging |
| `StreakData` | User engagement streaks |
| `KeyValueStore` | Generic key-value persistence |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npx prisma db push` | Sync schema to database |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Open database browser |

---

## Deployment

### Vercel (recommended)

1. Push your repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy — Vercel auto-deploys on every `git push`

### Required environment variables in Vercel

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
DATABASE_URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

After deployment, update the Clerk webhook URL to point to your production domain.

---

## Release History

- **v5.0.0** — Production-ready UX overhaul, adaptive intelligence system, mobile optimization, guided journey, analytics, retention, admin infrastructure, Clerk auth, Neon database, webhook sync, PostHog analytics
- **v4.0.0** — Mobile UX, adaptive navigation, intelligence UI polish
- **v3.0** — Intelligence engine, predictive insights, career matching
- **v2.2.0** — Quiz system, career browsing, roadmaps

---

## Portfolio Documentation Refresh

**2026-10-02** — GitHub portfolio showcase refresh: professional product gallery, feature screenshots, responsive examples, and README modernization.

---

## Screenshot / Demo Disclosure

Portfolio screenshots were captured using fictional local demonstration data. No production credentials or private user information are included.

---

## Testing

```bash
npm run test        # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

Only claim tests pass if they are actually run successfully in your environment.

---

## License

Private repository — all rights reserved.