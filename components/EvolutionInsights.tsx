import type { CareerEvolution } from "../data/career-evolution";

type Props = {
  evolution: CareerEvolution;
};

export default function EvolutionInsights({ evolution }: Props) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)] mb-4">
        Where this path can take you
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 p-4">
          <p className="text-sm font-semibold text-[var(--heading)] mb-3">Evolution routes</p>
          <ul className="space-y-2 text-sm text-core-muted">
            <li>
              <span className="font-semibold text-core-text">Next:</span> {evolution.immediateNextPaths.join(", ")}
            </li>
            <li>
              <span className="font-semibold text-core-text">Mid-career:</span> {evolution.midCareerEvolution.join(", ")}
            </li>
            <li>
              <span className="font-semibold text-core-text">Advanced:</span> {evolution.advancedSpecializationRoutes.join(", ")}
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 p-4">
          <p className="text-sm font-semibold text-[var(--heading)] mb-3">Skill ecosystem</p>
          <p className="text-sm text-core-muted mb-2">
            Core: <span className="font-semibold text-core-text">{evolution.skillEcosystem.core}</span>
          </p>
          <p className="text-sm text-core-muted mb-2">
            Supporting: {evolution.skillEcosystem.supporting.join(", ")}
          </p>
          <p className="text-sm text-core-muted mb-2">
            Expansion: {evolution.skillEcosystem.expansion.join(", ")}
          </p>
          <p className="text-sm text-core-muted">
            Transferable: {evolution.skillEcosystem.transferable.join(", ")}
          </p>
        </div>
      </div>
    </section>
  );
}
