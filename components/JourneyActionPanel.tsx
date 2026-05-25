"use client";

import { useMemo } from "react";
import Link from "next/link";
import { loadCareerWorkspace } from "../data/career-workspace";
import { loadComparisonHistory } from "../data/comparison-history";
import { loadQuizHistory } from "../data/quiz-history";
import { loadJourneyMemory } from "../data/journey-memory";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Action {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  priority: number;
}

// ─── Action Generation ───────────────────────────────────────────────────────

function generateActions() {
  const workspace = loadCareerWorkspace();
  const comparisons = loadComparisonHistory();
  const quizHistory = loadQuizHistory();
  const memory = loadJourneyMemory();

  const actions: Action[] = [];

  // 1. Continue workspace (highest priority)
  if (workspace) {
    actions.push({
      id: "continue-workspace",
      label: "Continue workspace",
      description: `Resume ${workspace.selectedCareerTitle} — ${workspace.activePhaseName}`,
      href: `/careers/${workspace.selectedCareerId}`,
      icon: "🚀",
      priority: 1,
    });
  }

  // 2. Resume roadmap (incomplete milestones)
  if (workspace && workspace.estimatedReadiness < 100) {
    actions.push({
      id: "resume-roadmap",
      label: "Resume roadmap",
      description: `Complete the next milestone for ${workspace.selectedCareerTitle}`,
      href: `/careers/${workspace.selectedCareerId}`,
      icon: "⭐",
      priority: 2,
    });
  }

  // 3. Revisit last comparison
  const lastComparison = comparisons[0];
  if (lastComparison) {
    const a = lastComparison.careerA;
    const b = lastComparison.careerB;
    actions.push({
      id: "revisit-comparison",
      label: "Revisit comparison",
      description: `Review ${a} vs ${b}`,
      href: `/careers/compare?careerA=${encodeURIComponent(a)}&careerB=${encodeURIComponent(b)}`,
      icon: "⚖️",
      priority: 3,
    });
  }

  // 4. Retake quiz
  if (quizHistory.length > 0) {
    const lastQuiz = quizHistory[0];
    actions.push({
      id: "retake-quiz",
      label: "Retake quiz",
      description:
        lastQuiz.confidence < 50
          ? "Your last result had low confidence — try again for a clearer picture"
          : "Your preferences may have shifted — explore what's new",
      href: "/quiz",
      icon: "📝",
      priority: 4,
    });
  }

  // 5. Continue previous session (no workspace yet)
  if (memory.completedQuizzes > 0 && !workspace) {
    actions.push({
      id: "continue-session",
      label: "Continue previous session",
      description: `Pick up where you left off after ${memory.completedQuizzes} session${memory.completedQuizzes > 1 ? "s" : ""}`,
      href: "/recommendation",
      icon: "🔄",
      priority: 5,
    });
  }

  // 6. Resume profile analysis (multiple sessions)
  if (memory.completedQuizzes > 1) {
    actions.push({
      id: "resume-analysis",
      label: "Resume profile analysis",
      description: "Your journey profile has evolved — see what's changed",
      href: "/recommendation",
      icon: "📊",
      priority: 6,
    });
  }

  actions.sort((a, b) => a.priority - b.priority);

  return {
    primary: actions[0] ?? null,
    secondary: actions.slice(1, 4),
  };
}

// ─── Icons per action id ─────────────────────────────────────────────────────

const ACTION_GRADIENTS: Record<string, string> = {
  "continue-workspace": "from-violet-500 to-purple-600",
  "resume-roadmap": "from-rose-500 to-pink-600",
  "revisit-comparison": "from-amber-500 to-orange-600",
  "retake-quiz": "from-emerald-500 to-teal-600",
  "continue-session": "from-sky-500 to-blue-600",
  "resume-analysis": "from-teal-500 to-cyan-600",
};

const ACTION_BG: Record<string, string> = {
  "continue-workspace": "bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15",
  "resume-roadmap": "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15",
  "revisit-comparison": "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15",
  "retake-quiz": "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15",
  "continue-session": "bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15",
  "resume-analysis": "bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/15",
};

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  className?: string;
};

export default function JourneyActionPanel({ className = "" }: Props) {
  const { primary, secondary } = useMemo(() => generateActions(), []);

  if (!primary) return null;

  const gradient = ACTION_GRADIENTS[primary.id] ?? "from-indigo-500 to-purple-600";
  const bgClass = ACTION_BG[primary.id] ?? "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15";

  return (
    <section className={className}>
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
          Suggested actions
        </p>
      </div>

      {/* Primary action — prominent card */}
      <Link
        href={primary.href}
        className={`group relative block overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${bgClass}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.04] group-hover:opacity-[0.07] transition-opacity`} />
        <div className="relative flex items-start gap-3.5">
          <span className="mt-0.5 text-xl">{primary.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-core-heading group-hover:text-core-accent transition-colors">
              {primary.label}
            </p>
            <p className="text-xs text-core-muted mt-1 leading-relaxed">
              {primary.description}
            </p>
          </div>
          <span className="mt-1 text-core-muted/40 group-hover:text-core-accent/60 transition-colors text-sm">
            &rarr;
          </span>
        </div>
      </Link>

      {/* Secondary actions — compact list */}
      {secondary.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {secondary.map((action) => {
            const secBg = ACTION_BG[action.id] ?? "bg-white/5 border-white/10 hover:bg-white/10";
            return (
              <Link
                key={action.id}
                href={action.href}
                className={`group flex items-center gap-3 rounded-lg border p-3 transition-colors ${secBg}`}
              >
                <span className="text-base">{action.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-core-heading group-hover:text-core-accent transition-colors">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-core-muted/70 mt-0.5 line-clamp-1">
                    {action.description}
                  </p>
                </div>
                <span className="text-core-muted/30 group-hover:text-core-accent/50 transition-colors text-xs">
                  &rarr;
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
