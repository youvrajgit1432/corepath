/**
 * Journey Timeline
 *
 * Visible persistent memory that synthesizes timeline events from:
 * - journey-memory (quiz completions, career views, comparisons)
 * - career-workspace (workspace started, roadmap milestones)
 * - Explicitly recorded events (resume analysis, etc.)
 *
 * Groups events into Today / Last week / Earlier for display.
 * Uses SafeStorage with in-memory fallback.
 *
 * Storage key: "corepath-journey-timeline"
 * Max events: 100 (newest first)
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { getCareerById as getCareerFromCareers } from "./careers";
import { loadCareerWorkspace } from "./career-workspace";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | "quiz_completed"
  | "career_viewed"
  | "comparison_created"
  | "workspace_started"
  | "roadmap_milestone"
  | "resume_analysis";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  description?: string;
  icon?: string;
  metadata?: Record<string, string | number>;
  actionHref?: string;
  actionLabel?: string;
  eventTarget?: "_self" | "_blank";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "corepath-journey-timeline";
const MAX_EVENTS = 100;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStorage() {
  return getSafeStorage({ silent: true });
}

function generateId(): string {
  return `tl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Resolve a career ID to a display title */
function careerTitle(id: string): string {
  const career = getCareerFromCareers(id);
  return career?.title ?? id;
}

/** Build an action href and label for a given event type and metadata */
function buildActionData(
  type: TimelineEventType,
  metadata?: Record<string, string | number>,
  workspaceCareerId?: string
): { actionHref: string; actionLabel: string } | null {
  switch (type) {
    case "career_viewed": {
      const cid = metadata?.careerId;
      if (cid) return { actionHref: `/careers/${cid}`, actionLabel: "Open career" };
      return null;
    }
    case "comparison_created": {
      const a = metadata?.careerA;
      const b = metadata?.careerB;
      if (a && b) return { actionHref: `/careers/compare?careerA=${encodeURIComponent(String(a))}&careerB=${encodeURIComponent(String(b))}`, actionLabel: "View comparison" };
      return null;
    }
    case "quiz_completed":
      return { actionHref: "/quiz", actionLabel: "View results" };
    case "workspace_started": {
      const wcId = metadata?.careerId ?? workspaceCareerId;
      if (wcId) return { actionHref: `/careers/${wcId}`, actionLabel: "Open workspace" };
      return null;
    }
    case "roadmap_milestone": {
      if (workspaceCareerId) return { actionHref: `/careers/${workspaceCareerId}`, actionLabel: "View roadmap" };
      return null;
    }
    case "resume_analysis":
      return { actionHref: "/insights", actionLabel: "View analysis" };
    default:
      return null;
  }
}

// ─── Cache for buildTimeline ────────────────────────────────────────────

let buildCache: { result: TimelineEvent[]; memoryTimestamp: number; workspaceTimestamp: number } | null = null;

function invalidateBuildCache(): void {
  buildCache = null;
}

