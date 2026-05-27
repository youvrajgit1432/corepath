"use client";

import { useEffect, useState } from "react";
import { getSafeStorage } from "../data/safe-storage";
import ProgressiveHome from "../components/ProgressiveHome";
import CommandCenterTabs from "../components/CommandCenterTabs";

type LayoutMode = "classic" | "dashboard";

const STORAGE_KEY = "corepath-layout-mode";

function loadLayoutMode(): LayoutMode {
  if (typeof window === "undefined") return "classic";
  const store = getSafeStorage({ silent: true });
  const saved = store.get<string>(STORAGE_KEY);
  if (saved === "classic" || saved === "dashboard") return saved;
  return "classic";
}

function saveLayoutMode(mode: LayoutMode) {
  const store = getSafeStorage({ silent: true });
  store.set(STORAGE_KEY, mode);
}

function LayoutToggle({
  mode,
  onChange,
}: {
  mode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="fixed top-24 right-2 sm:right-4 z-30 max-w-[calc(100vw-16px)]">
      <div className="flex items-center gap-1 rounded-full border border-core-border/20 bg-[var(--bg)]/90 backdrop-blur-xl p-0.5 shadow-soft">
        <button
          type="button"
          onClick={() => onChange("classic")}
          className={`flex items-center gap-1 rounded-full px-1.5 sm:px-2.5 py-1.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
            mode === "classic"
              ? "bg-core-accent/15 text-core-accent shadow-sm"
              : "text-core-muted/40 hover:text-core-muted"
          }`}
          title="Classic progressive journey view"
        >
          <span className="text-xs">🧭</span>
          <span>Classic</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("dashboard")}
          className={`flex items-center gap-1 rounded-full px-1.5 sm:px-2.5 py-1.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
            mode === "dashboard"
              ? "bg-core-accent/15 text-core-accent shadow-sm"
              : "text-core-muted/40 hover:text-core-muted"
          }`}
          title="App-style tab dashboard"
        >
          <span className="text-xs">🗂️</span>
          <span>Dashboard</span>
        </button>
      </div>
    </div>
  );
}

export default function HomeContent() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLayoutMode(loadLayoutMode());
    setMounted(true);
  }, []);

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    saveLayoutMode(mode);
  };

  if (!mounted) {
    return (
      <main className="page-shell py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-8 w-56 animate-skeleton" />
          <div className="h-5 w-96 animate-skeleton" />
        </div>
      </main>
    );
  }

  return (
    <>
      <LayoutToggle mode={layoutMode} onChange={handleLayoutChange} />

      {layoutMode === "classic" ? <ProgressiveHome /> : <CommandCenterTabs />}
    </>
  );
}
