/**
 * Career Matching Engine using Cosine Similarity
 * Integrated with updated careers.ts and quiz.ts
 */

import { careers, Career } from "./careers";
import { TraitScores, calculateCosineSimilarity } from "./quiz";
import { buildRecommendationExplanation, RecommendationExplanation } from "./recommendation-explanations";
import { compareCareers as buildCareerComparison } from "./career-comparison";

export interface CareerMatch {
  career: Career;
  score: number;
  similarity: number;
  reasons: string[];
  skills: string[];
  explanation: RecommendationExplanation;
}

export interface RecommendationResult {
  topMatches: CareerMatch[];
  userTraits: TraitScores;
  timestamp: number;
}

// Build career trait profiles from quiz_traits
function buildCareerTraitProfile(career: Career): TraitScores {
  const profile: TraitScores = {
    analytical: 0,
    creativity: 0,
    "technical-depth": 0,
    leadership: 0,
    social: 0,
    structure: 0,
    "risk-tolerance": 0,
    visual: 0,
  };

  for (const rawTrait of career.quiz_traits ?? []) {
    if (rawTrait in profile) {
      // @ts-ignore - index by dynamic key
      profile[rawTrait as keyof TraitScores] += 1;
    }
  }

  const total = Object.values(profile).reduce((s, v) => s + v, 0);
  if (total === 0) return profile;

  return {
    analytical: profile.analytical / total,
    creativity: profile.creativity / total,
    "technical-depth": profile["technical-depth"] / total,
    leadership: profile.leadership / total,
    social: profile.social / total,
    structure: profile.structure / total,
    "risk-tolerance": profile["risk-tolerance"] / total,
    visual: profile.visual / total,
  };
}

export function getCareerRecommendations(
  userTraits: TraitScores,
  topN: number = 5
): RecommendationResult {
  const ranked = careers
    .map((career) => {
      const careerTraitProfile = buildCareerTraitProfile(career);
      const similarity = calculateCosineSimilarity(userTraits, careerTraitProfile);
      
      // Generate match reasons
      const reasons = generateMatchReasons(userTraits, career, similarity);
      
      // Get supporting skills
      const skills = career.supportingSkills || career.tags || [];
      
      return {
        career,
        score: similarity * 100,
        similarity,
        reasons,
        skills: Array.isArray(skills) ? skills.slice(0, 4) : [],
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  const matches: CareerMatch[] = ranked.map((match, index) => {
    const alternate = ranked[index + 1];
    const scoreDelta = alternate ? match.score - alternate.score : undefined;
    return {
      ...match,
      explanation: buildRecommendationExplanation(userTraits, match.career, alternate?.career, scoreDelta),
    };
  });

  return {
    topMatches: matches,
    userTraits,
    timestamp: Date.now(),
  };
}

function generateMatchReasons(
  userTraits: TraitScores,
  career: Career,
  similarity: number
): string[] {
  const reasons: string[] = [];
  
  // Analyze top user traits
  const sortedTraits = Object.entries(userTraits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  for (const [trait, score] of sortedTraits) {
    if (score > 0.5) {
      const traitName = trait.replace("-", " ");
      reasons.push(`Your strong ${traitName} aligns with this role`);
    }
  }

  // Add career-specific insights
  if (career.aiImpactNote) {
    reasons.push(career.aiImpactNote);
  }

  if (career.difficulty === "high") {
    reasons.push("Great challenge and career growth potential");
  }

  if (career.demand === "high") {
    reasons.push("High market demand and job security");
  }

  return reasons.slice(0, 3);
}

export function searchCareers(query: string): Career[] {
  const searchQuery = query.toLowerCase();
  
  return careers.filter(
    (career) =>
      career.title.toLowerCase().includes(searchQuery) ||
      career.category.toLowerCase().includes(searchQuery) ||
      career.coreSkill.toLowerCase().includes(searchQuery) ||
      career.tags?.some((tag) => tag.toLowerCase().includes(searchQuery))
  );
}

export function getCareersByDomain(domain: string): Career[] {
  return careers.filter(
    (career) => career.domain?.toLowerCase() === domain.toLowerCase()
  );
}

export function getCareerById(id: string): Career | undefined {
  return careers.find((career) => career.id === id);
}

export function getCareersByDifficulty(difficulty: string): Career[] {
  return careers.filter((career) => career.difficulty === difficulty);
}

export function getCareersByDemand(demand: string): Career[] {
  return careers.filter((career) => career.demand === demand);
}

export interface CareerComparison {
  career1: Career;
  career2: Career;
  similarities: string[];
  differences: {
    career1: string[];
    career2: string[];
  };
  thinkingStyleFit: string;
  workStyleDifferences: string[];
  aiEraDifferences: string[];
  learningDifficulty: string;
  longTermLeverageComparison: string;
  futureDemandComparison: string;
  careerEvolutionDifferences: string[];
  recommendationSummary: string;
}

export function compareCarees(id1: string, id2: string): CareerComparison | null {
  const career1 = getCareerById(id1);
  const career2 = getCareerById(id2);
  
  if (!career1 || !career2) return null;

  const comparison = buildCareerComparison(career1, career2);

  return {
    career1,
    career2,
    similarities: comparison.similarities,
    differences: {
      career1: comparison.differences.careerA,
      career2: comparison.differences.careerB,
    },
    thinkingStyleFit: comparison.thinkingStyleFit,
    workStyleDifferences: comparison.workStyleDifferences,
    aiEraDifferences: comparison.aiEraDifferences,
    learningDifficulty: comparison.learningDifficulty,
    longTermLeverageComparison: comparison.longTermLeverageComparison,
    futureDemandComparison: comparison.futureDemandComparison,
    careerEvolutionDifferences: comparison.careerEvolutionDifferences,
    recommendationSummary: comparison.recommendationSummary,
  };
}

export function getCareerPath(startCareer: string, endCareer: string): Career[] {
  const start = getCareerById(startCareer);
  const end = getCareerById(endCareer);
  
  if (!start || !end) return [];

  // Simple heuristic: find intermediate careers by domain/skill
  const path: Career[] = [start];
  
  // Find careers in between by similarity
  const intermediate = careers
    .filter((c) => c.id !== start.id && c.id !== end.id)
    .map((c) => ({
      career: c,
      score: 
        (c.domain === start.domain ? 0.5 : 0) +
        (c.domain === end.domain ? 0.5 : 0),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((c) => c.career);

  path.push(...intermediate);
  path.push(end);

  return path;
}

export function getCareersWithSkill(skill: string): Career[] {
  return careers.filter((career) =>
    (career.supportingSkills || career.tags || []).some((s) =>
      s.toLowerCase().includes(skill.toLowerCase())
    )
  );
}

export function getAvailableDomains(): string[] {
  const domains = new Set(
    careers
      .map((c) => c.domain)
      .filter((d) => d !== undefined) as string[]
  );
  return Array.from(domains).sort();
}

export function getAvailableSkills(): string[] {
  const skills = new Set<string>();
  careers.forEach((career) => {
    (career.supportingSkills || career.tags || []).forEach((skill) => {
      skills.add(skill);
    });
  });
  return Array.from(skills).sort();
}

// Use `Career` and `CareerMatch` types from imported modules; no local duplicates.
