import Link from "next/link";
import { Career, aiImpactLabels, deriveBadges } from "../data/careers";

interface Props {
  career: Career;
}

export default function CareerCard({ career }: Props) {
  const impactBadge = {
    low: "border-emerald-400 text-emerald-400",
    moderate: "border-yellow-400 text-yellow-400",
    high: "border-orange-400 text-orange-400",
    transformative: "border-core-accent text-core-accent",
  }[career.aiImpact ?? "moderate"];

  return (
    <Link
      href={`/careers/${career.id}`}
      className="group block rounded-card border border-core-border bg-core-bg p-6 transition hover:border-core-accent hover:bg-core-surface"
    >
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

      <div className="grid gap-3 text-xs font-mono text-core-muted">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-core-border px-2.5 py-1">Core skill: {career.coreSkill}</span>
          <span className="rounded-full border border-core-border px-2.5 py-1">Time: {career.timeToJob}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(career.supportingSkills || []).slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-full border border-core-border px-2.5 py-1">
              {skill}
            </span>
          ))}
        </div>

        <p className="text-sm text-core-text/80">{career.aiImpactNote}</p>
      </div>
    </Link>
  );
}
