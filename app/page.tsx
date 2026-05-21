import Link from "next/link";
import CareerCard from "../components/CareerCard";
import { careers as allCareers } from "../data/careers";

export const metadata = {
  title: "CorePath | AI-era career intelligence system",
  description:
    "CorePath helps you choose a deep specialization, understand AI impact, and make career decisions with clarity rather than confusion.",
  alternates: {
    canonical: "https://corepath.io/",
  },
  openGraph: {
    title: "CorePath | AI-era career intelligence system",
    description:
      "CorePath helps you choose a deep specialization, understand AI impact, and make career decisions with clarity rather than confusion.",
    url: "https://corepath.io/",
    type: "website",
  },
};

export default function Home() {
  const strategicCareers = allCareers
    .filter((c) => c.futureDemand === "Exploding" || c.aiRelationship === "AI-Created")
    .slice(0, 4);

  return (
    <main className="page-shell py-16">
      <section className="hero-shell lg:grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-start">
        <div className="max-w-3xl">
          <p className="section-title">AI-era career intelligence</p>
          <h1 className="section-heading mb-6">
            Stop treating career choices like a checklist. Choose a specialization that AI amplifies, not replaces.
          </h1>
          <p className="text-core-muted text-lg leading-relaxed max-w-2xl mb-8">
            CorePath is designed to reduce confusion in a world where every field is shifting under the weight of automation.
            We surface the specialization that gives you long-term advantage, future clarity, and a confident next move.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-indigo-500"
            >
              Start career cognition
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/10 px-6 py-3 text-sm font-semibold text-core-heading transition hover:bg-white/20"
            >
              Explore intelligence cards
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Specialization</p>
              <p className="text-3xl font-semibold">One Core</p>
              <p className="text-core-muted mt-2">Deep expertise your AI advantage is built around.</p>
            </div>
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Supporting skills</p>
              <p className="text-3xl font-semibold">3–4</p>
              <p className="text-core-muted mt-2">Complementary strengths that make your path strategic.</p>
            </div>
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Clarity</p>
              <p className="text-3xl font-semibold">Actionable</p>
              <p className="text-core-muted mt-2">Insights that turn confusion into a focused roadmap.</p>
            </div>
          </div>
        </div>

        <div className="rounded-card border-core-border bg-core-surface p-8 shadow-soft relative overflow-hidden">
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-core-accent/10 blur-3xl" />
          <div className="absolute -bottom-10 left-4 h-24 w-24 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Strategic model</p>
            <p className="mt-3 text-xl font-semibold text-[var(--heading)]">One Core + Supporting Skills</p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              A single deep specialization is your anchor. Supporting skills turn it into a full career system, not a shallow checklist.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10">
              <p className="text-sm font-semibold text-core-heading">AI impact analysis</p>
              <p className="text-core-muted mt-2 text-sm leading-relaxed">
                See whether a role is AI-native, AI-assisted, or anchored by human judgment.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10">
              <p className="text-sm font-semibold text-core-heading">Strategic specialization</p>
              <p className="text-core-muted mt-2 text-sm leading-relaxed">
                Avoid broad generalism. Focus on a high-value specialty that AI makes more powerful.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10">
              <p className="text-sm font-semibold text-core-heading">Future demand signal</p>
              <p className="text-core-muted mt-2 text-sm leading-relaxed">
                Understand market maturity and where demand is expanding versus where it is stabilizing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <div>
              <p className="section-title">Why this matters</p>
              <h2 className="section-heading">Most career advice is still built for the pre-AI era.</h2>
              <p className="text-core-muted text-lg leading-relaxed max-w-3xl">
                Without a clear specialization thesis, people drift from role to role and let AI shape their future for them.
                CorePath frames career choice as a strategic decision: pick a specialization where you build leverage, not just a job title.
              </p>
            </div>
            <div className="rounded-3xl border border-core-border bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Core problem</p>
              <p className="mt-4 text-lg font-semibold text-core-heading">Confusion comes from trying to learn everything.</p>
              <p className="mt-3 text-core-muted leading-relaxed">
                The AI era rewards depth in one valuable specialization and breadth across supporting skills. Anything else is busy work.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Clarity</p>
              <h3 className="mt-3 text-xl font-semibold text-core-heading">What fits you</h3>
              <p className="mt-2 text-core-muted text-sm leading-relaxed">
                We connect your thinking style to roles that match your preferred work rhythm, risk profile, and AI readiness.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Choice</p>
              <h3 className="mt-3 text-xl font-semibold text-core-heading">What matters</h3>
              <p className="mt-2 text-core-muted text-sm leading-relaxed">
                Every recommendation is filtered through AI impact, future demand, and whether the role can become your edge.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Positioning</p>
              <h3 className="mt-3 text-xl font-semibold text-core-heading">How to grow</h3>
              <p className="mt-2 text-core-muted text-sm leading-relaxed">
                Learn the long-term expansion paths that turn one specialization into multiple future opportunities.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Signal</p>
              <h3 className="mt-3 text-xl font-semibold text-core-heading">What to avoid</h3>
              <p className="mt-2 text-core-muted text-sm leading-relaxed">
                We highlight roles that are high-signal, not just popular, so you invest in specialization with staying power.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="section-title">Career intelligence preview</p>
            <h2 className="section-heading">A smarter way to compare careers.</h2>
            <p className="text-core-muted max-w-3xl leading-relaxed">
              Each role is presented with AI impact, future demand, remote potential, and how it fits a strategic specialization profile.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {strategicCareers.map((career) => (
              <CareerCard key={career.id} career={career} />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <Link
          href="/careers"
          className="rounded-card border-core-border bg-white/5 p-8 transition hover:border-core-accent hover:bg-core-surface"
        >
          <p className="section-title">Careers</p>
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">Navigate specialization intelligence</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Filter roles by future demand, AI relationship, and the kind of specialization advantage they unlock.
          </p>
        </Link>
        <Link
          href="/quiz"
          className="rounded-card border-core-border bg-white/5 p-8 transition hover:border-core-accent hover:bg-core-surface"
        >
          <p className="section-title">Quiz</p>
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">Reveal your decision profile</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Get a career cognition analysis that explains why certain pathways fit you better than others.
          </p>
        </Link>
        <Link
          href="/recommendation"
          className="rounded-card border-core-border bg-white/5 p-8 transition hover:border-core-accent hover:bg-core-surface"
        >
          <p className="section-title">Recommendation</p>
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">Turn insight into action</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Compare curated routes and decide which specialization strategy gives you a clear edge.
          </p>
        </Link>
      </section>
    </main>
  );
}
