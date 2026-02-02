import { useState } from "react";
import { FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Transaction } from "@/components/dashboard/TransactionTable";
import { parsePDFText } from "@/lib/parsers/pdfParser";

interface TextImportProps {
  onTransactionsImported: (transactions: Transaction[]) => void;
}

type ImportStatus = "idle" | "loading" | "success" | "error";

export function TextImport({ onTransactionsImported }: TextImportProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState("");

  const handleImport = () => {
    if (!text.trim()) {
      setStatus("error");
      setMessage("Cole o texto do extrato bancário antes de importar.");
      return;
    }

    setStatus("loading");
    setMessage("Analisando extrato...");

    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
      try {
        const transactions = parsePDFText(text);

        if (transactions.length === 0) {
          setStatus("error");
          setMessage("Nenhuma transação encontrada. Verifique se o texto contém datas e valores.");
          return;
        }

        setStatus("success");
        setMessage(`${transactions.length} transações encontradas!`);
        onTransactionsImported(transactions);
        setText("");
      } catch (error) {
        console.error("Erro ao analisar texto:", error);
        setStatus("error");
        setMessage("Erro ao analisar o texto. Verifique o formato.");
      }
    }, 500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Importar de Texto
        </CardTitle>
        <CardDescription>
          Cole o texto copiado do seu extrato bancário (PDF ou outro)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Cole aqui o texto do extrato bancário...

Exemplo:
15/01/2024 PIX RECEBIDO - CLIENTE A    R$ 1.500,00
15/01/2024 PAGAMENTO BOLETO           -R$ 350,00
16/01/2024 TED RECEBIDO               R$ 2.800,00"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          className="min-h-[200px] font-mono text-sm"
        />

        <Button 
          onClick={handleImport} 
          disabled={status === "loading" || !text.trim()}
          className="w-full"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            "Importar Transações"
          )}
        </Button>

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
      </CardContent>
    </Card>
  );
}
