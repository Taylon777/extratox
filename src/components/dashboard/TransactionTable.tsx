import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: "pix" | "transferencia" | "cartao" | "taxas" | "outros";
  type: "entrada" | "saida";
  value: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const categoryLabels: Record<Transaction["category"], string> = {
  pix: "Pix",
  transferencia: "Transferência",
  cartao: "Cartão",
  taxas: "Taxas",
  outros: "Outros",
};

const categoryColors: Record<Transaction["category"], string> = {
  pix: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  transferencia: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  cartao: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  taxas: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  outros: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export function TransactionTable({ transactions }: TransactionTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn("font-normal", categoryColors[transaction.category])}>
                    {categoryLabels[transaction.category]}
                  </Badge>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  transaction.type === "entrada" ? "text-emerald-600" : "text-rose-600"
                )}>
                  {transaction.type === "entrada" ? "+" : "-"} {formatCurrency(transaction.value)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
