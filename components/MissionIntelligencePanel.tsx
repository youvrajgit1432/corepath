"use client";

import { useEffect, useState } from "react";
import { getMissionIntelligence, loadMissionIntelligence, type MissionIntelligenceData } from "@/data/mission-intelligence";

type Props = {
  className?: string;
};

export default function MissionIntelligencePanel({ className = "" }: Props) {
  const [data, setData] = useState<MissionIntelligenceData | null>(null);

  useEffect(() => {
    const existing = loadMissionIntelligence();
    if (existing) {
      setData(existing);
    } else {
      setData(getMissionIntelligence());
    }
  }, []);

  const refresh = () => setData(getMissionIntelligence());

  if (!data) return null;

  const gaugeColor =
    data.missionScore >= 65
      ? "stroke-emerald-500"
      : data.missionScore >= 40
        ? "stroke-amber-400"
        : "stroke-slate-400";

  const momentumColor =
    data.missionMomentum >= 60
      ? "text-emerald-400"
      : data.missionMomentum >= 35
        ? "text-amber-400"
        : "text-slate-400";

  const riskBadgeColor =
    data.missionRisk === "low"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : data.missionRisk === "medium"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : "bg-rose-500/10 text-rose-400 border-rose-500/30";

  // Arc path for the gauge
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - data.missionScore / 100);

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-core-muted font-semibold">
            Mission Intelligence
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-core-heading">
            Adaptive Mission Engine
          </h3>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="text-[10px] uppercase tracking-wider text-core-accent hover:text-indigo-400 transition"
        >
          Refresh
        </button>
      </div>

      {/* Score + Momentum Row */}
      <div className="flex items-center gap-5 mb-4">
        {/* SVG Gauge */}
        <div className="relative shrink-0 w-[88px] h-[88px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-white/5"
              strokeWidth="6"
            />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              className={gaugeColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-core-heading">{data.missionScore}</span>
            <span className="text-[8px] uppercase tracking-wider text-core-muted">Score</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-core-muted">Momentum</span>
            <span className={`text-sm font-semibold ${momentumColor}`}>
              {data.missionMomentum}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.missionMomentum >= 60
                  ? "bg-emerald-500"
                  : data.missionMomentum >= 35
                    ? "bg-amber-400"
                    : "bg-slate-500"
              }`}
              style={{ width: `${data.missionMomentum}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${riskBadgeColor}`}>
              {data.missionRisk} risk
            </span>
            <span className="text-[10px] text-core-muted">
              {data.missionBlocks.length} block{data.missionBlocks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Active Mission */}
      <div className="rounded-xl border border-core-accent/15 bg-core-accent/5 p-3.5 mb-3">
        <p className="text-[10px] uppercase tracking-wider text-core-accent font-semibold mb-1">
          Active Mission
        </p>
        <p className="text-sm font-semibold text-core-heading leading-snug">
          {data.activeMission.title}
        </p>
        <p className="mt-0.5 text-xs text-core-muted leading-relaxed">
          {data.activeMission.reason}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-core-muted">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
            data.activeMission.difficulty === "tiny"
              ? "bg-sky-500/10 text-sky-400"
              : data.activeMission.difficulty === "easy"
                ? "bg-emerald-500/10 text-emerald-400"
                : data.activeMission.difficulty === "hard"
                  ? "bg-rose-500/10 text-rose-400"
                  : "bg-amber-500/10 text-amber-400"
          }`}>
            {data.activeMission.difficulty}
          </span>
          <span>{data.activeMission.estimatedMinutes}m</span>
          <span className="capitalize">{data.activeMission.category}</span>
        </div>
      </div>

      {/* Next Mission */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-wider text-core-muted font-semibold mb-1.5">
          Next Up
        </p>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-core-accent/60" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-core-heading">{data.nextMission.title}</p>
            <p className="mt-0.5 text-[10px] text-core-muted leading-relaxed">
              {data.nextMission.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Mission Blocks */}
      {data.missionBlocks.length > 0 && (
        <details className="group mb-3">
          <summary className="flex items-center gap-2 cursor-pointer text-[10px] uppercase tracking-wider text-core-muted font-semibold list-none">
            <svg
              className="w-3 h-3 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 2l4 4-4 4" />
            </svg>
            Blocks ({data.missionBlocks.length})
          </summary>
          <div className="mt-2 space-y-2">
            {data.missionBlocks.map((block, i) => (
              <div
                key={`${block.type}-${i}`}
                className={`rounded-lg border p-3 ${
                  block.severity === "high"
                    ? "border-rose-500/20 bg-rose-500/5"
                    : block.severity === "medium"
                      ? "border-amber-500/20 bg-amber-500/5"
                      : "border-sky-500/20 bg-sky-500/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-core-heading">
                    {block.type.replace(/_/g, " ")}
                  </span>
                  <span className={`text-[9px] uppercase font-medium ${
                    block.severity === "high"
                      ? "text-rose-400"
                      : block.severity === "medium"
                        ? "text-amber-400"
                        : "text-sky-400"
                  }`}>
                    {block.severity}
                  </span>
                </div>
                <p className="text-[11px] text-core-muted leading-relaxed">{block.detail}</p>
                <p className="mt-1 text-[9px] text-core-muted/60">Source: {block.source}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Adaptive Missions */}
      {data.adaptiveMissions.length > 0 && (
        <details className="group mb-3">
          <summary className="flex items-center gap-2 cursor-pointer text-[10px] uppercase tracking-wider text-core-muted font-semibold list-none">
            <svg
              className="w-3 h-3 transition-transform group-open:rotate-90"
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 2l4 4-4 4" />
            </svg>
            Adaptive Missions ({data.adaptiveMissions.length})
          </summary>
          <div className="mt-2 space-y-2">
            {data.adaptiveMissions.map((m, i) => (
              <div key={m.id || i} className="rounded-lg border border-core-border bg-core-bg/50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-core-heading leading-snug">{m.title}</p>
                  <span className={`text-[9px] uppercase font-medium ml-2 shrink-0 ${
                    m.difficulty === "tiny"
                      ? "text-sky-400"
                      : m.difficulty === "easy"
                        ? "text-emerald-400"
                        : m.difficulty === "hard"
                          ? "text-rose-400"
                          : "text-amber-400"
                  }`}>
                    {m.difficulty}
                  </span>
                </div>
                <p className="text-[11px] text-core-muted leading-relaxed">{m.description}</p>
                <p className="mt-1 text-[9px] text-core-muted/60 italic">{m.reason}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[9px] text-core-muted/70">
                  <span>{m.estimatedMinutes}m</span>
                  <span className="capitalize">{m.category}</span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Narrative */}
      {data.missionNarrative && (
        <div className="mt-2 rounded-xl border border-core-border/60 bg-core-bg/30 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-core-muted font-semibold mb-1">
            Assessment
          </p>
          <p className="text-xs text-core-muted leading-relaxed italic">
            {data.missionNarrative}
          </p>
        </div>
      )}
    </section>
  );
}
