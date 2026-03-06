import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: DashboardStatCardProps) {
  return (
    <Card className="group border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg flex-shrink-0", iconBg)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="text-lg font-bold tracking-tight text-foreground mt-0.5 tabular-nums">
              {value}
            </p>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
