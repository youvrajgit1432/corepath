/**
 * ErrorFallbackShell
 *
 * Full-page error boundary fallback for the root layout.
 * Preserves header/footer chrome while showing recovery options.
 */

"use client";

import Link from "next/link";

interface Props {
  onReset?: () => void;
}

export default function ErrorFallbackShell({ onReset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl">
        ⚠️
      </div>
      <h1 className="text-2xl font-semibold text-core-heading mb-3">
        Unexpected error
      </h1>
      <p className="text-core-muted max-w-md mb-8 leading-relaxed">
        CorePath encountered an unexpected error. Your data is stored locally
        and should not be affected. You can try recovering or return to a known
        page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white hover:bg-core-accent/90 transition-colors"
          >
            Try again
          </button>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/5 px-6 py-3 text-sm font-semibold text-core-heading hover:bg-white/10 transition-colors"
        >
          Go home
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/5 px-6 py-3 text-sm font-semibold text-core-heading hover:bg-white/10 transition-colors"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
