import type { Career } from "./careers";
import type { TraitScores } from "./quiz";
import type { EnhancedProfile } from "./quiz-enhanced";

export type ResultReport = {
  cognitiveIdentity: string;
  thinkingStyle: string;
  longTermAdvantage: string;
  aiEraPositioning: string;
  careerSustainability: string;
  blindSpots: string;
  burnoutRisk: string;
  specializationStrategy: string;
  workEnvironmentFit: string;
  careerEvolutionPath: string[];
};

const identitySignals: Array<[keyof EnhancedProfile["extended"], string]> = [
  ["systems-thinking", "You naturally think like a systems optimizer. You consistently favor reliability, structured complexity, and scalable solutions."],
  ["AI-curiosity", "You naturally think like an AI adaptation strategist. You relish building products that make intelligent systems feel useful and trustworthy."],
  ["experimentation", "You naturally think like an experimenter. You favor rapid iteration, practical learning, and real-world validation over abstract perfection."],
  ["ambiguity-tolerance", "You naturally think like a navigator of uncertainty. You are comfortable making progress when the path is incomplete or evolving."],
  ["leadership", "You naturally think like a coordinator. You notice how decisions ripple across teams and you care about alignment and momentum."],
];

function pickIdentity(extended: EnhancedProfile["extended"]): string {
  const ranked = Object.entries(extended).sort((a, b) => b[1] - a[1]);
  for (const [trait, message] of identitySignals) {
    if ((extended[trait] || 0) > 0.55) return message;
  }
  const topTrait = ranked[0]?.[0] as keyof EnhancedProfile["extended"];
  return `Your strongest signal is ${topTrait.replace(/-/g, " ")}. You think in terms of systems, tradeoffs, and practical movement toward objectives.`;
}

function buildWorkStyle(extended: EnhancedProfile["extended"]): string {
  const parts: string[] = [];
  if (extended["experimentation"] > 0.5) {
    parts.push("You test ideas quickly and learn from what works.");
  }
  if (extended["systems-thinking"] > 0.5) {
    parts.push("You prefer stable foundations and predictable architecture.");
  }
  if (extended["ambiguity-tolerance"] > 0.5) {
    parts.push("You are comfortable with loose definitions early in a problem.");
  }
  if (extended["leadership"] > 0.5) {
    parts.push("You think in terms of people, process, and cross-functional tradeoffs.");
  }
  if (parts.length === 0) {
    return "Your thinking style is practical and grounded in the work that creates reliable outcomes.";
  }
  return `${parts.join(" ")} This blend makes you adept at moving from uncertainty to execution.`;
}

function buildAdvantage(extended: EnhancedProfile["extended"]): string {
  if (extended["systems-thinking"] > 0.6) {
    return "You appear comfortable handling invisible technical complexity that many people avoid. That gives you an edge in infrastructure and reliability work.";
  }
  if (extended["AI-curiosity"] > 0.6) {
    return "You can turn emerging AI capability into practical products, which is rare and valuable in the current market.";
  }
  return "Your strongest advantage is seeing how work systems fit together and how to push them forward without creating chaos.";
}

function buildAIPositioning(extended: EnhancedProfile["extended"]): string {
  if (extended["AI-curiosity"] > 0.5 || extended["AI-builder"] > 0.5) {
    return "You are well-positioned for AI-era roles that bridge models, infrastructure, and real user value.";
  }
  if (extended["research-orientation"] > 0.5) {
    return "You are well-positioned for roles that combine investigation, model thinking, and product-level impact.";
  }
  return "Your profile is most powerful in AI-era work that values strong systems thinking and reliable execution over hype.";
}

function buildSustainability(extended: EnhancedProfile["extended"], depth: number): string {
  if (depth > 0.4) {
    return "Your profile has a strong specialization tilt. That suggests a sustainable path of deep mastery rather than spreading across too many domains.";
  }
  return "Your profile is broad enough to adapt to changing AI trends, but you should still choose one area to deepen for long-term leverage.";
}

