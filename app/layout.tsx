import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "Corepath",
  description: "Corepath frontend home page",
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
