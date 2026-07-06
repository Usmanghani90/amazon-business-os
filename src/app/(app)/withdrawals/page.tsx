import type { Metadata } from "next";
import { ArrowDownToLine } from "lucide-react";
import { db } from "@/lib/db";
import { toNumber, formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SettingsCrud } from "@/components/settings/settings-crud";
import { ImportDialog } from "@/components/import/import-dialog";
import { saveWithdrawal, deleteWithdrawal } from "@/app/(app)/records/actions";

export const metadata: Metadata = { title: "Withdrawals" };
export const dynamic = "force-dynamic";

const none = { value: "", label: "— none —" };
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function WithdrawalsPage() {
  const [withdrawals, partners, banks, agg] = await Promise.all([
    db.withdrawal.findMany({ orderBy: { date: "desc" }, take: 200, include: { partner: true } }),
    db.partner.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.bankAccount.findMany({ orderBy: { name: "asc" } }),
    db.withdrawal.aggregate({ _sum: { amountBase: true }, _count: true }),
  ]);

  const items = withdrawals.map((x) => ({
    id: x.id,
    date: iso(x.date),
    dateLabel: formatDate(x.date, "medium"),
    partnerId: x.partnerId,
    partnerName: x.partner.name,
    amount: toNumber(x.amount),
    amountLabel: formatCurrency(x.amountBase),
    currency: x.currency,
    bankAccountId: x.bankAccountId ?? "",
    reason: x.reason ?? "",
    notes: x.notes ?? "",
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Withdrawals" description="Partner drawdowns and profit distributions.">
        <ImportDialog moduleKey="withdrawals" label="Withdrawals" />
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Withdrawn" value={formatCompactCurrency(toNumber(agg._sum.amountBase))} icon={ArrowDownToLine} accent="text-rose-500" />
        <StatCard label="Withdrawals" value={String(agg._count)} icon={ArrowDownToLine} accent="text-amber-500" />
        <StatCard label="Active Partners" value={String(partners.length)} icon={ArrowDownToLine} accent="text-sky-500" />
      </section>

      <SettingsCrud
        title="Withdrawals"
        description="Add, edit, or remove withdrawals."
        addLabel="Add withdrawal"
        items={items}
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "partnerId", label: "Partner", type: "select", options: partners.map((p) => ({ value: p.id, label: p.name })) },
          { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
          { name: "currency", label: "Currency", type: "text", defaultValue: "USD" },
          { name: "bankAccountId", label: "Bank", type: "select", options: [none, ...banks.map((b) => ({ value: b.id, label: b.name }))] },
          { name: "reason", label: "Reason", type: "text", placeholder: "Profit distribution" },
          { name: "notes", label: "Notes", type: "text" },
        ]}
        columns={[
          { key: "dateLabel", label: "Date" },
          { key: "partnerName", label: "Partner" },
          { key: "reason", label: "Reason" },
          { key: "amountLabel", label: "Amount", align: "right" },
        ]}
        saveAction={saveWithdrawal}
        deleteAction={deleteWithdrawal}
      />
    </div>
  );
}
