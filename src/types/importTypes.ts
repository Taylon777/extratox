import { Transaction } from "@/components/dashboard/TransactionTable";

export interface ExtendedTransaction extends Transaction {
  compensationDate?: string;
  paymentMethod: "pix" | "cartao_debito" | "cartao_credito" | "ted" | "doc" | "boleto" | "outros";
  bankFee?: number;
  originalDescription?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  isSelected?: boolean;
  isEdited?: boolean;
}

export interface ImportLog {
  id: string;
  userId: string;
  timestamp: Date;
  fileName: string;
  fileType: string;
  totalTransactions: number;
  importedTransactions: number;
  removedTransactions: number;
  editedTransactions: number;
  duplicatesDetected: number;
  status: "success" | "partial" | "failed";
}

export interface ImportStats {
  total: number;
  entradas: number;
  saidas: number;
  totalEntradas: number;
  totalSaidas: number;
  byCategory: Record<string, { count: number; total: number }>;
  byPaymentMethod: Record<string, { count: number; total: number }>;
  duplicates: number;
  fees: number;
}

export type PaymentMethodLabels = {
  [K in ExtendedTransaction["paymentMethod"]]: string;
};

export const paymentMethodLabels: PaymentMethodLabels = {
  pix: "PIX",
  cartao_debito: "Cartão Débito",
  cartao_credito: "Cartão Crédito",
  ted: "TED",
  doc: "DOC",
  boleto: "Boleto",
  outros: "Outros",
};

export const categoryLabels: Record<Transaction["category"], string> = {
  pix: "Pix",
  transferencia: "Transferência",
  cartao_debito: "Vendas – Disponível Débito",
  cartao_credito: "Vendas – Disponível Crédito",
  taxas: "Taxas",
  outros: "Outros",
};
