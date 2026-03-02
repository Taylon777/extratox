import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, History, CheckCircle2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileUploadZone } from "@/components/import/FileUploadZone";
import { PdfAnalysisUpload } from "@/components/import/PdfAnalysisUpload";
import { ImportPreviewTable } from "@/components/import/ImportPreviewTable";
import { ImportLogHistory } from "@/components/import/ImportLogHistory";
import { ExtendedTransaction } from "@/types/importTypes";
import { BankCode, bankLabels, TemplateWithRelations } from "@/types/templateTypes";
import { detectDuplicates } from "@/lib/parsers/unifiedParser";
import { detectBank } from "@/lib/bankDetection";
import { findMatchingTemplate } from "@/lib/templateService";
import { saveImportLog, createImportLog } from "@/lib/importLogs";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import {
  createImportSession,
  fetchExistingHashes,
  saveTransactionsWithDedup,
} from "@/services/importService";
import { toast } from "sonner";

type ImportStep = "upload" | "preview" | "success";

export default function ImportFinanceira() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions: existingTransactions, addTransactions, refetch } = useTransactions();
  const [step, setStep] = useState<ImportStep>("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [importInfo, setImportInfo] = useState({ fileName: "", fileType: "" });
  const [showHistory, setShowHistory] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [duplicatesSkipped, setDuplicatesSkipped] = useState(0);
  const [detectedBank, setDetectedBank] = useState<BankCode>("generic");
  const [matchedTemplate, setMatchedTemplate] = useState<TemplateWithRelations | null>(null);

  const handleTransactionsParsed = async (
    parsedTransactions: ExtendedTransaction[],
    fileName: string,
    fileType: string
  ) => {
    const withDuplicates = detectDuplicates(parsedTransactions, existingTransactions);
    const withSelection = withDuplicates.map((t) => ({ ...t, isSelected: true }));

    const allDescriptions = parsedTransactions.map((t) => t.description).join(" ");
    const bankResult = await detectBank(allDescriptions + " " + fileName);
    setDetectedBank(bankResult.bankCode);

    const template = await findMatchingTemplate(bankResult.bankCode);
    setMatchedTemplate(template);

    if (bankResult.bankCode !== "generic") {
      toast.info(`Banco detectado: ${bankLabels[bankResult.bankCode]} (${bankResult.confidence}% confiança)`);
    }
    if (template) {
      toast.info(`Template aplicado: ${template.name}`);
    }

    setTransactions(withSelection);
    setImportInfo({ fileName, fileType });
    setStep("preview");
  };

  const handleConfirmImport = async () => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    const selectedTransactions = transactions.filter((t) => t.isSelected !== false);

    try {
      // Create import session and use hash-based dedup
      const importId = await createImportSession(user.id, importInfo.fileName, importInfo.fileType);
      const existingHashes = await fetchExistingHashes(user.id);

      const result = await saveTransactionsWithDedup(
        user.id,
        importId,
        selectedTransactions.map((t) => ({
          date: t.date,
          description: t.description,
          category: t.category,
          type: t.type,
          value: t.value,
          bank_name: detectedBank !== "generic" ? detectedBank : undefined,
          is_duplicate: t.isDuplicate,
        })),
        existingHashes
      );

      const editedCount = transactions.filter((t) => t.isEdited).length;
      const duplicatesCount = transactions.filter((t) => t.isDuplicate).length;
      const removedCount = transactions.length - selectedTransactions.length;

      const log = createImportLog(
        importInfo.fileName,
        importInfo.fileType,
        transactions.length,
        result.imported,
        removedCount,
        editedCount,
        duplicatesCount + result.skipped
      );
      saveImportLog(log);

      setImportedCount(result.imported);
      setDuplicatesSkipped(result.skipped);
      setStep("success");
      await refetch();

      if (result.skipped > 0) {
        toast.success(`${result.imported} transações importadas. ${result.skipped} duplicatas ignoradas.`);
      } else {
        toast.success(`${result.imported} transações importadas com sucesso!`);
      }
    } catch {
      toast.error("Erro ao salvar transações. Tente novamente.");
    }
  };

  const handleAiImportComplete = async (txns: { id: string; date: string; description: string; category: any; type: any; value: number }[]) => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    try {
      const importId = await createImportSession(user.id, "Análise IA", "pdf");
      const existingHashes = await fetchExistingHashes(user.id);

      const result = await saveTransactionsWithDedup(
        user.id,
        importId,
        txns.map((t) => ({
          date: t.date,
          description: t.description,
          category: t.category,
          type: t.type,
          value: t.value,
        })),
        existingHashes
      );

      setImportedCount(result.imported);
      setDuplicatesSkipped(result.skipped);
      setImportInfo({ fileName: "Análise IA", fileType: "pdf" });
      setStep("success");
      await refetch();

      if (result.skipped > 0) {
        toast.success(`${result.imported} importadas. ${result.skipped} duplicatas ignoradas.`);
      } else {
        toast.success(`${result.imported} transações importadas!`);
      }
    } catch {
      toast.error("Erro ao salvar transações da análise IA.");
    }
  };

  const handleCancel = () => {
    setTransactions([]);
    setStep("upload");
  };

  const handleNewImport = () => {
    setTransactions([]);
    setImportInfo({ fileName: "", fileType: "" });
    setDetectedBank("generic");
    setMatchedTemplate(null);
    setDuplicatesSkipped(0);
    setStep("upload");
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Importação Financeira</h1>
                <p className="text-xs text-muted-foreground">
                  Importe e revise transações de extratos bancários
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
        </div>
      </header>

      <main className="p-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "upload" ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>1</div>
            <span className="text-sm font-medium">Upload</span>
          </div>
          <div className="w-16 h-px bg-border mx-2" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "preview" ? "bg-primary text-primary-foreground" : step === "success" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>2</div>
            <span className="text-sm font-medium">Revisão</span>
          </div>
          <div className="w-16 h-px bg-border mx-2" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "success" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</div>
            <span className="text-sm font-medium">Conclusão</span>
          </div>
        </div>

        {step === "upload" && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Importar Extrato</CardTitle>
              <CardDescription>Escolha entre importação tradicional ou análise inteligente com IA</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ai-analysis">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Análise IA (PDF)
                  </TabsTrigger>
                  <TabsTrigger value="traditional">
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload Tradicional
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="ai-analysis" className="mt-4">
                  <PdfAnalysisUpload onTransactionsExtracted={handleAiImportComplete} />
                </TabsContent>
                <TabsContent value="traditional" className="mt-4">
                  <FileUploadZone
                    onTransactionsParsed={handleTransactionsParsed}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {step === "preview" && (
          <Card>
            <CardHeader>
              <CardTitle>Revisão de Transações</CardTitle>
              <CardDescription>
                <span className="flex flex-wrap items-center gap-2">
                  Arquivo: <strong>{importInfo.fileName}</strong>
                  {detectedBank !== "generic" && <Badge variant="secondary">{bankLabels[detectedBank]}</Badge>}
                  {matchedTemplate && <Badge variant="outline">Template: {matchedTemplate.name}</Badge>}
                  <span className="text-muted-foreground">• Revise, edite ou remova transações antes de confirmar.</span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportPreviewTable
                transactions={transactions}
                onTransactionsChange={setTransactions}
                onConfirmImport={handleConfirmImport}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 rounded-full bg-success/10">
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Importação Concluída!</h2>
                  <p className="text-muted-foreground">
                    {importedCount} transações foram salvas com sucesso.
                    {duplicatesSkipped > 0 && (
                      <span className="block mt-1 text-warning">
                        {duplicatesSkipped} duplicatas foram ignoradas automaticamente.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleNewImport}>Nova Importação</Button>
                  <Button onClick={handleBackToDashboard}>Voltar ao Dashboard</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Importações</DialogTitle>
            <DialogDescription>Registro completo de todas as importações realizadas</DialogDescription>
          </DialogHeader>
          <ImportLogHistory />
        </DialogContent>
      </Dialog>
    </div>
  );
}
