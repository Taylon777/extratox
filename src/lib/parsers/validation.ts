/**
 * Shared validation utilities for all file parsers.
 * Ensures field-level validation for dates, values, and descriptions.
 */

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_VALUE = 1_000_000_000; // 1 billion
const MAX_DESCRIPTION_LENGTH = 500;

/** Validate and sanitize a date string in YYYY-MM-DD format */
export function validateDate(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  return dateStr;
}

/** Validate a numeric value is within reasonable bounds */
export function validateValue(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  if (Math.abs(value) > MAX_VALUE) return null;
  return value;
}

/** Sanitize a description string: trim, limit length, remove control characters */
export function sanitizeDescription(description: string): string {
  return description
    // Remove control characters (except newline/tab which are already handled)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH);
}
