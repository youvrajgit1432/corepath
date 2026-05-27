"use client";

import { useEffect, useState } from "react";
import { computeCareerStory, type CareerStoryData, type StoryArc, type StoryStage } from "../data/career-story";

// ============================================================================
// COLOR / LABEL HELPERS — using CSS vars in dark/amber shades for light mode
// ============================================================================

const arcColors: Record<StoryArc, string> = {
  discovery: "text-sky-600 border-sky-500/30 bg-sky-500/10",
  growth: "text-emerald-600 border-emerald-500/30 bg-emerald-500/10",
  breakthrough: "text-violet-600 border-violet-500/30 bg-violet-500/10",
  mastery: "text-amber-600 border-amber-500/30 bg-amber-500/10",
  transition: "text-rose-600 border-rose-500/30 bg-rose-500/10",
};

const arcLabels: Record<StoryArc, string> = {
  discovery: "Discovery",
  growth: "Growth",
  breakthrough: "Breakthrough",
  mastery: "Mastery",
  transition: "Transition",
};

const stageColors: Record<StoryStage, string> = {
  early: "text-core-muted",
  building: "text-blue-600",
  accelerating: "text-emerald-600",
  established: "text-violet-600",
};

const arcIcons: Record<StoryArc, string> = {
  discovery: "🔍",
  growth: "🌱",
  breakthrough: "🚀",
  mastery: "🏆",
  transition: "🔄",
};

const impactColors: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  low: "bg-core-border/30 text-core-muted border-core-border",
};

const momentIcons: Record<string, string> = {
  milestone: "🏁",
  achievement: "⭐",
  insight: "💡",
  completion: "✅",
  change: "📈",
};

const turningPointIcons: Record<string, string> = {
  first_breakthrough: "💥",
  confidence_jump: "📊",
  identity_change: "🎭",
  streak_milestone: "🔥",
  career_pivot: "🧭",
  mission_shift: "🎯",
};

function chapterColor(momentumScore: number): string {
  if (momentumScore >= 60) return "border-emerald-500/40 bg-emerald-500/10";
  if (momentumScore < 40) return "border-amber-500/40 bg-amber-500/10";
  return "border-indigo-500/40 bg-indigo-500/10";
}

