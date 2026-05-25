import { Career } from "./careers";
import type { ExtendedTraitScores, EnhancedProfile } from "./quiz-enhanced";

const EXTENDED_TRAITS: Array<keyof ExtendedTraitScores> = [
  "systems-thinking",
  "abstraction",
  "ambiguity-tolerance",
  "deep-work",
  "experimentation",
  "optimization",
  "execution-speed",
  "research-orientation",
  "people-orientation",
  "autonomy",
  "risk-tolerance",
  "stability-preference",
  "creativity",
  "technical-depth",
  "visual-thinking",
  "operational-thinking",
  "leadership",
  "adaptability",
  "learning-velocity",
  "future-orientation",
  "AI-curiosity",
  "AI-builder",
  "AI-user",
];

export interface CareerComparison {
  careerA: Career;
  careerB: Career;
  similarities: string[];
  differences: {
    careerA: string[];
    careerB: string[];
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

function zeroSignals(): ExtendedTraitScores {
  return EXTENDED_TRAITS.reduce((acc, trait) => {
    acc[trait] = 0;
    return acc;
  }, {} as ExtendedTraitScores);
}

function normalizeSignals(signals: ExtendedTraitScores): ExtendedTraitScores {
  const max = Math.max(...Object.values(signals), 1);
  return EXTENDED_TRAITS.reduce((acc, trait) => {
    acc[trait] = signals[trait] / max;
    return acc;
  }, {} as ExtendedTraitScores);
}

function addSignal(signals: ExtendedTraitScores, trait: keyof ExtendedTraitScores, value: number) {
  signals[trait] = (signals[trait] || 0) + value;
}

function buildCareerSignals(career: Career): ExtendedTraitScores {
  const signals = zeroSignals();
  const traits = career.quiz_traits ?? [];

  for (const trait of traits) {
    switch (trait) {
      case "analytical":
        addSignal(signals, "systems-thinking", 0.5);
        addSignal(signals, "abstraction", 0.5);
        addSignal(signals, "optimization", 0.25);
        break;
      case "technical-depth":
        addSignal(signals, "technical-depth", 1);
        addSignal(signals, "deep-work", 0.4);
        break;
      case "structure":
        addSignal(signals, "operational-thinking", 0.6);
        addSignal(signals, "deep-work", 0.4);
        addSignal(signals, "stability-preference", 0.2);
        break;
      case "creativity":
        addSignal(signals, "experimentation", 0.7);
        addSignal(signals, "AI-curiosity", 0.3);
        break;
      case "leadership":
        addSignal(signals, "leadership", 0.8);
        addSignal(signals, "autonomy", 0.4);
        break;
      case "social":
        addSignal(signals, "people-orientation", 0.8);
        addSignal(signals, "leadership", 0.2);
        break;
      case "visual":
        addSignal(signals, "visual-thinking", 0.9);
        addSignal(signals, "creativity", 0.3);
        break;
      case "risk-tolerance":
        addSignal(signals, "risk-tolerance", 0.8);
        addSignal(signals, "adaptability", 0.4);
        break;
      default:
        break;
    }
  }

  const tags = career.tags ?? [];
  for (const tag of tags) {
    const normalized = tag.toLowerCase();
    if (normalized.includes("api") || normalized.includes("architecture") || normalized.includes("systems")) {
      addSignal(signals, "systems-thinking", 0.3);
    }
    if (normalized.includes("automation") || normalized.includes("orchestration") || normalized.includes("devops") || normalized.includes("monitoring")) {
      addSignal(signals, "operational-thinking", 0.4);
    }
    if (normalized.includes("data") || normalized.includes("ml") || normalized.includes("model")) {
      addSignal(signals, "research-orientation", 0.3);
      addSignal(signals, "technical-depth", 0.2);
    }
    if (normalized.includes("ux") || normalized.includes("design") || normalized.includes("visual")) {
      addSignal(signals, "visual-thinking", 0.4);
      addSignal(signals, "creativity", 0.2);
    }
    if (normalized.includes("policy") || normalized.includes("governance")) {
      addSignal(signals, "future-orientation", 0.3);
      addSignal(signals, "people-orientation", 0.2);
    }
  }

  if (career.aiRelationship === "Automation-Heavy") {
    addSignal(signals, "execution-speed", 0.3);
    addSignal(signals, "operational-thinking", 0.3);
  }
  if (career.aiRelationship === "AI-Augmented" || career.aiRelationship === "AI-Created") {
    addSignal(signals, "AI-curiosity", 0.4);
    addSignal(signals, "future-orientation", 0.2);
  }

  return normalizeSignals(signals);
}

function intersectLabels(a: string[], b: string[]) {
  return a.filter((value) => b.includes(value));
}

function tagFocus(career: Career): string {
  const tags = career.tags ?? [];
  const lowerTags = tags.map((t) => t.toLowerCase());
  const skill = career.coreSkill.toLowerCase();

  if (lowerTags.includes("apis") || skill.includes("api") || lowerTags.includes("databases") || lowerTags.includes("scalability")) {
    return "application systems and architecture";
  }
  if (lowerTags.includes("mlops") || lowerTags.includes("automation") || lowerTags.includes("devops") || lowerTags.includes("monitoring")) {
    return "deployment reliability and operational automation";
  }
  if (lowerTags.includes("data") || lowerTags.includes("synthetic data") || skill.includes("data") || skill.includes("model")) {
    return "data foundations and model workflows";
  }
  if (lowerTags.includes("policy") || lowerTags.includes("governance")) {
    return "AI governance and systems-level strategy";
  }
  if (career.domain === "Design" || lowerTags.includes("design") || lowerTags.includes("ux") || skill.includes("design")) {
    return "user-facing experience and creative tooling";
  }
  return career.coreSkill ? career.coreSkill.toLowerCase() : career.domain?.toLowerCase() || "its core domain";
}

function compareValues(a: number, b: number, label: string, positive?: string, negative?: string) {
  if (a === b) return `${label} is similar for both roles.`;
  return a > b ? positive || `${label} is stronger for the first career.` : negative || `${label} is stronger for the second career.`;
}

function buildSimilarities(careerA: Career, careerB: Career): string[] {
  const similarities: string[] = [];
  if (careerA.domain && careerA.domain === careerB.domain) {
    similarities.push(`Both are anchored in ${careerA.domain}.`);
  }

  if (careerA.demand === "high" && careerB.demand === "high") {
    similarities.push("Both careers target high-demand technical roles.");
  }

  if (careerA.coreSkill === careerB.coreSkill) {
    similarities.push(`Both emphasize ${careerA.coreSkill}.`);
  }

  const sharedTags = intersectLabels(careerA.tags ?? [], careerB.tags ?? []).slice(0, 3);
  if (sharedTags.length) {
    similarities.push(`Shared focus on ${sharedTags.join(", ")}.`);
  }

  const bothDeep = careerA.difficulty === "high" && careerB.difficulty === "high";
  if (bothDeep) {
    similarities.push("Both roles reward deep systems thinking and technical ownership.");
  }

  if (similarities.length === 0) {
    similarities.push("Both careers are strong choices for technically minded learners in the AI era.");
  }

  return similarities.slice(0, 4);
}

function buildCoreDifferences(career: Career, other: Career, label: string): string[] {
  const differences: string[] = [];
  differences.push(`Focuses on ${tagFocus(career)}.`);
  if (career.aiRelationship !== other.aiRelationship) {
    differences.push(`${career.title} is more ${career.aiRelationship?.toLowerCase().replace("-", " ") || "AI-aware"}.`);
  }
  if (career.difficulty && career.difficulty !== other.difficulty) {
    differences.push(`${career.title} has ${career.difficulty} learning difficulty compared to ${other.difficulty}.`);
  }
  if (career.futureDemand && career.futureDemand !== other.futureDemand) {
    differences.push(`${career.title} is positioned for ${career.futureDemand.toLowerCase()} future demand.`);
  }
  return differences;
}

function buildThinkingStyleFit(careerA: Career, careerB: Career, enhancedProfile?: EnhancedProfile): string {
  if (!enhancedProfile) {
    return "Your cognitive fit will depend on whether you prefer deep architectural thinking or operational/automation challenges.";
  }

  const user = enhancedProfile.extended;
  const signalsA = buildCareerSignals(careerA);
  const signalsB = buildCareerSignals(careerB);

  const scoreA = EXTENDED_TRAITS.reduce((total, trait) => total + (user[trait] || 0) * (signalsA[trait] || 0), 0);
  const scoreB = EXTENDED_TRAITS.reduce((total, trait) => total + (user[trait] || 0) * (signalsB[trait] || 0), 0);

  const userTopTraits = Object.entries(user)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([trait]) => trait.replace(/-/g, " "));

  if (scoreA === scoreB) {
    return `You show a balanced cognitive fit for both careers; ${careerA.title} and ${careerB.title} are both compatible with your top signals (${userTopTraits.join(", ")}).`;
  }

  const winner = scoreA > scoreB ? careerA.title : careerB.title;
  const loser = scoreA > scoreB ? careerB.title : careerA.title;
  const direction = scoreA > scoreB ? signalsA : signalsB;
  const fitTraits = Object.entries(user)
    .sort(([, a], [, b]) => b - a)
    .filter(([trait, value]) => value > 0.3)
    .slice(0, 3)
    .map(([trait]) => trait.replace(/-/g, " "));

  return `Your profile leans toward ${winner} because it better matches your strongest signals like ${fitTraits.join(", ")} compared to ${loser}.`;
}

function buildWorkStyleDifferences(careerA: Career, careerB: Career): string[] {
  const diffs: string[] = [];
  if (careerA.difficulty !== careerB.difficulty) {
    diffs.push(`${careerA.title} is more ${careerA.difficulty} while ${careerB.title} is more ${careerB.difficulty}.`);
  }
  if (careerA.timeToJob !== careerB.timeToJob) {
    diffs.push(`${careerA.title} generally reaches leverage in ${careerA.timeToJob}, versus ${careerB.timeToJob} for ${careerB.title}.`);
  }
  if (careerA.aiRelationship !== careerB.aiRelationship) {
    diffs.push(`${careerA.title} tends to be ${careerA.aiRelationship?.toLowerCase().replace("-", " ") || "AI-aware"}, while ${careerB.title} is ${careerB.aiRelationship?.toLowerCase().replace("-", " ") || "AI-aware"}.`);
  }
  if (!diffs.length) {
    diffs.push("Both roles share a similar hands-on work rhythm and technical focus.");
  }
  return diffs;
}

function buildAIScopeDifferences(careerA: Career, careerB: Career): string[] {
  const diffs: string[] = [];
  if (careerA.aiImpact !== careerB.aiImpact) {
    diffs.push(`${careerA.title} is seen as ${careerA.aiImpact} AI impact, while ${careerB.title} is ${careerB.aiImpact}.`);
  }
  if (careerA.futureDemand && careerB.futureDemand && careerA.futureDemand !== careerB.futureDemand) {
    diffs.push(`${careerA.title} is projected as ${careerA.futureDemand.toLowerCase()} growth, compared to ${careerB.futureDemand.toLowerCase()} for ${careerB.title}.`);
  }
  if (!diffs.length) {
    diffs.push("Both roles will be shaped by AI, but the form of that change differs.");
  }
  return diffs;
}

function buildLearningDifficulty(careerA: Career, careerB: Career): string {
  const difficultyA = careerA.difficulty || "moderate";
  const difficultyB = careerB.difficulty || "moderate";
  if (difficultyA === difficultyB) {
    return `Both careers have a similar learning curve, though ${careerA.title} may move faster if you already enjoy its core skill set.`;
  }
  return `${careerA.title} is generally ${difficultyA} to learn, while ${careerB.title} is ${difficultyB}, so choose the one that matches how fast you want to build mastery.`;
}

function buildLeverageComparison(careerA: Career, careerB: Career): string {
  if (careerA.futureDemand === careerB.futureDemand) {
    return `Both roles offer long-term leverage, but ${careerA.title} leans into ${tagFocus(careerA)} while ${careerB.title} leans into ${tagFocus(careerB)}.`;
  }
  const stronger = careerA.futureDemand === "Exploding" || (careerA.futureDemand === "High Growth" && careerB.futureDemand !== "Exploding");
  return stronger
    ? `${careerA.title} has slightly stronger leverage due to its ${careerA.futureDemand?.toLowerCase()} demand position.`
    : `${careerB.title} has slightly stronger leverage due to its ${careerB.futureDemand?.toLowerCase()} demand position.`;
}

function buildFutureDemandComparison(careerA: Career, careerB: Career): string {
  const demandA = careerA.futureDemand ?? "stable";
  const demandB = careerB.futureDemand ?? "stable";
  return `${careerA.title} is positioned for ${demandA.toLowerCase()} demand, while ${careerB.title} is positioned for ${demandB.toLowerCase()} demand.`;
}

function buildEvolutionDifferences(careerA: Career, careerB: Career): string[] {
  const diffs: string[] = [];
  if (careerA.domain && careerB.domain && careerA.domain !== careerB.domain) {
    diffs.push(`${careerA.title} advances toward ${careerA.domain}-centered roles, while ${careerB.title} opens paths in ${careerB.domain}.`);
  }
  if (careerA.relatedCareerIds?.length && careerB.relatedCareerIds?.length) {
    diffs.push(`Each path evolves through different adjacent career networks and technical ecosystems.`);
  }
  if (!diffs.length) {
    diffs.push(`Both careers can evolve into bigger systems and leadership roles as you gain experience.`);
  }
  return diffs;
}

function buildRecommendationSummary(comparison: CareerComparison, enhancedProfile?: EnhancedProfile): string {
  if (!enhancedProfile) {
    return `Choose ${comparison.careerA.title} if you want deeper architectural focus, or ${comparison.careerB.title} if you prefer operational automation and infrastructure scale.`;
  }

  const user = enhancedProfile.extended;
  const signalsA = buildCareerSignals(comparison.careerA);
  const signalsB = buildCareerSignals(comparison.careerB);

  const scoreA = EXTENDED_TRAITS.reduce((total, trait) => total + (user[trait] || 0) * (signalsA[trait] || 0), 0);
  const scoreB = EXTENDED_TRAITS.reduce((total, trait) => total + (user[trait] || 0) * (signalsB[trait] || 0), 0);

  const topTraits = Object.entries(user)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([trait]) => trait.replace(/-/g, " "));

