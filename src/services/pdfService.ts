/**
 * Service for reading PDFs page-by-page using pdf.js.
 * Extracts text per page with progress tracking.
 */

import * as pdfjsLib from "pdfjs-dist";

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PdfProgress {
  currentPage: number;
  totalPages: number;
  transactionsFound: number;
  duplicatesIgnored: number;
}

export interface PdfPageResult {
  pageNumber: number;
  text: string;
}

export type ProgressCallback = (progress: PdfProgress) => void;

/** Read a PDF file page by page, returning text for each page */
export async function readPdfPages(
  file: File,
  onProgress?: ProgressCallback
): Promise<PdfPageResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pages: PdfPageResult[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => item.str)
      .join(" ");

    pages.push({ pageNumber: i, text });

    onProgress?.({
      currentPage: i,
      totalPages,
      transactionsFound: 0, // Will be updated by caller
      duplicatesIgnored: 0,
    });
  }

  return pages;
}

/** Parse transactions from extracted page texts */
export function parseTransactionsFromPages(pages: PdfPageResult[]): ParsedPdfTransaction[] {
  const transactions: ParsedPdfTransaction[] = [];

  for (const page of pages) {
    const lines = page.text.split(/\n|\r\n?/).filter((l) => l.trim());
    
    for (const line of lines) {
      const parsed = tryParseLine(line);
      if (parsed) {
        transactions.push({ ...parsed, sourcePage: page.pageNumber });
      }
    }

    // Also try matching by splitting on date patterns (common in bank PDFs)
    const datePattern = /(\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2})/g;
    const parts = page.text.split(datePattern).filter((p) => p.trim());
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (/^\d{2}\/\d{2}(\/\d{4})?$/.test(parts[i].trim())) {
        const datePart = parts[i].trim();
        const restPart = parts[i + 1]?.trim() || "";
        const combined = `${datePart} ${restPart}`;
        const parsed = tryParseLine(combined);
        if (parsed && !transactions.some((t) => t.date === parsed.date && Math.abs(t.value - parsed.value) < 0.01 && t.description === parsed.description)) {
          transactions.push({ ...parsed, sourcePage: page.pageNumber });
        }
      }
    }
  }

  return transactions;
}

export interface ParsedPdfTransaction {
  date: string;
  description: string;
  value: number;
  type: "entrada" | "saida";
  category: "pix" | "transferencia" | "cartao_debito" | "cartao_credito" | "taxas" | "outros";
  sourcePage: number;
}

function tryParseLine(line: string): Omit<ParsedPdfTransaction, "sourcePage"> | null {
  // Pattern: DD/MM/YYYY description value
  const patterns = [
    // DD/MM/YYYY ... 1.234,56 or -1.234,56
    /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d{1,3}(?:\.\d{3})*,\d{2})\s*$/,
    // DD/MM/YYYY ... 1234.56
    /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\d+\.\d{2})\s*$/,
    // DD/MM ... 1.234,56
    /(\d{2}\/\d{2})\s+(.+?)\s+([-]?\d{1,3}(?:\.\d{3})*,\d{2})\s*$/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const [, dateStr, desc, valueStr] = match;
      const date = normalizeDate(dateStr);
      if (!date) continue;

      let clean = valueStr.replace(/\./g, "").replace(",", ".");
      const value = parseFloat(clean);
      if (!Number.isFinite(value) || value === 0) continue;

      const isNegative = value < 0;
      const absValue = Math.abs(value);

      return {
        date,
        description: desc.trim().slice(0, 500),
        value: absValue,
        type: isNegative ? "saida" : "entrada",
        category: detectCategory(desc),
      };
    }
  }

  return null;
}

function normalizeDate(dateStr: string): string | null {
  // DD/MM/YYYY
  const full = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (full) {
    return `${full[3]}-${full[2]}-${full[1]}`;
  }
  // DD/MM (assume current year)
  const partial = dateStr.match(/^(\d{2})\/(\d{2})$/);
  if (partial) {
    const year = new Date().getFullYear();
    return `${year}-${partial[2]}-${partial[1]}`;
  }
  return null;
}

function detectCategory(desc: string): ParsedPdfTransaction["category"] {
  const d = desc.toLowerCase();
  if (d.includes("pix")) return "pix";
  if (d.includes("ted") || d.includes("transferencia") || d.includes("transf")) return "transferencia";
  if (d.includes("débito") || d.includes("debito")) return "cartao_debito";
  if (d.includes("crédito") || d.includes("credito")) return "cartao_credito";
  if (d.includes("tarifa") || d.includes("taxa") || d.includes("iof") || d.includes("juros")) return "taxas";
  return "outros";
}
