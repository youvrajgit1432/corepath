"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import HomeCareerPreviewGrid from "../components/HomeCareerPreviewGrid";
import GuidedOnboarding from "../components/GuidedOnboarding";
import QuickStartPanel from "../components/QuickStartPanel";
import TrustPanel from "../components/TrustPanel";
import FeedbackPanel from "../components/FeedbackPanel";
import JourneyTimelinePanel from "../components/JourneyTimelinePanel";
import RecentCareerHistoryPanel from "../components/RecentCareerHistoryPanel";
import DailyMissionPanel from "../components/DailyMissionPanel";
import GoalTrackerPanel from "../components/GoalTrackerPanel";
import CareerProgressPanel from "../components/CareerProgressPanel";
import AchievementPanel from "../components/AchievementPanel";
import WeeklyReflectionPanel from "../components/WeeklyReflectionPanel";
import CommunitySignalsPanel from "../components/CommunitySignalsPanel";
import FloatingCommandCenter from "../components/FloatingCommandCenter";
import { loadJourneyMemory } from "../data/journey-memory";
import { getUnreadCount } from "../data/notification-engine";

export default function HomeContent() {
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState<boolean | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(getUnreadCount());
    const interval = setInterval(() => setUnreadCount(getUnreadCount()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const memory = loadJourneyMemory();
    setHasCompletedQuiz(memory.completedQuizzes > 0);
  }, []);

  const isNewUser = hasCompletedQuiz !== true; // null or false → show simplified view (safe)



  return (
    <main className="page-shell py-16 px-4 sm:px-6 lg:px-8">
      {/* ─── Hero & Command Center ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FloatingCommandCenter />
      </section>

      <section className="hero-shell lg:grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-start">
        <div className="max-w-3xl">
          <p className="section-title">AI-era career intelligence</p>
          <h1 className="section-heading mb-6">
            Stop treating career choices like a checklist. Choose a specialization that AI amplifies, not replaces.
          </h1>
          <p className="text-core-muted text-lg leading-relaxed max-w-2xl mb-8">
            CorePath is designed to reduce confusion in a world where every field is shifting under the weight of automation.
            We surface the specialization that gives you long-term advantage, future clarity, and a confident next move.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-indigo-500"
            >
              Start career cognition
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/10 px-6 py-3 text-sm font-semibold text-core-heading transition hover:bg-white/20"
            >
              Explore intelligence cards
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Specialization</p>
              <p className="text-3xl font-semibold">One Core</p>
              <p className="text-core-muted mt-2">Deep expertise your AI advantage is built around.</p>
            </div>
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Supporting skills</p>
              <p className="text-3xl font-semibold">3–4</p>
              <p className="text-core-muted mt-2">Complementary strengths that make your path strategic.</p>
            </div>
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Clarity</p>
              <p className="text-3xl font-semibold">Actionable</p>
              <p className="text-core-muted mt-2">Insights that turn confusion into a focused roadmap.</p>
            </div>
          </div>
        </div>

        <div className="rounded-card border-core-border bg-core-surface p-8 shadow-soft relative overflow-hidden">
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-core-accent/10 blur-3xl" />
          <div className="absolute -bottom-10 left-4 h-24 w-24 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Strategic model</p>
            <p className="mt-3 text-xl font-semibold text-[var(--heading)]">One Core + Supporting Skills</p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              A single deep specialization is your anchor. Supporting skills turn it into a full career system, not a shallow checklist.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10">
              <p className="text-sm font-semibold text-core-heading">AI impact analysis</p>
              <p className="text-core-muted mt-2 text-sm leading-relaxed">
                See whether a role is AI-native, AI-assisted, or anchored by human judgment.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10">
              <p className="text-sm font-semibold text-core-heading">Strategic specialization</p>
              <p className="text-core-muted mt-2 text-sm leading-relaxed">
                Avoid broad generalism. Focus on a high-value specialty that AI makes more powerful.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10">
              <p className="text-sm font-semibold text-core-heading">Future demand signal</p>
              <p className="text-core-muted mt-2 text-sm leading-relaxed">
                Understand market maturity and where demand is expanding versus where it is stabilizing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── UNREAD PILL ─── */}
      {unreadCount > 0 && (
        <section className="mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-core-accent/20 bg-core-accent/5 px-4 py-1.5 text-xs text-core-muted">
            <span>🔔</span>
            <span>You have {unreadCount} update{unreadCount !== 1 ? "s" : ""}</span>
          </div>
        </section>
      )}

      {/* ─── TRENDING AI-ERA CAREERS ─── */}
      <HomeCareerPreviewGrid />

      {/* ─── TAKE QUIZ CTA ─── */}
      <section className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-card border border-core-accent/30 bg-gradient-to-br from-core-accent/5 to-transparent p-8 md:p-12 text-center">
          <p className="section-title text-core-accent">Ready to find your path?</p>
          <h2 className="mt-3 text-3xl font-semibold text-core-heading">
            Take the career cognition quiz
          </h2>
          <p className="mt-3 text-core-muted max-w-xl mx-auto leading-relaxed">
            Your answers reveal your thinking style, surface your best-fit specialization, and
            start building your personal career intelligence profile.
          </p>
          <Link
            href="/quiz"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-core-accent px-8 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-indigo-500 hover:shadow-lg"
          >
            Start the quiz →
          </Link>
          <p className="mt-3 text-xs text-core-muted/60">Takes about 5 minutes · No sign-up required</p>
        </div>
      </section>

      {/* ─── 4-STEP JOURNEY (Guided Onboarding) ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <GuidedOnboarding />
      </section>

      {/* ─── COMMUNITY PROOF ─── */}
      <section className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-card border border-core-border bg-white/5 p-8 shadow-soft">
          <p className="section-title">Trusted by early-career professionals</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-core-heading">50+</p>
              <p className="text-sm text-core-muted mt-2">AI-era career paths mapped</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-core-heading">100%</p>
              <p className="text-sm text-core-muted mt-2">Free intelligence platform</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-core-heading">Data-driven</p>
              <p className="text-sm text-core-muted mt-2">Recommendations built on cognitive analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEW USER: Start Your Journey ─── */}
      {isNewUser && (
        <section className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-card border border-core-border bg-core-surface p-8 text-center">
            <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-4">Your progress</p>
            <p className="text-2xl font-semibold text-core-heading">Start your journey</p>
            <p className="mt-2 text-core-muted max-w-md mx-auto leading-relaxed">
              Take the quiz to unlock your personalized career intelligence dashboard.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/quiz"
                className="rounded-full bg-core-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                Take the quiz
              </Link>
              <Link
                href="/careers"
                className="rounded-full border border-core-border px-5 py-2 text-sm font-medium text-core-text transition hover:bg-white/10"
              >
                Browse careers
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── RETURNING USER: Intelligent panels ─── */}
      {!isNewUser && (
        <>
          <section className="mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <RecentCareerHistoryPanel />
          </section>

          <section className="mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <JourneyTimelinePanel />
          </section>

          <section className="mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <CareerProgressPanel />
          </section>

          <section className="mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AchievementPanel />
          </section>

          <section className="mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <DailyMissionPanel />
          </section>

          <section className="mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <WeeklyReflectionPanel />
          </section>

          <section className="mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <GoalTrackerPanel />
          </section>

          <section className="mt-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <CommunitySignalsPanel />
            </div>
          </section>
        </>
      )}

      {/* ─── BELOW FOLD: Quick Start + Trust + Feedback ─── */}
      <section className="mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
          <div className="space-y-6">
            <QuickStartPanel />
            <TrustPanel />
          </div>
          <FeedbackPanel source="home" />
        </div>
      </section>

      {/* ─── BELOW FOLD: Why This Matters / Core Problem / Long Explanation ─── */}
      <section className="mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <div>
              <p className="section-title">Why this matters</p>
              <h2 className="section-heading">Most career advice is still built for the pre-AI era.</h2>
              <p className="text-core-muted text-lg leading-relaxed max-w-3xl">
                Without a clear specialization thesis, people drift from role to role and let AI shape their future for them.
                CorePath frames career choice as a strategic decision: pick a specialization where you build leverage, not just a job title.
              </p>
            </div>
            <div className="rounded-3xl border border-core-border bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Core problem</p>
              <p className="mt-4 text-lg font-semibold text-core-heading">Confusion comes from trying to learn everything.</p>
              <p className="mt-3 text-core-muted leading-relaxed">
                The AI era rewards depth in one valuable specialization and breadth across supporting skills. Anything else is busy work.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Clarity</p>
              <h3 className="mt-3 text-xl font-semibold text-core-heading">What fits you</h3>
              <p className="mt-2 text-core-muted text-sm leading-relaxed">
                We connect your thinking style to roles that match your preferred work rhythm, risk profile, and AI readiness.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Choice</p>
              <h3 className="mt-3 text-xl font-semibold text-core-heading">What matters</h3>
              <p className="mt-2 text-core-muted text-sm leading-relaxed">
                Every recommendation is filtered through AI impact, future demand, and whether the role can become your edge.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Positioning</p>
              <h3 className="mt-3 text-xl font-semibold text-core-heading">How to grow</h3>
              <p className="mt-2 text-core-muted text-sm leading-relaxed">
                Learn the long-term expansion paths that turn one specialization into multiple future opportunities.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Signal</p>
              <h3 className="mt-3 text-xl font-semibold text-core-heading">What to avoid</h3>
              <p className="mt-2 text-core-muted text-sm leading-relaxed">
                We highlight roles that are high-signal, not just popular, so you invest in specialization with staying power.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LINK CARDS ─── */}
      <section className="mt-16 grid gap-6 md:grid-cols-3 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/careers"
          className="rounded-card border-core-border bg-white/5 p-8 transition hover:border-core-accent hover:bg-core-surface"
        >
          <p className="section-title">Careers</p>
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">Navigate specialization intelligence</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Filter roles by future demand, AI relationship, and the kind of specialization advantage they unlock.
          </p>
        </Link>
        <Link
          href="/quiz"
          className="rounded-card border-core-border bg-white/5 p-8 transition hover:border-core-accent hover:bg-core-surface"
        >
          <p className="section-title">Quiz</p>
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">Reveal your decision profile</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Get a career cognition analysis that explains why certain pathways fit you better than others.
          </p>
        </Link>
        <Link
          href="/recommendation"
          className="rounded-card border-core-border bg-white/5 p-8 transition hover:border-core-accent hover:bg-core-surface"
        >
          <p className="section-title">Recommendation</p>
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">Turn insight into action</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Compare curated routes and decide which specialization strategy gives you a clear edge.
          </p>
        </Link>
      </section>
    </main>
  );
}
