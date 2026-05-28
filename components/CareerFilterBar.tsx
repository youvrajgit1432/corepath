import React from "react";

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  aiImpact: string;
  onAiImpactChange: (v: string) => void;
  difficulty: string;
  onDifficultyChange: (v: string) => void;
  futureDemand: string;
  onFutureDemandChange: (v: string) => void;
  aiRelationship: string;
  onAiRelationshipChange: (v: string) => void;
  remotePotential: string;
  onRemotePotentialChange: (v: string) => void;
  startupFriendly: string;
  onStartupFriendlyChange: (v: string) => void;
  badge: string;
  onBadgeChange: (v: string) => void;
  badges: string[];
  activeFilters: ActiveFilter[];
  onClearFilter: (key: string) => void;
  onClearAll: () => void;
}

export default function CareerFilterBar({
  query,
  onQueryChange,
  aiImpact,
  onAiImpactChange,
  difficulty,
  onDifficultyChange,
  futureDemand,
  onFutureDemandChange,
  aiRelationship,
  onAiRelationshipChange,
  remotePotential,
  onRemotePotentialChange,
  startupFriendly,
  onStartupFriendlyChange,
  badge,
  onBadgeChange,
  badges,
  activeFilters,
  onClearFilter,
  onClearAll,
}: Props) {
  const filters = [
    {
      label: "AI Impact",
      value: aiImpact,
      onChange: onAiImpactChange,
      options: [
        { value: "any", label: "AI impact" },
        { value: "low", label: "Low" },
        { value: "moderate", label: "Moderate" },
        { value: "high", label: "High" },
        { value: "transformative", label: "Transformative" },
      ],
    },
    {
      label: "Depth",
      value: difficulty,
      onChange: onDifficultyChange,
      options: [
        { value: "any", label: "Depth preference" },
        { value: "low", label: "Beginner-friendly" },
        { value: "moderate", label: "Moderate depth" },
        { value: "high", label: "Specialist" },
      ],
    },
    {
      label: "Outlook",
      value: futureDemand,
      onChange: onFutureDemandChange,
      options: [
        { value: "any", label: "Future demand" },
        { value: "Exploding", label: "Exploding" },
        { value: "High Growth", label: "High Growth" },
        { value: "Stable", label: "Stable" },
        { value: "Declining", label: "Declining" },
      ],
    },
    {
      label: "AI Rel.",
      value: aiRelationship,
      onChange: onAiRelationshipChange,
      options: [
        { value: "any", label: "AI relationship" },
        { value: "AI-Assisted", label: "AI-Assisted" },
        { value: "AI-Augmented", label: "AI-Augmented" },
        { value: "AI-Created", label: "AI-Created" },
        { value: "Automation-Heavy", label: "Automation-Heavy" },
        { value: "Human-Centered", label: "Human-Centered" },
      ],
    },
    {
      label: "Remote",
      value: remotePotential,
      onChange: onRemotePotentialChange,
      options: [
        { value: "any", label: "Remote potential" },
        { value: "High", label: "High" },
        { value: "Medium", label: "Medium" },
        { value: "Low", label: "Low" },
      ],
    },
    {
      label: "Startup",
      value: startupFriendly,
      onChange: onStartupFriendlyChange,
      options: [
        { value: "any", label: "Startup-friendly" },
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-core-border/60 bg-core-surface/80 backdrop-blur-md p-3 shadow-soft">
      {/* Search + Filter pills row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search paths..."
            className="w-full rounded-xl border border-core-border/50 bg-core-bg/50 px-3 py-2 text-xs text-core-text placeholder:text-core-muted/50 focus:outline-none focus:ring-1 focus:ring-core-accent/40 transition-all"
            aria-label="Search careers"
          />
        </div>

        {/* Pill filters — horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0">
          {filters.map((filter) => (
            <select
              key={filter.label}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200 focus:outline-none ${
                filter.value !== "any"
                  ? "border-core-accent/30 bg-core-accent/10 text-core-accent"
                  : "border-white/10 bg-white/5 text-core-muted hover:border-white/20 hover:text-core-heading"
              }`}
              aria-label={`Filter by ${filter.label}`}
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onClearFilter(filter.key)}
              className="inline-flex items-center gap-1 rounded-full border border-core-accent/20 bg-core-accent/5 px-2 py-0.5 text-[10px] font-medium text-core-accent transition hover:bg-core-accent/15"
            >
              <span>{filter.label}: {filter.value}</span>
              <span className="text-core-accent/70 hover:text-core-accent">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-core-muted hover:bg-white/15"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
