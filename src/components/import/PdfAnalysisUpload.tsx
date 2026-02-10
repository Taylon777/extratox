import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle, Brain, TrendingUp, TrendingDown, Info, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { uploadPdfForAnalysis, analyzePdf } from "@/lib/api/pdfAnalysis";
import { PdfAnalysisResult, PdfAnalysisTransaction } from "@/types/pdfAnalysisTypes";
import { Transaction } from "@/components/dashboard/TransactionTable";
import { toast } from "sonner";

interface PdfAnalysisUploadProps {
  onTransactionsExtracted: (transactions: Transaction[]) => void;
}

type AnalysisStep = "idle" | "uploading" | "analyzing" | "done" | "error";

const confidenceBadge = {
  high: { label: "Alta", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  medium: { label: "Média", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  low: { label: "Baixa", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

const insightIcons = {
  info: Info,
  warning: AlertTriangle,
  anomaly: Zap,
};

const categoryLabels: Record<string, string> = {
  pix: "PIX",
  transferencia: "Transferência",
  cartao_debito: "Cartão Débito",
  cartao_credito: "Cartão Crédito",
  taxas: "Taxas",
  outros: "Outros",
};

export function PdfAnalysisUpload({ onTransactionsExtracted }: PdfAnalysisUploadProps) {
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfAnalysisResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setFileName(file.name);

    try {
      setStep("uploading");
      setProgress(20);
      const { documentId } = await uploadPdfForAnalysis(file);

      setStep("analyzing");
      setProgress(50);

      const analysis = await analyzePdf(documentId);
      setProgress(100);
      setResult(analysis);
      setStep("done");
      toast.success(`Análise concluída: ${analysis.transactions.length} transações extraídas`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar PDF");
      setStep("error");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleImportTransactions = () => {
    if (!result) return;
    const transactions: Transaction[] = result.transactions.map((t, i) => ({
      id: `ai-pdf-${Date.now()}-${i}`,
      date: t.date,
      description: t.description,
      value: t.value,
      type: t.type,
      category: t.category,
    }));
    onTransactionsExtracted(transactions);
    toast.success(`${transactions.length} transações importadas!`);
  };

  const handleReset = () => {
    setStep("idle");
    setProgress(0);
    setError(null);
    setResult(null);
    setFileName("");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (step === "idle" || step === "error") {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="pdf-ai-upload"
            className="hidden"
            accept=".pdf"
            onChange={handleFileSelect}
          />
          <label htmlFor="pdf-ai-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">Análise Inteligente de PDF</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Arraste um PDF de extrato bancário ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  A IA analisa o documento visualmente, preservando tabelas, layout e contexto
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-4 w-4 text-red-500" />
                PDF até 10MB
              </div>
            </div>
          </label>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (step === "uploading" || step === "analyzing") {
    return (
      <div className="space-y-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <div className="text-center">
            <p className="text-lg font-medium">
              {step === "uploading" ? "Enviando PDF..." : "Analisando documento com IA..."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "analyzing"
                ? "A IA está lendo o documento visualmente e extraindo dados estruturados"
                : `Arquivo: ${fileName}`}
            </p>
          </div>
        </div>
        <Progress value={progress} className="max-w-md mx-auto" />
      </div>
    );
  }

  // step === "done"
  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              Documento
            </div>
            <p className="font-semibold text-sm">{result.documentType}</p>
            <p className="text-xs text-muted-foreground">{result.bankName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Entradas
            </div>
            <p className="font-semibold text-emerald-600">{formatCurrency(result.summary.totalEntradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Saídas
            </div>
            <p className="font-semibold text-red-600">{formatCurrency(result.summary.totalSaidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              Saldo Líquido
            </div>
            <p className={cn("font-semibold", result.summary.saldoLiquido >= 0 ? "text-emerald-600" : "text-red-600")}>
              {formatCurrency(result.summary.saldoLiquido)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-2">Resumo Executivo</p>
          <p className="text-sm text-muted-foreground">{result.summary.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Tabs: Transactions / Insights */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">
            Transações ({result.transactions.length})
          </TabsTrigger>
          <TabsTrigger value="insights">
            Insights ({result.insights.length})
          </TabsTrigger>
          {result.sections && result.sections.length > 0 && (
            <TabsTrigger value="sections">
              Seções ({result.sections.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Confiança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.transactions.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-sm">{t.date}</TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[t.category] || t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-mono text-sm", t.type === "entrada" ? "text-emerald-600" : "text-red-600")}>
                      {t.type === "saida" ? "-" : "+"}{formatCurrency(t.value)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", confidenceBadge[t.confidence].className)}>
                        {confidenceBadge[t.confidence].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="insights" className="mt-4 space-y-3">
          {result.insights.map((insight, i) => {
            const Icon = insightIcons[insight.type];
            return (
              <Alert key={i} variant={insight.type === "anomaly" ? "destructive" : "default"}>
                <Icon className="h-4 w-4" />
                <AlertDescription>
                  <strong>{insight.title}</strong>
                  <p className="text-sm mt-1">{insight.description}</p>
                </AlertDescription>
              </Alert>
            );
          })}
          {result.insights.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum insight identificado</p>
          )}
        </TabsContent>

        {result.sections && (
          <TabsContent value="sections" className="mt-4 space-y-3">
            {result.sections.map((section, i) => (
              <Card key={i}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                  {section.pageNumber && (
                    <CardDescription className="text-xs">Página {section.pageNumber}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm text-muted-foreground">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset}>Nova Análise</Button>
        <Button onClick={handleImportTransactions}>
          Importar {result.transactions.length} Transações
        </Button>
      </div>
    </div>
  );
}
