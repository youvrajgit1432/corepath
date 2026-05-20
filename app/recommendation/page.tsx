export const metadata = {
  title: "Career recommendations | CorePath",
  description:
    "View your personalized career match from CorePath's quiz and discover the roadmap for your top role.",
  alternates: {
    canonical: "https://corepath.io/recommendation",
  },
  robots: {
    noindex: true,
    nofollow: false,
  },
  openGraph: {
    title: "CorePath | Personalized career recommendations",
    description:
      "View your personalized career match from CorePath's quiz and discover the roadmap for your top role.",
    url: "https://corepath.io/recommendation",
    type: "website",
  },
};

import { Suspense } from "react";
import RecommendationContent from "./RecommendationContent";

export default function RecommendationPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 text-center text-core-muted font-mono text-sm">
          Calculating your path...
        </div>
      }
    >
      <RecommendationContent />
    </Suspense>
  );
}
