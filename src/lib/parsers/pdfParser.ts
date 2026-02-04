import { Transaction } from "@/components/dashboard/TransactionTable";

// Parser para extrair transações de texto extraído de PDF
export function parsePDFText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Normaliza o texto, separando transações por padrão de data
  const normalizedText = normalizeTextWithDateDelimiters(text);
  const lines = normalizedText.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 8) continue;

    // Ignora linhas que parecem ser cabeçalhos ou totais
    if (isHeaderOrTotal(trimmedLine)) continue;

    const transaction = parseLine(trimmedLine);
    if (transaction) {
      transactions.push({
        ...transaction,
        id: `pdf-${Date.now()}-${transactions.length}`,
      });
    }
  }

  return transactions;
}

// Tenta extrair uma transação de uma única linha
function parseLine(line: string): Omit<Transaction, 'id'> | null {
  // Padrões de data
  const datePatterns = [
    /^(\d{2}\/\d{2}\/\d{4})/,  // DD/MM/YYYY no início
    /^(\d{2}\/\d{2})/,         // DD/MM no início
    /^(\d{2}-\d{2}-\d{4})/,    // DD-MM-YYYY no início
  ];

  let dateMatch: RegExpMatchArray | null = null;
  let dateStr = '';
  
  for (const pattern of datePatterns) {
    dateMatch = line.match(pattern);
    if (dateMatch) {
      dateStr = dateMatch[1];
      break;
    }
  }

  if (!dateMatch) return null;

  // Remove a data do início da linha
  let remaining = line.slice(dateMatch[0].length).trim();

  // Extrai o valor (último número da linha, com possível sinal negativo antes)
  const valuePattern = /([-+]?\s*R?\$?\s*)([\d.]+,\d{2})\s*$/;
  const valueMatch = remaining.match(valuePattern);
  
  if (!valueMatch) {
    // Tenta formato sem centavos
    const simpleValuePattern = /([-+]?\s*R?\$?\s*)([\d.]+)\s*$/;
    const simpleMatch = remaining.match(simpleValuePattern);
    if (!simpleMatch) return null;
    
    const value = parseValue(simpleMatch[1] + simpleMatch[2]);
    if (value === null) return null;

    const description = remaining.slice(0, simpleMatch.index).trim();
    if (!description) return null;

    const parsedDate = parsePDFDate(dateStr);
    const cleanedDesc = cleanDescription(description);

    return {
      date: parsedDate,
      description: cleanedDesc,
      category: detectCategory(cleanedDesc),
      type: value >= 0 ? 'entrada' : 'saida',
      value: Math.abs(value),
    };
  }

  const value = parseValue(valueMatch[1] + valueMatch[2]);
  if (value === null) return null;

  const description = remaining.slice(0, valueMatch.index).trim();
  if (!description) return null;

  const parsedDate = parsePDFDate(dateStr);
  const cleanedDesc = cleanDescription(description);

  return {
    date: parsedDate,
    description: cleanedDesc,
    category: detectCategory(cleanedDesc),
    type: value >= 0 ? 'entrada' : 'saida',
    value: Math.abs(value),
  };
}

// Normaliza texto que pode estar concatenado, separando por padrões de data
function normalizeTextWithDateDelimiters(text: string): string {
  // Se já tem quebras de linha com conteúdo, processa normalmente
  const existingLines = text.split('\n').filter(l => l.trim());
  if (existingLines.length > 1) {
    return text;
  }
  
  let normalized = text;
  
  // Insere quebra de linha ANTES de padrões de data que começam uma nova transação
  // Procura por valor seguido de data (ex: "1.500,0015/01/2024" -> "1.500,00\n15/01/2024")
  
  // Padrão: número com centavos (,XX) seguido de data DD/MM/YYYY
  normalized = normalized.replace(/(\d,\d{2})(\d{2}\/\d{2}\/\d{4})/g, '$1\n$2');
  
  // Padrão: número com centavos seguido de data DD/MM (sem ano)
  normalized = normalized.replace(/(\d,\d{2})(\d{2}\/\d{2})(?![\/\d])/g, '$1\n$2');
  
  // Padrão: valor inteiro seguido de data (menos comum, mas possível)
  normalized = normalized.replace(/(\d{2,})(\d{2}\/\d{2}\/\d{4})/g, (match, val, date) => {
    // Verifica se não é um valor decimal mal formatado
    if (val.length <= 2) return match;
    return val + '\n' + date;
  });
  
  return normalized;
}

function isHeaderOrTotal(text: string): boolean {
  const lowerText = text.toLowerCase();
  const headerKeywords = [
    'data', 'descrição', 'descricao', 'valor', 'saldo', 'total', 'anterior',
    'extrato', 'período', 'periodo', 'agência', 'agencia', 'conta', 'cliente',
    'banco', 'movimentação', 'movimentacao', 'lançamentos', 'lancamentos'
  ];
  
  // Se a linha é muito curta e contém palavras-chave, é provavelmente cabeçalho
  return headerKeywords.some(keyword => 
    lowerText.includes(keyword) && lowerText.length < 40
  );
}

function parseValue(valueStr: string): number | null {
  // Remove R$, espaços
  let cleaned = valueStr.replace(/[R$\s]/g, '').trim();
  
  // Detecta se é negativo
  const isNegative = cleaned.includes('-');
  cleaned = cleaned.replace(/[-+]/g, '');
  
  // Trata formato brasileiro (1.234,56)
  // Remove pontos de milhar e troca vírgula por ponto
  if (cleaned.includes(',')) {
    // Remove pontos (separadores de milhar) e troca vírgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  
  return isNegative ? -value : value;
}

function parsePDFDate(dateStr: string): string {
  const currentYear = new Date().getFullYear();
  
  // DD/MM/YYYY ou DD-MM-YYYY
  let match = dateStr.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  
  // DD/MM (assume ano atual)
  match = dateStr.match(/(\d{2})[\/\-](\d{2})/);
  if (match) {
    return `${currentYear}-${match[2]}-${match[1]}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

function cleanDescription(description: string): string {
  return description
    .replace(/\s+/g, ' ')  // Remove múltiplos espaços
    .replace(/^\d+\s*/, '') // Remove números no início
    .replace(/[-–]\s*$/, '') // Remove traços no final
    .trim();
}

function detectCategory(description: string): Transaction['category'] {
  const desc = description.toLowerCase();
  
  // PIX
  if (desc.includes('pix')) return 'pix';
  
  // Transferências
  if (desc.includes('ted') || desc.includes('doc') || desc.includes('transf')) return 'transferencia';
  
  // Taxas e tarifas (ANTES de cartão para evitar conflito)
  if (desc.includes('taxa') || desc.includes('tarifa') || desc.includes('iof') || 
      desc.includes('juros') || desc.includes('manutenção') || desc.includes('manutencao')) {
    return 'taxas';
  }
  
  // Cartão débito
  if (desc.includes('debito') || desc.includes('débito') || 
      (desc.includes('cartao') && desc.includes('debito')) ||
      (desc.includes('cartão') && desc.includes('débito'))) {
    return 'cartao_debito';
  }
  
  // Cartão crédito
  if (desc.includes('credito') || desc.includes('crédito') || 
      desc.includes('cartao') || desc.includes('cartão') || desc.includes('compra')) {
    return 'cartao_credito';
  }
  
  return 'outros';
}
