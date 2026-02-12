import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, FileText, File, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ExtendedTransaction } from "@/types/importTypes";
import { parseFile, detectFileType, FileType } from "@/lib/parsers/unifiedParser";

interface FileUploadZoneProps {
  onTransactionsParsed: (transactions: ExtendedTransaction[], fileName: string, fileType: string) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

const fileTypeInfo: Record<FileType, { icon: typeof File; label: string; color: string }> = {
  csv: { icon: FileText, label: "CSV", color: "text-green-500" },
  ofx: { icon: FileSpreadsheet, label: "OFX/QFX", color: "text-blue-500" },
  excel: { icon: FileSpreadsheet, label: "Excel", color: "text-emerald-500" },
  pdf: { icon: FileText, label: "PDF", color: "text-red-500" },
  unknown: { icon: File, label: "Desconhecido", color: "text-gray-500" },
};

export function FileUploadZone({
  onTransactionsParsed,
  isProcessing,
  setIsProcessing,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [pdfText, setPdfText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const processFile = useCallback(async (file: File, textContent?: string) => {
    setIsProcessing(true);
    setError(null);
    setProgress(10);

    try {
      const fileType = detectFileType(file);
      
      if (fileType === "unknown") {
        throw new Error(`Formato de arquivo não suportado: ${file.name}`);
      }

      if (fileType === "pdf" && !textContent) {
        setSelectedFile(file);
        setIsProcessing(false);
        setProgress(0);
        return;
      }

      setProgress(30);

      const transactions = await parseFile(file, textContent);

      setProgress(80);

      if (transactions.length === 0) {
        throw new Error("Nenhuma transação encontrada no arquivo. Verifique o formato.");
      }

      setProgress(100);

      setTimeout(() => {
        onTransactionsParsed(transactions, file.name, fileType);
        setIsProcessing(false);
        setProgress(0);
        setSelectedFile(null);
        setPdfText("");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar arquivo");
      setIsProcessing(false);
      setProgress(0);
    }
  }, [onTransactionsParsed, setIsProcessing]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleProcessPdfText = () => {
    if (selectedFile && pdfText.trim()) {
      processFile(selectedFile, pdfText);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          isProcessing && "pointer-events-none opacity-50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.ofx,.qfx,.xlsx,.xls,.pdf"
          onChange={handleFileSelect}
          disabled={isProcessing}
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium">
                Arraste seu arquivo aqui ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Formatos suportados: CSV, OFX, Excel (.xlsx, .xls), PDF
              </p>
            </div>

            <div className="flex gap-4 mt-2">
              {Object.entries(fileTypeInfo)
                .filter(([key]) => key !== "unknown")
                .map(([key, info]) => {
                  const Icon = info.icon;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      <Icon className={cn("h-4 w-4", info.color)} />
                      {info.label}
                    </div>
                  );
                })}
            </div>
          </div>
        </label>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processando arquivo...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* PDF text input - shown when a PDF is selected */}
      {selectedFile && !isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-500" />
              PDF selecionado: {selectedFile.name}
            </CardTitle>
            <CardDescription>
              PDFs precisam de extração de texto. Cole abaixo o conteúdo copiado do seu extrato PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole aqui o conteúdo extraído do PDF do extrato bancário...

Exemplo de formato esperado:
15/01/2024 PIX Recebido - João Silva 1.500,00
15/01/2024 TED Enviada - Fornecedor ABC -2.300,00
16/01/2024 Tarifa Manutenção -35,00"
              value={pdfText}
              onChange={(e) => setPdfText(e.target.value)}
              className="min-h-[250px] font-mono text-sm"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPdfText("");
                  setSelectedFile(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleProcessPdfText}
                disabled={!pdfText.trim()}
              >
                Processar Texto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dicas de formato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dicas para Importação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>CSV:</strong> Arquivo deve ter colunas de Data, Descrição e Valor. Cabeçalho
            é detectado automaticamente.
          </p>
          <p>
            <strong>OFX/QFX:</strong> Formato padrão de extratos bancários. Compatível com a
            maioria dos bancos brasileiros.
          </p>
          <p>
            <strong>Excel:</strong> Arquivos .xlsx ou .xls com transações em formato tabular.
          </p>
          <p>
            <strong>PDF:</strong> Selecione o PDF e cole o texto extraído do extrato. Para análise
            automática com IA, use a aba "Análise IA (PDF)".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
