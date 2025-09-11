import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "success" | "warning" | "accent";
  className?: string;
}

const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = "primary",
  className 
}: StatsCardProps) => {
  const colorClasses = {
    primary: "text-primary bg-insurance-light-blue",
    success: "text-success bg-success-light",
    warning: "text-warning bg-warning-light",
    accent: "text-accent bg-accent/10",
  };

  const trendClasses = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className={cn("bg-gradient-card shadow-card hover:shadow-elevated transition-smooth", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-insurance-gray">
          {title}
        </CardTitle>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-insurance-navy mb-1">
          {value}
        </div>
        {description && (
          <p className={cn(
            "text-xs",
            trend ? trendClasses[trend] : "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;