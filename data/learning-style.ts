/**
 * ADAPTIVE LEARNING STYLE INTELLIGENCE
 *
 * Answers: "How does this person learn best?"
 *
 * Detects learning style, velocity, retention patterns, preferred difficulty,
 * optimal environment, attention patterns, and learning strengths.
 *
 * Reads from:
 *   personal-evolution    (evolutionScore, confidenceGrowth, milestoneMoments,
 *                           identityShift, interestEvolution)
 *   habit-intelligence    (habitScore, habitCandidates, breakingPatterns,
 *                           consistencySignals)
 *   learning-friction     (frictionScore, frictionAreas, stateLabel,
 *                           recoverySignals)
 *   engagement-pulse      (pulseScore, dimensions, fatigueSignals,
 *                           energyForecast)
 *   journey-memory        (completedQuizzes, quizDates, roadmapInteractions,
 *                           viewedCareerHistory, confidenceHistory)
 *   adaptive-roadmap      (accelerateSignals, difficultyAdjustment,
 *                           skipSuggestions, adaptiveWarnings)
 *
 * Behavior:
 *   High friction (frictionScore >= 50) → suggest smaller learning blocks
 *   High momentum (pulseScore >= 65 && habitScore >= 60) → increase challenge
 *
 * Persists via SafeStorage with 1-hour cache.
 * No backend. No auth.
 */

import { getPersonalEvolution, loadPersonalEvolution, type PersonalEvolutionData } from "./personal-evolution";
import { getHabitIntelligence, loadHabitIntelligence, type HabitIntelligenceData } from "./habit-intelligence";
import { getLearningFriction, loadLearningFriction, type LearningFrictionData } from "./learning-friction";
import { getEngagementPulse, loadEngagementPulse, type EngagementPulseData } from "./engagement-pulse";
import { loadJourneyMemory, type JourneyMemory } from "./journey-memory";
import { loadAdaptiveRoadmap, type AdaptiveRoadmapState } from "./adaptive-roadmap";
import { getSafeStorage } from "./safe-storage";

const STORAGE_KEY = "corepath-learning-style";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export type LearningStyleType =
  | "Exploratory Sequential"
  | "Focused Deep"
  | "Structured Repetition"
  | "Varied Discovery";

export type PreferredDifficulty = "easier" | "moderate" | "challenging";

export interface LearningStyleData {
  /** Primary learning style label */
  learningStyle: LearningStyleType;
  /** How quickly the user learns new career concepts (0–100) */
  learningVelocity: number;
  /** How the user retains and reinforces career knowledge */
  retentionPattern: string;
  /** Optimal difficulty level for learning tasks */
  preferredDifficulty: PreferredDifficulty;
  /** Optimal conditions for effective learning */
  learningEnvironment: string;
  /** How the user's attention/focus works during learning */
  attentionPattern: string;
  /** Key learning strengths derived from behavioral signals */
  learningStrengths: LearningStrength[];
  /** Narrative summary of learning style */
  learningNarrative: string;
  computedAt: string;
}

export interface LearningStrength {
  name: string;
  score: number; // 0–100
  evidence: string[];
}

// ============================================================================
// CONTEXT GATHERING
// ============================================================================

interface LearningContext {
  evolution: PersonalEvolutionData;
  habit: HabitIntelligenceData;
  friction: LearningFrictionData;
  pulse: EngagementPulseData;
  journey: JourneyMemory;
  roadmap: AdaptiveRoadmapState | null;
}

function gatherContext(): LearningContext {
  const evolution = loadPersonalEvolution() ?? getPersonalEvolution();
  const habit = loadHabitIntelligence() ?? getHabitIntelligence();
  const friction = loadLearningFriction() ?? getLearningFriction();
  const pulse = loadEngagementPulse() ?? getEngagementPulse();

  return {
    evolution,
    habit,
    friction,
    pulse,
    journey: loadJourneyMemory(),
    roadmap: loadAdaptiveRoadmap(),
  };
}

// ============================================================================
// LEARNING STYLE DETECTION
// ============================================================================

