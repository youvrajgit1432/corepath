"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { TraitScores } from "../../data/quiz";
import type { Career } from "../../data/careers";
import { generateResultReport, type ResultReport } from "../../data/quiz-report";
import type { EnhancedProfile } from "../../data/quiz-enhanced";
import { buildCareerEvolution } from "../../data/career-evolution";
import { buildConfidenceInsights, type ConfidenceInsights } from "../../data/confidence-engine";
import { loadJourneyMemory } from "../../data/journey-memory";
import { logEvent } from "../../data/analytics-events";
import { analyzeSkillGap } from "../../data/skill-gap";
import { getProjectsForCareer } from "../../data/project-recommendations";
import { saveQuizResult } from "../../data/quiz-history";
import JourneyProfileCard from "../JourneyProfileCard";
import SkillGapPanel from "../SkillGapPanel";
import { useStaggeredFadeIn } from "../../hooks/useStaggeredFadeIn";

// ─── Match card with stagger animation ───

function MatchCard({ match, index }: { match: RankedCareer; index: number }) {
  const { ref, style } = useStaggeredFadeIn(index);
  return (
    <Link
      ref={ref}
      style={style}
      href={`/careers/${match.careerId}`}
      onClick={() =>
        logEvent("career_viewed", {
          careerId: match.careerId,
          category: match.career.category,
          careerCategory: match.career.category,
          source: "quiz_result_alternative",
        })
      }
      className="group flex items-center justify-between rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/85 p-4 transition hover:border-core-accent/40 hover:bg-[color:var(--surface)]/90"
    >
      <div>
        <p className="text-sm font-semibold text-[var(--heading)]">{match.career.title}</p>
        <p className="text-xs text-[var(--muted)]">{match.career.tagline}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-core-accent">{match.percentage}%</p>
        <p className="text-xs text-[var(--muted)]">match</p>
      </div>
    </Link>
  );
}

// Lazy-load heavy visual panels
const ProfileRadarChart = dynamic(() => import("../ProfileRadarChart"), { ssr: false });
const SpecializationConfidenceChart = dynamic(() => import("../SpecializationConfidenceChart"), { ssr: false });
const IntelligenceReport = dynamic(() => import("../IntelligenceReport"), { ssr: false });
const CareerRealityPanel = dynamic(() => import("../CareerRealityPanel"), { ssr: false });
const EvolutionInsights = dynamic(() => import("../EvolutionInsights"), { ssr: false });
const ProjectRecommendationPanel = dynamic(() => import("../ProjectRecommendationPanel"), { ssr: false });
const CareerWorkspacePanel = dynamic(() => import("../CareerWorkspacePanel"), { ssr: false });

type RankedCareer = {
  careerId: string;
  score: number;
  percentage: number;
  career: Career;
};

type Props = {
  topMatch: Career;
  allMatches: RankedCareer[];
  userProfile: TraitScores;
  enhancedProfile?: EnhancedProfile;
  onRetake: () => void;
};

const profileLabels: Array<{ key: keyof TraitScores; label: string }> = [
  { key: "analytical", label: "Systems" },
  { key: "creativity", label: "Creative" },
  { key: "technical-depth", label: "Specialist" },
  { key: "social", label: "Collaborative" },
  { key: "structure", label: "Strategic" },
  { key: "risk-tolerance", label: "Adaptive" },
  { key: "visual", label: "Visual" },
];

