"use client";

import { useMemo } from "react";
import {
  computeMemoryEvolution,
  type MemoryEvolutionData,
} from "../data/memory-evolution";

type Props = {
  className?: string;
};

function EvolutionGauge({ score }: { score: number }) {
  const deg = (score / 100) * 180;
  const color =
    score >= 65
      ? "border-emerald-500 text-emerald-400"
      : score >= 40
        ? "border-amber-500 text-amber-400"
        : "border-core-accent/60 text-core-muted";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative flex h-28 w-28 items-end justify-center rounded-t-full border-b-8 ${color} bg-core-bg/40`}
        style={{
          background: `conic-gradient(from 0.5turn, transparent ${deg}deg, rgba(255,255,255,0.05) ${deg}deg)`,
        }}
      >
        <span className="mb-3 text-3xl font-bold text-core-heading">{score}</span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-core-muted">
        Evolution score
      </span>
    </div>
  );
}

function ConfidenceBadge({ trend }: { trend: "rising" | "stable" | "declining" | "fluctuating" }) {
  const map: Record<string, { label: string; color: string }> = {
    rising: { label: "Rising ↑", color: "text-emerald-400 bg-emerald-500/10" },
    stable: { label: "Stable →", color: "text-core-accent bg-core-accent/10" },
    declining: { label: "Declining ↓", color: "text-red-400 bg-red-500/10" },
    fluctuating: { label: "Fluctuating ⇅", color: "text-amber-400 bg-amber-500/10" },
  };
  const m = map[trend] ?? { label: trend, color: "text-core-muted bg-white/5" };

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${m.color}`}>
      {m.label}
    </span>
  );
}

function TimelineItem({ text, index }: { text: string; index: number }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-core-accent/15 text-[10px] font-bold text-core-accent">
          {index + 1}
        </div>
        {index < 5 && <div className="mt-1 h-full w-px bg-core-border" />}
      </div>
      <p className="pt-0.5 text-sm text-core-text leading-relaxed">{text}</p>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-3">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function MemoryEvolutionPanel({ className = "" }: Props) {
  const data = useMemo(() => computeMemoryEvolution(), []);

  if (!data) return null;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
        Memory evolution
      </p>
      <h2 className="mt-1 text-lg font-semibold text-core-heading">
        How your thinking has changed
      </h2>

      {/* ─── GAUGE + CONFIDENCE ─── */}
      <div className="mt-6 flex flex-wrap items-start gap-6">
        <EvolutionGauge score={data.evolutionScore} />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-core-heading">Confidence evolution</span>
            <ConfidenceBadge trend={data.confidenceEvolution.trend} />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-core-muted">Before</span>
              <span className="font-semibold text-core-heading">{data.confidenceEvolution.before}%</span>
            </div>
            <span className="text-core-muted">→</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-core-muted">After</span>
              <span className="font-semibold text-core-heading">{data.confidenceEvolution.after}%</span>
            </div>
          </div>

          <div className="mt-2 h-2 w-full max-w-[240px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-core-accent transition-all duration-500"
              style={{ width: `${Math.min(100, data.evolutionScore)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── GRID: BEFORE→AFTER ─── */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card label="Thinking shifts">
          {data.thinkingShifts.length > 0 ? (
            <ul className="space-y-2">
              {data.thinkingShifts.map((shift, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-core-text">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-core-accent/60" />
                  <span>{shift}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-core-muted">No significant thinking shifts detected yet.</p>
          )}
        </Card>

        <Card label="Identity evolution">
          {data.identityEvolution.length > 0 ? (
            <ul className="space-y-2">
              {data.identityEvolution.map((change, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-core-text">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400/60" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-core-muted">Identity is still forming.</p>
          )}
        </Card>
      </div>

      {/* ─── BELIEF CHANGES ─── */}
      {data.beliefChanges.length > 0 && (
        <div className="mt-4">
          <Card label="Belief changes">
            <ul className="space-y-2">
              {data.beliefChanges.map((change, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-core-text">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* ─── CAREER DIRECTION CHANGES ─── */}
      {data.careerDirectionChanges.length > 0 && (
        <div className="mt-4">
          <Card label="Career direction changes">
            <ul className="space-y-2">
              {data.careerDirectionChanges.map((change, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-core-text">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* ─── VELOCITY + SCORE ─── */}
      <div className="mt-4 grid gap-4 grid-cols-2">
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Growth velocity
          </p>
          <p className="mt-2 text-2xl font-bold text-core-heading">{data.growthVelocity}%</p>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-core-accent to-indigo-400 transition-all duration-500"
              style={{ width: `${data.growthVelocity}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Evolution score
          </p>
          <p className="mt-2 text-2xl font-bold text-core-heading">{data.evolutionScore}</p>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.evolutionScore >= 65 ? "bg-emerald-500" : data.evolutionScore >= 40 ? "bg-amber-500" : "bg-core-accent/60"
              }`}
              style={{ width: `${data.evolutionScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── MAJOR TURNING POINTS ─── */}
      {data.majorTurningPoints.length > 0 && (
        <div className="mt-4">
          <Card label="Major turning points">
            <div className="space-y-3">
              {data.majorTurningPoints.map((point, i) => (
                <TimelineItem key={i} text={point} index={i} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ─── NARRATIVE ─── */}
      <div className="mt-4 rounded-2xl border border-core-accent/15 bg-core-accent/5 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
          Timeline narrative
        </p>
        <p className="mt-2 text-sm text-core-text leading-relaxed">
          {data.timelineNarrative}
        </p>
      </div>
    </section>
  );
}
