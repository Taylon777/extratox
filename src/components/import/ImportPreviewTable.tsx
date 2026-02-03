import { useState, useMemo } from "react";
import { ExtendedTransaction, paymentMethodLabels, categoryLabels } from "@/types/importTypes";
import { calculateImportStats } from "@/lib/parsers/unifiedParser";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  Copy, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImportPreviewTableProps {
  transactions: ExtendedTransaction[];
  onTransactionsChange: (transactions: ExtendedTransaction[]) => void;
  onConfirmImport: () => void;
  onCancel: () => void;
}

const categoryColors: Record<string, string> = {
  pix: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  transferencia: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  cartao_debito: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  cartao_credito: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  taxas: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  outros: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export function ImportPreviewTable({
  transactions,
  onTransactionsChange,
  onConfirmImport,
  onCancel,
}: ImportPreviewTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTransaction, setEditedTransaction] = useState<ExtendedTransaction | null>(null);
  const [filters, setFilters] = useState({
    paymentMethod: "all",
    type: "all",
    showDuplicates: true,
  });

  const stats = useMemo(() => calculateImportStats(transactions), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.paymentMethod !== "all" && t.paymentMethod !== filters.paymentMethod) return false;
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (!filters.showDuplicates && t.isDuplicate) return false;
      return true;
    });
  }, [transactions, filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const handleSelectAll = (checked: boolean) => {
    const filteredIds = new Set(filteredTransactions.map((t) => t.id));
    onTransactionsChange(
      transactions.map((t) => 
        filteredIds.has(t.id) ? { ...t, isSelected: checked } : t
      )
    );
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    onTransactionsChange(
      transactions.map((t) => (t.id === id ? { ...t, isSelected: checked } : t))
    );
  };

  const handleRemoveByPaymentMethod = (method: ExtendedTransaction["paymentMethod"]) => {
    onTransactionsChange(
      transactions.map((t) => 
        t.paymentMethod === method ? { ...t, isSelected: false } : t
      )
    );
  };

  const handleRemoveByCategory = (category: ExtendedTransaction["category"]) => {
    onTransactionsChange(
      transactions.map((t) => 
        t.category === category ? { ...t, isSelected: false } : t
      )
    );
  };

  const handleRemoveDuplicates = () => {
    onTransactionsChange(
      transactions.map((t) => (t.isDuplicate ? { ...t, isSelected: false } : t))
    );
  };

  const handleStartEdit = (transaction: ExtendedTransaction) => {
    setEditingId(transaction.id);
    setEditedTransaction({ ...transaction });
  };

  const handleSaveEdit = () => {
    if (!editedTransaction) return;
    onTransactionsChange(
      transactions.map((t) =>
        t.id === editedTransaction.id ? { ...editedTransaction, isEdited: true } : t
      )
    );
    setEditingId(null);
    setEditedTransaction(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedTransaction(null);
  };

  const handleDelete = (id: string) => {
    onTransactionsChange(transactions.filter((t) => t.id !== id));
  };

  const allFilteredSelected = filteredTransactions.every((t) => t.isSelected !== false);
  const someFilteredSelected = filteredTransactions.some((t) => t.isSelected !== false);

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transações Selecionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.selected}/{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.totalEntradas)}
            </div>
            <p className="text-xs text-muted-foreground">{stats.entradas} transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <ArrowDownCircle className="h-4 w-4 text-rose-500" />
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(stats.totalSaidas)}
            </div>
            <p className="text-xs text-muted-foreground">{stats.saidas} transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duplicatas Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.duplicates}</div>
            {stats.duplicates > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs"
                onClick={handleRemoveDuplicates}
              >
                Remover duplicatas
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Ações Rápidas de Remoção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveByPaymentMethod("pix")}
            >
              <X className="h-3 w-3 mr-1" />
              Remover PIX
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveByPaymentMethod("cartao_debito")}
            >
              <X className="h-3 w-3 mr-1" />
              Remover Cartão Débito
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveByPaymentMethod("cartao_credito")}
            >
              <X className="h-3 w-3 mr-1" />
              Remover Cartão Crédito
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveByCategory("taxas")}
            >
              <X className="h-3 w-3 mr-1" />
              Remover Taxas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveByPaymentMethod("ted")}
            >
              <X className="h-3 w-3 mr-1" />
              Remover TED
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveByPaymentMethod("doc")}
            >
              <X className="h-3 w-3 mr-1" />
              Remover DOC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Meio de Pagamento:</span>
          <Select
            value={filters.paymentMethod}
            onValueChange={(v) => setFilters((f) => ({ ...f, paymentMethod: v }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(paymentMethodLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Tipo:</span>
          <Select
            value={filters.type}
            onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="showDuplicates"
            checked={filters.showDuplicates}
            onCheckedChange={(checked) =>
              setFilters((f) => ({ ...f, showDuplicates: !!checked }))
            }
          />
          <label htmlFor="showDuplicates" className="text-sm cursor-pointer">
            Mostrar duplicatas
          </label>
        </div>
      </div>

      {/* Totals by Payment Method */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats.byPaymentMethod).map(([method, data]) => (
          <Badge key={method} variant="outline" className="text-xs">
            {paymentMethodLabels[method as ExtendedTransaction["paymentMethod"]] || method}:{" "}
            {data.count}x ({formatCurrency(data.total)})
          </Badge>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Meio</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className={cn(
                    transaction.isSelected === false && "opacity-50",
                    transaction.isDuplicate && "bg-amber-50 dark:bg-amber-950/20",
                    transaction.isEdited && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={transaction.isSelected !== false}
                      onCheckedChange={(checked) =>
                        handleSelectOne(transaction.id, !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === transaction.id ? (
                      <Input
                        type="date"
                        value={editedTransaction?.date || ""}
                        onChange={(e) =>
                          setEditedTransaction((t) =>
                            t ? { ...t, date: e.target.value } : null
                          )
                        }
                        className="w-32"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        {formatDate(transaction.date)}
                        {transaction.isDuplicate && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Copy className="h-3 w-3 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Possível duplicata detectada</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === transaction.id ? (
                      <Input
                        value={editedTransaction?.description || ""}
                        onChange={(e) =>
                          setEditedTransaction((t) =>
                            t ? { ...t, description: e.target.value } : null
                          )
                        }
                        className="w-full"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="truncate max-w-[200px]">
                          {transaction.description}
                        </span>
                        {transaction.isEdited && (
                          <Badge variant="outline" className="text-xs">
                            Editado
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === transaction.id ? (
                      <Select
                        value={editedTransaction?.category}
                        onValueChange={(v) =>
                          setEditedTransaction((t) =>
                            t ? { ...t, category: v as ExtendedTransaction["category"] } : null
                          )
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-normal text-xs",
                          categoryColors[transaction.category]
                        )}
                      >
                        {categoryLabels[transaction.category]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === transaction.id ? (
                      <Select
                        value={editedTransaction?.paymentMethod}
                        onValueChange={(v) =>
                          setEditedTransaction((t) =>
                            t
                              ? {
                                  ...t,
                                  paymentMethod: v as ExtendedTransaction["paymentMethod"],
                                }
                              : null
                          )
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(paymentMethodLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {paymentMethodLabels[transaction.paymentMethod]}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === transaction.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editedTransaction?.value || 0}
                        onChange={(e) =>
                          setEditedTransaction((t) =>
                            t ? { ...t, value: parseFloat(e.target.value) || 0 } : null
                          )
                        }
                        className="w-24 text-right"
                      />
                    ) : (
                      <span
                        className={cn(
                          "font-semibold",
                          transaction.type === "entrada"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        )}
                      >
                        {transaction.type === "entrada" ? "+" : "-"}{" "}
                        {formatCurrency(transaction.value)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === transaction.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleSaveEdit}
                        >
                          <Check className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(transaction)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {stats.selected} de {stats.total} transações serão importadas
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirmImport} disabled={stats.selected === 0}>
            Confirmar Importação ({stats.selected})
          </Button>
        </div>
      </div>
    </div>
  );
}
