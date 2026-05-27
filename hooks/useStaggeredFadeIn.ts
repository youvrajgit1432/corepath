"use client";

import { useRef, useEffect, useState } from "react";

/**
 * Returns a ref + inline style for a stagger-on-scroll fade-in + slide-up animation.
 *
 * @param index  The card's position in the list (used for stagger delay).
 * @param options.baseDelay  Delay per index step in ms (default 60).
 * @param options.maxDelay   Capped delay in ms (default 400).
 * @param options.rootMargin IntersectionObserver rootMargin (default "0px 0px -40px 0px").
 */
export function useStaggeredFadeIn(
  index: number,
  options?: {
    baseDelay?: number;
    maxDelay?: number;
    rootMargin?: string;
  },
) {
  const { baseDelay = 60, maxDelay = 400, rootMargin = "0px 0px -40px 0px" } = options ?? {};
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin, threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  const delay = Math.min(index * baseDelay, maxDelay);

  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    } as React.CSSProperties,
  };
}
