// app/careers/page.tsx
// Lists all available career paths.
// Static — no backend call. When API is ready: fetch("/api/careers")

"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [badge, setBadge] = useState<string>("any");
  const [facets, setFacets] = useState<CareerFacets | null>(null);
  const PAGE_SIZE = 9;
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch("/api/careers")
      .then((res) => res.json())
      .then((data) => setFacets(data.facets))
      .catch(() => {
        // silently ignore server fetch failures in dev
      });
  }, []);

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
    setBadge("any");
    setVisible(PAGE_SIZE);
  };

  const activeFilters = useMemo(() => {
    const filters = [] as { key: string; label: string; value: string }[];

    if (category !== "All") filters.push({ key: "category", label: "Category", value: category });
    if (query.trim()) filters.push({ key: "query", label: "Search", value: query });
    if (aiImpact !== "any") filters.push({ key: "aiImpact", label: "AI Impact", value: aiImpact });
    if (difficulty !== "any") filters.push({ key: "difficulty", label: "Level", value: difficulty });
    if (futureDemand !== "any") filters.push({ key: "futureDemand", label: "Future Demand", value: futureDemand });
    if (aiRelationship !== "any") filters.push({ key: "aiRelationship", label: "AI Relationship", value: aiRelationship });
    if (badge !== "any") filters.push({ key: "badge", label: "Badge", value: badge });

    return filters;
  }, [category, query, aiImpact, difficulty, futureDemand, aiRelationship, badge]);

  const filtered = useMemo(() => {
    let list: Career[] = allCareers.slice();
    if (category !== "All") {
      list = list.filter((c) => c.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
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
    if (badge !== "any") {
      list = list.filter((c) => deriveBadges(c).includes(badge));
    }
    return list;
  }, [category, query, aiImpact, difficulty, futureDemand, aiRelationship, badge]);

  const visibleItems = filtered.slice(0, visible);

  return (
    <div className="pt-20 min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-mono text-core-accent uppercase tracking-widest mb-3">All Paths</p>
          <h1 className="font-display text-4xl md:text-5xl text-core-heading mb-4">
            Explore future-ready career specializations.
          </h1>
          <p className="text-core-muted max-w-3xl text-lg leading-relaxed">
            Filter by domain, AI impact, and level. Use search to find a specific role.
          </p>

          {facets && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-core-border bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Total careers</p>
                <p className="mt-3 text-3xl font-bold text-core-heading">{facets.total}</p>
              </div>
              <div className="rounded-3xl border border-core-border bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-core-muted">Exploding growth</p>
                <p className="mt-3 text-3xl font-bold text-core-heading">{facets.futureDemand.Exploding ?? 0}</p>
              </div>
              <div className="rounded-3xl border border-core-border bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-core-muted">AI Native</p>
                <p className="mt-3 text-3xl font-bold text-core-heading">{facets.badges["AI Native"] ?? 0}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <CareerCategoryTabs categories={CATEGORIES} selected={category} onSelect={(c) => { setCategory(c); setVisible(PAGE_SIZE); }} />
        </div>

        <div className="sticky top-20 z-30 bg-transparent pt-3">
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
            badge={badge}
            onBadgeChange={setBadge}
            badges={AVAILABLE_BADGES}
            activeFilters={activeFilters}
            onClearFilter={clearFilter}
            onClearAll={clearAll}
          />
        </div>

        <div className="mt-6">
          <CareerGrid careers={visibleItems} />
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
          <div className="mt-12 text-center text-core-muted">No careers found matching filters.</div>
        )}
      </div>
    </div>
  );
}
