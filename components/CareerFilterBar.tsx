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
  badge,
  onBadgeChange,
  badges,
  activeFilters,
  onClearFilter,
  onClearAll,
}: Props) {
  return (
    <div className="w-full rounded-3xl border border-core-border bg-core-surface/90 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search careers by title"
            className="w-full rounded-2xl border border-core-border bg-white/10 px-4 py-3 text-sm text-core-text placeholder-core-muted focus:outline-none focus:ring-2 focus:ring-core-accent"
          />
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <select
            value={aiImpact}
            onChange={(e) => onAiImpactChange(e.target.value)}
            className="rounded-2xl border border-core-border bg-white/10 px-3 py-2 text-sm text-core-text"
          >
            <option value="any">All AI impact</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="transformative">Transformative</option>
          </select>

          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="rounded-2xl border border-core-border bg-white/10 px-3 py-2 text-sm text-core-text"
          >
            <option value="any">All levels</option>
            <option value="low">Beginner</option>
            <option value="moderate">Intermediate</option>
            <option value="high">Advanced</option>
          </select>

          <select
            value={futureDemand}
            onChange={(e) => onFutureDemandChange(e.target.value)}
            className="rounded-2xl border border-core-border bg-white/10 px-3 py-2 text-sm text-core-text"
          >
            <option value="any">Any future demand</option>
            <option value="Exploding">Exploding</option>
            <option value="High Growth">High Growth</option>
            <option value="Stable">Stable</option>
            <option value="Declining">Declining</option>
          </select>

          <select
            value={aiRelationship}
            onChange={(e) => onAiRelationshipChange(e.target.value)}
            className="rounded-2xl border border-core-border bg-white/10 px-3 py-2 text-sm text-core-text"
          >
            <option value="any">Any AI relationship</option>
            <option value="AI-Assisted">AI-Assisted</option>
            <option value="AI-Created">AI-Created</option>
            <option value="AI-Augmented">AI-Augmented</option>
            <option value="Automation-Heavy">Automation-Heavy</option>
            <option value="Human-Centered">Human-Centered</option>
          </select>

          <select
            value={badge}
            onChange={(e) => onBadgeChange(e.target.value)}
            className="rounded-2xl border border-core-border bg-white/10 px-3 py-2 text-sm text-core-text"
          >
            <option value="any">Any badge</option>
            {badges.map((badgeOption) => (
              <option key={badgeOption} value={badgeOption}>
                {badgeOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onClearFilter(filter.key)}
              className="inline-flex items-center gap-2 rounded-full border border-core-border bg-white/10 px-3 py-2 text-sm text-core-heading transition hover:bg-white/20"
            >
              <span>{filter.label}: {filter.value}</span>
              <span className="rounded-full bg-core-accent px-2 py-0.5 text-[0.65rem] font-semibold text-white">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto rounded-full border border-core-border bg-white/5 px-3 py-2 text-sm text-core-muted hover:bg-white/10"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
