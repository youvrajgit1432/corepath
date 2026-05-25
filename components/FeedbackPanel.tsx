"use client";

import { useState } from "react";
import { logRecommendationFeedback } from "../data/analytics-events";

interface FeedbackPanelProps {
  source?: "home" | "recommendation";
}

const reasons = [
  { value: "confused", label: "I'm confused by the results" },
  { value: "missing_career", label: "A career I expected is missing" },
  { value: "feature_request", label: "I want a new feature" },
];

export default function FeedbackPanel({ source = "home" }: FeedbackPanelProps) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (value: boolean) => {
    setHelpful(value);
    if (value) {
      logRecommendationFeedback(true, undefined, { source });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      return;
    }
    setReason(null);
  };

  const handleSubmit = () => {
    if (helpful === false) {
      logRecommendationFeedback(false, reason ?? "confused", { source });
      setSubmitted(true);
      setHelpful(null);
      setReason(null);
      setTimeout(() => setSubmitted(false), 2000);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-card border border-core-border bg-core-surface p-6 text-center">
        <p className="text-core-accent font-semibold">Feedback received</p>
        <p className="text-sm text-core-muted mt-2">Thanks for helping us improve the experience.</p>
      </div>
    );
  }

  return (
    <section className="rounded-card border border-core-border bg-white/5 p-6 shadow-soft">
      <p className="text-xs uppercase tracking-[0.24em] text-core-muted mb-3">Feedback</p>
      <h2 className="text-xl font-semibold text-core-heading mb-4">Did this feel useful?</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleFeedback(true)}
          className="rounded-full border border-core-border bg-white/5 px-4 py-2 text-sm font-semibold text-core-heading hover:border-core-accent/40 transition"
        >
          👍 Helpful
        </button>
        <button
          type="button"
          onClick={() => handleFeedback(false)}
          className="rounded-full border border-core-border bg-white/5 px-4 py-2 text-sm font-semibold text-core-heading hover:border-core-accent/40 transition"
        >
          👎 Not helpful
        </button>
      </div>

      {helpful === false && (
        <div className="space-y-4">
          <p className="text-sm text-core-muted">What do you want us to improve?</p>
          <div className="space-y-2">
            {reasons.map((item) => (
              <label key={item.value} className="flex items-center gap-3 rounded-lg border border-white/10 bg-core-surface p-3 cursor-pointer transition hover:border-core-accent/40">
                <input
                  type="radio"
                  name="feedbackReason"
                  value={item.value}
                  checked={reason === item.value}
                  onChange={() => setReason(item.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-core-muted">{item.label}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason}
            className="w-full rounded-full bg-core-accent px-4 py-3 text-sm font-semibold text-white hover:bg-core-accent/90 transition disabled:opacity-50"
          >
            Submit feedback
          </button>
        </div>
      )}
    </section>
  );
}
