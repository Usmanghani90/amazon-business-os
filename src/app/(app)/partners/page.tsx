import type { Metadata } from "next";
import Link from "next/link";
import { Users, TrendingUp, Wallet, PieChart } from "lucide-react";
import { getPartnersWithStats } from "@/lib/partners-data";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PartnerFormDialog } from "@/components/partners/partner-form-dialog";
import { DeletePartnerDialog } from "@/components/partners/delete-partner-dialog";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Partners" };
export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const partners = await getPartnersWithStats();
  const totalInvestment = partners.reduce((s, p) => s + p.investment, 0);
  const totalEquity = partners.reduce((s, p) => s + p.equityPct, 0);
  const totalSettlement = partners.reduce((s, p) => s + p.settlementBalance, 0);
  const activeCount = partners.filter((p) => p.active).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Partners" description="Capital, equity, profit share, and settlement across all partners.">
        <PartnerFormDialog />
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Partners" value={String(activeCount)} icon={Users} accent="text-sky-500" />
        <StatCard label="Total Investment" value={formatCompactCurrency(totalInvestment)} icon={TrendingUp} accent="text-emerald-500" />
        <StatCard
          label="Equity Allocated"
          value={formatPercent(totalEquity, 1)}
          icon={PieChart}
          accent="text-violet-500"
          hint={totalEquity === 100 ? "Fully allocated" : "Check allocation"}
        />
        <StatCard label="Settlement Pool" value={formatCompactCurrency(totalSettlement)} icon={Wallet} accent="text-amber-500" />
      </section>

      <Card>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead className="text-right">Equity</TableHead>
                  <TableHead className="text-right">Investment</TableHead>
                  <TableHead className="text-right">Expenses Paid</TableHead>
                  <TableHead className="text-right">Withdrawals</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead className="text-right">Profit Share</TableHead>
                  <TableHead className="text-right">Settlement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/partners/${p.id}`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                        {p.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                        {!p.active && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                      </div>
                      {p.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(p.equityPct)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.investment)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(p.expensesPaid)}</TableCell>
                    <TableCell className="text-right tabular-nums text-rose-500">{formatCurrency(p.withdrawals)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(p.currentBalance)}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-500">{formatCurrency(p.profitShare)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(p.settlementBalance)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <PartnerFormDialog
                          partner={{
                            id: p.id,
                            name: p.name,
                            email: p.email,
                            phone: p.phone,
                            equityPct: p.equityPct,
                            joinedDate: p.joinedDate,
                            active: p.active,
                          }}
                        />
                        <DeletePartnerDialog id={p.id} name={p.name} isDefault={p.isDefault} hasHistory={p.txnCount > 0} />
                      </div>
                    </TableCell>
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
