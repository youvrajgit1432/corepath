"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getUnreadCount,
  getNotifications,
  markAsRead,
  notificationSection,
  type AppNotification,
  priorityDotColor,
  formatPriority,
} from "../data/notification-engine";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    load();
    // Re-check every 60 seconds for new signals
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    load();
  };

  const topNotifications = notifications.slice(0, 5);

  return (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) load();
        }}
        className="relative flex items-center justify-center rounded-full p-2 text-core-header/80 transition hover:text-core-text hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-core-accent"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        aria-controls="notification-dropdown"
      >
        {/* Bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          id="notification-dropdown"
          className="absolute right-0 sm:right-auto top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] sm:max-w-xs rounded-2xl border border-core-border bg-core-surface p-3 shadow-soft backdrop-blur-xl z-50"
          role="dialog"
          aria-label="Notifications preview"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-core-muted">
              Notifications
            </p>
            <Link
              href="/"
              className="text-xs text-core-accent hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>

          {topNotifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-core-muted">
              No notifications yet
            </p>
          ) : (
            <ul className="space-y-1">
              {topNotifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-xl p-3 text-sm transition ${
                    n.read ? "opacity-60" : "bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Priority dot */}
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDotColor(n.priority)}`}
                      aria-label={`${formatPriority(n.priority)} priority`}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-core-heading text-sm leading-snug ${n.read ? "font-normal" : "font-semibold"}`}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-core-muted line-clamp-2">
                        {n.message}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        {(() => {
                          const section = notificationSection(n.signal);
                          if (section) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  window.dispatchEvent(
                                    new CustomEvent("corepath:open-command-center", {
                                      detail: { section },
                                    })
                                  );
                                  if (!n.read) handleMarkRead(n.id);
                                  setOpen(false);
                                }}
                                className="text-xs font-medium text-core-accent hover:underline"
                              >
                                {n.actionLabel ?? "Open"}
                              </button>
                            );
                          }
                          return n.actionHref ? (
                            <Link
                              href={n.actionHref}
                              className="text-xs font-medium text-core-accent hover:underline"
                              onClick={() => setOpen(false)}
                            >
                              {n.actionLabel ?? "Open"}
                            </Link>
                          ) : null;
                        })()}
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(n.id)}
                            className="text-xs text-core-muted hover:text-core-text transition"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {notifications.length > 5 && (
            <Link
              href="/"
              className="mt-2 block rounded-xl bg-white/5 py-2 text-center text-xs text-core-accent hover:bg-white/10 transition"
              onClick={() => setOpen(false)}
            >
              View all {notifications.length} notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
