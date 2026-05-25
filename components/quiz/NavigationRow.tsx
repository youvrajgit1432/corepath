import { memo } from "react";

type Props = {
  canGoBack: boolean;
  canGoNext: boolean;
  isLast: boolean;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
};

function NavigationRow({
  canGoBack,
  canGoNext,
  isLast,
  nextLabel,
  onBack,
  onNext,
  loading = false,
}: Props) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack || loading}
        className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-3 text-sm font-semibold text-[var(--heading)] transition hover:border-core-accent/60 hover:text-core-accent disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Go to previous question"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || loading}
        className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-core-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label={isLast ? "Reveal your match" : "Continue to next question"}
      >
        {loading ? "Loading…" : nextLabel}
      </button>
    </div>
  );
}

export default memo(NavigationRow);
