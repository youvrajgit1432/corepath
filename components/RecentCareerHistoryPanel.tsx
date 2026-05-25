"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadJourneyMemory, removeViewedCareer } from "../data/journey-memory";
import { getCareerById } from "../data/careers";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecentCareer {
  careerId: string;
  title: string;
  category: string;
  lastViewed: string;
  visitCount: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  className?: string;
};

export default function RecentCareerHistoryPanel({ className = "" }: Props) {
  const [careers, setCareers] = useState<RecentCareer[]>([]);

  const loadHistory = () => {
    const memory = loadJourneyMemory();

    // Dedupe by careerId — keep most recent entry per career
    const seen = new Map<string, { timestamp: string }>();
    for (const entry of memory.viewedCareerHistory) {
      const existing = seen.get(entry.careerId);
      if (!existing || entry.timestamp > existing.timestamp) {
        seen.set(entry.careerId, { timestamp: entry.timestamp });
      }
    }

    // Build list, sort newest first, limit 10
    const entries: RecentCareer[] = [];
    for (const [careerId, { timestamp }] of seen) {
      const career = getCareerById(careerId);
      const visitCount = memory.viewedCareers[careerId] ?? 0;
      entries.push({
        careerId,
        title: career?.title ?? careerId,
        category: career?.category ?? "",
        lastViewed: timestamp,
        visitCount,
      });
    }

    entries.sort(
      (a, b) => new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime()
    );

    setCareers(entries.slice(0, 10));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = (careerId: string) => {
    removeViewedCareer(careerId);
    loadHistory(); // Reload after deletion
  };

  if (careers.length === 0) return null;

  return (
    <section
      className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Recently viewed
          </p>
          <h3 className="mt-1 text-lg font-display text-core-heading">
            Career history ({careers.length})
          </h3>
        </div>
        <Link
          href="/careers"
          className="text-xs text-core-accent hover:underline flex-shrink-0"
        >
          Continue exploring &rarr;
        </Link>
      </div>

      <div className="space-y-2">
        {careers.map((entry) => (
          <div
            key={entry.careerId}
            className="group flex items-center gap-3 rounded-lg border border-core-border/50 bg-core-bg/30 p-3 transition-colors hover:bg-core-bg/60"
          >
            {/* Reopen link */}
            <Link
              href={`/careers/${entry.careerId}`}
              className="flex-1 min-w-0 flex items-center gap-3"
            >
              <span className="text-sm">{getCareerById(entry.careerId)?.icon ?? "💼"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-core-heading truncate group-hover:text-core-accent transition-colors">
                  {entry.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-core-muted/60">
                    {entry.category}
                  </span>
                  <span className="text-[10px] text-core-muted/40">&middot;</span>
                  <span className="text-[11px] text-core-muted/60">
                    {formatRelativeTime(entry.lastViewed)}
                  </span>
                  <span className="text-[10px] text-core-muted/40">&middot;</span>
                  <span className="text-[11px] text-core-muted/60">
                    {entry.visitCount} visit{entry.visitCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>

            {/* Reopen shortcut */}
            <Link
              href={`/careers/${entry.careerId}`}
              className="flex-shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-core-accent bg-core-accent/5 border border-core-accent/20 hover:bg-core-accent/10 transition-colors"
            >
              Reopen
            </Link>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => handleDelete(entry.careerId)}
              className="flex-shrink-0 rounded-md p-1.5 text-core-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label={`Remove ${entry.title} from history`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "Just now";
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}


