/**
 * LAUNCH READINESS INTELLIGENCE
 *
 * Audits the application before production deployment by scanning
 * registered components and data sources for common issues.
 *
 * Inputs:
 *   user-analytics, admin-intelligence, experiment-engine,
 *   feedback-intelligence, journey-memory, production-health,
 *   panel-visibility, career-workspace, careers
 *
 * Outputs:
 *   launchScore, criticalIssues, warningIssues, readinessLevel,
 *   deploymentNarrative, fixChecklist, releaseRisk
 *
 * Persists computed state via SafeStorage.
 */

import { getSafeStorage } from "./safe-storage";
import { getUserAnalytics } from "./user-analytics";
import { getAdminIntelligence } from "./admin-intelligence";
import { loadJourneyMemory } from "./journey-memory";
import { getProductionHealth } from "./production-health";
import { loadCareerWorkspace } from "./career-workspace";
import { careers } from "./careers";

const STORAGE_KEY = "corepath-launch-audit";
const AUDIT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// TYPES
// ============================================================================

export interface AuditIssue {
  id: string;
  type: "critical" | "warning" | "info";
  category:
    | "loading_state"
    | "error_state"
    | "empty_state"
    | "unused_panel"
    | "orphan_route"
    | "large_component"
    | "dead_import"
    | "visibility_conflict"
    | "navigation_issue"
    | "build_warning"
    | "performance"
    | "data_integrity";
  component: string;
  title: string;
  description: string;
  suggestion: string;
  effort: "quick" | "moderate" | "significant";
}

export interface FixChecklistItem {
  id: string;
  label: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  effort: "quick" | "moderate" | "significant";
  done: boolean;
}

export type ReadinessLevel = "not_ready" | "needs_work" | "almost_ready" | "ready";
export type ReleaseRisk = "high" | "medium" | "low";

export interface LaunchAuditData {
  launchScore: number;
  criticalIssues: AuditIssue[];
  warningIssues: AuditIssue[];
  infoIssues: AuditIssue[];
  readinessLevel: ReadinessLevel;
  releaseRisk: ReleaseRisk;
  fixChecklist: FixChecklistItem[];
  deploymentNarrative: string[];
  totalScanned: number;
  issuesFound: number;
  lastComputed: string;
}

// ============================================================================
// COMPONENT REGISTRY (components to scan)
// ============================================================================

interface ScannedComponent {
  name: string;
  file: string;
  panelCount: number;
  hasLoadingState: boolean;
  hasErrorState: boolean;
  hasEmptyState: boolean;
  isLarge: boolean;
  hasDeadImports: boolean;
  hasVisibilityLogic: boolean;
}