/** Load only explicitly stored events from SafeStorage */
function loadStoredEvents(): TimelineEvent[] {
  const storage = getStorage();
  const stored = storage.get<TimelineEvent[]>(STORAGE_KEY);
  if (Array.isArray(stored)) {
    return stored.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
  return [];
}

/** Normalize a date ISO string to date-only precision (YYYY-MM-DD) for dedup */
function normalizeToDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

/**
 * Record a new timeline event explicitly.
 * Stores directly to SafeStorage, newest first, capped at MAX_EVENTS.
 * Invalidates the build cache on mutation.
 */
export function recordTimelineEvent(
  event: Omit<TimelineEvent, "id">
): TimelineEvent {
  const storage = getStorage();
  const events = loadStoredEvents();

  // Dedup: prevent duplicate stored events with identical type+metadata within 1 hour
  const dedupWindow = Date.now() - 60 * 60 * 1000;
  const isDuplicate = events.some(
    (e) =>
      e.type === event.type &&
      JSON.stringify(e.metadata) === JSON.stringify(event.metadata) &&
      new Date(e.timestamp).getTime() > dedupWindow
  );
  if (isDuplicate) {
    return events[0];
  }

  // Auto-populate action data if not provided
  const actionData = event.actionHref
    ? null
    : buildActionData(event.type, event.metadata);

  const newEvent: TimelineEvent = {
    ...event,
    ...(actionData ?? {}),
    id: generateId(),
  };

  const updated = [newEvent, ...events].slice(0, MAX_EVENTS);
  storage.set(STORAGE_KEY, updated);
  invalidateBuildCache();
  return newEvent;
}

/**
 * Build the full timeline by merging stored events with synthetic events
 * derived from journey-memory and career-workspace data.
 * Deduplicates by event ID. Returns newest first, capped at MAX_EVENTS.
 * Results are cached and invalidated when events are recorded.
 */
export function buildTimeline(): TimelineEvent[] {
  const memory = loadJourneyMemory();
  const memoryTimestamp = new Date(memory.updatedAt).getTime();
  const workspace = loadCareerWorkspace();
  const workspaceTimestamp = workspace ? new Date(workspace.updatedAt).getTime() : 0;

  // Return cache if neither memory nor workspace has changed
  if (buildCache && buildCache.memoryTimestamp === memoryTimestamp && buildCache.workspaceTimestamp === workspaceTimestamp) {
    return buildCache.result;
  }

  const storedEvents = loadStoredEvents();
  const storedIds = new Set(storedEvents.map((e) => e.id));

  const syntheticEvents: TimelineEvent[] = [];

  // ── From journey-memory ──────────────────────────────────────────────

  // Quiz completions — deduplicate by date (only one per day to prevent repeats)
  const seenQuizDates = new Set<string>();
  for (const date of memory.quizDates) {
    const dateKey = normalizeToDate(date);
    if (seenQuizDates.has(dateKey)) continue;
    seenQuizDates.add(dateKey);

    const synthId = `quiz_${dateKey}`;
    if (!storedIds.has(synthId)) {
      syntheticEvents.push({
        id: synthId,
        type: "quiz_completed",
        timestamp: date,
        title: "Completed career quiz",
        description: `Session #${memory.completedQuizzes}`,
        icon: "📝",
        ...buildActionData("quiz_completed")!,
      });
    }
  }

  // Career views (deduplicated — one entry per career, show most recent)
  const seenViewCareers = new Set<string>();
  for (const entry of [...memory.viewedCareerHistory].reverse()) {
    if (seenViewCareers.has(entry.careerId)) continue;
    seenViewCareers.add(entry.careerId);

    const synthId = `view_${entry.careerId}_${entry.timestamp}`;
    if (!storedIds.has(synthId)) {
      const title = careerTitle(entry.careerId);
      const metadata = { careerId: entry.careerId };
      syntheticEvents.push({
        id: synthId,
        type: "career_viewed",
        timestamp: entry.timestamp,
        title: `Viewed career: ${title}`,
        icon: "👁️",
        metadata,
        ...buildActionData("career_viewed", metadata)!,
      });
    }
  }

  // Comparisons — deduplicate by order-independent pair per day
  const seenComparisonPairs = new Set<string>();
  for (const entry of memory.comparisonHistory) {
    // Normalize pair order (A < B alphabetically)
    const [normA, normB] =
      entry.careerA < entry.careerB
        ? [entry.careerA, entry.careerB]
        : [entry.careerB, entry.careerA];
    const pairDay = normalizeToDate(entry.timestamp);
    const pairKey = `${pairDay}|${normA}|${normB}`;
    if (seenComparisonPairs.has(pairKey)) continue;
    seenComparisonPairs.add(pairKey);

    const synthId = `compare_${pairKey}`;
    if (!storedIds.has(synthId)) {
      const titleA = careerTitle(entry.careerA);
      const titleB = careerTitle(entry.careerB);
      const metadata = { careerA: entry.careerA, careerB: entry.careerB };
      syntheticEvents.push({
        id: synthId,
        type: "comparison_created",
        timestamp: entry.timestamp,
        title: "Compared careers",
        description: `${titleA} vs ${titleB}`,
        icon: "⚖️",
        metadata,
        ...buildActionData("comparison_created", metadata)!,
      });
    }
  }

  // ── From career-workspace ────────────────────────────────────────────
  const wsCareerId = workspace?.selectedCareerId;

  if (workspace) {
    // Workspace started
    const wsId = `workspace_${workspace.selectedCareerId}`;
    if (!storedIds.has(wsId)) {
      const metadata = { careerId: workspace.selectedCareerId };
      syntheticEvents.push({
        id: wsId,
        type: "workspace_started",
        timestamp: workspace.createdAt,
        title: `Started workspace for ${workspace.selectedCareerTitle}`,
        icon: "🚀",
        description: "Began tracking career progress",
        metadata,
        ...buildActionData("workspace_started", metadata)!,
      });
    }

    // Roadmap milestones from weekly progress (temporal, pruned after 30d in workspace)
    for (const entry of workspace.weeklyProgress) {
      if (entry.type === "milestone") {
        const synthId = `milestone_${entry.date}_${entry.action}`;
        if (!storedIds.has(synthId)) {
          syntheticEvents.push({
            id: synthId,
            type: "roadmap_milestone",
            timestamp: entry.date,
            title: entry.action,
            icon: "⭐",
            description: "Roadmap milestone completed",
            ...buildActionData("roadmap_milestone", undefined, wsCareerId)!,
          });
        }
      }
    }

    // Additional: create events from completedMilestones (never pruned) for long-term
    // persistence. Uses workspace.updatedAt as approximate date.
    const seenMilestones = new Set(
      syntheticEvents
        .filter((e) => e.type === "roadmap_milestone")
        .map((e) => e.title)
    );
    for (const milestone of workspace.completedMilestones) {
      if (seenMilestones.has(milestone)) continue;
      const synthId = `milestone_persist_${milestone.replace(/[\s:]+/g, "_")}`;
      if (!storedIds.has(synthId)) {
        syntheticEvents.push({
          id: synthId,
          type: "roadmap_milestone",
          timestamp: workspace.updatedAt,
          title: milestone,
          icon: "⭐",
          description: "Persistent milestone record",
          ...buildActionData("roadmap_milestone", undefined, wsCareerId)!,
        });
      }
    }
  }

  // ── Merge, dedupe by ID, sort, cap ───────────────────────────────────
  const all = [...storedEvents, ...syntheticEvents];
  const seenIds = new Set<string>();
  const deduped = all.filter((event) => {
    if (seenIds.has(event.id)) return false;
    seenIds.add(event.id);
    // Ensure stored events (e.g. from before this update) have action data
    if (!event.actionHref && event.type !== "resume_analysis") {
      const actionData = buildActionData(event.type, event.metadata, wsCareerId);
      if (actionData) {
        event.actionHref = actionData.actionHref;
        event.actionLabel = actionData.actionLabel;
      }
    }
    return true;
  });
  const result = deduped
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, MAX_EVENTS);

  // Save cache
  buildCache = { result, memoryTimestamp, workspaceTimestamp };
  return result;
}

