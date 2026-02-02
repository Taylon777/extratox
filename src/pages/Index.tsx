import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, Upload } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionTable, Transaction } from "@/components/dashboard/TransactionTable";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { TextImport } from "@/components/dashboard/TextImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  mockTransactions, 
  monthlyData, 
} from "@/data/mockTransactions";

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleTransactionsImported = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...newTransactions, ...prev]);
    // Fecha o dialog após importação bem-sucedida
    setTimeout(() => setIsImportOpen(false), 1500);
  };

  const totalEntradas = transactions
    .filter(t => t.type === "entrada")
    .reduce((acc, t) => acc + t.value, 0);

  const totalSaidas = transactions
    .filter(t => t.type === "saida")
    .reduce((acc, t) => acc + t.value, 0);

  const saldoLiquido = totalEntradas - totalSaidas;

  // Calcula dados por categoria
  const categoryDataEntradas = calculateCategoryData(transactions, 'entrada');
  const categoryDataSaidas = calculateCategoryData(transactions, 'saida');

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>
                <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
              </div>
            </div>
            
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Extrato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Importar Extrato Bancário</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="file" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Arquivo</TabsTrigger>
                    <TabsTrigger value="text">Texto</TabsTrigger>
                  </TabsList>
                  <TabsContent value="file" className="mt-4">
                    <FileUpload onTransactionsImported={handleTransactionsImported} />
                  </TabsContent>
                  <TabsContent value="text" className="mt-4">
                    <TextImport onTransactionsImported={handleTransactionsImported} />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
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
            value={transactions.length.toString()}
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
                <TransactionTable transactions={transactions} />
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

function calculateCategoryData(transactions: Transaction[], type: 'entrada' | 'saida') {
  const categoryColors: Record<string, string> = {
    pix: "#8b5cf6",
    transferencia: "#3b82f6",
    cartao: "#f59e0b",
    taxas: "#64748b",
    outros: "#6b7280",
  };

  const categoryLabels: Record<string, string> = {
    pix: "Pix",
    transferencia: "Transferência",
    cartao: "Cartão",
    taxas: "Taxas",
    outros: "Outros",
  };

  const filtered = transactions.filter(t => t.type === type);
  const grouped: Record<string, number> = {};

  for (const t of filtered) {
    grouped[t.category] = (grouped[t.category] || 0) + t.value;
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
