"use client";

import { useEffect, useState } from "react";
import { computeInsightVault } from "@/data/insight-vault";
import type { InsightVaultData, InsightEntry, InsightType } from "@/data/insight-vault";

// ── Icon map ─────────────────────────────────────────────────────────────

const INSIGHT_ICONS: Record<InsightType, string> = {
  identity_change: "🧬",
  confidence_jump: "📈",
  first_milestone: "🎖️",
  achievement_unlock: "🏆",
  career_pivot: "🔄",
  trajectory_change: "🧭",
};

const INSIGHT_LABELS: Record<InsightType, string> = {
  identity_change: "Identity Shift",
  confidence_jump: "Confidence Jump",
  first_milestone: "First Milestone",
  achievement_unlock: "Achievement",
  career_pivot: "Career Pivot",
  trajectory_change: "Trajectory",
};

function importanceColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (score >= 60) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  if (score >= 40) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

function vaultScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-zinc-400";
}

function vaultScoreBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-zinc-500";
}

// ── Sub-components ───────────────────────────────────────────────────────

function TopInsightCard({ insight }: { insight: InsightEntry }) {
  return (
    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl">{INSIGHT_ICONS[insight.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-violet-400">
              Top Insight
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${importanceColor(insight.importance)}`}>
              {INSIGHT_LABELS[insight.type]}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-white truncate">{insight.title}</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{insight.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-zinc-500">Importance: {insight.importance}%</span>
            <span className="text-[10px] text-zinc-600">·</span>
            <span className="text-[10px] text-zinc-500">Source: {insight.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightTimelineCard({ insights }: { insights: InsightEntry[] }) {
  const display = insights.slice(0, 6);
  if (display.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
        Discovery Timeline
      </h4>
      <div className="space-y-2">
        {display.map((insight) => (
          <div key={insight.id} className="flex items-start gap-3 group">
            <div className="flex flex-col items-center">
              <span className="text-base">{INSIGHT_ICONS[insight.type]}</span>
              <div className="w-px flex-1 bg-zinc-800 group-last:hidden" />
            </div>
            <div className="flex-1 min-w-0 pb-2 group-last:pb-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${importanceColor(insight.importance).split(" ")[0]} text-zinc-500`}>
                  {INSIGHT_LABELS[insight.type]}
                </span>
              </div>
              <p className="text-sm text-zinc-200 mt-0.5">{insight.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdentityChangesCard({ changes }: { changes: string[] }) {
  if (changes.length === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        🧬 Identity Shifts
      </h4>
      <ul className="space-y-1.5">
        {changes.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <span className="text-emerald-400 mt-0.5">▸</span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PatternsCard({ patterns }: { patterns: string[] }) {
  if (patterns.length === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        🔄 Recurring Patterns
      </h4>
      <ul className="space-y-1.5">
        {patterns.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <span className="text-amber-400 mt-0.5">◉</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BreakthroughCard({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
      <span className="text-blue-400 text-sm">✦</span>
      <span className="text-xs text-zinc-300">{title}</span>
    </div>
  );
}

function BreakthroughsCard({ breakthroughs }: { breakthroughs: string[] }) {
  if (breakthroughs.length === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        ✦ Decision Breakthroughs
      </h4>
      <div className="space-y-1.5">
        {breakthroughs.map((b, i) => (
          <BreakthroughCard key={i} title={b} />
        ))}
      </div>
    </div>
  );
}

function BeliefShiftsCard({ shifts }: { shifts: string[] }) {
  if (shifts.length === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        💭 Belief Shifts
      </h4>
      <ul className="space-y-1.5">
        {shifts.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
            <span className="text-violet-400 mt-0.5">◆</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────

interface Props {
  className?: string;
}

export default function InsightVaultPanel({ className = "" }: Props) {
  const [data, setData] = useState<InsightVaultData | null>(null);

  useEffect(() => {
    const vault = computeInsightVault();
    setData(vault);
  }, []);

  if (!data) {
    return (
      <div className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-20 bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Insight Vault</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${vaultScoreColor(data.vaultScore)}`}>
            Score: {data.vaultScore}%
          </span>
          <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${vaultScoreBarColor(data.vaultScore)}`}
              style={{ width: `${data.vaultScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Insight */}
      {data.topInsight && <TopInsightCard insight={data.topInsight} />}

      {/* Grid: Timeline + Identity + Patterns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InsightTimelineCard insights={data.majorInsights} />
        <div className="space-y-3">
          <IdentityChangesCard changes={data.identityChanges} />
          <PatternsCard patterns={data.recurringPatterns} />
        </div>
      </div>

      {/* Breakthroughs */}
      <BreakthroughsCard breakthroughs={data.decisionBreakthroughs} />

      {/* Belief Shifts */}
      <BeliefShiftsCard shifts={data.beliefShifts} />
    </div>
  );
}
