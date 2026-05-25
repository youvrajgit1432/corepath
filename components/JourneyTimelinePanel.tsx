"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  buildTimeline,
  groupTimelineByPeriod,
  formatRelativeTime,
  getEventTypeLabel,
  type TimelineEvent,
  type TimelineGroups,
} from "../data/journey-timeline";
import JourneyActionPanel from "./JourneyActionPanel";

type Props = {
  className?: string;
};

const EVENT_ICONS: Record<string, string> = {
  quiz_completed: "📝",
  career_viewed: "👁️",
  comparison_created: "⚖️",
  workspace_started: "🚀",
  roadmap_milestone: "⭐",
  resume_analysis: "📊",
};

const EVENT_BG_COLORS: Record<string, string> = {
  quiz_completed: "bg-emerald-500/10 border-emerald-500/20",
  career_viewed: "bg-sky-500/10 border-sky-500/20",
  comparison_created: "bg-amber-500/10 border-amber-500/20",
  workspace_started: "bg-violet-500/10 border-violet-500/20",
  roadmap_milestone: "bg-rose-500/10 border-rose-500/20",
  resume_analysis: "bg-teal-500/10 border-teal-500/20",
};

export default function JourneyTimelinePanel({ className = "" }: Props) {
  const [groups, setGroups] = useState<TimelineGroups | null>(null);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    new Set(["today", "lastWeek", "earlier"])
  );

  useEffect(() => {
    const events = buildTimeline();
    setGroups(groupTimelineByPeriod(events));
  }, []);

  const togglePeriod = (period: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  };

  const totalCount = groups
    ? groups.today.length + groups.lastWeek.length + groups.earlier.length
    : 0;

  if (!groups || totalCount === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}
    >
      <JourneyActionPanel className="mb-6" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Activity timeline
          </p>
          <h3 className="mt-1 text-lg font-display text-core-heading">
            Your journey ({totalCount})
          </h3>
        </div>
      </div>

      <div className="space-y-6">
        <TimelinePeriod
          label="Today"
          events={groups.today}
          expanded={expandedPeriods.has("today")}
          onToggle={() => togglePeriod("today")}
        />
        <TimelinePeriod
          label="Last week"
          events={groups.lastWeek}
          expanded={expandedPeriods.has("lastWeek")}
          onToggle={() => togglePeriod("lastWeek")}
        />
        <TimelinePeriod
          label="Earlier"
          events={groups.earlier}
          expanded={expandedPeriods.has("earlier")}
          onToggle={() => togglePeriod("earlier")}
        />
      </div>
    </section>
  );
}

function TimelinePeriod({
  label,
  events,
  expanded,
  onToggle,
}: {
  label: string;
  events: TimelineEvent[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (events.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 w-full text-left group cursor-pointer"
      >
        <span className="text-xs uppercase tracking-[0.24em] text-core-muted font-mono">
          {label}
        </span>
        <span className="text-xs font-mono text-core-accent/70">
          {events.length}
        </span>
        <span className="flex-1 h-px bg-core-border/50" />
        <span className="text-xs text-core-muted/50 group-hover:text-core-muted transition-colors">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {events.map((event) => {
            const icon =
              event.icon || EVENT_ICONS[event.type] || "•";
            const colorClass =
              EVENT_BG_COLORS[event.type] ||
              "bg-core-bg/40 border-core-border/50";
            const typeLabel = getEventTypeLabel(event.type);

            return (
              <div
                key={event.id}
                className={`group flex items-start gap-3 rounded-lg border p-3.5 transition-colors hover:bg-core-bg/60 ${colorClass}`}
              >
                <div className="flex flex-col items-center pt-1">
                  <span className="text-base">{icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-core-heading truncate">
                      {event.title}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-core-muted/60 flex-shrink-0">
                      {typeLabel}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-core-muted mt-0.5 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[11px] text-core-muted/50 font-mono">
                      {formatRelativeTime(event.timestamp)}
                    </p>
                    {event.actionHref && (
                      <Link
                        href={event.actionHref}
                        target={event.eventTarget ?? "_self"}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-core-accent hover:text-core-accent/80 transition-colors"
                      >
                        {event.actionLabel || "Open"}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
