/**
 * CorePath — Analytics Hooks
 *
 * Provides PostHog and Vercel Analytics integrations.
 * These hooks are no-ops until the respective environment variables are set.
 */

"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";

// ============================================
// PostHog
// ============================================

type PostHogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
};

let posthogClient: PostHogClient | null = null;

async function loadPostHog(): Promise<PostHogClient | null> {
  if (typeof window === "undefined") return null;
  if (posthogClient) return posthogClient;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  try {
    const posthog = await import("posthog-js");
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

    posthog.default.init(key, {
      api_host: host,
      loaded: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__posthog_loaded__ = true;
      },
      capture_pageview: false, // We handle pageviews manually
    });

    posthogClient = posthog.default;
    return posthogClient;
  } catch {
    console.warn("[Analytics] PostHog failed to load");
    return null;
  }
}

/** Track a custom event */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const ph = await loadPostHog();
  if (ph) {
    ph.capture(eventName, properties);
  }
}

// ============================================
// Structured Event Helpers
// ============================================

/** Track when a user starts the career quiz */
export function trackQuizStarted(quizId: string, questionCount: number): void {
  trackEvent("quiz_started", {
    quiz_id: quizId,
    question_count: questionCount,
  });
}

/** Track when a user completes the career quiz */
export function trackQuizCompleted(
  quizId: string,
  careerMatches: number,
  topMatch: string,
  topMatchScore: number,
  dominantTraits: string[]
): void {
  trackEvent("quiz_completed", {
    quiz_id: quizId,
    career_matches: careerMatches,
    top_match: topMatch,
    top_match_score: topMatchScore,
    dominant_traits: dominantTraits,
  });
}

/** Track when a user views a career detail page */
export function trackCareerViewed(
  careerId: string,
  careerTitle: string,
  domain: string,
  source: "recommendation" | "search" | "browse" | "comparison" | "direct"
): void {
  trackEvent("career_viewed", {
    career_id: careerId,
    career_title: careerTitle,
    domain,
    source,
  });
}

/** Track when a user compares two careers */
export function trackComparisonMade(
  careerA: string,
  careerB: string,
  resultCareer: string | null
): void {
  trackEvent("comparison_made", {
    career_a: careerA,
    career_b: careerB,
    result_career: resultCareer,
  });
}

/** Track when a user saves/bookmarks a career */
export function trackCareerSaved(careerId: string, careerTitle: string): void {
  trackEvent("career_saved", {
    career_id: careerId,
    career_title: careerTitle,
  });
}

/** Track usage of specific features */
export function trackFeatureUsed(
  feature: string,
  action: "view" | "interact" | "export" | "create" | "delete",
  metadata?: Record<string, unknown>
): void {
  trackEvent("feature_used", {
    feature,
    action,
    ...metadata,
  });
}

/** Track errors encountered by users */
export function trackError(
  errorType: string,
  errorMessage: string,
  context?: Record<string, unknown>
): void {
  trackEvent("error_occurred", {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
  });
}

/** Identify a user in PostHog */
export async function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const ph = await loadPostHog();
  if (ph) {
    ph.identify(userId, properties);
  }
}

/** Reset PostHog identity (on logout) */
export async function resetAnalytics(): Promise<void> {
  const ph = await loadPostHog();
  if (ph) {
    ph.reset();
  }
}

/**
 * React hook that automatically tracks page views.
 * Must be used inside a component wrapped in Suspense.
 */
export function usePageViewTracking(): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Track pageview
    loadPostHog().then((ph) => {
      if (ph) {
        ph.capture("$pageview", {
          $current_url: url,
          $pathname: pathname,
        });
      }
    });

    // Send pageview to Vercel Analytics if available
    if (typeof window !== "undefined" && "va" in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).va?.("pageview", { url });
      } catch {
        // Vercel Analytics not available
      }
    }
  }, [pathname, searchParams]);

  // Identify user when auth state changes
  useEffect(() => {
    if (isSignedIn && user) {
      identifyUser(user.id, {
        email: user.emailAddresses?.[0]?.emailAddress,
        name: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [isSignedIn, user]);
}

// ============================================
// Vercel Analytics
// ============================================


