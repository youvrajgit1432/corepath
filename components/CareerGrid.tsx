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
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Career cards">
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
  );
}
