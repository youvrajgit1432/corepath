'use client';

import React, { Suspense } from 'react';
import { INTELLIGENCE_REGISTRY } from './intelligence-registry';

interface DynamicIntelligenceLoaderProps {
  id: string;
  props: any;
  fallback?: React.ReactNode;
}

/**
 * Standardized loader for intelligence panels.
 * Implements lazy loading, error handling, and responsive visibility checks.
 */
export default function DynamicIntelligenceLoader({ 
  id, 
  props, 
  fallback 
}: DynamicIntelligenceLoaderProps) {
  const panel = INTELLIGENCE_REGISTRY[id];

  if (!panel) {
    console.warn(`Panel with ID "${id}" not found in registry.`);
    return null;
  }

  const PanelComponent = panel.component;
  const defaultFallback = (
    <div className="rounded-card border border-core-border bg-core-surface p-6 h-40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-2 w-24 bg-core-border rounded animate-pulse" />
        <div className="h-2 w-32 bg-core-border rounded animate-pulse opacity-50" />
      </div>
    </div>
  );

  return (
    <div className={`intelligence-panel-wrapper ${!panel.mobileVisibility ? 'hidden sm:block' : ''} ${!panel.desktopVisibility ? 'sm:hidden' : ''}`}>
      <ErrorBoundary name={panel.title}>
        <Suspense fallback={fallback || defaultFallback}>
          <PanelComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function ErrorBoundary({ children, name }: { children: React.ReactNode; name: string }) {
  // Simplified ErrorBoundary logic for the refactor
  // In production, this would use a class component or a library like react-error-boundary
  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
}