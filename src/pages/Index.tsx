import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  AlertTriangle,
  Upload,
  FileBarChart,
  Percent,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Tag,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useDashboardMetrics, FilterState } from "@/hooks/useDashboardMetrics";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { DailyBalanceChart } from "@/components/dashboard/DailyBalanceChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { TransactionFilters } from "@/components/dashboard/TransactionFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Index = () => {
  const navigate = useNavigate();
  const { transactions, isLoading } = useTransactions();
  const [filters, setFilters] = useState<FilterState>({
    startDate: undefined,
    endDate: undefined,
    excludedCategories: [],
  });

  const {
    filteredTransactions,
    metrics,
    categoryDataEntradas,
    categoryDataSaidas,
  } = useDashboardMetrics(transactions, filters);

  const hasData = transactions.length > 0;
  const hasFilteredData = filteredTransactions.length > 0;

  const primaryCards = useMemo(() => [
    {
      title: "Total Entradas",
      value: formatCurrency(metrics.totalEntradas),
      icon: TrendingUp,
      iconColor: "text-success",
      iconBg: "bg-success/10",
    },
    {
      title: "Total Saídas",
      value: formatCurrency(metrics.totalSaidas),
      icon: TrendingDown,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/10",
    },
    {
      title: "Saldo Líquido",
      value: formatCurrency(metrics.saldoLiquido),
      icon: Wallet,
      iconColor: metrics.saldoLiquido >= 0 ? "text-success" : "text-destructive",
      iconBg: metrics.saldoLiquido >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
    {
      title: "Margem",
      value: `${metrics.marginPercent.toFixed(1)}%`,
      icon: Percent,
      iconColor: metrics.marginPercent >= 0 ? "text-success" : "text-destructive",
      iconBg: metrics.marginPercent >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
  ], [metrics]);

  const secondaryCards = useMemo(() => [
    {
      title: "Ticket Médio",
      value: formatCurrency(metrics.avgTicket),
      icon: Activity,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      title: "Média Diária",
      value: formatCurrency(metrics.dailyAverage),
      icon: CalendarDays,
      iconColor: "text-info",
      iconBg: "bg-info/10",
    },
    {
      title: "Transações",
      value: metrics.transactionCount,
      icon: FileText,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      title: "Duplicatas",
      value: metrics.duplicatesCount,
      icon: AlertTriangle,
      iconColor: "text-warning",
      iconBg: "bg-warning/10",
    },
  ], [metrics]);

  const highlightCards = useMemo(() => {
    const cards: { title: string; value: string; subtitle: string; icon: any; iconColor: string; iconBg: string }[] = [];
    if (metrics.largestInflow) {
      cards.push({
        title: "Maior Entrada",
        value: formatCurrency(metrics.largestInflow.value),
        subtitle: metrics.largestInflow.description.slice(0, 40),
        icon: ArrowUpRight,
        iconColor: "text-success",
        iconBg: "bg-success/10",
      });
    }
    if (metrics.largestOutflow) {
      cards.push({
        title: "Maior Saída",
        value: formatCurrency(metrics.largestOutflow.value),
        subtitle: metrics.largestOutflow.description.slice(0, 40),
        icon: ArrowDownRight,
        iconColor: "text-destructive",
        iconBg: "bg-destructive/10",
      });
    }
    if (metrics.topRevenueCategory) {
      cards.push({
        title: "Top Receita",
        value: metrics.topRevenueCategory.label,
        subtitle: formatCurrency(metrics.topRevenueCategory.total),
        icon: Tag,
        iconColor: "text-success",
        iconBg: "bg-success/10",
      });
    }
    if (metrics.topExpenseCategory) {
      cards.push({
        title: "Top Despesa",
        value: metrics.topExpenseCategory.label,
        subtitle: formatCurrency(metrics.topExpenseCategory.total),
        icon: Tag,
        iconColor: "text-destructive",
        iconBg: "bg-destructive/10",
      });
    }
    return cards;
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-background">
        <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-6 py-3 flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-[11px] text-muted-foreground">Visão geral financeira</p>
            </div>
          </div>
        </header>
        <main className="p-5 space-y-5">
          <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-lg" />
            ))}
          </section>
          <Skeleton className="h-10 rounded-lg" />
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-lg lg:col-span-2" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-[11px] text-muted-foreground">Visão geral financeira</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate("/importacao")} className="h-8 text-xs font-semibold">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Importar Extrato
          </Button>
        </div>
      </header>

      <main className="p-5 space-y-5">
        {!hasData ? (
          <Card className="max-w-lg mx-auto border-0 shadow-sm mt-8">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="flex flex-col items-center gap-5">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <FileBarChart className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Nenhuma transação</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Importe seu primeiro extrato bancário para visualizar métricas, gráficos e análises do fluxo de caixa.
                  </p>
                </div>
                <Button onClick={() => navigate("/importacao")} className="font-semibold">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Extrato
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Primary KPIs */}
            <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {primaryCards.map((card) => (
                <DashboardStatCard key={card.title} {...card} />
              ))}
            </section>

            {/* Secondary KPIs */}
            <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {secondaryCards.map((card) => (
                <DashboardStatCard key={card.title} {...card} />
              ))}
            </section>

            {/* Highlight Cards */}
            {highlightCards.length > 0 && (
              <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {highlightCards.map((card) => (
                  <DashboardStatCard key={card.title} {...card} subtitle={card.subtitle} />
                ))}
              </section>
            )}

            <section>
              <TransactionFilters
                filters={filters}
                onFiltersChange={setFilters}
                transactions={filteredTransactions}
              />
            </section>

            {!hasFilteredData ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-10 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sem dados no período selecionado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Daily Balance Evolution */}
                {metrics.dailyBalanceData.length > 1 && (
                  <section>
                    <DailyBalanceChart data={metrics.dailyBalanceData} />
                  </section>
                )}

                {/* Cash Flow + Pie Charts */}
                <section className="grid gap-5 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <FinancialChart data={metrics.monthlyData} />
                  </div>
                  {categoryDataEntradas.length > 0 && (
                    <CategoryPieChart data={categoryDataEntradas} title="Entradas por Categoria" />
                  )}
                </section>

                {/* Transactions + Exit Pie */}
                <section className="grid gap-5 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          Transações Recentes
                          {filteredTransactions.length !== transactions.length && (
                            <span className="text-xs font-normal text-muted-foreground">
                              ({filteredTransactions.length} de {transactions.length})
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <TransactionTable transactions={filteredTransactions} />
                      </CardContent>
                    </Card>
                  </div>
                  {categoryDataSaidas.length > 0 && (
                    <CategoryPieChart data={categoryDataSaidas} title="Saídas por Categoria" />
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

export default Index;
