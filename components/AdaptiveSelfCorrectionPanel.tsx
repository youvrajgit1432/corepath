"use client";

import { useMemo } from "react";
import { computeAdaptiveSelfCorrection, type AdaptiveSelfCorrectionData } from "../data/adaptive-self-correction";

type Props = {
  className?: string;
};

// ── Colour helpers ────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 65) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 65) return "bg-emerald-100/60 dark:bg-emerald-500/20";
  if (score >= 40) return "bg-amber-100/60 dark:bg-amber-500/20";
  return "bg-red-100/60 dark:bg-red-500/20";
}

function trendBadge(trend: string): { label: string; color: string } {
  if (trend === "improving") return { label: "Improving", color: "text-emerald-700 bg-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-500/15" };
  if (trend === "declining") return { label: "Declining", color: "text-red-700 bg-red-100/80 dark:text-red-400 dark:bg-red-500/15" };
  return { label: "Stable", color: "text-core-muted bg-core-border/30 dark:bg-white/5" };
}

// ── Semi-circle gauge ──────────────────────────────────────────────

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const rotation = (score / 100) * 180;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-40 overflow-hidden">
        {/* Background arc */}
        <div className="absolute top-0 left-0 h-40 w-40 rounded-full border-[6px] border-core-border/50" />
        {/* Filled arc */}
        <div
          className={`absolute top-0 left-0 h-40 w-40 rounded-full border-[6px] border-transparent ${scoreColor(score)}`}
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            borderTopColor: "currentColor",
            borderRightColor: "currentColor",
            transform: `rotate(${rotation - 180}deg)`,
            transition: "transform 0.8s ease",
          }}
        />
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
          <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}</span>
          <span className="text-[10px] text-core-muted mt-0.5">{label}</span>
        </div>
      </div>
    </div>
  );
}

// ── Card sections ──────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  accentClass,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  accentClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${accentClass ?? "text-core-muted"}`}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

export default function AdaptiveSelfCorrectionPanel({ className = "" }: Props) {
  const data = useMemo<AdaptiveSelfCorrectionData>(() => computeAdaptiveSelfCorrection(), []);

  const {
    predictionAccuracyTrend,
    recommendationFailures,
    successfulInterventions,
    driftSignals,
    correctionScore,
    modelConfidence,
    improvementActions,
    misalignmentAreas,
    selfCorrectionNarrative,
  } = data;

  const trend = trendBadge(predictionAccuracyTrend);

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-5 ${className}`}>
      {/* ── Header ── */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Adaptive Self-Correction</p>
          <h3 className="mt-1 text-lg font-semibold text-core-heading">Prediction &amp; Recommendation Health</h3>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${trend.color}`}>
          {trend.label}
        </span>
      </div>

      {/* ── Score Gauges Row ── */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-3 ${scoreBg(correctionScore)}`}>
          <ScoreGauge score={correctionScore} label="Correction" />
        </div>
        <div className={`rounded-xl p-3 ${scoreBg(modelConfidence)}`}>
          <ScoreGauge score={modelConfidence} label="Model Conf." />
        </div>
      </div>

      {/* ── Success vs Failure Cards ── */}
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <SectionCard title="Successful interventions" icon="✅" accentClass="text-emerald-600 dark:text-emerald-400">
          {successfulInterventions.length > 0 ? (
            <ul className="space-y-1.5">
              {successfulInterventions.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-core-muted/70 italic">No successful interventions recorded yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Recommendation failures" icon="❌" accentClass="text-red-600 dark:text-red-400">
          {recommendationFailures.length > 0 ? (
            <ul className="space-y-1.5">
              {recommendationFailures.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-red-500/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-core-muted/70 italic">No failures detected — system is aligned.</p>
          )}
        </SectionCard>
      </div>

      {/* ── Drift Signals ── */}
      {driftSignals.length > 0 && (
        <SectionCard title="Drift signals" icon="🔄" accentClass="text-amber-600 dark:text-amber-400" >
          <ul className="space-y-1.5">
            {driftSignals.map((signal, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/70" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* ── Misalignment Areas ── */}
      {misalignmentAreas.length > 0 && (
        <SectionCard title="Misalignment areas" icon="⚡" accentClass="text-red-600 dark:text-red-400" >
          <ul className="space-y-1.5">
            {misalignmentAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-red-500/70" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* ── Improvement Actions ── */}
      <SectionCard title="Improvement actions" icon="🔧" accentClass="text-blue-600 dark:text-blue-400" >
        <ul className="space-y-1.5">
          {improvementActions.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100/80 dark:bg-blue-500/15 text-[9px] font-bold text-blue-700 dark:text-blue-400">
                {i + 1}
              </span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* ── Narrative Summary ── */}
      <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-core-muted">
          📋 Self-correction narrative
        </p>
        <p className="text-sm text-core-text leading-relaxed">{selfCorrectionNarrative}</p>
      </div>
    </section>
  );
}
