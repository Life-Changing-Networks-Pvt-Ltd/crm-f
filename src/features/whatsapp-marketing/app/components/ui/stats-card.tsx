// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend && (
              <span className={trend.value > 0 ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
            )}
            {trend && <span className="text-muted-foreground/60">{trend.label}</span>}
            {!trend && description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
