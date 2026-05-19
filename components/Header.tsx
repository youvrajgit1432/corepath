"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-transparent bg-core-header/95 bg-opacity-95 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-display text-core-header font-semibold drop-shadow-sm">◇</span>
          <span className="font-display text-lg text-core-header font-semibold group-hover:text-core-accent transition-colors drop-shadow-sm">
            Corepath
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-mono transition-colors ${
              isActive("/")
                ? "text-core-header font-semibold"
                : "text-core-header/80 hover:text-core-text"
            }`}
          >
            Home
          </Link>
          <Link
            href="/careers"
            className={`text-sm font-mono transition-colors ${
              isActive("/careers") || pathname.startsWith("/careers/")
                ? "text-core-header font-semibold"
                : "text-core-header/80 hover:text-core-text"
            }`}
          >
            Careers
          </Link>
          <Link
            href="/quiz"
            className={`text-sm font-mono transition-colors ${
              isActive("/quiz")
                ? "text-core-header font-semibold"
                : "text-core-header/80 hover:text-core-text"
            }`}
          >
            Quiz
          </Link>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
