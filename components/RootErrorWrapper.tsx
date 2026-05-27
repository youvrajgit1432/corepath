"use client";

/**
 * RootErrorWrapper
 *
 * Thin wrapper around ErrorBoundary that provides the ErrorFallbackShell
 * as the fallback. Exists solely because Next.js app router doesn't allow
 * passing function props from server components to client components.
 *
 * Usage in layout.tsx:
 *   <RootErrorWrapper>
 *     {children}
 *   </RootErrorWrapper>
 */

import { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import ErrorFallbackShell from "./ErrorFallbackShell";

interface Props {
  children: ReactNode;
}

export default function RootErrorWrapper({ children }: Props) {
  return (
    <ErrorBoundary
      name="RootLayout"
      fallback={({ reset }) => <ErrorFallbackShell onReset={reset} />}
    >
      {children}
    </ErrorBoundary>
  );
}
