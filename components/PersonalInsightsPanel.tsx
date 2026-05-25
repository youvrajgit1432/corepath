"use client";

import { useEffect, useState } from "react";
import { generatePersonalInsights, generateInsightSummary } from "../data/personal-insights";
import type { PersonalInsight } from "../data/personal-insights";

interface PersonalInsightsPanelProps {
  variant?: "full" | "summary" | "compact";
}

export default function PersonalInsightsPanel({
  variant = "full",
}: PersonalInsightsPanelProps) {
  const [insights, setInsights] = useState<PersonalInsight[]>([]);
  const [summary, setSummary] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const generatedInsights = generatePersonalInsights();
    const generatedSummary = generateInsightSummary();
    setInsights(generatedInsights);
    setSummary(generatedSummary);
  }, []);

  if (!mounted || insights.length === 0) {
    return null;
  }

  if (variant === "summary") {
    return (
      <div className="rounded-3xl border border-core-border bg-core-surface p-6">
        <p className="text-core-muted leading-relaxed">
          {summary.split("**").map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className="font-semibold text-core-heading">
                {part}
              </span>
            ) : (
              part
            )
          )}
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="space-y-3">
        {insights.slice(0, 2).map((insight, index) => (
          <div
            key={index}
            className="rounded-3xl border border-core-border bg-white/5 p-4"
          >
            <div className="flex gap-3">
              <span className="text-xl">{insight.icon}</span>
              <div>
                <p className="text-sm font-semibold text-core-heading">
                  {insight.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-core-accent">
          Your journey
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-core-heading">
          Personal insights
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="rounded-3xl border border-core-border bg-core-surface p-6 hover:border-core-accent/40 transition"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{insight.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-core-heading">{insight.title}</p>
                <p className="mt-3 text-sm text-core-muted leading-relaxed">
                  {insight.message.split("**").map((part, i) =>
                    i % 2 === 1 ? (
                      <span key={i} className="font-semibold text-core-heading">
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