/**
 * Detect primary learning style from behavioral patterns.
 */
function detectLearningStyle(ctx: LearningContext): LearningStyleType {
  const { journey, friction, pulse, evolution } = ctx;

  // Quiz retake rate — high retakes suggest structured repetition style
  const retakeRate = journey.completedQuizzes > 0
    ? journey.uncertaintyPatterns.retakes / journey.completedQuizzes
    : 0;

  // Career view breadth
  const viewCount = Object.keys(journey.viewedCareers).length;

  // Consistency score
  const consistencyDim = pulse.dimensions.find((d) => d.name === "consistency_streak");
  const consistencyScore = consistencyDim?.score ?? 0;

  // Engagement depth
  const energyDim = pulse.dimensions.find((d) => d.name === "engagement_energy");
  const energyScore = energyDim?.score ?? 50;

  // Score each style
  const scores: Record<LearningStyleType, number> = {
    "Exploratory Sequential": 0,
    "Focused Deep": 0,
    "Structured Repetition": 0,
    "Varied Discovery": 0,
  };

  // — Exploratory Sequential: broad views + moderate consistency + moderate friction
  if (viewCount >= 8 && consistencyScore >= 40 && consistencyScore < 75) {
    scores["Exploratory Sequential"] += 30;
  }
  if (evolution.behaviorChanges.some((c) => c.includes("sampling broadly"))) {
    scores["Exploratory Sequential"] += 20;
  }
  if (friction.stateLabel === "progressing" && evolution.milestoneMoments.length >= 3) {
    scores["Exploratory Sequential"] += 15;
  }

  // — Focused Deep: high energy + high consistency + low friction + narrow views
  if (energyScore >= 65 && consistencyScore >= 65 && viewCount < 10) {
    scores["Focused Deep"] += 30;
  }
  if (evolution.behaviorChanges.some((c) => c.includes("concentrating"))) {
    scores["Focused Deep"] += 20;
  }
  if (friction.frictionScore < 30 && ctx.habit.habitScore >= 60) {
    scores["Focused Deep"] += 15;
  }

  // — Structured Repetition: high retake rate + consistent timing + moderate views
  if (retakeRate >= 0.2 && consistencyScore >= 40) {
    scores["Structured Repetition"] += 30;
  }
  if (journey.quizDates.length >= 3) {
    // Check for regular intervals
    const intervals: number[] = [];
    for (let i = 1; i < journey.quizDates.length; i++) {
      const diff = new Date(journey.quizDates[i]).getTime() - new Date(journey.quizDates[i - 1]).getTime();
      intervals.push(Math.round(diff / (1000 * 60 * 60 * 24)));
    }
    const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev <= 4 && intervals.length >= 2) {
      scores["Structured Repetition"] += 20;
    }
  }
  if (ctx.habit.habitCandidates.some((c) => c.id === "quiz-timing" && c.strength >= 50)) {
    scores["Structured Repetition"] += 15;
  }

  // — Varied Discovery: high view count + low consistency + low retakes + high pulse variation
  if (viewCount >= 12 && consistencyScore < 50 && retakeRate < 0.15) {
    scores["Varied Discovery"] += 30;
  }
  if (friction.stateLabel === "struggling" && evolution.interestEvolution.length >= 3) {
    scores["Varied Discovery"] += 15;
  }
  if (pulse.energyForecast === "sustained" && Object.keys(journey.roadmapInteractions).length >= 3) {
    scores["Varied Discovery"] += 15;
  }

  // Default bonus for clarity
  const roadmap = ctx.roadmap;
  if (roadmap && roadmap.accelerateSignals.length > 0) {
    scores["Focused Deep"] += 10;
    scores["Exploratory Sequential"] += 5;
  }

  // Pick highest scoring style
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const topScore = sorted[0][1];

  // Fallback when no detector scored
  if (topScore === 0) {
    if (consistencyScore >= 60) return "Focused Deep";
    if (viewCount >= 8) return "Exploratory Sequential";
    if (retakeRate >= 0.2) return "Structured Repetition";
    return "Varied Discovery";
  }

  return sorted[0][0] as LearningStyleType;
}

