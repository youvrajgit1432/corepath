"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearReadNotifications,
  notificationSection,
  type AppNotification,
  priorityDotColor,
  formatPriority,
  priorityColor,
} from "../data/notification-engine";

interface Props {
  className?: string;
}

export default function NotificationPanel({ className = "" }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const load = useCallback(() => {
    setNotifications(getNotifications());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    load();
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    load();
  };

  const handleClearRead = () => {
    clearReadNotifications();
    load();
  };

  if (notifications.length === 0) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <section className={`rounded-card border border-core-border bg-core-surface p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-core-muted">
            Notifications
          </p>
          <h2 className="mt-1 text-lg font-semibold text-core-heading">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-full bg-core-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
            >
              Mark all read
            </button>
          )}
          {notifications.length > unreadCount && (
            <button
              type="button"
              onClick={handleClearRead}
              className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:text-core-text hover:bg-white/5"
            >
              Clear read
            </button>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border p-4 transition ${
              n.read
                ? "border-core-border bg-core-bg/40 opacity-70"
                : "border-core-accent/20 bg-core-bg/70"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Priority dot */}
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${priorityDotColor(n.priority)}`}
                aria-label={`${formatPriority(n.priority)} priority`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={`text-sm leading-snug ${
                      n.read
                        ? "text-core-text font-normal"
                        : "text-core-heading font-semibold"
                    }`}
                  >
                    {n.title}
                  </p>
                  <span className={`text-[10px] uppercase tracking-wider ${priorityColor(n.priority)}`}>
                    {formatPriority(n.priority)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-core-muted leading-relaxed">
                  {n.message}
                </p>

                <p className="mt-1 text-[11px] text-core-muted/60">
                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <div className="mt-3 flex items-center gap-3">
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
                          }}
                          className="text-xs font-medium text-core-accent hover:underline"
                        >
                          {n.actionLabel ?? "Open"} →
                        </button>
                      );
                    }
                    return n.actionHref ? (
                      <Link
                        href={n.actionHref}
                        className="text-xs font-medium text-core-accent hover:underline"
                      >
                        {n.actionLabel ?? "Open"} →
                      </Link>
                    ) : null;
                  })()}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="text-xs text-core-muted hover:text-core-text transition"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
