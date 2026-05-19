import { Career, careers } from "./careers";

export type TraitDimension =
  | "creativity"
  | "analytical"
  | "leadership"
  | "technical-depth"
  | "social"
  | "structure"
  | "risk-tolerance"
  | "visual";

export const traitDimensions: TraitDimension[] = [
  "creativity",
  "analytical",
  "leadership",
  "technical-depth",
  "social",
  "structure",
  "risk-tolerance",
  "visual",
];

export interface QuizOption {
  id: string;
  label: string;
  traits?: Partial<Record<TraitDimension, number>>;
  scores?: Partial<Record<string, number>>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  hint?: string;
  options: QuizOption[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "What excites you most about working with technology?",
    hint: "Pick the part of the work you want to lean into for the next 2–3 years.",
    options: [
      {
        id: "q1a",
        label: "Designing robust APIs, data models, and backend services",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q1b",
        label: "Crafting polished interfaces and seamless user interactions",
        traits: { creativity: 2, visual: 2, social: 1 },
      },
      {
        id: "q1c",
        label: "Building reliable pipelines that unlock data for analytics",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q1d",
        label: "Training models and operationalizing AI products",
        traits: { analytical: 2, "technical-depth": 2, creativity: 1 },
      },
    ],
  },
  {
    id: "q2",
    question: "Which challenge would you rather solve for a living?",
    options: [
      {
        id: "q2a",
        label: "Why does the system slow down when traffic spikes?",
        traits: { analytical: 2, "technical-depth": 1, structure: 1 },
      },
      {
        id: "q2b",
        label: "Why are users abandoning the checkout flow?",
        traits: { creativity: 1, visual: 2, social: 1 },
      },
      {
        id: "q2c",
        label: "Why are reports missing data at the end of the day?",
        traits: { analytical: 2, structure: 2, "technical-depth": 1 },
      },
      {
        id: "q2d",
        label: "Why does the model break when input changes slightly?",
        traits: { analytical: 2, "technical-depth": 3, creativity: 1 },
      },
    ],
  },
  {
    id: "q3",
    question: "How do you like to structure your work?",
    options: [
      {
        id: "q3a",
        label: "Research, design, and build end-to-end systems",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q3b",
        label: "Automate operations and keep production stable",
        traits: { structure: 2, analytical: 1, social: 1 },
      },
      {
        id: "q3c",
        label: "Run experiments, measure results, and improve models",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q3d",
        label: "Prototype interfaces and validate with real people",
        traits: { creativity: 2, social: 2, visual: 1 },
      },
    ],
  },
  {
    id: "q4",
    question: "Which technology stack sounds most rewarding to learn?",
    options: [
      {
        id: "q4a",
        label: "SQL, APIs, backend services, and scalable architecture",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q4b",
        label: "React, responsive design, and polished web experiences",
        traits: { creativity: 2, visual: 2, social: 1 },
      },
      {
        id: "q4c",
        label: "Infrastructure as code, monitoring, and deployment automation",
        traits: { structure: 2, "technical-depth": 2, analytical: 1 },
      },
      {
        id: "q4d",
        label: "ML pipelines, experiment tracking, and predictive systems",
        traits: { analytical: 2, "technical-depth": 2, creativity: 1 },
      },
    ],
  },
  {
    id: "q5",
    question: "What kind of product work feels most meaningful to you?",
    options: [
      {
        id: "q5a",
        label: "Systems that serve data consistently and securely",
        traits: { analytical: 2, "technical-depth": 1, structure: 2 },
      },
      {
        id: "q5b",
        label: "Interfaces that delight users and reduce friction",
        traits: { creativity: 2, visual: 2, social: 1 },
      },
      {
        id: "q5c",
        label: "Data foundations that empower analytics and AI",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q5d",
        label: "Models that help teams make smarter decisions",
        traits: { analytical: 2, "technical-depth": 3, creativity: 1 },
      },
    ],
  },
  {
    id: "q6",
    question: "How do you approach complex problems?",
    hint: "This helps match you with the right level of technical depth.",
    options: [
      {
        id: "q6a",
        label: "I break them into stable components and design robust APIs",
        traits: { structure: 3, analytical: 1, "technical-depth": 1 },
      },
      {
        id: "q6b",
        label: "I use research and empathy to understand user needs",
        traits: { social: 2, creativity: 2, "risk-tolerance": 1 },
      },
      {
        id: "q6c",
        label: "I prefer measurable outcomes and automated operations",
        traits: { structure: 2, "technical-depth": 1, analytical: 1 },
      },
      {
        id: "q6d",
        label: "I iterate quickly with models and data-driven experiments",
        traits: { analytical: 2, "technical-depth": 2, creativity: 1 },
      },
    ],
  },
  {
    id: "q7",
    question: "Which career story motivates you the most?",
    options: [
      {
        id: "q7a",
        label: "Building resilient backend systems that scale globally",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q7b",
        label: "Creating intuitive products people use every day",
        traits: { creativity: 2, social: 2, visual: 1 },
      },
      {
        id: "q7c",
        label: "Owning infrastructure and ensuring platform reliability",
        traits: { structure: 2, "technical-depth": 2, analytical: 1 },
      },
      {
        id: "q7d",
        label: "Turning raw data into models that guide decisions",
        traits: { analytical: 2, "technical-depth": 3, creativity: 1 },
      },
    ],
  },
  {
    id: "q8",
    question: "What kind of collaboration energizes you?",
    options: [
      {
        id: "q8a",
        label: "Pairing with engineers and product teams on service design",
        traits: { analytical: 2, structure: 1, social: 1 },
      },
      {
        id: "q8b",
        label: "Working with UX researchers, designers, and front-end teams",
        traits: { creativity: 2, visual: 1, social: 1 },
      },
      {
        id: "q8c",
        label: "Partnering with analysts and data scientists on pipelines",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q8d",
        label: "Collaborating with researchers to deploy ML models effectively",
        traits: { analytical: 1, "technical-depth": 2, social: 1 },
      },
    ],
  },
  {
    id: "q9",
    question: "Which work balance sounds most appealing?",
    options: [
      {
        id: "q9a",
        label: "Deep technical design with periodic product check-ins",
        traits: { analytical: 2, structure: 2, "technical-depth": 1 },
      },
      {
        id: "q9b",
        label: "Rapid UI iteration with frequent user validation",
        traits: { creativity: 2, social: 2, visual: 1 },
      },
      {
        id: "q9c",
        label: "Building reproducible data layers and monitoring them",
        traits: { structure: 2, "technical-depth": 2, analytical: 1 },
      },
      {
        id: "q9d",
        label: "Designing experiments and tuning models in production",
        traits: { analytical: 2, "technical-depth": 3, creativity: 1 },
      },
    ],
  },
  {
    id: "q10",
    question: "What would success look like after a year in your role?",
    options: [
      {
        id: "q10a",
        label: "A secure, scalable backend system used by many customers",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q10b",
        label: "A smooth, elegant product experience that users love",
        traits: { creativity: 2, visual: 2, social: 1 },
      },
      {
        id: "q10c",
        label: "A dependable data platform powering analytics and ML",
        traits: { analytical: 2, "technical-depth": 2, structure: 1 },
      },
      {
        id: "q10d",
        label: "A machine learning system that delivers measurable value",
        traits: { analytical: 2, "technical-depth": 3, creativity: 1 },
      },
    ],
  },
];

