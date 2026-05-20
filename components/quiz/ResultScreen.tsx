import Link from "next/link";
import type { TraitScores } from "../../data/quiz";
import type { Career } from "../../data/careers";

type RankedCareer = {
  careerId: string;
  score: number;
  percentage: number;
  career: Career;
};

type Props = {
  topMatch: Career;
  allMatches: RankedCareer[];
  userProfile: TraitScores;
  onRetake: () => void;
};

const profileLabels: Array<{ key: keyof TraitScores; label: string }> = [
  { key: "analytical", label: "Analytical" },
  { key: "creativity", label: "Creative" },
  { key: "technical-depth", label: "Technical" },
  { key: "social", label: "Collaborative" },
  { key: "structure", label: "Organized" },
  { key: "risk-tolerance", label: "Bold" },
  { key: "visual", label: "Visual" },
  { key: "leadership", label: "Leadership" },
];

export default function ResultScreen({ topMatch, allMatches, userProfile, onRetake }: Props) {
  const topTraits = profileLabels
    .map((item) => ({ ...item, value: userProfile[item.key] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <div className="rounded-[2.25rem] border border-core-border bg-core-surface/95 p-8 shadow-soft backdrop-blur-xl">
      <div className="animate-quiz-pop rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center">
        <span className="inline-flex rounded-full bg-core-accent/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-core-accent">
          Best match — {allMatches[0]?.percentage}% alignment
        </span>
        <div className="mt-6 inline-flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-6xl text-core-heading shadow-soft">
          {topMatch.icon}
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-core-heading">{topMatch.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-core-muted mx-auto">
          {topMatch.tagline || "This match is based on your answers and the way you like to work."}
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Match</p>
          <p className="mt-3 text-3xl font-semibold text-core-heading">{allMatches[0]?.percentage}%</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Time to job</p>
          <p className="mt-3 text-3xl font-semibold text-core-heading">{topMatch.timeToJob || "Varies"}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">AI relationship</p>
          <p className="mt-3 text-3xl font-semibold text-core-heading">{topMatch.aiRelationship || "AI-aware"}</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm font-semibold text-core-heading">Your strongest working style</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {topTraits.map((trait) => (
            <span
              key={trait.key}
              className="rounded-full bg-teal-100 px-3 py-2 text-xs font-semibold text-teal-900"
            >
              {trait.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-core-heading mb-4">Other strong matches</p>
        <div className="space-y-3">
          {allMatches.slice(1, 4).map((match) => (
            <Link
              key={match.careerId}
              href={`/careers/${match.careerId}`}
              className="group flex items-center justify-between rounded-3xl border border-white/10 bg-black/10 p-4 transition hover:border-core-accent/40 hover:bg-white/10"
            >
              <div>
                <p className="text-sm font-semibold text-core-heading">{match.career.title}</p>
                <p className="text-xs text-core-muted">{match.career.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-core-accent">{match.percentage}%</p>
                <p className="text-xs text-core-muted">match</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-core-heading transition hover:border-core-accent/60"
        >
          Retake quiz
        </button>
        <Link
          href={`/careers/${topMatch.id}`}
          className="inline-flex items-center justify-center rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-core-accent/90"
        >
          View roadmap
        </Link>
      </div>
    </div>
  );
}
