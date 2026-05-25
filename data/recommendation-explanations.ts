import { Career } from "./careers";
import { TraitScores } from "./quiz";

export interface ThirtyDayStep {
  week: string;
  focus: string;
}

export interface RecommendationExplanation {
  whyMatched: string[];
  strengthSignals: string[];
  potentialRisks: string[];
  alternativeInsight?: string;
  longTermLeverage: string;
  aiOutlook: string;
  nextAction: string;
  thirtyDayPlan: ThirtyDayStep[];
}

const traitFriendlyNames: Record<keyof TraitScores, string> = {
  analytical: "analytical thinking",
  creativity: "creative problem solving",
  leadership: "leadership and direction",
  social: "cross-functional collaboration",
  structure: "structured systems work",
  "risk-tolerance": "risk-aware experimentation",
  "technical-depth": "technical depth",
  visual: "visual and interface sense",
};

const domainPlans: Record<string, ThirtyDayStep[]> = {
  "Software Engineering": [
    { week: "Week 1", focus: "Refresh programming fundamentals and system design basics." },
    { week: "Week 2", focus: "Learn HTTP, APIs, and how services communicate." },
    { week: "Week 3", focus: "Practice databases, caching, and backend reliability." },
    { week: "Week 4", focus: "Build and deploy a small API-backed project." },
  ],
  "AI & Data": [
    { week: "Week 1", focus: "Study Python data workflows and core statistics." },
    { week: "Week 2", focus: "Learn data pipelines, modeling, and evaluation." },
    { week: "Week 3", focus: "Practice tooling for data quality and model stability." },
    { week: "Week 4", focus: "Build a small data pipeline or model-driven dashboard." },
  ],
  Product: [
    { week: "Week 1", focus: "Learn product strategy and user research basics." },
    { week: "Week 2", focus: "Map AI product workflows and outcome metrics." },
    { week: "Week 3", focus: "Practice roadmapping and aligning stakeholders." },
    { week: "Week 4", focus: "Draft a mini product plan for an AI-enhanced feature." },
  ],
  Design: [
    { week: "Week 1", focus: "Review interaction design and visual communication." },
    { week: "Week 2", focus: "Practice prototyping and design validation." },
    { week: "Week 3", focus: "Explore generative tools that accelerate creative work." },
    { week: "Week 4", focus: "Create a polished design sample for a real workflow." },
  ],
  Automation: [
    { week: "Week 1", focus: "Refresh scripting fundamentals and automation logic." },
    { week: "Week 2", focus: "Learn CI/CD, monitoring, and deployment basics." },
    { week: "Week 3", focus: "Build simple automations for repeatable tasks." },
    { week: "Week 4", focus: "Deploy a workflow that saves time in a production-like setting." },
  ],
};

function tagFocusSummary(career: Career): string {
  const tags = (career.tags || []).map((tag) => tag.toLowerCase());
  const focus = career.coreSkill.toLowerCase();

  if (tags.includes("apis") || tags.includes("databases") || focus.includes("api")) {
    return "application systems and architecture";
  }
  if (tags.includes("mlops") || tags.includes("monitoring") || tags.includes("devops") || focus.includes("ops")) {
    return "infrastructure reliability and operational automation";
  }
  if (tags.includes("synthetic data") || tags.includes("data") || focus.includes("data")) {
    return "data foundations and model workflows";
  }
  if (tags.includes("policy") || tags.includes("ethics") || tags.includes("governance")) {
    return "AI governance and systems-level strategy";
  }
  if (career.domain === "Design" || tags.includes("ux") || tags.includes("interface")) {
    return "user-facing experience and creative tooling";
  }
  if (tags.includes("automation") || tags.includes("orchestration")) {
    return "automation design and production efficiency";
  }

  return career.coreSkill ? `${career.coreSkill.toLowerCase()}` : "its core domain";
}

