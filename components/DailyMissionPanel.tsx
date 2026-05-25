/**
 * DAILY MISSION PANEL
 *
 * Displays personalized daily missions with XP rewards, difficulty badges,
 * complete button, and next-refresh countdown.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getDailyMissions,
  completeMission,
  isMissionCompleted,
  getNextResetMs,
  type DailyMissionSet,
  type Mission,
} from "../data/daily-missions";

// ============================================================================
// MISSION CARD
// ============================================================================

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  hard: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const CATEGORY_ICONS: Record<string, string> = {
  quiz: "📝",
  explore: "🔍",
  compare: "⚖️",
  workspace: "🎯",
  roadmap: "🧭",
  skill: "📚",
  review: "👁️",
  streak: "🔥",
};

function MissionCard({
  mission,
  completed,
  onComplete,
}: {
  mission: Mission;
  completed: boolean;
  onComplete: (id: string) => void;
}) {
  const diffColor = DIFFICULTY_COLORS[mission.difficulty] ?? DIFFICULTY_COLORS.medium;
  const icon = CATEGORY_ICONS[mission.category] ?? "✨";

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        completed
          ? "border-green-500/30 bg-green-500/5 opacity-75"
          : "border-core-border bg-core-bg/60 hover:border-core-accent/30 hover:bg-core-bg/80"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-sm font-semibold ${
                completed ? "text-green-400 line-through" : "text-core-heading"
              }`}
            >
              {mission.title}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wide ${diffColor}`}
            >
              {mission.difficulty}
            </span>
          </div>

          <p className="text-xs text-core-muted mt-1 leading-relaxed">
            {mission.description}
          </p>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-[11px] text-core-accent font-medium">
              +{mission.rewardXP} XP
            </span>
            <span className="text-[11px] text-core-muted">
              ~{mission.estimatedMinutes} min
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {completed ? (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400">
              ✓
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onComplete(mission.id)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-core-border text-core-muted hover:border-core-accent hover:text-core-accent hover:bg-core-accent/10 transition-all"
              title="Complete mission"
            >
              ○
            </button>
          )}
        </div>
      </div>

      {!completed && mission.actionHref && (
        <div className="mt-3 ml-9">
          <Link
            href={mission.actionHref}
            className="inline-flex items-center text-xs text-core-accent hover:underline gap-1"
          >
            Go to action →
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COUNTDOWN
// ============================================================================

function CountdownTimer({ onExpire }: { onExpire: () => void }) {
  const [msLeft, setMsLeft] = useState(getNextResetMs);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getNextResetMs();
      setMsLeft(remaining);
      if (remaining <= 1000) {
        onExpire();
      }
    }, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [onExpire]);

  const hours = Math.floor(msLeft / (1000 * 60 * 60));
  const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <span className="text-xs text-core-muted">
      Next missions in {hours}h {minutes}m
    </span>
  );
}

// ============================================================================
// MAIN PANEL
// ============================================================================

interface Props {
  className?: string;
}

export default function DailyMissionPanel({ className = "" }: Props) {
  const [missions, setMissions] = useState<DailyMissionSet | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    setMissions(getDailyMissions());
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleComplete = useCallback(
    (missionId: string) => {
      const updated = completeMission(missionId);
      if (updated) setMissions(updated);
    },
    []
  );

  const handleExpire = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (!missions) return null;

  const completedCount = missions.completedMissionIds.length;
  const totalCount =
    3 + (missions.streakMission ? 1 : 0); // today + easy + stretch + streak

  const allDone = completedCount >= totalCount;

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Daily Missions
          </p>
          <h3 className="mt-1 text-lg font-semibold text-core-heading">
            Today&apos;s challenges
          </h3>
        </div>
        <CountdownTimer onExpire={handleExpire} />
      </div>

      {/* Progress indicator */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-core-muted">
            {completedCount}/{totalCount} completed
          </span>
          {allDone && (
            <span className="text-xs font-semibold text-green-400">
              All done! 🎉
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-core-border overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-core-accent to-green-500 transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Mission list */}
      <div className="space-y-3">
        {/* Today's mission (featured) */}
        <div className="relative">
          {missions.completedMissionIds.includes(missions.todayMission.id) ? null : (
            <span className="absolute -top-1.5 -left-1.5 z-10 inline-flex px-1.5 py-0.5 rounded-full bg-core-accent text-[9px] font-bold text-white uppercase tracking-wider">
              Main
            </span>
          )}
          <MissionCard
            mission={missions.todayMission}
            completed={missions.completedMissionIds.includes(missions.todayMission.id)}
            onComplete={handleComplete}
          />
        </div>

        <MissionCard
          mission={missions.easyMission}
          completed={missions.completedMissionIds.includes(missions.easyMission.id)}
          onComplete={handleComplete}
        />

        <MissionCard
          mission={missions.stretchMission}
          completed={missions.completedMissionIds.includes(missions.stretchMission.id)}
          onComplete={handleComplete}
        />

        {missions.streakMission && (
          <MissionCard
            mission={missions.streakMission}
            completed={missions.completedMissionIds.includes(missions.streakMission.id)}
            onComplete={handleComplete}
          />
        )}
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="mt-5 p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-center">
          <p className="text-sm font-semibold text-green-400">
            All missions complete! 🏆
          </p>
          <p className="text-xs text-core-muted mt-1">
            Come back tomorrow for new challenges.
          </p>
        </div>
      )}
    </section>
  );
}
