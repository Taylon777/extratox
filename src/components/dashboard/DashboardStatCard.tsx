import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: DashboardStatCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-0 shadow-[0_1px_3px_0_hsl(var(--foreground)/0.06)]">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-lg ${iconBg} flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {title}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
