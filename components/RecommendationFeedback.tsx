"use client";

import { useState } from "react";
import { logRecommendationFeedback } from "../data/analytics-events";

interface RecommendationFeedbackProps {
  careerId?: string;
}

export default function RecommendationFeedback({ careerId }: RecommendationFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  const reasons = [
    { value: "inaccurate", label: "Inaccurate or misleading" },
    { value: "too_broad", label: "Too broad, not specific" },
    { value: "confusing", label: "Confusing to understand" },
    { value: "not_interested", label: "Not interested in these careers" },
    { value: "exploring", label: "Still exploring, can't say yet" },
  ];

  const handleSubmit = () => {
    if (helpful !== null) {
      logRecommendationFeedback(helpful, reason ?? undefined, { careerId });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setExpanded(false);
        setHelpful(null);
        setReason(null);
      }, 2000);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-core-border bg-core-surface p-6 text-center">
        <p className="text-core-accent font-semibold">Thank you for your feedback!</p>
        <p className="text-sm text-core-muted mt-2">
          This helps us improve recommendations for everyone.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-core-border bg-white/5 p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-core-heading">Was this helpful?</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setHelpful(true);
              setExpanded(false);
              logRecommendationFeedback(true, undefined, { careerId });
              setSubmitted(true);
              setTimeout(() => {
                setSubmitted(false);
                setHelpful(null);
              }, 2000);
            }}
            className="px-4 py-2 rounded-full border border-core-border bg-white/5 text-sm text-core-heading hover:border-core-accent/40 transition"
            title="This recommendation was helpful"
          >
            👍 Helpful
          </button>
          <button
            onClick={() => {
              setHelpful(false);
              setExpanded(!expanded);
            }}
            className={`px-4 py-2 rounded-full border text-sm transition ${
              expanded
                ? "border-core-accent/40 bg-core-accent/10 text-core-accent"
                : "border-core-border bg-white/5 text-core-heading hover:border-core-accent/40"
            }`}
            title="This recommendation was not helpful"
          >
            👎 Not helpful
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5 space-y-4 border-t border-core-border pt-4">
          <p className="text-sm text-core-muted">Tell us why (optional):</p>
          <div className="space-y-2">
            {reasons.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-3 p-3 rounded-lg border border-core-border bg-white/5 hover:border-core-accent/40 cursor-pointer transition"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-core-muted">{r.label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={helpful === null}
            className="w-full px-4 py-3 mt-4 rounded-full bg-core-accent text-core-bg font-semibold text-sm hover:bg-core-accent/90 transition disabled:opacity-50"
          >
            Submit feedback
          </button>
        </div>
      )}
    </div>
  );
}
