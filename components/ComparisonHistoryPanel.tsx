"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCareerById } from "../data/careers";
import { loadComparisonHistory, deleteComparison, clearComparisonHistory, type ComparisonRecord } from "../data/comparison-history";

export default function ComparisonHistoryPanel({ className = "" }: { className?: string }) {
  const [history, setHistory] = useState<ComparisonRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHistory(loadComparisonHistory());
    setMounted(true);
  }, []);

  if (!mounted || history.length === 0) return null;

  const handleRemove = (id: string) => {
    deleteComparison(id);
    setHistory(loadComparisonHistory());
  };

  const handleClearAll = () => {
    if (confirm("Clear all comparison history?")) {
      clearComparisonHistory();
      setHistory([]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-core-heading">Comparison History</h3>
        <button 
          onClick={handleClearAll}
          className="text-[10px] uppercase tracking-wider text-core-muted hover:text-amber-400 transition"
        >
          Clear All
        </button>
      </div>

      <div className="grid gap-3">
        {history.map((item) => {
          const careerA = getCareerById(item.careerA);
          const careerB = getCareerById(item.careerB);
          const winner = item.winnerCareer ? getCareerById(item.winnerCareer) : null;

          return (
            <div 
              key={item.id} 
              className="group relative rounded-2xl border border-core-border bg-white/5 p-4 transition hover:border-core-accent/40 hover:bg-white/10"
            >
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100 text-core-muted hover:text-red-400"
                aria-label="Remove from history"
              >
                ×
              </button>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-core-muted">
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  {winner && (
                    <span className="text-emerald-400">Lean: {winner.title}</span>
                  )}
                </div>
                
                <p className="text-sm font-semibold text-core-heading">
                  {careerA?.title || item.careerA} vs {careerB?.title || item.careerB}
                </p>
                
                <p className="line-clamp-2 text-xs text-core-muted leading-relaxed">
                  {item.recommendationSummary}
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <Link
                    href={`/careers/compare?careerA=${item.careerA}&careerB=${item.careerB}`}
                    className="text-[11px] font-semibold uppercase tracking-wider text-core-accent hover:underline"
                  >
                    Revisit Comparison →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}