/**
 * Group events by time period for display.
 */
export interface TimelineGroups {
  today: TimelineEvent[];
  lastWeek: TimelineEvent[];
  earlier: TimelineEvent[];
}

export function groupTimelineByPeriod(events: TimelineEvent[]): TimelineGroups {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: TimelineGroups = { today: [], lastWeek: [], earlier: [] };

  for (const event of events) {
    const eventDate = new Date(event.timestamp);
    if (eventDate >= todayStart) {
      groups.today.push(event);
    } else if (eventDate >= weekAgo) {
      groups.lastWeek.push(event);
    } else {
      groups.earlier.push(event);
    }
  }

  return groups;
}

/**
 * Get the total number of timeline events.
 */
export function getTimelineCount(): number {
  return buildTimeline().length;
}

/**
 * Delete a stored timeline event by id.
 * Only affects explicitly stored events (not synthetic events).
 */
export function deleteTimelineEvent(id: string): boolean {
  const storage = getStorage();
  const events = loadStoredEvents();
  const filtered = events.filter((e) => e.id !== id);

  if (filtered.length === events.length) return false;
  storage.set(STORAGE_KEY, filtered);
  return true;
}

/**
 * Clear all explicitly stored timeline events.
 * Synthetic events from journey-memory / workspace will still appear on next build.
 */
export function clearTimeline(): void {
  const storage = getStorage();
  storage.remove(STORAGE_KEY);
}

/**
 * Get a human-readable label for an event type.
 */
export function getEventTypeLabel(type: TimelineEventType): string {
  const labels: Record<TimelineEventType, string> = {
    quiz_completed: "Quiz",
    career_viewed: "Career View",
    comparison_created: "Comparison",
    workspace_started: "Workspace",
    roadmap_milestone: "Milestone",
    resume_analysis: "Analysis",
  };
  return labels[type];
}

/**
 * Format a timestamp as a relative time string (e.g., "2h ago", "3d ago").
 * Falls back to short date for older events.
 */
export function formatRelativeTime(iso: string): string {
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
