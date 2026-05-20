import React from "react";

interface Props {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export default function CareerCategoryTabs({ categories, selected, onSelect }: Props) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-3 px-2 py-3 items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
              selected === cat
                ? "bg-core-accent text-white shadow-md"
                : "bg-white/10 text-core-muted hover:bg-core-surface"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
