import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore future-ready careers | CorePath",
  description:
    "Browse AI-influenced tech careers, filter by role type, and discover the right path for your next move.",
  alternates: {
    canonical: "https://corepath.io/careers",
  },
  openGraph: {
    title: "CorePath Careers | Tech roles and AI career paths",
    description:
      "Browse AI-influenced tech careers, filter by role type, and discover the right path for your next move.",
    url: "https://corepath.io/careers",
    type: "website",
    images: [
      {
        url: "https://corepath.io/og-image.png",
        alt: "CorePath careers explorer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CorePath Careers | Tech roles and AI career paths",
    description:
      "Browse AI-influenced tech careers, filter by role type, and discover the right path for your next move.",
    images: ["https://corepath.io/og-image.png"],
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
