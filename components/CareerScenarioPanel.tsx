"use client";

import { useEffect, useState } from "react";
import {
  computeCareerScenarios,
  loadCareerScenarios,
  type CareerScenarioData,
  type CareerScenarioComparison,
} from "../data/career-scenarios";
import type { EnhancedProfile } from "../data/quiz-enhanced";

type Props = {
  careerAId: string;
  careerBId?: string;
  enhancedProfile?: EnhancedProfile;
  className?: string;
};

function ScenarioYearCard({
  year,
  scenario,
}: {
  year: number;
  scenario: CareerScenarioData["yearOneScenario"];
}) {
  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-core-accent/10 text-sm font-bold text-core-accent">
          {year}
        </span>
        <div>
          <p className="text-sm font-semibold text-core-heading">{scenario.title}</p>
          <p className="text-xs text-core-muted">{scenario.typicalRole}</p>
        </div>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-core-text">{scenario.description}</p>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-core-heading">Key activities</p>
        <ul className="space-y-1">
          {scenario.keyActivities.map((activity, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-core-muted">
              <span className="mt-0.5 text-core-accent">•</span>
              <span>{activity}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-core-bg/60 px-3 py-2 text-xs">
        <span className="text-core-muted">Salary</span>
        <span className="font-medium text-core-heading">{scenario.salaryRange}</span>
      </div>
    </div>
  );
}

function LifestyleBadge({ signal }: { signal: CareerScenarioData["lifestyleSignals"][0] }) {
  const colorMap = {
    positive: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    neutral: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
    challenging: "border-orange-500/30 bg-orange-500/5 text-orange-400",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${colorMap[signal.type]}`}>
      <p className="font-semibold mb-0.5">{signal.signal}</p>
      <p className="opacity-80">{signal.description}</p>
    </div>
  );
}

function GrowthMeter({ trajectory }: { trajectory: CareerScenarioData["growthTrajectory"] }) {
  const colorMap: Record<string, string> = {
    accelerating: "bg-emerald-500",
    steady: "bg-blue-500",
    steep: "bg-core-accent",
    varied: "bg-yellow-500",
  };

  const pctMap: Record<string, number> = {
    accelerating: 80,
    steady: 60,
    steep: 90,
    varied: 50,
  };

  return (
    <div className="rounded-2xl border border-core-border bg-core-bg/50 p-4">
      <p className="mb-2 text-xs font-semibold text-core-heading">Growth trajectory</p>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium capitalize text-core-text">{trajectory.trajectory}</span>
        <span className="text-[10px] text-core-muted">pace</span>
      </div>
      <div className="mb-3 h-2 rounded-full bg-core-bg">
        <div
          className={`h-full rounded-full transition-all ${colorMap[trajectory.trajectory]}`}
          style={{ width: `${pctMap[trajectory.trajectory]}%` }}
        />
      </div>
      <p className="text-xs leading-relaxed text-core-text">{trajectory.description}</p>
      <div className="mt-3 space-y-1">
        {trajectory.keyMilestones.map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-core-muted">
            <span className="mt-0.5">→</span>
            <span>{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskCard({ risk }: { risk: CareerScenarioData["riskMoments"][0] }) {
  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-orange-400">Year {risk.year}</span>
        <span className="text-xs font-semibold text-core-heading">{risk.risk}</span>
      </div>
      <p className="mb-2 text-[11px] leading-relaxed text-core-muted">{risk.description}</p>
      <div className="rounded-lg bg-core-bg/60 p-2 text-[11px] text-core-text">
        <span className="font-semibold text-core-accent">Mitigation: </span>
        {risk.mitigationStrategy}
      </div>
    </div>
  );
}

function ForkCard({ fork }: { fork: CareerScenarioData["careerForks"][0] }) {
  return (
    <div className="rounded-xl border border-core-border bg-core-bg/40 p-3">
      <p className="mb-2 text-[11px] font-mono font-semibold text-core-accent">{fork.yearRange}</p>
      <p className="mb-2 text-xs font-semibold text-core-heading">{fork.fork}</p>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-core-bg/60 p-2 text-[11px] text-core-text">
          <span className="font-semibold text-emerald-400">A: </span>
          {fork.optionA}
        </div>
        <div className="rounded-lg bg-core-bg/60 p-2 text-[11px] text-core-text">
          <span className="font-semibold text-core-accent">B: </span>
          {fork.optionB}
        </div>
      </div>
      <p className="text-[11px] italic text-core-muted">→ {fork.recommendation}</p>
    </div>
  );
}

function AlternateCard({ outcome }: { outcome: CareerScenarioData["alternateOutcomes"][0] }) {
  const probColorMap: Record<string, string> = {
    high: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    moderate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    low: "bg-core-bg/60 text-core-muted border-core-border",
  };

  return (
    <div className="rounded-xl border border-core-border bg-core-bg/30 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-core-heading">{outcome.scenario}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${probColorMap[outcome.probability]}`}>
          {outcome.probability}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-core-muted">{outcome.description}</p>
    </div>
  );
}

function ScenarioPanel({ data }: { data: CareerScenarioData }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggle = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      {/* Year milestones */}
      <div className="grid gap-3 md:grid-cols-3">
        <ScenarioYearCard year={1} scenario={data.yearOneScenario} />
        <ScenarioYearCard year={3} scenario={data.yearThreeScenario} />
        <ScenarioYearCard year={5} scenario={data.yearFiveScenario} />
      </div>

      {/* Lifestyle signals */}
      <div>
        <button
          onClick={() => toggle("lifestyle")}
          className="flex w-full items-center justify-between rounded-xl border border-core-border bg-core-bg/40 px-4 py-3 text-left text-sm font-semibold text-core-heading hover:bg-core-bg/60 transition"
        >
          Lifestyle signals
          <span className="text-core-muted text-xs">{expandedSection === "lifestyle" ? "▲" : "▼"}</span>
        </button>
        {expandedSection === "lifestyle" && (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {data.lifestyleSignals.map((signal, i) => (
              <LifestyleBadge key={i} signal={signal} />
            ))}
          </div>
        )}
      </div>

      {/* Growth trajectory */}
      <GrowthMeter trajectory={data.growthTrajectory} />

      {/* Risk moments */}
      <div>
        <button
          onClick={() => toggle("risks")}
          className="flex w-full items-center justify-between rounded-xl border border-core-border bg-core-bg/40 px-4 py-3 text-left text-sm font-semibold text-core-heading hover:bg-core-bg/60 transition"
        >
          Risk moments ({data.riskMoments.length})
          <span className="text-core-muted text-xs">{expandedSection === "risks" ? "▲" : "▼"}</span>
        </button>
        {expandedSection === "risks" && (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {data.riskMoments.map((risk, i) => (
              <RiskCard key={i} risk={risk} />
            ))}
          </div>
        )}
      </div>

      {/* Career forks */}
      <div>
        <button
          onClick={() => toggle("forks")}
          className="flex w-full items-center justify-between rounded-xl border border-core-border bg-core-bg/40 px-4 py-3 text-left text-sm font-semibold text-core-heading hover:bg-core-bg/60 transition"
        >
          Career forks ({data.careerForks.length})
          <span className="text-core-muted text-xs">{expandedSection === "forks" ? "▲" : "▼"}</span>
        </button>
        {expandedSection === "forks" && (
          <div className="mt-3 space-y-3">
            {data.careerForks.map((fork, i) => (
              <ForkCard key={i} fork={fork} />
            ))}
          </div>
        )}
      </div>

      {/* Alternate outcomes */}
      <div>
        <button
          onClick={() => toggle("outcomes")}
          className="flex w-full items-center justify-between rounded-xl border border-core-border bg-core-bg/40 px-4 py-3 text-left text-sm font-semibold text-core-heading hover:bg-core-bg/60 transition"
        >
          Alternate outcomes ({data.alternateOutcomes.length})
          <span className="text-core-muted text-xs">{expandedSection === "outcomes" ? "▲" : "▼"}</span>
        </button>
        {expandedSection === "outcomes" && (
          <div className="mt-3 space-y-2">
            {data.alternateOutcomes.map((outcome, i) => (
              <AlternateCard key={i} outcome={outcome} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CareerScenarioPanel({
  careerAId,
  careerBId,
  enhancedProfile,
  className = "",
}: Props) {
  const [scenarios, setScenarios] = useState<CareerScenarioComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = careerBId ? `${careerAId},${careerBId}` : careerAId;

    // Try cached first
    const cached = loadCareerScenarios(careerAId, careerBId);
    if (cached) {
      setScenarios(cached);
      setLoading(false);
    }

    // Compute fresh
    const fresh = computeCareerScenarios(careerAId, careerBId, enhancedProfile);
    setScenarios(fresh);
    setLoading(false);
  }, [careerAId, careerBId, enhancedProfile]);

  if (loading) {
    return (
      <section className={`rounded-card border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-core-accent border-t-transparent" />
        </div>
      </section>
    );
  }

  if (!scenarios) return null;

  const title = scenarios.careerB
    ? `${scenarios.careerA.careerTitle} vs. ${scenarios.careerB.careerTitle} — future scenarios`
    : `${scenarios.careerA.careerTitle} — future scenarios`;

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 shadow-soft ${className}`}>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
          Career scenario intelligence
        </p>
        <h2 className="mt-2 text-lg font-semibold text-core-heading">{title}</h2>
      </div>

      {/* Career A scenario */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-core-heading">{scenarios.careerA.careerTitle}</h3>
        <ScenarioPanel data={scenarios.careerA} />
      </div>

      {/* Career B scenario (side-by-side) */}
      {scenarios.careerB && (
        <div className="mt-8 pt-6 border-t border-core-border">
          <h3 className="mb-4 text-sm font-semibold text-core-heading">{scenarios.careerB.careerTitle}</h3>
          <ScenarioPanel data={scenarios.careerB} />
        </div>
      )}
    </section>
  );
}
