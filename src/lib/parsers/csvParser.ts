import { Transaction } from "@/components/dashboard/TransactionTable";
import { validateDate, validateValue, sanitizeDescription } from "./validation";

export function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const transactions: Transaction[] = [];

  // Detecta o separador (vírgula ou ponto-e-vírgula)
  const separator = header.includes(';') ? ';' : ',';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(separator).map(col => col.trim().replace(/^"|"$/g, ''));
    
    // Tenta detectar o formato baseado no header
    const headerCols = header.split(separator).map(col => col.trim().replace(/^"|"$/g, ''));
    
    const dateIdx = headerCols.findIndex(h => 
      h.includes('data') || h.includes('date') || h.includes('dt')
    );
    const descIdx = headerCols.findIndex(h => 
      h.includes('descri') || h.includes('hist') || h.includes('memo') || h.includes('description')
    );
    const valueIdx = headerCols.findIndex(h => 
      h.includes('valor') || h.includes('value') || h.includes('amount') || h.includes('quantia')
    );

    if (columns.length >= 3) {
      const dateStr = columns[dateIdx !== -1 ? dateIdx : 0];
      const description = columns[descIdx !== -1 ? descIdx : 1];
      let valueStr = columns[valueIdx !== -1 ? valueIdx : 2];

      // Normaliza o valor
      valueStr = valueStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
      const value = parseFloat(valueStr);

      if (!isNaN(value) && description) {
        const validatedValue = validateValue(value);
        if (validatedValue === null) continue;

        const parsedDate = parseDate(dateStr);
        const validDate = validateDate(parsedDate);
        if (!validDate) continue;

        const cleanDesc = sanitizeDescription(description);
        if (!cleanDesc) continue;
        
        transactions.push({
          id: `csv-${i}-${Date.now()}`,
          date: validDate,
          description: cleanDesc,
          category: detectCategory(cleanDesc),
          type: validatedValue >= 0 ? 'entrada' : 'saida',
          value: Math.abs(validatedValue),
        });
      }
    }
  }

  return transactions;
}

function parseDate(dateStr: string): string {
  // Tenta diferentes formatos de data
  const formats = [
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{4})\/(\d{2})\/(\d{2})/, // YYYY/MM/DD
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format.source.startsWith('(\\d{4})')) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
  }

  return new Date().toISOString().split('T')[0];
}

function detectCategory(description: string): Transaction['category'] {
  const desc = description.toLowerCase();
  
  if (desc.includes('pix')) return 'pix';
  if (desc.includes('ted') || desc.includes('doc') || desc.includes('transf')) return 'transferencia';
  if (desc.includes('debito') || desc.includes('débito')) return 'cartao_debito';
  if (desc.includes('credito') || desc.includes('crédito') || desc.includes('cartao') || desc.includes('cartão') || desc.includes('card')) return 'cartao_credito';
  if (desc.includes('taxa') || desc.includes('tarifa') || desc.includes('iof')) return 'taxas';
  
  return 'outros';
}
