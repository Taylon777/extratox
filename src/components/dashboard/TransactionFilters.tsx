import { useState } from "react";
import { format } from "date-fns";
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
import { Transaction } from "./TransactionTable";

export interface FilterState {
  startDate: Date | undefined;
  endDate: Date | undefined;
  excludedCategories: Transaction["category"][];
}

interface TransactionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const categoryOptions: { value: Transaction["category"]; label: string; color: string }[] = [
  { value: "pix", label: "Pix", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300" },
  { value: "transferencia", label: "Transferência", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "cartao", label: "Cartão", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
  { value: "taxas", label: "Taxas", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300" },
  { value: "outros", label: "Outros", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },
];

export function TransactionFilters({ filters, onFiltersChange }: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartDateChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, startDate: date });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, endDate: date });
  };

  const handleCategoryToggle = (category: Transaction["category"]) => {
    const isExcluded = filters.excludedCategories.includes(category);
    const newExcluded = isExcluded
      ? filters.excludedCategories.filter(c => c !== category)
      : [...filters.excludedCategories, category];
    onFiltersChange({ ...filters, excludedCategories: newExcluded });
  };

  const clearFilters = () => {
    onFiltersChange({
      startDate: undefined,
      endDate: undefined,
      excludedCategories: [],
    });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.excludedCategories.length > 0;

  const activeFilterCount = 
    (filters.startDate ? 1 : 0) + 
    (filters.endDate ? 1 : 0) + 
    filters.excludedCategories.length;

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
        {/* Date Range Filters */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={handleStartDateChange}
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
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Category Exclusion */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Excluir do Cálculo</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Marque as categorias que deseja remover dos totais e gráficos
          </p>
          <div className="flex flex-wrap gap-3">
            {categoryOptions.map((category) => {
              const isExcluded = filters.excludedCategories.includes(category.value);
              return (
                <div
                  key={category.value}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer",
                    isExcluded 
                      ? "border-destructive/50 bg-destructive/10" 
                      : "border-border hover:bg-accent"
                  )}
                  onClick={() => handleCategoryToggle(category.value)}
                >
                  <Checkbox
                    id={`exclude-${category.value}`}
                    checked={isExcluded}
                    onCheckedChange={() => handleCategoryToggle(category.value)}
                  />
                  <Label
                    htmlFor={`exclude-${category.value}`}
                    className={cn(
                      "text-sm cursor-pointer",
                      isExcluded && "line-through text-muted-foreground"
                    )}
                  >
                    {category.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Exclusions Summary */}
        {filters.excludedCategories.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Categorias excluídas:{" "}
              {filters.excludedCategories.map((cat, index) => {
                const option = categoryOptions.find(o => o.value === cat);
                return (
                  <span key={cat}>
                    <span className="font-medium">{option?.label}</span>
                    {index < filters.excludedCategories.length - 1 && ", "}
                  </span>
                );
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
