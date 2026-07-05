/**
 * Financial engine — profitability (CM1/CM2/CM3), margins, and advertising math.
 *
 * Contribution-margin convention used across Amazon Business OS:
 *   Revenue
 *   − COGS (landed unit cost: product + freight + inspection + packaging)      → CM1
 *   − Amazon fees (referral + FBA + storage) − refunds/returns                 → CM2
 *   − Advertising (PPC) − promotions − coupons                                 → CM3
 *   − allocated operating expenses (software, salary, utilities, …)            → Net Profit
 */

export interface ProfitInputs {
  revenue: number;
  cogs: number; // landed product cost
  referralFee: number;
  fbaFee: number;
  storageFee: number;
  refundCost: number;
  returnCost: number;
  ppcSpend: number;
  promoCost: number;
  couponCost: number;
  operatingExpenses?: number; // overhead allocated to this scope
}

export interface ProfitResult {
  revenue: number;
  cogs: number;
  amazonFees: number;
  cm1: number;
  cm2: number;
  cm3: number;
  grossProfit: number;
  netProfit: number;
  cm1Margin: number;
  cm2Margin: number;
  cm3Margin: number;
  grossMargin: number;
  netMargin: number;
  contributionMargin: number;
  roi: number;
  breakEvenAcos: number;
  breakEvenRoas: number;
}

const pct = (part: number, whole: number) => (whole === 0 ? 0 : (part / whole) * 100);

export function computeProfit(i: ProfitInputs): ProfitResult {
  const amazonFees = i.referralFee + i.fbaFee + i.storageFee;
  const refundReturn = i.refundCost + i.returnCost;
  const adPromo = i.ppcSpend + i.promoCost + i.couponCost;
  const opex = i.operatingExpenses ?? 0;

  const cm1 = i.revenue - i.cogs;
  const cm2 = cm1 - amazonFees - refundReturn;
  const cm3 = cm2 - adPromo;

  const grossProfit = cm1 - amazonFees; // revenue less product + platform variable cost
  const netProfit = cm3 - opex;

  // Break-even ACOS = share of revenue available to spend on ads before losing money.
  const marginBeforeAds = cm2;
  const breakEvenAcos = pct(marginBeforeAds, i.revenue);

  return {
    revenue: i.revenue,
    cogs: i.cogs,
    amazonFees,
    cm1,
    cm2,
    cm3,
    grossProfit,
    netProfit,
    cm1Margin: pct(cm1, i.revenue),
    cm2Margin: pct(cm2, i.revenue),
    cm3Margin: pct(cm3, i.revenue),
    grossMargin: pct(grossProfit, i.revenue),
    netMargin: pct(netProfit, i.revenue),
    contributionMargin: pct(cm3, i.revenue),
    roi: i.cogs === 0 ? 0 : pct(netProfit, i.cogs),
    breakEvenAcos,
    breakEvenRoas: breakEvenAcos === 0 ? 0 : 100 / breakEvenAcos,
  };
}

// ---------------------------------------------------------------------------
// Titan Network layered Contribution Margin waterfall (CM1 → CM4 → Net Profit)
//
//   Revenue
//     − Landing Cost (mfg + freight + shipping + customs + inspection +
//                     packaging + prep + labeling + other)          → CM1
//     − Amazon Fees (referral + FBA + storage + removal + disposal +
//                    refund admin + other)                          → CM2
//     − Advertising (SP + SB + SD + DSP)                            → CM3
//     − Refunds & Promotions (refunds + returns + coupons + promos) → CM4
//     − Operating Expenses (software, salary, VA, warehouse, …)     → Net Profit
// ---------------------------------------------------------------------------

export interface WaterfallInputs {
  revenue: number;
  landingCost: number;
  amazonFees: number;
  advertising: number;
  refundsPromotions: number;
  operatingExpenses: number;
}

export type WaterfallStepType = "total" | "cost" | "subtotal";

export interface WaterfallStep {
  key: string;
  label: string;
  /** Signed value: revenue/subtotals positive, cost layers negative. */
  value: number;
  type: WaterfallStepType;
}

