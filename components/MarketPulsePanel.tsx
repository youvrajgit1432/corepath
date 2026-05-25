import type { Career } from "../data/careers";
import { buildMarketPulse } from "../data/market-pulse";

interface MarketPulsePanelProps {
  career?: Career;
}

export default function MarketPulsePanel({ career }: MarketPulsePanelProps) {
  if (!career) {
    return null;
  }

  const pulse = buildMarketPulse(career);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/90 p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Market pulse</p>
          <h2 className="text-xl font-semibold text-[var(--heading)]">Will this still matter in 5 years?</h2>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[color:var(--surface)]/85 px-3 py-1 text-sm text-[var(--text)]">
          {pulse.trendDirection}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/80 p-4">
          <p className="text-sm text-[var(--muted)]">Demand score</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--heading)]">{pulse.futureDemandScore}</p>
          <p className="mt-2 text-sm text-[var(--text)]/80">Confidence from projected demand, AI fit and market signals.</p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/80 p-4">
          <p className="text-sm text-[var(--muted)]">AI transformation</p>
          <p className="mt-2 text-base font-semibold text-[var(--heading)]">{pulse.AITransformationLevel}</p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/80 p-4">
          <p className="text-sm text-[var(--muted)]">Replacement risk</p>
          <p className="mt-2 text-base font-semibold text-[var(--heading)]">{pulse.replacementRisk}</p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/80 p-4">
          <p className="text-sm text-[var(--muted)]">5-year outlook</p>
          <p className="mt-2 text-base font-semibold text-[var(--heading)]">{pulse.fiveYearOutlook}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Adjacent career momentum</p>
          {pulse.newAdjacentRoles.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {pulse.newAdjacentRoles.map((role) => (
                <span key={role} className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--text)]">
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--text)]/80">No strong adjacent roles detected from current career metadata.</p>
          )}
        </div>

        <div>
          <p className="text-sm text-[var(--muted)]">Future signals</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {pulse.futureSignals.map((signal) => (
              <div key={signal} className="rounded-3xl border border-[var(--border)] bg-[color:var(--surface)]/80 px-3 py-2 text-sm text-[var(--text)]">
                {signal}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