function scoreColor(score: number): string {
  if (score >= 60) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-core-muted";
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ArcLegend({ storyArc }: { storyArc: StoryArc }) {
  const allArcs: StoryArc[] = ["discovery", "growth", "breakthrough", "mastery", "transition"];
  const currentIdx = allArcs.indexOf(storyArc);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {allArcs.map((arc, i) => {
        const isActive = arc === storyArc;
        const isPast = i < currentIdx;
        return (
          <div key={arc} className="flex items-center gap-0.5">
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap transition-all ${
                isActive
                  ? `${arcColors[arc]} ring-1 ring-inset`
                  : isPast
                    ? "text-core-muted"
                    : "text-core-muted/40"
              }`}
            >
              <span>{arcIcons[arc]}</span>
              <span>{arcLabels[arc]}</span>
              {isPast && <span className="text-[9px]">✓</span>}
            </div>
            {i < allArcs.length - 1 && (
              <span className={`h-px w-2 ${i < currentIdx ? "bg-emerald-500/40" : "bg-core-border/30"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TurningPointCard({ point }: { point: { type: string; title: string; description: string } }) {
  const [expanded, setExpanded] = useState(false);
  const icon = turningPointIcons[point.type as keyof typeof turningPointIcons] ?? "📌";

  return (
    <div className="rounded-xl border border-core-border bg-core-bg/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-3 text-left transition hover:bg-core-accent/5"
      >
        <span className="mt-0.5 text-base">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-core-heading truncate">{point.title}</p>
          </div>
          {expanded && (
            <p className="mt-1.5 text-xs text-core-text leading-relaxed break-safe">{point.description}</p>
          )}
        </div>
        <span className={`mt-1 text-xs text-core-muted transition-transform ${expanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CareerStoryPanel({ className = "" }: { className?: string }) {
  const [data, setData] = useState<CareerStoryData | null>(null);
  const [expandedTurning, setExpandedTurning] = useState(false);
  const [expandedMoments, setExpandedMoments] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  useEffect(() => {
    setData(computeCareerStory());
  }, []);

  if (!data) return null;

  const {
    storyStage,
    storyArc,
    turningPoints,
    majorMoments,
    growthTheme,
    storySignals,
    chapterTitle,
    nextChapterPrediction,
    narrativeSummary,
  } = data;

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-4 sm:p-6 overflow-hidden ${className}`}>
      {/* ── HEADER ── */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Career story intelligence</p>
        <h2 className="mt-1 text-xl font-semibold text-core-heading">Your evolving narrative</h2>
      </div>

      {/* ── CHAPTER TITLE ── */}
      <div className={`rounded-2xl border p-4 ${chapterColor(data.momentumScore)}`}>
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Current chapter
        </p>
        <p className="mt-1 text-lg font-bold text-core-heading break-safe">{chapterTitle}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`font-medium capitalize ${stageColors[storyStage]}`}>
            {storyStage} stage
          </span>
          <span className="text-core-muted">•</span>
          <span className={`font-medium ${scoreColor(data.momentumScore)}`}>
            {data.momentumScore}% momentum
          </span>
          <span className="text-core-muted">•</span>
          <span className="text-core-muted capitalize">{storyArc} arc</span>
        </div>
      </div>

      {/* ── ARC TIMELINE ── */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Journey arc
        </p>
        <ArcLegend storyArc={storyArc} />
      </div>

      {/* ── GROWTH THEME & SIGNALS ── */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-core-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-core-accent">
          {growthTheme}
        </span>
        {storySignals.length > 0 && (
          <span className="text-[10px] text-core-muted">
            {storySignals.length} signal{storySignals.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── TURNING POINTS ── */}
      {turningPoints.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpandedTurning(!expandedTurning)}
            className="flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-core-muted font-semibold hover:text-core-heading transition-colors"
          >
            <span>Turning points ({turningPoints.length})</span>
            <span className={`transition-transform ${expandedTurning ? "rotate-180" : ""}`}>▼</span>
          </button>
          {expandedTurning && (
            <div className="mt-3 space-y-2">
              {turningPoints.map((point, i) => (
                <TurningPointCard key={`tp-${i}`} point={point} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MAJOR MOMENTS ── */}
      {majorMoments.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpandedMoments(!expandedMoments)}
            className="flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-core-muted font-semibold hover:text-core-heading transition-colors"
          >
            <span>Major moments ({majorMoments.length})</span>
            <span className={`transition-transform ${expandedMoments ? "rotate-180" : ""}`}>▼</span>
          </button>
          {expandedMoments && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {majorMoments.map((m, i) => (
                <div
                  key={`mm-${i}`}
                  className="rounded-xl border border-core-border bg-core-bg/60 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span>{momentIcons[m.type] ?? "📌"}</span>
                    <p className="text-sm font-medium text-core-heading break-safe">{m.title}</p>
                  </div>
                  <span
                    className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${impactColors[m.impact]}`}
                  >
                    {m.impact} impact
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NEXT CHAPTER PREDICTION ── */}
      <div className="mt-4 rounded-xl border border-core-border bg-core-bg/60 p-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Next chapter prediction
        </p>
        <p className="mt-1 text-sm text-core-text leading-relaxed break-safe">{nextChapterPrediction}</p>
      </div>

      {/* ── NARRATIVE SUMMARY — collapsed by default with Show More ── */}
      <div className="mt-4 rounded-xl border border-core-accent/15 bg-core-accent/5 p-3">
        <button
          type="button"
          onClick={() => setShowNarrative(!showNarrative)}
          className="flex w-full items-center justify-between text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold hover:text-core-heading transition-colors"
        >
          <span>Narrative summary</span>
          <span className="text-xs">{showNarrative ? "▾ Hide" : "▸ Show"}</span>
        </button>
        <div className={showNarrative ? "" : "max-h-[80px] overflow-hidden relative"}>
          <p className="mt-1 text-sm italic text-core-text leading-relaxed break-safe">
            {narrativeSummary}
          </p>
          {!showNarrative && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />
          )}
        </div>
      </div>
    </section>
  );
}
