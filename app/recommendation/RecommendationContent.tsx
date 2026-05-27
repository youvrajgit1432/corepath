"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCareerById, aiImpactLabels, aiImpactColors } from "../../data/careers";
import { buildCareerSurfaceExplanation, RecommendationExplanation } from "../../data/recommendation-explanations";
import { buildCareerEvolution } from "../../data/career-evolution";
import { loadJourneyMemory } from "../../data/journey-memory";
import { logEvent } from "../../data/analytics-events";
import { analyzeSkillGap } from "../../data/skill-gap";
import { getProjectsForCareer } from "../../data/project-recommendations";
import { getPanelVisibility } from "../../data/panel-visibility";
import type { PanelVisibilityData } from "../../data/panel-visibility";
import AdaptivePanelContainer from "../../components/AdaptivePanelContainer";
import JourneyProfileCard from "../../components/JourneyProfileCard";
import ConfidencePanel from "../../components/ConfidencePanel";
import CareerRealityPanel from "../../components/CareerRealityPanel";
import RecommendationFeedback from "../../components/RecommendationFeedback";
import PersonalInsightsPanel from "../../components/PersonalInsightsPanel";
import SkillGapPanel from "../../components/SkillGapPanel";
import ProfileAnalyzerPanel from "../../components/ProfileAnalyzerPanel";
import PathExamplesPanel from "../../components/PathExamplesPanel";
import ProjectRecommendationPanel from "../../components/ProjectRecommendationPanel";
import CareerWorkspacePanel from "../../components/CareerWorkspacePanel";
import CommunitySignalsPanel from "../../components/CommunitySignalsPanel";
import TrustPanel from "../../components/TrustPanel";
import FeedbackPanel from "../../components/FeedbackPanel";

interface ParsedResult {
  careerId: string;
  percentage: number;
}

