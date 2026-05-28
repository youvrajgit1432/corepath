import React from "react";
import CareerCard from "./CareerCard";
import type { Career } from "../data/careers";

interface Props {
  careers: Career[];
  compareMode?: boolean;
  selectedCareerIds?: string[];
  onToggleCompare?: (careerId: string) => void;
}

export default function CareerGrid({ careers, compareMode, selectedCareerIds, onToggleCompare }: Props) {
  return (
    <>
      {/* Mobile: horizontal snap carousel */}
      <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-3 -mx-4 px-4 pb-2 scrollbar-none" role="list" aria-label="Career cards">
        {careers.map((c) => (
          <div key={c.id} className="flex-shrink-0 snap-start w-[220px] min-w-0">
            <CareerCard
              career={c}
              compareMode={compareMode}
              selected={selectedCareerIds?.includes(c.id)}
              onToggleCompare={compareMode ? onToggleCompare : undefined}
            />
          </div>
        ))}
      </div>
      {/* Tablet: 3 columns */}
      <div className="hidden md:grid lg:hidden grid-cols-3 gap-4" role="list" aria-label="Career cards">
        {careers.map((c) => (
          <CareerCard
            key={c.id}
            career={c}
            compareMode={compareMode}
            selected={selectedCareerIds?.includes(c.id)}
            onToggleCompare={compareMode ? onToggleCompare : undefined}
          />
        ))}
      </div>
      {/* Desktop: 5 columns */}
      <div className="hidden lg:grid grid-cols-5 gap-4" role="list" aria-label="Career cards">
        {careers.map((c) => (
          <CareerCard
            key={c.id}
            career={c}
            compareMode={compareMode}
            selected={selectedCareerIds?.includes(c.id)}
            onToggleCompare={compareMode ? onToggleCompare : undefined}
          />
        ))}
      </div>
    </>
  );
}
