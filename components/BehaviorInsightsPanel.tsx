"use client";

import { useState, useEffect, useCallback } from "react";
import {
  computeBehaviorPatterns,
  type BehaviorPatternsData,
} from "../data/behavior-patterns";

type Props = {
  className?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function hesitationColor(level: string): string {
  switch (level) {
    case "decisive":
      return "bg-emerald-500";
    case "moderate":
      return "bg-amber-500";
    case "hesitant":
      return "bg-orange-500";
    case "very_hesitant":
      return "bg-red-500";
    default:
      return "bg-core-accent/60";
  }
}

function hesitationLabel(level: string): string {
  switch (level) {
    case "decisive":
      return "Decisive — clear direction forming";
    case "moderate":
      return "Moderate — weighing options";
    case "hesitant":
      return "Hesitant — needs more clarity";
    case "very_hesitant":
      return "Very hesitant — may benefit from guidance";
    default:
      return "Pending data";
  }
}

function dropoffColor(rate: number): string {
  if (rate >= 0.5) return "text-red-400";
  if (rate >= 0.2) return "text-amber-400";
  return "text-core-muted/60";
}

function curiosityIcon(strength: string): string {
  switch (strength) {
    case "strong":
      return "🟢";
    case "moderate":
      return "🟡";
    case "emerging":
      return "🔵";
    default:
      return "○";
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function BehaviorInsightsPanel({ className = "" }: Props) {
  const [data, setData] = useState<BehaviorPatternsData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAllCuriosity, setShowAllCuriosity] = useState(false);

  const load = useCallback(() => {
    setData(computeBehaviorPatterns());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) return null;

  const { explorationHabits, dropoffPatterns, learningConsistency, curiositySignals, decisionHesitationScore, careerLoopSignals, personalGrowthSignals } = data;

  // Separate positive signals from risk signals
  const strengths = curiositySignals.filter((s) => s.strength === "strong" || s.strength === "moderate");
  const risks = dropoffPatterns.filter((d) => d.rate >= 0.3);

  // Build recommended intervention
  const intervention = buildIntervention(data);

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* ───── HEADER ───── */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Behavior patterns</p>
          <h2 className="mt-1 text-xl font-semibold text-core-heading">Your career intelligence patterns</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-medium text-core-accent transition hover:text-indigo-400"
        >
          {showDetails ? "Show less" : "Show all"}
        </button>
      </div>

      {/* ───── BEHAVIOR SUMMARY ───── */}
      <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Behavior summary
        </p>
        <p className="mt-2 text-sm text-core-text leading-relaxed">
          {explorationHabits.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-core-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${explorationHabits.style === "focused" ? "bg-emerald-500" : explorationHabits.style === "scattered" ? "bg-amber-500" : "bg-blue-500"}`} />
            {explorationHabits.style === "focused" ? "Focused explorer" : explorationHabits.style === "scattered" ? "Broad explorer" : "Balanced explorer"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-core-muted">
            🗂️ {explorationHabits.categoriesExplored} categories
          </span>
          {learningConsistency.currentStreak > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-core-muted">
              🔥 {learningConsistency.currentStreak}-day streak
            </span>
          )}
        </div>
      </div>

      {/* ───── TWO-COLUMN GRID (strengths + risks) ───── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* ── STRENGTH PATTERNS ── */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs">💪</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Strength patterns</p>
          </div>
          {strengths.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {strengths.slice(0, showAllCuriosity ? undefined : 3).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-core-text">
                  <span className="mt-0.5 shrink-0">{curiosityIcon(s.strength)}</span>
                  <span className="leading-snug">{s.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-core-muted">
              More data needed to identify strength patterns. Continue exploring careers and taking quizzes.
            </p>
          )}
          {strengths.length > 3 && !showAllCuriosity && (
            <button
              type="button"
              onClick={() => setShowAllCuriosity(true)}
              className="mt-2 text-xs font-medium text-core-accent hover:text-indigo-400"
            >
              +{strengths.length - 3} more
            </button>
          )}
        </div>

        {/* ── RISK PATTERNS ── */}
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-xs">⚠️</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Risk patterns</p>
          </div>
          {risks.length > 0 || careerLoopSignals.length > 0 || dropoffPatterns.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {risks.slice(0, 2).map((d, i) => (
                <li key={`risk-${i}`} className="flex items-start gap-2 text-sm text-core-text">
                  <span className={`mt-0.5 shrink-0 ${dropoffColor(d.rate)}`}>•</span>
                  <span className="leading-snug">
                    {d.type.charAt(0).toUpperCase() + d.type.slice(1)} dropoff: <span className="text-core-muted">{d.description}</span>
                  </span>
                </li>
              ))}
              {careerLoopSignals.length > 0 && (
                <li className="flex items-start gap-2 text-sm text-core-text">
                  <span className="mt-0.5 shrink-0 text-amber-400">•</span>
                  <span className="leading-snug">
                    {careerLoopSignals[0].revisitCount > 3
                      ? `Frequently revisiting ${careerLoopSignals[0].careerId.replace(/-/g, " ")} (${careerLoopSignals[0].revisitCount}x) — may indicate cycling.`
                      : `${careerLoopSignals.length} career${careerLoopSignals.length > 1 ? "s" : ""} viewed multiple times.`
                    }
                  </span>
                </li>
              )}
              {decisionHesitationScore.level === "hesitant" || decisionHesitationScore.level === "very_hesitant" ? (
                <li className="flex items-start gap-2 text-sm text-core-text">
                  <span className="mt-0.5 shrink-0 text-orange-400">•</span>
                  <span className="leading-snug">
                    Decision hesitation is {decisionHesitationScore.level} — consider narrowing options.
                  </span>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-core-muted">
              No significant risk patterns detected. You're on a steady path.
            </p>
          )}
        </div>
      </div>

      {/* ───── DECISION HESITATION METER ───── */}
      <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">🎯</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Decision hesitation</p>
          </div>
          <span className="text-xs text-core-muted">{decisionHesitationScore.score}/100</span>
        </div>

        {/* Meter bar */}
        <div className="mt-3 h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${hesitationColor(decisionHesitationScore.level)}`}
            style={{ width: `${decisionHesitationScore.score}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-core-muted/60">More decisive</span>
          <span className={`font-medium ${decisionHesitationScore.score > 45 ? "text-amber-400" : "text-emerald-400"}`}>
            {hesitationLabel(decisionHesitationScore.level)}
          </span>
          <span className="text-core-muted/60">More hesitant</span>
        </div>

        {decisionHesitationScore.contributingFactors.length > 0 && showDetails && (
          <ul className="mt-3 space-y-1 border-t border-core-border/40 pt-3">
            {decisionHesitationScore.contributingFactors.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-core-muted/50" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ───── CURIOSITY INDICATORS (more detail) ───── */}
      {curiositySignals.length > 0 && showDetails && (
        <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-xs">🔍</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Curiosity indicators</p>
          </div>
          <ul className="mt-3 space-y-2">
            {curiositySignals.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-core-text">
                <span className="mt-0.5 shrink-0">{curiosityIcon(s.strength)}</span>
                <div>
                  <span className="font-medium text-core-heading">
                    {s.strength === "strong" ? "Strong" : s.strength === "moderate" ? "Moderate" : "Emerging"}:
                  </span>{" "}
                  {s.detail}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ───── PERSONAL GROWTH SIGNALS ───── */}
      {personalGrowthSignals.length > 0 && (
        <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs">📈</span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Growth signals</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {personalGrowthSignals.map((s, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 ${
                  s.trend === "improving"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : s.trend === "declining"
                      ? "border-amber-500/20 bg-amber-500/5"
                      : "border-core-border bg-white/5"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      s.trend === "improving"
                        ? "bg-emerald-500"
                        : s.trend === "declining"
                          ? "bg-amber-500"
                          : "bg-core-muted/50"
                    }`}
                  />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-core-muted/70">
                    {s.trend}
                  </span>
                </div>
                <p className="mt-1 text-sm text-core-text leading-snug">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── RECOMMENDED INTERVENTION ───── */}
      <div className="mt-4 rounded-2xl border border-core-accent/15 bg-core-accent/5 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs">💡</span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Recommended intervention</p>
        </div>
        <p className="mt-2 text-sm text-core-text leading-relaxed">{intervention}</p>
      </div>

      {/* ───── EXPANDED DETAILS ───── */}
      {showDetails && (
        <>
          {/* Repeat comparison patterns */}
          {data.repeatComparisonPatterns.length > 0 && (
            <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                Repeated comparisons ({data.repeatComparisonPatterns.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {data.repeatComparisonPatterns.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-core-text">
                    <span>
                      {p.careerA.replace(/-/g, " ")} ↔ {p.careerB.replace(/-/g, " ")}
                    </span>
                    <span className={`font-medium ${p.indecisionSignal ? "text-amber-400" : "text-core-muted"}`}>
                      {p.count}x {p.indecisionSignal ? "⚠️" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dropoff details */}
          {dropoffPatterns.length > 0 && (
            <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                Dropoff details
              </p>
              <div className="mt-3 space-y-2">
                {dropoffPatterns.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`w-20 shrink-0 text-xs font-medium uppercase tracking-wider ${dropoffColor(d.rate)}`}>
                      {d.type}
                    </span>
                    <div className="flex-1">
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.rate >= 0.5 ? "bg-red-500" : d.rate >= 0.2 ? "bg-amber-500" : "bg-core-accent/40"}`}
                          style={{ width: `${Math.min(100, d.rate * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs text-core-muted">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Career loop details */}
          {careerLoopSignals.length > 0 && (
            <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
                Career revisits
              </p>
              <ul className="mt-2 space-y-1.5">
                {careerLoopSignals.map((l, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-core-text">
                    <span>{l.careerId.replace(/-/g, " ")}</span>
                    <span className={l.indecisionPotential ? "text-amber-400 font-medium" : "text-core-muted"}>
                      {l.revisitCount} views {l.indecisionPotential ? "🔄" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── Intervention logic ─────────────────────────────────────────────────────────

function buildIntervention(data: BehaviorPatternsData): string {
  const { decisionHesitationScore, learningConsistency, explorationHabits, curiositySignals, dropoffPatterns } = data;

  // High decision hesitation
  if (decisionHesitationScore.score > 60) {
    return "You appear to be weighing many options carefully. Try narrowing your focus to 2–3 careers and completing a structured comparison. The Career Command Center's comparison tool can help clarify tradeoffs.";
  }

  // Low consistency
  if (learningConsistency.score < 30) {
    return "Building a regular cadence will accelerate your career clarity. Try setting aside 15 minutes daily or 45 minutes twice a week for career exploration. Even small consistent actions build momentum.";
  }

  // Scattered exploration
  if (explorationHabits.style === "scattered") {
    return "You're exploring broadly, which is great for discovery. To build depth, try selecting one career category each week for focused exploration. Use the roadmap feature to guide structured learning.";
  }

  // Significant dropoffs
  const significantDropoffs = dropoffPatterns.filter((d) => d.rate >= 0.4);
  if (significantDropoffs.length > 0) {
    const types = significantDropoffs.map((d) => d.type).join(" and ");
    return `We noticed some ${types} activities are started but not completed. Try shorter sessions or set specific goals before starting. Breaking tasks into smaller steps can help with follow-through.`;
  }

  // Strong curiosity across multiple areas
  const strongCuriosity = curiositySignals.filter((s) => s.strength === "strong");
  if (strongCuriosity.length >= 2) {
    return "Your curiosity spans many areas — that's a strength! To channel it productively, try creating a 'top 3' shortlist of career paths and diving deeper into each one using the project recommendations tool.";
  }

  // Good progress — maintain
  if (learningConsistency.score >= 60 && decisionHesitationScore.score <= 30) {
    return "You're on a strong trajectory with consistent engagement and clear direction. Keep the momentum going — consider advancing to the next milestone in your selected career roadmap.";
  }

  // Default: supportive nudge
  return "Continue exploring careers and completing quizzes to unlock deeper behavioral insights. The more you engage, the more personalized your pattern analysis becomes.";
}
