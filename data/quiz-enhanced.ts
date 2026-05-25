import { calculateTraitScores } from "./quiz";
import type { TraitScores as OldTraitScores } from "./quiz";

export type ExtendedTrait =
  | "systems-thinking"
  | "abstraction"
  | "ambiguity-tolerance"
  | "deep-work"
  | "experimentation"
  | "optimization"
  | "execution-speed"
  | "research-orientation"
  | "people-orientation"
  | "autonomy"
  | "risk-tolerance"
  | "stability-preference"
  | "creativity"
  | "technical-depth"
  | "visual-thinking"
  | "operational-thinking"
  | "leadership"
  | "adaptability"
  | "learning-velocity"
  | "future-orientation"
  | "AI-curiosity"
  | "AI-builder"
  | "AI-user";

export type EnhancedProfile = {
  extended: ExtendedTraitScores;
  confidence: number;
  contradictions: Array<{ pair: [ExtendedTrait, ExtendedTrait]; vals: [number, number] }>;
  specializationDepth: number;
  narrative: string[];
  recommendations: string[];
};

export type ExtendedTraitScores = Record<ExtendedTrait, number>;

const EXTENDED_KEYS: ExtendedTrait[] = [
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

function zeroed(): ExtendedTraitScores {
  return EXTENDED_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as ExtendedTraitScores);
}

function mapOldToExtended(old: OldTraitScores): ExtendedTraitScores {
  // Old keys: analytical, creativity, technical-depth, leadership, social, structure, risk-tolerance, visual
  const e = zeroed();
  // Direct mappings
  e["creativity"] += old.creativity || 0;
  e["technical-depth"] += old["technical-depth"] || 0;
  e["leadership"] += old.leadership || 0;
  e["people-orientation"] += old.social || 0;
  e["operational-thinking"] += old.structure || 0;
  e["risk-tolerance"] += old["risk-tolerance"] || 0;
  e["visual-thinking"] += old.visual || 0;

  // Split analytical into abstraction and systems-thinking
  e["abstraction"] += (old.analytical || 0) * 0.6;
  e["systems-thinking"] += (old.analytical || 0) * 0.4;

  // Derive deep-work from structure + technical-depth
  e["deep-work"] += ((old.structure || 0) + (old["technical-depth"] || 0)) * 0.5;

  // experimentation signal from creativity + analytical
  e["experimentation"] += ((old.creativity || 0) + (old.analytical || 0)) * 0.3;

  // research orientation from analytical and technical depth
  e["research-orientation"] += ((old.analytical || 0) + (old["technical-depth"] || 0)) * 0.5;

  // optimization from precision of structure and analytical
  e["optimization"] += ((old.structure || 0) + (old.analytical || 0)) * 0.4;

  // learning velocity as a weak aggregate
  e["learning-velocity"] += ((old.analytical || 0) + (old.creativity || 0)) * 0.2;

  return normalizeExtended(e);
}

function normalizeExtended(raw: ExtendedTraitScores): ExtendedTraitScores {
  const max = Math.max(...Object.values(raw), 1);
  const out: ExtendedTraitScores = {} as ExtendedTraitScores;
  for (const k of EXTENDED_KEYS) out[k] = Math.round(((raw[k] || 0) / max) * 100) / 100;
  return out;
}

const CONTRADICTORY_PAIRS: Array<[ExtendedTrait, ExtendedTrait]> = [
  ["stability-preference", "risk-tolerance"],
  ["deep-work", "execution-speed"],
  ["experimentation", "stability-preference"],
];

export function detectContradictions(ext: ExtendedTraitScores, threshold = 0.6) {
  const hits: Array<{ pair: [ExtendedTrait, ExtendedTrait]; vals: [number, number] }> = [];
  for (const [a, b] of CONTRADICTORY_PAIRS) {
    const va = ext[a] ?? 0;
    const vb = ext[b] ?? 0;
    if (va >= threshold && vb >= threshold) hits.push({ pair: [a, b], vals: [va, vb] });
  }
  return hits;
}

export function specializationDepth(ext: ExtendedTraitScores) {
  const vals = Object.values(ext);
  const sumSquares = vals.reduce((s, v) => s + v * v, 0);
  return Math.min(1, sumSquares / vals.length);
}

export function confidenceScore(ext: ExtendedTraitScores) {
  const vals = Object.values(ext).slice();
  vals.sort((a, b) => b - a);
  const top = vals[0] ?? 0;
  const second = vals[1] ?? 0;
  return Math.round(Math.max(0, (top - second) * 100));
}

export function calculateEnhancedProfile(answers: Record<string, string>) {
  // Start from the existing normalized old trait vector
  const oldNorm = calculateTraitScores(answers);
  const extended = mapOldToExtended(oldNorm);
  const conf = confidenceScore(extended);
  const contradictions = detectContradictions(extended);
  const depth = specializationDepth(extended);

  const top = Object.entries(extended).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => ({ trait: k, value: v }));

  const narrative: string[] = [];
  if (top.length) narrative.push(`Top signals: ${top.map((t) => t.trait).join(", ")}.`);
  if (contradictions.length) narrative.push("Detected contradictory preferences — we include reconciled guidance.");
  if (depth > 0.25) narrative.push("You show a specialization tilt; consider a focused path.");
  else narrative.push("Your profile is broad; try exploratory projects before deep specialization.");

  // Simple recommendations
  const recommendations: string[] = [];
  if (extended["AI-curiosity"] > 0.5 || extended["AI-builder"] > 0.5) {
    recommendations.push("Pursue AI-augmented engineering tracks; focus on productionizing models and tooling.");
  }
  if (extended["deep-work"] > 0.6 && extended["technical-depth"] > 0.5) {
    recommendations.push("Specialize: deep technical systems roles will yield leverage.");
  }
  if (contradictions.length) recommendations.push("You have mixed signals — consider hybrid roles that reconcile stability and growth.");

  return {
    extended,
    confidence: conf,
    contradictions,
    specializationDepth: depth,
    narrative,
    recommendations,
  };
}
