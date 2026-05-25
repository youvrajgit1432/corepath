"use client";

import { memo, useState, useLayoutEffect } from "react";

type TraitPoint = {
  label: string;
  value: number;
};

type Props = {
  points: TraitPoint[];
  size?: number;
  className?: string;
};

const labels: Record<string, string> = {
  "systems-thinking": "Systems",
  "experimentation": "Experimentation",
  leadership: "Leadership",
  "AI-curiosity": "AI",
  "research-orientation": "Research",
  "ambiguity-tolerance": "Ambiguity",
  "stability-preference": "Stability",
  "technical-depth": "Depth",
  "operational-thinking": "Operations",
  "people-orientation": "People",
  adaptability: "Adaptability",
};

function formatLabel(label: string) {
  return labels[label] ?? label.replace(/-/g, " ");
}

function ProfileRadarChart({ points, size: propSize, className = "" }: Props) {
  // Responsive sizing: use 160px on mobile, propSize or 220px on desktop
  const [size, setSize] = useState(() => {
    if (typeof window !== "undefined") {
      const w = window.innerWidth;
      if (w < 640) return 160;
      if (w < 1024) return 190;
    }
    return 220;
  });

  useLayoutEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const newSize = propSize ?? (w < 640 ? 160 : w < 1024 ? 190 : 220);
      setSize((prev) => (prev !== newSize ? newSize : prev));
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [propSize]);

  const padding = 22;
  const center = size / 2;
  const radius = center - padding;
  const angleStep = (Math.PI * 2) / points.length;
  const normalizedPoints = points.map((point) => ({ ...point, value: Math.min(Math.max(point.value, 0), 1) }));

  const gridPolygons = Array.from({ length: 4 }, (_, index) => {
    const ratio = (index + 1) / 4;
    return normalizedPoints
      .map((_, pointIndex) => {
        const angle = angleStep * pointIndex - Math.PI / 2;
        const x = center + Math.cos(angle) * radius * ratio;
        const y = center + Math.sin(angle) * radius * ratio;
        return `${x},${y}`;
      })
      .join(" ");
  });

  const axisLines = normalizedPoints.map((_, pointIndex) => {
    const angle = angleStep * pointIndex - Math.PI / 2;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return { x, y };
  });

  const dataPath = normalizedPoints
    .map((point, pointIndex) => {
      const angle = angleStep * pointIndex - Math.PI / 2;
      const distance = radius * point.value;
      const x = center + Math.cos(angle) * distance;
      const y = center + Math.sin(angle) * distance;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={`rounded-3xl border border-core-border bg-core-surface p-4 ${className}`}>
      <div className="mb-4 text-sm font-semibold text-core-heading">Strength profile</div>
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="block">
          {gridPolygons.map((polygon, index) => (
            <polygon
              key={index}
              points={polygon}
              fill="none"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="1"
            />
          ))}
          {axisLines.map((line, index) => (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={line.x}
              y2={line.y}
              stroke="rgba(148,163,184,0.25)"
              strokeWidth="1"
            />
          ))}
          <polygon
            points={dataPath}
            fill="rgba(56,189,248,0.18)"
            stroke="rgb(56,189,248)"
            strokeWidth="2"
          />
          {normalizedPoints.map((point, pointIndex) => {
            const angle = angleStep * pointIndex - Math.PI / 2;
            const x = center + Math.cos(angle) * radius * point.value;
            const y = center + Math.sin(angle) * radius * point.value;
            return (
              <circle key={pointIndex} cx={x} cy={y} r="3" fill="rgb(56,189,248)" />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0">
          {normalizedPoints.map((point, pointIndex) => {
            const angle = angleStep * pointIndex - Math.PI / 2;
            const x = center + Math.cos(angle) * (radius + 10);
            const y = center + Math.sin(angle) * (radius + 10);
            const align = Math.abs(Math.cos(angle)) > 0.3 ? (Math.cos(angle) > 0 ? "left" : "right") : "center";
            return (
              <div
                key={pointIndex}
                className="absolute text-[11px] text-core-muted"
                style={{
                  left: x,
                  top: y,
                  transform: "translate(-50%, -50%)",
                  textAlign: align as "left" | "right" | "center",
                  width: size < 200 ? 60 : 80,
                }}
              >
                {formatLabel(point.label)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileRadarChart);

