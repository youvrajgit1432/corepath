// CorePath — Uniqueness Intelligence
// Explains "What makes this person different?"
// Sources: habit-intelligence, personal-evolution, community-signals, career-identity, achievements, journey-memory

import { getPersonalEvolution } from "./personal-evolution";
import { buildCommunitySignals } from "./community-signals";
import { getCareerIdentity } from "./career-identity";
import { loadAchievements, computeAchievements } from "./achievement-engine";
import { loadJourneyMemory } from "./journey-memory";
import type { CareerIdentity } from "./career-identity";

// ── Types ──────────────────────────────────────────────────────────

export type ExplorationStyle = "specialist" | "balanced" | "explorer";

export interface RarePattern {
  pattern: string;
  rarity: "high" | "medium" | "low";
  description: string;
  source: string;
  evidence: string[];
}

export interface StrengthSignal {
  signal: string;
  strength: number; // 0-100
  category: "habit" | "achievement" | "identity" | "behavior" | "combination";
  description: string;
}

export interface UnusualCombination {
  combination: string;
  rarityScore: number; // 0-100
  description: string;
  advantage: string;
}

export interface AdvantageArea {
  area: string;
  score: number; // 0-100
  description: string;
  keys: string[];
}

export interface HiddenSignal {
  signal: string;
  source: string;
  potential: string;
  unlockSuggestion: string;
}

export interface UniquenessData {
  uniquenessScore: number;
  rarePatterns: RarePattern[];
  strengthSignals: StrengthSignal[];
  unusualCombinations: UnusualCombination[];
  explorationStyle: ExplorationStyle;
  differentiationNarrative: string;
  advantageAreas: AdvantageArea[];
  hiddenSignals: HiddenSignal[];
  computedAt: number;
}

// ── Cache ──────────────────────────────────────────────────────────

let cached: UniquenessData | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── Detection helpers ──────────────────────────────────────────────

function getStrengthDepth(identity: CareerIdentity): number {
  // Estimate a "strength clarity" from dominantStrengths + focusPattern
  let depth = 40;
  if (identity.dominantStrengths.length >= 2) depth += 15 * identity.dominantStrengths.length;
  if (identity.dominantStrengths.length >= 4) depth += 10;
  if (identity.focusPattern === "niche-specialist") depth += 20;
  if (identity.focusPattern === "focused-explorer") depth += 10;
  if (identity.growthStyle === "focused-deep-diver") depth += 15;
  return Math.min(100, depth);
}

function getArchetypeRarity(archetype: string): number {
  // Some archetypes are rarer than others
  const rarity: Record<string, number> = {
    architect: 65,
    innovator: 75,
    researcher: 60,
    strategist: 70,
    builder: 55,
    navigator: 45,
    explorer: 30,
  };
  return rarity[archetype] ?? 50;
}

function detectRareCombinations(
  identity: CareerIdentity,
  memory: ReturnType<typeof loadJourneyMemory>
): UnusualCombination[] {
  const combinations: UnusualCombination[] = [];

  // Archetype + growth style pairing
  const archetype = identity.careerArchetype;
  const style = identity.growthStyle;
  const focus = identity.focusPattern;

  // Check for unusual archetype + style combos
  const rareStylePairs: Record<string, string[]> = {
    innovator: ["focused-deep-diver"],
    architect: ["broad-explorer"],
    researcher: ["broad-explorer"],
  };
  const matchingStyles = rareStylePairs[archetype];
  if (matchingStyles?.includes(style)) {
    combinations.push({
      combination: `${capitalize(archetype)} + ${formatStyle(style)}`,
      rarityScore: 80,
      description: `Combines a "${archetype}" archetype with a "${style}" growth style — an uncommon pairing that suggests flexible career intelligence.`,
      advantage: `Can leverage both the ${archetype} mindset and the ${style.replace("-", " ")} approach to career growth.`,
    });
  }

  // Strong focus pattern + many strengths = rare
  if (focus === "niche-specialist" && identity.dominantStrengths.length >= 3) {
    combinations.push({
      combination: `${identity.dominantStrengths.slice(0, 2).join(" + ")} (specialist)`,
      rarityScore: 75,
      description: `Specialized focus with ${identity.dominantStrengths.length} dominant strengths — rare depth across multiple capabilities.`,
      advantage: `Combines deep career focus with breadth of personal strengths for distinctive positioning.`,
    });
  }

  // Broad generalist with unusual strength breadth
  if (focus === "broad-generalist" && identity.dominantStrengths.length >= 4) {
    combinations.push({
      combination: `Broad generalist with ${identity.dominantStrengths.length} strengths`,
      rarityScore: 70,
      description: `Explores broadly while maintaining ${identity.dominantStrengths.length} distinct strengths — unusually versatile profile.`,
      advantage: `Can pivot across roles more effectively than most, with transferable strengths in multiple areas.`,
    });
  }

  // Career exploration diversity
  const careerHistory = memory.viewedCareerHistory ?? [];
  const uniqueCareers = careerHistory.length;
  if (uniqueCareers >= 6) {
    combinations.push({
      combination: `${uniqueCareers} careers explored`,
      rarityScore: Math.min(60 + uniqueCareers * 3, 95),
      description: `Has explored ${uniqueCareers} different career paths — unusually broad research.`,
      advantage: `Broad exploration provides pattern recognition across fields most people never consider.`,
    });
  }

  return combinations;
}

