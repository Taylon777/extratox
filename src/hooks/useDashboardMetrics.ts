/**
 * Hook that computes all dashboard metrics from filtered transactions.
 * 100% derived from the provided data — zero global state contamination.
 */

import { useMemo } from "react";
import {
  calculateMetrics,
  getCategoryPieData,
  type FinancialMetrics,
} from "@/services/financialCalculationService";
import type { DbTransaction } from "@/hooks/useTransactions";

export interface FilterState {
  startDate: Date | undefined;
  endDate: Date | undefined;
  excludedCategories: string[];
  importId?: string; // Filter by specific import
}

export function useDashboardMetrics(
  transactions: DbTransaction[],
  filters: FilterState
) {
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Import isolation
      if (filters.importId && (t as any).import_id !== filters.importId) return false;

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

  const metrics: FinancialMetrics = useMemo(
    () => calculateMetrics(filteredTransactions),
    [filteredTransactions]
  );

  const categoryDataEntradas = useMemo(
    () => getCategoryPieData(metrics.categoryBreakdown, "entrada"),
    [metrics.categoryBreakdown]
  );

  const categoryDataSaidas = useMemo(
    () => getCategoryPieData(metrics.categoryBreakdown, "saida"),
    [metrics.categoryBreakdown]
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return {
    filteredTransactions,
    metrics,
    categoryDataEntradas,
    categoryDataSaidas,
    formatCurrency,
  };
}