export interface ScoreResult {
  careerId: string;
  score: number;
  percentage: number;
}

export interface TraitScores {
  analytical: number;
  creativity: number;
  "technical-depth": number;
  leadership: number;
  social: number;
  structure: number;
  "risk-tolerance": number;
  visual: number;
}

const traitNormalizationMap: Record<string, TraitDimension | undefined> = {
  creativity: "creativity",
  analytical: "analytical",
  leadership: "leadership",
  "technical-depth": "technical-depth",
  social: "social",
  structure: "structure",
  "risk-tolerance": "risk-tolerance",
  visual: "visual",
  communication: "social",
  "user-empathy": "social",
  practical: "structure",
  logical: "analytical",
  research: "analytical",
  "business-acumen": "analytical",
  precision: "analytical",
  reliability: "structure",
  organization: "structure",
  consistency: "structure",
  "attention-to-detail": "structure",
  clarity: "structure",
  storytelling: "creativity",
  authenticity: "social",
  "problem-solving": "analytical",
  entrepreneurship: "risk-tolerance",
};

export function normalizeTraitName(trait: string): TraitDimension | undefined {
  return traitNormalizationMap[trait as keyof typeof traitNormalizationMap];
}

export function normalizeTraitScores(scores: TraitScores): TraitScores {
  const maxScore = Math.max(...Object.values(scores), 1);
  return {
    analytical: scores.analytical / maxScore,
    creativity: scores.creativity / maxScore,
    "technical-depth": scores["technical-depth"] / maxScore,
    leadership: scores.leadership / maxScore,
    social: scores.social / maxScore,
    structure: scores.structure / maxScore,
    "risk-tolerance": scores["risk-tolerance"] / maxScore,
    visual: scores.visual / maxScore,
  };
}

