import { Transaction } from "@/components/dashboard/TransactionTable";

// Parser para extrair transações de texto extraído de PDF
export function parsePDFText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Primeiro, tenta normalizar o texto separando transações por padrão de data
  // Isso é útil quando o texto é colado sem quebras de linha
  const normalizedText = normalizeTextWithDateDelimiters(text);
  const lines = normalizedText.split('\n');

  // Padrões comuns em extratos bancários brasileiros
  const patterns = [
    // DD/MM/YYYY Descrição Valor (com ou sem sinal negativo)
    /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\s*R?\$?\s*[\d.,]+(?:,\d{2})?)\s*$/,
    // DD/MM Descrição Valor
    /(\d{2}\/\d{2})\s+(.+?)\s+([-+]?\s*R?\$?\s*[\d.,]+(?:,\d{2})?)\s*$/,
    // Descrição DD/MM Valor
    /(.+?)\s+(\d{2}\/\d{2}(?:\/\d{4})?)\s+([-+]?\s*R?\$?\s*[\d.,]+(?:,\d{2})?)\s*$/,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 10) continue;

    for (const pattern of patterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        let dateStr: string;
        let description: string;
        let valueStr: string;

        if (pattern.source.startsWith('(.+?)')) {
          // Padrão: Descrição DD/MM Valor
          description = match[1].trim();
          dateStr = match[2];
          valueStr = match[3];
        } else {
          // Padrão: DD/MM Descrição Valor
          dateStr = match[1];
          description = match[2].trim();
          valueStr = match[3];
        }

        // Ignora linhas que parecem ser cabeçalhos ou totais
        if (isHeaderOrTotal(description)) continue;

        const value = parseValue(valueStr);
        if (value === null) continue;

        const parsedDate = parsePDFDate(dateStr);

        transactions.push({
          id: `pdf-${Date.now()}-${transactions.length}`,
          date: parsedDate,
          description: cleanDescription(description),
          category: detectCategory(description),
          type: value >= 0 ? 'entrada' : 'saida',
          value: Math.abs(value),
        });
        break;
      }
    }
  }

  return transactions;
}

// Normaliza texto que pode estar concatenado, separando por padrões de data
function normalizeTextWithDateDelimiters(text: string): string {
  // Se já tem quebras de linha suficientes, retorna como está
  if (text.split('\n').filter(l => l.trim()).length > 1) {
    return text;
  }
  
  // Insere quebra de linha antes de cada padrão de data DD/MM/YYYY ou DD/MM
  // Mas cuidado para não quebrar valores monetários como "1.500,00"
  let normalized = text;
  
  // Padrão: encontra datas no formato DD/MM/YYYY ou DD/MM que iniciam uma transação
  // Adiciona quebra de linha antes delas, exceto a primeira
  normalized = normalized.replace(/(\d{1,2}[,.]?\d{2,3}[,.]?\d{2})(\d{2}\/\d{2}\/\d{4})/g, '$1\n$2');
  normalized = normalized.replace(/(\d{1,2}[,.]?\d{2,3}[,.]?\d{2})(\d{2}\/\d{2}(?!\/))/g, '$1\n$2');
  
  return normalized;
}

function isHeaderOrTotal(text: string): boolean {
  const lowerText = text.toLowerCase();
  const headerKeywords = [
    'data', 'descrição', 'valor', 'saldo', 'total', 'anterior',
    'extrato', 'período', 'agência', 'conta', 'cliente'
  ];
  return headerKeywords.some(keyword => lowerText.includes(keyword) && lowerText.length < 30);
}

function parseValue(valueStr: string): number | null {
  // Remove R$, espaços e sinais
  let cleaned = valueStr.replace(/[R$\s]/g, '').trim();
  const isNegative = cleaned.includes('-') || valueStr.includes('-');
  
  cleaned = cleaned.replace(/[-+]/g, '');
  
  // Trata formato brasileiro (1.234,56) vs americano (1,234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Se vírgula vem depois do ponto, é formato brasileiro
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Só vírgula - provavelmente decimal brasileiro
    cleaned = cleaned.replace(',', '.');
  }

  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  
  return isNegative ? -value : value;
}

function parsePDFDate(dateStr: string): string {
  const currentYear = new Date().getFullYear();
  
  // DD/MM/YYYY
  let match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  
  // DD/MM (assume ano atual)
  match = dateStr.match(/(\d{2})\/(\d{2})/);
  if (match) {
    return `${currentYear}-${match[2]}-${match[1]}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

function cleanDescription(description: string): string {
  return description
    .replace(/\s+/g, ' ')
    .replace(/^\d+\s*/, '')
    .trim();
}

function detectCategory(description: string): Transaction['category'] {
  const desc = description.toLowerCase();
  
  if (desc.includes('pix')) return 'pix';
  if (desc.includes('ted') || desc.includes('doc') || desc.includes('transf')) return 'transferencia';
  if (desc.includes('debito') || desc.includes('débito')) return 'cartao_debito';
  if (desc.includes('credito') || desc.includes('crédito') || desc.includes('cartao') || desc.includes('cartão') || desc.includes('compra')) return 'cartao_credito';
  if (desc.includes('taxa') || desc.includes('tarifa') || desc.includes('iof') || desc.includes('juros')) return 'taxas';
  
  return 'outros';
}
