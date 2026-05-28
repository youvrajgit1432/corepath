"use client";

import { Suspense } from "react";
import { usePageViewTracking } from "../hooks/useAnalytics";

/** Inner component that uses useSearchParams (must be in Suspense) */
function PageViewTrackerInner() {
  usePageViewTracking();
  return null;
}

/**
 * Tracks page views for PostHog and Vercel Analytics.
 * Include once in the root layout.
 */
export default function AnalyticsPageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}
