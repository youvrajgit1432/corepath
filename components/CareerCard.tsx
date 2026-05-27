import Link from "next/link";
import { Career, aiImpactLabels, deriveBadges, getCareerReality } from "../data/careers";

interface Props {
  career: Career;
  compareMode?: boolean;
  selected?: boolean;
  onToggleCompare?: (careerId: string) => void;
}

export default function CareerCard({ career, compareMode, selected, onToggleCompare }: Props) {
  const impactBadge = {
    low: "border-emerald-400 text-emerald-400",
    moderate: "border-yellow-400 text-yellow-400",
    high: "border-orange-400 text-orange-400",
    transformative: "border-core-accent text-core-accent",
  }[career.aiImpact ?? "moderate"];

  const startupFit = (career.tags || []).some((tag) => /startup/i.test(tag));
  const bestFor = career.fitTags?.length
    ? `People who are strongest in ${career.fitTags.join(" and ")}`
    : `People who prefer deep work around ${career.coreSkill.toLowerCase()}`;

  const avoidIf = career.reality?.avoidIf ?? getCareerReality(career).avoidIf;

  const marketMaturity = career.futureDemand === "Exploding" ? "Emerging" : career.futureDemand === "High Growth" ? "Growing" : "Established";

  return (
    <div className="group rounded-card border border-core-border bg-core-bg p-4 sm:p-6 transition hover:border-core-accent hover:bg-core-surface min-w-0">
      <Link href={`/careers/${career.id}`} className="block">
        <div className="flex items-start justify-between gap-4">
        <span className="text-5xl">{career.icon || "✨"}</span>
        <div className="space-y-2 text-right">
          <span className={`inline-flex items-center justify-center text-[0.65rem] font-semibold uppercase tracking-[0.28em] px-3 py-1 rounded-full border ${impactBadge}`}>
            {aiImpactLabels[career.aiImpact ?? "moderate"]}
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            {deriveBadges(career).slice(0, 2).map((b) => (
              <span key={b} className="bg-white/10 text-core-heading border border-white/10 px-2.5 py-1 rounded-full text-[0.65rem] font-semibold">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-core-muted mb-2">
          {career.category}
        </p>
        <h2 className="font-display text-2xl text-core-heading mb-3">{career.title}</h2>
        <p className="text-sm text-core-muted leading-relaxed mb-5">{career.tagline}</p>
      </div>

      <div className="grid gap-4 text-xs text-core-muted">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
            <p className="font-semibold text-core-heading">Core advantage</p>
            <p className="mt-1">{career.coreSkill}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
            <p className="font-semibold text-core-heading">Future signal</p>
            <p className="mt-1">{marketMaturity}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-core-border px-2.5 py-1">{career.timeToJob}</span>
          {career.remotePotential && (
            <span className="rounded-full border border-core-border px-2.5 py-1">Remote: {career.remotePotential}</span>
          )}
          <span className="rounded-full border border-core-border px-2.5 py-1">
            {startupFit ? "Startup-friendly" : "Enterprise-ready"}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-core-text/80">{career.aiImpactNote}</p>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-core-muted">Best for</p>
          <p className="mt-2 text-sm text-core-heading">{bestFor}</p>
          <p className="mt-3 text-[0.7rem] uppercase tracking-[0.24em] text-core-muted">Avoid if</p>
          <p className="mt-2 text-sm text-core-heading">{avoidIf}</p>
        </div>
      </div>
      </Link>
      {onToggleCompare ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleCompare(career.id);
          }}
          className={`mt-4 w-full rounded-full border px-4 py-2 text-sm font-semibold transition ${
            selected ? "border-core-accent bg-core-accent text-white" : "border-core-border bg-core-surface text-core-heading hover:border-core-accent hover:bg-core-accent/10"
          }`}
        >
          {selected ? "Selected to compare" : "Select to compare"}
        </button>
      ) : null}
    </div>
  );
}
