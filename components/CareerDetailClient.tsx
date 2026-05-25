"use client";

import { useEffect, ReactNode } from "react";
import { logEvent } from "../data/analytics-events";

interface CareerDetailClientProps {
  careerId: string;
  category?: string;
  tags?: string[];
  hasRoadmap?: boolean;
  children: ReactNode;
}

export default function CareerDetailClient({
  careerId,
  category,
  tags,
  hasRoadmap,
  children,
}: CareerDetailClientProps) {
  useEffect(() => {
    logEvent("career_viewed", {
      careerId,
      category,
      careerCategory: category,
      tags,
      hasRoadmap,
      source: "career_detail_page",
    });
  }, [careerId, category, hasRoadmap, tags]);

  return <>{children}</>;
}
