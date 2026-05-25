import { memo } from "react";

type Props = {
  total: number;
  current: number;
  answers: Record<string, string>;
};

function ProgressBar({ total, current, answers }: Props) {
  return (
    <div className="flex flex-col gap-4" role="group" aria-label={`Question ${current + 1} of ${total}`}>
      <div className="flex items-center justify-between text-sm font-medium text-[var(--heading)]">
        <span className="uppercase tracking-[0.24em] text-core-accent">Quiz Journey</span>
        <span aria-hidden="true">{current + 1} / {total}</span>
      </div>
      <div
        className="flex items-center gap-2 overflow-hidden rounded-full bg-[var(--surface)]/60 p-2"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Quiz progress: question ${current + 1} of ${total}`}
      >
        {Array.from({ length: total }).map((_, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <div
              key={index}
              className={`quiz-dot h-2 rounded-full transition-all duration-300 ${
                done ? "bg-core-accent" : active ? "bg-[var(--heading)] animate-pulse" : "bg-[var(--border)]"
              }`}
              style={{ width: active ? 44 : done ? 28 : 20 }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}

export default memo(ProgressBar);
