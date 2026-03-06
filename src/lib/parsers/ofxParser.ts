import { Transaction } from "@/components/dashboard/TransactionTable";
import { validateDate, validateValue, sanitizeDescription } from "./validation";
import { categorizeTransaction } from "@/lib/categorization";

export interface OFXMetadata {
  fitId: string | null;
  trnType: string | null;
  memo: string | null;
  name: string | null;
  originalOrder: number;
}

export interface OFXTransaction extends Transaction {
  metadata: OFXMetadata;
}

export function parseOFX(content: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];

  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  let order = 0;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const trnBlock = match[1];
    order++;

    const trnType = extractTag(trnBlock, "TRNTYPE");
    const datePosted = extractTag(trnBlock, "DTPOSTED");
    const amount = extractTag(trnBlock, "TRNAMT");
    const memo = extractTag(trnBlock, "MEMO");
    const name = extractTag(trnBlock, "NAME");
    const fitId = extractTag(trnBlock, "FITID");

    const description = memo || name || "Sem descrição";

    if (datePosted && amount) {
      const value = parseFloat(amount.replace(",", "."));
      const validatedValue = validateValue(value);
      if (validatedValue === null) continue;

      const parsedDate = parseOFXDate(datePosted);
      const validDate = validateDate(parsedDate);
      if (!validDate) continue;

      const cleanDesc = sanitizeDescription(description.trim());
      if (!cleanDesc) continue;

      transactions.push({
        id: `ofx-${fitId || Date.now()}-${transactions.length}`,
        date: validDate,
        description: cleanDesc,
        category: categorizeTransaction(cleanDesc, trnType),
        type: validatedValue >= 0 ? "entrada" : "saida",
        value: Math.abs(validatedValue),
        metadata: {
          fitId,
          trnType,
          memo,
          name,
          originalOrder: order,
        },
      });
    }
  }

  return transactions;
}

function extractTag(block: string, tagName: string): string | null {
  // XML format
  const xmlRegex = new RegExp(`<${tagName}>([^<]*)<\/${tagName}>`, "i");
  let m = block.match(xmlRegex);
  if (m) return m[1];

  // SGML format (no closing tag)
  const sgmlRegex = new RegExp(`<${tagName}>([^\\n<]+)`, "i");
  m = block.match(sgmlRegex);
  if (m) return m[1].trim();

  return null;
}

function parseOFXDate(dateStr: string): string {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}
