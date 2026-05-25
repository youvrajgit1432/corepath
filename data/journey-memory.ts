const STORAGE_KEY = "corepath-journey-memory";

import { getSafeStorage } from "./safe-storage";

export type JourneyTheme =
  | "systems"
  | "ai"
  | "research"
  | "product"
  | "design"
  | "data"
  | "ops"
  | "governance"
  | "infrastructure";

export interface JourneyMemory {
  createdAt: string;
  updatedAt: string;
  completedQuizzes: number;
  quizDates: string[];
  confidenceHistory: number[];
  specializationDepthHistory: number[];
  recommendedCareers: Record<string, number>;
  viewedCareers: Record<string, number>;
  comparedCareerPairs: Record<string, number>;
  comparisonHistory: Array<{ careerA: string; careerB: string; timestamp: string }>;
  viewedCareerHistory: Array<{ careerId: string; timestamp: string }>;
  roadmapInteractions: Record<string, { view: number; start: number; complete: number }>;
  favoriteCategories: Record<string, number>;
  aiInterestSignals: {
    careerViews: number;
    compareActions: number;
    recommendations: number;
  };
  uncertaintyPatterns: {
    retakes: number;
    lowConfidenceMatches: number;
    repeatQuizSessions: number;
  };
  repeatedThemes: Record<JourneyTheme, number>;
  lastRecommendedCareer?: string;
}

export type JourneyEvent =
  | {
      type: "quizCompleted";
      careerId: string;
      careerCategory: string;
      careerTags: string[];
      confidence: number;
      specializationDepth: number;
      aiInterest: boolean;
      timestamp?: string;
    }
  | {
      type: "careerViewed";
      careerId: string;
      careerCategory: string;
      careerTags: string[];
      hasRoadmap: boolean;
      timestamp?: string;
    }
  | {
      type: "careerCompared";
      careerA: string;
      careerB: string;
      categoryA?: string;
      categoryB?: string;
      tagsA?: string[];
      tagsB?: string[];
      aiRelated?: boolean;
      timestamp?: string;
    }
  | {
      type: "roadmapInteraction";
      careerId: string;
      interaction: "view" | "start" | "complete";
      timestamp?: string;
    };

export interface JourneyProfile {
  sessions: number;
  careerInterestProfile: string[];
  evolvingSpecializationSignals: string[];
  confidenceTrends: string[];
  curiosityPatterns: string[];
  recommendationAdjustments: string[];
  recentChanges: string[];
  topThemes: string[];
  favoriteCategories: string[];
}

const INITIAL_MEMORY: JourneyMemory = {
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedQuizzes: 0,
  quizDates: [],
  confidenceHistory: [],
  specializationDepthHistory: [],
  recommendedCareers: {},
  viewedCareers: {},
  comparedCareerPairs: {},
  comparisonHistory: [],
  viewedCareerHistory: [],
  roadmapInteractions: {},
  favoriteCategories: {},
  aiInterestSignals: {
    careerViews: 0,
    compareActions: 0,
    recommendations: 0,
  },
  uncertaintyPatterns: {
    retakes: 0,
    lowConfidenceMatches: 0,
    repeatQuizSessions: 0,
  },
  repeatedThemes: {
    systems: 0,
    ai: 0,
    research: 0,
    product: 0,
    design: 0,
    data: 0,
    ops: 0,
    governance: 0,
    infrastructure: 0,
  },
};

function getStorage() {
  return getSafeStorage({ silent: true });
}

function mergeWithDefaults(stored: JourneyMemory): JourneyMemory {
  return {
    ...INITIAL_MEMORY,
    ...stored,
    repeatedThemes: {
      ...INITIAL_MEMORY.repeatedThemes,
      ...(stored.repeatedThemes ?? {}),
    },
    comparisonHistory: stored.comparisonHistory ?? [],
    viewedCareerHistory: stored.viewedCareerHistory ?? [],
  };
}

export function loadJourneyMemory(): JourneyMemory {
  const storage = getStorage();
  // SafeStorage.get already JSON.parses the stored value, so we get the object directly
  const stored = storage.get<JourneyMemory>(STORAGE_KEY);
  if (stored) {
    return mergeWithDefaults(stored);
  }

  // Set initial memory on first load or after corruption
  storage.set(STORAGE_KEY, INITIAL_MEMORY);
  return INITIAL_MEMORY;
}

function persistJourneyMemory(memory: JourneyMemory) {
  const storage = getStorage();
  const next = { ...memory, updatedAt: new Date().toISOString() };
  storage.set(STORAGE_KEY, next);
}

