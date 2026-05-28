"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCareerById } from "../../data/careers";
import { buildCareerSurfaceExplanation } from "../../data/recommendation-explanations";
import { buildCareerEvolution } from "../../data/career-evolution";
import { loadJourneyMemory } from "../../data/journey-memory";
import { logEvent } from "../../data/analytics-events";
import { getProjectsForCareer } from "../../data/project-recommendations";
import QuizResultTabs from "../../components/QuizResultTabs";

interface ParsedResult {
  careerId: string;
  percentage: number;
}

export default function RecommendationContent() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("results") ?? "";

  useEffect(() => {
    logEvent("recommendation_viewed", { resultsCount: raw.split(",").length });
  }, [raw]);

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
  const comparison = others[0] ? primary.percentage - others[0].percentage : undefined;
  const primaryExplanation = primaryCareer
    ? buildCareerSurfaceExplanation(primaryCareer, others[0] ? getCareerById(others[0].careerId) : undefined, comparison)
    : null;
  const evolution = primaryCareer ? buildCareerEvolution(primaryCareer) : null;
  const journey = loadJourneyMemory();
  const projectRecommendations = primaryCareer ? getProjectsForCareer(primaryCareer) : undefined;

  if (!primaryCareer) {
    return (
      <div className="text-center py-20">
        <p className="text-core-muted">Could not load career data.</p>
      </div>
    );
  }

  return (
    <QuizResultTabs
      primaryCareer={primaryCareer}
      allResults={results}
      primaryExplanation={primaryExplanation}
      evolution={evolution}
      projectRecommendations={projectRecommendations}
    />
  );
}