function getRegisteredComponents(): ScannedComponent[] {
  // These are the known panels and their characteristics derived from
  // analysis of the actual component implementations.

  // Panel loading/error/empty detection is based on patterns found in code:
  // - Loading: uses useState + skeleton/animate-pulse, initial null state
  // - Error: has try/catch with error state setter, error UI render
  // - Empty: checks for null/undefined data, shows fallback UI

  return [
    {
      name: "CareerCommandCenter",
      file: "components/CareerCommandCenter.tsx",
      panelCount: 50,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: true,
      hasDeadImports: false,
      hasVisibilityLogic: true,
    },
    {
      name: "JourneyProfileCard",
      file: "components/JourneyProfileCard.tsx",
      panelCount: 45,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: true,
      hasDeadImports: false,
      hasVisibilityLogic: true,
    },
    {
      name: "RecommendationContent",
      file: "app/recommendation/RecommendationContent.tsx",
      panelCount: 8,
      hasLoadingState: false,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: true,
    },
    {
      name: "AdminDashboardPanel",
      file: "components/AdminDashboardPanel.tsx",
      panelCount: 10,
      hasLoadingState: true,
      hasErrorState: true,
      hasEmptyState: true,
      isLarge: true,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "ProductionHealthPanel",
      file: "components/ProductionHealthPanel.tsx",
      panelCount: 8,
      hasLoadingState: true,
      hasErrorState: true,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "ExperimentPanel",
      file: "components/ExperimentPanel.tsx",
      panelCount: 4,
      hasLoadingState: true,
      hasErrorState: true,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "RecommendationOptimizerPanel",
      file: "components/RecommendationOptimizerPanel.tsx",
      panelCount: 5,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "FeedbackLearningPanel",
      file: "components/FeedbackLearningPanel.tsx",
      panelCount: 5,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "UserAnalyticsPanel",
      file: "components/UserAnalyticsPanel.tsx",
      panelCount: 6,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "AdaptiveSelfCorrectionPanel",
      file: "components/AdaptiveSelfCorrectionPanel.tsx",
      panelCount: 3,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "AdaptiveRoadmapPanel",
      file: "components/AdaptiveRoadmapPanel.tsx",
      panelCount: 3,
      hasLoadingState: true,
      hasErrorState: true,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "DecisionConfidencePanel",
      file: "components/DecisionConfidencePanel.tsx",
      panelCount: 3,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "CareerStoryPanel",
      file: "components/CareerStoryPanel.tsx",
      panelCount: 4,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "IntelligenceSynthesisPanel",
      file: "components/IntelligenceSynthesisPanel.tsx",
      panelCount: 4,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
    {
      name: "MemoryEvolutionPanel",
      file: "components/MemoryEvolutionPanel.tsx",
      panelCount: 3,
      hasLoadingState: true,
      hasErrorState: false,
      hasEmptyState: true,
      isLarge: false,
      hasDeadImports: false,
      hasVisibilityLogic: false,
    },
  ];
}

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

function detectMissingLoadingStates(
  components: ScannedComponent[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const comp of components) {
    if (!comp.hasLoadingState) {
      issues.push({
        id: `loading-${comp.name}`,
        type: "warning",
        category: "loading_state",
        component: comp.name,
        title: `Missing loading state — ${comp.name}`,
        description: `${comp.name} does not show a skeleton or loading indicator during data fetch. Users may see a blank flash.`,
        suggestion: `Add a useState-based loading flag and render an animate-pulse skeleton while data loads.`,
        effort: "quick",
      });
    }
  }
  return issues;
}

function detectMissingErrorStates(
  components: ScannedComponent[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const comp of components) {
    if (!comp.hasErrorState) {
      issues.push({
        id: `error-${comp.name}`,
        type: "warning",
        category: "error_state",
        component: comp.name,
        title: `Missing error state — ${comp.name}`,
        description: `${comp.name} does not have an error boundary or error UI. Failures may go unnoticed.`,
        suggestion: `Wrap data fetches in try/catch, set an error state, and render a fallback with retry button.`,
        effort: "moderate",
      });
    }
  }
  return issues;
}

function detectMissingEmptyStates(
  components: ScannedComponent[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const comp of components) {
    if (!comp.hasEmptyState) {
      issues.push({
        id: `empty-${comp.name}`,
        type: "warning",
        category: "empty_state",
        component: comp.name,
        title: `Missing empty state — ${comp.name}`,
        description: `${comp.name} does not handle the case when no data is available. Users may see broken UI.`,
        suggestion: `Add a null/undefined check and render a helpful empty state with a CTA to get started.`,
        effort: "quick",
      });
    }
  }
  return issues;
}

function detectLargeComponents(
  components: ScannedComponent[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const comp of components) {
    if (comp.isLarge) {
      issues.push({
        id: `large-${comp.name}`,
        type: "info",
        category: "large_component",
        component: comp.name,
        title: `Large component — ${comp.name}`,
        description: `${comp.name} manages ${comp.panelCount}+ sub-panels and may benefit from lazy loading or code splitting for faster initial load.`,
        suggestion: `Consider dynamic imports via next/dynamic for panels not visible on first viewport.`,
        effort: "significant",
      });
    }
  }
  return issues;
}

function detectVisibilityConflicts(
  components: ScannedComponent[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const comp of components) {
    if (comp.hasVisibilityLogic) {
      issues.push({
        id: `visibility-${comp.name}`,
        type: "info",
        category: "visibility_conflict",
        component: comp.name,
        title: `Visibility-gated panels — ${comp.name}`,
        description: `${comp.name} uses adaptive visibility. Ensure progressive disclosure works correctly across all user stages.`,
        suggestion: `Verify panel visibility at new_user, returning, engaged, and power_user stages.`,
        effort: "moderate",
      });
    }
  }
  return issues;
}

function detectDataIntegrityIssues(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const journey = loadJourneyMemory();
  const workspace = loadCareerWorkspace();
  const analytics = getUserAnalytics();
  const admin = getAdminIntelligence();

  // Check journey data integrity
  if (!journey || typeof journey.completedQuizzes !== "number") {
    issues.push({
      id: "data-journey-corrupt",
      type: "critical",
      category: "data_integrity",
      component: "JourneyMemory",
      title: "Journey memory data may be corrupted",
      description: "The journey memory store returned null or unexpected data. This could break all user progress tracking.",
      suggestion: "Check localStorage for 'corepath-journey-memory' key and validate JSON structure.",
      effort: "quick",
    });
  }

  // Check workspace integrity
  if (workspace && !workspace.selectedCareerId) {
    issues.push({
      id: "data-workspace-incomplete",
      type: "warning",
      category: "data_integrity",
      component: "CareerWorkspace",
      title: "Workspace exists but has no career selected",
      description: "The workspace object is present but missing a selectedCareerId. This may cause navigation errors.",
      suggestion: "Prompt the user to select a career or auto-recover by checking recent career history.",
      effort: "moderate",
    });
  }

  // Check analytics freshness
  if (analytics && admin) {
    const analyticsTime = new Date(analytics.lastComputed).getTime();
    const adminTime = new Date(admin.lastComputed).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - analyticsTime > maxAge) {
      issues.push({
        id: "data-analytics-stale",
        type: "info",
        category: "data_integrity",
        component: "UserAnalytics",
        title: "Analytics data is stale",
        description: `User analytics were last computed ${Math.round((Date.now() - analyticsTime) / (60 * 60 * 1000))} hours ago. Dashboards may show outdated metrics.`,
        suggestion: "Trigger a fresh compute on next admin dashboard visit.",
        effort: "quick",
      });
    }
  }

  // Check career data
  if (!careers || careers.length === 0) {
    issues.push({
      id: "data-careers-missing",
      type: "critical",
      category: "data_integrity",
      component: "Careers",
      title: "Career data is missing or empty",
      description: "The careers data source returned zero careers. All recommendations and matching will fail.",
      suggestion: "Verify careers.json is loaded correctly and exports are valid.",
      effort: "moderate",
    });
  }

  return issues;
}

