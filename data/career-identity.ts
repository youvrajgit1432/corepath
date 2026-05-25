/**
 * CAREER IDENTITY INTELLIGENCE
 *
 * Generates a persistent identity profile summarizing the user's evolving
 * career journey — archetype, strengths, growth style, and AI-era positioning.
 *
 * Sources: journey-memory (themes, categories), quiz-enhanced (traits),
 *          achievements (level, XP), growth-analytics (trends), career-progress
 * Persists: identity state via SafeStorage (local storage)
 * No backend. No auth.
 */

import { getSafeStorage } from "./safe-storage";
import { loadJourneyMemory } from "./journey-memory";
import { loadAchievements, computeAchievements } from "./achievement-engine";
import { getGrowthAnalytics } from "./growth-analytics";
import { loadCareerProgress, computeCareerProgress } from "./career-progress";
import type { ExtendedTrait, ExtendedTraitScores } from "./quiz-enhanced";

const STORAGE_KEY = "corepath-career-identity";

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type CareerArchetype =
  | "architect"
  | "innovator"
  | "researcher"
  | "strategist"
  | "builder"
  | "navigator"
  | "explorer";

export type GrowthStyle = "focused-deep-diver" | "broad-explorer" | "balanced-navigator";
export type FocusPattern = "niche-specialist" | "broad-generalist" | "focused-explorer";

export interface CareerIdentity {
  /** Synthesized title: "Lv.3 Analytics Architect" */
  identityTitle: string;
  /** Career archetype based on theme/strength patterns */
  careerArchetype: CareerArchetype;
  /** Top 3–4 dominant strengths from the enhanced profile */
  dominantStrengths: string[];
  /** How the user grows: deep-diver, explorer, or navigator */
  growthStyle: GrowthStyle;
  /** Breadth/depth of career exploration */
  focusPattern: FocusPattern;
  /** 2–3 sentence narrative summary */
  careerPersonaSummary: string;
  /** How the user's profile fits into the AI-transformed career landscape */
  careerEraPositioning: string;
  /** Last computed timestamp */
  computedAt: string;
}

// ============================================================================
// ARCHETYPE DEFINITIONS
// ============================================================================

interface ArchetypeDef {
  id: CareerArchetype;
  label: string;
  icon: string;
  description: string;
  /** Theme signal weights (0–1) */
  themeWeights: Partial<Record<string, number>>;
  /** Trait signal weights (0–1) */
  traitWeights: Partial<Record<string, number>>;
}

const ARCHETYPES: ArchetypeDef[] = [
  {
    id: "architect",
    label: "Architect",
    icon: "🏗️",
    description: "You think in systems and structures. Your strength lies in designing scalable, reliable foundations.",
    themeWeights: { systems: 1, infrastructure: 1, ops: 0.7 },
    traitWeights: { "systems-thinking": 1, "technical-depth": 0.8, "deep-work": 0.6 },
  },
  {
    id: "innovator",
    label: "Innovator",
    icon: "💡",
    description: "You're drawn to what's next. AI, experimentation, and creative problem-solving define your edge.",
    themeWeights: { ai: 1, research: 0.5, product: 0.3 },
    traitWeights: { "AI-curiosity": 1, "AI-builder": 1, creativity: 0.8, experimentation: 0.7 },
  },
  {
    id: "researcher",
    label: "Researcher",
    icon: "🔬",
    description: "You lead with curiosity and analysis. Deep investigation and evidence-based thinking guide your path.",
    themeWeights: { research: 1, data: 0.8, systems: 0.3 },
    traitWeights: { "research-orientation": 1, "learning-velocity": 0.8, "ambiguity-tolerance": 0.6 },
  },
  {
    id: "strategist",
    label: "Strategist",
    icon: "♟️",
    description: "You see the big picture. Product sense, leadership, and people awareness drive your career decisions.",
    themeWeights: { product: 1, governance: 0.5, design: 0.4 },
    traitWeights: { leadership: 1, "people-orientation": 0.8, "future-orientation": 0.7 },
  },
  {
    id: "builder",
    label: "Builder",
    icon: "🛠️",
    description: "You make things real. Technical depth, execution focus, and hands-on craftsmanship are your trademarks.",
    themeWeights: { infrastructure: 0.8, ops: 0.6, systems: 0.5 },
    traitWeights: { "technical-depth": 1, "execution-speed": 0.7, "deep-work": 0.8, optimization: 0.6 },
  },
  {
    id: "navigator",
    label: "Navigator",
    icon: "🧭",
    description: "You explore with intention. Balanced across multiple domains, you're building a versatile career map.",
    themeWeights: {},
    traitWeights: { adaptability: 1, "learning-velocity": 0.7, "future-orientation": 0.6 },
  },
  {
    id: "explorer",
    label: "Explorer",
    icon: "🌍",
    description: "You're at the start of your journey. Every quiz, view, and comparison adds a new coordinate to your map.",
    themeWeights: {},
    traitWeights: {},
  },
];

