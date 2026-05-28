"use client";

import Link from "next/link";
import { clearJourneyMemory } from "../data/journey-memory";
import { clearAnalyticsData } from "../data/analytics-events";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-core-footer border-t border-transparent" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-core-footer">
        {/* Footer Content — 4 compact columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-display text-core-header" aria-hidden="true">◇</span>
              <span className="font-display text-sm text-core-footer">Corepath</span>
            </div>
            <p className="text-[11px] text-core-footer/70 leading-relaxed">
              Career guidance and learning roadmaps for tech professionals.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-mono text-[10px] text-core-header uppercase tracking-widest mb-2" id="footer-product-heading">Product</h3>
            <nav aria-labelledby="footer-product-heading">
              <ul className="space-y-1.5">
                <li><Link href="/careers" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">Career Explorer</Link></li>
                <li><Link href="/quiz" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">Career Quiz</Link></li>
                <li><Link href="/recommendation" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">Recommendations</Link></li>
                <li><Link href="/insights" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">Insights</Link></li>
              </ul>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-mono text-[10px] text-core-header uppercase tracking-widest mb-2" id="footer-resources-heading">Resources</h3>
            <nav aria-labelledby="footer-resources-heading">
              <ul className="space-y-1.5">
                <li><a href="#" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">Documentation</a></li>
                <li><a href="#" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">Blog</a></li>
                <li><a href="#" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">FAQ</a></li>
              </ul>
            </nav>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="font-mono text-[10px] text-core-header uppercase tracking-widest mb-2" id="footer-privacy-heading">Privacy</h3>
            <nav aria-labelledby="footer-privacy-heading">
              <ul className="space-y-1.5">
                <li><a href="#" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-xs text-core-footer/70 hover:text-core-text transition-colors">Terms of Service</a></li>
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
                    className="text-xs text-amber-600/80 hover:text-amber-500 transition-colors underline underline-offset-2 cursor-pointer"
                  >
                    Clear my profile memory
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-4 sm:pt-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-core-footer/60">© {currentYear} Corepath. All rights reserved.</p>
            <nav aria-label="Social media links">
              <div className="flex items-center gap-4">
                <a href="#" className="text-[11px] text-core-footer/60 hover:text-core-text transition-colors">Twitter</a>
                <a href="#" className="text-[11px] text-core-footer/60 hover:text-core-text transition-colors">LinkedIn</a>
                <a href="#" className="text-[11px] text-core-footer/60 hover:text-core-text transition-colors">GitHub</a>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