// ================
// PRUNING LIMITS
// ================
const MAX_VIEWED_CAREERS = 50;
const MAX_COMPARED_PAIRS = 30;
const MAX_COMPARISON_HISTORY = 30;
const MAX_VIEWED_HISTORY = 50;
const MAX_QUIZ_DATES = 100;
const MAX_CONFIDENCE_HISTORY = 100;
const MAX_SPECIALIZATION_DEPTH_HISTORY = 100;
const MAX_RECOMMENDED_CAREERS = 50;
const MAX_FAVORITE_CATEGORIES = 30;
const MAX_ROADMAP_INTERACTIONS = 50;

/** Keep the most recent N keys in a record by sorting by count */
function pruneRecord(record: Record<string, number>, maxKeys: number): Record<string, number> {
  const entries = Object.entries(record);
  if (entries.length <= maxKeys) return record;
  const kept = entries.sort((a, b) => b[1] - a[1]).slice(0, maxKeys);
  return Object.fromEntries(kept);
}

/** Keep the most recent N items in an array */
function pruneArray<T>(arr: T[], maxLength: number): T[] {
  if (arr.length <= maxLength) return arr;
  return arr.slice(arr.length - maxLength);
}

/** Keep top N roadmap interactions by total count */
function pruneRoadmapInteractions(
  interactions: Record<string, { view: number; start: number; complete: number }>,
  maxKeys: number
): Record<string, { view: number; start: number; complete: number }> {
  const entries = Object.entries(interactions);
  if (entries.length <= maxKeys) return interactions;
  const kept = entries
    .sort((a, b) => {
      const totalA = a[1].view + a[1].start + a[1].complete;
      const totalB = b[1].view + b[1].start + b[1].complete;
      return totalB - totalA;
    })
    .slice(0, maxKeys);
  return Object.fromEntries(kept);
}

/** Apply all pruning limits to memory to prevent QuotaExceededError */
function applyPruning(memory: JourneyMemory): JourneyMemory {
  return {
    ...memory,
    viewedCareers: pruneRecord(memory.viewedCareers, MAX_VIEWED_CAREERS),
    comparedCareerPairs: pruneRecord(memory.comparedCareerPairs, MAX_COMPARED_PAIRS),
    recommendedCareers: pruneRecord(memory.recommendedCareers, MAX_RECOMMENDED_CAREERS),
    favoriteCategories: pruneRecord(memory.favoriteCategories, MAX_FAVORITE_CATEGORIES),
    roadmapInteractions: pruneRoadmapInteractions(memory.roadmapInteractions, MAX_ROADMAP_INTERACTIONS),
    comparisonHistory: pruneArray(memory.comparisonHistory, MAX_COMPARISON_HISTORY),
    viewedCareerHistory: pruneArray(memory.viewedCareerHistory, MAX_VIEWED_HISTORY),
    quizDates: pruneArray(memory.quizDates, MAX_QUIZ_DATES),
    confidenceHistory: pruneArray(memory.confidenceHistory, MAX_CONFIDENCE_HISTORY),
    specializationDepthHistory: pruneArray(memory.specializationDepthHistory, MAX_SPECIALIZATION_DEPTH_HISTORY),
  };
}

function incrementBucket(record: Record<string, number>, key: string, value = 1) {
  record[key] = (record[key] ?? 0) + value;
}

function themesFromCareer(category: string, tags: string[]): JourneyTheme[] {
  const themes = new Set<JourneyTheme>();
  const full = `${category} ${tags.join(" ")}`.toLowerCase();

  if (/(system|architecture|infrastructure|ops|platform|scalability)/.test(full)) themes.add("systems");
  if (/(ai|ml|machine learning|large language model|llm|data science|synthetic)/.test(full)) themes.add("ai");
  if (/(research|scientist|audit|ethic|policy|evaluation)/.test(full)) themes.add("research");
  if (/(product|strategy|product manager|experience)/.test(full)) themes.add("product");
  if (/(design|ux|ui|visual|creative)/.test(full)) themes.add("design");
  if (/(data|warehouse|pipeline|analytics|database|sql|etl)/.test(full)) themes.add("data");
  if (/(ops|devops|sre|production|reliability)/.test(full)) themes.add("ops");
  if (/(policy|governance|ethics|compliance)/.test(full)) themes.add("governance");
  if (/(cloud|infrastructure|platform|systems)/.test(full)) themes.add("infrastructure");

  if (themes.size === 0) {
    themes.add("product");
  }

  return Array.from(themes);
}

function buildThemeHistory(memory: JourneyMemory, category: string, tags: string[]) {
  for (const theme of themesFromCareer(category, tags)) {
    incrementBucket(memory.repeatedThemes, theme);
  }
}

