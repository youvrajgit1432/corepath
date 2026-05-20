"use client";

export const metadata = {
  title: "Career recommendations | CorePath",
  description:
    "View your personalized career match from CorePath's quiz and discover the roadmap for your top role.",
  alternates: {
    canonical: "https://corepath.io/recommendation",
  },
  robots: {
    noindex: true,
    nofollow: false,
  },
  openGraph: {
    title: "CorePath | Personalized career recommendations",
    description:
      "View your personalized career match from CorePath's quiz and discover the roadmap for your top role.",
    url: "https://corepath.io/recommendation",
    type: "website",
  },
};

// app/recommendation/page.tsx
// Feature 2: Career Recommendation Output
// Reads quiz results from URL params (no session/DB needed in MVP).
// Displays ranked careers with match percentage.
// "Primary" recommendation = highest score.
// Architecture: when backend is added, this page fetches GET /api/recommendations/:sessionId

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getCareerById, aiImpactLabels, aiImpactColors } from "../../data/careers";

interface ParsedResult {
  careerId: string;
  percentage: number;
}

function RecommendationContent() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("results") ?? "";

  // Parse "backend-engineer:85,frontend-engineer:60,ml-engineer:40"
  const results: ParsedResult[] = raw
    .split(",")
    .map((part) => {
      const [careerId, pct] = part.split(":");
      return { careerId, percentage: parseInt(pct ?? "0", 10) };
    })
    .filter((r) => r.careerId && !isNaN(r.percentage));

  if (results.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-core-muted mb-4">No results found. Please take the quiz first.</p>
        <Link href="/quiz" className="text-core-accent hover:underline">
          Take the Quiz →
        </Link>
      </div>
    );
  }

  const primary = results[0];
  const primaryCareer = getCareerById(primary.careerId);
  const others = results.slice(1);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 pt-28">

      {/* Header */}
      <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-3">
        Your Result
      </p>
      <h1 className="font-display text-4xl text-core-heading mb-2">
        Your CorePath is ready.
      </h1>
      <p className="text-core-muted mb-10">
        Based on your answers, here is your recommended specialization.
      </p>

      {/* Primary recommendation */}
      {primaryCareer && (
        <div className="rounded-card border border-core-accent/40 bg-core-surface p-6 mb-6 glow-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{primaryCareer.icon}</span>
              <div>
                <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-1">
                  Best Match — {primary.percentage}% alignment
                </p>
                <h2 className="font-display text-2xl text-core-heading">
                  {primaryCareer.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Match bar */}
          <div className="mb-4">
            <div className="h-1.5 bg-core-border rounded-full overflow-hidden">
              <div
                className="h-full bg-core-accent rounded-full transition-all duration-700"
                style={{ width: `${primary.percentage}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-core-muted mb-4">{primaryCareer.tagline}</p>

          {/* Core skill highlight */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-core-accent/5 border border-core-accent/20">
            <span className="text-core-accent text-lg">★</span>
            <div>
              <p className="text-xs font-mono text-core-muted">Your One Core Skill</p>
              <p className="text-sm font-medium text-core-accent">{primaryCareer.coreSkill}</p>
            </div>
          </div>

          {/* AI impact */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-mono mb-5 ${aiImpactColors[primaryCareer.aiImpact]}`}>
            {aiImpactLabels[primaryCareer.aiImpact]}
          </div>

          <div className="flex gap-3">
            <Link
              href={`/careers/${primaryCareer.id}`}
              className="flex-1 text-center px-4 py-2.5 rounded-lg bg-core-accent text-core-bg text-sm font-medium hover:bg-core-accent/90 transition-colors"
            >
              View Full Roadmap →
            </Link>
            <Link
              href="/quiz"
              className="px-4 py-2.5 rounded-lg border border-core-border text-core-muted text-sm hover:border-core-accent/40 transition-colors"
            >
              Retake
            </Link>
          </div>
        </div>
      )}

      {/* Other matches */}
      {others.length > 0 && (
        <div>
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-3">
            Other Matches
          </p>
          <div className="space-y-3">
            {others.map((r) => {
              const career = getCareerById(r.careerId);
              if (!career) return null;
              return (
                <Link
                  key={r.careerId}
                  href={`/careers/${r.careerId}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-core-border bg-core-surface hover:border-core-accent/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{career.icon}</span>
                    <div>
                      <p className="text-sm text-core-text group-hover:text-core-accent transition-colors">
                        {career.title}
                      </p>
                      <p className="text-xs text-core-muted font-mono">{career.coreSkill}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-core-muted">{r.percentage}%</p>
                    <div className="w-16 h-1 bg-core-border rounded-full mt-1">
                      <div
                        className="h-full bg-core-muted rounded-full"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Explore all */}
      <div className="mt-8 text-center">
        <Link href="/careers" className="text-sm text-core-muted hover:text-core-accent transition-colors">
          Browse all career paths →
        </Link>
      </div>
    </div>
  );
}

// Suspense boundary required because useSearchParams() is async in Next.js App Router
export default function RecommendationPage() {
  return (
    <Suspense fallback={
      <div className="pt-28 text-center text-core-muted font-mono text-sm">
        Calculating your path...
      </div>
    }>
      <RecommendationContent />
    </Suspense>
  );
}
