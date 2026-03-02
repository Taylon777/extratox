/**
 * Service for computing all financial metrics from filtered transactions.
 * All calculations are 100% derived from the provided data — no global state.
 */

export interface FinancialMetrics {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  transactionCount: number;
  duplicatesCount: number;
  entradasCount: number;
  saidasCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyData: MonthlyDataPoint[];
}

export interface CategoryBreakdownItem {
  category: string;
  label: string;
  color: string;
  total: number;
  count: number;
  type: "entrada" | "saida";
}

export interface MonthlyDataPoint {
  name: string;
  entradas: number;
  saidas: number;
}

interface TransactionLike {
  date: string;
  value: number;
  type: "entrada" | "saida";
  category: string;
  is_duplicate?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  pix: "Pix",
  transferencia: "Transferência",
  cartao_debito: "Vendas – Disponível Débito",
  cartao_credito: "Vendas – Disponível Crédito",
  taxas: "Taxas",
  outros: "Outros",
};

const CATEGORY_COLORS: Record<string, string> = {
  pix: "#8b5cf6",
  transferencia: "#3b82f6",
  cartao_debito: "#10b981",
  cartao_credito: "#f59e0b",
  taxas: "#64748b",
  outros: "#6b7280",
};

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function calculateMetrics(transactions: TransactionLike[]): FinancialMetrics {
  let totalEntradas = 0;
  let totalSaidas = 0;
  let entradasCount = 0;
  let saidasCount = 0;
  let duplicatesCount = 0;

  const categoryMap: Record<string, { total: number; count: number; type: "entrada" | "saida" }> = {};
  const monthlyMap: Record<string, { entradas: number; saidas: number }> = {};

  for (const t of transactions) {
    const val = Number(t.value);

    if (t.type === "entrada") {
      totalEntradas += val;
      entradasCount++;
    } else {
      totalSaidas += val;
      saidasCount++;
    }

    if (t.is_duplicate) duplicatesCount++;

    // Category breakdown
    const catKey = `${t.category}_${t.type}`;
    if (!categoryMap[catKey]) {
      categoryMap[catKey] = { total: 0, count: 0, type: t.type };
    }
    categoryMap[catKey].total += val;
    categoryMap[catKey].count++;

    // Monthly aggregation
    const d = new Date(t.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { entradas: 0, saidas: 0 };
    if (t.type === "entrada") monthlyMap[monthKey].entradas += val;
    else monthlyMap[monthKey].saidas += val;
  }

  const categoryBreakdown: CategoryBreakdownItem[] = Object.entries(categoryMap)
    .filter(([, v]) => v.total > 0)
    .map(([key, v]) => {
      const category = key.replace(/_entrada$|_saida$/, "");
      return {
        category,
        label: CATEGORY_LABELS[category] || category,
        color: CATEGORY_COLORS[category] || "#6b7280",
        total: v.total,
        count: v.count,
        type: v.type,
      };
    });

  const monthlyData: MonthlyDataPoint[] = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const monthIdx = parseInt(key.split("-")[1]) - 1;
      return {
        name: `${MONTH_NAMES[monthIdx]}/${key.split("-")[0].slice(2)}`,
        ...vals,
      };
    });

  return {
    totalEntradas,
    totalSaidas,
    saldoLiquido: totalEntradas - totalSaidas,
    transactionCount: transactions.length,
    duplicatesCount,
    entradasCount,
    saidasCount,
    categoryBreakdown,
    monthlyData,
  };
}

/** Extract pie chart data for a specific type from the breakdown */
export function getCategoryPieData(
  breakdown: CategoryBreakdownItem[],
  type: "entrada" | "saida"
): { name: string; value: number; color: string }[] {
  return breakdown
    .filter((item) => item.type === type)
    .map((item) => ({ name: item.label, value: item.total, color: item.color }));
}
