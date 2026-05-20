type Answer = {
  id: string;
  letter: string;
  icon: string;
  label: string;
  sub: string;
  dims: Record<string, number>;
};

type Props = {
  answer: Answer;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
};

export default function AnswerCard({ answer, selected, dimmed, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col gap-4 rounded-3xl border p-5 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-core-accent ${
        selected
          ? "border-core-accent bg-[#F4F0FF] shadow-soft"
          : "border-white/10 bg-white/5 hover:border-core-accent/60 hover:bg-white/10"
      } ${dimmed ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{answer.icon}</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-core-accent">
          {answer.letter}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-core-heading">{answer.label}</p>
        <p className="mt-2 text-xs text-core-muted leading-5">{answer.sub}</p>
      </div>
    </button>
  );
}
