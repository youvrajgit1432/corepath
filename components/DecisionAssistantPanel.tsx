"use client";

import { useEffect, useState, useCallback } from "react";
import {
  analyzeDecision,
  loadLastDecisionAnalysis,
  formatDecisionConfidence,
  type DecisionAnalysis,
} from "../data/decision-assistant";
import type { EnhancedProfile } from "../data/quiz-enhanced";

type Props = {
  careerAId: string;
  careerBId: string;
  enhancedProfile?: EnhancedProfile;
  className?: string;
};

export default function DecisionAssistantPanel({
  careerAId,
  careerBId,
  enhancedProfile,
  className = "",
}: Props) {
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const result = analyzeDecision(careerAId, careerBId, enhancedProfile);
    setAnalysis(result);
    setLoading(false);
  }, [careerAId, careerBId, enhancedProfile]);

  useEffect(() => {
    // Try cache first
    const cached = loadLastDecisionAnalysis();
    if (cached && cached.careerA.id === careerAId && cached.careerB.id === careerBId) {
      setAnalysis(cached);
      setLoading(false);
      return;
    }
    load();
  }, [load, careerAId, careerBId]);

  if (loading) {
    return (
      <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 rounded bg-core-border/50" />
          <div className="h-20 rounded bg-core-border/30" />
          <div className="h-12 rounded bg-core-border/30" />
        </div>
      </section>
    );
  }

  if (!careerAId || !careerBId) {
    return (
      <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Decision Assistant</p>
          <h2 className="mt-2 text-2xl font-display text-core-heading">Compare careers to get started</h2>
        </div>
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-5">
          <p className="text-sm text-core-text leading-relaxed">
            Select two careers on the explore page or open a comparison to receive personalized decision intelligence
            based on your thinking style, market signals, and exploration history.
          </p>
        </div>
      </section>
    );
  }

  if (!analysis) return null;

  const conf = formatDecisionConfidence(analysis.decisionConfidence);

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Decision Assistant</p>
        <h2 className="mt-2 text-2xl font-display text-core-heading">
          {analysis.careerA.title} vs. {analysis.careerB.title}
        </h2>
      </div>

      {/* Confidence gauge */}
      <div className="mb-6 rounded-3xl border border-core-border bg-core-bg/70 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-core-heading">Decision confidence</p>
          <span className={`text-sm font-semibold ${conf.color}`}>{conf.label}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-core-border/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-core-accent transition-all duration-700"
            style={{ width: `${analysis.decisionConfidence}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-core-muted">{analysis.decisionConfidence}/100 — based on profile alignment, tradeoffs, and exploration history</p>
      </div>

      {/* Pros per path */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-sm font-semibold text-core-heading mb-3">Why {analysis.careerA.title}</p>
          <ul className="space-y-2 text-sm text-core-text">
            {analysis.careerPros.careerA.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400 shrink-0">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-sm font-semibold text-core-heading mb-3">Why {analysis.careerB.title}</p>
          <ul className="space-y-2 text-sm text-core-text">
            {analysis.careerPros.careerB.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-400 shrink-0">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tradeoffs */}
      <div className="mb-6 rounded-3xl border border-core-border bg-core-bg/70 p-4">
        <p className="text-sm font-semibold text-core-heading mb-3">Tradeoffs to weigh</p>
        <ul className="space-y-2 text-sm text-core-text">
          {analysis.careerTradeoffs.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 text-yellow-400 shrink-0">⚖️</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Alignment reasons */}
      <div className="mb-6 rounded-3xl border border-core-border bg-core-bg/70 p-4">
        <p className="text-sm font-semibold text-core-heading mb-3">Why this fits</p>
        <ul className="space-y-2 text-sm text-core-text">
          {analysis.alignmentReasons.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 text-blue-400 shrink-0">🎯</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Risk factors */}
      <div className="mb-6 rounded-3xl border border-core-border bg-core-bg/70 p-4">
        <p className="text-sm font-semibold text-core-heading mb-3">Reasons for uncertainty</p>
        <ul className="space-y-2 text-sm text-core-text">
          {analysis.riskFactors.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 text-orange-400 shrink-0">⚠️</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tie-breaker signals */}
      {analysis.tieBreakerSignals.length > 0 && (
        <div className="mb-6 rounded-3xl border border-core-border bg-core-bg/70 p-4">
          <p className="text-sm font-semibold text-core-heading mb-3">
            {analysis.careerA.title} vs {analysis.careerB.title}
          </p>
          <ul className="space-y-2 text-sm text-core-text">
            {analysis.tieBreakerSignals.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 text-core-accent shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation narrative */}
      <div className="rounded-3xl border border-core-border bg-core-accent/5 p-5">
        <div className="flex items-start gap-4">
          <span className="text-2xl shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-core-heading mb-2">Next suggested action</p>
            <p className="text-sm text-core-text leading-relaxed">{analysis.recommendationNarrative}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
