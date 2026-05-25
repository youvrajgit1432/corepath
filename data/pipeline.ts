/**
 * DATA PIPELINE — orchestrates all compute modules in dependency order
 *
 * This is the single entry point for computing all intelligence modules.
 * Data flows strictly downward through the pipeline — no module calls upward.
 *
 * Pipeline phases:
 *   1. Root modules          — Journey Memory, Decision Confidence, Future Self, etc.
 *   2. Dependent modules     — Career Story, Insight Vault, Coaching, Forecast, etc.
 *   3. Decision Intelligence — pass 1 (no synthesis data — uses defaults)
 *   4. Intelligence Synthesis — now has DI data from pass 1
 *   5. Decision Intelligence — pass 2 (now has real synthesis data)
 *
 * After pipeline completes, all module results are available via:
 *   import { getStored } from "./shared-context";
 *   const data = getStored<ModuleType>("module-key");
 *
 * No backend. No auth. Pure client-side computation.
 */

import { storeResult, clearSharedContext } from "./shared-context";

// ── Phase 1: Root modules ───────────────────────────────────────────
import { loadJourneyMemory } from "./journey-memory";
import { getDecisionConfidence } from "./decision-confidence";
import { getFutureSelf } from "./future-self";
import { getMissionIntelligence } from "./mission-intelligence";
import { loadEngagementPulse } from "./engagement-pulse";
import { getLearningFriction } from "./learning-friction";

// ── Phase 2: Dependent modules ──────────────────────────────────────
import { computeActionExecution } from "./action-execution";
import { computeCoachingIntelligence } from "./coaching-intelligence";
import { computeCareerStory } from "./career-story";
import { computeInsightVault } from "./insight-vault";
import { computeGrowthForecast } from "./growth-forecast";

// ── Phase 3-5: The circular pair ────────────────────────────────────
import { computeDecisionIntelligence } from "./decision-intelligence";
import { computeIntelligenceSynthesis } from "./intelligence-synthesis";

// ============================================================================
// PIPELINE STATE
// ============================================================================

let pipelineExecuted = false;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Ensure the full data pipeline has been executed.
 *
 * Safe to call multiple times — only executes once.
 * After execution, all module results are cached in the shared context store.
 *
 * @example
 *   import { ensurePipeline } from "@/data/pipeline";
 *   import { getStored } from "@/data/shared-context";
 *   import type { DecisionIntelligenceData } from "@/data/decision-intelligence";
 *
 *   useEffect(() => {
 *     ensurePipeline();
 *     const di = getStored<DecisionIntelligenceData>("decision-intelligence");
 *     setData(di);
 *   }, []);
 */
export function ensurePipeline(): void {
  if (pipelineExecuted) return;
  pipelineExecuted = true;

  // ── Phase 1: Root modules (zero dependencies on other pipeline modules) ──
  storeResult("journey-memory", loadJourneyMemory());
  storeResult("decision-confidence", getDecisionConfidence());
  storeResult("future-self", getFutureSelf());
  storeResult("mission-intelligence", getMissionIntelligence());
  storeResult("engagement-pulse", loadEngagementPulse());
  storeResult("learning-friction", getLearningFriction());

  // ── Phase 2: Modules that depend on Phase 1 (no circular deps) ──
  storeResult("action-execution", computeActionExecution());
  storeResult("coaching-intelligence", computeCoachingIntelligence());
  storeResult("career-story", computeCareerStory());
  storeResult("insight-vault", computeInsightVault());
  storeResult("growth-forecast", computeGrowthForecast());

  // ── Phase 3: Decision Intelligence (pass 1 — no synthesis available) ──
  // gatherContext() reads 'intelligence-synthesis' from store → undefined
  // → falls back to DEFAULT_SYNTHESIS (defined in decision-intelligence.ts)
  storeResult("decision-intelligence", computeDecisionIntelligence());

  // ── Phase 4: Intelligence Synthesis (now has DI data from Phase 3) ──
  storeResult("intelligence-synthesis", computeIntelligenceSynthesis());

  // ── Phase 5: Decision Intelligence (pass 2 — now has real synthesis data) ──
  storeResult("decision-intelligence", computeDecisionIntelligence());
}

/**
 * Reset the pipeline so it will re-execute on the next call to `ensurePipeline`.
 * Also clears the shared context store.
 * Useful for testing or when user data has changed.
 */
export function resetPipeline(): void {
  pipelineExecuted = false;
  clearSharedContext();
}