function detectStrengthSignals(
  identity: CareerIdentity,
  evolution: ReturnType<typeof getPersonalEvolution>,
  achievements: ReturnType<typeof loadAchievements> | ReturnType<typeof computeAchievements>,
  memory: ReturnType<typeof loadJourneyMemory>
): StrengthSignal[] {
  const signals: StrengthSignal[] = [];

  // Identity strength — derived from archetype rarity + dominant strengths
  const strengthDepth = getStrengthDepth(identity);
  if (strengthDepth >= 60) {
    signals.push({
      signal: `Strong ${identity.careerArchetype} identity`,
      strength: strengthDepth,
      category: "identity",
      description: `Clear "${identity.careerArchetype}" profile with ${identity.dominantStrengths.length} dominant strengths and ${identity.focusPattern} focus pattern.`,
    });
  }

  // Archetype rarity
  const archRarity = getArchetypeRarity(identity.careerArchetype);
  if (archRarity >= 60) {
    signals.push({
      signal: `Rare archetype: ${capitalize(identity.careerArchetype)}`,
      strength: archRarity,
      category: "identity",
      description: `The "${identity.careerArchetype}" archetype represents a less common career intelligence profile.`,
    });
  }

  // Evolution score as growth strength
  if (evolution.evolutionScore >= 60) {
    signals.push({
      signal: "Strong personal evolution",
      strength: evolution.evolutionScore,
      category: "behavior",
      description: `Overall evolution score of ${evolution.evolutionScore}/100 — above-average growth trajectory.`,
    });
  }

  // Achievement outlier
  const unlockedCount = achievements.unlockedAchievements?.length ?? 0;
  if (unlockedCount >= 5) {
    signals.push({
      signal: "High achiever",
      strength: Math.min(unlockedCount * 12, 100),
      category: "achievement",
      description: `Unlocked ${unlockedCount} achievements — above-average accomplishment rate.`,
    });
  }

  // Milestone momentum
  const milestones = evolution.milestoneMoments?.length ?? 0;
  if (milestones >= 3) {
    signals.push({
      signal: "Milestone momentum",
      strength: Math.min(milestones * 20, 100),
      category: "achievement",
      description: `${milestones} milestone moments recorded — strong progress signaling.`,
    });
  }

  // Quiz engagement strength
  const quizCount = memory.completedQuizzes ?? 0;
  if (quizCount >= 10) {
    signals.push({
      signal: "High assessment engagement",
      strength: Math.min(50 + quizCount * 2, 100),
      category: "behavior",
      description: `Completed ${quizCount} quizzes — unusually thorough self-assessment pattern.`,
    });
  }

  return signals;
}

