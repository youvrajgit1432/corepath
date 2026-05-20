import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { careers, getCareerById, aiImpactLabels, aiImpactColors } from "../../../data/careers";
import { getRoadmapById } from "../../../data/roadmaps";
import { getRoadmapForCareer } from "../../../data/roadmaps-generated";
import AIImpactIndicator from "../../../components/AIImpactIndicator";
import LearningRoadmap from "../../../components/LearningRoadmap";
import SkillTree from "../../../components/SkillTree";
import { JsonLd } from "../../../components/JsonLd";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const career = getCareerById(params.id);
  if (!career) {
    return {
      title: "Career not found | CorePath",
      description: "Explore CorePath career paths and AI-ready roles.",
    };
  }

  return {
    title: `${career.title} career path | CorePath`,
    description:
      career.tagline ||
      `Explore ${career.title} career path, core skills, learning roadmap, and AI impact.`,
    alternates: {
      canonical: `https://corepath.io/careers/${career.id}`,
    },
    openGraph: {
      title: `${career.title} career path | CorePath`,
      description: career.tagline,
      url: `https://corepath.io/careers/${career.id}`,
      siteName: "CorePath",
      type: "article",
      images: [
        {
          url: "https://corepath.io/og-image.png",
          alt: `${career.title} career roadmap on CorePath`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${career.title} career path | CorePath`,
      description: career.tagline,
      images: ["https://corepath.io/og-image.png"],
    },
  };
}

export function generateStaticParams() {
  return careers.map((career) => ({ id: career.id }));
}

interface Props {
  params: { id: string };
}

export default async function CareerDetailPage({ params }: Props) {
  const { id } = params;
  const career = getCareerById(id);

  if (!career) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Careers",
        item: "https://corepath.io/careers",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: career.category,
        item: "https://corepath.io/careers",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: career.title,
        item: `https://corepath.io/careers/${career.id}`,
      },
    ],
  };

  // Try to get handcrafted roadmap, fall back to generated
  let roadmap = getRoadmapById(id);
  if (!roadmap) {
    roadmap = getRoadmapForCareer(career);
  }

  const relatedCareers = (career.relatedCareerIds ?? [])
    .map((relatedId) => getCareerById(relatedId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);

  return (
    <div className="pt-16 min-h-screen px-6 py-12">
      <JsonLd data={breadcrumbSchema} />
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

          <section className="rounded-card border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-display text-core-heading mb-4">Related Careers</h2>
            {relatedCareers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {relatedCareers.map((related) => (
                  <Link
                    key={related.id}
                    href={`/careers/${related.id}`}
                    className="rounded-3xl border border-core-border bg-core-bg/70 p-4 transition hover:border-core-accent/40 hover:bg-core-surface"
                  >
                    <p className="text-xs font-mono uppercase tracking-[0.24em] text-core-muted mb-2">
                      {related.category}
                    </p>
                    <p className="text-lg font-semibold text-core-heading mb-1">{related.title}</p>
                    <p className="text-sm text-core-muted">{related.tagline}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-core-muted">Explore other career paths in the full careers directory.</p>
            )}
          </section>

          <section className="rounded-card border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-display text-core-heading mb-4">Is this the one for you?</h2>
            <p className="text-core-muted leading-relaxed mb-6">
              Compare this role with other AI and tech career paths by taking the CorePath quiz. It’s the fastest way to see whether this specialization matches your strengths and goals.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white hover:bg-core-accent/90 transition"
              >
                Take the career quiz
              </Link>
              <Link
                href="/careers"
                className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/5 px-6 py-3 text-sm font-semibold text-core-heading hover:bg-white/10 transition"
              >
                Browse all careers
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
