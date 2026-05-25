"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSafeStorage } from "../data/safe-storage";
import { getAllEvents, logEvent } from "../data/analytics-events";
import { loadJourneyMemory } from "../data/journey-memory";

const STORAGE_KEY = "corepath_onboarding_seen";

function getStorage() {
  return getSafeStorage({ silent: true });
}

const onboardingSteps = [
  {
    title: "Discover how you think",
    body: "Start with your real decision style, not a generic job list.",
  },
  {
    title: "Take adaptive quiz",
    body: "Answer focused prompts that adapt as your signal gets clearer.",
  },
  {
    title: "Explore recommendations",
    body: "See why a path fits, where confidence is strong, and what alternatives mean.",
  },
  {
    title: "View roadmap",
    body: "Turn a match into phases, skills, and practical milestones.",
  },
  {
    title: "Track evolving profile",
    body: "Your journey memory improves as you explore, compare, and revisit paths.",
  },
];

const entryOptions = [
  {
    label: "I already know my goal",
    description: "Jump into career cards and validate the path you have in mind.",
    href: "/careers",
    intent: "known_goal",
  },
  {
    label: "I'm exploring careers",
    description: "Browse the full map by category, AI impact, and demand signals.",
    href: "/careers",
    intent: "exploring",
  },
  {
    label: "I'm confused",
    description: "Start with the quiz and let the system narrow your direction.",
    href: "/quiz?intent=confused",
    intent: "confused",
  },
  {
    label: "I want future-proof careers",
    description: "Open careers filtered toward high-growth, AI-era demand.",
    href: "/careers?futureDemand=Exploding",
    intent: "future_proof",
  },
  {
    label: "I want AI-focused paths",
    description: "Focus on roles where AI is central to the work, not an afterthought.",
    href: "/careers?aiRelationship=AI-Created",
    intent: "ai_focused",
  },
];

const progressSteps = [
  { key: "quiz", label: "Quiz" },
  { key: "match", label: "Match" },
  { key: "compare", label: "Compare" },
  { key: "roadmap", label: "Roadmap" },
  { key: "profile", label: "Evolving Profile" },
];

function readStorage(key: string): string | null {
  try {
    return getStorage().get<string>(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    getStorage().set(key, value);
  } catch {
    // Storage can be unavailable in restricted local contexts.
  }
}

function getJourneyProgress() {
  const events = getAllEvents(500);
  const memory = loadJourneyMemory();
  const hasQuiz = events.some((event) => event.type === "quiz_started") || memory.completedQuizzes > 0;
  const hasMatch = events.some((event) => event.type === "quiz_completed") || Object.keys(memory.recommendedCareers).length > 0;
  const hasCompare = events.some((event) => event.type === "comparison_opened" || event.type === "comparison_initiated") || Object.keys(memory.comparedCareerPairs).length > 0;
  const hasRoadmap = events.some((event) => event.type === "roadmap_viewed" || event.type === "roadmap_interacted") || Object.keys(memory.roadmapInteractions).length > 0;
  const hasProfile = memory.completedQuizzes > 0 || Object.keys(memory.viewedCareers).length > 0;

  return {
    quiz: hasQuiz,
    match: hasMatch,
    compare: hasCompare,
    roadmap: hasRoadmap,
    profile: hasProfile,
  };
}

export default function GuidedOnboarding() {
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const seen = readStorage(STORAGE_KEY);
    setExpanded(!seen);
    setProgress(getJourneyProgress());
    setMounted(true);
    logEvent("onboarding_opened", { firstTime: !seen });
    logEvent("journey_progress_viewed", getJourneyProgress());
  }, []);

  const completedCount = useMemo(
    () => progressSteps.filter((step) => progress[step.key]).length,
    [progress]
  );

  const handleDismiss = () => {
    writeStorage(STORAGE_KEY, "true");
    setExpanded(false);
  };

  const handleChoice = (intent: string) => {
    writeStorage(STORAGE_KEY, "true");
    logEvent("onboarding_choice_selected", { intent });
  };

  return (
    <section id="guided-start" className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Guided discovery">
      <div className="rounded-card bg-core-surface p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-core-accent">Guided discovery</p>
            <h2 className="mt-3 text-2xl font-semibold text-core-heading">Find your first useful next move.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-core-muted">
              CorePath works best when you follow a simple path: understand your thinking style, get a match, compare tradeoffs, then turn the best path into a roadmap.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (expanded ? handleDismiss() : setExpanded(true))}
            className="inline-flex items-center justify-center rounded-full border border-core-border px-4 py-2 text-sm font-semibold text-core-heading transition hover:border-core-accent/50"
            aria-expanded={expanded}
            aria-controls="onboarding-content"
          >
            {expanded ? "Keep it compact" : "Show guide"}
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-core-muted">
            <span>Career journey progress</span>
            <span>{completedCount}/{progressSteps.length}</span>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-5 relative">
            {/* Progress Track Line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-core-border -z-10 hidden md:block" />
            {progressSteps.map((step, index) => {
              const complete = mounted && progress[step.key];
              return (
                <div
                  key={step.key}
                  className={`rounded-2xl border px-3 py-3 text-sm transition-all duration-300 transform hover:scale-[1.02] ${
                    complete
                      ? "border-core-accent bg-core-accent/10 text-core-heading shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                      : "border-core-border bg-white/5 text-core-muted"
                  }`}
                >
                  <span className={`font-mono text-xs ${complete ? "text-core-accent" : ""}`}>
                    {index + 1}
                  </span>
                  <p className="mt-1 font-semibold">{step.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {expanded ? (
          <div id="onboarding-content" className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h3 className="text-sm font-semibold text-core-heading">How CorePath gets clearer</h3>
              <div className="mt-4 space-y-3">
                {onboardingSteps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-core-border bg-white/5 p-4 transition-colors hover:bg-white/10 hover:border-core-accent/30">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-core-accent/15 text-xs font-semibold text-core-accent shadow-inner">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-core-heading">{step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-core-muted">{step.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-core-heading">Choose your starting point</h3>
              <div className="mt-4 grid gap-3">
                {entryOptions.map((option) => (
                  <Link
                    key={option.intent}
                    href={option.href}
                    onClick={() => handleChoice(option.intent)}
                    className="rounded-2xl border border-core-border bg-white/5 p-4 transition hover:border-core-accent/50 hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-core-heading">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-core-muted">{option.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
