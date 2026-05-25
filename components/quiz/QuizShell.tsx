"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { calculateResults, calculateTraitScores } from "../../data/quiz";
import { calculateEnhancedProfile } from "../../data/quiz-enhanced";
import { careers, type Career } from "../../data/careers";
import { loadJourneyMemory, recordJourneyEvent } from "../../data/journey-memory";
import { quizQuestions } from "../../data/quizQuestions";
import { buildAdaptiveSequence } from "../../data/quiz-branching";
import { logEvent } from "../../data/analytics-events";
import { saveQuizSession, loadQuizSession, clearQuizSession, type QuizSession } from "../../data/quiz-session";
import { saveQuizResult } from "../../data/quiz-history";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import NavigationRow from "./NavigationRow";
import ResultScreen from "./ResultScreen";

export default function QuizShell() {
  const total = quizQuestions.length;
  const [sequence, setSequence] = useState<number[]>(quizQuestions.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSession, setPendingSession] = useState<QuizSession | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const session = loadQuizSession();
    if (session && Object.keys(session.answers).length > 0) {
      setPendingSession(session);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (!pendingSession) return;
    
    setSequence(pendingSession.sequence);
    setAnswers(pendingSession.answers);
    setPos(pendingSession.pos);

    // Restore the selection state for the restored question
    const qIdx = pendingSession.sequence[pendingSession.pos];
    const qId = quizQuestions[qIdx]?.id;
    const savedAnswerId = pendingSession.answers[qId];
    
    if (savedAnswerId) {
      const idx = quizQuestions[qIdx].answers.findIndex((a) => a.id === savedAnswerId);
      setSelectedIndex(idx !== -1 ? idx : null);
    } else {
      setSelectedIndex(null);
    }
    
    setPendingSession(null);
  }, [pendingSession]);

  const handleStartFresh = useCallback(() => {
    clearQuizSession();
    setPendingSession(null);
  }, []);

  // Auto-save progress
  useEffect(() => {
    if (!finished && Object.keys(answers).length > 0) {
      saveQuizSession({
        sequence,
        pos,
        answers,
        timestamp: new Date().toISOString(),
      });
    }
  }, [sequence, pos, answers, finished]);

  useEffect(() => {
    const idx = sequence[pos] ?? 0;
    setCurrentIndex(idx);
  }, [sequence, pos]);

  const currentQuestion = quizQuestions[currentIndex];
  const selectedAnswer =
    selectedIndex !== null ? currentQuestion.answers[selectedIndex] : null;

  const completedCount = Object.keys(answers).length;
  const isLast = pos === sequence.length - 1;

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

  const enhancedProfile = useMemo(() => {
    if (!finished) return null;
    return calculateEnhancedProfile(answers);
  }, [finished, answers]);

  const partialProfile = useMemo(() => {
    if (Object.keys(answers).length < 2) return null;
    return calculateEnhancedProfile(answers);
  }, [answers]);

  const [sessionTracked, setSessionTracked] = useState(false);
  const [quizStartedLogged, setQuizStartedLogged] = useState(false);

  // Log quiz started
  useEffect(() => {
    if (!quizStartedLogged) {
      logEvent("quiz_started");
      setQuizStartedLogged(true);
    }
  }, [quizStartedLogged]);

  useEffect(() => {
    const handleDropoff = () => {
      if (finished || Object.keys(answers).length === 0) return;

      logEvent("quiz_dropoff", {
        stage: `question_${pos + 1}`,
        questionId: currentQuestion.id,
        answeredCount: Object.keys(answers).length,
        totalQuestions: sequence.length,
      });
    };

    window.addEventListener("pagehide", handleDropoff);
    return () => window.removeEventListener("pagehide", handleDropoff);
  }, [answers, currentQuestion.id, finished, pos, sequence.length]);

  useEffect(() => {
    if (!finished || !topMatch || !traitScores || sessionTracked) return;

    // Log quiz completed event
    logEvent("quiz_completed", {
      topCareer: topMatch.id,
      topMatchPercentage: results[0]?.percentage ?? 0,
      totalQuestionsAnswered: Object.keys(answers).length,
      confidence: enhancedProfile?.confidence ?? 0,
      careerCategory: topMatch.category,
      careerTags: topMatch.tags ?? [],
    });

    // Build topTraits from the extended profile
    const profileExtended = enhancedProfile?.extended ?? ({} as Record<string, number>);
    const topTraits = Object.entries(profileExtended)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([trait, value]) => ({ trait, value }));

    saveQuizResult({
      topCareer: { title: topMatch.title, icon: topMatch.icon || "✨", id: topMatch.id, category: topMatch.category, coreSkill: topMatch.coreSkill },
      confidence: enhancedProfile?.confidence ?? 0,
      specializationDepth: enhancedProfile?.specializationDepth ?? 0,
      strengthProfile: profileExtended,
      enhancedProfileSummary: {
        narrative: enhancedProfile?.narrative ?? [],
        recommendations: enhancedProfile?.recommendations ?? [],
        topTraits,
      },
      topMatches: results.map((r) => ({
        careerId: r.careerId,
        title: careers.find((c) => c.id === r.careerId)?.title ?? r.careerId,
        percentage: r.percentage,
      })),
    });

    recordJourneyEvent({
      type: "quizCompleted",
      careerId: topMatch.id,
      careerCategory: topMatch.category,
      careerTags: topMatch.tags ?? [],
      confidence: enhancedProfile?.confidence ?? 0,
      specializationDepth: enhancedProfile?.specializationDepth ?? 0,
      aiInterest: (enhancedProfile?.extended["AI-curiosity"] ?? 0) > 0.6 || (enhancedProfile?.extended["AI-builder"] ?? 0) > 0.6,
      timestamp: new Date().toISOString(),
    });
    clearQuizSession();
    setSessionTracked(true);
  }, [finished, topMatch, traitScores, enhancedProfile, sessionTracked, answers, results]);

  const insightMessage = useMemo(() => {
    if (!partialProfile) return null;
    const { extended, contradictions, confidence } = partialProfile;
    if (contradictions.length > 0) return "You show mixed signals; we’ll clarify your priorities.";
    if (extended["systems-thinking"] > 0.6) return "You consistently optimize for reliability and systems.";
    if (extended["experimentation"] > 0.6) return "You prefer rapid iteration and practical learning.";
    if (extended["ambiguity-tolerance"] > 0.55) return "You appear comfortable navigating uncertainty.";
    if (extended["leadership"] > 0.55) return "Your choices suggest strong coordination and strategy.";
    if (extended["AI-curiosity"] > 0.6) return "You’re drawn to AI-first problems and intelligent systems.";
    if (extended["future-orientation"] > 0.55) return "You’re focused on future-facing opportunities.";
    if (confidence > 50) return "Your cognitive profile is becoming clear; we’re sharpening the match.";
    return "We’re still learning your strongest thinking style.";
  }, [partialProfile]);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleNext = useCallback(() => {
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

    const answeredCount = Object.keys(updatedAnswers).length;
    const nextPos = Math.min(pos + 1, sequence.length - 1);

    if (answeredCount === 3) {
      const newSeq = buildAdaptiveSequence(updatedAnswers, quizQuestions);
      const newNextPos = Math.min(pos + 1, newSeq.length - 1);
      setSequence(newSeq);
      setPos(newNextPos);
      const nextIdx = newSeq[newNextPos];
      const nextAnswerId = updatedAnswers[quizQuestions[nextIdx].id];
      setSelectedIndex(nextAnswerId ? quizQuestions[nextIdx].answers.findIndex((a) => a.id === nextAnswerId) : null);
      return;
    }

    setPos(nextPos);
    const nextIdx = sequence[nextPos];
    const nextAnswerId = updatedAnswers[quizQuestions[nextIdx].id];
    setSelectedIndex(nextAnswerId ? quizQuestions[nextIdx].answers.findIndex((answer) => answer.id === nextAnswerId) : null);
  }, [selectedIndex, currentQuestion, answers, isLast, pos, sequence]);

  const handleBack = useCallback(() => {
    if (pos === 0) return;
    const previousPos = Math.max(pos - 1, 0);
    setPos(previousPos);
    const previousIndex = sequence[previousPos];
    const previousAnswerId = answers[quizQuestions[previousIndex].id];
    setSelectedIndex(previousAnswerId ? quizQuestions[previousIndex].answers.findIndex((answer) => answer.id === previousAnswerId) : null);
  }, [pos, sequence, answers]);

  const handleRetake = useCallback(() => {
    logEvent("quiz_retaken");
    clearQuizSession();
    setSequence(quizQuestions.map((_, i) => i));
    setPos(0);
    setSelectedIndex(null);
    setAnswers({});
    setFinished(false);
    setSessionTracked(false);
    setQuizStartedLogged(false);
  }, []);

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
            enhancedProfile={enhancedProfile}
            onRetake={handleRetake}
          />
        </div>
      </div>
    );
  }

  if (pendingSession) {
    return (
      <div className="pt-16 min-h-screen bg-[var(--bg)] px-4 pb-16 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[var(--surface)]/10 blur-3xl" />
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)]/95 p-8 sm:p-12 shadow-soft backdrop-blur-md lg:backdrop-blur-xl text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-core-accent/10 text-3xl text-core-accent">
              ⏳
            </div>
            <h2 className="text-2xl font-semibold text-[var(--heading)] mb-3">Resume previous quiz?</h2>
            <p className="text-sm text-[var(--muted)] mb-8 max-w-md mx-auto leading-relaxed">
              We found an unfinished session. You can continue from where you left off or start a new analysis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={handleResume}
                className="inline-flex items-center justify-center rounded-full bg-core-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-core-accent/90"
              >
                Continue quiz
              </button>
              <button
                type="button"
                onClick={handleStartFresh}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-white/5 px-8 py-3 text-sm font-semibold text-core-heading transition hover:bg-white/10"
              >
                Restart fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-[var(--bg)] px-4 pb-16 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[var(--surface)]/10 blur-3xl" />
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)]/95 p-4 sm:p-6 shadow-soft backdrop-blur-md lg:backdrop-blur-xl" role="region" aria-label="Quiz questions">
          <div className="mb-6">
            <div className="mb-4 rounded-3xl border border-[var(--border)] bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.26em] text-core-muted">Career cognition analysis</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--heading)]">Understand how your thinking style maps to future specialization.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                This is not a personality quiz. It is a focused analysis of the way you solve problems, handle ambiguity, and build long-term advantage in AI-era careers.
              </p>
            </div>
            <ProgressBar total={total} current={pos} answers={answers} />
          </div>
          <QuestionCard
            question={currentQuestion}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
          <div className="mt-4">
            {insightMessage ? (
              <p className="text-sm text-[var(--muted)]">{insightMessage}</p>
            ) : null}
          </div>
          <div className="mt-6">
            <div className="min-h-[72px]" aria-live="polite" aria-atomic="true">
              {selectedAnswer ? (
                <p className="quiz-feedback rounded-3xl border border-[var(--border)] bg-[var(--surface)]/75 px-4 py-4 text-sm text-[var(--heading)]">
                  {currentQuestion.feedbacks[selectedIndex]}
                </p>
              ) : (
                <p className="text-sm text-[var(--muted)]">Choose the option that reflects your real work preferences.</p>
              )}
            </div>
            <NavigationRow
              canGoBack={pos > 0}
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
