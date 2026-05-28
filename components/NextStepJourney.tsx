/**
 * NEXT STEP JOURNEY
 *
 * Post-quiz guided step system showing users their clear next action.
 * Renders directly under the Overview tab in QuizResultTabs.
 *
 * Steps:
 *   1. Complete Quiz ✅
 *   2. Explore top career
 *   3. Select workspace
 *   4. Complete first mission
 *   5. Build 3-day streak
 *
 * Desktop: horizontal progress timeline
 * Mobile:  horizontal swipeable cards
 *
 * Only ONE primary CTA shown at a time.
 * Progress persisted in localStorage.
 * Celebration anim on step completion.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Career } from "../data/careers";
import { loadJourneyMemory } from "../data/journey-memory";
import { loadCareerWorkspace, selectCareer } from "../data/career-workspace";

import { logEvent } from "../data/analytics-events";

// ─── Constants ──────────────────────────────────────────────────────────

const STORAGE_KEY = "corepath-nextstep-journey";

interface StepDef {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
}

const STEPS: StepDef[] = [
  {
    id: "complete-quiz",
    title: "Complete Quiz",
    description:
      "Take the career cognition quiz to discover your thinking profile and get personalized recommendations.",
    estimatedMinutes: 2,
  },
  {
    id: "explore-career",
    title: "Explore Your Top Career",
    description:
      "Dive deep into your best-matched career path — view the roadmap, required skills, and projected growth.",
    estimatedMinutes: 2,
  },
  {
    id: "select-workspace",
    title: "Select Your Workspace",
    description:
      "Set up your career workspace to start tracking progress with milestones, projects, and daily missions.",
    estimatedMinutes: 5,
  },
  {
    id: "complete-mission",
    title: "Complete First Mission",
    description:
      "Finish your first daily mission to earn XP, build momentum, and advance your career readiness.",
    estimatedMinutes: 10,
  },
  {
    id: "build-streak",
    title: "Build a 3-Day Streak",
    description:
      "Come back daily and complete missions to build a streak — consistency is the key to real progress.",
    estimatedMinutes: 10,
  },
];

const STEP_ICONS: Record<string, string> = {
  "complete-quiz": "📝",
  "explore-career": "🔍",
  "select-workspace": "🛠️",
  "complete-mission": "🎯",
  "build-streak": "🔥",
};

// ─── State persistence ─────────────────────────────────────────────────

interface NextStepState {
  completedSteps: string[];
  lastUpdated: string;
}

function loadState(): NextStepState {
  if (typeof window === "undefined") {
    return { completedSteps: [], lastUpdated: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as NextStepState;
  } catch {
    /* ignore */
  }
  return { completedSteps: [], lastUpdated: "" };
}

function saveState(state: NextStepState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

// ─── Confetti particles ────────────────────────────────────────────────

function ConfettiBurst() {
  const colors = [
    "#6366f1",
    "#22d3ee",
    "#f59e0b",
    "#10b981",
    "#ec4899",
    "#8b5cf6",
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: color, left: "50%", top: "50%" }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 200,
            y: -Math.random() * 180 - 40,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 0.7 + Math.random() * 0.4,
            ease: "easeOut",
            delay: i * 0.04,
          }}
        />
      ))}
    </div>
  );
}

// ─── Single Step Circle (Desktop Timeline) ─────────────────────────────