function buildWhyMatched(userTraits: TraitScores, career: Career): string[] {
  const topSignals = Object.entries(userTraits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .filter(([, value]) => value > 0.25)
    .map(([trait]) => traitFriendlyNames[trait as keyof TraitScores]);

  const reasons: string[] = [];
  if (topSignals.length) {
    reasons.push(`Your profile favors ${topSignals.join(", ")} which fits ${career.title}.`);
  }

  if (career.aiImpactNote) {
    reasons.push(career.aiImpactNote);
  }

  if (career.demand === "high") {
    reasons.push("The role matches strong demand signals and real-world hiring trends.");
  }

  if (career.difficulty === "high") {
    reasons.push("It rewards technical depth and offers a strong growth path.");
  }

  if (reasons.length === 0) {
    reasons.push(`This career aligns with your interest in ${tagFocusSummary(career)}.`);
  }

  return reasons.slice(0, 3);
}

function buildStrengthSignals(userTraits: TraitScores, career: Career): string[] {
  const signals: string[] = [];
  const sorted = Object.entries(userTraits).sort(([, a], [, b]) => b - a);

  for (const [trait, score] of sorted.slice(0, 4)) {
    if (score > 0.3) {
      signals.push(`Strong ${traitFriendlyNames[trait as keyof TraitScores]} signal`);
    }
  }

  if (career.supportingSkills && career.supportingSkills.length) {
    const relevantSkills = career.supportingSkills.slice(0, 2);
    signals.push(`Supports skills like ${relevantSkills.join(" and ")}`);
  }

  if (career.futureDemand) {
    signals.push(`${career.futureDemand} future demand for this field`);
  }

  return signals.slice(0, 3);
}

function buildPotentialRisks(career: Career): string[] {
  const risks: string[] = [];

  if (career.difficulty === "high") {
    risks.push("This path can take longer to master and may feel challenging at first.");
  }

  if (career.aiRelationship === "Automation-Heavy") {
    risks.push("Routine tasks may become automated, so stay focused on systems and strategy.");
  }

  if (career.demand === "moderate" || career.futureDemand === "Stable") {
    risks.push("The role may require stronger differentiation to stay competitive.");
  }

  if (!risks.length) {
    risks.push("Focus on practical outcomes so you don’t get stuck in theory over delivery.");
  }

  return risks.slice(0, 2);
}

function buildAIOutlook(career: Career): string {
  const focus = tagFocusSummary(career);
  if (career.aiImpact === "transformative") {
    return `AI will reshape the role, making systems thinking and architecture more valuable than routine execution.`;
  }
  if (career.aiImpact === "high") {
    return `AI will automate repetitive implementation, increasing demand for architecture and systems thinking in ${focus}.`;
  }
  if (career.aiImpact === "moderate") {
    return `AI will augment the work, so your ability to design workflows and keep teams aligned is the real edge.`;
  }

  return `AI will be a supporting tool; your advantage is mastering the role’s core systems and decision-making.`;
}

function buildNextAction(career: Career): string {
  const focus = tagFocusSummary(career);

  if (focus.includes("api") || focus.includes("architecture")) {
    return "Build a simple API-backed service and deploy it to prove the core system flow.";
  }
  if (focus.includes("data") || focus.includes("model")) {
    return "Create a small data pipeline or machine learning experiment and validate it with real inputs.";
  }
  if (focus.includes("automation")) {
    return "Automate a repeatable process end to end to show the role’s leverage.";
  }
  if (focus.includes("product") || focus.includes("strategy")) {
    return "Draft a mini product plan that connects user needs to AI-enabled outcomes.";
  }
  if (focus.includes("design") || focus.includes("interface")) {
    return "Prototype a polished interaction and test it with a real user scenario.";
  }

  return `Take one concrete step around ${career.coreSkill.toLowerCase()} and ship a small outcome.`;
}

function buildThirtyDayPlan(career: Career): ThirtyDayStep[] {
  return domainPlans[career.domain || ""] || [
    { week: "Week 1", focus: "Review the role’s core skills and basic concepts." },
    { week: "Week 2", focus: "Practice the main tools that professionals use in this field." },
    { week: "Week 3", focus: "Build a small exercise that connects your learning to real work." },
    { week: "Week 4", focus: "Finish a mini project that demonstrates the role’s value." },
  ];
}

function buildAlternativeInsight(top: Career, alternate: Career, scoreDelta: number): string | undefined {
  if (scoreDelta > 12) return undefined;

  const topFocus = tagFocusSummary(top);
  const altFocus = tagFocusSummary(alternate);

  return `The difference is subtle: ${top.title} favors ${topFocus}. ${alternate.title} favors ${altFocus}.`;
}

export function buildRecommendationExplanation(
  userTraits: TraitScores,
  career: Career,
  alternateCareer?: Career,
  scoreDelta?: number
): RecommendationExplanation {
  return {
    whyMatched: buildWhyMatched(userTraits, career),
    strengthSignals: buildStrengthSignals(userTraits, career),
    potentialRisks: buildPotentialRisks(career),
    alternativeInsight: alternateCareer ? buildAlternativeInsight(career, alternateCareer, scoreDelta ?? 0) : undefined,
    longTermLeverage: `Your long-term leverage grows in environments requiring deep systems understanding rather than repetitive execution.`,
    aiOutlook: buildAIOutlook(career),
    nextAction: buildNextAction(career),
    thirtyDayPlan: buildThirtyDayPlan(career),
  };
}

export function buildCareerSurfaceExplanation(
  career: Career,
  alternate?: Career,
  scoreDelta?: number
): RecommendationExplanation {
  return {
    whyMatched: [career.aiImpactNote || `This role fits your preference for ${tagFocusSummary(career)}.`],
    strengthSignals: [`Focus on ${tagFocusSummary(career)} and ${career.coreSkill.toLowerCase()}.`],
    potentialRisks: buildPotentialRisks(career),
    alternativeInsight: alternate ? buildAlternativeInsight(career, alternate, scoreDelta ?? 0) : undefined,
    longTermLeverage: `Your long-term leverage grows in environments requiring deep systems understanding rather than repetitive execution.`,
    aiOutlook: buildAIOutlook(career),
    nextAction: buildNextAction(career),
    thirtyDayPlan: buildThirtyDayPlan(career),
  };
}
