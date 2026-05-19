"use client";

// app/quiz/page.tsx
// Feature 1: Career Quiz System
// Why client component: quiz state (current question, answers) lives in the browser.
// No backend call needed — scoring is pure JS (see data/quiz.ts).
// When backend is ready: replace calculateResults() with POST /api/quiz/submit

import { useState } from "react";
import { useRouter } from "next/navigation";
import { quizQuestions, calculateResults } from "../../data/quiz";

type Answers = Record<string, string>; // { questionId: optionId }

export default function QuizPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0); // index into quizQuestions
  const [answers, setAnswers] = useState<Answers>({});
  const [selected, setSelected] = useState<string | null>(null); // option chosen for current Q

  const question = quizQuestions[current];
  const total = quizQuestions.length;
  const progress = Math.round(((current) / total) * 100);
  const isLast = current === total - 1;

  function handleSelect(optionId: string) {
    setSelected(optionId);
  }

  function handleNext() {
    if (!selected) return;

    const newAnswers = { ...answers, [question.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    if (isLast) {
      // Score and navigate to recommendation page
      const results = calculateResults(newAnswers);
      // Encode top 5 results into URL query string (no backend session needed for MVP)
      const top = results.slice(0, 5).map((r) => `${r.careerId}:${r.percentage}`).join(",");
      router.push(`/recommendation?results=${encodeURIComponent(top)}`);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  function handleBack() {
    if (current === 0) return;
    setCurrent((c) => c - 1);
    // Restore previous selection if user goes back
    const prev = quizQuestions[current - 1];
    setSelected(answers[prev.id] ?? null);
  }

  return (
    <div className="pt-16 min-h-screen flex flex-col items-center justify-center px-6 py-16">

      {/* Progress bar */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex justify-between text-xs font-mono text-core-muted mb-2">
          <span>Question {current + 1} of {total}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-1 bg-core-border rounded-full overflow-hidden">
          <div
            className="h-full bg-core-accent transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-core-surface border border-core-border rounded-card p-8">

        {/* Question */}
        <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-3">
          Career Quiz
        </p>
        <h2 className="font-display text-2xl text-core-heading mb-2 leading-snug">
          {question.question}
        </h2>
        {question.hint && (
          <p className="text-xs text-core-muted mb-6 italic">{question.hint}</p>
        )}
        {!question.hint && <div className="mb-6" />}

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option) => {
            const isChosen = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all duration-150 text-sm
                  ${isChosen
                    ? "border-core-accent bg-core-accent/10 text-core-heading"
                    : "border-core-border bg-core-bg text-core-muted hover:border-core-accent/40 hover:text-core-text"
                  }`}
              >
                <span className={`font-mono text-xs mr-3 ${isChosen ? "text-core-accent" : "text-core-border"}`}>
                  {option.id.slice(-1).toUpperCase()}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={current === 0}
            className="text-sm text-core-muted hover:text-core-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!selected}
            className="px-6 py-2.5 rounded-lg bg-core-accent text-core-bg text-sm font-medium
              hover:bg-core-accent/90 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLast ? "See My Results →" : "Next →"}
          </button>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-core-muted font-mono text-center max-w-sm">
        No login required. Results are based on your answers only.
        Takes about 5–8 minutes and guides you to a thoughtful specialization.
      </p>
    </div>
  );
}
