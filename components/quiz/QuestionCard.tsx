import { memo } from "react";
import AnswerCard from "./AnswerCard";

type Answer = {
  id: string;
  letter: string;
  icon: string;
  label: string;
  sub: string;
  dims: Record<string, number>;
};

type Question = {
  id: string;
  icon: string;
  text: string;
  sub: string;
  hint?: string;
  answers: Answer[];
  feedbacks: string[];
};

type Props = {
  question: Question;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

function QuestionCard({ question, selectedIndex, onSelect }: Props) {
  return (
    <div className="quiz-card-appear rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--accent-soft)] text-3xl text-core-accent shadow-soft">
          {question.icon}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-mono uppercase tracking-[0.36em] text-[var(--muted)]">Question</p>
          <h2 className="text-3xl font-semibold leading-tight text-[var(--heading)]">{question.text}</h2>
          <p className="text-sm text-[var(--muted)]">{question.sub}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {question.answers.map((answer, index) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            selected={selectedIndex === index}
            dimmed={selectedIndex !== null && selectedIndex !== index}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(QuestionCard);
