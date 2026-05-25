import Link from "next/link";

export default function QuickStartPanel() {
  const steps = [
    {
      title: "Take the quiz",
      description: "Answer a short adaptive quiz to reveal the career match that fits your goals.",
      href: "/quiz",
      button: "Start quiz",
    },
    {
      title: "Explore careers",
      description: "Review curated career cards with AI impact, future demand, and specialization fit.",
      href: "/careers",
      button: "Browse careers",
    },
    {
      title: "Analyze profile",
      description: "Use your quiz result and portfolio signals to understand how your experience aligns with each path.",
      href: "/recommendation",
      button: "View recommendation",
    },
    {
      title: "Start workspace",
      description: "Begin tracking progress, milestones, and projects on a mapped career path.",
      href: "/careers",
      button: "Open workspace",
    },
  ];

  return (
    <section className="rounded-card border border-core-border bg-white/5 p-8 shadow-soft">
      <div className="mb-6">
        <p className="section-title">Quick start</p>
        <h2 className="section-heading">Ready to move from thinking to doing?</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map((step, index) => (
          <div key={step.title} className="group rounded-3xl border border-white/10 bg-core-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-core-accent/50 hover:shadow-lg hover:shadow-core-accent/5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-core-accent text-xs font-semibold text-white transition-transform group-hover:scale-110">
                {index + 1}
              </span>
              <Link
                href={step.href}
                className="text-xs font-semibold uppercase tracking-[0.24em] text-core-accent hover:text-core-heading transition-colors"
              >
                {step.button}
              </Link>
            </div>
            <h3 className="text-lg font-semibold text-core-heading mb-2">{step.title}</h3>
            <p className="text-sm text-core-muted leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
