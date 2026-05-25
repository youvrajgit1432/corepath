/**
 * MARKET PULSE
 *
 * Estimate future career motion using existing career metadata.
 * No external APIs, no backend, no external AI.
 */

import { Career, careers, deriveBadges } from "./careers";

export type TrendDirection = "rising" | "stable" | "declining" | "exploding";

export interface MarketPulse {
  trendDirection: TrendDirection;
  futureDemandScore: number; // 0-100
  AITransformationLevel: string;
  replacementRisk: string;
  newAdjacentRoles: string[];
  futureSignals: string[];
  fiveYearOutlook: string;
}

const FUTURE_DEMAND_WEIGHT: Record<NonNullable<Career["futureDemand"]>, number> = {
  Exploding: 1,
  "High Growth": 0.85,
  Stable: 0.6,
  Declining: 0.35,
};

const AI_IMPACT_WEIGHT: Record<NonNullable<Career["aiImpact"]>, number> = {
  transformative: 1,
  high: 0.8,
  moderate: 0.55,
  low: 0.35,
};

const AI_RELATIONSHIP_RISK: Record<NonNullable<Career["aiRelationship"]>, number> = {
  "Automation-Heavy": 1,
  "AI-Created": 0.8,
  "AI-Assisted": 0.6,
  "AI-Augmented": 0.4,
  "Human-Centered": 0.2,
};

function deriveTrendDirection(career: Career): TrendDirection {
  if (career.futureDemand === "Exploding") return "exploding";
  if (career.futureDemand === "High Growth") return "rising";
  if (career.futureDemand === "Stable") return "stable";
  if (career.futureDemand === "Declining") return "declining";

  const aiImpact = career.aiImpact ?? "moderate";
  return aiImpact === "transformative" || aiImpact === "high" ? "rising" : "stable";
}

function deriveFutureDemandScore(career: Career): number {
  const demand = career.futureDemand ? FUTURE_DEMAND_WEIGHT[career.futureDemand] : 0.6;
  const impact = career.aiImpact ? AI_IMPACT_WEIGHT[career.aiImpact] : 0.55;
  const relationship = career.aiRelationship ? AI_RELATIONSHIP_RISK[career.aiRelationship] : 0.6;

  const raw = demand * 0.5 + impact * 0.35 + (1 - relationship) * 0.15;
  return Math.round(raw * 100);
}

function deriveAITransformationLevel(career: Career): string {
  const impact = career.aiImpact ?? "moderate";
  if (impact === "transformative") return "AI is reshaping the role at a systems level.";
  if (impact === "high") return "AI will significantly change how this work is done.";
  if (impact === "moderate") return "AI will augment the role without fully replacing it.";
  return "AI influence is more incremental than disruptive here.";
}

function deriveReplacementRisk(career: Career): string {
  const relationship = career.aiRelationship;
  if (relationship === "Automation-Heavy") {
    return "Higher risk: routine tasks are likely to automate, so focus on strategic skills.";
  }

  if (relationship === "AI-Created") {
    return "Moderate risk: the role may evolve into new AI-native work rather than disappear.";
  }

  if (relationship === "AI-Assisted") {
    return "Moderate-to-low risk: AI helps your work, but human judgment remains important.";
  }

  if (relationship === "AI-Augmented") {
    return "Lower risk: this career is strengthened by AI tools rather than replaced.";
  }

  return "Lower risk: this work is likely to remain grounded in human expertise.";
}

function deriveAdjacentRoles(career: Career): string[] {
  const related = new Set<string>();

  if (career.relatedCareerIds?.length) {
    career.relatedCareerIds.forEach((id) => {
      const relatedCareer = careers.find((item) => item.id === id);
      if (relatedCareer && relatedCareer.title !== career.title) {
        related.add(relatedCareer.title);
      }
    });
  }

  if (related.size < 3) {
    const tags = new Set((career.tags || []).map((tag) => tag.toLowerCase()));
    const pool = careers.filter((item) => item.id !== career.id && item.category === career.category);
    pool.forEach((item) => {
      if (related.size >= 3) return;
      const itemTags = new Set((item.tags || []).map((tag) => tag.toLowerCase()));
      const shared = [...tags].filter((tag) => itemTags.has(tag));
      if (shared.length > 0 && (item.futureDemand === "Exploding" || item.futureDemand === "High Growth")) {
        related.add(item.title);
      }
    });
  }

  return Array.from(related).slice(0, 3);
}

function deriveFutureSignals(career: Career): string[] {
  const signals: string[] = [];

  const badges = deriveBadges(career);
  badges.forEach((badge) => signals.push(`${badge} signal`));

  if (career.futureDemand) {
    signals.push(`${career.futureDemand} outlook`);
  }

  if (career.aiImpact) {
    signals.push(`${career.aiImpact} AI impact`);
  }

  if (career.aiRelationship) {
    signals.push(`${career.aiRelationship} relationship to AI`);
  }

  if ((career.tags || []).length > 0) {
    signals.push(`Rooted in ${career.tags.slice(0, 3).join(", ")}`);
  }

  return signals;
}

function deriveFiveYearOutlook(career: Career): string {
  const trend = career.futureDemand;
  if (trend === "Exploding") {
    return "This career is likely to be in strong demand over the next five years as AI-native systems expand.";
  }
  if (trend === "High Growth") {
    return "This role should remain important, with new opportunities emerging as AI adoption grows.";
  }
  if (trend === "Stable") {
    return "This career should hold steady, especially if you keep your AI and niche skills sharp.";
  }
  if (trend === "Declining") {
    return "Demand may soften unless the role shifts toward higher-level or AI-complementary work.";
  }

  const aiRisk = career.aiImpact === "low" ? "The role is less exposed to AI disruption." : "AI is changing this role, so focus on adaptability.";
  return `Maintain strong cross-functional skills. ${aiRisk}`;
}

export function buildMarketPulse(career: Career): MarketPulse {
  return {
    trendDirection: deriveTrendDirection(career),
    futureDemandScore: deriveFutureDemandScore(career),
    AITransformationLevel: deriveAITransformationLevel(career),
    replacementRisk: deriveReplacementRisk(career),
    newAdjacentRoles: deriveAdjacentRoles(career),
    futureSignals: deriveFutureSignals(career),
    fiveYearOutlook: deriveFiveYearOutlook(career),
  };
}
