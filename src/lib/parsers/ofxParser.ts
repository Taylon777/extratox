import { Transaction } from "@/components/dashboard/TransactionTable";
import { validateDate, validateValue, sanitizeDescription } from "./validation";

export function parseOFX(content: string): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Encontra todas as transações no OFX
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const trnBlock = match[1];
    
    const trnType = extractTag(trnBlock, 'TRNTYPE');
    const datePosted = extractTag(trnBlock, 'DTPOSTED');
    const amount = extractTag(trnBlock, 'TRNAMT');
    const memo = extractTag(trnBlock, 'MEMO') || extractTag(trnBlock, 'NAME') || 'Sem descrição';
    const fitId = extractTag(trnBlock, 'FITID');

    if (datePosted && amount) {
      const value = parseFloat(amount.replace(',', '.'));
      const validatedValue = validateValue(value);
      if (validatedValue === null) continue;

      const parsedDate = parseOFXDate(datePosted);
      const validDate = validateDate(parsedDate);
      if (!validDate) continue;

      const cleanDesc = sanitizeDescription(memo.trim());
      if (!cleanDesc) continue;

      transactions.push({
        id: `ofx-${fitId || Date.now()}-${transactions.length}`,
        date: validDate,
        description: cleanDesc,
        category: detectCategory(cleanDesc, trnType),
        type: validatedValue >= 0 ? 'entrada' : 'saida',
        value: Math.abs(validatedValue),
      });
    }
  }

  return transactions;
}

function extractTag(block: string, tagName: string): string | null {
  // Tenta formato XML
  const xmlRegex = new RegExp(`<${tagName}>([^<]*)<\/${tagName}>`, 'i');
  let match = block.match(xmlRegex);
  if (match) return match[1];

  // Tenta formato SGML (sem tag de fechamento)
  const sgmlRegex = new RegExp(`<${tagName}>([^\\n<]+)`, 'i');
  match = block.match(sgmlRegex);
  if (match) return match[1].trim();

  return null;
}

function parseOFXDate(dateStr: string): string {
  // Formato OFX: YYYYMMDDHHMMSS ou YYYYMMDD
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}-${month}-${day}`;
}

function detectCategory(description: string, trnType: string | null): Transaction['category'] {
  const desc = description.toLowerCase();
  const type = (trnType || '').toLowerCase();
  
  if (desc.includes('pix') || type === 'pix') return 'pix';
  if (desc.includes('ted') || desc.includes('doc') || type === 'xfer' || desc.includes('transf')) return 'transferencia';
  if (desc.includes('debito') || desc.includes('débito') || type === 'debit') return 'cartao_debito';
  if (desc.includes('credito') || desc.includes('crédito') || desc.includes('cartao') || desc.includes('cartão') || type === 'pos') return 'cartao_credito';
  if (desc.includes('taxa') || desc.includes('tarifa') || type === 'fee' || type === 'srvchg') return 'taxas';
  
  return 'outros';
}
