/**
 * PDF multi-page upload component with progress tracking.
 * Uses pdf.js to extract text page by page.
 */

import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { readPdfPages, parseTransactionsFromPages, type PdfProgress, type ParsedPdfTransaction } from "@/services/pdfService";
import { validateFile } from "@/services/validationService";
import { ExtendedTransaction } from "@/types/importTypes";

interface PdfMultiPageUploadProps {
  onTransactionsParsed: (transactions: ExtendedTransaction[], fileName: string, fileType: string) => void;
}

export function PdfMultiPageUpload({ onTransactionsParsed }: PdfMultiPageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<PdfProgress | null>(null);

  const processPdf = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProgress(null);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || "Arquivo inválido.");
      setIsProcessing(false);
      return;
    }

    try {
      const pages = await readPdfPages(file, (p) => setProgress(p));

      if (pages.length === 0) {
        throw new Error("Nenhuma página encontrada no PDF.");
      }

      const parsed = parseTransactionsFromPages(pages);

      setProgress((prev) => prev ? { ...prev, transactionsFound: parsed.length } : null);

      if (parsed.length === 0) {
        throw new Error("Nenhuma transação identificada no PDF. Verifique o formato do extrato.");
      }

      const extended: ExtendedTransaction[] = parsed.map((t, i) => ({
        id: `pdf-${Date.now()}-${i}`,
        date: t.date,
        description: t.description,
        category: t.category,
        type: t.type,
        value: t.value,
        paymentMethod: detectPaymentMethod(t.description, t.category),
        originalDescription: t.description,
        isDuplicate: false,
        isSelected: true,
      }));

      onTransactionsParsed(extended, file.name, "pdf");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar PDF.");
    } finally {
      setIsProcessing(false);
    }
  }, [onTransactionsParsed]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") processPdf(file);
      else setError("Selecione um arquivo PDF.");
    },
    [processPdf]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processPdf(file);
    },
    [processPdf]
  );

  const progressPercent = progress ? Math.round((progress.currentPage / progress.totalPages) * 100) : 0;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          isProcessing && "pointer-events-none opacity-50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="pdf-mp-upload"
          className="hidden"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={isProcessing}
        />
        <label htmlFor="pdf-mp-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              {isProcessing ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium">Arraste seu PDF aqui</p>
              <p className="text-sm text-muted-foreground">
                Leitura página por página com extração automática de transações
              </p>
            </div>
          </div>
        </label>
      </div>

      {isProcessing && progress && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Processando página {progress.currentPage} de {progress.totalPages}
              </span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
            {progress.transactionsFound > 0 && (
              <p className="text-sm text-muted-foreground">
                {progress.transactionsFound} transações encontradas
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function detectPaymentMethod(description: string, category: ExtendedTransaction["category"]): ExtendedTransaction["paymentMethod"] {
  const d = description.toLowerCase();
  if (d.includes("pix")) return "pix";
  if (d.includes("ted")) return "ted";
  if (d.includes("doc")) return "doc";
  if (d.includes("boleto")) return "boleto";
  if (category === "cartao_debito") return "cartao_debito";
  if (category === "cartao_credito") return "cartao_credito";
  return "outros";
}
