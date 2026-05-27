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
  },
};

export default function Home() {
  return <HomeContent />;
}
