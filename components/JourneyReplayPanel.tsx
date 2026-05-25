"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  getJourneyReplay,
  formatRelativeTime,
  formatItemDate,
  type JourneyReplayItem,
  type JourneyReplayItemType,
} from "../data/journey-replay";

interface Props {
  className?: string;
}

const ICON_BG: Record<JourneyReplayItemType, string> = {
  "first-quiz": "bg-indigo-500/20 text-indigo-400",
  "quiz-milestone": "bg-blue-500/20 text-blue-400",
  "career-first-viewed": "bg-emerald-500/20 text-emerald-400",
  "comparison-turning-point": "bg-amber-500/20 text-amber-400",
  "achievement-unlocked": "bg-purple-500/20 text-purple-400",
  "workspace-milestone": "bg-cyan-500/20 text-cyan-400",
  "streak-milestone": "bg-orange-500/20 text-orange-400",
  "identity-shift": "bg-pink-500/20 text-pink-400",
  "specialization-change": "bg-teal-500/20 text-teal-400",
};

const TYPE_LABEL: Record<JourneyReplayItemType, string> = {
  "first-quiz": "Quiz",
  "quiz-milestone": "Milestone",
  "career-first-viewed": "Exploration",
  "comparison-turning-point": "Comparison",
  "achievement-unlocked": "Achievement",
  "workspace-milestone": "Progress",
  "streak-milestone": "Streak",
  "identity-shift": "Identity",
  "specialization-change": "Growth",
};

export default function JourneyReplayPanel({ className = "" }: Props) {
  const [data, setData] = useState<{ items: JourneyReplayItem[] } | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const load = useCallback(() => {
    const replay = getJourneyReplay();
    setData({ items: replay.items });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Cleanup replay timer on unmount
  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    };
  }, []);

  const handleReplay = () => {
    if (!data || data.items.length === 0) return;
    if (replaying) {
      // Stop replay
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
      setReplaying(false);
      setCurrentStep(-1);
      return;
    }

    setReplaying(true);
    setCurrentStep(0);

    // Auto-step through items
    const step = (index: number) => {
      if (index >= data.items.length) {
        setReplaying(false);
        setCurrentStep(-1);
        return;
      }

      setCurrentStep(index);

      // Scroll to current item
      const item = data.items[index];
      const el = itemRefs.current.get(item.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      replayTimerRef.current = setTimeout(() => {
        step(index + 1);
      }, 2000);
    };

    step(0);
  };

  if (!data || data.items.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-core-border bg-core-surface p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Journey replay
          </p>
          <h2 className="mt-1 text-lg font-semibold text-core-heading">
            Your career timeline
          </h2>
          <p className="mt-0.5 text-sm text-core-muted">
            {data.items.length} events since you started
          </p>
        </div>

        <button
          type="button"
          onClick={handleReplay}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
            replaying
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "bg-core-accent text-white hover:bg-indigo-500"
          }`}
        >
          {replaying ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              Stop replay
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Replay journey
            </>
          )}
        </button>
      </div>

      {/* Timeline */}
      <ol className="relative border-l border-core-border/60 ml-3 space-y-0">
        {data.items.map((item, index) => {
          const isActive = currentStep === index;
          const isPast = currentStep > index;

          return (
            <li
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
              }}
              className={`relative pl-8 pb-6 last:pb-0 transition-all duration-500 ${
                isActive ? "opacity-100 scale-[1.02]" : isPast ? "opacity-80" : "opacity-70 hover:opacity-90"
              }`}
            >
              {/* Timeline dot */}
              <span
                className={`absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all duration-500 ${
                  ICON_BG[item.type]
                } ${isActive ? "ring-2 ring-core-accent ring-offset-2 ring-offset-core-surface scale-110" : ""}`}
              >
                {item.icon}
              </span>

              {/* Content */}
              <div
                className={`rounded-xl border p-3 transition-all duration-500 ${
                  isActive
                    ? "border-core-accent/40 bg-core-accent/5 shadow-soft"
                    : "border-core-border bg-core-bg/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-core-muted/70">
                        {TYPE_LABEL[item.type]}
                      </span>
                      <span className="text-[11px] text-core-muted/50">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-core-heading leading-snug">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-core-muted leading-relaxed">
                      {item.description}
                    </p>
                    <p className="mt-0.5 text-[10px] text-core-muted/40">
                      {formatItemDate(item.timestamp)}
                    </p>
                  </div>

                  {/* View Details action */}
                  {item.href && (
                    <Link
                      href={item.href}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                        isActive
                          ? "bg-core-accent text-white hover:bg-indigo-500"
                          : "border border-core-border text-core-muted hover:border-core-accent hover:text-core-accent"
                      }`}
                    >
                      {item.label ?? "View"}
                    </Link>
                  )}
                </div>
              </div>

              {/* Active indicator pulse */}
              {isActive && (
                <span className="absolute -left-[17px] top-1 h-8 w-8 rounded-full bg-core-accent/20 animate-ping" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Empty state */}
      {data.items.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-core-muted">
            Complete a quiz or explore careers to start building your timeline.
          </p>
          <Link
            href="/quiz"
            className="mt-3 inline-block rounded-full bg-core-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
          >
            Take your first quiz
          </Link>
        </div>
      )}
    </section>
  );
}