export interface WaterfallResult extends WaterfallInputs {
  cm1: number;
  cm2: number;
  cm3: number;
  cm4: number;
  netProfit: number;
  cm1Margin: number;
  cm2Margin: number;
  cm3Margin: number;
  cm4Margin: number;
  netMargin: number;
  steps: WaterfallStep[];
}

export function computeWaterfall(i: WaterfallInputs): WaterfallResult {
  const cm1 = i.revenue - i.landingCost;
  const cm2 = cm1 - i.amazonFees;
  const cm3 = cm2 - i.advertising;
  const cm4 = cm3 - i.refundsPromotions;
  const netProfit = cm4 - i.operatingExpenses;

  const steps: WaterfallStep[] = [
    { key: "revenue", label: "Revenue", value: i.revenue, type: "total" },
    { key: "landingCost", label: "Landing Cost", value: -i.landingCost, type: "cost" },
    { key: "cm1", label: "CM1", value: cm1, type: "subtotal" },
    { key: "amazonFees", label: "Amazon Fees", value: -i.amazonFees, type: "cost" },
    { key: "cm2", label: "CM2", value: cm2, type: "subtotal" },
    { key: "advertising", label: "Advertising", value: -i.advertising, type: "cost" },
    { key: "cm3", label: "CM3", value: cm3, type: "subtotal" },
    { key: "refundsPromotions", label: "Refunds & Promos", value: -i.refundsPromotions, type: "cost" },
    { key: "cm4", label: "CM4", value: cm4, type: "subtotal" },
    { key: "operatingExpenses", label: "Operating Exp.", value: -i.operatingExpenses, type: "cost" },
    { key: "netProfit", label: "Net Profit", value: netProfit, type: "total" },
  ];

  return {
    ...i,
    cm1,
    cm2,
    cm3,
    cm4,
    netProfit,
    cm1Margin: pct(cm1, i.revenue),
    cm2Margin: pct(cm2, i.revenue),
    cm3Margin: pct(cm3, i.revenue),
    cm4Margin: pct(cm4, i.revenue),
    netMargin: pct(netProfit, i.revenue),
    steps,
  };
}

// ---------------------------------------------------------------------------
// Advertising metrics
// ---------------------------------------------------------------------------

export interface AdInputs {
  impressions: number;
  clicks: number;
  spend: number;
  adSales: number;
  adOrders: number;
  totalRevenue: number; // for TACOS
}

export interface AdResult {
  ctr: number;
  cpc: number;
  cvr: number;
  acos: number;
  tacos: number;
  roas: number;
}

export function computeAdMetrics(a: AdInputs): AdResult {
  return {
    ctr: pct(a.clicks, a.impressions),
    cpc: a.clicks === 0 ? 0 : a.spend / a.clicks,
    cvr: pct(a.adOrders, a.clicks),
    acos: pct(a.spend, a.adSales),
    tacos: pct(a.spend, a.totalRevenue),
    roas: a.spend === 0 ? 0 : a.adSales / a.spend,
  };
}

// ---------------------------------------------------------------------------
// Inventory health
// ---------------------------------------------------------------------------

export function daysOfCover(available: number, dailyVelocity: number) {
  if (dailyVelocity <= 0) return available > 0 ? Infinity : 0;
  return Math.round(available / dailyVelocity);
}

/** 0–100 score blending days-of-cover against target coverage. */
export function inventoryHealthScore(available: number, dailyVelocity: number, targetDays = 60) {
  const doc = daysOfCover(available, dailyVelocity);
  if (doc === Infinity) return available > 0 ? 60 : 0; // no sales, stock sitting
  if (doc <= 0) return 0;
  const ratio = doc / targetDays;
  // Ideal window ~0.75–1.5× target. Penalise both stockout risk and overstock.
  if (ratio < 1) return Math.round(Math.max(10, ratio * 100));
  if (ratio <= 1.5) return 100;
  return Math.round(Math.max(40, 100 - (ratio - 1.5) * 40));
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}