export function calculateTraitScores(
  answers: Record<string, string>
): TraitScores {
  const traits: TraitScores = {
    analytical: 0,
    creativity: 0,
    "technical-depth": 0,
    leadership: 0,
    social: 0,
    structure: 0,
    "risk-tolerance": 0,
    visual: 0,
  };

  for (const [questionId, optionId] of Object.entries(answers)) {
    const question = quizQuestions.find((q) => q.id === questionId);
    if (!question) continue;

    const option = question.options.find((o) => o.id === optionId);
    if (!option) continue;

    if (option.traits) {
      for (const [trait, points] of Object.entries(option.traits)) {
        const normalized = normalizeTraitName(trait);
        if (!normalized) continue;
        traits[normalized] += points ?? 0;
      }
    } else {
      for (const [careerId, points] of Object.entries(option.scores ?? {})) {
        const careerTraits = legacyCareerToTraits[careerId];
        if (!careerTraits) continue;
        for (const [trait, value] of Object.entries(careerTraits)) {
          const normalized = normalizeTraitName(trait);
          if (!normalized) continue;
          traits[normalized] += value ?? 0;
        }
      }
    }
  }

  return normalizeTraitScores(traits);
}

const legacyCareerToTraits: Record<string, Partial<Record<TraitDimension, number>>> = {
  "backend-engineer": { analytical: 2, "technical-depth": 2, structure: 2 },
  "frontend-engineer": { creativity: 2, "technical-depth": 1, social: 1 },
  "data-engineer": { analytical: 3, structure: 1, "technical-depth": 1 },
  "devops-engineer": { structure: 3, "technical-depth": 1 },
  "ml-engineer": { analytical: 2, "technical-depth": 2, creativity: 1 },
  "product-designer": { creativity: 2, social: 2, visual: 1 },
};

function getCareerTraitProfile(career: Career): TraitScores {
  const profile: TraitScores = {
    analytical: 0,
    creativity: 0,
    "technical-depth": 0,
    leadership: 0,
    social: 0,
    structure: 0,
    "risk-tolerance": 0,
    visual: 0,
  };

  for (const rawTrait of career.quiz_traits ?? []) {
    const normalized = normalizeTraitName(rawTrait);
    if (!normalized) continue;
    profile[normalized] += 1;
  }

  const total = Object.values(profile).reduce((sum, value) => sum + value, 0);
  if (total === 0) return profile;

  return {
    analytical: profile.analytical / total,
    creativity: profile.creativity / total,
    "technical-depth": profile["technical-depth"] / total,
    leadership: profile.leadership / total,
    social: profile.social / total,
    structure: profile.structure / total,
    "risk-tolerance": profile["risk-tolerance"] / total,
    visual: profile.visual / total,
  };
}

export function calculateCosineSimilarity(userTraits: TraitScores, careerTraits: TraitScores): number {
  let dotProduct = 0;
  let userMagnitude = 0;
  let careerMagnitude = 0;

  for (const trait of traitDimensions) {
    const userValue = userTraits[trait] || 0;
    const careerValue = careerTraits[trait] || 0;
    dotProduct += userValue * careerValue;
    userMagnitude += userValue ** 2;
    careerMagnitude += careerValue ** 2;
  }

  if (userMagnitude === 0 || careerMagnitude === 0) return 0;
  return dotProduct / (Math.sqrt(userMagnitude) * Math.sqrt(careerMagnitude));
}

export function findCareerMatches(userTraits: TraitScores, topN = 5): ScoreResult[] {
  const normalizedUser = normalizeTraitScores(userTraits);
  const results = careers
    .map((career) => {
      const careerProfile = getCareerTraitProfile(career);
      const similarity = calculateCosineSimilarity(normalizedUser, careerProfile);
      return { careerId: career.id, score: similarity, percentage: 0 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  const maxScore = results[0]?.score ?? 1;

  return results.map((result) => ({
    ...result,
    percentage: maxScore > 0 ? Math.round((result.score / maxScore) * 100) : 0,
  }));
}

export function calculateResults(answers: Record<string, string>): ScoreResult[] {
  const traitScores = calculateTraitScores(answers);
  return findCareerMatches(traitScores, 5);
}