  if (scoreA === scoreB) {
    return `Your profile fits both careers. ${comparison.careerA.title} is slightly more aligned with your ${topTraits.join(", ")}, while ${comparison.careerB.title} offers a stronger automation and operational angle.`;
  }

  const winner = scoreA > scoreB ? comparison.careerA : comparison.careerB;
  const loser = scoreA > scoreB ? comparison.careerB : comparison.careerA;
  const strongerTraits = Object.entries(user)
    .filter(([trait, value]) => value > 0.4)
    .map(([trait]) => trait.replace(/-/g, " "))
    .slice(0, 3);

  return `Your signals strongly favor ${winner.title} because it maps better to ${strongerTraits.join(", ")} than ${loser.title}.`;
}

export function compareCareers(careerA: Career, careerB: Career, enhancedProfile?: EnhancedProfile): CareerComparison {
  const similarities = buildSimilarities(careerA, careerB);
  return {
    careerA,
    careerB,
    similarities,
    differences: {
      careerA: buildCoreDifferences(careerA, careerB, careerA.title),
      careerB: buildCoreDifferences(careerB, careerA, careerB.title),
    },
    thinkingStyleFit: buildThinkingStyleFit(careerA, careerB, enhancedProfile),
    workStyleDifferences: buildWorkStyleDifferences(careerA, careerB),
    aiEraDifferences: buildAIScopeDifferences(careerA, careerB),
    learningDifficulty: buildLearningDifficulty(careerA, careerB),
    longTermLeverageComparison: buildLeverageComparison(careerA, careerB),
    futureDemandComparison: buildFutureDemandComparison(careerA, careerB),
    careerEvolutionDifferences: buildEvolutionDifferences(careerA, careerB),
    recommendationSummary: buildRecommendationSummary({
      careerA,
      careerB,
      similarities,
      differences: {
        careerA: buildCoreDifferences(careerA, careerB, careerA.title),
        careerB: buildCoreDifferences(careerB, careerA, careerB.title),
      },
      thinkingStyleFit: "",
      workStyleDifferences: [],
      aiEraDifferences: [],
      learningDifficulty: "",
      longTermLeverageComparison: "",
      futureDemandComparison: "",
      careerEvolutionDifferences: [],
      recommendationSummary: "",
    }, enhancedProfile),
  };
}