// ============================================================================
// IDENTITY COMPUTATION
// ============================================================================

function computeArchetype(
  memory: ReturnType<typeof loadJourneyMemory>,
  traits?: ExtendedTraitScores
): CareerArchetype {
  const themeCounts = memory.repeatedThemes;
  const totalThemes = Object.values(themeCounts).reduce((a, b) => a + b, 0);

  // New / low-activity users default to explorer
  if (totalThemes < 2 && !traits) return "explorer";
  if (memory.completedQuizzes === 0 && totalThemes < 3) return "explorer";

  // Score each archetype
  const scores = ARCHETYPES.map((arch) => {
    let score = 0;

    // Theme matching
    for (const [theme, weight] of Object.entries(arch.themeWeights)) {
      const count = themeCounts[theme as keyof typeof themeCounts] ?? 0;
      score += count * weight;
    }

    // Trait matching (if enhanced profile exists)
    if (traits) {
      for (const [trait, weight] of Object.entries(arch.traitWeights)) {
        const value = traits[trait as ExtendedTrait] ?? 0;
        score += value * weight * 10; // scale trait values (0–1) to match theme counts
      }
    }

    return { archetype: arch.id, score };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // If top score is very low (tie threshold), use navigator
  if (scores[0].score < 1) return "navigator";

  return scores[0].archetype;
}

function computeDominantStrengths(
  traits?: ExtendedTraitScores
): string[] {
  if (!traits) return [];

  const strengthLabels: Record<string, string> = {
    "systems-thinking": "Systems Thinking",
    abstraction: "Abstraction",
    "ambiguity-tolerance": "Ambiguity Tolerance",
    "deep-work": "Deep Work",
    experimentation: "Experimentation",
    optimization: "Optimization",
    "execution-speed": "Execution Speed",
    "research-orientation": "Research Orientation",
    "people-orientation": "People Orientation",
    autonomy: "Autonomy",
    "risk-tolerance": "Risk Tolerance",
    "stability-preference": "Stability Preference",
    creativity: "Creativity",
    "technical-depth": "Technical Depth",
    "visual-thinking": "Visual Thinking",
    "operational-thinking": "Operational Thinking",
    leadership: "Leadership",
    adaptability: "Adaptability",
    "learning-velocity": "Learning Velocity",
    "future-orientation": "Future Orientation",
    "AI-curiosity": "AI Curiosity",
    "AI-builder": "AI Builder",
    "AI-user": "AI User",
  };

  return Object.entries(traits)
    .filter(([, v]) => v >= 0.55)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([key]) => strengthLabels[key] ?? key);
}

function computeGrowthStyle(trend: string): GrowthStyle {
  switch (trend) {
    case "deepening":
      return "focused-deep-diver";
    case "broadening":
      return "broad-explorer";
    default:
      return "balanced-navigator";
  }
}

function computeFocusPattern(
  memory: ReturnType<typeof loadJourneyMemory>,
  archetype: CareerArchetype
): FocusPattern {
  if (archetype === "explorer") return "broad-generalist";

  const viewedCount = Object.keys(memory.viewedCareers).length;
  const categoriesCount = Object.keys(memory.favoriteCategories).length;

  if (viewedCount <= 5) return "niche-specialist";
  if (viewedCount >= 15) return "broad-generalist";
  return "focused-explorer";
}

function computeEraPositioning(
  archetype: CareerArchetype,
  memory: ReturnType<typeof loadJourneyMemory>,
  traits?: ExtendedTraitScores
): string {
  const aiInterest =
    memory.aiInterestSignals.careerViews +
    memory.aiInterestSignals.compareActions +
    memory.aiInterestSignals.recommendations;
  const aiTraitScore = traits
    ? (traits["AI-curiosity"] ?? 0) + (traits["AI-builder"] ?? 0) + (traits["AI-user"] ?? 0)
    : 0;

  if (aiInterest >= 3 || aiTraitScore > 1.5) {
    return "You are well-positioned for the AI-transformed career landscape. Your profile shows strong alignment with emerging roles that blend human judgment with AI-augmented workflows.";
  }

  if (aiInterest >= 1 || aiTraitScore > 0.5) {
    return "You're beginning to engage with AI-related areas. In the AI era, this awareness will become increasingly valuable as technical and hybrid roles evolve.";
  }

  switch (archetype) {
    case "architect":
      return "In the AI era, architecture and systems thinking are invaluable — AI needs humans who can design the structures it operates within.";
    case "builder":
      return "The AI era amplifies builders. Your hands-on technical skills are the foundation for creating, deploying, and maintaining AI-augmented systems.";
    case "researcher":
      return "Research skills are at a premium in the AI era — critical thinking, evaluation, and evidence-based insight guide responsible AI adoption.";
    case "strategist":
      return "Strategic thinking is essential in the AI era — leaders who can align human goals with AI capabilities will define the next wave of innovation.";
    case "innovator":
      return "The AI era is your arena. Your comfort with experimentation and emerging technology positions you at the frontier of what's possible.";
    default:
      return "Every career is being reshaped by AI. Your exploration journey is building the adaptability needed to navigate this transformation.";
  }
}

function computePersonaSummary(
  archetype: CareerArchetype,
  strengths: string[],
  growthStyle: GrowthStyle,
  focusPattern: FocusPattern,
  level: number,
  milestones: number
): string {
  const archDef = ARCHETYPES.find((a) => a.id === archetype)!;
  const styleLabel =
    growthStyle === "focused-deep-diver"
      ? "deepening your focus"
      : growthStyle === "broad-explorer"
        ? "exploring broadly"
        : "maintaining a balanced approach";
  const focusLabel =
    focusPattern === "niche-specialist"
      ? "concentrated in specific career areas"
      : focusPattern === "broad-generalist"
        ? "spanning multiple career domains"
        : "targeted across related fields";
  const milestoneNote =
    level >= 3
      ? ` At Level ${level}, you've built meaningful career intelligence.`
      : level >= 1
        ? ` You're at Level ${level}, building career intelligence with each session.`
        : "";

  return (
    `You're a ${archDef.label.toLowerCase()} — ${archDef.description.toLowerCase().split("you")[1]?.trim() ?? archDef.description}. ` +
    `Your growth pattern shows you ${styleLabel}, with exploration ${focusLabel}.` +
    milestoneNote
  );
}

function computeIdentityTitle(
  level: number,
  archetype: CareerArchetype,
  xp: number
): string {
  const archLabel = ARCHETYPES.find((a) => a.id === archetype)?.label ?? "Explorer";
  if (level <= 1) return `Lv.${level} ${archLabel}`;
  if (level <= 3) return `Lv.${level} Rising ${archLabel}`;
  if (level <= 5) return `Lv.${level} Seasoned ${archLabel}`;
  return `Lv.${level} Master ${archLabel}`;
}

// ============================================================================
// CACHE
// ============================================================================

let cachedTraits: ExtendedTraitScores | undefined = undefined;

/**
 * Seed the identity computation with enhanced profile traits.
 * Call this from the component when an EnhancedProfile is available.
 */
export function seedIdentityTraits(traits: ExtendedTraitScores): void {
  cachedTraits = traits;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Compute full career identity from current data sources.
 */
export function computeCareerIdentity(): CareerIdentity {
  const memory = loadJourneyMemory();
  const achievements = loadAchievements() ?? computeAchievements();
  const progress = loadCareerProgress() ?? computeCareerProgress();
  const growth = getGrowthAnalytics();
  const traits = cachedTraits;

  const archetype = computeArchetype(memory, traits);
  const strengths = computeDominantStrengths(traits);
  const growthStyle = computeGrowthStyle(growth.specializationTrend);
  const focusPattern = computeFocusPattern(memory, archetype);
  const title = computeIdentityTitle(achievements.level, archetype, achievements.xp);
  const summary = computePersonaSummary(
    archetype,
    strengths,
    growthStyle,
    focusPattern,
    achievements.level,
    progress.milestonesCompleted
  );
  const positioning = computeEraPositioning(archetype, memory, traits);

  const identity: CareerIdentity = {
    identityTitle: title,
    careerArchetype: archetype,
    dominantStrengths: strengths,
    growthStyle,
    focusPattern,
    careerPersonaSummary: summary,
    careerEraPositioning: positioning,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, identity);

  return identity;
}

/**
 * Load previously computed career identity from cache.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadCareerIdentity(): CareerIdentity | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<CareerIdentity>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > 60 * 60 * 1000) return null;

  return cached;
}

/**
 * Get career identity, computing fresh if needed.
 */
export function getCareerIdentity(): CareerIdentity {
  const existing = loadCareerIdentity();
  if (existing) return existing;
  return computeCareerIdentity();
}

/**
 * Format an archetype for display.
 */
export function formatArchetype(archetype: CareerArchetype): { label: string; icon: string; description: string } {
  const def = ARCHETYPES.find((a) => a.id === archetype)!;
  return { label: def.label, icon: def.icon, description: def.description };
}

/**
 * Format growth style as a readable label.
 */
export function formatGrowthStyle(style: GrowthStyle): string {
  const labels: Record<GrowthStyle, string> = {
    "focused-deep-diver": "Focused Deep-Diver",
    "broad-explorer": "Broad Explorer",
    "balanced-navigator": "Balanced Navigator",
  };
  return labels[style];
}

/**
 * Format focus pattern as a readable label.
 */
export function formatFocusPattern(pattern: FocusPattern): string {
  const labels: Record<FocusPattern, string> = {
    "niche-specialist": "Niche Specialist",
    "broad-generalist": "Broad Generalist",
    "focused-explorer": "Focused Explorer",
  };
  return labels[pattern];
}

/**
 * Build a plain-text snapshot string for sharing.
 */
export function buildIdentitySnapshot(identity: CareerIdentity): string {
  const arch = formatArchetype(identity.careerArchetype);
  const style = formatGrowthStyle(identity.growthStyle);
  const focus = formatFocusPattern(identity.focusPattern);
  const strengths = identity.dominantStrengths.join(", ");

  return [
    `🎯 ${identity.identityTitle}`,
    `${arch.icon} ${arch.label}`,
    `Growth: ${style} · Focus: ${focus}`,
    strengths ? `Strengths: ${strengths}` : null,
    ``,
    identity.careerPersonaSummary,
    ``,
    identity.careerEraPositioning,
  ]
    .filter(Boolean)
    .join("\n");
}