function buildBlindSpots(extended: EnhancedProfile["extended"], contradictions: number): string {
  if (contradictions > 0) {
    return "You show mixed cognitive priorities, which can lead to unclear career focus unless you deliberately reconcile reliability with exploration.";
  }
  if (extended["deep-work"] > 0.55 && extended["execution-speed"] < 0.4) {
    return "You may over-optimize and delay practical execution. Tight deadlines may expose that gap unless you balance focus with momentum.";
  }
  if (extended["stability-preference"] > 0.55 && extended["experimentation"] > 0.5) {
    return "You may prefer safer systems even while wanting to experiment, so you risk underplaying the value of rapid learning.";
  }
  if (extended["ambiguity-tolerance"] < 0.45) {
    return "Unstructured, ambiguous environments may feel draining and leave you second-guessing the path forward.";
  }
  return "You may underweight the execution risks of a strategy when the problem looks interesting.";
}

function buildBurnout(extended: EnhancedProfile["extended"], contradictions: number): string {
  if (contradictions > 0) {
    return "Mixed signals can become a source of stress: wanting both stability and rapid change can lead to exhaustion.";
  }
  if (extended["ambiguity-tolerance"] < 0.45 && extended["experimentation"] > 0.5) {
    return "Highly chaotic environments with unclear ownership may become mentally exhausting.";
  }
  if (extended["leadership"] > 0.55 && extended["autonomy"] < 0.4) {
    return "Leadership pressure in a low-autonomy environment can feel especially tiring over time.";
  }
  return "You are likely to stay sustainable in roles where outcomes are clear and the domain is technically concrete.";
}

function buildStrategy(extended: EnhancedProfile["extended"]): string {
  if (extended["systems-thinking"] > 0.55) {
    return "Master backend and infrastructure fundamentals first, then layer AI and platform tooling on top of that foundation.";
  }
  if (extended["AI-curiosity"] > 0.55) {
    return "Build a strong core in AI product or tooling, then specialize in the infrastructure or reliability side of intelligent systems.";
  }
  if (extended["experimentation"] > 0.55) {
    return "Use rapid prototypes to validate what works, then lock in the most promising direction with deeper technical skill.";
  }
  return "Develop a focused specialization around your strongest cognitive signal while keeping one adjacent skill set practical and usable.";
}

function buildEnvironmentFit(extended: EnhancedProfile["extended"]): string {
  if (extended["autonomy"] > 0.55 && extended["ambiguity-tolerance"] > 0.5) {
    return "Best fit in environments that reward independent ownership, fast decision-making, and evolving product direction.";
  }
  if (extended["stability-preference"] > 0.55 && extended["risk-tolerance"] < 0.45) {
    return "Best fit in teams with clear roles, reliable processes, and predictable delivery cadences.";
  }
  if (extended["leadership"] > 0.55) {
    return "Best fit in environments where you can align stakeholders, translate work across teams, and own the direction of complex initiatives.";
  }
  return "Best fit in teams that balance strong technical direction with room for practical iteration and continuous learning.";
}

function buildEvolutionPath(topMatch: Career, allMatches: Career[]): string[] {
  const titles: string[] = [topMatch.title];
  const related = topMatch.relatedCareerIds ?? [];
  for (const id of related.slice(0, 3)) {
    const career = allMatches.find((item) => item.id === id);
    if (career) titles.push(career.title);
  }
  if (titles.length === 1 && allMatches.length > 0) {
    titles.push(...allMatches.slice(0, 2).map((item) => item.title));
  }
  return titles.slice(0, 4);
}

export function generateResultReport(params: {
  userProfile: TraitScores;
  enhancedProfile: EnhancedProfile;
  topMatch: Career;
  allMatches: Array<{ career: Career }>;
}): ResultReport {
  const { enhancedProfile, topMatch, allMatches } = params;
  const extended = enhancedProfile.extended;
  const contradictions = enhancedProfile.contradictions.length;

  return {
    cognitiveIdentity: pickIdentity(extended),
    thinkingStyle: buildWorkStyle(extended),
    longTermAdvantage: buildAdvantage(extended),
    aiEraPositioning: buildAIPositioning(extended),
    careerSustainability: buildSustainability(extended, enhancedProfile.specializationDepth),
    blindSpots: buildBlindSpots(extended, contradictions),
    burnoutRisk: buildBurnout(extended, contradictions),
    specializationStrategy: buildStrategy(extended),
    workEnvironmentFit: buildEnvironmentFit(extended),
    careerEvolutionPath: buildEvolutionPath(topMatch, allMatches.map((item) => item.career)),
  };
}
