/**
 * Trait-Based Quiz System for Career Matching
 * 8 Trait Dimensions:
 * - creativity: Out-of-the-box thinking, innovation, artistic ability
 * - analytical: Data-driven, logical reasoning, problem decomposition
 * - leadership: Team direction, decision-making, influence
 * - technical-depth: Deep technical expertise, specialization
 * - social: Communication, collaboration, empathy
 * - structure: Organization, process orientation, planning
 * - risk-tolerance: Comfort with uncertainty, entrepreneurial mindset
 * - visual: Visual design thinking, spatial reasoning, aesthetics
 */

export interface TraitScores {
  creativity: number;
  analytical: number;
  leadership: number;
  "technical-depth": number;
  social: number;
  structure: number;
  "risk-tolerance": number;
  visual: number;
}

export interface QuizOption {
  id: string;
  label: string;
  traits: Partial<Record<string, number>>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  hint?: string;
  options: QuizOption[];
}

export const traitDimensions = [
  "creativity",
  "analytical",
  "leadership",
  "technical-depth",
  "social",
  "structure",
  "risk-tolerance",
  "visual",
] as const;

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "What energizes you most about solving problems?",
    hint: "Think about what keeps you engaged for hours.",
    options: [
      {
        id: "q1a",
        label:
          "Finding elegant, innovative solutions nobody thought of before",
        traits: {
          creativity: 3,
          analytical: 1,
          "technical-depth": 1,
        },
      },
      {
        id: "q1b",
        label: "Diving deep into complex data and finding hidden patterns",
        traits: {
          analytical: 3,
          "technical-depth": 2,
          structure: 1,
        },
      },
      {
        id: "q1c",
        label: "Collaborating with others and bringing the team together",
        traits: {
          social: 3,
          leadership: 2,
          structure: 1,
        },
      },
      {
        id: "q1d",
        label:
          "Perfecting every technical detail until it's exactly right",
        traits: {
          "technical-depth": 3,
          analytical: 1,
          structure: 2,
        },
      },
    ],
  },
  {
    id: "q2",
    question: "How do you prefer to work?",
    hint: "Choose the work environment that brings out your best.",
    options: [
      {
        id: "q2a",
        label: "Fast-paced, experimental environment with frequent changes",
        traits: {
          "risk-tolerance": 3,
          creativity: 2,
          analytical: 0,
        },
      },
      {
        id: "q2b",
        label: "Well-organized team with clear processes and timelines",
        traits: {
          structure: 3,
          social: 1,
          analytical: 1,
        },
      },
      {
        id: "q2c",
        label: "Collaborative projects with regular feedback and support",
        traits: {
          social: 3,
          leadership: 1,
          structure: 1,
        },
      },
      {
        id: "q2d",
        label: "Independent deep work on specialized technical challenges",
        traits: {
          "technical-depth": 3,
          analytical: 2,
          "risk-tolerance": 0,
        },
      },
    ],
  },
  {
    id: "q3",
    question: "When facing a project setback, what's your instinct?",
    hint: "Be honest about your natural reaction.",
    options: [
      {
        id: "q3a",
        label: "See it as an opportunity to innovate and try a different approach",
        traits: {
          creativity: 2,
          "risk-tolerance": 2,
          leadership: 1,
        },
      },
      {
        id: "q3b",
        label: "Analyze what went wrong and implement a systematic fix",
        traits: {
          analytical: 2,
          structure: 2,
          "technical-depth": 1,
        },
      },
      {
        id: "q3c",
        label: "Rally the team, communicate openly, and collaborate on solutions",
        traits: {
          social: 2,
          leadership: 2,
          communication: 1,
        },
      },
      {
        id: "q3d",
        label: "Debug thoroughly and document lessons learned",
        traits: {
          "technical-depth": 2,
          structure: 2,
          analytical: 1,
        },
      },
    ],
  },
  {
    id: "q4",
    question: "What type of technology role appeals to you most?",
    hint: "Choose what excites you about IT careers.",
    options: [
      {
        id: "q4a",
        label:
          "Design and build beautiful, intuitive user interfaces and experiences",
        traits: {
          visual: 3,
          creativity: 2,
          social: 1,
        },
      },
      {
        id: "q4b",
        label: "Architect scalable systems and handle complex infrastructure",
        traits: {
          "technical-depth": 3,
          analytical: 2,
          structure: 2,
        },
      },
      {
        id: "q4c",
        label: "Lead engineering teams and shape product direction",
        traits: {
          leadership: 3,
          social: 2,
          analytical: 1,
        },
      },
      {
        id: "q4d",
        label: "Analyze data and build machine learning models",
        traits: {
          analytical: 3,
          "technical-depth": 2,
          structure: 1,
        },
      },
    ],
  },
  {
    id: "q5",
    question: "How comfortable are you with ambiguity and uncertainty?",
    hint: "Rate your comfort with unclear situations.",
    options: [
      {
        id: "q5a",
        label: "I thrive when goals shift and I can explore new directions",
        traits: {
          "risk-tolerance": 3,
          creativity: 2,
          analytical: 0,
        },
      },
      {
        id: "q5b",
        label: "I prefer having a roadmap but am okay with some flexibility",
        traits: {
          structure: 2,
          "risk-tolerance": 1,
          analytical: 1,
        },
      },
      {
        id: "q5c",
        label: "I like structured plans but trust my team to navigate changes",
        traits: {
          structure: 2,
          social: 2,
          leadership: 1,
        },
      },
      {
        id: "q5d",
        label: "I need clear specifications and constraints to do my best work",
        traits: {
          structure: 3,
          analytical: 1,
          "technical-depth": 1,
        },
      },
    ],
  },
  {
    id: "q6",
    question: "What's your superpower in a team setting?",
    hint: "Choose what others typically appreciate about you.",
    options: [
      {
        id: "q6a",
        label: "I bring fresh ideas and inspire creative solutions",
        traits: {
          creativity: 3,
          social: 1,
          leadership: 1,
        },
      },
      {
        id: "q6b",
        label: "I ask great questions and identify hidden issues",
        traits: {
          analytical: 2,
          social: 1,
          communication: 1,
        },
      },
      {
        id: "q6c",
        label: "I build trust, listen well, and keep people motivated",
        traits: {
          social: 3,
          leadership: 2,
          empathy: 1,
        },
      },
      {
        id: "q6d",
        label:
          "I deliver high-quality technical work that others can rely on",
        traits: {
          "technical-depth": 3,
          structure: 2,
          analytical: 1,
        },
      },
    ],
  },
  {
    id: "q7",
    question:
      "How do you feel about learning new technologies and frameworks?",
    hint: "Think about your attitude toward continuous learning.",
    options: [
      {
        id: "q7a",
        label: "I love experimenting with cutting-edge tools and techniques",
        traits: {
          "risk-tolerance": 2,
          creativity: 2,
          "technical-depth": 1,
        },
      },
      {
        id: "q7b",
        label: "I systematically master proven frameworks and go deep",
        traits: {
          "technical-depth": 3,
          analytical: 1,
          structure: 1,
        },
      },
      {
        id: "q7c",
        label: "I learn best through mentors and collaborative knowledge-sharing",
        traits: {
          social: 2,
          structure: 1,
          leadership: 1,
        },
      },
      {
        id: "q7d",
        label: "I prefer to master a few core areas very well",
        traits: {
          "technical-depth": 2,
          analytical: 1,
          structure: 2,
        },
      },
    ],
  },
  {
    id: "q8",
    question: "What motivates you most in a career?",
    hint: "Be honest about what success means to you.",
    options: [
      {
        id: "q8a",
        label: "Creating something meaningful that didn't exist before",
        traits: {
          creativity: 3,
          "risk-tolerance": 1,
          leadership: 1,
        },
      },
      {
        id: "q8b",
        label: "Solving complex, tangible problems with measurable results",
        traits: {
          analytical: 2,
          "technical-depth": 2,
          structure: 1,
        },
      },
      {
        id: "q8c",
        label: "Growing people and building high-performing teams",
        traits: {
          leadership: 3,
          social: 2,
          structure: 1,
        },
      },
      {
        id: "q8d",
        label: "Becoming an expert and being recognized for technical excellence",
        traits: {
          "technical-depth": 3,
          analytical: 1,
          structure: 1,
        },
      },
    ],
  },
  {
    id: "q9",
    question: "How do you typically communicate ideas?",
    hint: "Think about your natural communication style.",
    options: [
      {
        id: "q9a",
        label: "With visuals, sketches, and creative presentations",
        traits: {
          visual: 3,
          creativity: 2,
          communication: 1,
        },
      },
      {
        id: "q9b",
        label: "With data, logic, and detailed technical explanations",
        traits: {
          analytical: 2,
          "technical-depth": 1,
          structure: 1,
        },
      },
      {
        id: "q9c",
        label: "Through stories, metaphors, and connecting with people emotionally",
        traits: {
          social: 2,
          leadership: 1,
          creativity: 1,
        },
      },
      {
        id: "q9d",
        label: "With precise documentation and clear specifications",
        traits: {
          structure: 2,
          analytical: 1,
          attention: 2,
        },
      },
    ],
  },
  {
    id: "q10",
    question:
      "Where do you see yourself in 5 years? (Pick the closest description)",
    hint: "Choose your ideal career trajectory.",
    options: [
      {
        id: "q10a",
        label: "Launching my own venture or leading innovation at a company",
        traits: {
          leadership: 2,
          "risk-tolerance": 3,
          creativity: 2,
        },
      },
      {
        id: "q10b",
        label: "A respected technical expert in my specialized domain",
        traits: {
          "technical-depth": 3,
          analytical: 2,
          structure: 1,
        },
      },
      {
        id: "q10c",
        label: "Leading a team or organization with strong culture and trust",
        traits: {
          leadership: 3,
          social: 2,
          structure: 1,
        },
      },
      {
        id: "q10d",
        label: "Solving meaningful problems with creative and innovative approaches",
        traits: {
          creativity: 3,
          "risk-tolerance": 1,
          problem_solving: 2,
        },
      },
    ],
  },
];

