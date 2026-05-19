import { notFound } from "next/navigation";
import Link from "next/link";
import { careers, getCareerById, aiImpactLabels, aiImpactColors } from "../../../data/careers";
import { getRoadmapById } from "../../../data/roadmaps";
import { getRoadmapForCareer } from "../../../data/roadmaps-generated";
import AIImpactIndicator from "../../../components/AIImpactIndicator";
import LearningRoadmap from "../../../components/LearningRoadmap";
import SkillTree from "../../../components/SkillTree";

export function generateStaticParams() {
  return careers.map((career) => ({ id: career.id }));
}

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function CareerDetailPage({ params }: Props) {
  const { id } = await params;
  const career = getCareerById(id);

  if (!career) notFound();

  // Try to get handcrafted roadmap, fall back to generated
  let roadmap = getRoadmapById(id);
  if (!roadmap) {
    roadmap = getRoadmapForCareer(career);
  }

  return (
    <div className="pt-16 min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <nav className="text-xs font-mono text-core-muted mb-6">
          <Link href="/careers" className="hover:text-core-accent transition-colors">
            Careers
          </Link>
          <span className="mx-2">›</span>
          <span className="text-core-text">{career.title}</span>
        </nav>

        <div className="rounded-card border-core-border bg-core-surface p-8 shadow-soft mb-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-2">
                {career.category}
              </p>
              <h1 className="font-display text-4xl text-core-heading mb-3">{career.title}</h1>
              <p className="text-core-muted text-lg leading-relaxed">{career.tagline}</p>
            </div>
            <div className="inline-flex flex-col items-start gap-3 rounded-3xl border border-core-border bg-core-bg/80 p-5 text-sm text-core-muted shadow-glow">
              <span className="text-4xl">{career.icon}</span>
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-core-accent">Core Skill</span>
              <p className="text-core-text font-semibold">{career.coreSkill}</p>
              <p>{career.timeToJob}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-10">
          <section className="rounded-card border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-display text-core-heading mb-4">Skill Tree</h2>
            <SkillTree nodes={roadmap.skillTree} />
          </section>

          <section className="rounded-card border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-display text-core-heading mb-4">Learning Roadmap</h2>
            <LearningRoadmap steps={roadmap.steps} coreSkill={career.coreSkill} />
          </section>

          <section className="rounded-card border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-display text-core-heading mb-4">AI Impact</h2>
            <AIImpactIndicator level={career.aiImpact} note={career.aiImpactNote} />
          </section>
        </div>
      </div>
    </div>
  );
}
