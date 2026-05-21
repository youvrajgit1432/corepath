/**
 * SYSTEM CONFIGURATION & QUICK REFERENCE
 * Career Recommendation Engine
 */

// ==============
// TRAIT DIMENSIONS (8 total)
// ==============
export const TRAITS = {
  CREATIVITY: "creativity",
  ANALYTICAL: "analytical",
  LEADERSHIP: "leadership",
  TECHNICAL_DEPTH: "technical-depth",
  SOCIAL: "social",
  STRUCTURE: "structure",
  RISK_TOLERANCE: "risk-tolerance",
  VISUAL: "visual",
} as const;

export const TRAIT_DESCRIPTIONS = {
  creativity:
    "Innovation, out-of-the-box thinking, artistic ability, experimental mindset",
  analytical:
    "Data-driven, logical reasoning, problem decomposition, systematic thinking",
  leadership:
    "Team direction, decision-making, influence, vision setting, mentoring",
  "technical-depth":
    "Deep expertise, specialization, mastery, technical complexity",
  social:
    "Communication, collaboration, empathy, people skills, networking",
  structure:
    "Organization, process orientation, planning, documentation, consistency",
  "risk-tolerance":
    "Comfort with uncertainty, entrepreneurial mindset, adaptability",
  visual: "Design thinking, spatial reasoning, aesthetics, visual communication",
} as const;

// ==============
// CAREER DOMAINS (12 total)
// ==============
export const DOMAINS = {
  SOFTWARE_ENGINEERING: "Software Engineering",
  DATA_AND_AI: "Data & AI",
  INFRASTRUCTURE_AND_OPS: "Infrastructure & Ops",
  SECURITY: "Security",
  DESIGN_AND_UX: "Design & UX",
  PRODUCT_AND_MANAGEMENT: "Product & Management",
  NETWORKING: "Networking",
  SUPPORT_AND_QA: "Support & QA",
  EMERGING_TECH: "Emerging Tech",
  BUSINESS_AND_IT: "Business & IT",
  DIGITAL_MARKETING: "Digital Marketing",
  CONTENT_CREATION: "Content Creation",
} as const;

export const DOMAIN_DESCRIPTIONS = {
  "Software Engineering": "12 paths - Backend, Frontend, Full Stack, Mobile, Game Dev, etc.",
  "Data & AI": "13 paths - Data Engineer, ML Engineer, NLP, Computer Vision, etc.",
  "Infrastructure & Ops": "11 paths - DevOps, SRE, Cloud Architect, Kubernetes, etc.",
  "Security": "12 paths - Security Engineer, Penetration Tester, SOC Analyst, etc.",
  "Design & UX": "10 paths - UX Designer, UI Designer, Product Designer, etc.",
  "Product & Management": "10 paths - Product Manager, Engineering Manager, CTO, etc.",
  "Networking": "8 paths - Network Engineer, SDN Engineer, IoT Engineer, etc.",
  "Support & QA": "8 paths - QA Engineer, SDET, Technical Support, etc.",
  "Emerging Tech": "8 paths - Blockchain, AR/VR, Robotics, Quantum, Edge Computing, etc.",
  "Business & IT": "10 paths - IT Consultant, Business Analyst, ERP Specialist, etc.",
  "Digital Marketing": "14 paths - SEO, SEM, Content Strategist, Growth Hacker, etc.",
  "Content Creation": "14 paths - Content Writer, Video Creator, Podcast Producer, etc.",
} as const;

export const DOMAIN_COUNTS = {
  "Software Engineering": 12,
  "Data & AI": 13,
  "Infrastructure & Ops": 11,
  "Security": 12,
  "Design & UX": 10,
  "Product & Management": 10,
  "Networking": 8,
  "Support & QA": 8,
  "Emerging Tech": 8,
  "Business & IT": 10,
  "Digital Marketing": 14,
  "Content Creation": 14,
} as const;

export const TOTAL_CAREERS = 95 + 14; // 12 domains + 14 new from recent expansion = 140 total

// ==============
// DIFFICULTY LEVELS
// ==============
export const DIFFICULTY_LEVELS = {
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
  TRANSFORMATIVE: "transformative",
} as const;

