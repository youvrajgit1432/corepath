import { Career } from "./careers";

export interface SkillNode {
  id: string;
  label: string;
  type: "core" | "supporting" | "optional";
  dependsOn?: string[];
}

export interface RoadmapStep {
  phase: number;
  title: string;
  duration: string;
  description: string;
  skills: string[];
  milestone: string;
}

export interface CareerRoadmap {
  careerId: string;
  steps: RoadmapStep[];
  skillTree: SkillNode[];
}

// Generic skill mappings by career trait
const traitToSkillsMap: Record<string, string[]> = {
  analytical: ["Problem Solving", "Logic", "Algorithms", "Data Structures", "Mathematics"],
  creativity: ["Design Thinking", "Ideation", "Visual Communication", "Prototyping", "User Empathy"],
  "technical-depth": ["Deep Learning", "Architecture", "System Design", "Best Practices", "Advanced Patterns"],
  leadership: ["Team Management", "Communication", "Decision Making", "Delegation", "Mentoring"],
  social: ["Communication", "Collaboration", "Presentation", "Empathy", "Networking"],
  structure: ["Organization", "Process Design", "Documentation", "Best Practices", "Quality Assurance"],
  "risk-tolerance": ["Innovation", "Experimentation", "Risk Assessment", "Strategic Thinking", "Business Acumen"],
  visual: ["Visual Design", "UI Design", "Aesthetics", "Composition", "Design Systems"],
};

// Career-specific roadmap phases
function generateRoadmapPhases(career: Career): RoadmapStep[] {
  const phases: RoadmapStep[] = [];

  const traits = career.quiz_traits ?? [];
  const skillCount = traits.length;

  // Phase 1: Fundamentals
  phases.push({
    phase: 1,
    title: "Fundamentals & Foundations",
    duration: "6–8 weeks",
    description: `Learn the core concepts of ${career.title.toLowerCase()}. Understand industry standards and best practices. Set up your development environment and tools.`,
    skills: [
      "Core concepts",
      "Industry standards",
      "Essential tools",
      "Best practices introduction",
    ],
    milestone: `Complete your first ${career.title.toLowerCase()} project or assignment`,
  });

  // Phase 2: Core Skills (with ★ marker for core skill)
  if (skillCount >= 2) {
    phases.push({
      phase: 2,
      title: `★ CORE PHASE — ${career.coreSkill || "Specialized Expertise"}`,
      duration: "6–8 weeks",
      description: `Deep dive into your core competency. Work through real-world problems. Learn advanced techniques. Participate in code reviews and feedback cycles.`,
      skills: [
        career.coreSkill || "Core skill mastery",
        "Real-world problem solving",
        "Advanced patterns",
        "Code review process",
      ],
      milestone: `Master ${career.coreSkill || "your core skill"} with production-ready code`,
    });
  }

  // Phase 3: Tools & Ecosystem
  if (skillCount >= 1) {
    phases.push({
      phase: 3,
      title: "Tools, Ecosystem & Integration",
      duration: "3–4 weeks",
      description: `Explore the popular tools and frameworks in the ${career.title.toLowerCase()} ecosystem. Learn how to integrate different systems. Focus on testing and quality assurance.`,
      skills: [
        "Popular tools",
        "Framework ecosystem",
        "System integration",
        "Testing & QA",
      ],
      milestone: `Successfully integrate with external systems and tools`,
    });
  }

  // Phase 4: Advanced Topics
  if (skillCount >= 3) {
    phases.push({
      phase: 4,
      title: "Advanced Topics & Specialization",
      duration: "4–6 weeks",
      description: `Tackle performance optimization, scalability concerns, and advanced architectural patterns. Begin mentoring or leading on projects.`,
      skills: [
        "Performance optimization",
        "Scalability patterns",
        "Advanced architecture",
        "Leadership & mentoring",
      ],
      milestone: `Mentor a junior or lead a project using advanced techniques`,
    });
  }

  // Phase 5: Production & Excellence
  if (phases.length < 5) {
    phases.push({
      phase: phases.length + 1,
      title: "Production Excellence & Career Growth",
      duration: "4–6 weeks",
      description: `Deploy production-ready work with monitoring and observability. Track business impact and metrics. Plan your long-term career specialization.`,
      skills: [
        "Production best practices",
        "Monitoring & observability",
        "Business impact metrics",
        "Career development",
      ],
      milestone: `Deploy or ship something meaningful that impacts users`,
    });
  }

  return phases;
}

// Generate skill tree based on career traits and core skill
function generateSkillTree(career: Career): SkillNode[] {
  const skills: SkillNode[] = [];
  let skillId = 0;

  // Add core skill first
  if (career.coreSkill) {
    skills.push({
      id: `core-${skillId++}`,
      label: career.coreSkill + " ★",
      type: "core",
    });
  }

  // Add trait-based skills
  const traits = career.quiz_traits ?? [];
  const addedTraits = new Set<string>();

  for (const trait of traits) {
    if (addedTraits.has(trait)) continue;
    addedTraits.add(trait);

    const traitSkills = traitToSkillsMap[trait] ?? [];
    for (let i = 0; i < traitSkills.length && skills.length < 12; i++) {
      const typeMap: Record<number, "core" | "supporting" | "optional"> = {
        0: "core",
        1: "supporting",
        2: "optional",
      };
      const skillType = typeMap[i % 3] ?? "supporting";

      skills.push({
        id: `skill-${skillId++}`,
        label: traitSkills[i],
        type: skillType,
        dependsOn: skills.length > 0 ? [skills[skills.length - 1].id] : undefined,
      });
    }
  }

  // If no skills generated, add generic ones
  if (skills.length === 0) {
    skills.push(
      { id: "skill-1", label: "Fundamentals", type: "core" },
      { id: "skill-2", label: "Best Practices", type: "supporting", dependsOn: ["skill-1"] },
      { id: "skill-3", label: "Advanced Topics", type: "optional", dependsOn: ["skill-2"] }
    );
  }

  return skills;
}

export function generateRoadmapForCareer(career: Career): CareerRoadmap {
  return {
    careerId: career.id,
    steps: generateRoadmapPhases(career),
    skillTree: generateSkillTree(career),
  };
}

// Cache for generated roadmaps
const roadmapCache: Record<string, CareerRoadmap> = {};

export function getRoadmapForCareer(career: Career): CareerRoadmap {
  if (!roadmapCache[career.id]) {
    roadmapCache[career.id] = generateRoadmapForCareer(career);
  }
  return roadmapCache[career.id];
}
