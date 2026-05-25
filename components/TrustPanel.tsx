"use client";

import { useEffect, useMemo, useState } from "react";
import { buildCommunitySignals } from "../data/community-signals";
import { getAllEvents, logEvent } from "../data/analytics-events";
import { loadJourneyMemory } from "../data/journey-memory";

export default function TrustPanel() {
  const [journeyMemory, setJourneyMemory] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    setJourneyMemory(loadJourneyMemory());
    setEvents(getAllEvents(50));
    logEvent("onboarding_opened", { source: "trust_panel" });
  }, []);

  const signals = useMemo(() => {
    if (!journeyMemory) {
      return buildCommunitySignals();
    }
    return buildCommunitySignals({ journeyMemory, events });
  }, [journeyMemory, events]);

  const popularCareer = signals.popularCareers[0] ?? "AI-enabled careers";
  const projectExample = signals.trendingProjects[0] ?? "project ideas";

  return (
    <section className="rounded-card border border-core-border bg-white/5 p-8 shadow-soft">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="section-title">Launch readiness</p>
          <h2 className="section-heading">Trust the path before you commit.</h2>
        </div>
        <span className="inline-flex rounded-full border border-core-border bg-core-bg px-3 py-1 text-xs font-semibold text-core-accent">
          130+ tests passed
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-core-surface p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">How this works</p>
            <ul className="space-y-3 text-sm text-core-muted">
              <li>Adaptive quiz logic customizes questions based on your answers.</li>
              <li>Career alignment is built from role signals, AI impact, and future demand.</li>
              <li>Journey memory remembers your exploration to keep recommendations relevant.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-core-surface p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Privacy-first by design</p>
            <p className="text-sm text-core-muted leading-relaxed">
              All interaction data stays local and anonymous. We do not send your answers or profile data to external systems.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-core-surface p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Adaptive quiz explanation</p>
            <p className="text-sm text-core-muted leading-relaxed">
              The quiz adapts to your response pattern and emphasizes career options where your strengths and the market signals align.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-core-surface p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-2">Community signal example</p>
            <p className="text-sm text-core-muted leading-relaxed">
              Learners like you are exploring roles such as <span className="font-semibold text-core-heading">{popularCareer}</span> and building projects like <span className="font-semibold text-core-heading">{projectExample}</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