export const DIFFICULTY_TIME_ESTIMATES = {
  low: "2-6 months",
  moderate: "6-12 months",
  high: "12-24 months",
  transformative: "24+ months",
} as const;

// ==============
// DEMAND LEVELS
// ==============
export const DEMAND_LEVELS = {
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
} as const;

export const DEMAND_COLORS = {
  low: "text-gray-500",
  moderate: "text-yellow-500",
  high: "text-green-500",
} as const;

// ==============
// QUIZ CONFIGURATION
// ==============
export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 10,
  TRAIT_DIMENSIONS: 8,
  MIN_MATCH_RECOMMENDATIONS: 3,
  MAX_MATCH_RECOMMENDATIONS: 5,
  MATCH_THRESHOLD: 0.3, // Minimum similarity to consider a match
} as const;

// ==============
// CAREER FEATURE FLAGS
// ==============
export const FEATURES = {
  SHOW_SALARY_RANGES: true,
  SHOW_TIME_TO_JOB: true,
  SHOW_DEMAND_LEVEL: true,
  SHOW_TAGS: true,
  SHOW_CORE_SKILL: true,
  FILTER_BY_DOMAIN: true,
  FILTER_BY_DIFFICULTY: true,
} as const;

// ==============
// SAMPLE TRAIT PROFILES
// ==============
export const SAMPLE_TRAIT_PROFILES = {
  softwareArchitect: {
    creativity: 0.6,
    analytical: 1.0,
    leadership: 0.7,
    "technical-depth": 1.0,
    social: 0.5,
    structure: 0.9,
    "risk-tolerance": 0.3,
    visual: 0.4,
  },
  productDesigner: {
    creativity: 1.0,
    analytical: 0.6,
    leadership: 0.7,
    "technical-depth": 0.4,
    social: 0.8,
    structure: 0.6,
    "risk-tolerance": 0.5,
    visual: 1.0,
  },
  dataScientist: {
    creativity: 0.7,
    analytical: 1.0,
    leadership: 0.4,
    "technical-depth": 0.9,
    social: 0.3,
    structure: 0.8,
    "risk-tolerance": 0.4,
    visual: 0.5,
  },
  engineeringManager: {
    creativity: 0.6,
    analytical: 0.7,
    leadership: 1.0,
    "technical-depth": 0.6,
    social: 1.0,
    structure: 0.8,
    "risk-tolerance": 0.5,
    visual: 0.4,
  },
  entrepreneur: {
    creativity: 1.0,
    analytical: 0.6,
    leadership: 1.0,
    "technical-depth": 0.5,
    social: 0.9,
    structure: 0.4,
    "risk-tolerance": 1.0,
    visual: 0.6,
  },
} as const;

// ==============
// QUICK STATS
// ==============
export const SYSTEM_STATS = {
  totalCareers: 140,
  totalDomains: 12,
  totalTraits: 8,
  quizQuestions: 10,
  traitCombinations: 8 ** 10, // Theoretical combinations
  defaultTopMatches: 5,
} as const;

// ==============
// STYLING CONSTANTS
// ==============
export const COLORS = {
  traitBg: {
    creativity: "bg-pink-100",
    analytical: "bg-blue-100",
    leadership: "bg-purple-100",
    "technical-depth": "bg-gray-100",
    social: "bg-green-100",
    structure: "bg-orange-100",
    "risk-tolerance": "bg-red-100",
    visual: "bg-cyan-100",
  },
  traitText: {
    creativity: "text-pink-700",
    analytical: "text-blue-700",
    leadership: "text-purple-700",
    "technical-depth": "text-gray-700",
    social: "text-green-700",
    structure: "text-orange-700",
    "risk-tolerance": "text-red-700",
    visual: "text-cyan-700",
  },
} as const;

// ==============
// EXPORT FOR DEBUGGING
// ==============
export function getSystemStatus() {
  return {
    system: "Career Recommendation Engine",
    version: "2.2.0",
    stats: SYSTEM_STATS,
    features: FEATURES,
    traits: Object.keys(TRAITS).length,
    domains: Object.keys(DOMAIN_COUNTS).length,
    totalCareers: Object.values(DOMAIN_COUNTS).reduce((a, b) => a + b, 0),
  };
}
