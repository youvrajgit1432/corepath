import type { Career } from "../data/careers";
import { getCareerReality } from "../data/careers";

type Props = {
  career: Career;
  className?: string;
  showHeader?: boolean;
};

const sections = [
  { key: "realityCheck", title: "Reality check" },
  { key: "beginnerMisunderstanding", title: "Beginner misunderstanding" },
  { key: "avoidIf", title: "Avoid this path if" },
  { key: "typicalFrustrations", title: "Typical frustrations" },
  { key: "hiddenDifficulty", title: "Hidden difficulty" },
  { key: "burnoutSignals", title: "Burnout signals" },
  { key: "longTermTradeoffs", title: "Long-term tradeoffs" },
] as const;

export default function CareerRealityPanel({ career, className = "", showHeader = true }: Props) {
  const insights = getCareerReality(career);

  return (
    <div className={`rounded-3xl border border-core-border bg-core-surface p-6 ${className}`}>
      {showHeader ? (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Reality intelligence</p>
          <h2 className="text-xl font-semibold text-core-heading">What to watch for in this career</h2>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.key} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.24em] text-core-muted mb-2">{section.title}</p>
            <p className="text-sm leading-relaxed text-core-text">{insights[section.key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
