"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getJourneyReplaySummary,
  formatRelativeTime,
  formatItemDate,
} from "../data/journey-replay";

interface Props {
  onViewFull?: () => void;
  className?: string;
}

export default function JourneyReplaySummaryCard({ onViewFull, className = "" }: Props) {
  const [summary, setSummary] = useState<{
    total: number;
    milestones: number;
    firstDate: string | null;
  } | null>(null);

  const load = useCallback(() => {
    setSummary(getJourneyReplaySummary());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!summary || summary.total === 0) return null;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-5 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Stats */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-core-muted font-semibold">
            Journey replay
          </p>

          <div className="mt-2 flex items-center gap-4 flex-wrap">
            {/* Total events */}
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-core-heading tabular-nums">
                {summary.total}
              </span>
              <span className="text-xs text-core-muted">events</span>
            </div>

            {/* Milestones */}
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-core-heading tabular-nums">
                {summary.milestones}
              </span>
              <span className="text-xs text-core-muted">milestones</span>
            </div>

            {/* First quiz date */}
            {summary.firstDate && (
              <div className="flex items-center gap-1.5 text-xs text-core-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5 shrink-0"
                >
                  <path d="M5.5 4.5A1.5 1.5 0 007 6h6a1.5 1.5 0 001.5-1.5V3a.5.5 0 01.5.5v1.5A2.5 2.5 0 0112.5 7h-5A2.5 2.5 0 015 4.5V3a.5.5 0 01.5.5z" />
                  <path fillRule="evenodd" d="M3 5.5A2.5 2.5 0 015.5 3h9A2.5 2.5 0 0117 5.5v9A2.5 2.5 0 0114.5 17h-9A2.5 2.5 0 013 14.5v-9zm2.5-1A1.5 1.5 0 004 6v8.5A1.5 1.5 0 005.5 16h9a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-9z" clipRule="evenodd" />
                </svg>
                <span>Since {formatItemDate(summary.firstDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {onViewFull && (
          <button
            type="button"
            onClick={onViewFull}
            className="shrink-0 rounded-full bg-core-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
          >
            View timeline
          </button>
        )}
      </div>

      {/* Relative time */}
      {summary.firstDate && (
        <p className="mt-2 text-[11px] text-core-muted/50">
          Started {formatRelativeTime(summary.firstDate)}
        </p>
      )}
    </section>
  );
}