// ============================================================================
// LEARNING VELOCITY
// ============================================================================

/**
 * Compute learning velocity (0–100) from all signals.
 */
function computeLearningVelocity(ctx: LearningContext): number {
  let score = 30; // baseline

  // Evolution score contribution
  score += ctx.evolution.evolutionScore * 0.2;

  // Habit score contribution
  score += ctx.habit.habitScore * 0.15;

  // Pulse engagement energy
  const energyDim = ctx.pulse.dimensions.find((d) => d.name === "engagement_energy");
  if (energyDim) {
    score += energyDim.score * 0.15;
  }

  // Roadmap acceleration signals
  const roadmap = ctx.roadmap;
  if (roadmap && roadmap.accelerateSignals.length > 0) {
    const maxImpact = Math.max(...roadmap.accelerateSignals.map((s) => s.impact));
    score += maxImpact * 20;
  }

  // Confidence growth contribution
  if (ctx.evolution.confidenceGrowth > 5) {
    score += 10;
  } else if (ctx.evolution.confidenceGrowth > 0) {
    score += 5;
  }

  // Milestone momentum
  const milestoneCount = ctx.evolution.milestoneMoments.length;
  score += Math.min(10, milestoneCount * 2);

  // Consistency bonus
  const consistencyDim = ctx.pulse.dimensions.find((d) => d.name === "consistency_streak");
  if (consistencyDim && consistencyDim.score >= 60) {
    score += 8;
  }

  // Fatigue penalty
  const highFatigue = ctx.pulse.fatigueSignals.filter((f) => f.severity === "high").length;
  score -= highFatigue * 8;

  // High friction penalty
  if (ctx.friction.frictionScore >= 50) {
    score -= 10;
  } else if (ctx.friction.frictionScore >= 30) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// RETENTION PATTERN
// ============================================================================

/**
 * Detect how the user retains and reinforces learning.
 */
function detectRetentionPattern(ctx: LearningContext): string {
  const { journey, friction, habit } = ctx;

  // Quiz retake pattern
  const retakeCount = journey.uncertaintyPatterns.retakes;
  const quizCount = journey.completedQuizzes;
  const retakeRate = quizCount > 0 ? retakeCount / quizCount : 0;

  // Check for regular quiz intervals (structured reinforcement)
  const dates = journey.quizDates;
  let hasRegularIntervals = false;
  if (dates.length >= 3) {
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const diff = new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime();
      intervals.push(Math.round(diff / (1000 * 60 * 60 * 24)));
    }
    const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    hasRegularIntervals = stdDev <= 4 && intervals.length >= 2;
  }

  // High retake rate → reteach / spaced repetition pattern
  if (retakeRate >= 0.3) {
    return "Spaced Repetition: You naturally revisit concepts through repeated quiz sessions. Retaking helps reinforce understanding and build confidence over time.";
  }

  // Regular intervals → consistent reinforcement
  if (hasRegularIntervals) {
    return "Consistent Reinforcement: You maintain regular check-ins with career exploration, reinforcing learning at steady intervals — ideal for long-term retention.";
  }

  // Low retakes + high views → breadth-first retention
  if (retakeRate < 0.1 && Object.keys(journey.viewedCareers).length >= 6) {
    return "Breadth-First Retention: You retain more when exploring a wide range of options, building a mental map of career possibilities through variety.";
  }

  // High habit strength → habit-based retention
  if (habit.habitScore >= 60) {
    return "Habit-Based Retention: Your strong routines ensure consistent learning. Habits act as anchors that reinforce career knowledge through repetition.";
  }

  // Low friction → smooth absorption
  if (friction.frictionScore < 30) {
    return "Smooth Absorption: Low learning friction means you absorb and retain information easily with minimal resistance or frustration.";
  }

  // Fallback
  if (quizCount <= 1) {
    return "Emerging Pattern: Your retention style is still forming. More quiz sessions and career exploration will reveal how you best reinforce learning.";
  }

  return "Active Recall: You learn effectively through active engagement — quizzes, comparisons, and roadmap exploration reinforce your understanding.";
}

