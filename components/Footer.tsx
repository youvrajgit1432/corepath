"use client";

import Link from "next/link";
import { clearJourneyMemory } from "../data/journey-memory";
import { clearAnalyticsData } from "../data/analytics-events";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 sm:mt-16 bg-core-footer border-t border-transparent" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-core-footer">
        {/* Footer Content */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-display text-core-header" aria-hidden="true">◇</span>
              <span className="font-display text-core-footer">Corepath</span>
            </div>
            <p className="text-xs text-core-footer leading-relaxed">
              Career guidance and learning roadmaps for tech professionals.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-mono text-xs text-core-header uppercase tracking-widest mb-3 sm:mb-4" id="footer-product-heading">
              Product
            </h3>
            <nav aria-labelledby="footer-product-heading">
              <ul className="space-y-2 sm:space-y-3">
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
                <li>
                  <Link href="/insights" className="text-sm text-core-muted hover:text-core-text transition-colors">
                    Insights
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-mono text-xs text-core-header uppercase tracking-widest mb-3 sm:mb-4" id="footer-resources-heading">
              Resources
            </h3>
            <nav aria-labelledby="footer-resources-heading">
              <ul className="space-y-2 sm:space-y-3">
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
            </nav>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="font-mono text-xs text-core-header uppercase tracking-widest mb-3 sm:mb-4" id="footer-privacy-heading">
              Privacy
            </h3>
            <nav aria-labelledby="footer-privacy-heading">
              <ul className="space-y-2 sm:space-y-3">
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
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Clear all local profile memory, analytics, and feedback data? This cannot be undone.")) {
                        clearJourneyMemory();
                        clearAnalyticsData();
                        alert("Your profile memory, analytics, and feedback data have been cleared.");
                      }
                    }}
                    className="text-sm text-amber-600/80 hover:text-amber-500 transition-colors underline underline-offset-2 cursor-pointer"
                  >
                    Clear my profile memory
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-transparent/30 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-core-footer">
              © {currentYear} Corepath. All rights reserved.
            </p>
            <nav aria-label="Social media links">
              <div className="flex items-center gap-4 sm:gap-6">
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
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
