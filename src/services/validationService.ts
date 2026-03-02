/**
 * Service for validating imported file structure and transaction data.
 */

const ALLOWED_TYPES = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
  "application/x-ofx",
  "text/plain", // OFX sometimes detected as text/plain
]);

const ALLOWED_EXTENSIONS = new Set(["csv", "ofx", "qfx", "xlsx", "xls", "pdf"]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TRANSACTIONS = 10_000;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_VALUE = 1_000_000_000;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Formato não suportado: .${ext}. Use CSV, OFX, Excel ou PDF.` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: "Arquivo vazio ou corrompido." };
  }

  return { valid: true };
}

export function validateDate(dateStr: string): boolean {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  if (y < MIN_YEAR || y > MAX_YEAR) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  // Check if it's a real date
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function validateValue(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= MAX_VALUE;
}

export function validateTransactionCount(count: number): ValidationResult {
  if (count === 0) {
    return { valid: false, error: "Nenhuma transação encontrada no arquivo." };
  }
  if (count > MAX_TRANSACTIONS) {
    return { valid: false, error: `Muitas transações (${count}). Máximo: ${MAX_TRANSACTIONS.toLocaleString()}.` };
  }
  return { valid: true };
}

/** Normalize Brazilian date formats to ISO YYYY-MM-DD */
export function normalizeDate(dateStr: string): string | null {
  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = dateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    const iso = `${y}-${m}-${d}`;
    return validateDate(iso) ? iso : null;
  }
  // YYYY-MM-DD already
  if (validateDate(dateStr)) return dateStr;
  // YYYYMMDD
  const compactMatch = dateStr.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const [, y, m, d] = compactMatch;
    const iso = `${y}-${m}-${d}`;
    return validateDate(iso) ? iso : null;
  }
  return null;
}

/** Normalize Brazilian currency string to number */
export function normalizeValue(valueStr: string): number | null {
  // Remove R$ prefix and whitespace
  let clean = valueStr.replace(/R\$\s*/g, "").trim();
  // Handle Brazilian format: 1.234,56 → 1234.56
  if (clean.includes(",")) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  }
  const num = parseFloat(clean);
  return validateValue(num) ? num : null;
}
