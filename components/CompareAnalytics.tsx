"use client";

import { useEffect } from "react";
import { logEvent } from "../data/analytics-events";
import { saveComparison } from "../data/comparison-history";

interface CompareAnalyticsProps {
  careerA: string;
  careerB: string;
  categoryA?: string;
  categoryB?: string;
  recommendationSummary?: string;
  comparisonSignals?: string[];
}

export default function CompareAnalytics({
  careerA,
  careerB,
  categoryA,
  categoryB,
  recommendationSummary,
  comparisonSignals = [],
}: CompareAnalyticsProps) {
  useEffect(() => {
    logEvent("comparison_opened", {
      careerA,
      careerB,
      categoryA,
      categoryB,
    });

    if (recommendationSummary) {
      saveComparison({
        careerA,
        careerB,
        recommendationSummary,
        comparisonSignals,
        // winnerCareer can be derived or left optional as per engine results
      });
    }
  }, [careerA, careerB, categoryA, categoryB]);

  return null;
}
