import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingUp, Receipt, ArrowDownToLine, Wallet, PieChart, HandCoins, Scale } from "lucide-react";
import { getPartnerDetail } from "@/lib/partners-data";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { PartnerFormDialog } from "@/components/partners/partner-form-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Partner" };
export const dynamic = "force-dynamic";

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPartnerDetail(id);
  if (!data) notFound();

  const { partner, stats, ledger, transactions } = data;

  return (
    <div className="space-y-6">
      <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All partners
      </Link>

      <PageHeader
        title={partner.name}
        description={partner.email ?? "Partner statement, ledger, and equity position."}
      >
        {partner.isDefault && <Badge variant="secondary">Default</Badge>}
        {!partner.active && <Badge variant="outline">Inactive</Badge>}
        <PartnerFormDialog
          partner={{
            id: partner.id,
            name: partner.name,
            email: partner.email,
            phone: partner.phone,
            equityPct: partner.equityPct,
            joinedDate: partner.joinedDate,
            active: partner.active,
            notes: partner.notes,
          }}
        />
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Investment" value={formatCurrency(stats.investment)} icon={TrendingUp} accent="text-emerald-500" />
        <StatCard label="Expenses Paid" value={formatCurrency(stats.expensesPaid)} icon={Receipt} accent="text-sky-500" />
        <StatCard label="Withdrawals" value={formatCurrency(stats.withdrawals)} icon={ArrowDownToLine} accent="text-rose-500" />
        <StatCard label="Current Balance" value={formatCurrency(stats.currentBalance)} icon={Wallet} accent="text-indigo-500" />
        <StatCard label="Equity" value={formatPercent(partner.equityPct)} icon={PieChart} accent="text-violet-500" />
        <StatCard label="Profit Share" value={formatCurrency(stats.profitShare)} icon={HandCoins} accent="text-teal-500" />
        <StatCard label="Settlement Balance" value={formatCurrency(stats.settlementBalance)} icon={Scale} accent="text-amber-500" />
        <StatCard label="Joined" value={formatDate(partner.joinedDate, "medium")} accent="text-muted-foreground" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ledger */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capital Ledger</CardTitle>
            <CardDescription>Running equity balance over time</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {ledger.length === 0 ? (
              <div className="px-6 pb-6"><EmptyState title="No ledger entries" description="Capital movements will appear here." /></div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...ledger].reverse().map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm">{formatDate(e.date, "short")}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{e.type.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell className={`text-right tabular-nums ${e.amount >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {e.amount >= 0 ? "+" : ""}{formatCurrency(e.amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatCurrency(e.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
            <CardDescription>Investments, expenses paid, and withdrawals</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {transactions.length === 0 ? (
              <div className="px-6 pb-6"><EmptyState title="No transactions yet" /></div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={`${t.type}-${t.id}`}>
                        <TableCell className="text-sm">{formatDate(t.date, "short")}</TableCell>
                        <TableCell className="text-sm">{t.type}</TableCell>
                        <TableCell className="max-w-40 truncate text-sm text-muted-foreground">{t.detail}</TableCell>
                        <TableCell className={`text-right tabular-nums ${t.amount >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {t.amount >= 0 ? "+" : ""}{formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
