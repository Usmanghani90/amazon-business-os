"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatCompactNumber, formatNumber, formatPercent } from "@/lib/format";

/** Formatter selector — strings cross the server→client boundary; functions can't. */
export type ChartFormat = "currency" | "compact" | "number" | "percent";

function makeFormatter(format?: ChartFormat) {
  switch (format) {
    case "currency":
      return (v: number) => formatCompactCurrency(v);
    case "compact":
      return (v: number) => formatCompactNumber(v);
    case "percent":
      return (v: number) => formatPercent(v);
    case "number":
      return (v: number) => formatNumber(v);
    default:
      return (v: number) => `${v}`;
  }
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function TooltipBox({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <div className="mb-1 font-medium text-popover-foreground">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-medium text-popover-foreground tabular-nums">
              {formatter ? formatter(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface SeriesDef {
  key: string;
  label: string;
  color?: string;
}

interface TrendProps {
  data: Record<string, any>[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  format?: ChartFormat;
  stacked?: boolean;
}

export function AreaTrend({ data, xKey, series, height = 260, format }: TrendProps) {
  const valueFormatter = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
        <YAxis {...axisProps} width={48} tickFormatter={valueFormatter} />
        <Tooltip content={<TooltipBox formatter={valueFormatter} />} />
        {series.map((s, i) => {
          const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({ data, xKey, series, height = 260, format }: TrendProps) {
  const valueFormatter = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
        <YAxis {...axisProps} width={48} tickFormatter={valueFormatter} />
        <Tooltip content={<TooltipBox formatter={valueFormatter} />} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => {
          const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarTrend({ data, xKey, series, height = 260, format, stacked }: TrendProps) {
  const valueFormatter = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} {...axisProps} minTickGap={16} />
        <YAxis {...axisProps} width={48} tickFormatter={valueFormatter} />
        <Tooltip content={<TooltipBox formatter={valueFormatter} />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => {
          const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={color}
              radius={stacked ? 0 : [4, 4, 0, 0]}
              stackId={stacked ? "a" : undefined}
              maxBarSize={48}
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DonutProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  format?: ChartFormat;
}

export function DonutChart({ data, height = 260, format }: DonutProps) {
  const valueFormatter = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          strokeWidth={2}
          stroke="var(--background)"
        >
          {data.map((d, i) => (
            <Cell key={d.name} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<TooltipBox formatter={valueFormatter} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
