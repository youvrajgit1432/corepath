"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  getGroupExpanded,
  setGroupExpanded,
  type GroupVisibility,
} from "../data/panel-visibility";

// ============================================================================
// TYPES
// ============================================================================

export interface PanelGroupDefinition {
  id: string;
  label: string;
  description: string;
  icon?: string;
  visibility: GroupVisibility;
  /** Hint shown to users when the group is expandable but not yet visible */
  unlockHint?: string;
}

interface AdaptivePanelContainerProps {
  group: PanelGroupDefinition;
  children: ReactNode;
}

// ============================================================================
// ANIMATED COLLAPSE WRAPPER
// ============================================================================

function CollapsibleWrapper({
  open,
  children,
  id,
}: {
  open: boolean;
  children: ReactNode;
  id: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(open ? undefined : 0);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const resizeObserver = new ResizeObserver(() => {
      if (open) {
        setHeight(el.scrollHeight);
      }
    });

    resizeObserver.observe(el);

    // Animate
    requestAnimationFrame(() => {
      if (open) {
        setHeight(el.scrollHeight);
      } else {
        setHeight(0);
      }
    });

    return () => resizeObserver.disconnect();
  }, [open, children]);

  // When children change and open, re-measure
  useEffect(() => {
    if (open && ref.current) {
      setHeight(ref.current.scrollHeight);
    }
  }, [children, open]);

  return (
    <div
      id={id}
      className="overflow-hidden transition-all duration-400 ease-out"
      style={{ height: height !== undefined ? `${height}px` : "auto" }}
      aria-hidden={!open}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}

// ============================================================================
// EXPANDABLE GROUP HEADER (for groups not yet fully unlocked)
// ============================================================================

function ExpandableHeader({
  label,
  description,
  icon,
  isExpanded,
  onToggle,
}: {
  label: string;
  description: string;
  icon?: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group w-full rounded-2xl border border-dashed border-core-border/60 bg-core-bg/30 p-4 text-left transition-all duration-200 hover:border-core-accent/40 hover:bg-core-accent/[0.02]"
      aria-expanded={isExpanded}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-core-accent/10 text-sm transition-colors group-hover:bg-core-accent/20">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted font-semibold group-hover:text-core-accent transition-colors">
              {label}
            </p>
            <p className="text-xs text-core-muted/60 mt-0.5 truncate">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-core-accent font-medium whitespace-nowrap">
            {isExpanded ? "Hide" : "Unlock insights"}
          </span>
          <svg
            className={`w-4 h-4 text-core-muted transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// PREVIEW CARD (replaces LockedPlaceholder for groups far from unlocked)
// ============================================================================

const PREVIEW_PANELS_BY_GROUP: Record<string, string[]> = {
  memory: [
    "Memory Evolution",
    "Insight Vault",
    "Coaching Intelligence",
    "Intelligence Synthesis",
    "System Self-Correction",
    "User Analytics",
    "Feedback Learning",
    "Recommendation Optimizer",
    "Experiment Engine",
  ],
  future: [
    "Future Self Projection",
    "Decision Confidence",
  ],
  growth: [
    "Growth Forecast",
    "Trend Analysis",
  ],
  story: [
    "Career Story",
    "Trajectory Narrative",
  ],
  predictions: [
    "Predictive Insights",
    "Recommendation Evolution",
    "Decision Readiness",
    "Decision Priority",
    "Decision Intelligence",
  ],
  history: [
    "Journey Replay",
    "Progress Reflection",
    "Career Momentum",
    "Career Alignment",
    "Growth Analytics",
  ],
};

function PreviewCard({
  label,
  description,
  icon,
  unlockHint,
  groupId,
}: {
  label: string;
  description: string;
  icon?: string;
  unlockHint?: string;
  groupId: string;
}) {
  const previewItems = PREVIEW_PANELS_BY_GROUP[groupId] ?? [];

  return (
    <div className="group rounded-2xl border border-dashed border-core-border/40 bg-gradient-to-br from-core-accent/[0.02] to-transparent p-4 transition-all duration-300 hover:border-core-accent/30 hover:from-core-accent/[0.04]">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-core-accent/8 text-base transition-colors group-hover:bg-core-accent/15">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs uppercase tracking-[0.24em] text-core-muted font-semibold group-hover:text-core-accent transition-colors">
              {label}
            </p>
            <span className="inline-flex items-center rounded-full border border-core-accent/20 bg-core-accent/8 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-core-accent">
              Preview
            </span>
          </div>
          <p className="text-[11px] text-core-muted/60 leading-relaxed">{description}</p>

          {/* Preview list of what's inside */}
          {previewItems.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {previewItems.slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-md border border-core-border/30 bg-core-bg/40 px-2 py-0.5 text-[9px] text-core-muted/70"
                >
                  {item}
                </span>
              ))}
              {previewItems.length > 4 && (
                <span className="inline-flex items-center rounded-md border border-core-border/30 bg-core-bg/40 px-2 py-0.5 text-[9px] text-core-muted/50">
                  +{previewItems.length - 4} more
                </span>
              )}
            </div>
          )}

          {unlockHint && (
            <p className="mt-2.5 text-[9px] text-core-muted/40 leading-relaxed">
              {unlockHint}
            </p>
          )}

          {/* Progress indicator showing how many stages away */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="h-1 flex-1 max-w-[80px] rounded-full bg-core-border/30 overflow-hidden">
              <div className="h-full w-0 rounded-full bg-core-accent/40" />
            </div>
            <span className="text-[8px] text-core-muted/30 uppercase tracking-wider">
              Unlock with engagement
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdaptivePanelContainer({
  group,
  children,
}: AdaptivePanelContainerProps) {
  const { id, label, description, icon, visibility, unlockHint } = group;

  // ── Restore expanded state from localStorage ──
  const [expanded, setExpanded] = useState(() => getGroupExpanded(id));
  const [mounted, setMounted] = useState(false);

  // Sync after mount to ensure SSR hydration matches
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      setGroupExpanded(id, next);
      return next;
    });
  }, [id]);

  // ── Not mounted yet — render skeleton to avoid hydration mismatch ──
  if (!mounted) {
    if (visibility === "visible") {
      return <div className="panel-stack opacity-0">{children}</div>;
    }
    return null;
  }

  // ── Fully visible — render children normally ──
  if (visibility === "visible") {
    return <div className="panel-stack space-y-0">{children}</div>;
  }

  // ── Hidden (far from unlocked) — show preview card instead of lock ──
  if (visibility === "hidden") {
    return (
      <PreviewCard
        label={label}
        description={description}
        icon={icon}
        unlockHint={unlockHint}
        groupId={id}
      />
    );
  }

  // ── Expandable (one stage below required) — show toggleable section ──
  return (
    <div className="space-y-2">
      <ExpandableHeader
        label={label}
        description={description}
        icon={icon}
        isExpanded={expanded}
        onToggle={handleToggle}
      />

      <CollapsibleWrapper open={expanded} id={`adaptive-panel-${id}`}>
        <div className="panel-stack pl-3 sm:pl-4 border-l-2 border-core-accent/20 ml-1 space-y-0">
          {children}
        </div>
      </CollapsibleWrapper>
    </div>
  );
}
