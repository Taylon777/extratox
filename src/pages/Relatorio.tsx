import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useDashboardMetrics, FilterState } from "@/hooks/useDashboardMetrics";
import { toast } from "sonner";

const Relatorio = () => {
  const { transactions, isLoading } = useTransactions();
  const [filters] = useState<FilterState>({
    startDate: undefined,
    endDate: undefined,
    excludedCategories: [],
  });
  const { filteredTransactions, metrics, formatCurrency } = useDashboardMetrics(transactions, filters);
  const [generating, setGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    if (filteredTransactions.length === 0) {
      toast.error("Nenhuma transação disponível para gerar relatório.");
      return;
    }

    setGenerating(true);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Permita pop-ups para gerar o relatório.");
        return;
      }

      const rows = filteredTransactions
        .map(
          (t) =>
            `<tr>
              <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${new Date(t.date).toLocaleDateString("pt-BR")}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${t.description}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${t.category}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:${t.type === "entrada" ? "#16a34a" : "#dc2626"}">${t.type === "entrada" ? "+" : "-"} ${formatCurrency(t.value)}</td>
            </tr>`
        )
        .join("");

      printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Relatório Financeiro</title>
<style>
  body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a1a}
  h1{font-size:20px;margin-bottom:4px}
  .subtitle{color:#666;font-size:13px;margin-bottom:24px}
  .summary{display:flex;gap:24px;margin-bottom:24px}
  .summary-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;flex:1}
  .summary-card .label{font-size:11px;color:#666;text-transform:uppercase}
  .summary-card .value{font-size:18px;font-weight:700;margin-top:2px}
  .green{color:#16a34a} .red{color:#dc2626}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:8px 10px;background:#f3f4f6;border-bottom:2px solid #d1d5db;font-size:11px;text-transform:uppercase;color:#666}
</style></head><body>
<h1>Relatório Financeiro</h1>
<p class="subtitle">Gerado em ${new Date().toLocaleDateString("pt-BR")} — ${filteredTransactions.length} transações</p>
<div class="summary">
  <div class="summary-card"><div class="label">Entradas</div><div class="value green">${formatCurrency(metrics.totalEntradas)}</div></div>
  <div class="summary-card"><div class="label">Saídas</div><div class="value red">${formatCurrency(metrics.totalSaidas)}</div></div>
  <div class="summary-card"><div class="label">Saldo Líquido</div><div class="value" style="color:${metrics.saldoLiquido >= 0 ? "#16a34a" : "#dc2626"}">${formatCurrency(metrics.saldoLiquido)}</div></div>
</div>
<table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`);
      printWindow.document.close();
      printWindow.print();
      toast.success("Relatório gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar relatório.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Gerar Relatório</h1>
            <p className="text-xs text-muted-foreground">Exporte suas transações em PDF</p>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Relatório PDF
            </CardTitle>
            <CardDescription>
              Gera um relatório com todas as transações importadas, incluindo resumo de entradas, saídas e saldo líquido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando transações...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma transação importada. Importe um extrato primeiro para gerar o relatório.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Transações</p>
                    <p className="font-bold text-lg">{filteredTransactions.length}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Entradas</p>
                    <p className="font-bold text-lg text-success">{formatCurrency(metrics.totalEntradas)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Saídas</p>
                    <p className="font-bold text-lg text-destructive">{formatCurrency(metrics.totalSaidas)}</p>
                  </div>
                </div>
              </div>
            )}
            <Button
              onClick={handleGeneratePdf}
              disabled={generating || isLoading || filteredTransactions.length === 0}
              className="w-full"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Gerar PDF
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Relatorio;
