"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateResults, calculateTraitScores } from "../../data/quiz";
import { careers, type Career } from "../../data/careers";
import { quizQuestions } from "../../data/quizQuestions";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import NavigationRow from "./NavigationRow";
import ResultScreen from "./ResultScreen";

export default function QuizShell() {
  const total = quizQuestions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = quizQuestions[currentIndex];
  const selectedAnswer =
    selectedIndex !== null ? currentQuestion.answers[selectedIndex] : null;

  const completedCount = Object.keys(answers).length;
  const isLast = currentIndex === total - 1;

  const results = useMemo(() => {
    if (!finished) return [];
    return calculateResults(answers);
  }, [finished, answers]);

  const traitScores = useMemo(() => {
    if (!finished) return null;
    return calculateTraitScores(answers);
  }, [finished, answers]);

  const topMatch = useMemo(() => {
    if (!finished || results.length === 0) return null;
    return careers.find((career) => career.id === results[0].careerId) ?? null;
  }, [finished, results]);

  const otherMatches = useMemo(() => {
    return results
      .slice(1, 4)
      .map((result) => ({
        ...result,
        career: careers.find((career) => career.id === result.careerId) ?? null,
      }))
      .filter((item): item is { career: Career; careerId: string; score: number; percentage: number } => Boolean(item.career));
  }, [results]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;

    const answerId = currentQuestion.answers[selectedIndex].id;
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: answerId,
    };

    setAnswers(updatedAnswers);

    if (isLast) {
      setIsSubmitting(true);
      setTimeout(() => {
        setFinished(true);
        setIsSubmitting(false);
      }, 250);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    const nextAnswerId = updatedAnswers[quizQuestions[nextIndex].id];
    setSelectedIndex(
      nextAnswerId
        ? quizQuestions[nextIndex].answers.findIndex((answer) => answer.id === nextAnswerId)
        : null
    );
  };

  const handleBack = () => {
    if (currentIndex === 0) return;

    const previousIndex = currentIndex - 1;
    setCurrentIndex(previousIndex);
    const previousAnswerId = answers[quizQuestions[previousIndex].id];
    setSelectedIndex(
      previousAnswerId
        ? quizQuestions[previousIndex].answers.findIndex((answer) => answer.id === previousAnswerId)
        : null
    );
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setFinished(false);
  };

  if (finished && topMatch && traitScores) {
    return (
      <div className="pt-16 min-h-screen bg-[var(--bg)] px-4 pb-16">
        <div className="mx-auto w-full max-w-5xl">
          <ResultScreen
            topMatch={topMatch}
            allMatches={results.map((result) => ({
              ...result,
              career: careers.find((career) => career.id === result.careerId) ?? null,
            }))}
            userProfile={traitScores}
            onRetake={handleRetake}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-[var(--bg)] px-4 pb-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)]/95 p-6 shadow-soft backdrop-blur-xl">
          <div className="mb-6">
            <ProgressBar total={total} current={currentIndex} answers={answers} />
          </div>
          <QuestionCard
            question={currentQuestion}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
          <div className="mt-6">
            <div className="min-h-[72px]">
              {selectedAnswer ? (
                <p className="quiz-feedback rounded-3xl border border-[var(--border)] bg-[var(--surface)]/75 px-4 py-4 text-sm text-[var(--heading)]">
                  {currentQuestion.feedbacks[selectedIndex]}
                </p>
              ) : (
                <p className="text-sm text-[var(--muted)]">Choose the option that feels most like you.</p>
              )}
            </div>
            <NavigationRow
              canGoBack={currentIndex > 0}
              canGoNext={selectedIndex !== null && !isSubmitting}
              isLast={isLast}
              onBack={handleBack}
              onNext={handleNext}
              nextLabel={isLast ? "Reveal your match" : "Continue"}
              loading={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
