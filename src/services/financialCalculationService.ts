/**
 * Professional financial metrics engine.
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
  dailyBalanceData: DailyBalancePoint[];
  marginPercent: number;
  avgTicket: number;
  dailyAverage: number;
  largestInflow: TransactionHighlight | null;
  largestOutflow: TransactionHighlight | null;
  mostActiveDay: { date: string; count: number } | null;
  topExpenseCategory: { label: string; total: number } | null;
  topRevenueCategory: { label: string; total: number } | null;
}

export interface TransactionHighlight {
  date: string;
  description: string;
  value: number;
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

export interface DailyBalancePoint {
  date: string;
  label: string;
  balance: number;
  entradas: number;
  saidas: number;
}

interface TransactionLike {
  date: string;
  description: string;
  value: number;
  type: "entrada" | "saida";
  category: string;
  is_duplicate?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  pix: "Pix",
  transferencia: "Transferência",
  cartao_debito: "Cartão Débito",
  cartao_credito: "Cartão Crédito",
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

  let largestInflow: TransactionHighlight | null = null;
  let largestOutflow: TransactionHighlight | null = null;

  const categoryMap: Record<string, { total: number; count: number; type: "entrada" | "saida" }> = {};
  const monthlyMap: Record<string, { entradas: number; saidas: number }> = {};
  const dailyMap: Record<string, { entradas: number; saidas: number; count: number }> = {};

  for (const t of transactions) {
    const val = Number(t.value);

    if (t.type === "entrada") {
      totalEntradas += val;
      entradasCount++;
      if (!largestInflow || val > largestInflow.value) {
        largestInflow = { date: t.date, description: t.description, value: val };
      }
    } else {
      totalSaidas += val;
      saidasCount++;
      if (!largestOutflow || val > largestOutflow.value) {
        largestOutflow = { date: t.date, description: t.description, value: val };
      }
    }

    if (t.is_duplicate) duplicatesCount++;

    // Category breakdown
    const catKey = `${t.category}_${t.type}`;
    if (!categoryMap[catKey]) categoryMap[catKey] = { total: 0, count: 0, type: t.type };
    categoryMap[catKey].total += val;
    categoryMap[catKey].count++;

    // Monthly aggregation
    const d = new Date(t.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { entradas: 0, saidas: 0 };
    if (t.type === "entrada") monthlyMap[monthKey].entradas += val;
    else monthlyMap[monthKey].saidas += val;

    // Daily aggregation
    const dayKey = t.date;
    if (!dailyMap[dayKey]) dailyMap[dayKey] = { entradas: 0, saidas: 0, count: 0 };
    if (t.type === "entrada") dailyMap[dayKey].entradas += val;
    else dailyMap[dayKey].saidas += val;
    dailyMap[dayKey].count++;
  }

  // Category breakdown
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

  // Monthly data
  const monthlyData: MonthlyDataPoint[] = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const monthIdx = parseInt(key.split("-")[1]) - 1;
      return { name: `${MONTH_NAMES[monthIdx]}/${key.split("-")[0].slice(2)}`, ...vals };
    });

  // Continuous daily balance timeline
  const dailyBalanceData = buildDailyTimeline(dailyMap);

  // Most active day
  let mostActiveDay: { date: string; count: number } | null = null;
  for (const [date, data] of Object.entries(dailyMap)) {
    if (!mostActiveDay || data.count > mostActiveDay.count) {
      mostActiveDay = { date, count: data.count };
    }
  }

  // Top categories
  const expenseCats = categoryBreakdown.filter((c) => c.type === "saida").sort((a, b) => b.total - a.total);
  const revenueCats = categoryBreakdown.filter((c) => c.type === "entrada").sort((a, b) => b.total - a.total);

  const saldoLiquido = totalEntradas - totalSaidas;
  const marginPercent = totalEntradas > 0 ? (saldoLiquido / totalEntradas) * 100 : 0;
  const avgTicket = transactions.length > 0 ? (totalEntradas + totalSaidas) / transactions.length : 0;
  const dates = transactions.map((t) => new Date(t.date).getTime());
  const daySpan = dates.length > 0 ? Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1) : 1;
  const dailyAverage = (totalEntradas + totalSaidas) / daySpan;

  return {
    totalEntradas,
    totalSaidas,
    saldoLiquido,
    transactionCount: transactions.length,
    duplicatesCount,
    entradasCount,
    saidasCount,
    categoryBreakdown,
    monthlyData,
    dailyBalanceData,
    marginPercent,
    avgTicket,
    dailyAverage,
    largestInflow,
    largestOutflow,
    mostActiveDay,
    topExpenseCategory: expenseCats[0] ? { label: expenseCats[0].label, total: expenseCats[0].total } : null,
    topRevenueCategory: revenueCats[0] ? { label: revenueCats[0].label, total: revenueCats[0].total } : null,
  };
}

/**
 * Build a continuous daily timeline (fills gaps with zero-activity days).
 */
function buildDailyTimeline(
  dailyMap: Record<string, { entradas: number; saidas: number; count: number }>
): DailyBalancePoint[] {
  const sortedDays = Object.keys(dailyMap).sort();
  if (sortedDays.length === 0) return [];

  const start = new Date(sortedDays[0]);
  const end = new Date(sortedDays[sortedDays.length - 1]);
  const points: DailyBalancePoint[] = [];
  let balance = 0;

  const current = new Date(start);
  while (current <= end) {
    const key = current.toISOString().split("T")[0];
    const data = dailyMap[key] || { entradas: 0, saidas: 0 };
    balance += data.entradas - data.saidas;

    points.push({
      date: key,
      label: `${String(current.getDate()).padStart(2, "0")}/${String(current.getMonth() + 1).padStart(2, "0")}`,
      balance,
      entradas: data.entradas,
      saidas: data.saidas,
    });

    current.setDate(current.getDate() + 1);
  }

  return points;
}

/** Extract pie chart data for a specific type */
export function getCategoryPieData(
  breakdown: CategoryBreakdownItem[],
  type: "entrada" | "saida"
): { name: string; value: number; color: string }[] {
  return breakdown
    .filter((item) => item.type === type)
    .map((item) => ({ name: item.label, value: item.total, color: item.color }));
}
