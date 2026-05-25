import type { Career } from "./careers";
import { careers, getCareerById } from "./careers";
import { getProjectsForCareer } from "./project-recommendations";
import type { JourneyMemory } from "./journey-memory";
import type { AnalyticsEvent } from "./analytics-events";

export interface CommunitySignals {
  popularCareers: string[];
  trendingProjects: string[];
  commonCareerSwitches: string[];
  frequentSkillGaps: string[];
  emergingInterests: string[];
}

interface CommunitySignalsOptions {
  career?: Career;
  journeyMemory?: JourneyMemory;
  events?: AnalyticsEvent[];
}

function getTopCareerIdsFromJourney(journeyMemory?: JourneyMemory, events?: AnalyticsEvent[]): string[] {
  const counts = new Map<string, number>();

  const add = (careerId: string, weight = 1) => {
    if (!careerId) return;
    counts.set(careerId, (counts.get(careerId) ?? 0) + weight);
  };

  if (journeyMemory?.viewedCareers) {
    Object.entries(journeyMemory.viewedCareers).forEach(([careerId, count]) => {
      add(careerId, count * 2);
    });
  }

  if (journeyMemory?.recommendedCareers) {
    Object.entries(journeyMemory.recommendedCareers).forEach(([careerId, count]) => {
      add(careerId, count);
    });
  }

  events?.forEach((event) => {
    if (event.type === "career_viewed" && event.metadata?.careerId) {
      add(event.metadata.careerId as string, 2);
    }
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([careerId]) => careerId);
}

function buildPopularCareers(options: CommunitySignalsOptions): string[] {
  const ids = getTopCareerIdsFromJourney(options.journeyMemory, options.events);
  const seeded = ids
    .map((id) => getCareerById(id))
    .filter((career): career is Career => Boolean(career));

  if (seeded.length > 0) {
    return seeded.slice(0, 5).map((career) => `${career.title}`);
  }

  const fallback = careers
    .filter((career) => career.futureDemand === "Exploding" || career.aiImpact === "transformative")
    .slice(0, 5)
    .map((career) => career.title);

  return fallback.length > 0 ? fallback : careers.slice(0, 5).map((career) => career.title);
}

function buildTrendingProjects(options: CommunitySignalsOptions): string[] {
  const topIds = getTopCareerIdsFromJourney(options.journeyMemory, options.events).slice(0, 3);
  const topCareers = topIds
    .map((id) => getCareerById(id))
    .filter((career): career is Career => Boolean(career));

  if (topCareers.length === 0 && options.career) {
    topCareers.push(options.career);
  }

  if (topCareers.length === 0) {
    topCareers.push(...careers.slice(0, 2));
  }

  const projectNames = new Set<string>();
  topCareers.forEach((career) => {
    const recommendations = getProjectsForCareer(career, undefined, undefined, options.journeyMemory);
    recommendations.beginnerProjects.slice(0, 2).forEach((project) => {
      projectNames.add(`${project.title} — ${career.title}`);
    });
    recommendations.intermediateProjects.slice(0, 1).forEach((project) => {
      projectNames.add(`${project.title} — ${career.title}`);
    });
  });

  return Array.from(projectNames).slice(0, 5);
}

function buildCommonCareerSwitches(options: CommunitySignalsOptions): string[] {
  const viewedCareerIds = new Set<string>();
  const careerOrder: string[] = [];

  options.events?.forEach((event) => {
    if (event.type === "career_viewed" && event.metadata?.careerId) {
      const careerId = event.metadata.careerId as string;
      if (!viewedCareerIds.has(careerId)) {
        viewedCareerIds.add(careerId);
        careerOrder.push(careerId);
      }
    }
  });

  if (careerOrder.length >= 2) {
    const switches = careerOrder.slice(0, 5).map((careerId, index, list) => {
      const next = list[index + 1];
      if (!next) return null;
      const current = getCareerById(careerId);
      const nextCareer = getCareerById(next);
      if (!current || !nextCareer) return null;
      return `From ${current.title} into ${nextCareer.title}`;
    });
    return switches.filter(Boolean) as string[];
  }

  const categories = options.journeyMemory
    ? Object.entries(options.journeyMemory.favoriteCategories || {})
        .sort((a, b) => b[1] - a[1])
        .map(([category]) => category)
    : [];

  if (categories.length >= 2) {
    return [`Many learners switch from ${categories[0]} roles into ${categories[1]} work.`];
  }

  return [
    "Learners often move from pure engineering roles into AI-enabled product and systems roles.",
    "A common transition is from developer work into cloud / deployment-focused careers.",
  ];
}

function buildFrequentSkillGaps(options: CommunitySignalsOptions): string[] {
  const gaps = new Set<string>([
    "Not enough deployed portfolio work.",
    "Skipping documentation and project storytelling.",
    "Missing AI exposure in early projects.",
    "Focusing on tools instead of core domain skills.",
    "Underestimating how much systems thinking matters.",
  ]);

  if (options.career) {
    if (options.career.tags?.some((tag) => /data|ml|ai/i.test(tag))) {
      gaps.add("Data and model validation are frequently overlooked.");
    }
    if (options.career.tags?.some((tag) => /devops|cloud|infra|platform/i.test(tag))) {
      gaps.add("Cloud deployment and monitoring are common gaps.");
    }
    if (options.career.tags?.some((tag) => /design|ux|product/i.test(tag))) {
      gaps.add("Research, usability, and handoff are often underdeveloped.");
    }
  }

  return Array.from(gaps).slice(0, 5);
}

function buildEmergingInterests(options: CommunitySignalsOptions): string[] {
  const interests: string[] = [];

  if (options.journeyMemory) {
    const sortedThemes = Object.entries(options.journeyMemory.repeatedThemes || {})
      .sort((a, b) => b[1] - a[1])
      .filter(([, value]) => value > 0)
      .map(([theme]) => theme);

    sortedThemes.slice(0, 3).forEach((theme) => {
      interests.push(`Growing interest in ${theme} work`);
    });
  }

  if (options.events) {
    const aiViews = options.events.filter(
      (event) => event.type === "career_viewed" && event.metadata?.careerTags?.includes("AI")
    );
    if (aiViews.length > 2) {
      interests.push("Rising interest in AI-native roles.");
    }
  }

  if (interests.length === 0) {
    interests.push("Student interest is shifting toward systems, AI, and product-adjacent careers.");
  }

  return interests.slice(0, 5);
}

export function buildCommunitySignals(options: CommunitySignalsOptions = {}): CommunitySignals {
  return {
    popularCareers: buildPopularCareers(options),
    trendingProjects: buildTrendingProjects(options),
    commonCareerSwitches: buildCommonCareerSwitches(options),
    frequentSkillGaps: buildFrequentSkillGaps(options),
    emergingInterests: buildEmergingInterests(options),
  };
}
