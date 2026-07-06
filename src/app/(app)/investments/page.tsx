import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { toNumber, formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SettingsCrud } from "@/components/settings/settings-crud";
import { ImportDialog } from "@/components/import/import-dialog";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { saveInvestment, deleteInvestment } from "@/app/(app)/records/actions";

export const metadata: Metadata = { title: "Investments" };
export const dynamic = "force-dynamic";

const PAYMENT_METHODS = ["BANK_TRANSFER", "WISE", "PAYONEER", "MERCURY", "CREDIT_CARD", "CASH", "PAYPAL", "CHEQUE", "OTHER"];
const none = { value: "", label: "— none —" };
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function InvestmentsPage() {
  const [investments, partners, banks, agg] = await Promise.all([
    db.investment.findMany({ orderBy: { date: "desc" }, take: 200, include: { partner: true } }),
    db.partner.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.bankAccount.findMany({ orderBy: { name: "asc" } }),
    db.investment.aggregate({ _sum: { amountBase: true }, _count: true }),
  ]);

  const items = investments.map((x) => ({
    id: x.id,
    date: iso(x.date),
    dateLabel: formatDate(x.date, "medium"),
    partnerId: x.partnerId,
    partnerName: x.partner.name,
    amount: toNumber(x.amount),
    amountLabel: formatCurrency(x.amountBase),
    currency: x.currency,
    paymentMethod: x.paymentMethod,
    bankAccountId: x.bankAccountId ?? "",
    referenceNumber: x.referenceNumber ?? "",
    notes: x.notes ?? "",
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Investments" description="Capital contributed by each partner.">
        <ImportDialog moduleKey="investments" label="Investments" />
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Invested" value={formatCompactCurrency(toNumber(agg._sum.amountBase))} icon={TrendingUp} accent="text-emerald-500" />
        <StatCard label="Contributions" value={String(agg._count)} icon={TrendingUp} accent="text-sky-500" />
        <StatCard label="Active Partners" value={String(partners.length)} icon={TrendingUp} accent="text-violet-500" />
      </section>

      <SettingsCrud
        title="Investments"
        description="Add, edit, or remove capital contributions."
        addLabel="Add investment"
        items={items}
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "partnerId", label: "Partner", type: "select", options: partners.map((p) => ({ value: p.id, label: p.name })) },
          { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
          { name: "currency", label: "Currency", type: "text", defaultValue: "USD" },
          { name: "paymentMethod", label: "Payment method", type: "select", defaultValue: "BANK_TRANSFER", options: PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace(/_/g, " ") })) },
          { name: "bankAccountId", label: "Bank", type: "select", options: [none, ...banks.map((b) => ({ value: b.id, label: b.name }))] },
          { name: "referenceNumber", label: "Reference #", type: "text" },
          { name: "notes", label: "Notes", type: "text" },
        ]}
        columns={[
          { key: "dateLabel", label: "Date" },
          { key: "partnerName", label: "Partner" },
          { key: "paymentMethod", label: "Method", format: "badge" },
          { key: "amountLabel", label: "Amount", align: "right" },
        ]}
        saveAction={saveInvestment}
        deleteAction={deleteInvestment}
      />

      <DocumentsPanel entityType="investments" title="Investment Documents" description="Payment receipts and bank slips" />
    </div>
  );
}