function StepCircle({
  index,
  step,
  status,
  isFirst,
  isLast,
}: {
  index: number;
  step: StepDef;
  status: "completed" | "active" | "locked";
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center flex-1 min-w-0">
      {/* Connector line (before) */}
      {!isFirst && (
        <div
          className={`h-0.5 flex-1 mx-1 transition-colors duration-500 ${
            status === "completed" ? "bg-core-accent" : "bg-core-border/40"
          }`}
        />
      )}

      {/* Circle */}
      <div className="flex flex-col items-center shrink-0 relative">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
            status === "completed"
              ? "bg-core-accent text-white shadow-md shadow-core-accent/30"
              : status === "active"
                ? "bg-core-accent/15 border-2 border-core-accent text-core-accent"
                : "bg-core-border/20 border border-core-border/40 text-core-muted/50"
          }`}
        >
          {status === "completed" ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            index + 1
          )}
        </div>
        <span
          className={`mt-1.5 text-[10px] font-mono text-center leading-tight max-w-[80px] ${
            status === "completed"
              ? "text-core-accent"
              : status === "active"
                ? "text-core-heading font-semibold"
                : "text-core-muted/50"
          }`}
        >
          {step.title}
        </span>
        <span className="text-[9px] font-mono text-core-muted/40 mt-0.5">
          {step.estimatedMinutes} min
        </span>
      </div>

      {/* Connector line (after) */}
      {isLast && (
        <div
          className={`h-0.5 flex-1 mx-1 transition-colors duration-500 ${
            status === "completed" ? "bg-core-accent" : "bg-core-border/40"
          }`}
        />
      )}
    </div>
  );
}

// ─── Desktop Timeline ──────────────────────────────────────────────────

function DesktopTimeline({
  steps,
  statuses,
  activeIndex,
  primaryCareer,
  onComplete,
}: {
  steps: StepDef[];
  statuses: ("completed" | "active" | "locked")[];
  activeIndex: number;
  primaryCareer: Career;
  onComplete: (stepId: string) => void;
}) {
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;

  return (
    <div className="hidden sm:block">
      {/* Timeline circles */}
      <div className="flex items-center justify-center px-2 mb-6 pt-2">
        {steps.map((step, i) => (
          <StepCircle
            key={step.id}
            index={i}
            step={step}
            status={statuses[i]}
            isFirst={i === 0}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>

      {/* Active step card */}
      {activeStep && (
        <motion.div
          key={activeStep.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-core-border/60 bg-core-surface p-5 relative overflow-hidden"
        >
          {statuses[activeIndex] === "completed" && activeIndex > 0 && (
            <ConfettiBurst />
          )}

          <div className="flex items-start gap-4">
            <span className="text-2xl shrink-0 mt-0.5">
              {STEP_ICONS[activeStep.id]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-core-muted uppercase tracking-widest">
                  Step {activeIndex + 1} of {steps.length}
                </span>
                <span className="text-[10px] font-mono text-core-muted/50 bg-core-border/20 px-1.5 py-0.5 rounded-full">
                  ~{activeStep.estimatedMinutes} min
                </span>
              </div>
              <h3 className="text-base font-semibold text-core-heading mb-1">
                {activeStep.title}
              </h3>
              <p className="text-sm text-core-muted mb-4">
                {activeStep.description}
              </p>

              {/* Single CTA */}
              <ActionButton
                stepId={activeStep.id}
                primaryCareer={primaryCareer}
                onComplete={onComplete}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* All complete — power user shortcut */}
      {activeIndex === -1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-core-accent/30 bg-core-accent/5 p-5 text-center"
        >
          <span className="text-3xl block mb-2">🎉</span>
          <p className="text-sm font-semibold text-core-heading mb-1">
            All journey steps complete!
          </p>
          <p className="text-xs text-core-muted mb-4">
            You are on a strong path. Check your full roadmap for what is next.
          </p>
          <Link
            href={`/careers/${primaryCareer.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-core-accent text-white text-sm font-medium hover:bg-core-accent/90 transition-colors"
          >
            View Full Roadmap →
          </Link>
        </motion.div>
      )}
    </div>
  );
}

// ─── Mobile Card ───────────────────────────────────────────────────────