function detectHiddenSignals(
  identity: CareerIdentity,
  evolution: ReturnType<typeof getPersonalEvolution>,
  memory: ReturnType<typeof loadJourneyMemory>,
  community: ReturnType<typeof buildCommunitySignals>
): HiddenSignal[] {
  const signals: HiddenSignal[] = [];
  const strengths = identity.dominantStrengths ?? [];
  const interests = evolution.interestEvolution ?? [];

  // Few strengths but high evolution → hidden potential
  if (strengths.length <= 2 && evolution.evolutionScore >= 50) {
    signals.push({
      signal: "Unexpressed strengths",
      source: "career-identity",
      potential: "Your evolution score suggests growth beyond what your identified strengths capture.",
      unlockSuggestion: "Take another career cognition quiz to surface strengths that may have emerged since your last assessment.",
    });
  }

  // Breadth without depth signal
  if (interests.length >= 4 && evolution.evolutionScore < 50) {
    signals.push({
      signal: "Broad exploration without convergence",
      source: "personal-evolution",
      potential: `Exploring ${interests.length} interest areas but hasn't narrowed — signals untapped depth potential.`,
      unlockSuggestion: `Pick the most resonant interest and complete 3 deep-dive actions on it.`,
    });
  }

  // Community signals divergence
  if (community.popularCareers.length > 0) {
    const userCareers = memory.viewedCareerHistory?.map((v) => v.careerId) ?? [];
    const overlap = community.popularCareers.filter((pc) =>
      userCareers.some((uc) => pc.toLowerCase().includes(uc.toLowerCase()))
    );
    if (overlap.length <= 1 && userCareers.length >= 3) {
      signals.push({
        signal: "Independent path from peers",
        source: "community-signals",
        potential: "Your career exploration diverges from popular paths — this can be a source of unique perspective.",
        unlockSuggestion: "Document how your non-traditional path gives you advantages others lack.",
      });
    }
  }

  // Growth narrative suggests hidden insights
  if (evolution.identityShift && evolution.identityShift.length > 0 && evolution.confidenceGrowth > 0) {
    signals.push({
      signal: "Growing self-awareness",
      source: "personal-evolution",
      potential: `Confidence has grown by ${evolution.confidenceGrowth} points alongside identity shifts — signals an evolving understanding of career fit.`,
      unlockSuggestion: "Review your personal evolution narrative to identify patterns you haven't consciously noticed.",
    });
  }

  return signals;
}

function determineExplorationStyle(
  evolution: ReturnType<typeof getPersonalEvolution>,
  memory: ReturnType<typeof loadJourneyMemory>,
  identity: CareerIdentity
): ExplorationStyle {
  const evolutionScore = evolution.evolutionScore ?? 50;
  const interestCount = evolution.interestEvolution?.length ?? 0;
  const careerCount = memory.viewedCareerHistory?.length ?? 0;
  const strengths = identity.dominantStrengths?.length ?? 0;
  const isSpecialist = identity.focusPattern === "niche-specialist";

  const breadthIndicators = interestCount + careerCount * 0.5;
  const depthIndicators = evolutionScore + strengths * 15;

  if (isSpecialist || (depthIndicators > breadthIndicators * 1.5 && evolutionScore >= 60)) return "specialist";
  if (breadthIndicators > depthIndicators * 1.5 || careerCount >= 8) return "explorer";
  return "balanced";
}

function buildAdvantageAreas(
  combinations: UnusualCombination[],
  signals: StrengthSignal[],
  style: ExplorationStyle
): AdvantageArea[] {
  const areas: AdvantageArea[] = [];

  // From combinations
  for (const combo of combinations) {
    areas.push({
      area: combo.combination.length > 30 ? combo.combination.slice(0, 30) + "…" : combo.combination,
      score: combo.rarityScore,
      description: combo.advantage,
      keys: [combo.combination],
    });
  }

  // From style
  if (style === "specialist") {
    areas.push({
      area: "Deep expertise",
      score: 85,
      description: "Focused specialization creates clear market positioning.",
      keys: ["specialization", "depth", "expertise"],
    });
  } else if (style === "explorer") {
    areas.push({
      area: "Cross-domain pattern recognition",
      score: 80,
      description: "Broad exploration enables unique cross-domain insights.",
      keys: ["breadth", "pattern-recognition", "adaptability"],
    });
  } else {
    areas.push({
      area: "Versatile adaptability",
      score: 75,
      description: "Balance of depth and breadth enables flexible career moves.",
      keys: ["versatility", "balance", "adaptability"],
    });
  }

  // From top strength signals
  const topSignals = [...signals].sort((a, b) => b.strength - a.strength).slice(0, 2);
  for (const sig of topSignals) {
    areas.push({
      area: sig.signal.length > 30 ? sig.signal.slice(0, 30) + "…" : sig.signal,
      score: sig.strength,
      description: sig.description,
      keys: [sig.category, sig.signal.toLowerCase().replace(/\s+/g, "-")],
    });
  }

  return areas;
}

