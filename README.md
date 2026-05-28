# CorePath

> **v5.0.0** — AI-powered career guidance platform built with Next.js

CorePath helps users explore career paths, take a personalized career quiz, visualize learning roadmaps, and get AI-driven recommendations. Built with a modern SaaS architecture featuring authentication, a PostgreSQL database, and analytics.

---

## Features

### 🎯 Career Exploration
- Browse career categories with AI impact indicators
- Detailed career pages with salary, growth, and skill data
- Career comparison tool
- Learning roadmaps and skill tree visualization

### 🧠 Intelligence Engine
- Personalized career matching based on quiz results
- Predictive insights and career direction confidence
- Adaptive roadmaps that evolve with user progress
- Memory evolution tracking over time
- Weekly reflections and progress tracking

### 👤 Authentication & Users
- Clerk-powered authentication (email + Google/GitHub OAuth)
- Protected routes with automatic redirect
- User profile with avatar and session management
- Persistent user data across devices

### 📊 Analytics & Insights
- PostHog integration for product analytics (optional)
- Structured event tracking (quiz, careers, features)
- User behavior patterns and engagement signals
- Quiz history and performance analytics

### 🎨 UX & Design
- Light/dark mode with theme toggle
- Responsive mobile-first design
- Bottom navigation on mobile, top nav on desktop
- Tabbed interfaces with progressive disclosure
- Staggered fade-in animations (Framer Motion)
- Production health monitoring panel

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js (Turbopack) |
| **Language** | TypeScript 6.0 |
| **Styling** | Tailwind CSS |
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma v7 (`@prisma/client` + `@prisma/adapter-pg`) |
| **Analytics** | PostHog (optional) / Vercel Analytics |
| **Animation** | Framer Motion |
| **Testing** | Vitest (unit) + Playwright (e2e) |

---

## Project Structure

```
├── app/                    # Next.js App Router pages & API
│   ├── api/
│   │   └── webhooks/clerk/ # Clerk user sync webhook
│   ├── command-center/     # Admin/production health dashboard
│   ├── dashboard/          # Main dashboard (protected)
│   ├── journey/            # User journey timeline (protected)
│   ├── quiz/               # Career quiz pages
│   ├── sign-in/            # Clerk sign-in page
│   ├── sign-up/            # Clerk sign-up page
│   ├── workspace/          # Career workspace (protected)
│   └── layout.tsx          # Root layout with ClerkProvider
├── components/             # Reusable UI components
├── data/                   # Career, quiz, and intelligence data
│   ├── careers.ts          # Career definitions
│   ├── persistence-layer.ts # localStorage ↔ server sync
│   ├── analytics-events.ts # Structured analytics events
│   └── ...                 # Intelligence engines
├── hooks/                  # Custom React hooks
│   └── useAnalytics.ts     # Event tracking hooks
├── lib/
│   └── prisma.ts           # Prisma v7 client (adapter-pg)
├── prisma/
│   └── schema.prisma       # Database schema (8 models)
├── docs/                   # Setup guides
│   ├── CLERK_SETUP_GUIDE.md
│   └── POSTHOG_DASHBOARD_GUIDE.md
├── reports/                # Release notes & reports
├── middleware.ts            # Clerk route protection
├── prisma.config.ts         # Prisma v7 CLI configuration
└── next.config.js           # Next.js config with CSP headers
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- A **Clerk** account (free tier)
- A **PostgreSQL** database (Neon free tier recommended)

### 1. Install dependencies

```bash
cd corepath-frontend
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
# Push the schema to your database
npx prisma db push

# Generate the Prisma client
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000` — you should see the sign-in page.

---

## Authentication Setup

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Enable **Email** + **Google** providers
3. Copy the API keys to `.env.local`
4. Set up the webhook endpoint:
   - **URL:** `https://your-domain.com/api/webhooks/clerk`
   - **Events:** `user.created`, `user.updated`, `user.deleted`
   - **Local dev:** Use [ngrok](https://ngrok.com) to tunnel `localhost:3000`
5. Add the webhook signing secret to `.env.local`

For detailed instructions, see `docs/CLERK_SETUP_GUIDE.md`.

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
