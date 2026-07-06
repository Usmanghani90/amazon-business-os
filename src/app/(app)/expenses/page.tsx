import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { toNumber, formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SettingsCrud } from "@/components/settings/settings-crud";
import { ImportDialog } from "@/components/import/import-dialog";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { saveExpense, deleteExpense } from "@/app/(app)/records/actions";

export const metadata: Metadata = { title: "Expenses" };
export const dynamic = "force-dynamic";

const PAYMENT_METHODS = ["BANK_TRANSFER", "WISE", "PAYONEER", "MERCURY", "CREDIT_CARD", "CASH", "PAYPAL", "CHEQUE", "OTHER"];
const none = { value: "", label: "— none —" };
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function ExpensesPage() {
  const [expenses, categories, partners, suppliers, banks, markets, agg, monthAgg] = await Promise.all([
    db.expense.findMany({ orderBy: { date: "desc" }, take: 200, include: { category: true, partnerPaid: true } }),
    db.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    db.partner.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ orderBy: { companyName: "asc" } }),
    db.bankAccount.findMany({ orderBy: { name: "asc" } }),
    db.marketplace.findMany({ orderBy: { code: "asc" } }),
    db.expense.aggregate({ _sum: { amountBase: true }, _count: true }),
    db.expense.aggregate({ _sum: { amountBase: true }, where: { date: { gte: new Date(Date.now() - 30 * 86400000) } } }),
  ]);

  const items = expenses.map((e) => ({
    id: e.id,
    date: iso(e.date),
    dateLabel: formatDate(e.date, "medium"),
    categoryId: e.categoryId,
    categoryName: e.category.name,
    partnerId: e.partnerPaidId ?? "",
    partnerName: e.partnerPaid?.name ?? "—",
    supplierId: e.supplierId ?? "",
    bankAccountId: e.bankAccountId ?? "",
    marketplaceId: e.marketplaceId ?? "",
    amount: toNumber(e.amount),
    amountLabel: formatCurrency(e.amountBase),
    currency: e.currency,
    paymentMethod: e.paymentMethod,
    invoiceNumber: e.invoiceNumber ?? "",
    notes: e.notes ?? "",
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Track every cost across categories, partners, and suppliers.">
        <ImportDialog moduleKey="expenses" label="Expenses" />
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Expenses" value={formatCompactCurrency(toNumber(agg._sum.amountBase))} icon={Receipt} accent="text-rose-500" />
        <StatCard label="Last 30 Days" value={formatCompactCurrency(toNumber(monthAgg._sum.amountBase))} icon={Receipt} accent="text-amber-500" />
        <StatCard label="Records" value={String(agg._count)} icon={Receipt} accent="text-sky-500" />
      </section>

      <SettingsCrud
        title="Expenses"
        description="Add, edit, or remove expenses."
        addLabel="Add expense"
        items={items}
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          { name: "categoryId", label: "Category", type: "select", options: categories.map((c) => ({ value: c.id, label: c.name })) },
          { name: "amount", label: "Amount", type: "number", step: "0.01", required: true },
          { name: "currency", label: "Currency", type: "text", defaultValue: "USD" },
          { name: "partnerId", label: "Partner paid", type: "select", options: [none, ...partners.map((p) => ({ value: p.id, label: p.name }))] },
          { name: "supplierId", label: "Supplier", type: "select", options: [none, ...suppliers.map((s) => ({ value: s.id, label: s.companyName }))] },
          { name: "bankAccountId", label: "Bank", type: "select", options: [none, ...banks.map((b) => ({ value: b.id, label: b.name }))] },
          { name: "marketplaceId", label: "Marketplace", type: "select", options: [none, ...markets.map((m) => ({ value: m.id, label: m.code }))] },
          { name: "paymentMethod", label: "Payment method", type: "select", defaultValue: "BANK_TRANSFER", options: PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace(/_/g, " ") })) },
          { name: "invoiceNumber", label: "Invoice #", type: "text" },
          { name: "notes", label: "Notes", type: "text" },
        ]}
        columns={[
          { key: "dateLabel", label: "Date" },
          { key: "categoryName", label: "Category" },
          { key: "partnerName", label: "Partner" },
          { key: "amountLabel", label: "Amount", align: "right" },
        ]}
        saveAction={saveExpense}
        deleteAction={deleteExpense}
      />

      <DocumentsPanel entityType="expenses" title="Expense Documents" description="Receipts, invoices, and PDFs" />
    </div>
  );
}