// ============================================================================
// PREFERRED DIFFICULTY
// ============================================================================

/**
 * Detect the optimal difficulty level for learning tasks.
 */
function detectPreferredDifficulty(ctx: LearningContext): PreferredDifficulty {
  const { friction, pulse, habit, evolution } = ctx;

  // High friction → easier
  if (friction.frictionScore >= 50) return "easier";

  // Low engagement → easier
  if (pulse.pulseScore < 40) return "easier";

  // High momentum + strong habits + high evolution → challenging
  if (pulse.pulseScore >= 65 && habit.habitScore >= 60 && evolution.evolutionScore >= 60) {
    return "challenging";
  }

  // Moderate momentum → moderate
  return "moderate";
}

// ============================================================================
// LEARNING ENVIRONMENT
// ============================================================================

/**
 * Describe optimal learning environment based on signals.
 */
function detectLearningEnvironment(ctx: LearningContext): string {
  const { pulse, friction, habit, journey } = ctx;
  const parts: string[] = [];

  // Fatigue signals — suggest lower pressure
  const highFatigue = pulse.fatigueSignals.filter((f) => f.severity === "high").length;
  if (highFatigue >= 2) {
    parts.push("Low-pressure, low-stakes sessions");
  } else if (highFatigue >= 1) {
    parts.push("Moderate-paced sessions with breaks");
  } else {
    parts.push("Structured sessions with clear goals");
  }

  // Energy forecast
  if (pulse.energyForecast === "declining") {
    parts.push("shorter time blocks (15–20 min)");
  } else if (pulse.energyForecast === "sustained") {
    parts.push("extended focus blocks (30–45 min)");
  } else if (pulse.energyForecast === "recovering") {
    parts.push("gradually increasing session lengths");
  }

  // Friction-based environment
  if (friction.frictionScore >= 50) {
    parts.push("minimal distractions");
    parts.push("low-commitment starting tasks");
  } else if (friction.frictionScore < 30) {
    parts.push("opportunities to dive deep");
  }

  // Consistency pattern
  const consistencyDim = pulse.dimensions.find((d) => d.name === "consistency_streak");
  if (consistencyDim && consistencyDim.score >= 60) {
    parts.push("consistent daily or every-other-day rhythm");
  } else if (consistencyDim && consistencyDim.score < 40) {
    parts.push("flexible scheduling to reduce pressure");
  }

  // Exploration breadth signal
  if (Object.keys(journey.viewedCareers).length >= 10) {
    parts.push("varied content to sustain interest");
  }

  // Notification load adjustment
  if (pulse.notificationLoad === "high") {
    parts.push("cleared notifications before focus sessions");
  }

  // Build sentence
  const joined = parts.join(", ");
  return `You learn best in ${joined}.`;
}

// ============================================================================
// ATTENTION PATTERN
// ============================================================================

/**
 * Detect attention/focus pattern from behavioral data.
 */
function detectAttentionPattern(ctx: LearningContext): string {
  const { pulse, journey, friction } = ctx;

  const energyDim = pulse.dimensions.find((d) => d.name === "engagement_energy");
  const energyScore = energyDim?.score ?? 50;

  const consistencyDim = pulse.dimensions.find((d) => d.name === "consistency_streak");
  const consistencyScore = consistencyDim?.score ?? 50;

  // High energy + high consistency → deep focus
  if (energyScore >= 65 && consistencyScore >= 65) {
    return "Deep Focus: You sustain attention well over multiple sessions. Your engagement is consistently strong, enabling deep dives into career exploration.";
  }

  // High energy + low consistency → sprint pattern
  if (energyScore >= 65 && consistencyScore < 40) {
    return "Sprint Pattern: You engage intensely in bursts but may struggle to maintain daily rhythm. Focus on capturing momentum during high-energy windows.";
  }

  // Low energy + high consistency → steady
  if (energyScore < 45 && consistencyScore >= 60) {
    return "Steady Engagement: You maintain consistent, moderate engagement. Your reliable rhythm compensates for lower peak intensity, building compound progress.";
  }

  // High friction → scattered
  if (friction.frictionScore >= 50) {
    return "Recovering Focus: Learning friction scatters your attention. Small, easy wins help rebuild focus — reduce session scope until momentum returns.";
  }

  // Moderate everything → balanced
  if (energyScore >= 40 && consistencyScore >= 40) {
    return "Balanced Attention: You maintain a healthy mix of engagement depth and consistency. Your attention adapts well to different types of learning tasks.";
  }

  // Low everything → rebuilding
  return "Rebuilding Attention: Your focus patterns are still developing. Start with very short sessions (5–10 minutes) and gradually extend as consistency improves.";
}

