import type { Metadata } from "next";
import Link from "next/link";
import { getCareerById } from "../../../data/careers";
import { compareCareers } from "../../../data/career-comparison";
import JourneyProfileCard from "../../../components/JourneyProfileCard";
import CompareAnalytics from "../../../components/CompareAnalytics";
import DecisionAssistantPanel from "../../../components/DecisionAssistantPanel";
import CareerScenarioPanel from "../../../components/CareerScenarioPanel";

export const metadata: Metadata = {
  title: "Compare tech careers | CorePath",
  description:
    "Side-by-side career comparison to evaluate similarities, differences, AI impact, and long-term leverage between two tech roles.",
  alternates: {
    canonical: "https://corepath.io/careers/compare",
  },
  openGraph: {
    title: "Compare tech careers | CorePath",
    description:
      "Side-by-side career comparison to evaluate similarities, differences, AI impact, and long-term leverage between two tech roles.",
    url: "https://corepath.io/careers/compare",
    type: "website",
    images: [
      {
        url: "https://corepath.io/og-image.png",
        alt: "CorePath career comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare tech careers | CorePath",
    description:
      "Side-by-side career comparison to evaluate similarities, differences, AI impact, and long-term leverage between two tech roles.",
    images: ["https://corepath.io/og-image.png"],
  },
};


interface Props {
  searchParams: Promise<{
    careerA?: string | string[];
    careerB?: string | string[];
  }>;
}

function getSearchParam(value?: string | string[]) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function CareerComparePage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const careerAId = getSearchParam(resolvedParams.careerA);
  const careerBId = getSearchParam(resolvedParams.careerB);
  const careerA = careerAId ? getCareerById(careerAId) : undefined;
  const careerB = careerBId ? getCareerById(careerBId) : undefined;

  if (!careerAId || !careerBId) {
    return (
      <div className="pt-28 min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto rounded-card border border-core-border bg-core-surface p-10 text-center">
          <h1 className="text-3xl font-display text-core-heading mb-4">Compare careers</h1>
          <p className="text-core-muted mb-6">Select two careers to compare their fit, tradeoffs, and positioning.</p>
          <Link
            href="/careers"
            className="inline-flex rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white hover:bg-core-accent/90 transition"
          >
            Browse careers
          </Link>
        </div>
      </div>
    );
  }

  if (!careerA || !careerB) {
    return (
      <div className="pt-28 min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto rounded-card border border-core-border bg-core-surface p-10 text-center">
          <h1 className="text-3xl font-display text-core-heading mb-4">Career not found</h1>
          <p className="text-core-muted mb-6">One or both selected career slugs are invalid. Check the comparison link and try again.</p>
          <Link
            href="/careers"
            className="inline-flex rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white hover:bg-core-accent/90 transition"
          >
            Browse careers
          </Link>
        </div>
      </div>
    );
  }

  const comparison = compareCareers(careerA, careerB);
  if (!comparison) {
    return (
      <div className="pt-28 min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto rounded-card border border-core-border bg-core-surface p-10 text-center">
          <h1 className="text-3xl font-display text-core-heading mb-4">Comparison unavailable</h1>
          <p className="text-core-muted mb-6">We could not build a comparison for those careers.</p>
          <Link
            href="/careers"
            className="inline-flex rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white hover:bg-core-accent/90 transition"
          >
            Browse careers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <CompareAnalytics
          careerA={careerA.id}
          careerB={careerB.id}
          categoryA={careerA.category}
          categoryB={careerB.category}
          recommendationSummary={comparison.recommendationSummary}
          comparisonSignals={comparison.similarities}
        />
        <JourneyProfileCard
          event={{
            type: "careerCompared",
            careerA: careerA.id,
            careerB: careerB.id,
            categoryA: careerA.category,
            categoryB: careerB.category,
            tagsA: careerA.tags ?? [],
            tagsB: careerB.tags ?? [],
            aiRelated: Boolean(careerA.aiRelationship || careerB.aiRelationship),
            timestamp: new Date().toISOString(),
          }}
          className="mb-6"
        />
        <div className="mb-10 rounded-card border border-core-border bg-core-surface p-8 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-2">Career Comparison</p>
              <h1 className="font-display text-4xl text-core-heading">{careerA.title} vs. {careerB.title}</h1>
              <p className="mt-3 text-core-muted leading-relaxed">
                See why these roles are similar, where they differ, and how your thinking style shapes the best choice.
              </p>
            </div>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/80 px-6 py-3 text-sm font-semibold text-core-heading hover:bg-core-accent/5 transition"
            >
              Back to careers
            </Link>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-core-border bg-core-surface p-6">
            <h2 className="text-xl font-semibold text-core-heading mb-4">Similarities</h2>
            <ul className="space-y-3 text-sm text-core-text">
              {comparison.similarities.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 text-core-accent">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-core-border bg-core-surface p-6">
            <h2 className="text-xl font-semibold text-core-heading mb-4">Thinking style fit</h2>
            <p className="text-sm text-core-text leading-relaxed">{comparison.thinkingStyleFit}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-core-border bg-core-surface p-6">
            <h3 className="text-lg font-semibold text-core-heading mb-4">Core differences</h3>
            <div className="space-y-4 text-sm text-core-text">
              <div>
                <p className="font-semibold mb-2">{careerA.title}</p>
                <ul className="space-y-2">
                  {comparison.differences.careerA.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">{careerB.title}</p>
                <ul className="space-y-2">
                  {comparison.differences.careerB.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-card border border-core-border bg-core-surface p-6">
            <h3 className="text-lg font-semibold text-core-heading mb-4">AI-era differences</h3>
            <ul className="space-y-3 text-sm text-core-text">
              {comparison.aiEraDifferences.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-core-border bg-core-surface p-6">
            <h3 className="text-lg font-semibold text-core-heading mb-4">Work style differences</h3>
            <ul className="space-y-3 text-sm text-core-text">
              {comparison.workStyleDifferences.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-core-border bg-core-surface p-6">
            <h3 className="text-lg font-semibold text-core-heading mb-4">Learning difficulty comparison</h3>
            <p className="text-sm text-core-text leading-relaxed">{comparison.learningDifficulty}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-core-border bg-core-surface p-6">
            <h3 className="text-lg font-semibold text-core-heading mb-4">Long-term leverage</h3>
            <p className="text-sm text-core-text leading-relaxed">{comparison.longTermLeverageComparison}</p>
          </div>
          <div className="rounded-card border border-core-border bg-core-surface p-6">
            <h3 className="text-lg font-semibold text-core-heading mb-4">Future demand comparison</h3>
            <p className="text-sm text-core-text leading-relaxed">{comparison.futureDemandComparison}</p>
          </div>
        </section>

        <section className="mt-6 rounded-card border border-core-border bg-core-surface p-6">
          <h3 className="text-lg font-semibold text-core-heading mb-4">Career evolution differences</h3>
          <ul className="space-y-3 text-sm text-core-text">
            {comparison.careerEvolutionDifferences.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-card border border-core-border bg-core-surface p-6">
          <h3 className="text-lg font-semibold text-core-heading mb-4">Recommendation summary</h3>
          <p className="text-sm text-core-text leading-relaxed">{comparison.recommendationSummary}</p>
        </section>

        <DecisionAssistantPanel
          careerAId={careerA.id}
          careerBId={careerB.id}
          className="mt-6"
        />

        <CareerScenarioPanel
          careerAId={careerA.id}
          careerBId={careerB.id}
          className="mt-6"
        />
      </div>
    </div>
  );
}