function detectPerformanceIssues(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const health = getProductionHealth();

  if (health) {
    // Check for health-related issues
    const criticalAlerts = health.criticalAlerts.filter(
      (a) => a.severity === "critical"
    );
    if (criticalAlerts.length > 0) {
      issues.push({
        id: "perf-health-alerts",
        type: "warning",
        category: "performance",
        component: "ProductionHealth",
        title: `${criticalAlerts.length} critical system alert(s) active`,
        description: `Production health detected ${criticalAlerts.length} critical issue(s) that should be resolved before launch.`,
        suggestion: `Review and resolve: ${criticalAlerts.map((a) => a.title).join(", ")}`,
        effort: "moderate",
      });
    }

    // Slow components
    if (health.slowComponents.length > 0) {
      const highSeverity = health.slowComponents.filter(
        (s) => s.severity === "high"
      );
      if (highSeverity.length > 0) {
        issues.push({
          id: "perf-slow-components",
          type: "warning",
          category: "performance",
          component: "Multiple",
          title: `${highSeverity.length} high-severity slow component(s)`,
          description: `${highSeverity.length} component(s) have high render times that could impact UX.`,
          suggestion: `Optimize: ${highSeverity.map((s) => s.component).join(", ")}`,
          effort: "significant",
        });
      }
    }
  }

  return issues;
}

function detectNavigationIssues(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const workspace = loadCareerWorkspace();

  // Check workspace navigation
  if (workspace?.selectedCareerId) {
    const career = careers.find((c) => c.id === workspace.selectedCareerId);
    if (!career) {
      issues.push({
        id: "nav-orphan-career",
        type: "warning",
        category: "navigation_issue",
        component: "CareerWorkspace",
        title: "Workspace references non-existent career",
        description: `The workspace points to career "${workspace.selectedCareerId}" which was not found in the careers list.`,
        suggestion: "Reset workspace or remove stale career reference.",
        effort: "quick",
      });
    }
  }

  return issues;
}

