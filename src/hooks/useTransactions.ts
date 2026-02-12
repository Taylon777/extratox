import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DbTransaction {
  id: string;
  date: string;
  description: string;
  category: "pix" | "transferencia" | "cartao_debito" | "cartao_credito" | "taxas" | "outros";
  type: "entrada" | "saida";
  value: number;
  bank_name?: string;
  is_duplicate?: boolean;
  created_at?: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, date, description, category, type, value, bank_name, is_duplicate, created_at")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions((data as DbTransaction[]) || []);
    } catch (err) {
      console.error("Erro ao carregar transações:", err);
      toast.error("Erro ao carregar transações");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransactions = useCallback(
    async (newTransactions: Omit<DbTransaction, "id" | "created_at">[]) => {
      if (!user) return [];

      const rows = newTransactions.map((t) => ({
        user_id: user.id,
        date: t.date,
        description: t.description.slice(0, 500),
        category: t.category,
        type: t.type,
        value: t.value,
        bank_name: t.bank_name || null,
        is_duplicate: t.is_duplicate || false,
      }));

      const { data, error } = await supabase
        .from("transactions")
        .insert(rows)
        .select("id, date, description, category, type, value, bank_name, is_duplicate, created_at");

      if (error) {
        console.error("Erro ao salvar transações:", error);
        toast.error("Erro ao salvar transações no banco");
        throw error;
      }

      const inserted = (data as DbTransaction[]) || [];
      setTransactions((prev) => [...inserted, ...prev]);
      return inserted;
    },
    [user]
  );

  const monthlyData = useMemo(() => {
    const grouped: Record<string, { entradas: number; saidas: number }> = {};
    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = { entradas: 0, saidas: 0 };
      if (t.type === "entrada") grouped[key].entradas += Number(t.value);
      else grouped[key].saidas += Number(t.value);
    }

    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, vals]) => {
        const monthIdx = parseInt(key.split("-")[1]) - 1;
        return { name: `${months[monthIdx]}/${key.split("-")[0].slice(2)}`, ...vals };
      });
  }, [transactions]);

  return { transactions, isLoading, addTransactions, refetch: fetchTransactions, monthlyData };
}
