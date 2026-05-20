import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
        <Header />

        <main className="pt-20">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
