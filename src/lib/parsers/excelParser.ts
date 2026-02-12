import { Transaction } from "@/components/dashboard/TransactionTable";
import * as XLSX from "xlsx";
import { validateDate, validateValue, sanitizeDescription } from "./validation";

export interface ExtendedTransaction extends Transaction {
  compensationDate?: string;
  paymentMethod: "pix" | "cartao_debito" | "cartao_credito" | "ted" | "doc" | "boleto" | "outros";
  bankFee?: number;
  originalDescription?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
}

export function parseExcel(file: File): Promise<ExtendedTransaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          resolve([]);
          return;
        }

        const header = jsonData[0].map((h: any) => String(h || "").toLowerCase());
        const transactions: ExtendedTransaction[] = [];

        // Detecta índices das colunas
        const dateIdx = findColumnIndex(header, ["data", "date", "dt", "data transação"]);
        const compDateIdx = findColumnIndex(header, ["compensação", "compensation", "data compensação", "dt compensação"]);
        const descIdx = findColumnIndex(header, ["descrição", "descricao", "description", "historico", "histórico", "memo"]);
        const valueIdx = findColumnIndex(header, ["valor", "value", "amount", "quantia"]);
        const typeIdx = findColumnIndex(header, ["tipo", "type", "natureza"]);
        const feeIdx = findColumnIndex(header, ["taxa", "tarifa", "fee"]);

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const dateStr = row[dateIdx !== -1 ? dateIdx : 0];
          const description = String(row[descIdx !== -1 ? descIdx : 1] || "").trim();
          let valueStr = String(row[valueIdx !== -1 ? valueIdx : 2] || "0");
          const typeStr = typeIdx !== -1 ? String(row[typeIdx] || "").toLowerCase() : "";
          const feeStr = feeIdx !== -1 ? String(row[feeIdx] || "0") : "0";

          if (!description) continue;

          const value = parseValue(valueStr);
          const validatedValue = validateValue(value);
          if (validatedValue === null) continue;

          const fee = parseValue(feeStr);
          const parsedDate = parseExcelDate(dateStr);
          const validDate = validateDate(parsedDate);
          if (!validDate) continue;

          const compDate = compDateIdx !== -1 ? parseExcelDate(row[compDateIdx]) : undefined;
          const validCompDate = compDate ? (validateDate(compDate) ?? undefined) : undefined;

          const cleanDesc = sanitizeDescription(description);
          if (!cleanDesc) continue;

          const isCredit = typeStr.includes("credit") || typeStr.includes("entrada") || typeStr === "c" || validatedValue > 0;
          const transactionType: "entrada" | "saida" = isCredit ? "entrada" : "saida";

          const { category, paymentMethod } = detectCategoryAndMethod(cleanDesc);

          transactions.push({
            id: `excel-${i}-${Date.now()}`,
            date: validDate,
            compensationDate: validCompDate,
            description: cleanDesc,
            originalDescription: cleanDesc,
            category,
            type: transactionType,
            value: Math.abs(validatedValue),
            paymentMethod,
            bankFee: fee > 0 ? fee : undefined,
            isDuplicate: false,
          });
        }

        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo Excel"));
    reader.readAsBinaryString(file);
  });
}

function findColumnIndex(header: string[], keywords: string[]): number {
  for (const keyword of keywords) {
    const idx = header.findIndex(h => h.includes(keyword));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseValue(valueStr: string): number {
  if (typeof valueStr === "number") return valueStr;
  
  let cleaned = String(valueStr).replace(/[R$\s]/g, "").trim();
  const isNegative = cleaned.includes("-") || cleaned.startsWith("(");
  cleaned = cleaned.replace(/[-()]/g, "");

  // Formato brasileiro vs americano
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }

  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : (isNegative ? -value : value);
}

function parseExcelDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split("T")[0];

  // Se for número (serial date do Excel)
  if (typeof dateValue === "number") {
    const date = XLSX.SSF.parse_date_code(dateValue);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }

  // Se for string
  const str = String(dateValue);
  
  // DD/MM/YYYY
  let match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  // YYYY-MM-DD
  match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  return new Date().toISOString().split("T")[0];
}

function detectCategoryAndMethod(description: string): { 
  category: ExtendedTransaction["category"]; 
  paymentMethod: ExtendedTransaction["paymentMethod"];
} {
  const desc = description.toLowerCase();

  if (desc.includes("pix")) {
    return { category: "pix", paymentMethod: "pix" };
  }
  if (desc.includes("ted")) {
    return { category: "transferencia", paymentMethod: "ted" };
  }
  if (desc.includes("doc")) {
    return { category: "transferencia", paymentMethod: "doc" };
  }
  if (desc.includes("débito") || desc.includes("debito")) {
    return { category: "cartao_debito", paymentMethod: "cartao_debito" };
  }
  if (desc.includes("crédito") || desc.includes("credito") || desc.includes("cartao") || desc.includes("cartão")) {
    return { category: "cartao_credito", paymentMethod: "cartao_credito" };
  }
  if (desc.includes("boleto")) {
    return { category: "transferencia", paymentMethod: "boleto" };
  }
  if (desc.includes("transf")) {
    return { category: "transferencia", paymentMethod: "ted" };
  }
  if (desc.includes("taxa") || desc.includes("tarifa") || desc.includes("iof") || desc.includes("juros")) {
    return { category: "taxas", paymentMethod: "outros" };
  }

  return { category: "outros", paymentMethod: "outros" };
}
