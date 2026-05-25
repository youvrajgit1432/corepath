import { calculateEnhancedProfile, type ExtendedTrait } from "./quiz-enhanced";
import type { Question } from "./quizQuestions";

type SignalHint = ExtendedTrait | "clarifying";

type QuestionSignalMap = Record<string, Array<{ trait: SignalHint; weight: number }>>;

const QUESTION_SIGNALS: QuestionSignalMap = {
  q1: [
    { trait: "systems-thinking", weight: 0.6 },
    { trait: "operational-thinking", weight: 0.4 },
  ],
  q2: [
    { trait: "AI-curiosity", weight: 0.6 },
    { trait: "experimentation", weight: 0.3 },
    { trait: "learning-velocity", weight: 0.2 },
  ],
  q3: [
    { trait: "leadership", weight: 0.5 },
    { trait: "people-orientation", weight: 0.4 },
    { trait: "systems-thinking", weight: 0.3 },
  ],
  q4: [
    { trait: "learning-velocity", weight: 0.6 },
    { trait: "autonomy", weight: 0.4 },
  ],
  q5: [
    { trait: "AI-curiosity", weight: 0.7 },
    { trait: "experimentation", weight: 0.5 },
    { trait: "research-orientation", weight: 0.4 },
  ],
  q6: [
    { trait: "leadership", weight: 0.4 },
    { trait: "systems-thinking", weight: 0.4 },
    { trait: "experimentation", weight: 0.3 },
  ],
  q7: [
    { trait: "clarifying", weight: 1.0 },
    { trait: "ambiguity-tolerance", weight: 0.4 },
    { trait: "stability-preference", weight: 0.3 },
  ],
  q8: [
    { trait: "clarifying", weight: 0.8 },
    { trait: "learning-velocity", weight: 0.4 },
    { trait: "risk-tolerance", weight: 0.4 },
  ],
  q9: [
    { trait: "ambiguity-tolerance", weight: 0.6 },
    { trait: "learning-velocity", weight: 0.5 },
    { trait: "experimentation", weight: 0.4 },
  ],
  q10: [
    { trait: "future-orientation", weight: 0.7 },
    { trait: "AI-curiosity", weight: 0.5 },
    { trait: "technical-depth", weight: 0.3 },
  ],
  q11: [
    { trait: "leadership", weight: 0.4 },
    { trait: "systems-thinking", weight: 0.4 },
    { trait: "operational-thinking", weight: 0.3 },
  ],
  q12: [
    { trait: "stability-preference", weight: 0.5 },
    { trait: "risk-tolerance", weight: 0.4 },
    { trait: "autonomy", weight: 0.3 },
  ],
  q13: [
    { trait: "research-orientation", weight: 0.6 },
    { trait: "experimentation", weight: 0.5 },
    { trait: "ambiguity-tolerance", weight: 0.3 },
  ],
  q14: [
    { trait: "systems-thinking", weight: 0.5 },
    { trait: "stability-preference", weight: 0.4 },
    { trait: "operational-thinking", weight: 0.3 },
  ],
  q15: [
    { trait: "AI-curiosity", weight: 0.6 },
    { trait: "research-orientation", weight: 0.4 },
    { trait: "experimentation", weight: 0.3 },
  ],
  q16: [
    { trait: "leadership", weight: 0.5 },
    { trait: "adaptability", weight: 0.4 },
    { trait: "execution-speed", weight: 0.3 },
  ],
};

const TRACK_SIGNAL: Record<string, ExtendedTrait> = {
  systems: "systems-thinking",
  creative: "experimentation",
  research: "research-orientation",
  ops: "operational-thinking",
};

// Build an adaptive sequence of question indices based on partial answers.
export function buildAdaptiveSequence(
  answers: Record<string, string>,
  questions: Question[]
): number[] {
  const total = questions.length;
  const defaultSeq = questions.map((_, i) => i);

  if (Object.keys(answers).length < 3) return defaultSeq;

  const enhanced = calculateEnhancedProfile(answers);
  const extended = enhanced.extended;
  const contradictions = enhanced.contradictions.length > 0;

  const scoreQuestion = (idx: number) => {
    const question = questions[idx];
    const signalDefs = QUESTION_SIGNALS[question.id] ?? [];
    let score = 0;

    for (const def of signalDefs) {
      if (def.trait === "clarifying") {
        if (contradictions) score += def.weight * 2;
        continue;
      }
      score += (extended[def.trait] || 0) * def.weight;
    }

    if (question.tracks) {
      for (const track of question.tracks) {
        const trait = TRACK_SIGNAL[track];
        if (trait) score += (extended[trait] || 0) * 0.2;
      }
    }

    if (enhanced.confidence > 40) {
      score += Math.max(0, (enhanced.confidence - 40) / 100) * 0.2;
    }

    if (enhanced.specializationDepth > 0.4) {
      score += enhanced.specializationDepth * 0.2;
    }

    return score;
  };

  const starter = defaultSeq.slice(0, 3);
  const remaining = defaultSeq.filter((idx) => !starter.includes(idx));
  const sorted = remaining
    .map((idx) => ({ idx, score: scoreQuestion(idx) }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((item) => item.idx);

  return [...starter, ...sorted].slice(0, total);
}
