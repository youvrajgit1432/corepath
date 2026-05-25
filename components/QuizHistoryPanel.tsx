"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  loadQuizHistory,
  deleteQuizResult,
  clearQuizHistory,
  type QuizHistoryEntry,
} from "../data/quiz-history";

type Props = {
  className?: string;
  /** Maximum entries to show before collapsing */
  initialLimit?: number;
};

export default function QuizHistoryPanel({ className = "", initialLimit = 5 }: Props) {
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Load history on mount and after any delete/clear action
  const refresh = useCallback(() => {
    setHistory(loadQuizHistory());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const displayed = showAll ? history : history.slice(0, initialLimit);
  const hasMore = history.length > initialLimit;

  const handleDelete = (id: string) => {
    deleteQuizResult(id);
    refresh();
  };

  const handleClear = () => {
    if (window.confirm("Clear all quiz history? This cannot be undone.")) {
      clearQuizHistory();
      refresh();
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Quiz history
          </p>
          <h3 className="mt-1 text-lg font-display text-core-heading">
            Past results ({history.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-core-muted hover:text-red-400 transition-colors font-mono"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-3">
        {displayed.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center justify-between rounded-lg border border-core-border bg-core-bg/70 p-3.5 hover:border-core-accent/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {entry.topCareer.icon && (
                  <span className="text-lg flex-shrink-0">{entry.topCareer.icon}</span>
                )}
                <p className="text-sm font-medium text-core-text truncate">
                  {entry.topCareer.title}
                </p>
                <span className="text-xs font-mono text-core-accent flex-shrink-0">
                  {entry.confidence}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-core-muted">
                <span>{formatDate(entry.timestamp)}</span>
                {entry.topMatches.length > 1 && (
                  <>
                    <span className="text-core-border">·</span>
                    <span>
                      {entry.topMatches[1].title} ({entry.topMatches[1].percentage}%)
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
              <Link
                href={`/recommendation?results=${entry.topMatches
                  .map((m) => `${m.careerId}:${m.percentage}`)
                  .join(",")}`}
                className="px-2.5 py-1.5 rounded-md text-xs font-mono text-core-muted hover:text-core-accent hover:bg-core-accent/5 transition-colors"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                className="px-2.5 py-1.5 rounded-md text-xs font-mono text-core-muted hover:text-red-400 hover:bg-red-400/5 transition-colors"
                aria-label={`Delete result for ${entry.topCareer.title}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full text-center text-xs font-mono text-core-muted hover:text-core-accent transition-colors py-2"
        >
          {showAll ? "Show less" : `Show all ${history.length} results`}
        </button>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
