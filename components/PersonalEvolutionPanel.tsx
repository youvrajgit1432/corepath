"use client";

import { useState, useEffect, useCallback } from "react";
import {
  computePersonalEvolution,
  loadPersonalEvolution,
  type PersonalEvolutionData,
  type MilestoneMoment,
} from "../data/personal-evolution";

// ── Helpers ──

function evolutionColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 45) return "text-blue-400";
  if (score >= 25) return "text-amber-400";
  return "text-core-muted";
}

function evolutionLabel(score: number): string {
  if (score >= 70) return "Strong Evolution";
  if (score >= 45) return "Developing Journey";
  if (score >= 25) return "Early Progress";
  return "Just Started";
}

function milestoneIcon(m: MilestoneMoment): string {
  return m.icon;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// ── Evolution Score Gauge ──

function EvolutionGauge({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "#34d399" : score >= 45 ? "#60a5fa" : score >= 25 ? "#fbbf24" : "#6b7280";

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${evolutionColor(score)}`}>{score}</span>
        <span className="text-[9px] uppercase tracking-wider text-core-muted/60 mt-0.5">Evolution</span>
      </div>
    </div>
  );
}

// ── Milestone Timeline Item ──

function MilestoneItem({
  moment,
  isLast,
  onSelect,
}: {
  moment: MilestoneMoment;
  isLast: boolean;
  onSelect: (m: MilestoneMoment) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(moment)}
      className="group flex w-full items-start gap-3 text-left transition hover:opacity-80"
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-xs transition group-hover:bg-core-accent/25">
          {milestoneIcon(moment)}
        </span>
        {!isLast && <div className="mt-1 h-full w-px bg-core-border/50 min-h-[12px]" />}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-sm font-semibold text-core-heading group-hover:text-core-accent transition-colors line-clamp-1">
          {moment.label}
        </p>
        <p className="text-xs text-core-muted/70 mt-0.5 line-clamp-2">{moment.detail}</p>
        <p className="text-[10px] text-core-muted/50 mt-0.5">{formatDate(moment.date)}</p>
      </div>
    </button>
  );
}

// ── Component ──

interface Props {
  className?: string;
}

export default function PersonalEvolutionPanel({ className = "" }: Props) {
  const [evolution, setEvolution] = useState<PersonalEvolutionData | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneMoment | null>(null);

  const refresh = useCallback(() => {
    const fresh = computePersonalEvolution();
    setEvolution(fresh);
  }, []);

  useEffect(() => {
    const cached = loadPersonalEvolution();
    if (cached) {
      setEvolution(cached);
    } else {
      refresh();
    }
  }, [refresh]);

  if (!evolution) return null;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Personal Evolution</p>
          <h2 className="mt-1 text-lg font-semibold text-core-heading">
            How you&apos;ve changed
          </h2>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          Refresh
        </button>
      </div>

      {/* Top row: Gauge + Then vs Now */}
      <div className="grid gap-5 md:grid-cols-[auto_1fr] mb-6">
        {/* Evolution gauge */}
        <div className="relative flex items-center justify-center">
          <EvolutionGauge score={evolution.evolutionScore} />
        </div>

        {/* Then vs Now + Identity shift */}
        <div className="space-y-3">
          {/* Evolution score label */}
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${evolutionColor(evolution.evolutionScore)} border-current/20 bg-current/5`}>
            {evolutionLabel(evolution.evolutionScore)}
          </div>

          {/* Confidence growth */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-core-muted">Confidence:</span>
            <span
              className={`font-semibold ${
                evolution.confidenceGrowth > 0
                  ? "text-emerald-400"
                  : evolution.confidenceGrowth < 0
                    ? "text-amber-400"
                    : "text-core-muted"
              }`}
            >
              {evolution.confidenceGrowth > 0 ? "+" : ""}
              {evolution.confidenceGrowth}%
            </span>
            <span className="text-core-muted/50 text-xs">
              {evolution.confidenceGrowth > 5
                ? "growing"
                : evolution.confidenceGrowth < -5
                  ? "moderating"
                  : "steady"}
            </span>
          </div>

          {/* Identity shift */}
          <p className="text-sm text-core-text leading-relaxed line-clamp-3">
            {evolution.identityShift}
          </p>
        </div>
      </div>

      {/* Growth Narrative */}
      <div className="rounded-xl border border-core-accent/15 bg-core-accent/5 p-4 mb-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-accent font-semibold mb-1.5">
          Your Growth Story
        </p>
        <p className="text-sm text-core-text leading-relaxed">{evolution.growthNarrative}</p>
      </div>

      {/* Milestone Timeline */}
      {evolution.milestoneMoments.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
            Milestones ({evolution.milestoneMoments.length})
          </p>
          <div className="space-y-0">
            {evolution.milestoneMoments.map((m, i) => (
              <MilestoneItem
                key={`${m.type}-${i}`}
                moment={m}
                isLast={i === evolution.milestoneMoments.length - 1}
                onSelect={setSelectedMilestone}
              />
            ))}
          </div>
        </div>
      )}

      {/* Turning Points */}
      {evolution.turningPoints.length > 0 && (
        <details className="group mb-4">
          <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-core-muted hover:text-core-text transition">
            <span className="inline-block transition-transform group-open:rotate-90">›</span>
            Turning Points ({evolution.turningPoints.length})
          </summary>
          <ul className="mt-2 space-y-1.5 pl-4">
            {evolution.turningPoints.map((tp, idx) => (
              <li key={idx} className="text-xs text-core-muted/70 leading-relaxed list-disc">
                {tp}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Interest Evolution */}
      {evolution.interestEvolution.length > 0 && (
        <details className="group mb-4">
          <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-core-muted hover:text-core-text transition">
            <span className="inline-block transition-transform group-open:rotate-90">›</span>
            Interest Evolution ({evolution.interestEvolution.length})
          </summary>
          <ul className="mt-2 space-y-1.5 pl-4">
            {evolution.interestEvolution.map((ie, idx) => (
              <li key={idx} className="text-xs text-core-muted/70 leading-relaxed list-disc">
                {ie}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Behavior Changes */}
      {evolution.behaviorChanges.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-core-muted hover:text-core-text transition">
            <span className="inline-block transition-transform group-open:rotate-90">›</span>
            Behavior Changes ({evolution.behaviorChanges.length})
          </summary>
          <ul className="mt-2 space-y-1.5 pl-4">
            {evolution.behaviorChanges.map((bc, idx) => (
              <li key={idx} className="text-xs text-core-muted/70 leading-relaxed list-disc">
                {bc}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Selected Milestone Dialog */}
      {selectedMilestone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedMilestone(null)}
        >
          <div
            className="rounded-2xl border border-core-border bg-core-surface p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{selectedMilestone.icon}</span>
              <div>
                <p className="text-sm font-semibold text-core-heading">{selectedMilestone.label}</p>
                <p className="text-[10px] text-core-muted/60 uppercase tracking-wider">
                  {selectedMilestone.type.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            <p className="text-sm text-core-text leading-relaxed">{selectedMilestone.detail}</p>
            <p className="text-xs text-core-muted/50 mt-2">{formatDate(selectedMilestone.date)}</p>
            <button
              type="button"
              onClick={() => setSelectedMilestone(null)}
              className="mt-4 w-full rounded-full bg-core-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
