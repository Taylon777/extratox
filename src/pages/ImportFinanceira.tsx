import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileUp, History, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ImportPreviewTable } from "@/components/import/ImportPreviewTable";
import { ImportLogHistory } from "@/components/import/ImportLogHistory";
import { ExtendedTransaction } from "@/types/importTypes";
import { BankCode, bankLabels, TemplateWithRelations } from "@/types/templateTypes";
import { detectDuplicates } from "@/lib/parsers/unifiedParser";
import { detectBank } from "@/lib/bankDetection";
import { findMatchingTemplate } from "@/lib/templateService";
import { saveImportLog, createImportLog } from "@/lib/importLogs";
import { Transaction } from "@/components/dashboard/TransactionTable";
import { toast } from "sonner";

type ImportStep = "upload" | "preview" | "success";

interface ImportFinanceiraProps {
  existingTransactions: Transaction[];
  onImportComplete: (transactions: Transaction[]) => void;
}

export default function ImportFinanceira({
  existingTransactions,
  onImportComplete,
}: ImportFinanceiraProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<ImportStep>("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [importInfo, setImportInfo] = useState({ fileName: "", fileType: "" });
  const [showHistory, setShowHistory] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [detectedBank, setDetectedBank] = useState<BankCode>("generic");
  const [matchedTemplate, setMatchedTemplate] = useState<TemplateWithRelations | null>(null);

  const handleTransactionsParsed = async (
    parsedTransactions: ExtendedTransaction[],
    fileName: string,
    fileType: string
  ) => {
    // Detecta duplicatas com transações existentes
    const withDuplicates = detectDuplicates(parsedTransactions, existingTransactions);
    
    // Marca todas como selecionadas inicialmente
    const withSelection = withDuplicates.map((t) => ({ ...t, isSelected: true }));

    // Detecta banco automaticamente a partir das descrições
    const allDescriptions = parsedTransactions.map((t) => t.description).join(" ");
    const bankResult = await detectBank(allDescriptions + " " + fileName);
    setDetectedBank(bankResult.bankCode);

    // Busca template correspondente
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

  const handleConfirmImport = () => {
    const selectedTransactions = transactions.filter((t) => t.isSelected !== false);
    
    // Converte para Transaction básico
    const basicTransactions: Transaction[] = selectedTransactions.map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      category: t.category,
      type: t.type,
      value: t.value,
    }));

    // Salva log da importação
    const editedCount = transactions.filter((t) => t.isEdited).length;
    const duplicatesCount = transactions.filter((t) => t.isDuplicate).length;
    const removedCount = transactions.length - selectedTransactions.length;

    const log = createImportLog(
      importInfo.fileName,
      importInfo.fileType,
      transactions.length,
      selectedTransactions.length,
      removedCount,
      editedCount,
      duplicatesCount
    );
    saveImportLog(log);

    // Callback para integrar com o sistema
    onImportComplete(basicTransactions);
    
    setImportedCount(selectedTransactions.length);
    setStep("success");
    toast.success(`${selectedTransactions.length} transações importadas com sucesso!`);
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
    setStep("upload");
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBackToDashboard}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Importação Financeira</h1>
                  <p className="text-sm text-muted-foreground">
                    Importe e revise transações de extratos bancários
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              Histórico
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/20 text-primary"
              }`}
            >
              1
            </div>
            <span className="text-sm font-medium">Upload</span>
          </div>
          <div className="w-16 h-px bg-border mx-2" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "preview"
                  ? "bg-primary text-primary-foreground"
                  : step === "success"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span className="text-sm font-medium">Revisão</span>
          </div>
          <div className="w-16 h-px bg-border mx-2" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "success"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <span className="text-sm font-medium">Conclusão</span>
          </div>
        </div>

        {/* Content */}
        {step === "upload" && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Selecione o Arquivo</CardTitle>
              <CardDescription>
                Escolha um arquivo de extrato bancário para importar. Os formatos PDF, OFX, Excel e
                CSV são suportados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onTransactionsParsed={handleTransactionsParsed}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
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
                  {detectedBank !== "generic" && (
                    <Badge variant="secondary">{bankLabels[detectedBank]}</Badge>
                  )}
                  {matchedTemplate && (
                    <Badge variant="outline">Template: {matchedTemplate.name}</Badge>
                  )}
                  <span className="text-muted-foreground">
                    • Revise, edite ou remova transações antes de confirmar.
                  </span>
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
                <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Importação Concluída!</h2>
                  <p className="text-muted-foreground">
                    {importedCount} transações foram importadas com sucesso do arquivo{" "}
                    <strong>{importInfo.fileName}</strong>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleNewImport}>
                    Nova Importação
                  </Button>
                  <Button onClick={handleBackToDashboard}>Voltar ao Dashboard</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Importações</DialogTitle>
            <DialogDescription>
              Registro completo de todas as importações realizadas
            </DialogDescription>
          </DialogHeader>
          <ImportLogHistory />
        </DialogContent>
      </Dialog>
    </div>
  );
}
