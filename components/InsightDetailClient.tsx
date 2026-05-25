"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logEvent } from "../data/analytics-events";
import { JsonLd } from "./JsonLd";
import type { SeoInsightPage, InsightContent } from "../data/seo-content";

interface InsightDetailClientProps {
  page: SeoInsightPage;
  content: InsightContent;
  breadcrumbSchema: any;
  faqSchema: any;
}

export default function InsightDetailClient({
  page,
  content,
  breadcrumbSchema,
  faqSchema,
}: InsightDetailClientProps) {
  useEffect(() => {
    logEvent("insight_page_opened", { insightSlug: page.slug });
  }, [page.slug]);

  return (
    <main className="page-shell py-16 px-4 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <section className="max-w-4xl mx-auto mb-12">
        <p className="text-sm uppercase tracking-[0.3em] text-core-accent">Insights</p>
        <h1 className="mt-3 text-4xl font-semibold text-core-heading">{page.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-core-muted">{page.description}</p>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <article className="space-y-10">
          <section className="rounded-3xl border border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-semibold text-core-heading">Overview</h2>
            <p className="mt-4 text-core-muted leading-relaxed">{content.overview}</p>
          </section>

          <section className="rounded-3xl border border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-semibold text-core-heading">What matters most</h2>
            <ul className="mt-5 space-y-3 list-disc pl-5 text-core-muted">
              {content.keyDifferences.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-core-border bg-core-surface p-8">
              <h3 className="text-xl font-semibold text-core-heading">AI impact</h3>
              <p className="mt-4 text-core-muted leading-relaxed">{content.aiImpact}</p>
            </div>
            <div className="rounded-3xl border border-core-border bg-core-surface p-8">
              <h3 className="text-xl font-semibold text-core-heading">Skills & fit</h3>
              <p className="mt-4 text-core-muted leading-relaxed">{content.skills}</p>
            </div>
            <div className="rounded-3xl border border-core-border bg-core-surface p-8">
              <h3 className="text-xl font-semibold text-core-heading">Difficulty</h3>
              <p className="mt-4 text-core-muted leading-relaxed">{content.difficulty}</p>
            </div>
            <div className="rounded-3xl border border-core-border bg-core-surface p-8">
              <h3 className="text-xl font-semibold text-core-heading">Future outlook</h3>
              <p className="mt-4 text-core-muted leading-relaxed">{content.futureOutlook}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-semibold text-core-heading">Recommendation summary</h2>
            <p className="mt-4 text-core-muted leading-relaxed">{content.recommendationSummary}</p>
          </section>

          <section className="rounded-3xl border border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-semibold text-core-heading">Frequently asked questions</h2>
            <div className="mt-6 space-y-6">
              {content.faqs.map((faq) => (
                <div key={faq.question} className="rounded-3xl border border-core-border bg-white/5 p-6">
                  <p className="font-semibold text-core-heading">{faq.question}</p>
                  <p className="mt-3 text-core-muted leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </article>

        <aside className="space-y-8">
          <section className="rounded-3xl border border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-semibold text-core-heading">Featured careers</h2>
            <div className="mt-5 space-y-4">
              {content.relatedCareers.map((career) => (
                <Link
                  key={career.id}
                  href={`/careers/${career.id}`}
                  onClick={() => logEvent("career_viewed", { careerId: career.id, source: "insight_featured" })}
                  className="block rounded-3xl border border-core-border bg-white/5 p-5 transition hover:border-core-accent/40"
                >
                  <p className="font-semibold text-core-heading">{career.title}</p>
                  <p className="mt-2 text-sm text-core-muted">{career.tagline ?? career.coreSkill}</p>
                </Link>
              ))}
            </div>
          </section>

          {content.relatedInsights.length > 0 && (
            <section className="rounded-3xl border border-core-border bg-core-surface p-8">
              <h2 className="text-2xl font-semibold text-core-heading">Related insights</h2>
              <div className="mt-5 space-y-3">
                {content.relatedInsights.map((insight) => (
                  <Link
                    key={insight.href}
                    href={insight.href}
                    onClick={() => {
                      const slug = insight.href.split("/").pop() || "";
                      logEvent("insight_page_opened", { insightSlug: slug });
                    }}
                    className="block rounded-3xl border border-core-border bg-white/5 p-4 transition hover:border-core-accent/40"
                  >
                    {insight.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-core-border bg-core-surface p-8">
            <h2 className="text-2xl font-semibold text-core-heading">Navigate</h2>
            <div className="mt-5 space-y-2 text-core-muted">
              <Link href="/insights" className="text-core-accent underline">
                All insights
              </Link>
              <Link href="/careers" className="text-core-accent underline">
                All careers
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
