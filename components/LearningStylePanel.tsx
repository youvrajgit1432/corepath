"use client";

import { useState, useEffect, useCallback } from "react";
import { getLearningStyle, loadLearningStyle, type LearningStyleData } from "@/data/learning-style";

type Props = {
  className?: string;
};

export default function LearningStylePanel({ className = "" }: Props) {
  const [data, setData] = useState<LearningStyleData | null>(null);
  
  // ── Accordion state ──
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [showAttention, setShowAttention] = useState(false);
  const [showRetention, setShowRetention] = useState(false);

  const refresh = useCallback(() => {
    const existing = loadLearningStyle();
    if (existing) {
      setData(existing);
    } else {
      setData(getLearningStyle());
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!data) return null;

  const {
    learningStyle,
    learningVelocity,
    retentionPattern,
    preferredDifficulty,
    learningEnvironment,
    attentionPattern,
    learningStrengths,
    learningNarrative,
  } = data;

  // ── Color helpers ──
  const velocityColor =
    learningVelocity >= 65 ? "text-emerald-400" : learningVelocity >= 40 ? "text-amber-400" : "text-slate-400";
  const velocityStroke =
    learningVelocity >= 65 ? "#34d399" : learningVelocity >= 40 ? "#fbbf24" : "#94a3b8";

  const difficultyBadgeColor: Record<string, string> = {
    easier: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    moderate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    challenging: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  };

  const styleBadgeColor: Record<string, string> = {
    "Exploratory Sequential": "bg-sky-500/15 text-sky-400 border-sky-500/30",
    "Focused Deep": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    "Structured Repetition": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "Varied Discovery": "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  };

  // ── SVG arc path (bottom-half gauge, 0–100) ──
  const radius = 48;
  const strokeWidth = 8;
  const normalized = Math.max(0, Math.min(100, learningVelocity));
  const clamped = normalized / 100;
  const angle = -180 + clamped * 180; // -180 to 0 degrees
  const rad = (angle * Math.PI) / 180;
  const cx = 60;
  const cy = 60;
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius * Math.cos(rad);
  const endY = cy + radius * Math.sin(rad);

  const largeArcFlag = clamped > 0.5 ? 1 : 0;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* ─── HEADER ─── */}
      <p className="text-xs uppercase tracking-[0.24em] text-core-muted font-semibold">
        Learning Style
      </p>
      <h3 className="mt-1 text-lg font-semibold text-core-heading">
        How you learn best
      </h3>

      {/* ─── STYLE BADGE + VELOCITY GAUGE ─── */}
      <div className="mt-4 flex items-center gap-5">
        {/* Velocity gauge */}
        <div className="relative shrink-0">
          <svg width={120} height={70} viewBox="0 0 120 70" className="overflow-visible">
            {/* Background arc */}
            <path
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Value arc */}
            {clamped > 0 && (
              <path
                d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
                fill="none"
                stroke={velocityStroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
          </svg>
          <div className="absolute inset-x-0 top-3 text-center">
            <span className={`text-xl font-bold ${velocityColor}`}>{learningVelocity}</span>
            <p className="text-[9px] uppercase tracking-wider text-core-muted/70">Velocity</p>
          </div>
        </div>

        {/* Style + difficulty */}
        <div className="space-y-2">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
              styleBadgeColor[learningStyle] ?? "bg-core-accent/15 text-core-accent border-core-accent/30"
            }`}
          >
            {learningStyle}
          </span>
          <p className="text-xs text-core-muted">
            Difficulty:{" "}
            <span
              className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                difficultyBadgeColor[preferredDifficulty] ?? "border-core-border text-core-muted"
              }`}
            >
              {preferredDifficulty}
            </span>
          </p>
        </div>
      </div>

      {/* ─── STRENGTH BARS ─── */}
      {learningStrengths.length > 0 && (
        <div className="mt-5 space-y-2.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Learning Strengths
          </p>
          {learningStrengths.slice(0, 4).map((s) => (
            <div key={s.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-core-text font-medium">{s.name}</span>
                <span className="text-core-muted">{s.score}/100</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-indigo-400 transition-all duration-500"
                  style={{ width: `${s.score}%` }}
                />
              </div>
              {s.evidence.length > 0 && (
                <p className="text-[10px] text-core-muted/60 leading-tight">{s.evidence[0]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── COLLAPSIBLE SECTIONS ─── */}
      <div className="mt-5 space-y-2">
        {/* Retention pattern */}
        <div>
          <button
            type="button"
            onClick={() => setShowRetention(!showRetention)}
            className="flex w-full items-center justify-between rounded-lg bg-core-bg/50 px-3 py-2 text-left text-xs font-medium text-core-text transition hover:bg-core-bg/80"
          >
            <span>Retention Pattern</span>
            <span className={`text-core-muted transition-transform ${showRetention ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          {showRetention && (
            <p className="mt-1.5 px-3 text-xs text-core-muted leading-relaxed">{retentionPattern}</p>
          )}
        </div>

        {/* Attention pattern */}
        <div>
          <button
            type="button"
            onClick={() => setShowAttention(!showAttention)}
            className="flex w-full items-center justify-between rounded-lg bg-core-bg/50 px-3 py-2 text-left text-xs font-medium text-core-text transition hover:bg-core-bg/80"
          >
            <span>Attention Pattern</span>
            <span className={`text-core-muted transition-transform ${showAttention ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          {showAttention && (
            <p className="mt-1.5 px-3 text-xs text-core-muted leading-relaxed">{attentionPattern}</p>
          )}
        </div>

        {/* Environment */}
        <div>
          <button
            type="button"
            onClick={() => setShowEnvironment(!showEnvironment)}
            className="flex w-full items-center justify-between rounded-lg bg-core-bg/50 px-3 py-2 text-left text-xs font-medium text-core-text transition hover:bg-core-bg/80"
          >
            <span>Optimal Environment</span>
            <span className={`text-core-muted transition-transform ${showEnvironment ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          {showEnvironment && (
            <p className="mt-1.5 px-3 text-xs text-core-muted leading-relaxed">{learningEnvironment}</p>
          )}
        </div>
      </div>

      {/* ─── NARRATIVE ─── */}
      <div className="mt-5 rounded-xl border border-core-border bg-core-bg/40 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">Assessment</p>
        <p className="mt-1.5 text-xs text-core-text leading-relaxed italic">
          {learningNarrative}
        </p>
      </div>
    </section>
  );
}
