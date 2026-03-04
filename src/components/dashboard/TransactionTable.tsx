import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: "pix" | "transferencia" | "cartao_debito" | "cartao_credito" | "taxas" | "outros";
  type: "entrada" | "saida";
  value: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const categoryLabels: Record<Transaction["category"], string> = {
  pix: "Pix",
  transferencia: "Transferência",
  cartao_debito: "Débito",
  cartao_credito: "Crédito",
  taxas: "Taxas",
  outros: "Outros",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pt-BR");

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9">Data</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9">Descrição</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9">Categoria</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9 text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          ) : (
            transactions.slice(0, 50).map((t, idx) => (
              <TableRow key={t.id} className={cn(idx % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                <TableCell className="text-sm tabular-nums text-muted-foreground py-2.5">{formatDate(t.date)}</TableCell>
                <TableCell className="text-sm text-foreground py-2.5 max-w-[280px] truncate">{t.description}</TableCell>
                <TableCell className="py-2.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {categoryLabels[t.category]}
                  </span>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold text-sm py-2.5 tabular-nums",
                  t.type === "entrada" ? "text-success" : "text-destructive"
                )}>
                  {t.type === "entrada" ? "+" : "−"} {formatCurrency(t.value)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {transactions.length > 50 && (
        <div className="text-center py-2 text-xs text-muted-foreground border-t bg-muted/30">
          Exibindo 50 de {transactions.length} transações
        </div>
      )}
    </div>
  );
}
