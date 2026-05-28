# PostHog Dashboard & Analytics Guide for CorePath

This guide covers setting up PostHog analytics, creating dashboards, and understanding the structured events CorePath tracks.

---

## 1. Set Up PostHog

### Create a PostHog Account
1. Go to [PostHog](https://app.posthog.com/signup)
2. Sign up (free tier: 1M events/month)
3. Create a new project named "CorePath"

### Get Your API Key
1. In PostHog, go to **Project Settings → Project API Key**
2. Copy the **Project API Key** (starts with `phc_`)
3. Add it to your `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 2. Tracked Events

CorePath automatically tracks the following events via `hooks/useAnalytics.ts`:

### Page Views (Automatic)
The `AnalyticsPageViewTracker` component fires `$pageview` events on every route change, including the pathname and URL.

### User Identification (Automatic)
When a user signs in, PostHog identifies them with:
- `userId` — Clerk user ID
- `email` — User's primary email
- `name` — Full name
- `firstName` / `lastName`

### Custom Events (Manual)
Call `trackEvent()` from any component to track custom actions:

```typescript
import { trackEvent } from "@/hooks/useAnalytics";

// In a component:
await trackEvent("quiz_completed", {
  career_matches: 5,
  top_match: "Data Scientist",
  confidence_score: 0.82,
});

await trackEvent("career_viewed", {
  career_id: "data-scientist",
  career_title: "Data Scientist",
  source: "recommendation",
});

await trackEvent("comparison_made", {
  career_a: "ML Engineer",
  career_b: "Data Engineer",
});
```

---

## 3. Suggested Dashboards

### Dashboard 1: User Engagement
Track how users interact with CorePath.

**Insights to add:**

| Insight | Event | Filter | Chart Type |
|---------|-------|--------|------------|
| Daily Active Users | `$pageview` | — | Trends (daily) |
| Quiz Starts | `quiz_started` | — | Trends |
| Quiz Completions | `quiz_completed` | — | Trends |
| Completion Rate | `quiz_completed` / `quiz_started` | — | Formula |
| Career Views | `career_viewed` | — | Trends |
| Sign-ups | `$pageview` on `/sign-up` | — | Trends |

### Dashboard 2: Career Intelligence
Understand which careers users are interested in.

**Insights to add:**

| Insight | Event | Breakdown | Chart Type |
|---------|-------|-----------|------------|
| Top Career Views | `career_viewed` | `career_title` | Bar chart |
| Top Career Matches | `quiz_completed` | `top_match` | Bar chart |
| Career Comparison Pairs | `comparison_made` | `career_a` vs `career_b` | Table |
| Domain Distribution | `career_viewed` | `domain` (custom property) | Pie chart |

### Dashboard 3: Retention
Track user return rates.

**Insights to add:**

| Insight | Event | Parameter | Chart Type |
|---------|-------|-----------|------------|
| Weekly Active Users | `$pageview` | Weekly | Trends |
| Returning vs New | `$pageview` | — | Retention |
| Session Duration | `$pageview` | — | Session analysis |

---

## 4. Recommended Properties

Send these properties with your events for better analysis:

### Global Properties (sent with all events)
Set these via PostHog's `register()`:
- `app_version` — CorePath version from `VERSION.json`
- `auth_method` — `"clerk"` or `"anonymous"`
- `environment` — `"development"` or `"production"`

### Quiz Events
```typescript
// quiz_started
{
  quiz_id: string;
  question_count: number;
  trait_dimensions: string[];
}

// quiz_completed
{
  quiz_id: string;
  career_matches: number;
  top_match: string;
  top_match_score: number;
  confidence_score: number;
  dominant_traits: string[];
}
```

### Career Events
```typescript
// career_viewed
{
  career_id: string;
  career_title: string;
  domain: string;
  source: "recommendation" | "search" | "browse" | "comparison";
}

// career_saved
{
  career_id: string;
  career_title: string;
}

// comparison_made
{
  career_a: string;
  career_b: string;
  result_career: string | null;
}
```

### Feature Engagement
```typescript
// feature_used
{
  feature: "workspace" | "journey_timeline" | "skill_gap" | "roadmap" | "command_center";
  action: "view" | "interact" | "export";
}
```

---

## 5. Connecting Event Tracking to Intelligence Engines

The existing intelligence engines in `data/` can be instrumented with minimal changes.

### Example: Track quiz completion in `quiz-enhanced.ts`

```typescript
// At the top of the file
import { trackEvent } from "@/hooks/useAnalytics";

// Inside calculateEnhancedProfile, before returning:
if (typeof window !== "undefined") {
  trackEvent("quiz_completed", {
    career_matches: result.careerMatches.length,
    top_match: result.careerMatches[0]?.title,
    confidence_score: result.confidenceScore,
    dominant_traits: Object.entries(result.traitScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => trait),
  });
}
```

### Example: Track career view in `career-matching.ts`

```typescript
import { trackEvent } from "@/hooks/useAnalytics";

export function getCareerById(id: string) {
  const career = careers.find((c) => c.id === id);

  if (typeof window !== "undefined" && career) {
    trackEvent("career_viewed", {
      career_id: career.id,
      career_title: career.title,
      domain: career.domain,
      source: "direct",
    });
  }

  return career ?? null;
}
```

---

## 6. Vercel Analytics

If you prefer Vercel Analytics (simpler, event-counting only):

1. Enable Analytics in your Vercel project dashboard
2. The `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` is automatically populated by Vercel
3. CorePath's `AnalyticsPageViewTracker` automatically sends pageviews to Vercel Analytics

---

## 7. Privacy Considerations

- **No PII in events:** PostHog event properties should not include: passwords, tokens, or sensitive personal data
- **Email is included in user identification only** — not in event payloads
- **PostHog settings:**
  - Go to Project Settings → Data Compliance
  - Enable IP anonymization
  - Set data retention to 90 days
  - Add a privacy policy link

---

## 8. Testing Your Setup

1. Start the dev server: `npm run dev`
2. Open the browser to `http://localhost:3000`
3. Navigate through a few pages
4. Go to PostHog → **Live Events** — you should see `$pageview` events appearing
5. Complete a quiz action and check for custom events
