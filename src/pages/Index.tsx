import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  mockTransactions, 
  monthlyData, 
  categoryDataEntradas, 
  categoryDataSaidas 
} from "@/data/mockTransactions";

const Index = () => {
  const totalEntradas = mockTransactions
    .filter(t => t.type === "entrada")
    .reduce((acc, t) => acc + t.value, 0);

  const totalSaidas = mockTransactions
    .filter(t => t.type === "saida")
    .reduce((acc, t) => acc + t.value, 0);

  const saldoLiquido = totalEntradas - totalSaidas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>
              <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Entradas"
            value={formatCurrency(totalEntradas)}
            description="Período atual"
            icon={ArrowUpCircle}
            variant="success"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Total Saídas"
            value={formatCurrency(totalSaidas)}
            description="Período atual"
            icon={ArrowDownCircle}
            variant="danger"
            trend={{ value: 3.2, isPositive: false }}
          />
          <StatCard
            title="Saldo Líquido"
            value={formatCurrency(saldoLiquido)}
            description="Entradas - Saídas"
            icon={TrendingUp}
            variant={saldoLiquido >= 0 ? "success" : "danger"}
          />
          <StatCard
            title="Transações"
            value={mockTransactions.length.toString()}
            description="Total de lançamentos"
            icon={Wallet}
          />
        </section>

        {/* Charts Section */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FinancialChart data={monthlyData} />
          </div>
          <div className="space-y-6">
            <CategoryPieChart data={categoryDataEntradas} title="Entradas por Categoria" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTable transactions={mockTransactions} />
              </CardContent>
            </Card>
          </div>
          <div>
            <CategoryPieChart data={categoryDataSaidas} title="Saídas por Categoria" />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
