import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Transaction } from "@/components/dashboard/TransactionTable";
import { parseCSV } from "@/lib/parsers/csvParser";
import { parseOFX } from "@/lib/parsers/ofxParser";
import { parsePDFText } from "@/lib/parsers/pdfParser";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onTransactionsImported: (transactions: Transaction[]) => void;
}

type UploadStatus = "idle" | "loading" | "success" | "error";

export function FileUpload({ onTransactionsImported }: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStatus("loading");
    setMessage("Processando arquivo...");

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let transactions: Transaction[] = [];

      if (extension === 'csv') {
        const text = await file.text();
        transactions = parseCSV(text);
      } else if (extension === 'ofx' || extension === 'qfx') {
        const text = await file.text();
        transactions = parseOFX(text);
      } else if (extension === 'pdf') {
        // Para PDF, precisamos extrair o texto primeiro
        // Por enquanto, informamos que precisa do texto extraído
        setStatus("error");
        setMessage("Para arquivos PDF, por favor cole o texto do extrato abaixo ou use CSV/OFX para importação automática.");
        return;
      } else {
        setStatus("error");
        setMessage(`Formato não suportado: .${extension}. Use CSV, OFX ou PDF.`);
        return;
      }

      if (transactions.length === 0) {
        setStatus("error");
        setMessage("Nenhuma transação encontrada no arquivo. Verifique o formato.");
        return;
      }

      setStatus("success");
      setMessage(`${transactions.length} transações importadas com sucesso!`);
      onTransactionsImported(transactions);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      setStatus("error");
      setMessage("Erro ao processar o arquivo. Verifique se está no formato correto.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Importar Extrato
        </CardTitle>
        <CardDescription>
          Arraste ou selecione um arquivo CSV, OFX ou PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging && "border-primary bg-primary/5",
            status === "loading" && "pointer-events-none opacity-50",
            !isDragging && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.ofx,.qfx,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {status === "loading" ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Clique para selecionar ou arraste o arquivo</p>
              <p className="text-sm text-muted-foreground">
                Formatos suportados: CSV, OFX, PDF
              </p>
            </div>
          )}
        </div>

        {status === "success" && (
          <Alert className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700 dark:text-emerald-400">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>CSV:</strong> Deve conter colunas de Data, Descrição e Valor</p>
          <p><strong>OFX:</strong> Formato padrão de exportação bancária</p>
          <p><strong>PDF:</strong> Extratos em formato de texto (em desenvolvimento)</p>
        </div>
      </CardContent>
    </Card>
  );
}
