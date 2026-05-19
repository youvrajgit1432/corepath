"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-core-footer border-t border-transparent">
      <div className="max-w-7xl mx-auto px-6 py-12 text-core-footer">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-display text-core-header">◇</span>
              <span className="font-display text-core-footer">Corepath</span>
            </div>
            <p className="text-xs text-core-footer leading-relaxed">
              Career guidance and learning roadmaps for tech professionals.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-mono text-xs text-core-header uppercase tracking-widest mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/careers" className="text-sm text-core-footer hover:text-core-text transition-colors">
                  Career Explorer
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="text-sm text-core-muted hover:text-core-text transition-colors">
                  Career Quiz
                </Link>
              </li>
              <li>
                <Link href="/recommendation" className="text-sm text-core-muted hover:text-core-text transition-colors">
                  Recommendations
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-mono text-xs text-core-header uppercase tracking-widest mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-core-muted hover:text-core-text transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-core-muted hover:text-core-text transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-core-muted hover:text-core-text transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-mono text-xs text-core-header uppercase tracking-widest mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-core-muted hover:text-core-text transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-core-muted hover:text-core-text transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-core-muted hover:text-core-text transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-transparent/30 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-core-footer">
              © {currentYear} Corepath. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-core-footer hover:text-core-text transition-colors">
                Twitter
              </a>
              <a href="#" className="text-xs text-core-footer hover:text-core-text transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-xs text-core-footer hover:text-core-text transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
