import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Percentage change vs previous period (already computed). */
  delta?: number;
  deltaLabel?: string;
  /** When true, a negative delta is good (e.g. ACOS, expenses). */
  invertDelta?: boolean;
  hint?: string;
  accent?: string; // tailwind text color class for the icon, e.g. "text-emerald-500"
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  invertDelta = false,
  hint,
  accent = "text-primary",
}: StatCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;
  const good = invertDelta ? !positive : positive;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {Icon && (
            <span className={cn("rounded-md bg-muted/60 p-1.5", accent)}>
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(delta!).toFixed(1)}%
            </span>
          )}
          <span className="text-muted-foreground">{deltaLabel ?? hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}
