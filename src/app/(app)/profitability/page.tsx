import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getProfitability } from "@/lib/profitability";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WaterfallChart, BarTrend, DonutChart } from "@/components/charts";
import { ProfitabilityFilters } from "@/components/profitability/filters";
import { formatCompactCurrency, formatCurrency, formatPercent, formatNumber } from "@/lib/format";
import { DollarSign, Layers, TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "Product Profitability" };
export const dynamic = "force-dynamic";

const money = (v: number) => formatCompactCurrency(v);
const DAY = 86_400_000;

export default async function ProfitabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string; product?: string; period?: string }>;
}) {
  const sp = await searchParams;
  const period = sp.period ?? "all";
  const from = period === "all" ? undefined : new Date(Date.now() - Number(period) * DAY);

  const [marketplaces, products, data] = await Promise.all([
    db.marketplace.findMany({ orderBy: { code: "asc" } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getProfitability({ marketplaceId: sp.market, productId: sp.product, from }),
  ]);

  const b = data.business;
  const single = data.rows.length === 1 ? data.rows[0] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Profitability"
        description="Titan Network CM1 → CM2 → CM3 → CM4 → Net Profit, per SKU and business-wide."
      >
        <Badge variant="outline" className="gap-1.5">
          <Layers className="h-3.5 w-3.5" /> {data.rows.length} SKU{data.rows.length === 1 ? "" : "s"}
        </Badge>
      </PageHeader>

      <ProfitabilityFilters
        marketplaces={marketplaces.map((m) => ({ value: m.id, label: `${m.code} · ${m.name}` }))}
        products={products.map((p) => ({ value: p.id, label: p.name }))}
        current={{ market: sp.market ?? "all", product: sp.product ?? "all", period }}
      />

      {/* Contribution margin KPI row */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Revenue" value={money(b.revenue)} icon={DollarSign} accent="text-emerald-500" />
        <StatCard label="CM1" value={money(b.cm1)} icon={Layers} hint={formatPercent(b.cm1Margin)} accent="text-sky-500" />
        <StatCard label="CM2" value={money(b.cm2)} icon={Layers} hint={formatPercent(b.cm2Margin)} accent="text-blue-500" />
        <StatCard label="CM3" value={money(b.cm3)} icon={Layers} hint={formatPercent(b.cm3Margin)} accent="text-indigo-500" />
        <StatCard label="CM4" value={money(b.cm4)} icon={Layers} hint={formatPercent(b.cm4Margin)} accent="text-violet-500" />
        <StatCard label="Net Profit" value={money(b.netProfit)} icon={TrendingUp} hint={formatPercent(b.netMargin)} accent="text-green-500" />
      </section>

      {/* Waterfall + cost mix */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Contribution Margin Waterfall{single ? ` — ${single.name}` : ""}
            </CardTitle>
            <CardDescription>Revenue flowing down through each cost layer to Net Profit</CardDescription>
          </CardHeader>
          <CardContent>
            <WaterfallChart steps={b.steps} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost Structure</CardTitle>
            <CardDescription>Share of every cost layer</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              format="currency"
              height={200}
              data={[
                { name: "Landing Cost", value: data.totals.landingCost, color: "var(--chart-1)" },
                { name: "Amazon Fees", value: data.totals.amazonFees, color: "var(--chart-2)" },
                { name: "Advertising", value: data.totals.advertising, color: "var(--chart-3)" },
                { name: "Refunds & Promos", value: data.totals.refundsPromotions, color: "var(--chart-4)" },
                { name: "Operating", value: data.totals.operatingExpenses, color: "var(--chart-5)" },
              ].filter((d) => d.value > 0)}
            />
            {data.adBreakdown.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {data.adBreakdown.map((a) => (
                  <li key={a.name} className="flex justify-between">
                    <span className="text-muted-foreground">{a.name}</span>
                    <span className="font-medium tabular-nums">{money(a.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* SKU comparison */}
      {data.rows.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SKU Comparison — Net Profit</CardTitle>
            <CardDescription>Contribution to bottom line by product</CardDescription>
          </CardHeader>
          <CardContent>
            <BarTrend
              data={data.rows.map((r) => ({ name: r.name.split(" ").slice(0, 2).join(" "), netProfit: Math.round(r.netProfit) }))}
              xKey="name"
              format="currency"
              series={[{ key: "netProfit", label: "Net Profit", color: "var(--chart-2)" }]}
            />
          </CardContent>
        </Card>
      )}

      {/* Per-SKU table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-SKU Profitability</CardTitle>
          <CardDescription>Full contribution-margin breakdown for every product</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card">Product</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">ASP</TableHead>
                  <TableHead className="text-right">Landing</TableHead>
                  <TableHead className="text-right">Amazon</TableHead>
                  <TableHead className="text-right">PPC</TableHead>
                  <TableHead className="text-right">Refunds</TableHead>
                  <TableHead className="text-right">CM1</TableHead>
                  <TableHead className="text-right">CM2</TableHead>
                  <TableHead className="text-right">CM3</TableHead>
                  <TableHead className="text-right">CM4</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">ACOS</TableHead>
                  <TableHead className="text-right">TACOS</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Inv.</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r) => (
                  <TableRow key={r.productId}>
                    <TableCell className="sticky left-0 bg-card font-medium">
                      <div className="min-w-44">
                        <div className="truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.revenue)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.unitsSold)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(r.avgSellingPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{money(r.landingCost)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{money(r.amazonFees)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{money(r.advertising)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{money(r.refundsPromotions)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.cm1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.cm2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.cm3)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.cm4)}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${r.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {money(r.netProfit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(r.netMargin)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(r.acos)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(r.tacos)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.roas.toFixed(2)}×</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.inventoryRemaining)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.daysOfInventory ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
