import { getSafeStorage } from "./safe-storage";

export interface ComparisonRecord {
  id: string;
  careerA: string;
  careerB: string;
  timestamp: string;
  recommendationSummary: string;
  winnerCareer?: string;
  comparisonSignals: string[];
}

const STORAGE_KEY = "corepath-comparison-history";
const MAX_HISTORY = 20;

function getStorage() {
  return getSafeStorage({ silent: true });
}

export function loadComparisonHistory(): ComparisonRecord[] {
  try {
    const data = getStorage().get<ComparisonRecord[]>(STORAGE_KEY);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveComparison(record: Omit<ComparisonRecord, "id" | "timestamp">) {
  const history = loadComparisonHistory();
  
  // Prevent duplicates of the same pair (regardless of order)
  const filtered = history.filter(item => 
    !((item.careerA === record.careerA && item.careerB === record.careerB) ||
      (item.careerA === record.careerB && item.careerB === record.careerA))
  );

  const newRecord: ComparisonRecord = {
    ...record,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    timestamp: new Date().toISOString(),
  };

  const nextHistory = [newRecord, ...filtered].slice(0, MAX_HISTORY);
  getStorage().set(STORAGE_KEY, nextHistory);
}

export function deleteComparison(id: string) {
  const history = loadComparisonHistory();
  const nextHistory = history.filter(item => item.id !== id);
  getStorage().set(STORAGE_KEY, nextHistory);
}

export function clearComparisonHistory() {
  getStorage().set(STORAGE_KEY, []);
}