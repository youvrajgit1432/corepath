import HomeContent from "./HomeContent";

export const metadata = {
  title: "CorePath | AI-era career intelligence system",
  description:
    "CorePath helps you choose a deep specialization, understand AI impact, and make career decisions with clarity rather than confusion.",
  alternates: {
    canonical: "https://corepath.io/",
  },
  openGraph: {
    title: "CorePath | AI-era career intelligence system",
    description:
      "CorePath helps you choose a deep specialization, understand AI impact, and make career decisions with clarity rather than confusion.",
    url: "https://corepath.io/",
    type: "website",
    images: [
      {
        url: "https://corepath.io/og-image.png",
        alt: "CorePath homepage showcasing AI career pathways",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CorePath | AI-era career intelligence system",
    description:
      "CorePath helps you choose a deep specialization, understand AI impact, and make career decisions with clarity rather than confusion.",
    images: ["https://corepath.io/og-image.png"],
  },
};

export default function Home() {
  return <HomeContent />;
}
