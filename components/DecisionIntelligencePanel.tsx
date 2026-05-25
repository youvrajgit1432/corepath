"use client";

import { useEffect, useState } from "react";
import {
  getDecisionStateMeta,
} from "@/data/decision-intelligence";
import type {
  DecisionIntelligenceData,
  DecisionState,
} from "@/data/decision-intelligence";
import { ensurePipeline } from "@/data/pipeline";
import { getStored } from "@/data/shared-context";

// ============================================================================
// STATE CONFIG
// ============================================================================

const STATE_CONFIG: Record<
  DecisionState,
  { bg: string; border: string; text: string; accent: string }
> = {
  "double-down": {
    bg: "bg-emerald-900/30",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    accent: "bg-emerald-500/20",
  },
  commit: {
    bg: "bg-blue-900/30",
    border: "border-blue-500/30",
    text: "text-blue-300",
    accent: "bg-blue-500/20",
  },
  explore: {
    bg: "bg-amber-900/30",
    border: "border-amber-500/30",
    text: "text-amber-300",
    accent: "bg-amber-500/20",
  },
  pause: {
    bg: "bg-violet-900/30",
    border: "border-violet-500/30",
    text: "text-violet-300",
    accent: "bg-violet-500/20",
  },
  recalibrate: {
    bg: "bg-rose-900/30",
    border: "border-rose-500/30",
    text: "text-rose-300",
    accent: "bg-rose-500/20",
  },
};

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

function ConfidenceMeter({ value }: { value: number }) {
  const color =
    value >= 75
      ? "bg-emerald-500"
      : value >= 50
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">Confidence</span>
        <span className="font-medium text-zinc-300">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function OptionCard({
  option,
}: {
  option: DecisionIntelligenceData["decisionOptions"][number];
}) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-4 transition-colors hover:border-zinc-600/50">
      <div className="mb-2 flex items-start justify-between">
        <h4 className="text-sm font-medium text-zinc-200">{option.label}</h4>
        <span className="rounded bg-zinc-700/60 px-2 py-0.5 text-xs font-medium text-zinc-400">
          Fit: {option.fitScore}%
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-zinc-400">
        {option.description}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-[11px] font-medium text-emerald-400/80">
            Upsides
          </p>
          <ul className="space-y-0.5">
            {option.upsides.slice(0, 2).map((u, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-zinc-500"
              >
                <span className="mt-0.5 text-emerald-500/60">+</span>
                {u}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-rose-400/80">
            Downsides
          </p>
          <ul className="space-y-0.5">
            {option.downsides.slice(0, 2).map((d, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-zinc-500"
              >
                <span className="mt-0.5 text-rose-500/60">−</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Props {
  className?: string;
}

export default function DecisionIntelligencePanel({ className = "" }: Props) {
  const [data, setData] = useState<DecisionIntelligenceData | null>(null);

  useEffect(() => {
    // Run the full data pipeline to ensure all modules are computed
    // in the correct dependency order (including the two-pass for
    // the decision-intelligence ↔ intelligence-synthesis circular pair).
    ensurePipeline();
    setData(getStored<DecisionIntelligenceData>("decision-intelligence"));
  }, []);

  if (!data) {
    return (
      <div
        className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 ${className}`}
      >
        <p className="text-sm text-zinc-500">Loading decision intelligence…</p>
      </div>
    );
  }

  const meta = getDecisionStateMeta(data.decisionState);
  const config = STATE_CONFIG[data.decisionState];

  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 ${className}`}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Decision Intelligence
          </h3>
          <p className="text-xs text-zinc-500">
            What decision should you make now?
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.border} ${config.bg} ${config.text}`}
        >
          <span className="text-sm">{meta.icon}</span>
          {meta.label}
        </span>
      </div>

      {/* ── Recommended Decision ─────────────────────────────────────── */}
      <div
        className={`mb-4 rounded-lg border p-4 ${config.border} ${config.bg}`}
      >
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Recommended Decision
        </p>
        <p className="mb-2 text-sm font-semibold leading-snug text-zinc-100">
          {data.recommendedDecision}
        </p>
        <p className="text-xs leading-relaxed text-zinc-400">
          {data.decisionReason}
        </p>
      </div>

      {/* ── Options ──────────────────────────────────────────────────── */}
      {data.decisionOptions.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-zinc-500">Your Options</p>
          {data.decisionOptions.map((opt) => (
            <OptionCard key={opt.id} option={opt} />
          ))}
        </div>
      )}

      {/* ── Tradeoffs ────────────────────────────────────────────────── */}
      {data.decisionTradeoffs.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">
            Tradeoffs
          </p>
          <div className="space-y-1.5">
            {data.decisionTradeoffs.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-md bg-zinc-800/40 px-3 py-2"
              >
                <div className="flex-1 text-xs text-zinc-300">
                  <span className="mr-1 text-emerald-500/80">+</span> {t.pro}
                </div>
                <div className="flex-1 text-xs text-zinc-400">
                  <span className="mr-1 text-rose-500/80">−</span> {t.con}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wait Signals ─────────────────────────────────────────────── */}
      {data.waitSignals.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">
            Signals to Watch
          </p>
          <ul className="space-y-1">
            {data.waitSignals.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-zinc-400"
              >
                <span className="mt-0.5 text-zinc-600">◈</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">
            If Yes
          </p>
          <p className="text-xs leading-relaxed text-zinc-300">
            {data.actionIfYes}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            If Not Ready
          </p>
          <p className="text-xs leading-relaxed text-zinc-400">
            {data.actionIfNo}
          </p>
        </div>
      </div>

      {/* ── Confidence ───────────────────────────────────────────────── */}
      <ConfidenceMeter value={data.confidenceLevel} />
    </div>
  );
}
