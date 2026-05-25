"use client";

import { useState, useEffect } from "react";
import {
  computeHabitIntelligence,
  loadHabitIntelligence,
  getHabitIntelligence,
  type HabitIntelligenceData,
} from "../data/habit-intelligence";

type Props = {
  className?: string;
};

const STATE_COLORS = {
  strengthen: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  maintain: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  build: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
} as const;

const RECOMMENDATION_LABELS: Record<string, string> = {
  reinforce: "Reinforce ✓",
  maintain: "Maintain →",
  micro_habit: "Micro-Habit ↻",
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  reinforce: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  maintain: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  micro_habit: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

function HabitGauge({ score }: { score: number }) {
  const r = 48;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 65 ? "#34d399" : score >= 40 ? "#60a5fa" : "#f59e0b";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-white/10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    timing: "🕐",
    consistency: "📋",
    engagement: "⚡",
    exploration: "🔍",
    achievement: "🏆",
  };
  return <span className="text-sm">{icons[category] ?? "●"}</span>;
}

export default function HabitIntelligencePanel({ className = "" }: Props) {
  const [data, setData] = useState<HabitIntelligenceData | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [showBreaking, setShowBreaking] = useState(false);
  const [showSignals, setShowSignals] = useState(false);

  useEffect(() => {
    // Try loading cached first, then compute fresh
    const existing = loadHabitIntelligence();
    if (existing) {
      setData(existing);
    }
    // Always compute fresh for latest data
    const fresh = computeHabitIntelligence();
    setData(fresh);
  }, []);

  if (!data) return null;

  const stateKey =
    data.habitScore >= 65 ? "strengthen" : data.habitScore >= 40 ? "maintain" : "build";
  const stateStyle = STATE_COLORS[stateKey];
  const strongHabits = data.habitCandidates.filter((c) => c.strength >= 55);
  const weakPatterns = data.habitCandidates.filter((c) => c.strength < 50);

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Habit intelligence</p>
          <h2 className="mt-1 text-lg font-semibold text-core-heading">
            Your habit formation
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${stateStyle.bg} ${stateStyle.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${stateStyle.dot}`} />
          {stateKey === "strengthen"
            ? "Strengthening"
            : stateKey === "maintain"
              ? "Building"
              : "Early stage"}
        </span>
      </div>

      {/* Hero: Gauge + Strength + Counts */}
      <div className="flex flex-wrap items-center gap-6 mb-6">
        <HabitGauge score={data.habitScore} />
        <div className="space-y-1.5">
          <p className="text-sm text-core-muted">
            <span className="font-medium text-core-heading">{data.habitStrength}</span> overall habit strength
          </p>
          <p className="text-xs text-core-muted">
            <span className="text-emerald-400 font-medium">{strongHabits.length}</span> strong habit
            {strongHabits.length !== 1 ? "s" : ""}
            {weakPatterns.length > 0 && (
              <>
                {" · "}
                <span className="text-amber-400 font-medium">{weakPatterns.length}</span> building
              </>
            )}
            {" · "}
            {data.habitCandidates.length} total patterns
          </p>
          {data.recommendedHabits.length > 0 && (
            <p className="text-xs text-core-accent mt-2 italic leading-relaxed">
              &ldquo;{data.recommendedHabits[0]}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Narrative */}
      <div className="mb-5 rounded-xl border border-core-border bg-core-bg/60 p-4">
        <p className="text-sm text-core-text leading-relaxed">{data.habitNarrative}</p>
      </div>

      {/* Habit Candidates */}
      {data.habitCandidates.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
            Detected habits & patterns
          </p>
          <div className="space-y-2">
            {data.habitCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-xl border border-core-border bg-core-bg/60 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCandidate(
                      expandedCandidate === candidate.id ? null : candidate.id
                    )
                  }
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon category={candidate.category} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-core-heading truncate">
                        {candidate.habit}
                      </p>
                      <span
                        className={`inline-block mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          RECOMMENDATION_COLORS[candidate.recommendation] ??
                          "bg-white/5 text-core-muted border-core-border"
                        }`}
                      >
                        {RECOMMENDATION_LABELS[candidate.recommendation] ?? candidate.recommendation}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-12 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            candidate.strength >= 65
                              ? "bg-emerald-500"
                              : candidate.strength >= 40
                                ? "bg-blue-500"
                                : "bg-amber-500"
                          }`}
                          style={{ width: `${candidate.strength}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-core-muted w-6 text-right">
                        {candidate.strength}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-core-muted transition-transform ${
                        expandedCandidate === candidate.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedCandidate === candidate.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-core-border/50">
                    <ul className="mt-3 space-y-1.5">
                      {candidate.evidence.map((ev, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-core-accent/60" />
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Successful Patterns */}
      {data.successfulPatterns.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
            What&apos;s working
          </p>
          <div className="space-y-1.5">
            {data.successfulPatterns.map((pattern, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-emerald-400/90">
                <span className="mt-0.5 shrink-0">✓</span>
                <span>{pattern}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breaking Patterns (collapsible) */}
      {data.breakingPatterns.some((p) => !p.includes("No significant")) && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowBreaking(!showBreaking)}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-core-muted font-semibold"
          >
            <span>Breaking patterns</span>
            <svg
              className={`w-3 h-3 transition-transform ${showBreaking ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showBreaking && (
            <div className="mt-2 space-y-1.5">
              {data.breakingPatterns
                .filter((p) => !p.includes("No significant"))
                .map((pattern, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-400/80">
                    <span className="mt-0.5 shrink-0">⚠</span>
                    <span>{pattern}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Consistency Signals (collapsible) */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowSignals(!showSignals)}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-core-muted font-semibold"
        >
          <span>Consistency signals</span>
          <svg
            className={`w-3 h-3 transition-transform ${showSignals ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showSignals && (
          <div className="mt-2 space-y-1.5">
            {data.consistencySignals.map((signal, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-core-muted">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-core-accent/60" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Habits */}
      {data.recommendedHabits.length > 0 && (
        <div className="rounded-xl border border-core-accent/20 bg-core-accent/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
            Recommended actions
          </p>
          <ul className="space-y-2">
            {data.recommendedHabits.map((habit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-core-text">
                <span className="mt-0.5 text-core-accent shrink-0">{i + 1}.</span>
                <span>{habit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