export default function RecommendationContent() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("results") ?? "";
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibilityData | null>(null);

  useEffect(() => {
    logEvent("recommendation_viewed", { resultsCount: raw.split(",").length });
  }, [raw]);

  useEffect(() => {
    const vis = getPanelVisibility();
    setPanelVisibility(vis);
  }, []);

  const results: ParsedResult[] = raw
    .split(",")
    .map((part) => {
      const [careerId, pct] = part.split(":");
      return { careerId, percentage: parseInt(pct ?? "0", 10) };
    })
    .filter((r) => r.careerId && !isNaN(r.percentage));

  if (results.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-core-muted mb-4">No results found. Please take the quiz first.</p>
        <Link href="/quiz" className="text-core-accent hover:underline">
          Take the Quiz →
        </Link>
      </div>
    );
  }

  const primary = results[0];
  const primaryCareer = getCareerById(primary.careerId);
  const others = results.slice(1);
  const comparison = others[0] ? primary.percentage - others[0].percentage : undefined;
  const primaryExplanation: RecommendationExplanation | null = primaryCareer
    ? buildCareerSurfaceExplanation(primaryCareer, others[0] ? getCareerById(others[0].careerId) : undefined, comparison)
    : null;
  const evolution = primaryCareer ? buildCareerEvolution(primaryCareer) : null;
  const journey = loadJourneyMemory();
  const skillGap = primaryCareer ? analyzeSkillGap(primaryCareer, []) : undefined;
  const projectRecommendations = primaryCareer ? getProjectsForCareer(primaryCareer, undefined, skillGap, journey) : undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 pt-24 sm:pt-28">
      <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-3">
        Your Result
      </p>
      <h1 className="font-display text-4xl text-core-heading mb-2">
        Your CorePath is ready.
      </h1>
      <p className="text-core-muted mb-10">
        Based on your answers, here is your recommended specialization.
      </p>

      {primaryCareer && primaryExplanation && (
        <div className="mb-6 rounded-lg border border-core-border bg-core-surface p-5">
          <div className="mb-4">
            <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-2">
              Why this recommendation happened
            </p>
            <ul className="space-y-2 text-sm text-core-text">
              {primaryExplanation.whyMatched.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {primaryExplanation.alternativeInsight && (
            <div className="mb-4 rounded-lg bg-core-accent/5 p-4 border border-core-accent/20 text-sm text-core-text">
              <p className="font-semibold mb-2">Comparing nearby matches</p>
              <p>{primaryExplanation.alternativeInsight}</p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-core-accent/5 p-4 border border-core-accent/20">
              <p className="text-xs uppercase font-mono text-core-muted mb-2">AI-era outlook</p>
              <p className="text-sm text-core-text">{primaryExplanation.aiOutlook}</p>
            </div>
            <div className="rounded-lg bg-core-accent/5 p-4 border border-core-accent/20">
              <p className="text-xs uppercase font-mono text-core-muted mb-2">Immediate next action</p>
              <p className="text-sm text-core-text">{primaryExplanation.nextAction}</p>
            </div>
          </div>
        </div>
      )}

      {primaryCareer && (
        <div className="rounded-card border border-core-accent/40 bg-core-surface p-6 mb-6 glow-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{primaryCareer.icon}</span>
              <div>
                <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-1">
                  Best Match — {primary.percentage}% alignment
                </p>
                <h2 className="font-display text-2xl text-core-heading">
                  {primaryCareer.title}
                </h2>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="h-1.5 bg-core-border rounded-full overflow-hidden">
              <div
                className="h-full bg-core-accent rounded-full transition-all duration-700"
                style={{ width: `${primary.percentage}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-core-muted mb-4">{primaryCareer.tagline}</p>

          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-core-accent/5 border border-core-accent/20">
            <span className="text-core-accent text-lg">★</span>
            <div>
              <p className="text-xs font-mono text-core-muted">Your One Core Skill</p>
              <p className="text-sm font-medium text-core-accent">{primaryCareer.coreSkill}</p>
            </div>
          </div>

          <div className={`inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-mono mb-5 ${aiImpactColors[primaryCareer.aiImpact]}`}>
            {aiImpactLabels[primaryCareer.aiImpact]}
          </div>

          <CareerRealityPanel career={primaryCareer} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/careers/${primaryCareer.id}`}
              onClick={() => logEvent("recommendation_clicked", {
                careerId: primaryCareer.id,
                category: primaryCareer.category,
                action: "view_roadmap",
              })}
              className="flex-1 text-center px-4 py-2.5 rounded-lg bg-core-accent text-core-bg text-sm font-medium hover:bg-core-accent/90 transition-colors"
            >
              View Full Roadmap →
            </Link>
            <Link
              href="/quiz"
              onClick={() => logEvent("quiz_retaken")}
              className="px-4 py-2.5 rounded-lg border border-core-border text-core-muted text-sm hover:border-core-accent/40 transition-colors"
            >
              Retake
            </Link>
            {others[0] && (
              <Link
                href={`/careers/compare?careerA=${primaryCareer.id}&careerB=${others[0].careerId}`}
                onClick={() => logEvent("comparison_initiated", { careerA: primaryCareer.id, careerB: others[0].careerId })}
                className="px-4 py-2.5 rounded-lg border border-core-accent text-core-accent text-sm font-medium hover:bg-core-accent/10 transition-colors"
              >
                Compare careers
              </Link>
            )}
          </div>
        </div>
      )}

      {panelVisibility ? (
        <>
          {/* Skill analysis — recommended (returning+) */}
          <AdaptivePanelContainer
            group={{
              id: "insights",
              label: "Skill Analysis",
              description: "Gap analysis, profile deep-dive, and learning paths",
              icon: "📊",
              visibility: panelVisibility.visibilityMap["insights"],
              unlockHint: panelVisibility.visibilityMap["insights"] !== "visible"
                ? "Complete 2+ quizzes to unlock skill analysis."
                : undefined,
            }}
          >
            <SkillGapPanel career={primaryCareer} className="mb-0" />
            <ProfileAnalyzerPanel career={primaryCareer} skillGap={skillGap} className="mb-0" />
            <PathExamplesPanel career={primaryCareer} skillGap={skillGap} className="mb-0" />
          </AdaptivePanelContainer>

          {/* Community signals — recommended (returning+) */}
          <AdaptivePanelContainer
            group={{
              id: "predictions",
              label: "Community & Trust",
              description: "Market signals, trust indicators, and project recommendations",
              icon: "🌐",
              visibility: panelVisibility.visibilityMap["predictions"],
              unlockHint: panelVisibility.visibilityMap["predictions"] !== "visible"
                ? "Complete 2+ quizzes to unlock community insights."
                : undefined,
            }}
          >
            <CommunitySignalsPanel career={primaryCareer} />
            <TrustPanel />
            {projectRecommendations && (
              <ProjectRecommendationPanel recommendations={projectRecommendations} careerTitle={primaryCareer.title} />
            )}
          </AdaptivePanelContainer>

          {/* Personal insights — advanced (engaged+) */}
          <AdaptivePanelContainer
            group={{
              id: "future",
              label: "Personal Insights",
              description: "Confidence tracking and personal growth reflections",
              icon: "💭",
              visibility: panelVisibility.visibilityMap["future"],
              unlockHint: panelVisibility.visibilityMap["future"] !== "visible"
                ? "Complete 5+ quizzes and set up your workspace to unlock personal insights."
                : undefined,
            }}
          >
            <ConfidencePanel journey={journey} layout="compact" />
            <PersonalInsightsPanel variant="full" />
          </AdaptivePanelContainer>

          <FeedbackPanel source="recommendation" />
        </>
      ) : (
        /* ── Fallback: show everything while visibility loads ── */
        <>
          <SkillGapPanel career={primaryCareer} className="mb-6" />
          <ProfileAnalyzerPanel career={primaryCareer} skillGap={skillGap} className="mb-6" />
          <PathExamplesPanel career={primaryCareer} skillGap={skillGap} className="mb-6" />
          <CommunitySignalsPanel career={primaryCareer} />
          <TrustPanel />
          {projectRecommendations && (
            <div className="mb-6">
              <ProjectRecommendationPanel recommendations={projectRecommendations} careerTitle={primaryCareer.title} />
            </div>
          )}
          <FeedbackPanel source="recommendation" />
          <ConfidencePanel journey={journey} layout="compact" className="mb-6" />
        </>
      )}

      <CareerWorkspacePanel career={primaryCareer} showCareersLink={true} />

      {evolution ? (
        <section className="rounded-card border border-core-border bg-core-surface p-6 mb-6">
          <p className="text-xs uppercase font-mono text-core-muted tracking-widest mb-4">
            Where this path can take you
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="text-sm font-semibold text-core-heading mb-3">Career evolution</p>
              <ul className="space-y-3 text-sm text-core-muted">
                <li>
                  <span className="font-semibold text-core-text">Next roles:</span> {evolution.immediateNextPaths.join(", ")}
                </li>
                <li>
                  <span className="font-semibold text-core-text">Mid-career moves:</span> {evolution.midCareerEvolution.join(", ")}
                </li>
                <li>
                  <span className="font-semibold text-core-text">Specializations:</span> {evolution.advancedSpecializationRoutes.join(", ")}
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="text-sm font-semibold text-core-heading mb-3">Skill ecosystem</p>
              <p className="text-sm text-core-muted mb-3">
                Core skill: <span className="font-semibold text-core-text">{evolution.skillEcosystem.core}</span>
              </p>
              <p className="text-sm text-core-muted mb-2">
                Supporting: {evolution.skillEcosystem.supporting.join(", ")}
              </p>
              <p className="text-sm text-core-muted mb-2">
                Expansion: {evolution.skillEcosystem.expansion.join(", ")}
              </p>
              <p className="text-sm text-core-muted">Transferable: {evolution.skillEcosystem.transferable.join(", ")}</p>
            </div>
          </div>
        </section>
      ) : null}

      <JourneyProfileCard className="mb-6" />

      {others.length > 0 && (
        <div>
          <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-3">
            Other Matches
          </p>
          <div className="space-y-3">
            {others.map((r) => {
              const career = getCareerById(r.careerId);
              if (!career) return null;
              return (
                <Link
                  key={r.careerId}
                  href={`/careers/${r.careerId}`}
                  onClick={() => logEvent("career_viewed", {
                    careerId: r.careerId,
                    category: career.category,
                    careerCategory: career.category,
                    source: "recommendation_matches",
                  })}
                  className="flex items-center justify-between p-4 rounded-lg border border-core-border bg-core-surface hover:border-core-accent/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{career.icon}</span>
                    <div>
                      <p className="text-sm text-core-text group-hover:text-core-accent transition-colors">
                        {career.title}
                      </p>
                      <p className="text-xs text-core-muted font-mono">{career.coreSkill}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-core-muted">{r.percentage}%</p>
                    <div className="w-16 h-1 bg-core-border rounded-full mt-1">
                      <div
                        className="h-full bg-core-muted rounded-full"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/careers" className="text-sm text-core-muted hover:text-core-accent transition-colors">
          Browse all career paths →
        </Link>
      </div>
    </div>
  );
}
