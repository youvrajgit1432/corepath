/**
 * ACHIEVEMENT PANEL
 *
 * Displays the player's XP, level, unlocked achievements,
 * next goal, and active streak bonus.
 */

"use client";

import { useEffect, useState } from "react";
import {
  computeAchievements,
  loadAchievements,
  levelProgressPercentage,
  xpToNextLevel,
  type AchievementState,
} from "../data/achievement-engine";

interface Props {
  className?: string;
}

export default function AchievementPanel({ className = "" }: Props) {
  const [state, setState] = useState<AchievementState | null>(null);

  useEffect(() => {
    // Try cache first, recompute if stale
    const cached = loadAchievements();
    if (cached) {
      setState(cached);
      return;
    }
    const fresh = computeAchievements();
    setState(fresh);
  }, []);

  if (!state) {
    return null;
  }

  const progressPct = levelProgressPercentage(state);
  const xpNeeded = xpToNextLevel(state);

  const recentAchievements = state.unlockedAchievements.slice(-4).reverse();
  const hasUnlocked = state.unlockedAchievements.length > 0;

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Skill XP</p>
          <h3 className="mt-1 text-xl font-display text-core-heading">Achievements</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-core-accent/10 px-4 py-2">
          <span className="text-lg">🏅</span>
          <span className="text-sm font-bold text-core-accent">Lv.{state.level}</span>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-core-muted">
            {state.xp} XP
          </span>
          <span className="text-xs text-core-accent">
            {xpNeeded > 0 ? `${xpNeeded} XP to next level` : "Max level"}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-core-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>

      {/* Streak Bonus */}
      {state.activeStreakBonus > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-xs font-semibold text-amber-400">Streak bonus active</p>
            <p className="text-xs text-core-muted">+{state.activeStreakBonus} XP from streak rewards</p>
          </div>
        </div>
      )}

      {/* Recent Unlocked Achievements */}
      {hasUnlocked && (
        <div className="mb-4">
          <p className="text-xs text-core-muted mb-2">
            Unlocked ({state.unlockedAchievements.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {recentAchievements.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-1.5 rounded-full bg-core-accent/10 px-3 py-1.5 text-xs text-core-heading"
                title={a.description}
              >
                <span>{a.icon}</span>
                <span>{a.title}</span>
              </div>
            ))}
            {state.unlockedAchievements.length > 4 && (
              <div className="flex items-center rounded-full bg-core-border/50 px-3 py-1.5 text-xs text-core-muted">
                +{state.unlockedAchievements.length - 4} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Goal */}
      {state.nextUnlock ? (
        <div className="rounded-lg bg-core-bg/50 border border-core-border/40 p-3.5">
          <p className="text-xs text-core-muted mb-1">Next achievement</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">{state.nextUnlock.icon}</span>
            <div>
              <p className="text-sm font-semibold text-core-heading">{state.nextUnlock.title}</p>
              <p className="text-xs text-core-muted">{state.nextUnlock.description}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-core-bg/50 border border-core-border/40 p-3.5">
          <p className="text-xs text-core-muted">
            🎉 All achievements unlocked! Explore new careers and complete milestones to keep earning XP.
          </p>
        </div>
      )}

      {/* All locked achievements preview */}
      {state.lockedAchievements.length > 1 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs text-core-muted hover:text-core-heading transition-colors">
            {state.lockedAchievements.length - 1} more achievements to discover
          </summary>
          <div className="mt-2 space-y-1.5">
            {state.lockedAchievements.slice(1).map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 opacity-60">
                <span className="text-base">{a.icon}</span>
                <div>
                  <p className="text-xs text-core-muted">{a.title}</p>
                  <p className="text-[11px] text-core-muted/60">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