export function recordJourneyEvent(event: JourneyEvent): JourneyMemory {
  const memory = loadJourneyMemory();
  const next = { ...memory };

  switch (event.type) {
    case "quizCompleted": {
      next.completedQuizzes += 1;
      next.quizDates = [...next.quizDates, event.timestamp ?? new Date().toISOString()];
      next.confidenceHistory = [...next.confidenceHistory, event.confidence];
      next.specializationDepthHistory = [...next.specializationDepthHistory, event.specializationDepth];
      incrementBucket(next.recommendedCareers, event.careerId);
      incrementBucket(next.favoriteCategories, event.careerCategory);
      buildThemeHistory(next, event.careerCategory, event.careerTags);
      if (event.aiInterest) next.aiInterestSignals.recommendations += 1;
      if (next.completedQuizzes > 1) {
        next.uncertaintyPatterns.repeatQuizSessions += 1;
      }
      if (event.confidence < 50) {
        next.uncertaintyPatterns.lowConfidenceMatches += 1;
      }
      if (next.lastRecommendedCareer && next.lastRecommendedCareer !== event.careerId) {
        next.uncertaintyPatterns.retakes += 1;
      }
      next.lastRecommendedCareer = event.careerId;
      break;
    }
    case "careerViewed": {
      incrementBucket(next.viewedCareers, event.careerId);
      next.viewedCareerHistory = [...next.viewedCareerHistory, {
        careerId: event.careerId,
        timestamp: event.timestamp ?? new Date().toISOString(),
      }];
      incrementBucket(next.favoriteCategories, event.careerCategory);
      buildThemeHistory(next, event.careerCategory, event.careerTags);
      if (event.hasRoadmap) {
        const current = next.roadmapInteractions[event.careerId] ?? { view: 0, start: 0, complete: 0 };
        next.roadmapInteractions[event.careerId] = { ...current, view: current.view + 1 };
      }
      if (/(ai|ml|machine learning|llm|synthetic|data)/i.test(`${event.careerCategory} ${event.careerTags.join(" ")}`)) {
        next.aiInterestSignals.careerViews += 1;
      }
      break;
    }
    case "careerCompared": {
      const key = `${event.careerA}|${event.careerB}`;
      incrementBucket(next.comparedCareerPairs, key);

      // Dedupe: if same pair (order-independent) exists within the last hour, update timestamp instead of appending
      const existingIdx = next.comparisonHistory.findIndex((e) => {
        const samePair =
          (e.careerA === event.careerA && e.careerB === event.careerB) ||
          (e.careerA === event.careerB && e.careerB === event.careerA);
        const withinWindow =
          new Date(event.timestamp ?? new Date()).getTime() - new Date(e.timestamp).getTime() <
          60 * 60 * 1000; // 1 hour
        return samePair && withinWindow;
      });

      if (existingIdx !== -1) {
        next.comparisonHistory[existingIdx] = {
          ...next.comparisonHistory[existingIdx],
          timestamp: event.timestamp ?? new Date().toISOString(),
        };
      } else {
        next.comparisonHistory = [...next.comparisonHistory, {
          careerA: event.careerA,
          careerB: event.careerB,
          timestamp: event.timestamp ?? new Date().toISOString(),
        }];
      }
      if (event.categoryA) incrementBucket(next.favoriteCategories, event.categoryA);
      if (event.categoryB) incrementBucket(next.favoriteCategories, event.categoryB);
      if (event.tagsA) buildThemeHistory(next, event.categoryA ?? "", event.tagsA);
      if (event.tagsB) buildThemeHistory(next, event.categoryB ?? "", event.tagsB);
      if (event.aiRelated) next.aiInterestSignals.compareActions += 1;
      break;
    }
    case "roadmapInteraction": {
      const current = next.roadmapInteractions[event.careerId] ?? { view: 0, start: 0, complete: 0 };
      next.roadmapInteractions[event.careerId] = {
        ...current,
        [event.interaction]: current[event.interaction] + 1,
      };
      break;
    }
    default:
      break;
  }

  // Apply pruning before persisting to prevent storage bloat
  const pruned = applyPruning(next);
  persistJourneyMemory(pruned);
  return pruned;
}

function topKeys(record: Record<string, number>, limit = 3): string[] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function normalizeTrend(history: number[]) {
  if (history.length < 2) return 0;
  return history[history.length - 1] - history[0];
}

