import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AnalyticsSession from "../components/AnalyticsSession";
import AnalyticsPageViewTracker from "../components/AnalyticsPageViewTracker";
import RootErrorWrapper from "../components/RootErrorWrapper";

export const metadataBase = new URL("https://corepath.io");
export const metadata = {
  title: "CorePath | AI Career Guidance for IT Students",
  description:
    "Discover AI-ready career paths, skill roadmaps, and personalized job recommendations for early tech professionals.",
  keywords: [
    "career quiz",
    "AI career path",
    "tech career roadmap",
    "IT career guidance",
    "future-ready careers",
  ],
  alternates: {
    canonical: "https://corepath.io",
  },
  openGraph: {
    title: "CorePath | AI career guidance for IT students",
    description:
      "Discover AI-ready career paths, skill roadmaps, and personalized job recommendations for early tech professionals.",
    url: "https://corepath.io",
    siteName: "CorePath",
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
    title: "CorePath | AI career guidance",
    description:
      "Discover AI-ready career paths, skill roadmaps, and personalized job recommendations for early tech professionals.",
    images: ["https://corepath.io/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-core-bg text-core-text">
        <ClerkProvider>
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <AnalyticsSession />
          <AnalyticsPageViewTracker />
          <Header />

          <main id="main-content" className="pt-20 overflow-x-hidden w-full" role="main">
            <RootErrorWrapper>
              {children}
            </RootErrorWrapper>
          </main>

          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
