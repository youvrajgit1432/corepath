"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";

export default function UserMenu() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isLoaded) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-core-border" />
    );
  }

  if (!isSignedIn || !user) {
    return (
      <a
        href="/sign-in"
        className="rounded-full border border-core-border bg-core-surface px-4 py-1.5 text-xs font-medium text-core-text transition hover:bg-core-accent hover:text-white"
      >
        Sign In
      </a>
    );
  }

  const initials = user.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() ?? "?";

  const avatarUrl = user.imageUrl;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-core-border p-0.5 pr-3 transition hover:bg-core-surface focus:outline-none focus:ring-2 focus:ring-core-accent"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-core-accent text-[10px] font-semibold text-white">
            {initials}
          </span>
        )}
        <span className="hidden text-xs font-medium text-core-text sm:inline">
          {user.fullName ?? user.emailAddresses?.[0]?.emailAddress ?? "User"}
        </span>
        <svg
          className={`h-3 w-3 text-core-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-core-border bg-core-surface p-1 shadow-soft backdrop-blur-xl z-50"
          role="menu"
          aria-label="User menu options"
        >
          {/* User info header */}
          <div className="px-3 py-2 border-b border-core-border/50 mb-1">
            <p className="text-sm font-medium text-core-heading truncate">
              {user.fullName ?? "User"}
            </p>
            <p className="text-xs text-core-muted truncate">
              {user.emailAddresses?.[0]?.emailAddress ?? ""}
            </p>
          </div>

          {/* Menu items */}
          <a
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-core-text transition hover:bg-core-accent-soft"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <svg className="h-4 w-4 text-core-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </a>

          <a
            href="/journey"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-core-text transition hover:bg-core-accent-soft"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <svg className="h-4 w-4 text-core-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            My Journey
          </a>

          <button
            onClick={() => {
              setIsOpen(false);
              signOut({ redirectUrl: "/" });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
            role="menuitem"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
