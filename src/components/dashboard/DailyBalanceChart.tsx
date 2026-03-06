import { memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyBalancePoint } from "@/services/financialCalculationService";

interface DailyBalanceChartProps {
  data: DailyBalancePoint[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
  }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as DailyBalancePoint;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="font-semibold text-foreground text-sm mb-1">{p.label}</p>
      <div className="space-y-0.5 text-xs">
        {p.entradas > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-success">Entradas</span>
            <span className="font-semibold tabular-nums">{formatCurrency(p.entradas)}</span>
          </div>
        )}
        {p.saidas > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-destructive">Saídas</span>
            <span className="font-semibold tabular-nums">{formatCurrency(p.saidas)}</span>
          </div>
        )}
        <div className="flex justify-between gap-4 pt-1 border-t border-border">
          <span className="text-foreground font-medium">Saldo</span>
          <span className={`font-bold tabular-nums ${p.balance >= 0 ? "text-success" : "text-destructive"}`}>
            {formatCurrency(p.balance)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const DailyBalanceChart = memo(function DailyBalanceChart({ data }: DailyBalanceChartProps) {
  if (data.length === 0) return null;

  // Show max 60 labels
  const interval = data.length > 60 ? Math.floor(data.length / 30) : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Evolução do Saldo Diário</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval={interval}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                fill="url(#balanceGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
