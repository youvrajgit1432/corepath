"use client";

import { memo } from "react";
import { generateConfidenceMetrics, getTopConfidenceSignals, getTopUncertaintySignals, type ConfidenceMetrics } from "../data/confidence-engine";
import type { JourneyMemory } from "../data/journey-memory";
import type { EnhancedProfile } from "../data/quiz-enhanced";

type Props = {
  journey: JourneyMemory;
  profile?: EnhancedProfile;
  layout?: "compact" | "expanded";
  className?: string;
};

function ConfidencePanel({ journey, profile, layout = "compact", className = "" }: Props) {
  const metrics = generateConfidenceMetrics(journey, profile);

  if (layout === "compact") {
    return <CompactView metrics={metrics} className={className} />;
  }

  return <ExpandedView metrics={metrics} className={className} />;
}

function CompactView({ metrics, className }: { metrics: ConfidenceMetrics; className: string }) {
  const confidenceColor =
    metrics.confidenceLevel === "high"
      ? "text-green-600 dark:text-green-400"
      : metrics.confidenceLevel === "medium"
      ? "text-yellow-600 dark:text-yellow-400"
      : metrics.confidenceLevel === "low"
      ? "text-orange-600 dark:text-orange-400"
      : "text-gray-500";

  const explorationEmoji =
    metrics.explorationStatus === "exploring"
      ? "🗺️"
      : metrics.explorationStatus === "narrowing"
      ? "🔍"
      : metrics.explorationStatus === "converging"
      ? "🎯"
      : "✓";

  return (
    <div className={`rounded-card border border-core-border bg-core-surface p-4 ${className}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-core-bg/70 p-4 border border-core-border/50">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">How certain are we?</p>
          <p className={`text-lg font-semibold ${confidenceColor} mb-3`}>
            {metrics.confidenceLevel.charAt(0).toUpperCase() + metrics.confidenceLevel.slice(1)} ({Math.round(metrics.confidenceScore * 100)}%)
          </p>
          <p className="text-sm text-core-muted leading-relaxed">{metrics.confidenceNarrative}</p>
        </div>

        <div className="rounded-lg bg-core-bg/70 p-4 border border-core-border/50">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Your exploration pattern</p>
          <p className="text-lg font-semibold text-core-text mb-1">{explorationEmoji} {metrics.explorationStatus.charAt(0).toUpperCase() + metrics.explorationStatus.slice(1)}</p>
          <p className="text-sm text-core-muted leading-relaxed">{metrics.explorationNarrative}</p>
        </div>
      </div>
    </div>
  );
}

function ExpandedView({ metrics, className }: { metrics: ConfidenceMetrics; className: string }) {
  const confidenceColor =
    metrics.confidenceLevel === "high"
      ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      : metrics.confidenceLevel === "medium"
      ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
      : metrics.confidenceLevel === "low"
      ? "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
      : "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800";

  const maturityBadge =
    metrics.profileMaturity === "emerging"
      ? "🌱"
      : metrics.profileMaturity === "developing"
      ? "🌿"
      : metrics.profileMaturity === "mature"
      ? "🌳"
      : "🏔️";

  const positiveSignals = getTopConfidenceSignals(metrics, 2);
  const uncertaintySignals = getTopUncertaintySignals(metrics, 2);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Confidence Section */}
      <div className={`rounded-card border p-6 ${confidenceColor}`}>
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Confidence Level</p>
            <p className="text-2xl font-semibold text-core-heading">
              {metrics.confidenceLevel.charAt(0).toUpperCase() + metrics.confidenceLevel.slice(1)}
            </p>
            <div className="mt-2 h-2 bg-core-border rounded-full overflow-hidden">
              <div
                className="h-full bg-core-accent transition-all"
                style={{ width: `${metrics.confidenceScore * 100}%` }}
              />
            </div>
            <p className="text-xs text-core-muted mt-1">{Math.round(metrics.confidenceScore * 100)}% certainty</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Uncertainty Level</p>
            <p className="text-2xl font-semibold text-core-heading">
              {metrics.uncertaintyLevel.charAt(0).toUpperCase() + metrics.uncertaintyLevel.slice(1)}
            </p>
            <div className="mt-2 h-2 bg-core-border rounded-full overflow-hidden">
              <div
                className="h-full bg-core-accent/50 transition-all"
                style={{ width: `${metrics.uncertaintyScore * 100}%` }}
              />
            </div>
            <p className="text-xs text-core-muted mt-1">{Math.round(metrics.uncertaintyScore * 100)}% uncertainty</p>
          </div>
        </div>

        <p className="text-sm text-core-text leading-relaxed">{metrics.confidenceNarrative}</p>
      </div>

      {/* Exploration & Maturity */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-card border border-core-border bg-core-surface p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Exploration Status</p>
          <p className="text-lg font-semibold text-core-heading mb-2">
            {metrics.explorationStatus.charAt(0).toUpperCase() + metrics.explorationStatus.slice(1)}
          </p>
          <p className="text-sm text-core-muted">{metrics.explorationNarrative}</p>
        </div>

        <div className="rounded-card border border-core-border bg-core-surface p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Profile Maturity</p>
          <p className="text-lg font-semibold text-core-heading mb-1">{maturityBadge} {metrics.profileMaturity}</p>
          <p className="text-sm text-core-muted">{metrics.evolutionNarrative}</p>
        </div>

        <div className="rounded-card border border-core-border bg-core-surface p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Recommendation Stability</p>
          <p className="text-lg font-semibold text-core-heading mb-2">{metrics.recommendationStability}</p>
          <p className="text-sm text-core-muted">{metrics.recommendationNarrative}</p>
        </div>
      </div>

      {/* Key Signals */}
      <div className="grid gap-4 md:grid-cols-2">
        {positiveSignals.length > 0 && (
          <div className="rounded-card border border-core-border bg-core-surface p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">What's Working</p>
            <ul className="space-y-2">
              {positiveSignals.map((signal, idx) => (
                <li key={idx} className="text-sm text-core-text flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>{signal.explanation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uncertaintySignals.length > 0 && (
          <div className="rounded-card border border-core-border bg-core-surface p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Areas of Uncertainty</p>
            <ul className="space-y-2">
              {uncertaintySignals.map((signal, idx) => (
                <li key={idx} className="text-sm text-core-muted flex items-start gap-2">
                  <span className="mt-1">?</span>
                  <span>{signal.explanation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Next Steps */}
      {metrics.nextSteps.length > 0 && (
        <div className="rounded-card border border-core-border bg-core-surface p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Recommended Next Steps</p>
          <ul className="space-y-2">
            {metrics.nextSteps.map((step, idx) => (
              <li key={idx} className="text-sm text-core-text flex items-start gap-2">
                <span className="mt-1">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            )    )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default memo(ConfidencePanel);

