"use client";

type Props = {
  confidence: number;
  specializationDepth: number;
  className?: string;
};

function formatPercent(value: number) {
  return `${Math.round(Math.min(Math.max(value, 0), 100))}%`;
}

export default function SpecializationConfidenceChart({
  confidence,
  specializationDepth,
  className = "",
}: Props) {
  const depthPercent = Math.round(Math.min(Math.max(specializationDepth * 100, 0), 100));
  const depthLabel =
    depthPercent >= 70
      ? "Focused specialist"
      : depthPercent >= 40
      ? "Balanced profile"
      : "Broad explorer";

  const confidenceLabel =
    confidence >= 70
      ? "High confidence"
      : confidence >= 40
      ? "Developing confidence"
      : "Still exploring";

  return (
    <div className={`rounded-3xl border border-core-border bg-core-surface p-4 ${className}`}>
      <div className="mb-4 text-sm font-semibold text-core-heading">Profile clarity</div>
      <div className="space-y-5 text-sm text-core-muted">
        <div>
          <div className="flex items-center justify-between mb-2 text-xs uppercase tracking-[0.24em] text-core-muted">
            <span>Specialization depth</span>
            <span>{formatPercent(depthPercent)}</span>
          </div>
          <div className="h-3 rounded-full bg-core-border overflow-hidden">
            <div className="h-full bg-teal-500" style={{ width: `${depthPercent}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-core-text">{depthLabel}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 text-xs uppercase tracking-[0.24em] text-core-muted">
            <span>Confidence</span>
            <span>{formatPercent(confidence)}</span>
          </div>
          <div className="h-3 rounded-full bg-core-border overflow-hidden">
            <div className="h-full bg-core-accent" style={{ width: `${confidence}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-core-text">{confidenceLabel}</p>
        </div>
      </div>
    </div>
  );
}
