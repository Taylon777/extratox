import { useState } from "react";
import { format, startOfMonth, endOfMonth, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  cartao_debito: "Débito",
  cartao_credito: "Crédito",
  taxas: "Taxas",
  outros: "Outros",
};

const datePresets = [
  { label: "Hoje", getRange: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { label: "7 dias", getRange: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) }) },
  { label: "30 dias", getRange: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) }) },
  { label: "Este mês", getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: "Mês anterior", getRange: () => { const prev = subMonths(new Date(), 1); return { start: startOfMonth(prev), end: endOfMonth(prev) }; } },
];

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function TransactionFilters({ filters, onFiltersChange, transactions = [] }: TransactionFiltersProps) {
  const categorySummary = transactions.reduce<Record<string, { count: number; total: number }>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { count: 0, total: 0 };
    acc[t.category].count++;
    acc[t.category].total += Number(t.value);
    return acc;
  }, {});

  const availableCategories = Object.entries(categorySummary)
    .filter(([_, s]) => s.total > 0)
    .map(([cat, s]) => ({ value: cat, label: categoryLabels[cat] || cat, ...s }));

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
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Date Presets */}
        <div className="flex flex-wrap gap-1.5">
          {datePresets.map((preset) => (
            <Button key={preset.label} variant="outline" size="sm" onClick={() => handlePreset(preset)} className="h-7 text-xs px-2.5">
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Date Range */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal h-8 text-xs", !filters.startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {filters.startDate ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
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
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal h-8 text-xs", !filters.endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
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

        {/* Category Exclusion */}
        {availableCategories.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Excluir categorias</Label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => {
                const isExcluded = filters.excludedCategories.includes(cat.value);
                return (
                  <div
                    key={cat.value}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors cursor-pointer",
                      isExcluded ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border hover:bg-muted"
                    )}
                    onClick={() => handleCategoryToggle(cat.value)}
                  >
                    <Checkbox
                      id={`exclude-${cat.value}`}
                      checked={isExcluded}
                      onCheckedChange={() => handleCategoryToggle(cat.value)}
                      className="h-3 w-3"
                    />
                    <span className={cn(isExcluded && "line-through")}>
                      {cat.label}
                      <span className="text-muted-foreground ml-1 text-[10px]">({cat.count})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
