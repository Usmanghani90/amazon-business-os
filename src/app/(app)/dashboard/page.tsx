import type { Metadata } from "next";
import {
  Banknote,
  CalendarDays,
  Coins,
  CreditCard,
  DollarSign,
  Landmark,
  LineChart,
  Megaphone,
  Package,
  Percent,
  PiggyBank,
  Receipt,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getDashboardData } from "@/lib/dashboard-data";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaTrend, BarTrend, DonutChart } from "@/components/charts";
import { formatCompactCurrency, formatCurrency, formatDate, formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Executive Dashboard" };
export const dynamic = "force-dynamic";

const money = (v: number) => formatCompactCurrency(v);

export default async function DashboardPage() {
  const data = await getDashboardData();
  const k = data.kpis;
  const c = data.charts;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        description="Company-wide performance across sales, profitability, cash, and advertising."
      >
        <Badge variant="outline" className="gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> Last 90 days
        </Badge>
      </PageHeader>

      {/* Sales windows */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={formatCurrency(k.salesToday)} icon={DollarSign} accent="text-emerald-500" />
        <StatCard label="Yesterday" value={formatCurrency(k.salesYesterday)} icon={DollarSign} accent="text-sky-500" />
        <StatCard label="Last 7 Days" value={money(k.sales7)} icon={TrendingUp} accent="text-violet-500" />
        <StatCard
          label="Last 30 Days"
          value={money(k.sales30)}
          icon={TrendingUp}
          delta={data.deltas.sales30}
          deltaLabel="vs prior 30d"
          accent="text-indigo-500"
        />
      </section>

      {/* Profitability */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Profitability</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Revenue" value={money(k.totalRevenue)} icon={LineChart} accent="text-emerald-500" />
          <StatCard label="Gross Profit" value={money(k.grossProfit)} icon={PiggyBank} accent="text-teal-500" />
          <StatCard label="Net Profit" value={money(k.netProfit)} icon={Wallet} accent="text-green-500" />
          <StatCard label="Profit Margin" value={formatPercent(k.profitMargin)} icon={Percent} accent="text-lime-500" />
          <StatCard label="CM1" value={money(k.cm1)} icon={Target} hint="Revenue − COGS" accent="text-sky-500" />
          <StatCard label="CM2" value={money(k.cm2)} icon={Target} hint="− Amazon fees & refunds" accent="text-blue-500" />
          <StatCard label="CM3" value={money(k.cm3)} icon={Target} hint="− Ads, promos, coupons" accent="text-indigo-500" />
          <StatCard label="Total Inventory" value={money(k.inventoryValue)} icon={Package} accent="text-violet-500" />
        </div>
      </section>

      {/* Cash & capital */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Cash & Capital</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Bank Balance" value={money(k.bankBalance)} icon={Landmark} accent="text-emerald-500" />
          <StatCard label="Cash Balance" value={money(k.cashBalance)} icon={Coins} accent="text-amber-500" />
          <StatCard label="Amazon Balance" value={money(k.amazonBalance)} icon={Banknote} hint="Pending payout" accent="text-orange-500" />
          <StatCard label="Payout Pending" value={money(k.amazonPending)} icon={Banknote} accent="text-yellow-500" />
          <StatCard label="Total Investments" value={money(k.totalInvestments)} icon={TrendingUp} accent="text-sky-500" />
          <StatCard label="Total Expenses" value={money(k.totalExpenses)} icon={Receipt} invertDelta accent="text-rose-500" />
          <StatCard label="Total Withdrawals" value={money(k.totalWithdrawals)} icon={CreditCard} accent="text-fuchsia-500" />
          <StatCard label="PPC Spend" value={money(k.ppcSpend)} icon={Megaphone} delta={data.deltas.ppc30} deltaLabel="vs prior 30d" invertDelta accent="text-pink-500" />
        </div>
      </section>

      {/* Advertising efficiency */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Advertising Efficiency</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="ACOS" value={formatPercent(k.acos)} icon={Target} hint="Ad spend ÷ ad sales" invertDelta accent="text-rose-500" />
          <StatCard label="TACOS" value={formatPercent(k.tacos)} icon={Target} hint="Ad spend ÷ total sales" invertDelta accent="text-amber-500" />
          <StatCard label="ROAS" value={`${k.roas.toFixed(2)}×`} icon={TrendingUp} hint="Ad sales ÷ ad spend" accent="text-emerald-500" />
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" title="Daily Sales & Ad Spend" description="Revenue vs advertising over the last 30 days">
          <AreaTrend
            data={c.salesTrend}
            xKey="date"
            format="currency"
            series={[
              { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
              { key: "adSpend", label: "Ad Spend", color: "var(--chart-4)" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Expense by Category" description="Where the money goes">
          {c.expenseByCategory.length ? (
            <div className="space-y-3">
              <DonutChart data={c.expenseByCategory} height={200} format="currency" />
              <ul className="space-y-1.5">
                {c.expenseByCategory.slice(0, 5).map((e) => (
                  <li key={e.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />
                    <span className="text-muted-foreground">{e.name}</span>
                    <span className="ml-auto font-medium tabular-nums">{money(e.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Profit Trend" description="Estimated daily contribution after variable costs">
          <AreaTrend data={c.salesTrend} xKey="date" format="currency" series={[{ key: "profit", label: "Net Profit", color: "var(--chart-2)" }]} />
        </ChartCard>
        <ChartCard title="Inventory Value" description="Landed value of on-hand stock">
          <AreaTrend data={c.inventoryTrend} xKey="date" format="currency" series={[{ key: "value", label: "Inventory", color: "var(--chart-3)" }]} />
        </ChartCard>
        <ChartCard title="Amazon Payout Trend" description="Net settlement per period">
          <BarTrend data={c.payoutTrend} xKey="date" format="currency" series={[{ key: "amount", label: "Net Payout", color: "var(--chart-1)" }]} />
        </ChartCard>
        <ChartCard title="Expense Trend" description="Daily operating outflow (30 days)">
          <BarTrend data={c.expenseTrend} xKey="date" format="currency" series={[{ key: "expenses", label: "Expenses", color: "var(--chart-5)" }]} />
        </ChartCard>
        <ChartCard className="lg:col-span-2" title="Cash Flow" description="Investments, payouts, and withdrawals by month">
          <BarTrend
            data={c.cashFlow}
            xKey="month"
            format="currency"
            series={[
              { key: "investments", label: "Investments", color: "var(--chart-2)" },
              { key: "payouts", label: "Payouts", color: "var(--chart-1)" },
              { key: "withdrawals", label: "Withdrawals", color: "var(--chart-4)" },
            ]}
          />
        </ChartCard>
      </section>

      {/* Recent activity */}
      <section className="grid gap-4 lg:grid-cols-4">
        <ActivityCard title="Latest Expenses" items={data.recent.expenses} negative />
        <ActivityCard title="Latest Investments" items={data.recent.investments} />
        <ActivityCard title="Latest Withdrawals" items={data.recent.withdrawals} negative />
        <ActivityCard title="Latest Payouts" items={data.recent.payouts} />
      </section>
    </div>
  );
}

function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ActivityCard({
  title,
  items,
  negative,
}: {
  title: string;
  items: { id: string; label: string; sub: string; amount: number; date: Date | string }[];
  negative?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No records</p>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 px-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.label}</p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {it.sub.toLowerCase()} · {formatDate(it.date, "short")}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-medium tabular-nums ${negative ? "text-rose-500" : "text-emerald-500"}`}>
                  {negative ? "−" : "+"}
                  {formatCompactCurrency(it.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
