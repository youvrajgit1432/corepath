import { getSafeStorage } from "./safe-storage";

export interface QuizSession {
  sequence: number[];
  pos: number;
  answers: Record<string, string>;
  timestamp: string;
}

const STORAGE_KEY = "corepath_quiz_session";

function getStorage() {
  return getSafeStorage({ silent: true });
}

export function saveQuizSession(session: QuizSession) {
  try {
    getStorage().set(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    // storage failure ignored
  }
}

export function loadQuizSession(): QuizSession | null {
  try {
    const data = getStorage().get<string>(STORAGE_KEY);
    if (!data || data === "") return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearQuizSession() {
  try {
    // Setting to empty string as SafeStorage wrapper typically handles this via set
    getStorage().set(STORAGE_KEY, "");
  } catch {
    // failure ignored
  }
}