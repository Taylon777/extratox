import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  title: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pct = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
          <p className="font-semibold text-sm" style={{ color: payload[0].payload.color }}>
            {payload[0].name}
          </p>
          <p className="text-sm text-foreground font-bold tabular-nums">{formatCurrency(payload[0].value)}</p>
          <p className="text-xs text-muted-foreground">{pct}% do total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[200px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-base font-bold text-foreground tabular-nums">{formatCurrency(total)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            </div>
          </div>
        </div>
        <div className="space-y-1.5 mt-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </span>
              <span className="font-semibold text-foreground tabular-nums">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
