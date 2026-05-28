import { useState } from "react";
import Link from "next/link";
import { Career, aiImpactLabels, deriveBadges, getCareerReality } from "../data/careers";

interface Props {
  career: Career;
  compareMode?: boolean;
  selected?: boolean;
  onToggleCompare?: (careerId: string) => void;
}

export default function CareerCard({ career, compareMode, selected, onToggleCompare }: Props) {
  const [expanded, setExpanded] = useState(false);

  const impactBadge = {
    low: "border-emerald-400 text-emerald-400",
    moderate: "border-yellow-400 text-yellow-400",
    high: "border-orange-400 text-orange-400",
    transformative: "border-core-accent text-core-accent",
  }[career.aiImpact ?? "moderate"];

  const startupFit = (career.tags || []).some((tag) => /startup/i.test(tag));
  const bestFor = career.fitTags?.length
    ? `People strongest in ${career.fitTags.join(" & ")}`
    : `People who prefer deep work around ${career.coreSkill.toLowerCase()}`;

  const avoidIf = career.reality?.avoidIf ?? getCareerReality(career).avoidIf;

  const marketMaturity = career.futureDemand === "Exploding" ? "Emerging" : career.futureDemand === "High Growth" ? "Growing" : "Established";

  return (
    <div className="group card-shimmer-overlay relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-4 shadow-soft backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-core-accent/40 hover:shadow-glow min-w-0 h-full max-md:max-h-none md:max-h-[460px] overflow-hidden">
      {/* Hover glow overlay */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="h-full w-full rounded-2xl bg-core-accent/5 blur-xl" />
      </div>

      <Link href={`/careers/${career.id}`} className="relative flex flex-col flex-1 min-w-0">
        {/* ─── TOP ROW: Icon + Badges ─── */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl shrink-0">{career.icon || "✨"}</span>
          <div className="flex shrink-0 flex-wrap gap-1.5 justify-end">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] ${impactBadge}`}>
              {aiImpactLabels[career.aiImpact ?? "moderate"]}
            </span>
            {deriveBadges(career).slice(0, 1).map((b) => (
              <span key={b} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-core-muted">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ─── MIDDLE: Title + Summary ─── */}
        <div className="mt-3 flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-core-muted/60">{career.category}</p>
          <h2 className="mt-1 text-lg font-semibold text-core-heading leading-snug">{career.title}</h2>
          <p className="mt-1 text-xs text-core-muted leading-relaxed line-clamp-2">{career.tagline}</p>
        </div>

        {/* ─── STATS ROW ─── */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[0.6rem] text-core-muted">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{marketMaturity}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{career.timeToJob}</span>
          {career.remotePotential && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Remote: {career.remotePotential}</span>
          )}
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
            {startupFit ? "Startup-friendly" : "Enterprise-ready"}
          </span>
        </div>

        {/* ─── AI IMPACT NOTE ─── */}
        <p className="mt-2 text-[11px] leading-relaxed text-core-text/70 line-clamp-2">{career.aiImpactNote}</p>

        {/* ─── EXPANDABLE DETAILS ─── */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-40 mt-3 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-core-muted/60">Best for</p>
              <p className="mt-1 text-xs text-core-heading">{bestFor}</p>
            </div>
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-core-muted/60">Avoid if</p>
              <p className="mt-1 text-xs text-core-heading">{avoidIf}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* ─── BOTTOM ACTIONS ─── */}
      <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="flex items-center gap-1 text-[10px] font-medium text-core-muted/60 hover:text-core-accent transition-colors"
        >
          <svg
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Less" : "More"}
        </button>

        <span className="text-xs font-medium text-core-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Explore →
        </span>
      </div>

      {onToggleCompare && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleCompare(career.id);
          }}
          className={`relative mt-2 w-full rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
            selected
              ? "border-core-accent bg-core-accent text-white"
              : "border-white/10 bg-white/5 text-core-muted hover:border-core-accent hover:text-core-accent"
          }`}
        >
          {selected ? "Selected" : "Compare"}
        </button>
      )}
    </div>
  );
}
