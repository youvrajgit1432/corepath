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
    images: [
      {
        url: "https://corepath.io/og-image.png",
        alt: "CorePath personalized career recommendations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CorePath | Personalized career recommendations",
    description:
      "View your personalized career match from CorePath's quiz and discover the roadmap for your top role.",
    images: ["https://corepath.io/og-image.png"],
  },
};

import { Suspense } from "react";
import RecommendationContent from "./RecommendationContent";
import { ErrorBoundary } from "../../components/ErrorBoundary";

export default function RecommendationPage() {
  return (
    <ErrorBoundary name="RecommendationPage">
      <Suspense
        fallback={
          <div className="pt-28 text-center text-core-muted font-mono text-sm">
            Calculating your path...
          </div>
        }
      >
        <RecommendationContent />
      </Suspense>
    </ErrorBoundary>
  );
}
