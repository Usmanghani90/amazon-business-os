import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { computeProfit, computeAdMetrics, percentChange } from "@/lib/finance";

const DAY = 24 * 60 * 60 * 1000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
const daysAgo = (n: number) => new Date(startOfToday().getTime() - n * DAY);

function dayLabel(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}
function monthKey(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(d);
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData() {
  const today = startOfToday();
  const yesterday = daysAgo(1);
  const last7 = daysAgo(7);
  const last30 = daysAgo(30);
  const prev30 = daysAgo(60);

  const [
    products,
    salesByProduct,
    adTotals,
    adPrev30,
    ad30,
    totalsAll,
    sales30,
    salesPrev30,
    salesToday,
    salesYesterday,
    sales7,
    expenseAgg,
    expensesByCategory,
    investmentAgg,
    withdrawalAgg,
    pendingPayouts,
    banks,
    inventories,
    // chart series
    salesDailyRaw,
    adsDailyRaw,
    expensesDailyRaw,
    invSnapsRaw,
    payouts,
    investmentsList,
    withdrawalsList,
    recentExpenses,
    recentInvestments,
    recentWithdrawals,
    recentPayouts,
  ] = await Promise.all([
    db.product.findMany({ include: { economics: true, inventory: true } }),
    db.sale.groupBy({
      by: ["productId"],
      _sum: { units: true, revenue: true, refundAmount: true, promoCost: true, couponCost: true },
    }),
    db.adMetric.aggregate({ _sum: { spend: true, adSales: true, clicks: true, impressions: true, adOrders: true } }),
    db.adMetric.aggregate({ _sum: { spend: true, adSales: true }, where: { date: { gte: prev30, lt: last30 } } }),
    db.adMetric.aggregate({ _sum: { spend: true, adSales: true }, where: { date: { gte: last30 } } }),
    db.sale.aggregate({ _sum: { revenue: true, units: true, orders: true } }),
    db.sale.aggregate({ _sum: { revenue: true, units: true }, where: { date: { gte: last30 } } }),
    db.sale.aggregate({ _sum: { revenue: true }, where: { date: { gte: prev30, lt: last30 } } }),
    db.sale.aggregate({ _sum: { revenue: true, units: true }, where: { date: { gte: today } } }),
    db.sale.aggregate({ _sum: { revenue: true, units: true }, where: { date: { gte: yesterday, lt: today } } }),
    db.sale.aggregate({ _sum: { revenue: true, units: true }, where: { date: { gte: last7 } } }),
    db.expense.aggregate({ _sum: { amountBase: true } }),
    db.expense.groupBy({ by: ["categoryId"], _sum: { amountBase: true } }),
    db.investment.aggregate({ _sum: { amountBase: true } }),
    db.withdrawal.aggregate({ _sum: { amountBase: true } }),
    db.amazonPayout.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    db.bankAccount.findMany(),
    db.inventory.findMany({ include: { product: true } }),
    db.sale.groupBy({ by: ["date"], _sum: { revenue: true, units: true }, where: { date: { gte: last30 } }, orderBy: { date: "asc" } }),
    db.adMetric.groupBy({ by: ["date"], _sum: { spend: true, adSales: true }, where: { date: { gte: last30 } }, orderBy: { date: "asc" } }),
    db.expense.groupBy({ by: ["date"], _sum: { amountBase: true }, where: { date: { gte: last30 } }, orderBy: { date: "asc" } }),
    db.inventorySnapshot.groupBy({ by: ["date"], _sum: { totalValue: true }, where: { date: { gte: last30 } }, orderBy: { date: "asc" } }),
    db.amazonPayout.findMany({ orderBy: { endDate: "asc" } }),
    db.investment.findMany(),
    db.withdrawal.findMany(),
    db.expense.findMany({ take: 6, orderBy: { date: "desc" }, include: { category: true, partnerPaid: true } }),
    db.investment.findMany({ take: 6, orderBy: { date: "desc" }, include: { partner: true } }),
    db.withdrawal.findMany({ take: 6, orderBy: { date: "desc" }, include: { partner: true } }),
    db.amazonPayout.findMany({ take: 6, orderBy: { endDate: "desc" }, include: { marketplace: true } }),
  ]);

  // ---- Profitability (lifetime, sales-derived) ----------------------------
  const econById = new Map(products.map((p) => [p.id, p]));
  let cogs = 0,
    referralFee = 0,
    fbaFee = 0,
    storageFee = 0,
    refundCost = 0,
    promoCost = 0,
    couponCost = 0;

  for (const row of salesByProduct) {
    const p = econById.get(row.productId);
    if (!p) continue;
    const units = toNumber(row._sum.units);
    const revenue = toNumber(row._sum.revenue);
    const e = p.economics;
    const landedUnit =
      toNumber(p.costPrice) +
      toNumber(e?.freightPerUnit) +
      toNumber(e?.inspectionPerUnit) +
      toNumber(e?.packagingPerUnit);
    cogs += units * landedUnit;
    referralFee += revenue * (toNumber(e?.referralFeePct ?? 15) / 100);
    fbaFee += units * toNumber(e?.fbaFee);
    storageFee += units * toNumber(e?.storageFeePerUnit);
    refundCost += toNumber(row._sum.refundAmount);
    promoCost += toNumber(row._sum.promoCost);
    couponCost += toNumber(row._sum.couponCost);
  }

  const revenue = toNumber(totalsAll._sum.revenue);
  const ppcSpend = toNumber(adTotals._sum.spend);
  const adSales = toNumber(adTotals._sum.adSales);

  // Overhead = non-COGS expense categories excluding PPC/fees already modelled.
  const catMeta = await db.expenseCategory.findMany();
  const catById = new Map(catMeta.map((c) => [c.id, c]));
  const modelledNames = new Set(["Amazon PPC", "Amazon Fees", "Storage Fees", "Inventory Purchase", "Freight", "Inspection", "Packaging"]);
  let overhead = 0;
  const expenseCategoryChart: { name: string; value: number; color?: string }[] = [];
  for (const row of expensesByCategory) {
    const c = catById.get(row.categoryId);
    const amt = toNumber(row._sum.amountBase);
    if (c) {
      expenseCategoryChart.push({ name: c.name, value: amt, color: c.color ?? undefined });
      if (!modelledNames.has(c.name)) overhead += amt;
    }
  }
  expenseCategoryChart.sort((a, b) => b.value - a.value);

  const profit = computeProfit({
    revenue,
    cogs,
    referralFee,
    fbaFee,
    storageFee,
    refundCost,
    returnCost: 0,
    ppcSpend,
    promoCost,
    couponCost,
    operatingExpenses: overhead,
  });

  const ads = computeAdMetrics({
    impressions: toNumber(adTotals._sum.impressions),
    clicks: toNumber(adTotals._sum.clicks),
    spend: ppcSpend,
    adSales,
    adOrders: toNumber(adTotals._sum.adOrders),
    totalRevenue: revenue,
  });

  // ---- Balances -----------------------------------------------------------
  const totalInvestments = toNumber(investmentAgg._sum.amountBase);
  const totalWithdrawals = toNumber(withdrawalAgg._sum.amountBase);
  const totalExpenses = toNumber(expenseAgg._sum.amountBase);
  const payoutsReceived = payouts
    .filter((p) => p.status !== "PENDING")
    .reduce((s, p) => s + toNumber(p.bankReceived ?? p.amount), 0);
  const openingCash = banks.reduce((s, b) => s + toNumber(b.openingBalance), 0);
  const cashBalance = toNumber(banks.find((b) => b.type === "CASH")?.openingBalance);
  const bankBalance = openingCash + totalInvestments + payoutsReceived - totalExpenses - totalWithdrawals;
  const inventoryValue = inventories.reduce(
    (s, i) => s + i.fulfillable * toNumber(i.product.costPrice),
    0,
  );
  const amazonPending = toNumber(pendingPayouts._sum.amount);

  // ---- Sales windows + deltas ---------------------------------------------
  const rev30 = toNumber(sales30._sum.revenue);
  const revPrev30 = toNumber(salesPrev30._sum.revenue);
  const spend30 = toNumber(ad30._sum.spend);
  const spendPrev30 = toNumber(adPrev30._sum.spend);

  // ---- Chart series (zero-filled 30-day) ----------------------------------
  const salesMap = new Map(salesDailyRaw.map((r) => [r.date.getTime(), r._sum]));
  const adsMap = new Map(adsDailyRaw.map((r) => [r.date.getTime(), r._sum]));
  const expMap = new Map(expensesDailyRaw.map((r) => [r.date.getTime(), toNumber(r._sum.amountBase)]));
  const invMap = new Map(invSnapsRaw.map((r) => [r.date.getTime(), toNumber(r._sum.totalValue)]));

  const cogsPct = revenue > 0 ? cogs / revenue : 0;
  const feePct = revenue > 0 ? (referralFee + fbaFee + storageFee) / revenue : 0;

  const salesTrend: { date: string; revenue: number; units: number; profit: number; adSpend: number }[] = [];
  let lastInv = 0;
  const inventoryTrend: { date: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i);
    const t = d.getTime();
    const s = salesMap.get(t);
    const a = adsMap.get(t);
    const rev = toNumber(s?.revenue);
    const spend = toNumber(a?.spend);
    const promo = 0;
    const dayProfit = rev * (1 - cogsPct - feePct) - spend - promo;
    salesTrend.push({
      date: dayLabel(d),
      revenue: Math.round(rev),
      units: toNumber(s?.units),
      adSpend: Math.round(spend),
      profit: Math.round(dayProfit),
    });
    if (invMap.has(t)) lastInv = invMap.get(t)!;
    inventoryTrend.push({ date: dayLabel(d), value: Math.round(lastInv) });
  }

  const expenseTrend: { date: string; expenses: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i);
    expenseTrend.push({ date: dayLabel(d), expenses: Math.round(expMap.get(d.getTime()) ?? 0) });
  }

  // Payout trend (per settlement)
  const payoutTrend = payouts.map((p) => ({
    date: dayLabel(p.endDate),
    amount: Math.round(toNumber(p.amount)),
    fees: Math.round(toNumber(p.amazonFees)),
  }));

  // Cash flow by month
  const cashMap = new Map<string, { month: string; investments: number; withdrawals: number; payouts: number }>();
  const ensure = (d: Date) => {
    const k = monthKey(d);
    if (!cashMap.has(k)) cashMap.set(k, { month: k, investments: 0, withdrawals: 0, payouts: 0 });
    return cashMap.get(k)!;
  };
  for (const inv of investmentsList) ensure(inv.date).investments += toNumber(inv.amountBase);
  for (const w of withdrawalsList) ensure(w.date).withdrawals += toNumber(w.amountBase);
  for (const p of payouts) if (p.depositDate) ensure(p.depositDate).payouts += toNumber(p.amount);
  const cashFlow = Array.from(cashMap.values()).map((r) => ({
    month: r.month,
    investments: Math.round(r.investments),
    withdrawals: Math.round(r.withdrawals),
    payouts: Math.round(r.payouts),
  }));

  return {
    kpis: {
      salesToday: toNumber(salesToday._sum.revenue),
      salesYesterday: toNumber(salesYesterday._sum.revenue),
      sales7: toNumber(sales7._sum.revenue),
      sales30: rev30,
      totalRevenue: revenue,
      grossProfit: profit.grossProfit,
      netProfit: profit.netProfit,
      profitMargin: profit.netMargin,
      cm1: profit.cm1,
      cm2: profit.cm2,
      cm3: profit.cm3,
      amazonBalance: amazonPending,
      bankBalance,
      cashBalance,
      inventoryValue,
      totalInvestments,
      totalExpenses,
      totalWithdrawals,
      amazonPending,
      ppcSpend,
      acos: ads.acos,
      tacos: ads.tacos,
      roas: ads.roas,
    },
    deltas: {
      sales30: percentChange(rev30, revPrev30),
      ppc30: percentChange(spend30, spendPrev30),
    },
    charts: {
      salesTrend,
      expenseTrend,
      inventoryTrend,
      payoutTrend,
      cashFlow,
      expenseByCategory: expenseCategoryChart.slice(0, 8),
    },
    recent: {
      expenses: recentExpenses.map((e) => ({
        id: e.id,
        label: e.category.name,
        sub: e.partnerPaid?.name ?? "—",
        amount: toNumber(e.amountBase),
        date: e.date,
      })),
      investments: recentInvestments.map((i) => ({
        id: i.id,
        label: i.partner.name,
        sub: i.paymentMethod.replace(/_/g, " "),
        amount: toNumber(i.amountBase),
        date: i.date,
      })),
      withdrawals: recentWithdrawals.map((w) => ({
        id: w.id,
        label: w.partner.name,
        sub: w.reason ?? "Withdrawal",
        amount: toNumber(w.amountBase),
        date: w.date,
      })),
      payouts: recentPayouts.map((p) => ({
        id: p.id,
        label: p.marketplace.name,
        sub: p.status,
        amount: toNumber(p.amount),
        date: p.endDate,
      })),
    },
  };
}
