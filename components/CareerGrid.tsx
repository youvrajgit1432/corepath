import React from "react";
import CareerCard from "./CareerCard";
import type { Career } from "../data/careers";

interface Props {
  careers: Career[];
}

export default function CareerGrid({ careers }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {careers.map((c) => (
        <CareerCard key={c.id} career={c} />
      ))}
    </div>
  );
}
