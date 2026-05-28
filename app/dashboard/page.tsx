import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard | CorePath",
  description: "Your personalized career intelligence dashboard.",
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-core-heading">
          Welcome{user.firstName ? `, ${user.firstName}` : ""} 👋
        </h1>
        <p className="mt-2 text-core-muted">
          Your personalized career intelligence hub.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Journey Card */}
        <a
          href="/journey"
          className="group rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft transition hover:border-core-accent/50 hover:shadow-glow"
        >
          <span className="text-3xl">🧭</span>
          <h2 className="mt-4 text-lg font-semibold text-core-heading group-hover:text-core-accent transition-colors">
            My Journey
          </h2>
          <p className="mt-2 text-sm text-core-muted">
            Track your career exploration, quiz results, and growth over time.
          </p>
        </a>

        {/* Workspace Card */}
        <a
          href="/workspace"
          className="group rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft transition hover:border-core-accent/50 hover:shadow-glow"
        >
          <span className="text-3xl">💼</span>
          <h2 className="mt-4 text-lg font-semibold text-core-heading group-hover:text-core-accent transition-colors">
            Career Workspace
          </h2>
          <p className="mt-2 text-sm text-core-muted">
            Dive deep into your chosen career paths with structured workflows.
          </p>
        </a>

        {/* Command Center Card */}
        <a
          href="/command-center"
          className="group rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft transition hover:border-core-accent/50 hover:shadow-glow"
        >
          <span className="text-3xl">🎮</span>
          <h2 className="mt-4 text-lg font-semibold text-core-heading group-hover:text-core-accent transition-colors">
            Command Center
          </h2>
          <p className="mt-2 text-sm text-core-muted">
            Intelligence synthesis, decision assistant, and mission control.
          </p>
        </a>

        {/* Quiz Card */}
        <a
          href="/quiz"
          className="group rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft transition hover:border-core-accent/50 hover:shadow-glow"
        >
          <span className="text-3xl">📝</span>
          <h2 className="mt-4 text-lg font-semibold text-core-heading group-hover:text-core-accent transition-colors">
            Career Quiz
          </h2>
          <p className="mt-2 text-sm text-core-muted">
            Take the career assessment to discover your ideal paths.
          </p>
        </a>

        {/* Careers Card */}
        <a
          href="/careers"
          className="group rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft transition hover:border-core-accent/50 hover:shadow-glow"
        >
          <span className="text-3xl">🔍</span>
          <h2 className="mt-4 text-lg font-semibold text-core-heading group-hover:text-core-accent transition-colors">
            Browse Careers
          </h2>
          <p className="mt-2 text-sm text-core-muted">
            Explore 140+ AI-era career paths with detailed roadmaps.
          </p>
        </a>

        {/* Admin Card */}
        <a
          href="/admin"
          className="group rounded-2xl border border-core-border bg-core-surface p-6 shadow-soft transition hover:border-core-accent/50 hover:shadow-glow"
        >
          <span className="text-3xl">⚙️</span>
          <h2 className="mt-4 text-lg font-semibold text-core-heading group-hover:text-core-accent transition-colors">
            Admin
          </h2>
          <p className="mt-2 text-sm text-core-muted">
            System intelligence, health monitoring, and debug tools.
          </p>
        </a>
      </div>
    </div>
  );
}
