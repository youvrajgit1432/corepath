// CorePath — UniquenessPanel
// Displays "What makes this person different?"

import React, { useState, useMemo } from "react";
import { getUniqueness, type UniquenessData, type RarePattern, type StrengthSignal, type UnusualCombination, type HiddenSignal, type ExplorationStyle } from "../data/uniqueness-intelligence";

function ScoreGauge({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#a78bfa" : score >= 45 ? "#f59e0b" : "#94a3b8";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="50" cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-xl font-bold text-white">{score}</span>
    </div>
  );
}

function StyleBadge({ style }: { style: ExplorationStyle }) {
  const colors: Record<ExplorationStyle, string> = {
    specialist: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    balanced: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    explorer: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[style]}`}>
      {style === "specialist" ? "🔬 Specialist" : style === "explorer" ? "🧭 Explorer" : "⚖️ Balanced"}
    </span>
  );
}

function RarityBadge({ rarity }: { rarity: RarePattern["rarity"] }) {
  const colors = {
    high: "bg-rose-500/15 text-rose-300 border-rose-500/25",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    low: "bg-slate-500/15 text-slate-300 border-slate-500/25",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors[rarity]}`}>
      {rarity}
    </span>
  );
}

function StrengthBar({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? "#a78bfa" : value >= 45 ? "#f59e0b" : "#64748b";
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-slate-400 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right text-xs text-slate-500">{value}</span>
    </div>
  );
}

export default function UniquenessPanel({ className = "" }: { className?: string }) {
  const data: UniquenessData = useMemo(() => getUniqueness(), []);
  const [expandedPattern, setExpandedPattern] = useState<number | null>(null);
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const isUnique = data.uniquenessScore >= 45;

  return (
    <div className={`rounded-lg border border-slate-700/50 bg-slate-800/40 p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Uniqueness Intelligence</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">What makes you different</p>
        </div>
        <ScoreGauge score={data.uniquenessScore} />
      </div>

      {/* Style + Narrative */}
      <div className="flex items-center gap-2">
        <StyleBadge style={data.explorationStyle} />
        <span className="text-xs text-slate-400">
          {data.rarePatterns.length} rare patterns · {data.unusualCombinations.length} unusual combinations
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{data.differentiationNarrative}</p>

      {/* Advantage Areas */}
      {data.advantageAreas.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-300">Advantage Areas</h4>
          {data.advantageAreas.map((area, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-slate-700/30 px-3 py-2">
              <StrengthBar value={area.score} label={area.area.length > 20 ? area.area.slice(0, 20) + "…" : area.area} />
            </div>
          ))}
        </div>
      )}

      {/* Rare Patterns */}
      {data.rarePatterns.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-slate-300">Rare Patterns</h4>
          {data.rarePatterns.slice(0, showAllSignals ? undefined : 3).map((p, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedPattern(expandedPattern === i ? null : i)}
                className="w-full flex items-center justify-between rounded-md bg-slate-700/30 px-3 py-2 text-left hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RarityBadge rarity={p.rarity} />
                  <span className="text-xs text-slate-200 truncate">{p.pattern}</span>
                </div>
                <span className="text-slate-500 text-xs ml-2">{expandedPattern === i ? "−" : "+"}</span>
              </button>
              {expandedPattern === i && (
                <div className="mt-1.5 rounded-md bg-slate-700/20 px-3 py-2 space-y-1">
                  <p className="text-xs text-slate-300">{p.description}</p>
                  <p className="text-[11px] text-slate-400">Source: {p.source}</p>
                  {p.evidence.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                      {p.evidence.map((e, j) => <li key={j}>{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
          {data.rarePatterns.length > 3 && (
            <button
              onClick={() => setShowAllSignals(!showAllSignals)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAllSignals ? "Show less" : `Show all ${data.rarePatterns.length} patterns`}
            </button>
          )}
        </div>
      )}

      {/* Unusual Combinations */}
      {data.unusualCombinations.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-slate-300">Unusual Combinations</h4>
          {data.unusualCombinations.map((c, i) => (
            <div key={i} className="rounded-md bg-indigo-500/5 border border-indigo-500/10 px-3 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-300">{c.combination}</span>
                <span className="text-[10px] text-slate-500">Rarity: {c.rarityScore}/100</span>
              </div>
              <p className="text-[11px] text-slate-300">{c.description}</p>
              <p className="text-[11px] text-emerald-300/80">Advantage: {c.advantage}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Signals */}
      {data.hiddenSignals.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-400/80 hover:text-amber-300 transition-colors"
          >
            <span>{showHidden ? "▼" : "▶"} Hidden Signals ({data.hiddenSignals.length})</span>
          </button>
          {showHidden && (
            <div className="space-y-1.5 mt-1">
              {data.hiddenSignals.map((h, i) => (
                <div key={i} className="rounded-md bg-amber-500/5 border border-amber-500/10 px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-300">{h.signal}</span>
                    <span className="text-[10px] text-slate-500">{h.source}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{h.potential}</p>
                  <p className="text-[11px] text-indigo-300/70 italic">Suggestion: {h.unlockSuggestion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Behavior-dependent action */}
      <div className={`rounded-md border px-3 py-2 ${isUnique ? "bg-violet-500/10 border-violet-500/20" : "bg-slate-700/30 border-slate-600/30"}`}>
        <p className="text-xs font-medium text-slate-200 mb-0.5">
          {isUnique ? "🎯 Encourage Specialization" : "🌱 Differentiation Opportunity"}
        </p>
        <p className="text-[11px] text-slate-400">
          {isUnique
            ? "Your profile is distinctive. Focus on deepening your strongest differentiators."
            : "Explore niche areas or develop a rare combination of skills to stand out."}
        </p>
      </div>
    </div>
  );
}
