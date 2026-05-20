import Link from "next/link";
import CareerCard from "../components/CareerCard";
import { careers as allCareers } from "../data/careers";

export const metadata = {
  title: "AI career guidance for IT students | CorePath",
  description:
    "Explore AI-ready career paths, learning roadmaps, and a quick quiz to find your next tech specialization.",
  alternates: {
    canonical: "https://corepath.io/",
  },
  openGraph: {
    title: "CorePath | Discover your AI-ready career path",
    description:
      "Explore AI-ready career paths, learning roadmaps, and a quick quiz to find your next tech specialization.",
    url: "https://corepath.io/",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="page-shell py-16">
      <section className="hero-shell lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
        <div className="max-w-3xl">
          <p className="section-title">Accelerate your career journey</p>
          <h1 className="section-heading mb-6">
            Discover the right skills, pathways, and recommendations for your next move.
          </h1>
          <p className="text-core-muted text-lg leading-relaxed max-w-2xl mb-8">
            Corepath combines role discovery, learning roadmaps, quiz-based insights, and tailored recommendations into one modern experience.
            Start with your goal, explore what matters, and pick the path that matches your ambition.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/careers"
              className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-indigo-500"
            >
              Explore careers
            </Link>
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/10 px-6 py-3 text-sm font-semibold text-core-heading transition hover:bg-white/20"
            >
              Take the quiz
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Paths</p>
              <p className="text-3xl font-semibold">75+</p>
              <p className="text-core-muted mt-2">Career paths and focus areas.</p>
            </div>
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Quiz</p>
              <p className="text-3xl font-semibold">10 min</p>
              <p className="text-core-muted mt-2">Fast career and skills assessment.</p>
            </div>
            <div className="rounded-card bg-white/5 p-5 text-core-heading">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted mb-2">Advice</p>
              <p className="text-3xl font-semibold">Personal</p>
              <p className="text-core-muted mt-2">Recommendations tuned to your strengths.</p>
            </div>
          </div>
        </div>

        <div className="rounded-card border-core-border p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-core-heading mb-5">
            What you can do with Corepath
          </h2>
          <ul className="space-y-5 text-core-text">
            <li className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <strong className="block text-base font-semibold text-core-heading">Map a career path</strong>
              Learn which roles fit your interests and what skills they require.
            </li>
            <li className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <strong className="block text-base font-semibold text-core-heading">Track your progress</strong>
              See recommended learning steps, tools, and milestones in one place.
            </li>
            <li className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <strong className="block text-base font-semibold text-core-heading">Get tailored advice</strong>
              Receive career recommendations based on your quiz answers and goals.
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <div className="max-w-6xl mx-auto">
          <p className="section-title">Future Careers</p>
          <h2 className="section-heading">Roles to watch</h2>
          <p className="text-core-muted max-w-3xl mb-6">Careers likely to grow fast in the coming years.</p>
          <div className="grid gap-4 md:grid-cols-4">
            {allCareers
              .filter((c) => c.futureDemand === "Exploding" || c.aiRelationship === "AI-Created")
              .slice(0, 4)
              .map((c) => (
                <CareerCard key={c.id} career={c} />
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
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">Explore role categories</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Browse jobs built for today's tech and business growth markets, from engineering to leadership.
          </p>
        </Link>
        <Link
          href="/quiz"
          className="rounded-card border-core-border bg-white/5 p-8 transition hover:border-core-accent hover:bg-core-surface"
        >
          <p className="section-title">Quiz</p>
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">Unlock your profile</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Answer a few questions and get a concise breakdown of strengths, interests, and next steps.
          </p>
        </Link>
        <Link
          href="/recommendation"
          className="rounded-card border-core-border bg-white/5 p-8 transition hover:border-core-accent hover:bg-core-surface"
        >
          <p className="section-title">Recommendation</p>
          <h2 className="mt-4 text-2xl font-semibold text-core-heading">See your next move</h2>
          <p className="mt-3 text-core-muted leading-relaxed">
            Compare learning roadmaps and career advice tailored to your selected path.
          </p>
        </Link>
      </section>
    </main>
  );
}
