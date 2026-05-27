/**
 * FLOATING COMMAND CENTER
 *
 * Floating expandable assistant panel that replaces the inline Command Center.
 * - Circular floating button (bottom-right, fixed position)
 * - Smooth expand/collapse via Framer Motion AnimatePresence
 * - Glassmorphism panel with backdrop blur
 * - Fullscreen / minimize toggle
 * - Contains the full CareerCommandCenter in forced-expanded mode
 * - Persistent across page navigation
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import CareerCommandCenter from "./CareerCommandCenter";
import { getUnreadCount } from "../data/notification-engine";

// ── Motion variants ──────────────────────────────────────────────────────────

const panelVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    x: 24,
    y: 8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      damping: 28,
      stiffness: 340,
      mass: 0.8,
      opacity: { duration: 0.2 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    x: 24,
    y: 8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.08 },
  tap: { scale: 0.92 },
};

// ── Icons ────────────────────────────────────────────────────────────────────

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2l1.09 4.91L18 8l-4.91 1.09L12 14l-1.09-4.91L6 8l4.91-1.09z" />
      <path d="M18 14l.82 3.18L22 18l-3.18.82L18 22l-.82-3.18L14 18l3.18-.82z" />
      <path d="M4 10l.55 2.45L7 13l-2.45.55L4 16l-.55-2.45L1 13l2.45-.55z" />
    </svg>
  );
}

function ExpandIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5.707l2.647 2.646a1 1 0 01-1.414 1.414L4.293 6.293V8a1 1 0 01-2 0V4zm13-1a1 1 0 011 1v4a1 1 0 01-2 0V6.293l-2.646 2.647a1 1 0 11-1.414-1.414L14.293 5H13a1 1 0 010-2h3zM4.293 13.293A1 1 0 015 13h4a1 1 0 010 2H6.293l2.647 2.646a1 1 0 01-1.414 1.414L4.293 15.707V17a1 1 0 01-2 0v-4a1 1 0 01.293-.707zm11.414 0A1 1 0 0116 13.5V14a1 1 0 01-1 1h-4a1 1 0 010-2h2.707l-2.647-2.646a1 1 0 111.414-1.414l2.647 2.646V11a1 1 0 012 0v2.5a1 1 0 01-.293.707z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MinimizeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12a1 1 0 01-1-1zM4 13a1 1 0 011 1v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 17H8a1 1 0 010 2H4a1 1 0 01-1-1v-4a1 1 0 011-1zm12 0a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 15.586V14a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FloatingCommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);

  // Track unread count for badge
  useEffect(() => {
    const update = () => setUnreadBadge(getUnreadCount());
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  const toggle = () => {
    if (isOpen) {
      setIsFullscreen(false);
    }
    setIsOpen((prev) => !prev);
  };

  const close = () => {
    setIsFullscreen(false);
    setIsOpen(false);
  };

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  return (
    <div className="fixed right-6 bottom-8 z-50 flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="command-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`pointer-events-auto overflow-y-auto rounded-3xl border border-white/[0.08] bg-[var(--bg)]/80 backdrop-blur-2xl shadow-2xl shadow-black/30 transition-all duration-300 ${
              isFullscreen
                ? "fixed inset-3 sm:inset-6 md:inset-10 w-auto h-auto max-w-none max-h-none"
                : "w-[calc(100vw-32px)] max-w-[400px] md:w-[400px] max-h-[75vh] md:max-h-[70vh] left-4 right-4 sm:left-auto sm:right-auto"
            }`}
            style={{ scrollbarWidth: "thin" }}
          >
            {/* Action buttons pinned top-right inside panel */}
            <div className="sticky top-3 z-10 flex items-center justify-end gap-1.5 px-3 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[var(--bg)]/60 backdrop-blur-sm px-1 py-1 border border-white/[0.06]">
                {/* Fullscreen / Minimize toggle */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-core-muted hover:bg-white/10 hover:text-core-text transition-colors"
                  aria-label={
                    isFullscreen
                      ? "Minimize command center"
                      : "Expand command center to fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <MinimizeIcon className="h-4 w-4" />
                  ) : (
                    <ExpandIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Close button */}
                <button
                  type="button"
                  onClick={close}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-core-muted hover:bg-white/10 hover:text-core-text transition-colors"
                  aria-label="Close command center"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <CareerCommandCenter defaultExpanded />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button (visually hidden in fullscreen) */}
      <motion.button
        type="button"
        onClick={toggle}
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        animate={isOpen ? { rotate: 45 } : { rotate: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={`pointer-events-auto relative h-14 w-14 rounded-full bg-gradient-to-br from-core-accent via-indigo-500 to-indigo-600 shadow-lg shadow-core-accent/25 flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-core-accent/50 focus:ring-offset-2 focus:ring-offset-core-bg transition-all duration-200 ${
          isFullscreen ? "opacity-0 scale-0" : "opacity-100 scale-100"
        }`}
        aria-label={isOpen ? "Close command center" : "Open command center"}
      >
        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping bg-core-accent/20 pointer-events-none" />
        )}

        {/* Glow overlay */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

        {/* AI Sparkle icon */}
        <SparkleIcon className="relative h-6 w-6" />

        {/* Unread badge */}
        {unreadBadge > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm pointer-events-none">
            {unreadBadge > 9 ? "9+" : unreadBadge}
          </span>
        )}
      </motion.button>
    </div>
  );
}