export default function ResultScreen({ topMatch, allMatches, userProfile, enhancedProfile, onRetake }: Props) {
  const topTraits = profileLabels
    .map((item) => ({ ...item, value: userProfile[item.key] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const radarPoints = enhancedProfile
    ? Object.entries(enhancedProfile.extended)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value]) => ({ label, value }))
    : [];

  const intelligenceReport: ResultReport | null = enhancedProfile
    ? generateResultReport({ userProfile, enhancedProfile, topMatch, allMatches })
    : null;
  const careerEvolution = buildCareerEvolution(topMatch, enhancedProfile);
  const confidenceInsights: ConfidenceInsights | null = buildConfidenceInsights(loadJourneyMemory(), enhancedProfile);
  const skillGap = analyzeSkillGap(topMatch, [], enhancedProfile);
  const journey = loadJourneyMemory();
  const projectRecommendations = getProjectsForCareer(topMatch, enhancedProfile, skillGap, journey);

  // Save to quiz history on mount
  useEffect(() => {
    if (!enhancedProfile) return;

    const topTraits = profileLabels
      .map((item) => ({ ...item, value: userProfile[item.key] ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    const topExtended = Object.entries(enhancedProfile.extended)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([trait, value]) => ({ trait, value }));

    saveQuizResult({
      topCareer: {
        id: topMatch.id,
        title: topMatch.title,
        icon: topMatch.icon,
        category: topMatch.category,
        coreSkill: topMatch.coreSkill,
      },
      topMatches: allMatches.map((m) => ({
        careerId: m.careerId,
        title: m.career.title,
        percentage: m.percentage,
      })),
      confidence: enhancedProfile.confidence,
      specializationDepth: enhancedProfile.specializationDepth,
      strengthProfile: Object.fromEntries(
        topTraits.map((t) => [t.key, t.value])
      ),
      enhancedProfileSummary: {
        narrative: enhancedProfile.narrative,
        recommendations: enhancedProfile.recommendations,
        topTraits: topExtended,
      },
    });
    // Run once on mount — no deps beyond the stable props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-[2.25rem] border border-[var(--border)] bg-[color:var(--surface)]/95 p-4 sm:p-8 shadow-soft backdrop-blur-md lg:backdrop-blur-xl">
      <div className="animate-quiz-pop rounded-[2rem] border border-[var(--border)] bg-[color:var(--surface)]/90 p-6 text-center">
        <span className="inline-flex rounded-full bg-core-accent/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-core-accent">
          Best match — {allMatches[0]?.percentage}% alignment
        </span>
        {enhancedProfile ? (
          <div className="mt-3 text-sm text-[var(--muted)]">
            Confidence: <span className="font-semibold">{enhancedProfile.confidence}%</span>
            <span className="mx-2">•</span>
            Specialization: <span className="font-semibold">{Math.round((enhancedProfile.specializationDepth || 0) * 100)}%</span>
          </div>
        ) : null}
        <div className="mt-6 inline-flex h-28 w-28 items-center justify-center rounded-full bg-[color:var(--surface)]/75 text-6xl text-[var(--heading)] shadow-soft">
          {topMatch.icon}
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-[var(--heading)]">{topMatch.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] mx-auto">
          {topMatch.tagline || "This match is based on your answers and the way you prefer to think and make decisions."}
        </p>
      </div>

      <div className="mt-8">
        <CareerRealityPanel career={topMatch} />
      </div>

      {enhancedProfile ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
          <ProfileRadarChart points={radarPoints} className="min-w-0" />
          <SpecializationConfidenceChart
            confidence={enhancedProfile.confidence}
            specializationDepth={enhancedProfile.specializationDepth}
            className="min-w-0"
          />
        </div>
      ) : null}

      {intelligenceReport ? (
        <div className="mt-8">
          <IntelligenceReport report={intelligenceReport} />
        </div>
      ) : null}

      {confidenceInsights ? (
        <section className="mt-8 rounded-card border border-core-border bg-core-surface p-6">
          <p className="text-sm font-semibold text-core-heading mb-4">How certain are we?</p>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-core-muted">
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="font-semibold text-core-heading">Confidence level</p>
              <p className="mt-3">{confidenceInsights.confidenceLevel} confidence</p>
              <p className="mt-3">{confidenceInsights.recommendationStability}</p>
            </div>
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="font-semibold text-core-heading">Exploration pattern</p>
              <p className="mt-3">{confidenceInsights.explorationStatus}</p>
              <p className="mt-3">{confidenceInsights.profileMaturity}</p>
              <p className="mt-3">{confidenceInsights.uncertaintyLevel} uncertainty across your journey</p>
            </div>
          </div>
        </section>
      ) : null}

      <JourneyProfileCard className="mt-8" enhancedProfile={enhancedProfile} />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/90 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Strategic fit</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--heading)]">{allMatches[0]?.percentage}%</p>
          <p className="mt-2 text-sm text-core-muted">Alignment with your decision profile</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/90 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Time to practical leverage</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--heading)]">{topMatch.timeToJob || "Varies"}</p>
          <p className="mt-2 text-sm text-core-muted">How fast you can build useful skills</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/90 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">AI relationship</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--heading)]">{topMatch.aiRelationship || "AI-aware"}</p>
          <p className="mt-2 text-sm text-core-muted">The way AI changes this career</p>
        </div>
      </div>

      <div className="mt-8">
        <EvolutionInsights evolution={careerEvolution} />
      </div>

      <div className="mt-8">
        <SkillGapPanel career={topMatch} profile={enhancedProfile} />
      </div>

      <div className="mt-8">
        <ProjectRecommendationPanel recommendations={projectRecommendations} careerTitle={topMatch.title} />
      </div>

      <div className="mt-8">
        <CareerWorkspacePanel career={topMatch} showCareersLink={false} />
      </div>

      <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/90 p-6">
        <p className="text-sm font-semibold text-[var(--heading)]">Your strength profile</p>
        <p className="mt-3 text-sm text-core-muted leading-relaxed">
          These are the three dimensions that most strongly shape the path you should follow in the AI era.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {topTraits.map((trait) => (
            <span
              key={trait.key}
              className="rounded-full bg-teal-700/30 px-3 py-2 text-xs font-semibold text-teal-200"
            >
              {trait.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {allMatches.slice(1, 4).map((match, i) => (
          <MatchCard key={match.careerId} match={match} index={i} />
        ))}
      </div>

      {/* Mobile fixed CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--border)] px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetake}
            className="flex-1 inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[color:var(--surface)]/90 px-4 py-2.5 text-xs font-semibold text-[var(--heading)] transition active:border-core-accent/60"
          >
            Retake
          </button>
          <Link
            href={`/careers/${topMatch.id}`}
            onClick={() => logEvent("recommendation_clicked", {
              careerId: topMatch.id,
              action: "explore_career",
              source: "quiz_result",
            })}
            className="flex-1 inline-flex items-center justify-center rounded-full bg-core-accent px-4 py-2.5 text-xs font-semibold text-white transition active:bg-core-accent/90"
          >
            Explore
          </Link>
          {allMatches[1] ? (
            <Link
              href={`/careers/compare?careerA=${topMatch.id}&careerB=${allMatches[1].careerId}`}
              onClick={() => logEvent("comparison_initiated", {
                careerA: topMatch.id,
                careerB: allMatches[1].careerId,
                source: "quiz_result",
              })}
              className="flex-1 inline-flex items-center justify-center rounded-full border border-core-accent bg-core-accent/5 px-4 py-2.5 text-xs font-semibold text-core-accent transition active:bg-core-accent/10"
            >
              Compare
            </Link>
          ) : null}
        </div>
      </div>

      {/* Desktop CTAs remain in-flow */}
      <div className="hidden md:flex md:mt-8 md:flex-row md:gap-3 md:justify-center">
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[color:var(--surface)]/90 px-6 py-3 text-sm font-semibold text-[var(--heading)] transition hover:border-core-accent/60"
        >
          Retake analysis
        </button>
        <Link
          href={`/careers/${topMatch.id}`}
          onClick={() => logEvent("recommendation_clicked", {
            careerId: topMatch.id,
            action: "explore_career",
            source: "quiz_result",
          })}
          className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-core-accent/90"
        >
          Explore this career
        </Link>
        {allMatches[1] ? (
          <Link
            href={`/careers/compare?careerA=${topMatch.id}&careerB=${allMatches[1].careerId}`}
            onClick={() => logEvent("comparison_initiated", {
              careerA: topMatch.id,
              careerB: allMatches[1].careerId,
              source: "quiz_result",
            })}
            className="inline-flex items-center justify-center rounded-full border border-core-accent bg-core-accent/5 px-6 py-3 text-sm font-semibold text-core-accent hover:bg-core-accent/10 transition"
          >
            Compare top matches
          </Link>
        ) : null}
      </div>
    </div>
  );
}