// ============================================================================
// LEARNING STRENGTHS
// ============================================================================

/**
 * Detect key learning strengths from all available signals.
 */
function detectLearningStrengths(ctx: LearningContext): LearningStrength[] {
  const strengths: LearningStrength[] = [];

  // 1. Consistency strength
  const consistencyDim = ctx.pulse.dimensions.find((d) => d.name === "consistency_streak");
  if (consistencyDim && consistencyDim.score >= 50) {
    const evidence = consistencyDim.signals.slice(0, 2);
    strengths.push({
      name: "Consistent Engagement",
      score: consistencyDim.score,
      evidence: evidence.length > 0 ? evidence : ["Regular engagement pattern detected"],
    });
  }

  // 2. Habit strength
  if (ctx.habit.habitScore >= 45) {
    const topHabits = ctx.habit.habitCandidates
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 2)
      .map((h) => h.habit);
    strengths.push({
      name: "Habit Building",
      score: ctx.habit.habitScore,
      evidence: topHabits.length > 0
        ? [`Strong habits: ${topHabits.join(", ")}`]
        : ["Developing effective routines"],
    });
  }

  // 3. Exploration breadth
  const viewCount = Object.keys(ctx.journey.viewedCareers).length;
  if (viewCount >= 6) {
    strengths.push({
      name: "Exploration Breadth",
      score: Math.min(100, viewCount * 7),
      evidence: [`Explored ${viewCount} different careers`, "Broad awareness building"],
    });
  }

  // 4. Quiz resilience (retakes show persistence)
  if (ctx.journey.completedQuizzes >= 3) {
    const quizScore = Math.min(100, 40 + ctx.journey.completedQuizzes * 8);
    strengths.push({
      name: "Self-Assessment Persistence",
      score: quizScore,
      evidence: [`Completed ${ctx.journey.completedQuizzes} quiz sessions`, "Consistent self-evaluation"],
    });
  }

  // 5. Roadmap engagement
  const roadmapCount = Object.keys(ctx.journey.roadmapInteractions).length;
  if (roadmapCount >= 2) {
    strengths.push({
      name: "Roadmap Navigation",
      score: Math.min(100, 30 + roadmapCount * 12),
      evidence: [`Engaged with ${roadmapCount} career roadmaps`, "Active path planning"],
    });
  }

  // 6. Recovery ability (from friction recovery signals)
  if (ctx.friction.recoverySignals.length >= 2) {
    const recoveryScore = Math.min(100, 40 + ctx.friction.recoverySignals.length * 10);
    strengths.push({
      name: "Learning Resilience",
      score: recoveryScore,
      evidence: ctx.friction.recoverySignals.slice(0, 2).map((r) => r.signal),
    });
  }

  // 7. Growth trajectory
  if (ctx.evolution.confidenceGrowth > 3) {
    strengths.push({
      name: "Growth Orientation",
      score: Math.min(100, Math.round(50 + ctx.evolution.confidenceGrowth * 3)),
      evidence: [`Confidence grew by ${ctx.evolution.confidenceGrowth} points`, "Expanding self-awareness"],
    });
  }

  // Sort by score descending
  strengths.sort((a, b) => b.score - a.score);
  return strengths.slice(0, 6);
}

// ============================================================================
// NARRATIVE
// ============================================================================

/**
 * Build a holistic learning narrative.
 */
