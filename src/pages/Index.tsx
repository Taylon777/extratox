import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileCheck,
  Building2,
  AlertTriangle,
  Receipt,
  FileText,
  Bell,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { TransactionTable, Transaction } from "@/components/dashboard/TransactionTable";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FileUpload } from "@/components/dashboard/FileUpload";
import { TextImport } from "@/components/dashboard/TextImport";
import { TransactionFilters, FilterState } from "@/components/dashboard/TransactionFilters";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { monthlyData } from "@/data/mockTransactions";

interface IndexProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const Index = ({ transactions, setTransactions }: IndexProps) => {
  const navigate = useNavigate();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    startDate: undefined,
    endDate: undefined,
    excludedCategories: [],
  });

  const handleTransactionsImported = (newTransactions: Transaction[]) => {
    setTransactions((prev) => [...newTransactions, ...prev]);
    setTimeout(() => setIsImportOpen(false), 1500);
  };

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
    .reduce((acc, t) => acc + t.value, 0);

  const totalSaidas = filteredTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + t.value, 0);

  const categoryDataEntradas = calculateCategoryData(filteredTransactions, "entrada");
  const categoryDataSaidas = calculateCategoryData(filteredTransactions, "saida");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Accounting stat cards data
  const statCards = [
    {
      title: "CNDs Emitidas",
      value: 47,
      icon: FileCheck,
      iconColor: "text-success",
      iconBg: "bg-success/10",
    },
    {
      title: "Empresas Regulares",
      value: 32,
      icon: Building2,
      iconColor: "text-info",
      iconBg: "bg-info/10",
    },
    {
      title: "Empresas com Pendência",
      value: 8,
      icon: AlertTriangle,
      iconColor: "text-accent",
      iconBg: "bg-accent/10",
    },
    {
      title: "ICMS a Recolher",
      value: formatCurrency(totalSaidas),
      icon: Receipt,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/10",
    },
    {
      title: "Notas Importadas",
      value: transactions.length,
      icon: FileText,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      title: "Alertas Fiscais",
      value: 3,
      icon: Bell,
      iconColor: "text-warning",
      iconBg: "bg-warning/10",
    },
  ];

  return (
    <div className="flex-1 min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Visão geral fiscal e financeira
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/importacao")}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importação
            </Button>
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Rápido
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

      <main className="p-6 space-y-6">
        {/* Stat Cards Row */}
        <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {statCards.map((card) => (
            <DashboardStatCard key={card.title} {...card} />
          ))}
        </section>

        {/* Filters */}
        <section>
          <TransactionFilters filters={filters} onFiltersChange={setFilters} />
        </section>

        {/* Charts Grid */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FinancialChart data={monthlyData} />
          </div>
          <div>
            <CategoryPieChart
              data={categoryDataEntradas}
              title="Entradas por Categoria"
            />
          </div>
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
          <div>
            <CategoryPieChart
              data={categoryDataSaidas}
              title="Saídas por Categoria"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

function calculateCategoryData(
  transactions: Transaction[],
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
