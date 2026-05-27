"use client";

/**
 * ErrorBoundary
 *
 * Catches render errors from the child component tree and displays
 * a recovery UI instead of a blank white page. Logs errors through
 * the analytics pipeline for production monitoring.
 *
 * Usage:
 *   <ErrorBoundary fallback={<CustomFallback />}>
 *     <RiskyComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary name="DashboardSection">
 *     <Dashboard />
 *   </ErrorBoundary>
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";

// ── Error payload for analytics ──────────────────────────────────────────────

interface ErrorEvent {
  message: string;
  stack?: string;
  component: string;
  timestamp: string;
  url: string;
}

function logErrorToAnalytics(payload: ErrorEvent) {
  try {
    // Attempt to dispatch a custom event so any analytics hook can pick it up
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("corepath:error", { detail: payload })
      );
    }

    // Fallback: console structured warn with prefix for log aggregators
    if (process.env.NODE_ENV !== "production") {
      console.groupCollapsed(
        `%c[ErrorBoundary] %c${payload.component}`,
        "color:#ef4444;font-weight:700",
        "color:#94a3b8;font-weight:400"
      );
      console.error("Error:", payload.message);
      if (payload.stack) console.error("Stack:", payload.stack);
      console.groupEnd();
    }
  } catch {
    // Analytics logging must never throw
  }
}

// ── Props & State ────────────────────────────────────────────────────────────

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI. Receives the error message and a reset callback. */
  fallback?: (props: {
    error: Error;
    reset: () => void;
  }) => ReactNode;
  /** Stable identifier so analytics can group errors by component. */
  name?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logErrorToAnalytics({
      message: error.message,
      stack: error.stack,
      component: this.props.name ?? "Unknown",
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "",
    });
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    // Use custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback({
        error: this.state.error,
        reset: this.handleReset,
      });
    }

    // Default fallback UI
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-xl">
          ⚠️
        </div>
        <h3 className="text-sm font-semibold text-core-heading mb-2">
          Something went wrong
        </h3>
        <p className="text-xs text-core-muted mb-4 max-w-md mx-auto leading-relaxed">
          This section encountered an error. You can try again or continue browsing
          other parts of the app.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center justify-center rounded-full bg-core-accent px-4 py-2 text-xs font-semibold text-white hover:bg-core-accent/90 transition-colors"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="inline-flex items-center justify-center rounded-full border border-core-border bg-white/5 px-4 py-2 text-xs font-semibold text-core-heading hover:bg-white/10 transition-colors"
          >
            Reload page
          </button>
        </div>
        {process.env.NODE_ENV !== "production" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-[10px] font-mono text-core-muted hover:text-core-text transition-colors">
              Error details
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-black/30 p-3 text-[10px] font-mono text-red-300 leading-relaxed max-h-32">
              {this.state.error.message}
              {this.state.error.stack && `\n\n${this.state.error.stack}`}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

// ── Hook-friendly wrapper ────────────────────────────────────────────────────

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: { name?: string; fallback?: ErrorBoundaryProps["fallback"] }
): React.FC<P> {
  const displayName = options?.name ?? Component.displayName ?? Component.name ?? "Component";

  function WrappedComponent(props: P) {
    return (
      <ErrorBoundary name={displayName} fallback={options?.fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  return WrappedComponent;
}
