"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { loadQuizSession, clearQuizSession, type QuizSession } from "../data/quiz-session";
import { loadQuizHistory, deleteQuizResult, type QuizHistoryEntry } from "../data/quiz-history";

type Props = {
  className?: string;
};

export default function QuizResumeCenter({ className = "" }: Props) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  const refreshData = useCallback(() => {
    const activeSession = loadQuizSession();
    // Only consider a session active if it has at least one answer
    if (activeSession && Object.keys(activeSession.answers).length > 0) {
      setSession(activeSession);
    } else {
      setSession(null);
    }
    setHistory(loadQuizHistory());
  }, []);

  useEffect(() => {
    refreshData();
    setMounted(true);
  }, [refreshData]);

  if (!mounted || (!session && history.length === 0)) return null;

  const handleRestart = () => {
    if (confirm("Restart your current quiz? Your progress in this session will be lost.")) {
      clearQuizSession();
      refreshData();
    }
  };

  const handleDeleteResult = (id: string) => {
    deleteQuizResult(id);
    refreshData();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Active Session Block */}
      {session && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <p className="text-xs font-mono text-amber-500 uppercase tracking-widest">In Progress</p>
              </div>
              <h3 className="text-lg font-semibold text-core-heading">Unfinished Analysis</h3>
              <p className="text-sm text-core-muted mt-1">
                You left off at question {session.pos + 1}. Continue to see your match.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-2 text-sm font-semibold text-white transition hover:bg-core-accent/90"
            >
              Continue Quiz
            </Link>
            <button
              onClick={handleRestart}
              className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/5 px-6 py-2 text-sm font-semibold text-core-muted transition hover:bg-white/10"
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {/* History Block */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-core-heading uppercase tracking-wider">Quiz History</h3>
          <div className="grid gap-3">
            {history.slice(0, 3).map((entry) => (
              <div 
                key={entry.id} 
                className="group flex items-center justify-between rounded-2xl border border-core-border bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{entry.topCareer.icon}</span>
                    <p className="text-sm font-semibold text-core-heading truncate">{entry.topCareer.title}</p>
                    <span className="text-[10px] font-mono text-core-accent bg-core-accent/10 px-2 py-0.5 rounded-full">
                      {entry.confidence}% Fit
                    </span>
                  </div>
                  <p className="text-[10px] text-core-muted mt-1 font-mono uppercase tracking-tighter">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/recommendation?results=${entry.topMatches.map(m => `${m.careerId}:${m.percentage}`).join(',')}`}
                    className="text-xs font-semibold text-core-accent hover:underline px-2 py-1"
                  >
                    Open Result
                  </Link>
                  <button
                    onClick={() => handleDeleteResult(entry.id)}
                    className="opacity-0 group-hover:opacity-100 text-core-muted hover:text-red-400 transition p-1"
                    aria-label="Delete result"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}