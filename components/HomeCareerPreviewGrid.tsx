"use client";

import { useMemo } from "react";
import Link from "next/link";
import { careers as allCareers, aiImpactLabels, aiImpactColors, deriveBadges } from "../data/careers";
import { useStaggeredFadeIn } from "../hooks/useStaggeredFadeIn";

// ─── Compact card for the homepage grid ───

interface CareerPreviewCardProps {
  career: (typeof allCareers)[number];
  index: number;
}

function CareerPreviewCard({ career, index }: CareerPreviewCardProps) {
  const { ref, style } = useStaggeredFadeIn(index);
  const badges = useMemo(() => deriveBadges(career), [career]);
  const futureProofBadge = badges.includes("Future-Proof") ? "Future-Proof" : null;
  const firstBadge = badges.length > 0 ? badges[0] : null;

  const impactColor = career.aiImpact
    ? aiImpactColors[career.aiImpact]
    : "border-core-border text-core-muted";

  const impactLabel = career.aiImpact
    ? aiImpactLabels[career.aiImpact]
    : "Unknown";

  const marketMaturity =
    career.futureDemand === "Exploding"
      ? "Emerging"
      : career.futureDemand === "High Growth"
        ? "Growing"
        : "Established";

  return (
    <Link
      href={`/careers/${career.id}`}
      ref={ref}
      style={style}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-5 shadow-soft backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-core-accent/40 hover:shadow-glow"
    >
      {/* Subtle glow on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="h-full w-full rounded-2xl bg-core-accent/5 blur-xl" />
      </div>

      {/* ─── TOP: Icon + Badges ─── */}
      <div className="relative flex items-start justify-between gap-3">
        <span className="text-3xl">{career.icon || "✨"}</span>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {/* AI Impact badge */}
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] ${impactColor}`}
          >
            {impactLabel}
          </span>
          {/* Future-Proof badge */}
          {futureProofBadge && (
            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              {futureProofBadge}
            </span>
          )}
          {!futureProofBadge && firstBadge && firstBadge !== "Future-Proof" && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-core-muted">
              {firstBadge}
            </span>
          )}
        </div>
      </div>

      {/* ─── MIDDLE: Title + Tagline ─── */}
      <div className="relative mt-4 flex-1">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-core-muted/60">
          {career.category}
        </p>
        <h3 className="mt-1 text-base font-semibold text-core-heading leading-snug">
          {career.title}
        </h3>
        <p className="mt-1.5 text-xs text-core-muted leading-relaxed line-clamp-2">
          {career.tagline}
        </p>
      </div>

      {/* ─── BOTTOM: Signals + Explore ─── */}
      <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
        <div className="flex gap-2 text-[0.6rem] text-core-muted">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
            {marketMaturity}
          </span>
          {career.remotePotential && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
              Remote: {career.remotePotential}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-core-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Explore →
        </span>
      </div>
    </Link>
  );
}

// ─── Horizontally scrollable grid ───

export default function HomeCareerPreviewGrid() {
  const careers = useMemo(
    () =>
      allCareers
        .filter(
          (c) =>
            c.futureDemand === "Exploding" ||
            c.futureDemand === "High Growth" ||
            c.aiRelationship === "AI-Created",
        )
        .slice(0, 5),
    [],
  );



  return (
    <section className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="section-title">Trending AI-era Careers</p>
        <p className="text-core-muted max-w-3xl leading-relaxed mt-1">
          High-signal roles ranked by AI impact, future demand, and specialization potential.
        </p>
      </div>

      {/* Grid: 2 cols mobile → 4 cols md → 5 cols xl */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {careers.map((career, i) => (
          <CareerPreviewCard key={career.id} career={career} index={i} />
        ))}
      </div>
    </section>
  );
}
