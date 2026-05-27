// app/careers/page.tsx
// Lists all available career paths.
// Static — no backend call. When API is ready: fetch("/api/careers")

"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  careers as allCareers,
  type Career,
  deriveBadges,
  AVAILABLE_BADGES,
  type CareerFacets,
} from "../../data/careers";
import CareerGrid from "../../components/CareerGrid";
import CareerCategoryTabs from "../../components/CareerCategoryTabs";
import CareerFilterBar from "../../components/CareerFilterBar";
import JourneyTimelinePanel from "../../components/JourneyTimelinePanel";
import { logEvent } from "../../data/analytics-events";

const CATEGORIES = [
  "All",
  "Software Engineering",
  "AI & Data",
  "Infrastructure",
  "Security",
  "Design",
  "Management",
  "Networking",
  "QA",
  "Emerging Tech",
  "Marketing",
  "Content Creation",
];

export default function CareersPage() {
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState<string>("");
  const [aiImpact, setAiImpact] = useState<string>("any");
  const [difficulty, setDifficulty] = useState<string>("any");
  const [futureDemand, setFutureDemand] = useState<string>("any");
  const [aiRelationship, setAiRelationship] = useState<string>("any");
  const [remotePotential, setRemotePotential] = useState<string>("any");
  const [startupFriendly, setStartupFriendly] = useState<string>("any");
  const [badge, setBadge] = useState<string>("any");
  const [facets, setFacets] = useState<CareerFacets | null>(null);
  const PAGE_SIZE = 9;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  
  // Scroll visibility logic
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        setIsFilterVisible(false);
      } else {
        setIsFilterVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("corepath-compare-basket");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        const validIds = parsed.filter((id) => typeof id === "string");
        setSelectedCompare(validIds);
        
        // Auto-enable compare mode if the user already has careers in their basket
        if (validIds.length > 0) setCompareMode(true);
      } catch {
        // ignore invalid storage
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("corepath-compare-basket", JSON.stringify(selectedCompare));
  }, [selectedCompare]);

  const clearCompareSelection = () => setSelectedCompare([]);

  const toggleCompareSelection = (careerId: string) => {
    setSelectedCompare((current) => {
      if (current.includes(careerId)) {
        return current.filter((id) => id !== careerId);
      }
      if (current.length < 2) {
        return [...current, careerId];
      }
      return [current[1], careerId];
    });
  };

  useEffect(() => {
    fetch("/api/careers")
      .then((res) => res.json())
      .then((data) => setFacets(data.facets))
      .catch(() => {
        // silently ignore server fetch failures in dev
      });

    const params = new URLSearchParams(window.location.search);
    const initialFutureDemand = params.get("futureDemand");
    const initialAiRelationship = params.get("aiRelationship");
    const initialCategory = params.get("category");

    if (initialFutureDemand) setFutureDemand(initialFutureDemand);
    if (initialAiRelationship) setAiRelationship(initialAiRelationship);
    if (initialCategory) setCategory(initialCategory);
  }, []);

  useEffect(() => {
    if (category !== "All") {
      logEvent("career_category_viewed", { category });
    }
  }, [category]);

  const clearFilter = (key: string) => {
    setVisible(PAGE_SIZE);
    switch (key) {
      case "category":
        setCategory("All");
        break;
      case "query":
        setQuery("");
        break;
      case "aiImpact":
        setAiImpact("any");
        break;
      case "difficulty":
        setDifficulty("any");
        break;
      case "futureDemand":
        setFutureDemand("any");
        break;
      case "aiRelationship":
        setAiRelationship("any");
        break;
      case "remotePotential":
        setRemotePotential("any");
        break;
      case "startupFriendly":
        setStartupFriendly("any");
        break;
      case "badge":
        setBadge("any");
        break;
      default:
        break;
    }
  };

  const clearAll = () => {
    setCategory("All");
    setQuery("");
    setAiImpact("any");
    setDifficulty("any");
    setFutureDemand("any");
    setAiRelationship("any");
    setRemotePotential("any");
    setStartupFriendly("any");
    setBadge("any");
    setVisible(PAGE_SIZE);
  };

  const activeFilters = useMemo(() => {
    const filters = [] as { key: string; label: string; value: string }[];

    if (category !== "All") filters.push({ key: "category", label: "Category", value: category });
    if (query.trim()) filters.push({ key: "query", label: "Search", value: query });
    if (aiImpact !== "any") filters.push({ key: "aiImpact", label: "AI Impact", value: aiImpact });
    if (difficulty !== "any") filters.push({ key: "difficulty", label: "Specialization", value: difficulty });
    if (futureDemand !== "any") filters.push({ key: "futureDemand", label: "Outlook", value: futureDemand });
    if (aiRelationship !== "any") filters.push({ key: "aiRelationship", label: "AI relationship", value: aiRelationship });
    if (remotePotential !== "any") filters.push({ key: "remotePotential", label: "Remote", value: remotePotential });
    if (startupFriendly !== "any") filters.push({ key: "startupFriendly", label: "Startup", value: startupFriendly });
    if (badge !== "any") filters.push({ key: "badge", label: "Badge", value: badge });

    return filters;
  }, [category, query, aiImpact, difficulty, futureDemand, aiRelationship, remotePotential, startupFriendly, badge]);

  const filtered = useMemo(() => {
    let list: Career[] = allCareers.slice();
    if (category !== "All") {
      list = list.filter((c) => c.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.tagline?.toLowerCase().includes(q));
    }
    if (aiImpact !== "any") {
      list = list.filter((c) => c.aiImpact === aiImpact);
    }
    if (difficulty !== "any") {
      if (difficulty === "low") list = list.filter((c) => c.difficulty === "low");
      if (difficulty === "moderate") list = list.filter((c) => c.difficulty === "moderate");
      if (difficulty === "high") list = list.filter((c) => c.difficulty === "high" || c.difficulty === "transformative");
    }
    if (futureDemand !== "any") {
      list = list.filter((c) => c.futureDemand === futureDemand);
    }
    if (aiRelationship !== "any") {
      list = list.filter((c) => c.aiRelationship === aiRelationship);
    }
    if (remotePotential !== "any") {
      list = list.filter((c) => c.remotePotential === remotePotential);
    }
    if (startupFriendly !== "any") {
      const wantsStartup = startupFriendly === "yes";
      list = list.filter((c) => {
        const isStartup = (c.tags || []).some((t) => /startup/i.test(t));
        return wantsStartup ? isStartup : !isStartup;
      });
    }
    if (badge !== "any") {
      list = list.filter((c) => deriveBadges(c).includes(badge));
    }
    return list;
  }, [category, query, aiImpact, difficulty, futureDemand, aiRelationship, remotePotential, startupFriendly, badge]);

  useEffect(() => {
    if (activeFilters.length === 0) return;

    logEvent("filter_applied", {
      filters: activeFilters,
      resultCount: filtered.length,
    });
  }, [activeFilters, filtered.length]);

  const visibleItems = filtered.slice(0, visible);
  const selectedCareerTitles = selectedCompare.map((id) => allCareers.find((career) => career.id === id)?.title ?? id);
  const compareLink = selectedCompare.length === 2 ? `/careers/compare?careerA=${selectedCompare[0]}&careerB=${selectedCompare[1]}` : undefined;

  return (
    <div className="pt-20 pb-32 min-h-screen px-2 sm:px-6 py-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-3">Career Intelligence</p>
          <h1 className="font-display text-4xl md:text-5xl text-core-heading mb-4">
            Explore future-ready specialization profiles.
          </h1>
          <p className="text-core-muted max-w-3xl text-lg leading-relaxed">
            Use strategic filters to find roles by AI relationship, depth of work, remote potential, and startup alignment.
          </p>
          <div className="mt-6 rounded-3xl border border-core-border bg-core-bg/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-core-heading">Compare mode</p>
                <p className="mt-2 text-sm text-core-text">
                  Select two careers while browsing, then review a side-by-side comparison with history saved automatically.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCompareMode((prev) => !prev)}
                  className="rounded-full border border-core-border bg-white/5 px-4 py-2 text-sm font-semibold text-core-heading hover:border-core-accent hover:bg-core-accent/10 transition"
                >
                  {compareMode ? "Exit compare mode" : "Enable compare mode"}
                </button>
                {compareMode && selectedCompare.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearCompareSelection}
                    className="rounded-full border border-core-border bg-white/5 px-4 py-2 text-sm font-semibold text-core-heading hover:border-core-accent hover:bg-core-accent/10 transition"
                  >
                    Clear compare basket
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <JourneyTimelinePanel className="mb-8" />

          {facets && (
            <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-core-border bg-white/5 p-5 min-w-0">
                <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Total paths</p>
                <p className="mt-3 text-3xl font-bold text-core-heading">{facets.total}</p>
              </div>
              <div className="rounded-3xl border border-core-border bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-core-muted">AI-enabled</p>
                <p className="mt-3 text-3xl font-bold text-core-heading">{(facets.aiRelationship["AI-Augmented"] ?? 0) + (facets.aiRelationship["AI-Assisted"] ?? 0) + (facets.aiRelationship["AI-Created"] ?? 0)}</p>
              </div>
              <div className="rounded-3xl border border-core-border bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Fast-growth</p>
                <p className="mt-3 text-3xl font-bold text-core-heading">{facets.futureDemand.Exploding ?? 0}</p>
              </div>
              <div className="rounded-3xl border border-core-border bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Remote fit</p>
                <p className="mt-3 text-3xl font-bold text-core-heading">{facets.remotePotential.High ?? 0}</p>
              </div>
            </div>
          )}
        <div className="mb-4">
          <CareerCategoryTabs categories={CATEGORIES} selected={category} onSelect={(c) => { setCategory(c); setVisible(PAGE_SIZE); }} />
        </div>

        <div 
          className={`sticky top-20 z-30 bg-transparent pt-3 transition-all duration-300 transform ${
            isFilterVisible 
              ? "translate-y-0 opacity-100" 
              : "-translate-y-10 opacity-0 pointer-events-none"
          }`}
        >
          <CareerFilterBar
            query={query}
            onQueryChange={setQuery}
            aiImpact={aiImpact}
            onAiImpactChange={setAiImpact}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            futureDemand={futureDemand}
            onFutureDemandChange={setFutureDemand}
            aiRelationship={aiRelationship}
            onAiRelationshipChange={setAiRelationship}
            remotePotential={remotePotential}
            onRemotePotentialChange={setRemotePotential}
            startupFriendly={startupFriendly}
            onStartupFriendlyChange={setStartupFriendly}
            badge={badge}
            onBadgeChange={setBadge}
            badges={AVAILABLE_BADGES}
            activeFilters={activeFilters}
            onClearFilter={clearFilter}
            onClearAll={clearAll}
          />
        </div>

        <div className="mt-6">
          <CareerGrid
            careers={visibleItems}
            compareMode={compareMode}
            selectedCareerIds={selectedCompare}
            onToggleCompare={toggleCompareSelection}
          />
        </div>

        {visible < filtered.length && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="px-6 py-3 bg-core-accent text-white rounded-full font-semibold hover:opacity-95"
            >
              Load more
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="mt-12 text-center text-core-muted">No careers matched your search and filters.</div>
        )}
      </div>
      {selectedCompare.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-core-border bg-core-surface/95 backdrop-blur-xl px-4 sm:px-6 py-4 shadow-soft">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-core-heading">Compare basket</p>
              <p className="text-sm text-core-text">
                {selectedCareerTitles.length === 2
                  ? `${selectedCareerTitles[0]} vs ${selectedCareerTitles[1]}`
                  : `Select ${2 - selectedCareerTitles.length} more career${selectedCareerTitles.length === 1 ? "" : "s"} to compare.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearCompareSelection}
                className="rounded-full border border-core-border bg-white/5 px-4 py-2 text-sm font-semibold text-core-heading hover:border-core-accent hover:bg-core-accent/10 transition"
              >
                Clear
              </button>
              {compareLink ? (
                <Link
                  href={compareLink}
                  onClick={() => logEvent("comparison_initiated", { careerA: selectedCompare[0], careerB: selectedCompare[1] })}
                  className="rounded-full bg-core-accent px-4 py-2 text-sm font-semibold text-white hover:bg-core-accent/90 transition"
                >
                  Generate report
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