function computeRarityScore(
  combinations: UnusualCombination[],
  signals: StrengthSignal[],
  hidden: HiddenSignal[],
  style: ExplorationStyle
): number {
  let score = 40; // baseline

  // Combinations boost
  for (const combo of combinations) {
    score += (combo.rarityScore - 50) * 0.3;
  }

  // Strong signals boost
  const strongSignals = signals.filter((s) => s.strength >= 70);
  score += strongSignals.length * 8;

  // Hidden signals indicate uniqueness potential
  score += hidden.length * 3;

  // Style bonus
  if (style === "specialist") score += 10;
  if (style === "explorer") score += 5;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatStyle(style: string): string {
  return style.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildNarrative(
  score: number,
  style: ExplorationStyle,
  combinations: UnusualCombination[],
  signals: StrengthSignal[]
): string {
  const parts: string[] = [];

  if (score >= 70) {
    parts.push("You have a distinctly unique career profile.");
  } else if (score >= 45) {
    parts.push("Your career profile has several distinctive elements.");
  } else {
    parts.push("Your career profile follows common patterns with room for differentiation.");
  }

  if (style === "specialist") {
    parts.push("Your deep specialization sets you apart from generalists.");
  } else if (style === "explorer") {
    parts.push("Your broad exploration gives you rare cross-domain perspective.");
  } else {
    parts.push("You balance depth and breadth in a versatile way.");
  }

  if (combinations.length > 0) {
    const topCombo = combinations[0];
    parts.push(`Your most distinctive combination: ${topCombo.combination}.`);
  }

  if (signals.length >= 3) {
    parts.push(`${signals.length} key strengths amplify your unique positioning.`);
  }

  return parts.join(" ");
}

// ── Main entry points ─────────────────────────────────────────────

export function computeUniqueness(): UniquenessData {
  const identity = getCareerIdentity();
  const memory = loadJourneyMemory();
  const evolution = getPersonalEvolution();
  const achievements = loadAchievements() ?? computeAchievements();
  const community = buildCommunitySignals();

  const unusualCombinations = detectRareCombinations(identity, memory);
  const strengthSignals = detectStrengthSignals(identity, evolution, achievements, memory);
  const hiddenSignals = detectHiddenSignals(identity, evolution, memory, community);
  const explorationStyle = determineExplorationStyle(evolution, memory, identity);

  const rarityScore = computeRarityScore(
    unusualCombinations,
    strengthSignals,
    hiddenSignals,
    explorationStyle
  );

  const rarePatterns: RarePattern[] = [
    ...unusualCombinations.map(
      (c): RarePattern => ({
        pattern: c.combination,
        rarity: c.rarityScore >= 75 ? "high" : c.rarityScore >= 50 ? "medium" : "low",
        description: c.description,
        source: "career-identity",
        evidence: [c.advantage],
      })
    ),
    ...strengthSignals
      .filter((s) => s.strength >= 75)
      .map(
        (s): RarePattern => ({
          pattern: s.signal,
          rarity: "high",
          description: s.description,
          source: s.category,
          evidence: [`Strength: ${s.strength}/100`],
        })
      ),
  ];

  const advantageAreas = buildAdvantageAreas(unusualCombinations, strengthSignals, explorationStyle);

  return {
    uniquenessScore: rarityScore,
    rarePatterns,
    strengthSignals,
    unusualCombinations,
    explorationStyle,
    differentiationNarrative: buildNarrative(rarityScore, explorationStyle, unusualCombinations, strengthSignals),
    advantageAreas,
    hiddenSignals,
    computedAt: Date.now(),
  };
}

export function loadUniqueness(): UniquenessData | null {
  return cached;
}

export function getUniqueness(): UniquenessData {
  if (cached && Date.now() - cached.computedAt < CACHE_TTL) {
    return cached;
  }
  cached = computeUniqueness();
  return cached;
}
