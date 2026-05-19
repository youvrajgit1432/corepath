import { RoadmapStep } from "../data/roadmaps";

interface Props {
  steps: RoadmapStep[];
  coreSkill: string;
}

export default function LearningRoadmap({ steps, coreSkill }: Props) {
  return (
    <div>
      <p className="text-xs font-mono text-core-muted uppercase tracking-widest mb-6">
        Learning Roadmap
      </p>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-core-border" aria-hidden="true" />

        <div className="space-y-8">
          {steps.map((step) => {
            const isCore =
              step.skills.some((s) =>
                s.toLowerCase().includes(coreSkill.toLowerCase().split(" ")[0])
              ) || step.title.includes("★");

            return (
              <div key={step.phase} className="relative pl-12">
                <div
                  className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono ${
                    isCore
                      ? "border-core-accent bg-core-accent/10 text-core-accent"
                      : "border-core-border bg-core-surface text-core-muted"
                  }`}
                >
                  {step.phase}
                </div>

                <div
                  className={`rounded-card border p-5 transition-colors ${
                    isCore
                      ? "border-core-accent/30 bg-core-surface"
                      : "border-core-border bg-core-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      {isCore && (
                        <span className="text-xs font-mono text-core-accent mr-2">
                          ★ CORE PHASE
                        </span>
                      )}
                      <h3 className="font-display text-lg text-core-heading mt-0.5">
                        {step.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-core-muted bg-core-border px-2 py-1 rounded shrink-0">
                      {step.duration}
                    </span>
                  </div>

                  <p className="text-sm text-core-muted mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {step.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-1 rounded-md bg-core-border text-core-muted"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-core-bg border border-core-border">
                    <span className="text-emerald-400 text-sm mt-0.5">✓</span>
                    <div>
                      <p className="text-xs font-mono text-core-muted mb-0.5">Phase Milestone</p>
                      <p className="text-sm text-core-text">{step.milestone}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