export function buildJourneyProfile(memory: JourneyMemory): JourneyProfile {
  const sessions = memory.completedQuizzes;
  const topThemes = topKeys(memory.repeatedThemes, 3);
  const topCategories = topKeys(memory.favoriteCategories, 3);
  const topRecommendation = topKeys(memory.recommendedCareers, 1)[0];
  const confidenceTrend = normalizeTrend(memory.confidenceHistory);
  const specializationTrend = normalizeTrend(memory.specializationDepthHistory);
  const averageConfidence = memory.confidenceHistory.length
    ? Math.round(memory.confidenceHistory.reduce((sum, value) => sum + value, 0) / memory.confidenceHistory.length)
    : 0;

  const careerInterestProfile: string[] = [];
  if (topThemes.includes("systems") && topThemes.includes("infrastructure")) {
    careerInterestProfile.push("We noticed repeated interest in systems and infrastructure.");
  }
  if (topThemes.includes("ai")) {
    careerInterestProfile.push("Your journey shows a growing pull toward AI-enabled roles.");
  }
  if (topThemes.includes("research")) {
    careerInterestProfile.push("You keep exploring research-oriented and analytical work.");
  }
  if (topCategories.length > 0) {
    careerInterestProfile.push(`You frequently review careers in ${topCategories.join(" and ")} where you can apply your strongest thinking style.`);
  }

  const evolvingSpecializationSignals: string[] = [];
  if (specializationTrend > 0.08) {
    evolvingSpecializationSignals.push("Your profile is trending toward deeper specialization over multiple sessions.");
  } else if (specializationTrend < -0.08) {
    evolvingSpecializationSignals.push("Your interests are staying broad, so we keep recommending exploratory paths.");
  } else {
    evolvingSpecializationSignals.push("Your journey suggests balanced exploration with a gradual specialization signal.");
  }

  const confidenceTrends: string[] = [];
  if (confidenceTrend > 5) {
    confidenceTrends.push("Confidence is increasing across sessions.");
  } else if (confidenceTrend < -5) {
    confidenceTrends.push("Your confidence is more cautious than earlier sessions.");
  } else {
    confidenceTrends.push("Your confidence remains steady while we learn more about your strengths.");
  }
  if (averageConfidence > 60) {
    confidenceTrends.push("You’re approaching a clear decision profile.");
  }

  const curiosityPatterns: string[] = [];
  if (memory.aiInterestSignals.careerViews + memory.aiInterestSignals.compareActions + memory.aiInterestSignals.recommendations > 2) {
    curiosityPatterns.push("Your exploration suggests growing interest in AI-enabled engineering.");
  }
  if (memory.uncertaintyPatterns.lowConfidenceMatches > 0) {
    curiosityPatterns.push("You are experimenting with different fits, so we keep guidance adaptive.");
  }
  if (topThemes.includes("product") || topThemes.includes("design")) {
    curiosityPatterns.push("Your pattern also shows curiosity for product and experience-driven careers.");
  }

  const recommendationAdjustments: string[] = [];
  if (topRecommendation) {
    recommendationAdjustments.push(`Recommendations still favor ${topRecommendation} based on your repeated interests.`);
  }
  if (memory.uncertaintyPatterns.retakes > 0) {
    recommendationAdjustments.push("We’re adjusting suggested paths to reduce uncertainty in your next session.");
  }
  if (topCategories.length > 0) {
    recommendationAdjustments.push(`We’re centering on ${topCategories.join(" and ")} as your strongest exploration zones.`);
  }

  const recentChanges: string[] = [];
  if (sessions > 1) {
    recentChanges.push(`Compared with earlier sessions, your profile is ${specializationTrend > 0.08 ? "more specialized" : specializationTrend < -0.08 ? "broader" : "steadier"}.`);
    if (topThemes.includes("research")) {
      recentChanges.push("You’re increasingly favoring research-oriented work.");
    }
    if (memory.aiInterestSignals.recommendations > 0) {
      recentChanges.push("You’ve shown more interest in AI-specific roles over time.");
    }
  }

  return {
    sessions,
    careerInterestProfile: careerInterestProfile.length ? careerInterestProfile : ["Your journey is building a more personalized career interest profile."] ,
    evolvingSpecializationSignals,
    confidenceTrends,
    curiosityPatterns: curiosityPatterns.length ? curiosityPatterns : ["We’re watching how your career curiosity evolves across sessions."] ,
    recommendationAdjustments,
    recentChanges,
    topThemes,
    favoriteCategories: topCategories,
  };
}

/**
 * Remove a single entry from viewedCareerHistory by careerId.
 * Returns true if an entry was removed.
 */
export function removeViewedCareer(careerId: string): boolean {
  const memory = loadJourneyMemory();
  const filtered = memory.viewedCareerHistory.filter((e) => e.careerId !== careerId);
  if (filtered.length === memory.viewedCareerHistory.length) return false;
  const next = { ...memory, viewedCareerHistory: filtered };
  // Also decrement the count in viewedCareers
  const current = next.viewedCareers[careerId];
  if (current && current > 0) {
    next.viewedCareers = { ...next.viewedCareers };
    delete next.viewedCareers[careerId];
  }
  persistJourneyMemory(next);
  return true;
}

/** Clear all journey memory data for privacy */
export function clearJourneyMemory(): void {
  const storage = getStorage();
  storage.remove(STORAGE_KEY);
}
