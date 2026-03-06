/**
 * Professional rule-based transaction categorization engine.
 * Uses keyword dictionaries and pattern matching for high-accuracy classification.
 */

import type { Transaction } from "@/components/dashboard/TransactionTable";

type Category = Transaction["category"];

interface CategoryRule {
  category: Category;
  keywords: string[];
  patterns?: RegExp[];
}

const RULES: CategoryRule[] = [
  {
    category: "pix",
    keywords: [
      "pix", "pix recebido", "pix enviado", "pix transferencia",
      "pix qrcode", "pix devolucao", "pix saque", "pix troco",
    ],
    patterns: [/pix\s/i, /\bpix$/i],
  },
  {
    category: "transferencia",
    keywords: [
      "ted", "doc", "transf", "transferencia", "transferência",
      "ted enviada", "ted recebida", "doc enviada", "doc recebida",
      "transf bancaria", "ordem pagamento", "op enviada",
      "remessa", "cred conta", "deb conta",
    ],
    patterns: [/\bted\b/i, /\bdoc\b/i, /transfer[eê]ncia/i],
  },
  {
    category: "cartao_debito",
    keywords: [
      "debito", "débito", "compra débito", "compra debito",
      "venda débito", "venda debito", "pos débito", "pos debito",
      "compra visa electron", "compra maestro", "compra elo debito",
    ],
    patterns: [/d[eé]bito/i, /\bdebit\b/i],
  },
  {
    category: "cartao_credito",
    keywords: [
      "credito", "crédito", "cartao", "cartão", "visa", "mastercard",
      "elo", "amex", "hipercard", "compra crédito", "compra credito",
      "venda crédito", "venda credito", "parcela", "parcelamento",
      "anuidade", "fatura",
    ],
    patterns: [/cr[eé]dito/i, /\bcredit\b/i, /cart[aã]o/i, /parc\s?\d/i],
  },
  {
    category: "taxas",
    keywords: [
      "taxa", "tarifa", "iof", "juros", "multa", "encargos",
      "manutencao", "manutenção", "anuidade", "taxa mensal",
      "taxa bancaria", "tarifa bancaria", "imposto",
      "ir", "irrf", "csll", "cofins", "pis", "iss",
      "taxa adm", "taxa administracao", "fee", "srvchg",
      "taxa saque", "taxa transferencia",
    ],
    patterns: [/\btaxa\b/i, /\btarifa\b/i, /\biof\b/i, /\bjuros\b/i],
  },
];

/**
 * Classify a transaction description into a category.
 * First checks exact keyword inclusion, then regex patterns.
 */
export function categorizeTransaction(
  description: string,
  trnType?: string | null
): Category {
  const desc = description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const type = (trnType || "").toLowerCase();

  // OFX TRNTYPE shortcuts
  if (type === "pix") return "pix";
  if (type === "xfer" || type === "directdebit") return "transferencia";
  if (type === "pos") return "cartao_credito";
  if (type === "debit") return "cartao_debito";
  if (type === "fee" || type === "srvchg" || type === "int") return "taxas";

  // Keyword matching (highest priority)
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      const normalizedKw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (desc.includes(normalizedKw)) return rule.category;
    }
  }

  // Pattern matching (fallback)
  for (const rule of RULES) {
    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(description)) return rule.category;
      }
    }
  }

  return "outros";
}

/** Batch categorize */
export function categorizeTransactions<T extends { description: string }>(
  transactions: T[]
): (T & { category: Category })[] {
  return transactions.map((t) => ({
    ...t,
    category: categorizeTransaction(t.description),
  }));
}