/**
 * Calculate total trait scores from quiz responses
 */
export function calculateTraitScores(
  selectedAnswerIds: string[]
): TraitScores {
  const scores: TraitScores = {
    creativity: 0,
    analytical: 0,
    leadership: 0,
    "technical-depth": 0,
    social: 0,
    structure: 0,
    "risk-tolerance": 0,
    visual: 0,
  };

  for (const answerId of selectedAnswerIds) {
    // Find the question and option for this answer
    for (const question of quizQuestions) {
      for (const option of question.options) {
        if (option.id === answerId) {
          // Add trait scores from this option
          for (const [trait, score] of Object.entries(option.traits)) {
            if (trait in scores) {
              scores[trait as keyof TraitScores] += score;
            }
          }
        }
      }
    }
  }

  return scores;
}

/**
 * Normalize trait scores to 0-1 range
 */
export function normalizeScores(scores: TraitScores): TraitScores {
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return scores;

  return {
    creativity: scores.creativity / maxScore,
    analytical: scores.analytical / maxScore,
    leadership: scores.leadership / maxScore,
    "technical-depth": scores["technical-depth"] / maxScore,
    social: scores.social / maxScore,
    structure: scores.structure / maxScore,
    "risk-tolerance": scores["risk-tolerance"] / maxScore,
    visual: scores.visual / maxScore,
  };
}
