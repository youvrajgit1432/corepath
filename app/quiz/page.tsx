import QuizShell from "../../components/quiz/QuizShell";

export const metadata = {
  title: "Career quiz for tech students | CorePath",
  description:
    "Take CorePath's career quiz to discover the tech specialization that best matches your interests and strengths.",
  alternates: {
    canonical: "https://corepath.io/quiz",
  },
  openGraph: {
    title: "CorePath Quiz | Find your ideal tech career",
    description:
      "Take CorePath's career quiz to discover the tech specialization that best matches your interests and strengths.",
    url: "https://corepath.io/quiz",
    type: "website",
  },
};

export default function QuizPage() {
  return <QuizShell />;
}
