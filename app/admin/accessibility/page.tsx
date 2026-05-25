"use client";

import { useEffect, useState } from "react";
import { checkStorageHealth } from "../../../data/storage-health";
import { loadJourneyMemory } from "../../../data/journey-memory";

interface AccessibilityReport {
  missingLabels: string[];
  focusProblems: string[];
  contrastWarnings: string[];
  timestamp: string;
}

export default function AccessibilityDebugPage() {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [storageHealth, setStorageHealth] = useState<string>("");
  const [env, setEnv] = useState<string>("");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    setEnv(process.env.NODE_ENV ?? "development");

    // Run accessibility scans
    const runAudit = () => {
      const warnings: AccessibilityReport = {
        missingLabels: [],
        focusProblems: [],
        contrastWarnings: [],
        timestamp: new Date().toISOString(),
      };

      // Check for common accessibility issues
      const interactiveEls = document.querySelectorAll(
        "button, a, input, select, textarea, [role=button], [tabindex]:not([tabindex='-1'])"
      );

      interactiveEls.forEach((el) => {
        // Check for missing labels on inputs
        if (
          (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") &&
          !el.hasAttribute("aria-label") &&
          !el.hasAttribute("aria-labelledby") &&
          !el.closest("label")
        ) {
          const identifier = el.getAttribute("placeholder") || el.getAttribute("name") || el.tagName;
          warnings.missingLabels.push(`Input missing label: ${identifier}`);
        }

        // Check for visible focus indicators
        const style = window.getComputedStyle(el);
        if (style.outlineWidth === "0px" && style.outlineStyle === "none") {
          const text = el.textContent?.trim().substring(0, 40) || el.tagName;
          warnings.focusProblems.push(`No visible focus indicator: ${text}`);
        }
      });

      // Check contrast on badges, muted text
      const textEls = document.querySelectorAll(".text-core-muted, .text-muted, [class*='text-teal']");
      textEls.forEach((el) => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        if (color && color !== "rgba(0, 0, 0, 0)") {
          warnings.contrastWarnings.push(`Muted text color: ${color} on "${el.textContent?.trim().substring(0, 30)}"`);
        }
      });

      setReport(warnings);
    };

    runAudit();
    // Re-run after a short delay for dynamic content
    const timer = setTimeout(runAudit, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    try {
      const health = checkStorageHealth();
      setStorageHealth(JSON.stringify(health, null, 2));
    } catch {
      setStorageHealth("Unable to check storage health");
    }
  }, []);

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="pt-28 min-h-screen px-6 py-12 text-center text-core-muted">
        <h1 className="text-2xl font-semibold text-core-heading mb-4">Not available</h1>
        <p>Accessibility debug tools are only available in development mode.</p>
      </div>
    );
  }

  const memory = loadJourneyMemory();

  return (
    <div className="pt-24 min-h-screen px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-2">Development Only</p>
        <h1 className="text-3xl font-semibold text-core-heading">Accessibility Debug</h1>
        <p className="text-core-muted mt-2">Environment: {env}</p>
      </div>

      {/* Run audit button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => {
            const warnings: AccessibilityReport = {
              missingLabels: [],
              focusProblems: [],
              contrastWarnings: [],
              timestamp: new Date().toISOString(),
            };
            const interactiveEls = document.querySelectorAll("button, a, input, select, textarea, [role=button]");
            interactiveEls.forEach((el) => {
              if ((el.tagName === "INPUT" || el.tagName === "SELECT") && !(el as HTMLElement).hasAttribute("aria-label") && !(el as HTMLElement).closest("label")) {
                warnings.missingLabels.push(`Input missing label: ${(el as HTMLElement).getAttribute("placeholder") || el.tagName}`);
              }
            });
            setReport(warnings);
          }}
          className="rounded-full bg-core-accent px-6 py-3 text-sm font-semibold text-white hover:bg-core-accent/90 transition"
        >
          Run Accessibility Audit
        </button>
      </div>

      {/* Accessibility Report */}
      <section className="mb-8 rounded-card border border-core-border bg-core-surface p-6">
        <h2 className="text-lg font-semibold text-core-heading mb-4">Accessibility Report</h2>
        {report ? (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="text-sm font-semibold text-core-heading mb-2">Missing Labels</p>
              <p className="text-2xl font-bold text-amber-400">{report.missingLabels.length}</p>
              {report.missingLabels.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-core-muted">
                  {report.missingLabels.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="text-sm font-semibold text-core-heading mb-2">Focus Problems</p>
              <p className="text-2xl font-bold text-amber-400">{report.focusProblems.length}</p>
              {report.focusProblems.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-core-muted">
                  {report.focusProblems.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
              <p className="text-sm font-semibold text-core-heading mb-2">Contrast Warnings</p>
              <p className="text-2xl font-bold text-amber-400">{report.contrastWarnings.length}</p>
              {report.contrastWarnings.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-core-muted">
                  {report.contrastWarnings.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="text-core-muted">Click "Run Accessibility Audit" to scan the current page.</p>
        )}
        {report && (
          <p className="mt-4 text-xs text-core-muted">Last updated: {report.timestamp}</p>
        )}
      </section>

      {/* Storage Health */}
      <section className="mb-8 rounded-card border border-core-border bg-core-surface p-6">
        <h2 className="text-lg font-semibold text-core-heading mb-4">Storage Health</h2>
        {storageHealth ? (
          <pre className="text-xs text-core-muted overflow-x-auto whitespace-pre-wrap font-mono bg-core-bg/50 p-4 rounded-3xl border border-core-border">
            {storageHealth}
          </pre>
        ) : (
          <p className="text-core-muted">Checking storage health...</p>
        )}
      </section>

      {/* Journey State */}
      <section className="mb-8 rounded-card border border-core-border bg-core-surface p-6">
        <h2 className="text-lg font-semibold text-core-heading mb-4">Journey State</h2>
        <pre className="text-xs text-core-muted overflow-x-auto whitespace-pre-wrap font-mono bg-core-bg/50 p-4 rounded-3xl border border-core-border">
          {JSON.stringify(
            {
              completedQuizzes: memory.completedQuizzes,
              quizDates: memory.quizDates.length,
              confidenceHistory: memory.confidenceHistory,
              specializationDepthHistory: memory.specializationDepthHistory,
              recommendedCareers: Object.keys(memory.recommendedCareers).length,
              viewedCareers: Object.keys(memory.viewedCareers).length,
              comparedCareerPairs: Object.keys(memory.comparedCareerPairs).length,
              roadmapInteractions: Object.keys(memory.roadmapInteractions).length,
              uncertaintyPatterns: memory.uncertaintyPatterns,
              aiInterestSignals: memory.aiInterestSignals,
            },
            null,
            2
          )}
        </pre>
      </section>

      {/* Confidence Values */}
      <section className="mb-8 rounded-card border border-core-border bg-core-surface p-6">
        <h2 className="text-lg font-semibold text-core-heading mb-4">Confidence Values</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
            <p className="text-sm text-core-muted">Quiz Completions</p>
            <p className="text-2xl font-bold text-core-heading">{memory.completedQuizzes}</p>
          </div>
          <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
            <p className="text-sm text-core-muted">Avg Confidence</p>
            <p className="text-2xl font-bold text-core-heading">
              {memory.confidenceHistory.length > 0
                ? Math.round(memory.confidenceHistory.reduce((a, b) => a + b, 0) / memory.confidenceHistory.length)
                : "N/A"}
            </p>
          </div>
          <div className="rounded-3xl border border-core-border bg-core-bg/70 p-4">
            <p className="text-sm text-core-muted">Viewed Careers</p>
            <p className="text-2xl font-bold text-core-heading">
              {Object.keys(memory.viewedCareers).length}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
