"use client";

import { useState, useEffect } from "react";
import AdminDashboardPanel from "../../components/AdminDashboardPanel";
import ProductionHealthPanel from "../../components/ProductionHealthPanel";
import LaunchAuditPanel from "../../components/LaunchAuditPanel";

const ADMIN_PASSWORD = "admin";
const AUTH_KEY = "corepath-admin-auth";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored === "true") {
        setAuthenticated(true);
      }
    } catch {
      // localStorage not available
    }
    setChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
      try {
        localStorage.setItem(AUTH_KEY, "true");
      } catch {
        // persist silently
      }
    } else {
      setError("Invalid password. Try \"admin\".");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // cleanup silently
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-core-accent border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-core-border bg-core-surface p-8 shadow-soft">
            <div className="mb-6 text-center">
              <span className="text-4xl">🔐</span>
              <h1 className="mt-4 text-2xl font-semibold text-core-heading">Admin Access</h1>
              <p className="mt-2 text-sm text-core-muted">
                Enter the admin password to access the Intelligence Dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-password" className="block text-xs font-medium text-core-muted mb-1.5">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter admin password..."
                  className="w-full rounded-xl border border-core-border bg-core-bg/60 px-4 py-2.5 text-sm text-core-heading placeholder-core-muted focus:outline-none focus:ring-2 focus:ring-core-accent/50"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-core-accent py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Enter Dashboard
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-core-muted">
              Mock auth gate — default password: <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono">admin</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Admin navigation bar */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-core-border bg-core-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-semibold text-core-heading hover:text-core-accent transition-colors">
              CorePath
            </a>
            <span className="text-core-muted">/</span>
            <span className="text-sm text-core-accent">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/insights"
              className="text-xs text-core-muted hover:text-core-heading transition-colors"
            >
              Product Insights
            </a>
            <a
              href="/admin/debug"
              className="text-xs text-core-muted hover:text-core-heading transition-colors"
            >
              Debug
            </a>
            <a
              href="/admin/accessibility"
              className="text-xs text-core-muted hover:text-core-heading transition-colors"
            >
              A11y
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-core-border px-3 py-1.5 text-xs font-medium text-core-muted transition hover:border-red-500/40 hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <AdminDashboardPanel />

      <div className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mt-8 border-t border-core-border pt-8">
          <ProductionHealthPanel />
        </div>

        <div className="mt-8 border-t border-core-border pt-8">
          <LaunchAuditPanel />
        </div>
      </div>
    </>
  );
}
