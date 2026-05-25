import { careers, Career, getCareerById } from "./careers";
import type { EnhancedProfile } from "./quiz-enhanced";

export interface SkillEcosystem {
  core: string;
  supporting: string[];
  expansion: string[];
  transferable: string[];
  transitionInsight: string;
  tradeoffInsight: string;
}

export interface CareerEvolution {
  career: Career;
  immediateNextPaths: string[];
  midCareerEvolution: string[];
  advancedSpecializationRoutes: string[];
  adjacentTransferableCareers: string[];
  leadershipTrack: string[];
  researchTrack: string[];
  founderTrack: string[];
  aiEraExpansionOpportunities: string[];
  skillEcosystem: SkillEcosystem;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function titlesFromIds(ids: string[]): string[] {
  return unique(
    ids
      .map((id) => getCareerById(id))
      .filter((career): career is Career => Boolean(career))
      .map((career) => career.title)
  );
}

function titleCandidates(
  filter: (career: Career) => boolean,
  limit = 4
): string[] {
  return unique(careers.filter(filter).map((career) => career.title)).slice(0, limit);
}

function buildImmediateNextPaths(career: Career): string[] {
  const related = titlesFromIds(career.relatedCareerIds ?? []);
  if (related.length) return related;

  return titleCandidates(
    (item) => item.domain === career.domain && item.id !== career.id,
    3
  );
}

function buildAdjacentTransferableCareers(career: Career): string[] {
  const base = titlesFromIds(career.relatedCareerIds ?? []);
  if (base.length >= 4) return base.slice(0, 4);

  const sharedTagCareers = titleCandidates(
    (item) =>
      item.id !== career.id &&
      (item.tags || []).some((tag) => (career.tags || []).includes(tag)),
    4
  );

  return unique([...base, ...sharedTagCareers]).slice(0, 4);
}

function buildMidCareerEvolution(career: Career): string[] {
  const candidates = titleCandidates(
    (item) =>
      item.id !== career.id &&
      item.domain === career.domain &&
      item.difficulty !== "low" &&
      !career.relatedCareerIds?.includes(item.id),
    3
  );

  if (candidates.length) return candidates;

  return titleCandidates(
    (item) => item.domain === career.domain && item.id !== career.id,
    3
  );
}

function buildAdvancedSpecializationRoutes(career: Career): string[] {
  const keywords = ["architect", "specialist", "principal", "lead", "systems"];
  const candidates = titleCandidates(
    (item) =>
      item.id !== career.id &&
      item.domain === career.domain &&
      keywords.some((keyword) => item.title.toLowerCase().includes(keyword)),
    3
  );

  if (candidates.length) return candidates;

  return titleCandidates(
    (item) => item.id !== career.id && item.domain === career.domain && item.difficulty === "high",
    3
  );
}

function buildLeadershipTrack(career: Career): string[] {
  const candidates = titleCandidates(
    (item) =>
      item.id !== career.id &&
      item.domain === career.domain &&
      /(manager|director|cto|vp|lead)/i.test(item.title),
    3
  );

  if (candidates.length) return candidates;
  return career.domain === "Product"
    ? ["Product Lead", "Head of Product", "VP Product"]
    : ["Engineering Manager", "Director of Engineering", "CTO"];
}

function buildResearchTrack(career: Career): string[] {
  const candidates = titleCandidates(
    (item) =>
      item.id !== career.id &&
      /(research|scientist|safety)/i.test(item.title),
    3
  );

  if (candidates.length) return candidates;
  return ["Applied Researcher", "AI Research Scientist", "Research Lead"];
}

function buildFounderTrack(career: Career): string[] {
  const generic = ["Technical Founder", "AI Startup Founder", "Founder / CTO"];
  const relevant = titleCandidates(
    (item) => /founder|startup|entrepreneur/i.test(item.title),
    3
  );
  return relevant.length ? relevant : generic;
}

function buildAiEraExpansionOpportunities(career: Career): string[] {
  const opportunities: string[] = [];
  if (career.aiRelationship === "Automation-Heavy") {
    opportunities.push("AI operations and automation platform roles");
  }
  if (career.aiRelationship === "AI-Augmented" || career.aiRelationship === "AI-Assisted") {
    opportunities.push("AI systems design and production engineering roles");
  }
  if (career.aiRelationship === "AI-Created") {
    opportunities.push("AI-native product and model creation roles");
  }

  if (!opportunities.length) {
    opportunities.push("AI-enabled systems and workflow expansion roles");
  }

  return opportunities.slice(0, 4);
}

function buildSkillEcosystem(career: Career, enhancedProfile?: EnhancedProfile): SkillEcosystem {
  const supporting = unique(career.supportingSkills ?? career.tags ?? []).slice(0, 6);
  const expansion: string[] = [];

  if (career.tags?.some((tag) => /(cloud|infrastructure|architecture|data|ml|ai)/i.test(tag))) {
    expansion.push("AI infrastructure", "Distributed systems");
  }
  if (career.tags?.some((tag) => /(design|ux|visual)/i.test(tag))) {
    expansion.push("Product design", "Experience architecture");
  }
  if (!expansion.length) {
    expansion.push("AI tooling", "Process automation");
  }

  const transferable = buildAdjacentTransferableCareers(career);

  const transitionInsight = career.coreSkill.toLowerCase().includes("system")
    ? `Your ${career.coreSkill} foundation creates strong transition paths into infrastructure and AI systems.`
    : `This foundation makes it easier to move into adjacent roles that value your skill in ${career.coreSkill.toLowerCase()}.`;

  const tradeoffInsight = career.tags?.some((tag) => /(automation|ops|infrastructure)/i.test(tag))
    ? `Roles like Platform Engineering require stronger operational ownership and reliability focus.`
    : `Roles like Product or Design require more stakeholder coordination than this path.`;

  return {
    core: career.coreSkill,
    supporting,
    expansion: unique(expansion).slice(0, 4),
    transferable,
    transitionInsight,
    tradeoffInsight,
  };
}

export function buildCareerEvolution(career: Career, enhancedProfile?: EnhancedProfile): CareerEvolution {
  return {
    career,
    immediateNextPaths: buildImmediateNextPaths(career),
    midCareerEvolution: buildMidCareerEvolution(career),
    advancedSpecializationRoutes: buildAdvancedSpecializationRoutes(career),
    adjacentTransferableCareers: buildAdjacentTransferableCareers(career),
    leadershipTrack: buildLeadershipTrack(career),
    researchTrack: buildResearchTrack(career),
    founderTrack: buildFounderTrack(career),
    aiEraExpansionOpportunities: buildAiEraExpansionOpportunities(career),
    skillEcosystem: buildSkillEcosystem(career, enhancedProfile),
  };
}
