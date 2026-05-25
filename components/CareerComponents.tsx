/**
 * EXAMPLE COMPONENTS
 * Shows how to integrate the career recommendation system into React
 */

'use client'; // Next.js App Router

import { useState } from 'react';
import {
  quizQuestions,
  calculateTraitScores,
  normalizeTraitScores,
  getCareerRecommendations,
  careers,
  type TraitScores,
} from '@/data';
import { COLORS, TRAITS } from '@/data/system-config';

// ==============
// QUIZ COMPONENT
// ==============
export function CareerQuizComponent() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<TraitScores | null>(null);

  const handleAnswer = (optionId: string) => {
    const questionId = quizQuestions[currentQuestion]?.id;
    const newAnswers = { ...answers, ...(questionId ? { [questionId]: optionId } : {}) };
    setAnswers(newAnswers);

    if (Object.keys(newAnswers).length === quizQuestions.length) {
      // Quiz complete
      const rawScores = calculateTraitScores(newAnswers);
      const normalized = normalizeTraitScores(rawScores);
      setResults(normalized);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResults(null);
  };

  if (results) {
    return <CareerResultsComponent scores={results} onRestart={handleRestart} />;
  }

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <h2 className="text-2xl font-bold">Career Discovery Quiz</h2>
          <span className="text-sm text-gray-600">
            {currentQuestion + 1} of {quizQuestions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">{question.question}</h3>
        {question.hint && (
          <p className="text-gray-600 text-sm mb-4">{question.hint}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleAnswer(option.id)}
            className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==============
// RESULTS COMPONENT
// ==============
interface CareerResultsComponentProps {
  scores: TraitScores;
  onRestart?: () => void;
}

export function CareerResultsComponent({
  scores,
  onRestart,
}: CareerResultsComponentProps) {
  const [showAllMatches, setShowAllMatches] = useState(false);
  const recs = getCareerRecommendations(scores, 15);
  const matches = recs.topMatches;
  const displayedMatches = showAllMatches ? matches : matches.slice(0, 5);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Your Career Matches</h2>
        <p className="text-gray-600">
          Based on your personality and skill profile, here are your top career recommendations.
        </p>
      </div>

      {/* Trait Profile */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-4">Your Trait Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(scores).map(([trait, score]) => (
            <div
              key={trait}
              className={`p-3 rounded ${
                COLORS.traitBg[trait as keyof typeof COLORS.traitBg]
              }`}
            >
              <p className="text-sm font-medium capitalize">{trait}</p>
              <div className="mt-2 bg-white rounded h-2 overflow-hidden">
                <div
                  className="bg-current h-full transition-all"
                  style={{
                    width: `${score * 100}%`,
                    color: COLORS.traitText[trait as keyof typeof COLORS.traitText],
                  }}
                />
              </div>
              <p className="text-xs mt-1">{(score * 100).toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Career Matches */}
      <div className="space-y-4">
        {displayedMatches.map((match, index) => (
          <div
            key={match.career.id}
            className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            {/* Rank and Title */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold">
                  #{index + 1} {match.career.title}
                </h3>
                <p className="text-sm text-gray-600">{match.career.domain}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {(match.similarity * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-600">match</p>
              </div>
            </div>

            {/* Match Reasons */}
            <div className="mb-3 p-3 bg-blue-50 rounded">
              <h4 className="text-sm font-semibold mb-2">Why this matches:</h4>
              <ul className="space-y-1">
                {match.reasons.map((reason, i) => (
                  <li key={i} className="text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Signal Summary */}
            <div className="grid gap-3 mb-3 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Strength signals</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {match.explanation.strengthSignals.map((signal, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Potential risks</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {match.explanation.potentialRisks.map((risk, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {match.explanation.alternativeInsight && (
              <div className="mb-3 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-slate-800">
                <strong className="block text-xs uppercase tracking-widest text-orange-600 mb-1">Career tradeoff</strong>
                {match.explanation.alternativeInsight}
              </div>
            )}

            <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">AI outlook</p>
              <p className="text-sm text-slate-700">{match.explanation.aiOutlook}</p>
            </div>

            <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Immediate next action</p>
              <p className="text-sm text-slate-700">{match.explanation.nextAction}</p>
            </div>

            {index === 0 && (
              <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Long-term leverage</p>
                <p className="text-sm text-slate-700 mb-3">{match.explanation.longTermLeverage}</p>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Next 30 days</p>
                <div className="space-y-2 text-sm text-slate-700">
                  {match.explanation.thirtyDayPlan.map((step) => (
                    <div key={step.week}>
                      <p className="font-semibold">{step.week}</p>
                      <p>{step.focus}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-600">Core Skill</p>
                <p className="font-semibold">{match.career.coreSkill}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Time to Job</p>
                <p className="font-semibold">{match.career.timeToJob}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Demand</p>
                <p className="font-semibold capitalize">{match.career.demand}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Salary</p>
                <p className="font-semibold">{match.career.salary}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {match.career.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {matches.length > 5 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAllMatches(!showAllMatches)}
            className="px-6 py-2 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {showAllMatches
              ? 'Show Top 5'
              : `Show All ${matches.length} Matches`}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        {onRestart && (
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Retake Quiz
          </button>
        )}
        <button className="flex-1 px-6 py-3 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors font-semibold">
          Save Results
        </button>
      </div>
    </div>
  );
}

// ==============
// CAREER CARD COMPONENT
// ==============
interface CareerCardProps {
  careerTitle: string;
  domain: string;
  matchScore?: number;
  coreSkill: string;
  timeToJob: string;
  tags: string[];
  onClick?: () => void;
}

export function CareerCard({
  careerTitle,
  domain,
  matchScore,
  coreSkill,
  timeToJob,
  tags,
  onClick,
}: CareerCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold">{careerTitle}</h4>
          <p className="text-sm text-gray-600">{domain}</p>
        </div>
        {matchScore !== undefined && (
          <div className="text-right">
            <p className="font-bold text-green-600">{matchScore}%</p>
            <p className="text-xs text-gray-600">match</p>
          </div>
        )}
      </div>

      <div className="my-2 text-sm">
        <p>
          <span className="font-semibold">Core Skill:</span> {coreSkill}
        </p>
        <p>
          <span className="font-semibold">Time to Job:</span> {timeToJob}
        </p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ==============
// INTEGRATION IN MAIN PAGE
// ==============
// Example usage in app/page.tsx or quiz/page.tsx
export function CareerRecommendationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <CareerQuizComponent />
      </div>
    </div>
  );
}
