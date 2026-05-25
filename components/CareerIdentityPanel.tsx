"use client";

import { useState, useEffect, useCallback } from "react";
import {
  seedIdentityTraits,
  computeCareerIdentity,
  formatArchetype,
  formatGrowthStyle,
  formatFocusPattern,
  buildIdentitySnapshot,
  type CareerIdentity,
} from "../data/career-identity";
import type { ExtendedTraitScores } from "../data/quiz-enhanced";

type Props = {
  enhancedProfileTraits?: ExtendedTraitScores;
  className?: string;
};

export default function CareerIdentityPanel({ enhancedProfileTraits, className = "" }: Props) {
  const [identity, setIdentity] = useState<CareerIdentity | null>(null);
  const [snapshotCopied, setSnapshotCopied] = useState(false);

  const load = useCallback(() => {
    // Seed traits if available from an enhanced profile
    if (enhancedProfileTraits) {
      seedIdentityTraits(enhancedProfileTraits);
    }

    // Compute fresh identity to pick up latest data
    setIdentity(computeCareerIdentity());
  }, [enhancedProfileTraits]);

  useEffect(() => {
    load();
  }, [load]);

  if (!identity) return null;

  const arch = formatArchetype(identity.careerArchetype);

  const handleCopySnapshot = () => {
    const snapshot = buildIdentitySnapshot(identity);
    navigator.clipboard.writeText(snapshot).then(() => {
      setSnapshotCopied(true);
      setTimeout(() => setSnapshotCopied(false), 2000);
    });
  };

  const growthStyleColor =
    identity.growthStyle === "focused-deep-diver"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : identity.growthStyle === "broad-explorer"
        ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
        : "text-amber-400 border-amber-500/30 bg-amber-500/10";

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      {/* Header */}
      <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-4">Career identity</p>

      {/* ───── IDENTITY TITLE + ARCHETYPE ───── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-core-heading leading-tight">
            {identity.identityTitle}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg">{arch.icon}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium
                ${
                  identity.careerArchetype === "architect"
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                    : identity.careerArchetype === "innovator"
                      ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                      : identity.careerArchetype === "researcher"
                        ? "border-teal-500/30 bg-teal-500/10 text-teal-400"
                        : identity.careerArchetype === "strategist"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                          : identity.careerArchetype === "builder"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : identity.careerArchetype === "navigator"
                              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                              : "border-core-muted/30 bg-white/5 text-core-muted"
                }`}
            >
              {arch.label}
            </span>
          </div>
        </div>

        {/* Share snapshot button */}
        <button
          type="button"
          onClick={handleCopySnapshot}
          className="shrink-0 rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-core-accent hover:text-core-accent"
        >
          {snapshotCopied ? "✓ Copied!" : "Share snapshot"}
        </button>
      </div>

      {/* ───── STRENGTHS ───── */}
      {identity.dominantStrengths.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-2">
            Dominant strengths
          </p>
          <div className="flex flex-wrap gap-1.5">
            {identity.dominantStrengths.map((strength) => (
              <span
                key={strength}
                className="inline-flex items-center rounded-full bg-core-accent/10 px-2.5 py-1 text-xs font-medium text-core-accent"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ───── GROWTH STYLE + FOCUS PATTERN ───── */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-3.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Growth style
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${growthStyleColor}`}>
              {formatGrowthStyle(identity.growthStyle)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-core-muted leading-relaxed">
            {identity.growthStyle === "focused-deep-diver"
              ? "You prefer going deep in specific areas, building expertise through focused commitment."
              : identity.growthStyle === "broad-explorer"
                ? "You stay curious and wide-ranging, sampling multiple domains before committing."
                : "You balance depth and breadth, adapting your focus based on what you discover."}
          </p>
        </div>

        <div className="rounded-2xl border border-core-border bg-core-bg/60 p-3.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold">
            Focus pattern
          </p>
          <p className="mt-1.5 text-sm font-semibold text-core-heading">
            {formatFocusPattern(identity.focusPattern)}
          </p>
          <p className="mt-1 text-[11px] text-core-muted leading-relaxed">
            {identity.focusPattern === "niche-specialist"
              ? "Your career exploration concentrates in a narrow range — a strong signal for directed growth."
              : identity.focusPattern === "broad-generalist"
                ? "Your exploration spans widely across multiple domains — building versatile career intelligence."
                : "You've found a productive middle ground, exploring related fields with purpose."}
          </p>
        </div>
      </div>

      {/* ───── AI-ERA POSITIONING ───── */}
      <div className="mt-4 rounded-2xl border border-core-accent/15 bg-gradient-to-br from-core-accent/[0.06] to-transparent p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1">
          AI-era positioning
        </p>
        <p className="text-sm text-core-text leading-relaxed">
          {identity.careerEraPositioning}
        </p>
      </div>

      {/* ───── JOURNEY SUMMARY ───── */}
      <div className="mt-4 rounded-2xl border border-core-border bg-core-bg/60 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-core-muted font-semibold mb-1">
          Journey summary
        </p>
        <p className="text-sm text-core-text leading-relaxed">
          {identity.careerPersonaSummary}
        </p>
      </div>
    </section>
  );
}
