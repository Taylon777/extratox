import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  FileText,
  AlertTriangle,
  Upload,
  FileBarChart,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { TransactionFilters, FilterState } from "@/components/dashboard/TransactionFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Index = () => {
  const navigate = useNavigate();
  const { transactions, isLoading, monthlyData } = useTransactions();
  const [filters, setFilters] = useState<FilterState>({
    startDate: undefined,
    endDate: undefined,
    excludedCategories: [],
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      if (filters.startDate && transactionDate < filters.startDate) return false;
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (transactionDate > endOfDay) return false;
      }
      if (filters.excludedCategories.includes(t.category)) return false;
      return true;
    });
  }, [transactions, filters]);

  const totalEntradas = filteredTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + Number(t.value), 0);

  const totalSaidas = filteredTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + Number(t.value), 0);

  const saldoLiquido = totalEntradas - totalSaidas;
  const duplicatesCount = filteredTransactions.filter((t) => t.is_duplicate).length;

  const categoryDataEntradas = calculateCategoryData(filteredTransactions, "entrada");
  const categoryDataSaidas = calculateCategoryData(filteredTransactions, "saida");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const hasData = transactions.length > 0;
  const hasFilteredData = filteredTransactions.length > 0;

  const statCards = [
    {
      title: "Total de Entradas",
      value: formatCurrency(totalEntradas),
      icon: TrendingUp,
      iconColor: "text-success",
      iconBg: "bg-success/10",
    },
    {
      title: "Total de Saídas",
      value: formatCurrency(totalSaidas),
      icon: TrendingDown,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/10",
    },
    {
      title: "Saldo Líquido",
      value: formatCurrency(saldoLiquido),
      icon: Wallet,
      iconColor: saldoLiquido >= 0 ? "text-success" : "text-destructive",
      iconBg: saldoLiquido >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
    {
      title: "ICMS a Recolher",
      value: formatCurrency(totalSaidas * 0),
      icon: Receipt,
      iconColor: "text-warning",
      iconBg: "bg-warning/10",
    },
    {
      title: "Transações Importadas",
      value: transactions.length,
      icon: FileText,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      title: "Duplicatas Detectadas",
      value: duplicatesCount,
      icon: AlertTriangle,
      iconColor: "text-warning",
      iconBg: "bg-warning/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Visão geral fiscal e financeira</p>
            </div>
          </div>
        </header>
        <main className="p-6 space-y-6">
          <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </section>
          <Skeleton className="h-12 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-xl lg:col-span-2" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Visão geral fiscal e financeira</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate("/importacao")}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Extrato
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {!hasData ? (
          /* Empty State */
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 rounded-full bg-primary/10">
                  <FileBarChart className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Nenhuma transação importada</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Importe seu primeiro extrato bancário para visualizar as métricas financeiras,
                    gráficos e análises do seu fluxo de caixa.
                  </p>
                </div>
                <Button size="lg" onClick={() => navigate("/importacao")}>
                  <Upload className="h-5 w-5 mr-2" />
                  Importar Primeiro Extrato
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stat Cards */}
            <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {statCards.map((card) => (
                <DashboardStatCard key={card.title} {...card} />
              ))}
            </section>

            {/* Filters */}
            <section>
              <TransactionFilters
                filters={filters}
                onFiltersChange={setFilters}
                transactions={filteredTransactions}
              />
            </section>

            {!hasFilteredData ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    Sem dados no período selecionado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajuste os filtros ou selecione outro intervalo de datas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Charts */}
                <section className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <FinancialChart data={monthlyData} />
                  </div>
                  {categoryDataEntradas.length > 0 && (
                    <div>
                      <CategoryPieChart data={categoryDataEntradas} title="Entradas por Categoria" />
                    </div>
                  )}
                </section>

                {/* Table + Pie */}
                <section className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Transações Recentes
                          {filteredTransactions.length !== transactions.length && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              ({filteredTransactions.length} de {transactions.length})
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TransactionTable transactions={filteredTransactions} />
                      </CardContent>
                    </Card>
                  </div>
                  {categoryDataSaidas.length > 0 && (
                    <div>
                      <CategoryPieChart data={categoryDataSaidas} title="Saídas por Categoria" />
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

function calculateCategoryData(
  transactions: { category: string; type: string; value: number }[],
  type: "entrada" | "saida"
) {
  const categoryColors: Record<string, string> = {
    pix: "#8b5cf6",
    transferencia: "#3b82f6",
    cartao_debito: "#10b981",
    cartao_credito: "#f59e0b",
    taxas: "#64748b",
    outros: "#6b7280",
  };

  const categoryLabels: Record<string, string> = {
    pix: "Pix",
    transferencia: "Transferência",
    cartao_debito: "Vendas – Disponível Débito",
    cartao_credito: "Vendas – Disponível Crédito",
    taxas: "Taxas",
    outros: "Outros",
  };

  const filtered = transactions.filter((t) => t.type === type);
  const grouped: Record<string, number> = {};
  for (const t of filtered) {
    grouped[t.category] = (grouped[t.category] || 0) + Number(t.value);
  }

  return Object.entries(grouped)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: categoryLabels[category] || category,
      value,
      color: categoryColors[category] || "#6b7280",
    }));
}

export default Index;