function MobileCard({
  step,
  status,
  stepIndex,
  totalSteps,
  primaryCareer,
  onComplete,
}: {
  step: StepDef;
  status: "completed" | "active" | "locked";
  stepIndex: number;
  totalSteps: number;
  primaryCareer: Career;
  onComplete: (stepId: string) => void;
}) {
  return (
    <div className="shrink-0 w-[85vw] max-w-[320px] snap-center">
      <div
        className={`rounded-xl border p-5 relative overflow-hidden ${
          status === "locked"
            ? "border-core-border/30 bg-core-bg/50"
            : status === "completed"
              ? "border-core-accent/30 bg-core-accent/5"
              : "border-core-accent/50 bg-core-surface shadow-md"
        }`}
      >
        {status === "completed" && stepIndex > 0 && <ConfettiBurst />}

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              status === "completed"
                ? "bg-core-accent text-white"
                : status === "active"
                  ? "bg-core-accent/15 border-2 border-core-accent text-core-accent"
                  : "bg-core-border/20 border border-core-border/40 text-core-muted/50"
            }`}
          >
            {status === "completed" ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              stepIndex + 1
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-core-heading truncate">
              {status === "completed" ? "✅ " : ""}
              {step.title}
            </p>
            <span className="text-[10px] font-mono text-core-muted/50">
              Step {stepIndex + 1} of {totalSteps} · ~{step.estimatedMinutes}{" "}
              min
            </span>
          </div>
        </div>

        {/* Description */}
        <p
          className={`text-xs mb-4 ${
            status === "locked" ? "text-core-muted/40" : "text-core-muted"
          }`}
        >
          {status === "locked"
            ? "Complete the previous step to unlock this one."
            : step.description}
        </p>

        {/* CTA or locked indicator */}
        {status === "locked" && (
          <div className="flex items-center gap-2 text-xs text-core-muted/40">
            <span>🔒</span>
            <span>Locked</span>
          </div>
        )}
        {status === "active" && (
          <ActionButton
            stepId={step.id}
            primaryCareer={primaryCareer}
            onComplete={onComplete}
          />
        )}
        {status === "completed" && stepIndex < totalSteps - 1 && (
          <div className="flex items-center gap-2 text-xs text-core-accent">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Single CTA Button ─────────────────────────────────────────────────

function ActionButton({
  stepId,
  primaryCareer,
  onComplete,
}: {
  stepId: string;
  primaryCareer: Career;
  onComplete: (stepId: string) => void;
}) {
  switch (stepId) {
    case "complete-quiz":
      // This step auto-completes for users reaching the result page
      return null;

    case "explore-career":
      return (
        <Link
          href={`/careers/${primaryCareer.id}`}
          onClick={() => {
            logEvent("next_step_clicked", {
              stepId,
              careerId: primaryCareer.id,
            });
            onComplete(stepId);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-core-accent text-white text-sm font-medium hover:bg-core-accent/90 transition-colors"
        >
          Explore {primaryCareer.title} →
        </Link>
      );

    case "select-workspace":
      return (
        <Link
          href={`/careers/${primaryCareer.id}`}
          onClick={() => {
            logEvent("next_step_clicked", {
              stepId,
              careerId: primaryCareer.id,
            });
            // Create the workspace immediately
            selectCareer(primaryCareer);
            onComplete(stepId);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-core-accent text-white text-sm font-medium hover:bg-core-accent/90 transition-colors"
        >
          Create Workspace →
        </Link>
      );

    case "complete-mission":
      return (
        <Link
          href={`/careers/${primaryCareer.id}`}
          onClick={() => {
            logEvent("next_step_clicked", {
              stepId,
              careerId: primaryCareer.id,
            });
            onComplete(stepId);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-core-accent text-white text-sm font-medium hover:bg-core-accent/90 transition-colors"
        >
          View Today&apos;s Mission →
        </Link>
      );

    case "build-streak":
      return (
        <Link
          href={`/careers/${primaryCareer.id}`}
          onClick={() => {
            logEvent("next_step_clicked", {
              stepId,
              careerId: primaryCareer.id,
            });
            onComplete(stepId);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-core-accent text-white text-sm font-medium hover:bg-core-accent/90 transition-colors"
        >
          Start Today →
        </Link>
      );

    default:
      return null;
  }
}

// ─── Mobile Horizontal Swipe ──────────────────────────────────────────

function MobileSwipeCards({
  steps,
  statuses,
  activeIndex,
  primaryCareer,
  onComplete,
}: {
  steps: StepDef[];
  statuses: ("completed" | "active" | "locked")[];
  activeIndex: number;
  primaryCareer: Career;
  onComplete: (stepId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slide = Math.round(el.scrollLeft / (el.scrollWidth / steps.length));
    setCurrentSlide(Math.min(slide, steps.length - 1));
  }, [steps.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll to active step on mount
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / steps.length;
    el.scrollTo({ left: cardWidth * activeIndex, behavior: "smooth" });
  }, [activeIndex, steps.length]);

  return (
    <div className="sm:hidden">
      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2"
      >
        {steps.map((step, i) => (
          <MobileCard
            key={step.id}
            step={step}
            status={statuses[i]}
            stepIndex={i}
            totalSteps={steps.length}
            primaryCareer={primaryCareer}
            onComplete={onComplete}
          />
        ))}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-2">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to step ${i + 1}`}
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              const cardWidth = el.scrollWidth / steps.length;
              el.scrollTo({ left: cardWidth * i, behavior: "smooth" });
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === currentSlide
                ? "bg-core-accent w-4"
                : "bg-core-border/40 hover:bg-core-border/60"
            }`}
          />
        ))}
      </div>

      {/* All complete — show roadmap shortcut below dots on mobile */}
      <div className="mt-4">
        {activeIndex === -1 && (
          <Link
            href={`/careers/${primaryCareer.id}`}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-core-accent text-white text-sm font-semibold hover:bg-core-accent/90 transition-colors"
          >
            View Full Roadmap →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

interface NextStepJourneyProps {
  primaryCareer: Career;
}

export default function NextStepJourney({
  primaryCareer,
}: NextStepJourneyProps) {
  const [state, setState] = useState<NextStepState>({ completedSteps: [], lastUpdated: "" });
  const [mounted, setMounted] = useState(false);

  // Determine actual completion from data sources + persisted state (pure computation)
  const { statuses, derivedCompleted } = useMemo((): {
    statuses: ("completed" | "active" | "locked")[];
    derivedCompleted: string[];
  } => {
    const completed = new Set(state.completedSteps);
    const journey = loadJourneyMemory();
    const workspace = loadCareerWorkspace();

    const actuallyCompleted: string[] = [];

    if (journey.completedQuizzes >= 1) actuallyCompleted.push("complete-quiz");

    if (
      (completed.has("explore-career") || journey.viewedCareerHistory.length > 0) &&
      journey.completedQuizzes >= 1
    ) {
      actuallyCompleted.push("explore-career");
    }

    if (workspace !== null || completed.has("select-workspace")) {
      actuallyCompleted.push("select-workspace");
    }

    if (
      (workspace && workspace.completedMilestones.length > 0) ||
      completed.has("complete-mission")
    ) {
      actuallyCompleted.push("complete-mission");
    }

    if ((workspace && workspace.streak >= 3) || completed.has("build-streak")) {
      actuallyCompleted.push("build-streak");
    }

    const result: ("completed" | "active" | "locked")[] = [];
    let foundActive = false;

    for (const step of STEPS) {
      const isActuallyCompletedFromData =
        (step.id === "complete-quiz" && journey.completedQuizzes >= 1) ||
        (step.id === "explore-career" &&
          journey.viewedCareerHistory.length > 0) ||
        (step.id === "select-workspace" && workspace !== null) ||
        (step.id === "complete-mission" &&
          workspace &&
          workspace.completedMilestones.length > 0) ||
        (step.id === "build-streak" && workspace && workspace.streak >= 3);

      if (
        actuallyCompleted.includes(step.id) ||
        isActuallyCompletedFromData
      ) {
        result.push("completed");
      } else if (!foundActive) {
        result.push("active");
        foundActive = true;
      } else {
        result.push("locked");
      }
    }

    return { statuses: result, derivedCompleted: actuallyCompleted };
  }, [state.completedSteps, primaryCareer.id]);

  const activeIndex = useMemo(() => {
    return statuses.findIndex((s) => s === "active");
  }, [statuses]);

  // Hydrate from localStorage
  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  // Sync derived completion back to persisted state (side effect, NOT in useMemo)
  useEffect(() => {
    if (!mounted) return;
    const extra = derivedCompleted.filter(
      (id) => !state.completedSteps.includes(id)
    );
    if (extra.length > 0) {
      setState((prev) => {
        const merged = [...new Set([...prev.completedSteps, ...extra])];
        if (merged.length === prev.completedSteps.length) return prev;
        const next = {
          completedSteps: merged,
          lastUpdated: new Date().toISOString(),
        };
        saveState(next);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedCompleted, mounted]);

  const handleComplete = useCallback((stepId: string) => {
    setState((prev) => {
      if (prev.completedSteps.includes(stepId)) return prev;
      const next = {
        completedSteps: [...prev.completedSteps, stepId],
        lastUpdated: new Date().toISOString(),
      };
      saveState(next);
      logEvent("journey_step_completed", { stepId });
      return next;
    });
  }, []);

  if (!mounted) return null;

  return (
    <section className="rounded-card border border-core-border bg-core-surface p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-1">
            Your Next Steps
          </p>
          <p className="text-sm text-core-muted">
            {activeIndex >= 0
              ? `Step ${activeIndex + 1} of ${STEPS.length}`
              : "All steps completed"}
          </p>
        </div>
        {activeIndex >= 0 && (
          <span className="text-[10px] font-mono text-core-muted/50 bg-core-border/20 px-2 py-1 rounded-full">
            ~{STEPS[activeIndex].estimatedMinutes} min
          </span>
        )}
      </div>

      {/* Desktop timeline */}
      <DesktopTimeline
        steps={STEPS}
        statuses={statuses}
        activeIndex={activeIndex}
        primaryCareer={primaryCareer}
        onComplete={handleComplete}
      />

      {/* Mobile swipe cards */}
      <MobileSwipeCards
        steps={STEPS}
        statuses={statuses}
        activeIndex={activeIndex}
        primaryCareer={primaryCareer}
        onComplete={handleComplete}
      />
    </section>
  );
}