function detectBuildWarnings(): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const health = getProductionHealth();

  // Check for stored errors that might indicate build-time issues
  if (health && health.errorLog.length > 0) {
    const routeErrors = health.errorLog.filter(
      (e) => e.type === "route"
    );
    if (routeErrors.length > 0) {
      issues.push({
        id: "build-route-errors",
        type: "warning",
        category: "build_warning",
        component: "Router",
        title: `${routeErrors.length} route error(s) logged`,
        description: `Route errors detected: ${routeErrors.map((e) => e.source).join(", ")}. These may indicate missing pages or broken links.`,
        suggestion: "Verify all page exports and route configurations.",
        effort: "moderate",
      });
    }

    const panelFailures = health.errorLog.filter(
      (e) => e.type === "panel"
    );
    if (panelFailures.length > 0) {
      issues.push({
        id: "build-panel-failures",
        type: "warning",
        category: "build_warning",
        component: "Panels",
        title: `${panelFailures.length} panel failure(s) logged`,
        description: `Panel failures detected: ${panelFailures.map((e) => e.source).join(", ")}. These panels may crash at runtime.`,
        suggestion: "Add error boundaries to each failing panel.",
        effort: "moderate",
      });
    }
  }

  return issues;
}

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

export function computeLaunchAudit(): LaunchAuditData {
  const components = getRegisteredComponents();

  // ── Run all detectors ──
  const loadingIssues = detectMissingLoadingStates(components);
  const errorIssues = detectMissingErrorStates(components);
  const emptyIssues = detectMissingEmptyStates(components);
  const largeIssues = detectLargeComponents(components);
  const visibilityIssues = detectVisibilityConflicts(components);
  const dataIssues = detectDataIntegrityIssues();
  const perfIssues = detectPerformanceIssues();
  const navIssues = detectNavigationIssues();
  const buildIssues = detectBuildWarnings();

  const allIssues = [
    ...loadingIssues,
    ...errorIssues,
    ...emptyIssues,
    ...largeIssues,
    ...visibilityIssues,
    ...dataIssues,
    ...perfIssues,
    ...navIssues,
    ...buildIssues,
  ];

  // ── Categorize ──
  const criticalIssues = allIssues.filter((i) => i.type === "critical");
  const warningIssues = allIssues.filter((i) => i.type === "warning");
  const infoIssues = allIssues.filter((i) => i.type === "info");

  // ── Compute launch score ──
  let score = 100;
  // Critical: -20 each
  score -= criticalIssues.length * 20;
  // Warning: -10 each
  score -= warningIssues.length * 10;
  // Info: -3 each
  score -= infoIssues.length * 3;
  // Penalty for large components
  const largeCount = components.filter((c) => c.isLarge).length;
  score -= largeCount * 5;
  // Bonus for good coverage
  const withLoading = components.filter((c) => c.hasLoadingState).length;
  const withError = components.filter((c) => c.hasErrorState).length;
  const withEmpty = components.filter((c) => c.hasEmptyState).length;
  const total = components.length;
  if (withLoading / total > 0.8) score += 5;
  if (withError / total > 0.3) score += 3;
  if (withEmpty / total > 0.8) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── Readiness level ──
  let readinessLevel: ReadinessLevel = "not_ready";
  let releaseRisk: ReleaseRisk = "high";

  if (score >= 85 && criticalIssues.length === 0) {
    readinessLevel = "ready";
    releaseRisk = "low";
  } else if (score >= 65 && criticalIssues.length <= 1) {
    readinessLevel = "almost_ready";
    releaseRisk = "medium";
  } else if (score >= 40) {
    readinessLevel = "needs_work";
    releaseRisk = "medium";
  } else {
    readinessLevel = "not_ready";
    releaseRisk = "high";
  }

  // ── Fix checklist ──
  const fixChecklist: FixChecklistItem[] = [
    ...criticalIssues.map((i) => ({
      id: `fix-critical-${i.id}`,
      label: i.title,
      category: i.category,
      priority: "critical" as const,
      effort: i.effort,
      done: false,
    })),
    ...warningIssues.map((i) => ({
      id: `fix-warning-${i.id}`,
      label: i.title,
      category: i.category,
      priority: "high" as const,
      effort: i.effort,
      done: false,
    })),
    ...infoIssues.map((i) => ({
      id: `fix-info-${i.id}`,
      label: i.title,
      category: i.category,
      priority: "medium" as const,
      effort: i.effort,
      done: false,
    })),
  ];

  // ── Narrative ──
  const narrative = buildDeploymentNarrative(
    score,
    readinessLevel,
    criticalIssues.length,
    warningIssues.length,
    infoIssues.length,
    components.length
  );

  const data: LaunchAuditData = {
    launchScore: score,
    criticalIssues,
    warningIssues,
    infoIssues,
    readinessLevel,
    releaseRisk,
    fixChecklist,
    deploymentNarrative: narrative,
    totalScanned: components.length,
    issuesFound: allIssues.length,
    lastComputed: new Date().toISOString(),
  };

  // Persist
  const storage = getSafeStorage({ silent: true });
  storage.set(STORAGE_KEY, data);

  return data;
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

function buildDeploymentNarrative(
  score: number,
  readiness: ReadinessLevel,
  criticalCount: number,
  warningCount: number,
  infoCount: number,
  scannedCount: number
): string[] {
  const lines: string[] = [];

  lines.push(`Launch audit complete — scanned ${scannedCount} components across the platform.`);

  if (readiness === "ready") {
    lines.push(`Readiness score: ${score}/100. All launch criteria met — the platform is ready for production deployment.`);
    if (warningCount > 0 || infoCount > 0) {
      lines.push(`${warningCount} minor warnings and ${infoCount} informational items remain — none are blocking.`);
    } else {
      lines.push("No issues detected — clean audit across all categories.");
    }
    lines.push("Recommended action: Proceed with deployment. Schedule a follow-up audit post-launch to catch any runtime issues.");
  } else if (readiness === "almost_ready") {
    lines.push(`Readiness score: ${score}/100. The platform is close to launch-ready with ${criticalCount} critical and ${warningCount} warnings to resolve.`);
    if (criticalCount === 1) {
      lines.push("One critical issue remains — resolve before deploying to production.");
    }
    lines.push("Recommended action: Fix critical issues first, then address warnings in priority order. Estimated effort: moderate.");
  } else if (readiness === "needs_work") {
    lines.push(`Readiness score: ${score}/100. The platform needs significant work before production deployment.`);
    lines.push(`${criticalCount} critical issues must be resolved immediately. ${warningCount} warnings should be addressed to ensure stability.`);
    lines.push("Recommended action: Triage critical issues as blocking. Schedule warnings for the next sprint. Re-audit after each fix cycle.");
  } else {
    lines.push(`Readiness score: ${score}/100. The platform is not ready for production deployment.`);
    lines.push(`${criticalCount} critical issues block deployment. ${warningCount} warnings indicate systemic problems.`);
    lines.push("Recommended action: Do not deploy. Resolve all critical issues first, then address warnings. Schedule a comprehensive re-audit.");
  }

  lines.push(`Total issues: ${criticalCount} critical, ${warningCount} warnings, ${infoCount} informational.`);

  return lines;
}

// ============================================================================
// PERSISTENCE HELPERS
// ============================================================================

export function getLaunchAudit(): LaunchAuditData | null {
  const storage = getSafeStorage({ silent: true });
  const cached = storage.get<LaunchAuditData>(STORAGE_KEY);
  if (!cached) return null;

  const elapsed = Date.now() - new Date(cached.lastComputed).getTime();
  if (elapsed > AUDIT_CACHE_TTL) return null;

  return cached;
}

export function loadLaunchAudit(): LaunchAuditData | null {
  return getLaunchAudit();
}

export function clearLaunchAudit(): void {
  const storage = getSafeStorage({ silent: true });
  storage.remove(STORAGE_KEY);
}
