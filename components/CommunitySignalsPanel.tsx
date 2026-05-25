"use client";

import { useEffect, useMemo, useState } from "react";
import type { Career } from "../data/careers";
import { buildCommunitySignals } from "../data/community-signals";
import { loadJourneyMemory } from "../data/journey-memory";
import { getAllEvents } from "../data/analytics-events";

interface CommunitySignalsPanelProps {
  career?: Career;
}

export default function CommunitySignalsPanel({ career }: CommunitySignalsPanelProps) {
  const [journeyMemory, setJourneyMemory] = useState<Awaited<ReturnType<typeof loadJourneyMemory>> | null>(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setJourneyMemory(loadJourneyMemory());
    setEvents(getAllEvents(50));
  }, []);

  const signals = useMemo(() => {
    if (!journeyMemory) {
      return buildCommunitySignals();
    }

    return buildCommunitySignals({ career, journeyMemory, events });
  }, [career, events, journeyMemory]);

  return (
    <section className="rounded-card border border-core-border bg-white/5 p-8 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-title">Community intelligence</p>
          <h2 className="section-heading">What learners like you are discovering.</h2>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-core-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Popular career signal</p>
          <ul className="mt-4 space-y-3 text-sm text-core-muted">
            {signals.popularCareers.map((item) => (
              <li key={item} className="rounded-2xl bg-white/5 px-4 py-3 text-core-heading">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-core-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Trending project ideas</p>
          <ul className="mt-4 space-y-3 text-sm text-core-muted">
            {signals.trendingProjects.map((project) => (
              <li key={project} className="rounded-2xl bg-white/5 px-4 py-3 text-core-heading">
                {project}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-core-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Common growth patterns</p>
          <ul className="mt-4 space-y-3 text-sm text-core-muted">
            {signals.commonCareerSwitches.map((item) => (
              <li key={item} className="rounded-2xl bg-white/5 px-4 py-3 text-core-heading">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-core-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Frequent learning gaps</p>
          <ul className="mt-4 space-y-3 text-sm text-core-muted">
            {signals.frequentSkillGaps.map((gap) => (
              <li key={gap} className="rounded-2xl bg-white/5 px-4 py-3 text-core-heading">
                {gap}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Emerging signals</p>
        <div className="mt-4 space-y-3 text-sm text-core-muted">
          {signals.emergingInterests.map((interest) => (
            <p key={interest} className="rounded-2xl bg-core-surface px-4 py-3 text-core-heading">
              {interest}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
