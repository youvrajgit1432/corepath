/**
 * Lightweight Sanitization Utility
 *
 * Provides basic sanitization for:
 * - Analytics metadata (string values)
 * - Career descriptions / display text
 * - Query parameters
 * - Future user input fields
 *
 * Avoids overengineering — no DOMPurify or heavy library.
 */

/** Default maximum length for text fields */
const DEFAULT_MAX_LENGTH = 1000;

/** Strip HTML tags from a string */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Strip script tags and event handlers */
export function stripScripts(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\bon\w+\s*=\s*[^\s>]+/gi, "");
}

/** Truncate string to max length, optionally with ellipsis */
export function truncate(input: string, maxLength = DEFAULT_MAX_LENGTH, ellipsis = true): string {
  if (input.length <= maxLength) return input;
  return ellipsis ? input.slice(0, maxLength - 1) + "…" : input.slice(0, maxLength);
}

/** Remove potentially dangerous characters for analytics metadata */
export function sanitizeAnalyticsValue(input: unknown): string {
  if (typeof input !== "string") return String(input ?? "");
  return truncate(
    stripScripts(stripHtml(input)),
    500
  ).trim();
}

/** Sanitize an entire analytics metadata object */
export function sanitizeAnalyticsMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeAnalyticsValue(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeAnalyticsValue(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/** Sanitize a query parameter value — strict mode for URL params */
export function sanitizeQueryParam(input: string | null, maxLength = 200): string | null {
  if (input === null) return null;
  const stripped = stripScripts(stripHtml(input));
  // Allow only safe characters: alphanumeric, hyphens, underscores, spaces, dots, slashes, colons
  const safe = stripped.replace(/[^a-zA-Z0-9\-_\s\.\/:]/g, "");
  return truncate(safe, maxLength, false) || null;
}

/** Sanitize career/tagline text for display */
export function sanitizeDisplayText(input: string): string {
  return stripScripts(stripHtml(input)).trim();
}

/** Validate that a string is safe JSON (no prototype pollution, no dangerous __proto__/constructor) */
export function isSafeJsonValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "boolean" || typeof value === "number") return true;
  if (typeof value === "string") {
    // Block strings that look like prototype pollution attempts
    if (value === "__proto__" || value === "constructor" || value === "prototype") return false;
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isSafeJsonValue);
  }
  if (typeof value === "object") {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") return false;
      if (!isSafeJsonValue((value as Record<string, unknown>)[key])) return false;
    }
    return true;
  }
  return false;
}
