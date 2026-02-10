import { ExtendedTransaction } from "@/types/importTypes";
import { parseCSV } from "./csvParser";
import { parseOFX } from "./ofxParser";
import { parsePDFText } from "./pdfParser";
import { parseExcel } from "./excelParser";
import { Transaction } from "@/components/dashboard/TransactionTable";

export type FileType = "csv" | "ofx" | "excel" | "pdf" | "unknown";

export function detectFileType(file: File): FileType {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type;

  if (extension === "csv" || mimeType === "text/csv") return "csv";
  if (extension === "ofx" || extension === "qfx") return "ofx";
  if (extension === "xlsx" || extension === "xls" || 
      mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "excel";
  if (extension === "pdf" || mimeType === "application/pdf") return "pdf";

  return "unknown";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TRANSACTIONS = 10000;

export async function parseFile(file: File, pdfText?: string): Promise<ExtendedTransaction[]> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo muito grande. O tamanho máximo é 10MB.");
  }

  const fileType = detectFileType(file);

  let basicTransactions: Transaction[] = [];

  switch (fileType) {
    case "csv":
      const csvContent = await readFileAsText(file);
      basicTransactions = parseCSV(csvContent);
      return convertToExtended(basicTransactions);

    case "ofx":
      const ofxContent = await readFileAsText(file);
      basicTransactions = parseOFX(ofxContent);
      return convertToExtended(basicTransactions);

    case "excel":
      return parseExcel(file);

    case "pdf":
      if (pdfText) {
        basicTransactions = parsePDFText(pdfText);
        return convertToExtended(basicTransactions);
      }
      throw new Error("PDF requer extração de texto. Cole o conteúdo do PDF na aba de texto.");

    default:
      throw new Error(`Formato de arquivo não suportado: ${file.name}`);
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsText(file);
  });
}

function convertToExtended(transactions: Transaction[]): ExtendedTransaction[] {
  const limited = transactions.slice(0, MAX_TRANSACTIONS);
  return limited.map((t) => ({
    ...t,
    description: t.description?.slice(0, 500) || '',
    paymentMethod: detectPaymentMethod(t.description, t.category),
    originalDescription: t.description?.slice(0, 500) || '',
    isDuplicate: false,
    isSelected: true,
  }));
}

function detectPaymentMethod(description: string, category: Transaction["category"]): ExtendedTransaction["paymentMethod"] {
  const desc = description.toLowerCase();

  if (desc.includes("pix")) return "pix";
  if (desc.includes("ted")) return "ted";
  if (desc.includes("doc")) return "doc";
  if (desc.includes("boleto")) return "boleto";
  if (category === "cartao_debito" || desc.includes("débito") || desc.includes("debito")) return "cartao_debito";
  if (category === "cartao_credito" || desc.includes("crédito") || desc.includes("credito")) return "cartao_credito";

  return "outros";
}

export function detectDuplicates(
  newTransactions: ExtendedTransaction[],
  existingTransactions: Transaction[]
): ExtendedTransaction[] {
  return newTransactions.map((newT) => {
    // Procura duplicatas nas transações existentes
    const existingDuplicate = existingTransactions.find((existT) => 
      existT.date === newT.date &&
      Math.abs(existT.value - newT.value) < 0.01 &&
      (existT.description.toLowerCase().includes(newT.description.toLowerCase().slice(0, 10)) ||
       newT.description.toLowerCase().includes(existT.description.toLowerCase().slice(0, 10)))
    );

    if (existingDuplicate) {
      return {
        ...newT,
        isDuplicate: true,
        duplicateOf: existingDuplicate.id,
      };
    }

    // Procura duplicatas dentro das próprias novas transações
    const internalDuplicate = newTransactions.find((other) =>
      other.id !== newT.id &&
      other.date === newT.date &&
      Math.abs(other.value - newT.value) < 0.01 &&
      other.description === newT.description
    );

    if (internalDuplicate && newT.id > internalDuplicate.id) {
      return {
        ...newT,
        isDuplicate: true,
        duplicateOf: internalDuplicate.id,
      };
    }

    return newT;
  });
}

export function calculateImportStats(transactions: ExtendedTransaction[]): {
  total: number;
  selected: number;
  entradas: number;
  saidas: number;
  totalEntradas: number;
  totalSaidas: number;
  duplicates: number;
  byPaymentMethod: Record<string, { count: number; total: number }>;
} {
  const selected = transactions.filter((t) => t.isSelected !== false);

  const entradas = selected.filter((t) => t.type === "entrada");
  const saidas = selected.filter((t) => t.type === "saida");

  const byPaymentMethod: Record<string, { count: number; total: number }> = {};

  for (const t of selected) {
    if (!byPaymentMethod[t.paymentMethod]) {
      byPaymentMethod[t.paymentMethod] = { count: 0, total: 0 };
    }
    byPaymentMethod[t.paymentMethod].count++;
    byPaymentMethod[t.paymentMethod].total += t.value;
  }

  return {
    total: transactions.length,
    selected: selected.length,
    entradas: entradas.length,
    saidas: saidas.length,
    totalEntradas: entradas.reduce((sum, t) => sum + t.value, 0),
    totalSaidas: saidas.reduce((sum, t) => sum + t.value, 0),
    duplicates: transactions.filter((t) => t.isDuplicate).length,
    byPaymentMethod,
  };
}
