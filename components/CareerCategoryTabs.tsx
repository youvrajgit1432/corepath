import React from "react";

interface Props {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export default function CareerCategoryTabs({ categories, selected, onSelect }: Props) {
  return (
    <div className="overflow-x-auto scrollbar-none -mx-2 px-2">
      <div className="flex gap-2 py-2 items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shrink-0 ${
              selected === cat
                ? "bg-core-accent text-white shadow-sm scale-105"
                : "bg-white/8 text-core-muted hover:bg-white/15 hover:text-core-heading"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
