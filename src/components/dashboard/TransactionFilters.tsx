import { useState } from "react";
import { format, startOfMonth, endOfMonth, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterState {
  startDate: Date | undefined;
  endDate: Date | undefined;
  excludedCategories: string[];
}

interface TransactionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  transactions?: { category: string; type: string; value: number }[];
}

const categoryLabels: Record<string, string> = {
  pix: "Pix",
  transferencia: "Transferência",
  cartao_debito: "Vendas – Disponível Débito",
  cartao_credito: "Vendas – Disponível Crédito",
  taxas: "Taxas",
  outros: "Outros",
};

const categoryColors: Record<string, string> = {
  pix: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  transferencia: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  cartao_debito: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  cartao_credito: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  taxas: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  outros: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const datePresets = [
  { label: "Hoje", getRange: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { label: "Últimos 7 dias", getRange: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) }) },
  { label: "Últimos 30 dias", getRange: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) }) },
  { label: "Este mês", getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: "Mês anterior", getRange: () => { const prev = subMonths(new Date(), 1); return { start: startOfMonth(prev), end: endOfMonth(prev) }; } },
];

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function TransactionFilters({ filters, onFiltersChange, transactions = [] }: TransactionFiltersProps) {
  // Derive available categories from actual data
  const categorySummary = transactions.reduce<Record<string, { count: number; total: number }>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { count: 0, total: 0 };
    acc[t.category].count++;
    acc[t.category].total += Number(t.value);
    return acc;
  }, {});

  const availableCategories = Object.entries(categorySummary)
    .filter(([_, s]) => s.total > 0)
    .map(([cat, s]) => ({ value: cat, label: categoryLabels[cat] || cat, color: categoryColors[cat] || "", ...s }));

  const handlePreset = (preset: typeof datePresets[0]) => {
    const { start, end } = preset.getRange();
    onFiltersChange({ ...filters, startDate: start, endDate: end });
  };

  const handleCategoryToggle = (category: string) => {
    const isExcluded = filters.excludedCategories.includes(category);
    const newExcluded = isExcluded
      ? filters.excludedCategories.filter((c) => c !== category)
      : [...filters.excludedCategories, category];
    onFiltersChange({ ...filters, excludedCategories: newExcluded });
  };

  const clearFilters = () => {
    onFiltersChange({ startDate: undefined, endDate: undefined, excludedCategories: [] });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.excludedCategories.length > 0;
  const activeFilterCount =
    (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0) + filters.excludedCategories.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} ativo{activeFilterCount > 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Presets */}
        <div className="flex flex-wrap gap-2">
          {datePresets.map((preset) => (
            <Button key={preset.label} variant="outline" size="sm" onClick={() => handlePreset(preset)}>
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Date Range Pickers */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => onFiltersChange({ ...filters, startDate: date })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => onFiltersChange({ ...filters, endDate: date })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Dynamic Category Exclusion */}
        {availableCategories.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Excluir do Cálculo</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Marque as categorias que deseja remover dos totais e gráficos
            </p>
            <div className="flex flex-wrap gap-3">
              {availableCategories.map((cat) => {
                const isExcluded = filters.excludedCategories.includes(cat.value);
                return (
                  <div
                    key={cat.value}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer",
                      isExcluded ? "border-destructive/50 bg-destructive/10" : "border-border hover:bg-accent"
                    )}
                    onClick={() => handleCategoryToggle(cat.value)}
                  >
                    <Checkbox
                      id={`exclude-${cat.value}`}
                      checked={isExcluded}
                      onCheckedChange={() => handleCategoryToggle(cat.value)}
                    />
                    <Label
                      htmlFor={`exclude-${cat.value}`}
                      className={cn("text-sm cursor-pointer", isExcluded && "line-through text-muted-foreground")}
                    >
                      {cat.label}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({cat.count} • {formatBRL(cat.total)})
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filters.excludedCategories.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Categorias excluídas:{" "}
              {filters.excludedCategories.map((cat, idx) => (
                <span key={cat}>
                  <span className="font-medium">{categoryLabels[cat] || cat}</span>
                  {idx < filters.excludedCategories.length - 1 && ", "}
                </span>
              ))}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