function buildLearningNarrative(
  learningStyle: LearningStyleType,
  learningVelocity: number,
  retentionPattern: string,
  preferredDifficulty: PreferredDifficulty,
  attentionPattern: string,
  strengths: LearningStrength[],
  ctx: LearningContext
): string {
  const parts: string[] = [];
  const { friction, pulse, habit } = ctx;

  // Opening with learning style
  parts.push(
    `Your learning style is **${learningStyle}**, with a learning velocity of **${learningVelocity}/100**.`
  );

  // Retention highlight
  const retentionShort = retentionPattern.split(":")[0];
  parts.push(`You retain best through **${retentionShort.toLowerCase()}**`);

  // Difficulty preference
  if (preferredDifficulty === "challenging") {
    parts.push("and you're ready to **increase challenge** in your learning tasks.");
  } else if (preferredDifficulty === "easier") {
    parts.push("and **smaller, low-commitment blocks** will help you maintain progress.");
  } else {
    parts.push("and you thrive best with **moderate, manageable challenges**.");
  }

  // Attention pattern highlight
  const attentionShort = attentionPattern.split(":")[0];
  parts.push(`Your attention pattern is **${attentionShort}** — ${attentionPattern.split(":")[1]?.trim().toLowerCase() ?? "adaptable to different task types"}.`);

  // Strengths highlight
  if (strengths.length > 0) {
    const topStrength = strengths[0];
    parts.push(`Your strongest learning capability is **${topStrength.name}** (${topStrength.score}/100).`);
  }

  // Behavior-specific messaging
  if (friction.frictionScore >= 50) {
    parts.push(
      "Since learning friction is elevated, focus on **smaller learning blocks** — short quizzes, single career comparisons, or 5-minute roadmap reviews. The goal is consistency over depth until friction decreases."
    );
  }

  if (pulse.pulseScore >= 65 && habit.habitScore >= 60) {
    parts.push(
      "You're in a **high-momentum learning zone** — your habits and engagement are strong enough to handle increased challenge. Consider tackling harder comparisons, deeper roadmap dives, or stretch learning tasks."
    );
  }

  // Closing
  if (learningVelocity >= 65) {
    parts.push("Your learning velocity is strong — you're absorbing career intelligence efficiently. Keep the momentum going with increasingly focused exploration.");
  } else if (learningVelocity >= 40) {
    parts.push("Your learning velocity is building steadily. Consistent engagement will accelerate your career intelligence growth over time.");
  } else {
    parts.push("Your learning velocity is in its early stages. Start with small, repeatable actions — each one builds momentum for faster learning.");
  }

  return parts.join(" ");
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Compute a full learning style assessment from all available data sources.
 */
export function computeLearningStyle(): LearningStyleData {
  const ctx = gatherContext();

  const learningStyle = detectLearningStyle(ctx);
  const learningVelocity = computeLearningVelocity(ctx);
  const retentionPattern = detectRetentionPattern(ctx);
  const preferredDifficulty = detectPreferredDifficulty(ctx);
  const learningEnvironment = detectLearningEnvironment(ctx);
  const attentionPattern = detectAttentionPattern(ctx);
  const learningStrengths = detectLearningStrengths(ctx);

  const learningNarrative = buildLearningNarrative(
    learningStyle,
    learningVelocity,
    retentionPattern,
    preferredDifficulty,
    attentionPattern,
    learningStrengths,
    ctx
  );

  const result: LearningStyleData = {
    learningStyle,
    learningVelocity,
    retentionPattern,
    preferredDifficulty,
    learningEnvironment,
    attentionPattern,
    learningStrengths,
    learningNarrative,
    computedAt: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, result);

  return result;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Load the most recently computed learning style assessment.
 * Returns null if stale (>1 hour) or never computed.
 */
export function loadLearningStyle(): LearningStyleData | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<LearningStyleData>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.computedAt).getTime();
  if (elapsed > CACHE_TTL) return null;

  return cached;
}

/**
 * Get the current learning style assessment, computing fresh if needed.
 */
export function getLearningStyle(): LearningStyleData {
  const existing = loadLearningStyle();
  if (existing) return existing;
  return computeLearningStyle();
}
