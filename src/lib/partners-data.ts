import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { getProfitability } from "@/lib/profitability";

/** Names seeded on a fresh install — deleting these warns the user. */
export const DEFAULT_PARTNER_NAMES = ["Tahseen", "Usman", "Ali Nisar", "Zubair"];

export interface PartnerStats {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  equityPct: number;
  active: boolean;
  joinedDate: Date;
  isDefault: boolean;
  investment: number;
  expensesPaid: number;
  withdrawals: number;
  currentBalance: number;
  profitShare: number;
  settlementBalance: number;
  txnCount: number;
}

export async function getPartnersWithStats(): Promise<PartnerStats[]> {
  const [partners, invByPartner, expByPartner, wdByPartner, profitability] = await Promise.all([
    db.partner.findMany({ orderBy: [{ active: "desc" }, { joinedDate: "asc" }] }),
    db.investment.groupBy({ by: ["partnerId"], _sum: { amountBase: true }, _count: true }),
    db.expense.groupBy({ by: ["partnerPaidId"], _sum: { amountBase: true }, _count: true }),
    db.withdrawal.groupBy({ by: ["partnerId"], _sum: { amountBase: true }, _count: true }),
    getProfitability(),
  ]);

  const invMap = new Map(invByPartner.map((r) => [r.partnerId, r]));
  const expMap = new Map(expByPartner.map((r) => [r.partnerPaidId, r]));
  const wdMap = new Map(wdByPartner.map((r) => [r.partnerId, r]));
  const netProfit = profitability.business.netProfit;

  return partners.map((p) => {
    const investment = toNumber(invMap.get(p.id)?._sum.amountBase);
    const expensesPaid = toNumber(expMap.get(p.id)?._sum.amountBase);
    const withdrawals = toNumber(wdMap.get(p.id)?._sum.amountBase);
    const equityPct = toNumber(p.equityPct);
    const currentBalance = investment + expensesPaid - withdrawals;
    const profitShare = (equityPct / 100) * netProfit;
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      equityPct,
      active: p.active,
      joinedDate: p.joinedDate,
      isDefault: DEFAULT_PARTNER_NAMES.includes(p.name),
      investment,
      expensesPaid,
      withdrawals,
      currentBalance,
      profitShare,
      settlementBalance: currentBalance + profitShare,
      txnCount:
        (invMap.get(p.id)?._count ?? 0) +
        (expMap.get(p.id)?._count ?? 0) +
        (wdMap.get(p.id)?._count ?? 0),
    };
  });
}

export async function getPartnerDetail(id: string) {
  const partner = await db.partner.findUnique({ where: { id } });
  if (!partner) return null;

  const [investments, expenses, withdrawals, ledger, profitability] = await Promise.all([
    db.investment.findMany({ where: { partnerId: id }, orderBy: { date: "desc" }, include: { bankAccount: true } }),
    db.expense.findMany({ where: { partnerPaidId: id }, orderBy: { date: "desc" }, include: { category: true } }),
    db.withdrawal.findMany({ where: { partnerId: id }, orderBy: { date: "desc" }, include: { bankAccount: true } }),
    db.partnerLedgerEntry.findMany({ where: { partnerId: id }, orderBy: { date: "asc" } }),
    getProfitability(),
  ]);

  const investment = investments.reduce((s, x) => s + toNumber(x.amountBase), 0);
  const expensesPaid = expenses.reduce((s, x) => s + toNumber(x.amountBase), 0);
  const withdrawalTotal = withdrawals.reduce((s, x) => s + toNumber(x.amountBase), 0);
  const equityPct = toNumber(partner.equityPct);
  const currentBalance = investment + expensesPaid - withdrawalTotal;
  const profitShare = (equityPct / 100) * profitability.business.netProfit;

  // Unified transaction history (newest first)
  const transactions = [
    ...investments.map((x) => ({ id: x.id, date: x.date, type: "Investment", detail: x.referenceNumber ?? x.notes ?? "Capital contribution", amount: toNumber(x.amountBase) })),
    ...expenses.map((x) => ({ id: x.id, date: x.date, type: "Expense Paid", detail: x.category.name, amount: toNumber(x.amountBase) })),
    ...withdrawals.map((x) => ({ id: x.id, date: x.date, type: "Withdrawal", detail: x.reason ?? "Withdrawal", amount: -toNumber(x.amountBase) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    partner: {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      equityPct,
      active: partner.active,
      joinedDate: partner.joinedDate,
      notes: partner.notes,
      isDefault: DEFAULT_PARTNER_NAMES.includes(partner.name),
    },
    stats: {
      investment,
      expensesPaid,
      withdrawals: withdrawalTotal,
      currentBalance,
      profitShare,
      settlementBalance: currentBalance + profitShare,
    },
    ledger: ledger.map((e) => ({
      id: e.id,
      date: e.date,
      type: e.type,
      amount: toNumber(e.amount),
      balance: toNumber(e.balance),
      notes: e.notes,
    })),
    transactions,
  };
}
