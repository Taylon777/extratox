import { useState, useMemo } from "react";
import { FileDown, Loader2, Building2, Eye } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const { filteredTransactions, metrics, formatCurrency } = useDashboardMetrics(transactions, filters);
  const [generating, setGenerating] = useState(false);
  const [companyName, setCompanyName] = useState("R&R Contas");
  const [companyId, setCompanyId] = useState("");

  const period = useMemo(() => {
    if (filteredTransactions.length === 0) return { start: "—", end: "—" };
    const dates = filteredTransactions.map((t) => new Date(t.date).getTime());
    return {
      start: new Date(Math.min(...dates)).toLocaleDateString("pt-BR"),
      end: new Date(Math.max(...dates)).toLocaleDateString("pt-BR"),
    };
  }, [filteredTransactions]);

  const openReport = (print: boolean) => {
    if (filteredTransactions.length === 0) {
      toast.error("Nenhuma transação disponível.");
      return;
    }
    if (print) setGenerating(true);
    try {
      const html = generateProfessionalReport(filteredTransactions, metrics, {
        companyName: companyName || "R&R Contas",
        companyId: companyId || "—",
        periodStart: period.start,
        periodEnd: period.end,
      });
      const w = window.open("", "_blank");
      if (!w) { toast.error("Permita pop-ups para continuar."); return; }
      w.document.write(html);
      w.document.close();
      if (print) { w.print(); toast.success("Relatório gerado!"); }
    } catch {
      toast.error("Erro ao gerar relatório.");
    } finally {
      if (print) setGenerating(false);
    }
  };

  const hasData = filteredTransactions.length > 0;

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-6 py-3 flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">Relatório PDF</h1>
            <p className="text-[11px] text-muted-foreground">Exporte relatório financeiro profissional</p>
          </div>
        </div>
      </header>

      <main className="p-5 max-w-2xl mx-auto space-y-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Nome</Label>
                <Input
                  placeholder="R&R Contas"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">CNPJ / ID</Label>
                <Input
                  placeholder="00.000.000/0001-00"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileDown className="h-4 w-4 text-muted-foreground" />
              Relatório Financeiro
            </CardTitle>
            <CardDescription className="text-xs">
              Resumo executivo, gráficos por categoria e extrato completo com saldo acumulado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : !hasData ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">Nenhuma transação importada.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg border p-2.5">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Período</p>
                    <p className="font-semibold text-xs mt-0.5">{period.start} — {period.end}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Lançamentos</p>
                    <p className="font-bold text-base tabular-nums">{metrics.transactionCount}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Entradas</p>
                    <p className="font-bold text-base text-success tabular-nums">{formatCurrency(metrics.totalEntradas)}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Saídas</p>
                    <p className="font-bold text-base text-destructive tabular-nums">{formatCurrency(metrics.totalSaidas)}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openReport(false)} disabled={!hasData || isLoading} className="flex-1 h-9 text-xs font-semibold">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Visualizar
              </Button>
              <Button onClick={() => openReport(true)} disabled={generating || isLoading || !hasData} className="flex-1 h-9 text-xs font-semibold">
                {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5 mr-1.5" />}
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
