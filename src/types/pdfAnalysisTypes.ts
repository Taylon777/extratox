export interface PdfAnalysisTransaction {
  date: string;
  description: string;
  value: number;
  type: "entrada" | "saida";
  category: "pix" | "transferencia" | "cartao_debito" | "cartao_credito" | "taxas" | "outros";
  confidence: "high" | "medium" | "low";
}

export interface PdfAnalysisInsight {
  type: "info" | "warning" | "anomaly";
  title: string;
  description: string;
}

export interface PdfAnalysisSection {
  title: string;
  content: string;
  pageNumber?: number;
}

export interface PdfAnalysisResult {
  documentType: string;
  bankName: string;
  period?: {
    start: string;
    end: string;
  };
  summary: {
    totalEntradas: number;
    totalSaidas: number;
    saldoLiquido: number;
    totalTransacoes: number;
    executiveSummary: string;
  };
  transactions: PdfAnalysisTransaction[];
  insights: PdfAnalysisInsight[];
  sections?: PdfAnalysisSection[];
}

export interface DocumentUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_hash?: string;
  status: "pending" | "processing" | "completed" | "failed";
  analysis_result?: PdfAnalysisResult;
  error_message?: string;
  page_count?: number;
  created_at: string;
  updated_at: string;
}
