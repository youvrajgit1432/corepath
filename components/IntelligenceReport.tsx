"use client";

import { useState } from "react";
import type { ResultReport } from "../data/quiz-report";

type Props = {
  report: ResultReport;
};

export default function IntelligenceReport({ report }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-4 sm:p-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="text-sm font-semibold text-[var(--heading)]">Strategic intelligence report</p>
        <span
          className="text-core-muted text-lg transition-transform sm:hidden"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>
      <div className={`mt-6 space-y-5 text-sm text-core-muted ${expanded ? "block" : "hidden sm:block"}`}>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Cognitive Identity</p>
          <p className="mt-2">{report.cognitiveIdentity}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Thinking Style</p>
          <p className="mt-2">{report.thinkingStyle}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Long-Term Advantage</p>
          <p className="mt-2">{report.longTermAdvantage}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">AI-Era Positioning</p>
          <p className="mt-2">{report.aiEraPositioning}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Career Sustainability</p>
          <p className="mt-2">{report.careerSustainability}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Blind Spots</p>
          <p className="mt-2">{report.blindSpots}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Burnout Risk</p>
          <p className="mt-2">{report.burnoutRisk}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Recommended Specialization Strategy</p>
          <p className="mt-2">{report.specializationStrategy}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Work Environment Fit</p>
          <p className="mt-2">{report.workEnvironmentFit}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Career Evolution Path</p>
          <p className="mt-2">{report.careerEvolutionPath.join(" → ")}</p>
        </div>
      </div>
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-xs text-core-accent font-mono hover:text-core-accent/80 transition-colors sm:hidden"
        >
          Show full report ▾
        </button>
      )}
    </div>
  );
}
