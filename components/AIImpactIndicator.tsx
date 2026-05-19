import { AIImpactLevel, aiImpactLabels, aiImpactColors } from "../data/careers";

interface Props {
  level: AIImpactLevel;
  note: string;
}

const impactSegments: Record<AIImpactLevel, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  transformative: 4,
};

const impactDescription: Record<AIImpactLevel, string> = {
  low: "AI tools exist but this role's core value is hard to automate. Strong long-term stability.",
  moderate: "Some tasks will be assisted or automated by AI, but expert judgment remains essential.",
  high: "AI is changing workflows significantly. Staying current with AI tools is necessary.",
  transformative: "AI is reshaping this field itself. Those who understand AI deeply will lead it.",
};

export default function AIImpactIndicator({ level, note }: Props) {
  const filled = impactSegments[level];
  const label = aiImpactLabels[level];
  const colorClass = aiImpactColors[level];

  return (
    <div className="rounded-card border border-core-border bg-core-surface p-6">
      <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-4">
        AI Impact Indicator
      </p>

      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-mono px-2.5 py-1.5 rounded-md border ${colorClass}`}>
          {label}
        </span>

        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((seg) => (
            <div
              key={seg}
              className={`h-2 w-8 rounded-sm transition-all ${
                seg <= filled
                  ? level === "low"
                    ? "bg-emerald-400"
                    : level === "moderate"
                    ? "bg-yellow-400"
                    : level === "high"
                    ? "bg-orange-400"
                    : "bg-core-accent"
                  : "bg-core-border"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-core-muted mb-3 leading-relaxed">{impactDescription[level]}</p>

      <div className="p-3 rounded-lg bg-core-bg border border-core-border">
        <p className="text-xs font-mono text-core-accent mb-1">For this career:</p>
        <p className="text-sm text-core-text leading-relaxed">{note}</p>
      </div>
    </div>
  );
}
