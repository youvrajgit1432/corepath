import Link from "next/link";
import { getInsightPages } from "../../data/seo-content";

export const metadata = {
  title: "Insights | CorePath",
  description:
    "Explore search-intent career insights, comparison guides, and learning pathways for AI-era career decisions.",
  alternates: {
    canonical: "https://corepath.io/insights",
  },
  openGraph: {
    title: "Insights | CorePath",
    description:
      "Explore search-intent career insights, comparison guides, and learning pathways for AI-era career decisions.",
    url: "https://corepath.io/insights",
    type: "website",
    images: [
      {
        url: "https://corepath.io/og-image.png",
        alt: "CorePath insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Insights | CorePath",
    description:
      "Explore search-intent career insights, comparison guides, and learning pathways for AI-era career decisions.",
    images: ["https://corepath.io/og-image.png"],
  },
};

export default function InsightsLanding() {
  const pages = getInsightPages();
  const sections = pages.reduce<Record<string, typeof pages>>((acc, page) => {
    acc[page.category] = acc[page.category] || [];
    acc[page.category].push(page);
    return acc;
  }, {});

  return (
    <main className="page-shell py-16 px-4 sm:px-6 lg:px-8">
      <section className="max-w-4xl mx-auto text-center mb-14">
        <p className="section-title">Insights</p>
        <h1 className="section-heading">Search-driven career intelligence for the AI era</h1>
        <p className="mt-4 text-core-muted text-lg leading-relaxed">
          CorePath now includes content pages built for discovery, comparison, and practical career decision-making.
          Use these guides to understand emerging roles, compare meaningful alternatives, and choose learning pathways with confidence.
        </p>
      </section>

      <div className="grid gap-8">
        {Object.entries(sections).map(([category, sectionPages]) => (
          <section key={category} className="rounded-card border border-core-border bg-core-surface p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-core-muted">{category}</p>
                <h2 className="mt-2 text-2xl font-semibold text-core-heading">{category}</h2>
              </div>
              <span className="text-sm text-core-muted">{sectionPages.length} pages</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sectionPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/insights/${page.slug}`}
                  className="group rounded-3xl border border-core-border bg-white/5 p-5 transition hover:border-core-accent/40 hover:bg-core-surface"
                >
                  <h3 className="text-lg font-semibold text-core-heading group-hover:text-core-accent transition-colors">
                    {page.title}
                  </h3>
                  <p className="mt-3 text-sm text-core-muted leading-relaxed">{page.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.24em] text-core-muted">
                    {page.keywords.slice(0, 3).map((keyword) => (
                      <span key={keyword} className="rounded-full border border-core-border px-2 py-1">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
