/**
 * Lightweight, privacy-first event tracking for CorePath.
 * Events stored locally; no external analytics service.
 * Used to understand user behavior and recommendation quality.
 */

import { getSafeStorage, getSessionSafeStorage } from "./safe-storage";
import { sanitizeAnalyticsMetadata } from "./sanitize";

export type EventType =
  | "quiz_started"
  | "quiz_completed"
  | "quiz_retaken"
  | "quiz_dropoff"
  | "career_viewed"
  | "career_category_viewed"
  | "comparison_opened"
  | "comparison_initiated"
  | "roadmap_viewed"
  | "roadmap_interacted"
  | "recommendation_clicked"
  | "recommendation_viewed"
  | "recommendation_feedback"
  | "insight_page_opened"
  | "filter_applied"
  | "onboarding_opened"
  | "onboarding_choice_selected"
  | "journey_progress_viewed"
  | "session_started"
  | "session_ended";

export interface AnalyticsEvent {
  type: EventType;
  timestamp: number;
  sessionId: string;
  path?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationFeedback {
  helpful: boolean;
  reason?: "inaccurate" | "too_broad" | "confusing" | "not_interested" | "exploring";
  careerId?: string;
  timestamp: number;
}

const SESSION_ID_KEY = "corepath_session_id";
const EVENTS_KEY = "corepath_events";
const FEEDBACK_KEY = "corepath_feedback";
const SESSION_START_KEY = "corepath_session_start";
const SESSION_STARTED_KEY = "corepath_session_started";

function getLocalStore() {
  return getSafeStorage({ silent: true });
}

function getSessionStore() {
  return getSessionSafeStorage({ silent: true });
}

function getOrCreateSessionId(): string {
  const store = getSessionStore();
  let sessionId = store.get<string>(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    store.set(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

function getSessionStartTime(): number {
  const store = getSessionStore();
  let startTime = store.get<string>(SESSION_START_KEY);
  if (!startTime) {
    startTime = Date.now().toString();
    store.set(SESSION_START_KEY, startTime);
  }
  return parseInt(startTime);
}

function getStoredEvents(): AnalyticsEvent[] {
  const store = getLocalStore();
  const stored = store.get<AnalyticsEvent[]>(EVENTS_KEY);
  return stored ?? [];
}

function getStoredFeedback(): RecommendationFeedback[] {
  const store = getLocalStore();
  const stored = store.get<RecommendationFeedback[]>(FEEDBACK_KEY);
  return stored ?? [];
}

function saveEvents(events: AnalyticsEvent[]): void {
  // Keep only last 300 events to avoid localStorage bloat
  const trimmed = events.slice(-300);
  getLocalStore().set(EVENTS_KEY, trimmed);
}

function saveFeedback(feedback: RecommendationFeedback[]): void {
  getLocalStore().set(FEEDBACK_KEY, feedback);
}

export function logEvent(type: EventType, metadata?: Record<string, any>): void {
  const safeMetadata = metadata ? sanitizeAnalyticsMetadata(metadata) : undefined;

  const event: AnalyticsEvent = {
    type,
    timestamp: Date.now(),
    sessionId: getOrCreateSessionId(),
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    metadata: safeMetadata,
  };

  const events = getStoredEvents();
  events.push(event);
  saveEvents(events);
}

export function startAnalyticsSession(): void {
  if (typeof window === "undefined") return;

  getSessionStartTime();
  getOrCreateSessionId();

  const store = getSessionStore();
  if (store.get(SESSION_STARTED_KEY)) return;

  store.set(SESSION_STARTED_KEY, "true");
  logEvent("session_started", {
    referrer: document.referrer || undefined,
    entryPath: window.location.pathname,
  });
}

export function endAnalyticsSession(metadata?: Record<string, any>): void {
  logEvent("session_ended", {
    durationMs: getSessionDuration(),
    ...metadata,
  });
}

export function logRecommendationFeedback(
  helpful: boolean,
  reason?: string,
  metadata?: Record<string, any>
): void {
  const feedback: RecommendationFeedback = {
    helpful,
    reason: reason as any,
    careerId: metadata?.careerId,
    timestamp: Date.now(),
  };

  const allFeedback = getStoredFeedback();
  allFeedback.push(feedback);
  saveFeedback(allFeedback);

  // Also log as event for journey tracking
  logEvent("recommendation_feedback", { helpful, reason, ...metadata });
}

export function getSessionId(): string {
  return getOrCreateSessionId();
}

export function getSessionDuration(): number {
  return Date.now() - getSessionStartTime();
}

export function getEventsInSession(sessionId?: string): AnalyticsEvent[] {
  const events = getStoredEvents();
  const targetSessionId = sessionId || getOrCreateSessionId();
  return events.filter((e) => e.sessionId === targetSessionId);
}

export function getRecentFeedback(limit = 20): RecommendationFeedback[] {
  const feedback = getStoredFeedback();
  return feedback.slice(-limit);
}

export function getAllEvents(limit = 100): AnalyticsEvent[] {
  const events = getStoredEvents();
  return events.slice(-limit);
}

export function clearAnalyticsData(): void {
  const local = getLocalStore();
  const session = getSessionStore();
  local.remove(EVENTS_KEY);
  local.remove(FEEDBACK_KEY);
  session.remove(SESSION_ID_KEY);
  session.remove(SESSION_START_KEY);
  session.remove(SESSION_STARTED_KEY);
}

export function getEventStats() {
  const sessionId = getOrCreateSessionId();
  const events = getEventsInSession(sessionId);
  const feedback = getRecentFeedback(100);

  return {
    sessionId,
    sessionDuration: getSessionDuration(),
    totalEvents: events.length,
    eventBreakdown: Object.fromEntries(
      Array.from(
        new Set(events.map((e) => e.type)),
        (type) => [type, events.filter((e) => e.type === type).length]
      )
    ),
    totalFeedback: feedback.length,
    helpfulCount: feedback.filter((f) => f.helpful).length,
    unhelpfulCount: feedback.filter((f) => !f.helpful).length,
    feedbackReasons: Object.fromEntries(
      Array.from(
        new Set(feedback.filter((f) => f.reason).map((f) => f.reason!)),
        (reason) => [reason, feedback.filter((f) => f.reason === reason).length]
      )
    ),
  };
}
