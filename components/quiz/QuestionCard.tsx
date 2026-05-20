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

export default function QuestionCard({ question, selectedIndex, onSelect }: Props) {
  return (
    <div className="quiz-card-appear rounded-[1.75rem] border border-white/10 bg-black/10 p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-3xl text-core-accent shadow-soft">
          {question.icon}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-mono uppercase tracking-[0.36em] text-core-muted">Question</p>
          <h2 className="text-3xl font-semibold leading-tight text-core-heading">{question.text}</h2>
          <p className="text-sm text-core-muted">{question.sub}</p>
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
