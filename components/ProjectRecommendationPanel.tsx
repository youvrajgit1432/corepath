"use client";

import type { Project, ProjectRecommendations, ExperienceLevel } from "../data/project-recommendations";

interface ProjectRecommendationPanelProps {
  recommendations: ProjectRecommendations;
  careerTitle: string;
  className?: string;
}

const difficultyColors: Record<ExperienceLevel, string> = {
  beginner: "border-emerald-500/30 bg-emerald-500/5",
  intermediate: "border-amber-500/30 bg-amber-500/5",
  advanced: "border-orange-500/30 bg-orange-500/5",
};

const difficultyLabels: Record<ExperienceLevel, { label: string; badge: string }> = {
  beginner: { label: "Getting Started", badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" },
  intermediate: { label: "Next Level", badge: "bg-amber-500/20 text-amber-700 dark:text-amber-400" },
  advanced: { label: "Master Level", badge: "bg-orange-500/20 text-orange-700 dark:text-orange-400" },
};

function ProjectCard({ project }: { project: Project }) {
  const aiRelevanceColors = {
    high: "text-core-accent",
    moderate: "text-amber-600 dark:text-amber-400",
    low: "text-gray-600 dark:text-gray-400",
  };

  return (
    <div className={`rounded-lg border p-4 transition-all hover:shadow-md ${difficultyColors[project.difficulty]}`}>
      {/* Header */}
      <div className="mb-3">
        <h4 className="font-semibold text-sm text-core-heading">{project.title}</h4>
        <p className="text-xs text-core-muted mt-1">{project.estimatedTime}</p>
      </div>

      {/* Why recommended */}
      <p className="text-xs leading-relaxed text-core-text mb-3 p-2.5 rounded-md bg-white/30 dark:bg-black/20">
        {project.reasonRecommended}
      </p>

      {/* Skills learned */}
      <div className="mb-3">
        <p className="text-xs font-mono uppercase tracking-widest text-core-muted mb-2">Skills learned</p>
        <div className="flex flex-wrap gap-1.5">
          {project.skillsLearned.map((skill, idx) => (
            <span
              key={idx}
              className="inline-block rounded-full bg-core-accent/10 px-2.5 py-1 text-xs text-core-accent font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Portfolio value + AI relevance */}
      <div className="grid gap-2 text-xs">
        <div className="p-2 rounded-md bg-white/20 dark:bg-black/20">
          <p className="font-mono text-core-muted uppercase text-[10px] tracking-widest mb-1">Portfolio value</p>
          <p className="text-core-text">{project.portfolioValue}</p>
        </div>
        <div className="flex items-start justify-between p-2 rounded-md bg-white/20 dark:bg-black/20">
          <div>
            <p className="font-mono text-core-muted uppercase text-[10px] tracking-widest mb-1">AI impact</p>
            <p className={`font-semibold capitalize ${aiRelevanceColors[project.aiRelevance]}`}>
              {project.aiRelevance} relevance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectTier({
  tier,
  projects,
  label,
}: {
  tier: ExperienceLevel;
  projects: Project[];
  label: string;
}) {
  if (projects.length === 0) {
    return null;
  }

  const config = difficultyLabels[tier];

  return (
    <div className="mb-8">
      <div className="mb-4">
        <div className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${config.badge} mb-2`}>
          {tier.toUpperCase()}
        </div>
        <h3 className="text-lg font-semibold text-core-heading">{label}</h3>
        <p className="text-sm text-core-muted mt-1">
          {tier === "beginner" &&
            "Master the fundamentals. Build confidence with guided projects."}
          {tier === "intermediate" &&
            "Combine multiple skills. Get closer to real-world scenarios."}
          {tier === "advanced" &&
            "Tackle complex systems. Prove your expertise and build your legacy."}
        </p>
      </div>

      {/* Grid of project cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, idx) => (
          <ProjectCard key={idx} project={project} />
        ))}
      </div>
    </div>
  );
}

/**
 * ProjectRecommendationPanel
 *
 * Display recommended projects for a career path organized by difficulty level.
 * Each project shows:
 * - Title and estimated time
 * - Why it's recommended
 * - Skills learned
 * - Portfolio value
 * - AI relevance
 */
export default function ProjectRecommendationPanel({
  recommendations,
  careerTitle,
  className = "",
}: ProjectRecommendationPanelProps) {
  const hasProjects =
    recommendations.beginnerProjects.length > 0 ||
    recommendations.intermediateProjects.length > 0 ||
    recommendations.advancedProjects.length > 0;

  if (!hasProjects) {
    return null;
  }

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      <div className="mb-6">
        <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-2">
          Build Your Experience
        </p>
        <h2 className="text-2xl font-semibold text-core-heading">
          Projects to Build Your {careerTitle} Skills
        </h2>
        <p className="text-sm text-core-muted mt-2">
          These projects are personalized to your skill gaps, learning style, and career path. Each teaches real
          technologies you'll use professionally.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <ProjectTier
          tier="beginner"
          projects={recommendations.beginnerProjects}
          label={difficultyLabels.beginner.label}
        />
        <ProjectTier
          tier="intermediate"
          projects={recommendations.intermediateProjects}
          label={difficultyLabels.intermediate.label}
        />
        <ProjectTier
          tier="advanced"
          projects={recommendations.advancedProjects}
          label={difficultyLabels.advanced.label}
        />
      </div>

      {/* Footer guidance */}
      <div className="mt-8 p-4 rounded-lg bg-core-accent/5 border border-core-accent/20">
        <p className="text-sm text-core-text">
          <span className="font-semibold">💡 Pro tip:</span> Start with beginner projects to build momentum and
          confidence. Progress to intermediate when you can explain the concepts to someone else. Advanced projects
          are portfolio pieces — take your time and make them shine.
        </p>
      </div>
    </section>
  );
}
