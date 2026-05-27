import QuizShell from "../../components/quiz/QuizShell";
import { ErrorBoundary } from "../../components/ErrorBoundary";

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
    images: [
      {
        url: "https://corepath.io/og-image.png",
        alt: "CorePath career quiz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CorePath Quiz | Find your ideal tech career",
    description:
      "Take CorePath's career quiz to discover the tech specialization that best matches your interests and strengths.",
    images: ["https://corepath.io/og-image.png"],
  },
};

export default function QuizPage() {
  return (
    <ErrorBoundary name="QuizPage">
      <QuizShell />
    </ErrorBoundary>
  );
}
