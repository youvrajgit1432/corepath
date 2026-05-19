"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-transparent bg-core-header/95 bg-opacity-95 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-display text-core-header font-semibold drop-shadow-sm">◇</span>
          <span className="font-display text-lg text-core-header font-semibold group-hover:text-core-accent transition-colors drop-shadow-sm">
            Corepath
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMenu}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-core-heading shadow-soft transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-core-accent md:hidden"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMenuOpen ? "Close" : "Menu"}
          </button>

          <div className="hidden md:flex items-center gap-8">
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

          <ThemeToggle />
        </div>

        {isMenuOpen && (
          <div className="w-full md:hidden rounded-[1.75rem] border border-core-border bg-core-surface/95 p-4 shadow-soft backdrop-blur-xl">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className={`block rounded-2xl px-4 py-3 text-sm font-mono transition-colors ${
                  isActive("/")
                    ? "text-core-heading bg-white/10"
                    : "text-core-header/80 hover:text-core-text hover:bg-white/5"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/careers"
                className={`block rounded-2xl px-4 py-3 text-sm font-mono transition-colors ${
                  isActive("/careers") || pathname.startsWith("/careers/")
                    ? "text-core-heading bg-white/10"
                    : "text-core-header/80 hover:text-core-text hover:bg-white/5"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Careers
              </Link>
              <Link
                href="/quiz"
                className={`block rounded-2xl px-4 py-3 text-sm font-mono transition-colors ${
                  isActive("/quiz")
                    ? "text-core-heading bg-white/10"
                    : "text-core-header/80 hover:text-core-text hover:bg-white/5"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Quiz
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
