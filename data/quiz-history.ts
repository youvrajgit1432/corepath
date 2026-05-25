/**
 * Quiz History
 *
 * Persists completed quiz results locally so users can revisit past results.
 * Uses SafeStorage with in-memory fallback, following the journey-memory pattern.
 *
 * Storage key: "corepath-quiz-history"
 * Max entries: 20 (newest first, oldest evicted)
 */

import { getSafeStorage } from "./safe-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuizHistoryEntry {
  id: string;
  timestamp: string;
  topCareer: {
    id: string;
    title: string;
    icon?: string;
    category: string;
    coreSkill: string;
  };
  topMatches: Array<{
    careerId: string;
    title: string;
    percentage: number;
  }>;
  confidence: number;
  specializationDepth: number;
  strengthProfile: Record<string, number>;
  enhancedProfileSummary: {
    narrative: string[];
    recommendations: string[];
    topTraits: Array<{ trait: string; value: number }>;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "corepath-quiz-history";
const MAX_ENTRIES = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStorage() {
  return getSafeStorage({ silent: true });
}

function generateId(): string {
  return `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Save a completed quiz result. Persists to SafeStorage. */
export function saveQuizResult(entry: Omit<QuizHistoryEntry, "id" | "timestamp">): QuizHistoryEntry {
  const storage = getStorage();
  const history = loadQuizHistoryRaw();

  const newEntry: QuizHistoryEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  // Prepend newest first, cap at MAX_ENTRIES
  const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
  storage.set(STORAGE_KEY, updated);
  return newEntry;
}

/** Load all saved quiz results, newest first. Returns empty array if none. */
export function loadQuizHistory(): QuizHistoryEntry[] {
  return loadQuizHistoryRaw();
}

/** Internal: load raw history from storage */
function loadQuizHistoryRaw(): QuizHistoryEntry[] {
  const storage = getStorage();
  const stored = storage.get<QuizHistoryEntry[]>(STORAGE_KEY);
  if (Array.isArray(stored) && stored.length > 0) {
    // Sort newest first as a safety net
    return stored.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
  return [];
}

/** Delete a single quiz result by id. Returns true if deleted. */
export function deleteQuizResult(id: string): boolean {
  const storage = getStorage();
  const history = loadQuizHistoryRaw();
  const filtered = history.filter((entry) => entry.id !== id);

  if (filtered.length === history.length) {
    return false; // nothing removed
  }

  storage.set(STORAGE_KEY, filtered);
  return true;
}

/** Clear all quiz history. */
export function clearQuizHistory(): void {
  const storage = getStorage();
  storage.remove(STORAGE_KEY);
}

/** Get the total number of saved results (up to MAX_ENTRIES). */
export function getQuizHistoryCount(): number {
  return loadQuizHistoryRaw().length;
}
