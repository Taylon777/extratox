import { useState, useMemo } from "react";
import { FileDown, Loader2, Building2, Eye } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTransactions } from "@/hooks/useTransactions";
import { useDashboardMetrics, FilterState } from "@/hooks/useDashboardMetrics";
import { generateProfessionalReport } from "@/lib/reportGenerator";
import { toast } from "sonner";

const Relatorio = () => {
  const { transactions, isLoading } = useTransactions();
  const [filters] = useState<FilterState>({
    startDate: undefined,
    endDate: undefined,
    excludedCategories: [],
  });
  const { filteredTransactions, metrics, formatCurrency } = useDashboardMetrics(
    transactions,
    filters
  );
  const [generating, setGenerating] = useState(false);
  const [companyName, setCompanyName] = useState("R&R Contas");
  const [companyId, setCompanyId] = useState("");

  const period = useMemo(() => {
    if (filteredTransactions.length === 0) return { start: "—", end: "—" };
    const dates = filteredTransactions.map((t) => new Date(t.date).getTime());
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    return {
      start: min.toLocaleDateString("pt-BR"),
      end: max.toLocaleDateString("pt-BR"),
    };
  }, [filteredTransactions]);

  const handleGeneratePdf = () => {
    if (filteredTransactions.length === 0) {
      toast.error("Nenhuma transação disponível para gerar relatório.");
      return;
    }

    setGenerating(true);
    try {
      const html = generateProfessionalReport(filteredTransactions, metrics, {
        companyName: companyName || "R&R Contas",
        companyId: companyId || "—",
        periodStart: period.start,
        periodEnd: period.end,
      });

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Permita pop-ups para gerar o relatório.");
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      toast.success("Relatório gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar relatório.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    if (filteredTransactions.length === 0) return;

    const html = generateProfessionalReport(filteredTransactions, metrics, {
      companyName: companyName || "R&R Contas",
      companyId: companyId || "—",
      periodStart: period.start,
      periodEnd: period.end,
    });

    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      toast.error("Permita pop-ups para visualizar.");
      return;
    }
    previewWindow.document.write(html);
    previewWindow.document.close();
  };

  const hasData = filteredTransactions.length > 0;

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Gerar Relatório
            </h1>
            <p className="text-xs text-muted-foreground">
              Exporte um relatório financeiro profissional em PDF
            </p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Company Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Informações que aparecerão no cabeçalho do relatório.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  placeholder="R&R Contas"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-id">CNPJ / Identificação</Label>
                <Input
                  id="company-id"
                  placeholder="00.000.000/0001-00"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileDown className="h-4 w-4" />
              Relatório Financeiro
            </CardTitle>
            <CardDescription>
              Relatório corporativo com resumo executivo, gráficos de
              categorias, e listagem completa de transações com saldo
              acumulado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Carregando transações...
              </p>
            ) : !hasData ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Nenhuma transação importada. Importe um extrato primeiro.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Período</p>
                    <p className="font-semibold text-sm mt-1">
                      {period.start} — {period.end}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Lançamentos</p>
                    <p className="font-bold text-lg">{metrics.transactionCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Entradas</p>
                    <p className="font-bold text-lg text-success">
                      {formatCurrency(metrics.totalEntradas)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Saídas</p>
                    <p className="font-bold text-lg text-destructive">
                      {formatCurrency(metrics.totalSaidas)}
                    </p>
                  </div>
                </div>

                <Separator />

                <p className="text-xs text-muted-foreground">
                  O relatório incluirá: cabeçalho corporativo, resumo executivo
                  com KPIs, gráficos de pizza por categoria (receitas e
                  despesas), tabela detalhada de transações com saldo acumulado
                  e rodapé institucional.
                </p>
              </>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!hasData || isLoading}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button
                onClick={handleGeneratePdf}
                disabled={generating || isLoading || !hasData}
                className="flex-1"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Gerar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Relatorio;
