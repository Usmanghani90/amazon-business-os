import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { computeWaterfall, computeAdMetrics, type WaterfallResult } from "@/lib/finance";

/** Expense categories that are NOT operating overhead (already modelled elsewhere). */
const NON_OPERATING = new Set([
  "Amazon PPC",
  "Amazon Fees",
  "Storage Fees",
  "Inventory Purchase",
  "Freight",
  "Inspection",
  "Packaging",
]);

export interface SkuProfit {
  productId: string;
  name: string;
  sku: string;
  asin: string | null;
  marketplace: string | null;
  status: string;
  sellingPrice: number;
  revenue: number;
  unitsSold: number;
  avgSellingPrice: number;
  landingCost: number;
  amazonFees: number;
  advertising: number;
  refundsPromotions: number;
  operatingCost: number;
  cm1: number;
  cm2: number;
  cm3: number;
  cm4: number;
  netProfit: number;
  netMargin: number;
  acos: number;
  tacos: number;
  roas: number;
  inventoryRemaining: number;
  daysOfInventory: number | null;
  waterfall: WaterfallResult;
}

export interface ProfitabilityFilters {
  marketplaceId?: string;
  productId?: string;
  from?: Date;
  to?: Date;
}

export interface ProfitabilityResult {
  rows: SkuProfit[];
  business: WaterfallResult;
  adBreakdown: { name: string; value: number }[];
  totals: {
    revenue: number;
    unitsSold: number;
    landingCost: number;
    amazonFees: number;
    advertising: number;
    refundsPromotions: number;
    operatingExpenses: number;
  };
}

const AD_TYPE_LABEL: Record<string, string> = {
  SPONSORED_PRODUCTS: "Sponsored Products",
  SPONSORED_BRANDS: "Sponsored Brands",
  SPONSORED_DISPLAY: "Sponsored Display",
  DSP: "DSP",
};

export async function getProfitability(
  filters: ProfitabilityFilters = {},
): Promise<ProfitabilityResult> {
  const dateWhere =
    filters.from || filters.to
      ? { date: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
      : {};

  const productWhere = {
    ...(filters.marketplaceId ? { marketplaceId: filters.marketplaceId } : {}),
    ...(filters.productId ? { id: filters.productId } : {}),
  };

  const [products, salesByProduct, adsByProduct, adsByType, operatingExpenses] = await Promise.all([
    db.product.findMany({
      where: productWhere,
      include: { economics: true, inventory: true, marketplace: true },
    }),
    db.sale.groupBy({
      by: ["productId"],
      where: { ...dateWhere, ...(filters.marketplaceId ? { marketplaceId: filters.marketplaceId } : {}) },
      _sum: { units: true, revenue: true, refundAmount: true, promoCost: true, couponCost: true },
    }),
    db.adMetric.groupBy({
      by: ["productId"],
      where: { ...dateWhere, ...(filters.marketplaceId ? { marketplaceId: filters.marketplaceId } : {}) },
      _sum: { spend: true, adSales: true, impressions: true, clicks: true, adOrders: true },
    }),
    db.adMetric.groupBy({
      by: ["adType"],
      where: { ...dateWhere, ...(filters.marketplaceId ? { marketplaceId: filters.marketplaceId } : {}) },
      _sum: { spend: true },
    }),
    db.expense.findMany({
      where: dateWhere,
      select: { amountBase: true, category: { select: { name: true, isCogs: true } } },
    }),
  ]);

  const salesMap = new Map(salesByProduct.map((s) => [s.productId, s._sum]));
  const adsMap = new Map(adsByProduct.map((a) => [a.productId, a._sum]));

  // Total operating overhead over the window (allocated to SKUs by revenue share).
  const operatingTotal = operatingExpenses
    .filter((e) => !e.category.isCogs && !NON_OPERATING.has(e.category.name))
    .reduce((s, e) => s + toNumber(e.amountBase), 0);

  const totalRevenue = salesByProduct.reduce((s, r) => s + toNumber(r._sum.revenue), 0);

  const rows: SkuProfit[] = [];
  for (const p of products) {
    const s = salesMap.get(p.id);
    const a = adsMap.get(p.id);
    const e = p.economics;

    const unitsSold = toNumber(s?.units);
    const revenue = toNumber(s?.revenue);
    const landedUnit =
      toNumber(p.costPrice) +
      toNumber(e?.freightPerUnit) +
      toNumber(e?.shippingPerUnit) +
      toNumber(e?.customsPerUnit) +
      toNumber(e?.inspectionPerUnit) +
      toNumber(e?.packagingPerUnit) +
      toNumber(e?.prepPerUnit) +
      toNumber(e?.labelingPerUnit) +
      toNumber(e?.otherLandedPerUnit) +
      toNumber(e?.miscPerUnit);
    const landingCost = unitsSold * landedUnit;

    const amazonFees =
      revenue * (toNumber(e?.referralFeePct ?? 15) / 100) +
      unitsSold *
        (toNumber(e?.fbaFee) +
          toNumber(e?.storageFeePerUnit) +
          toNumber(e?.removalPerUnit) +
          toNumber(e?.disposalPerUnit) +
          toNumber(e?.refundAdminPerUnit) +
          toNumber(e?.otherAmazonPerUnit));

    const advertising = toNumber(a?.spend);
    const adSales = toNumber(a?.adSales);
    const refundsPromotions =
      toNumber(s?.refundAmount) + toNumber(s?.promoCost) + toNumber(s?.couponCost);
    const operatingCost = totalRevenue > 0 ? operatingTotal * (revenue / totalRevenue) : 0;

    const waterfall = computeWaterfall({
      revenue,
      landingCost,
      amazonFees,
      advertising,
      refundsPromotions,
      operatingExpenses: operatingCost,
    });

    const ad = computeAdMetrics({
      impressions: toNumber(a?.impressions),
      clicks: toNumber(a?.clicks),
      spend: advertising,
      adSales,
      adOrders: toNumber(a?.adOrders),
      totalRevenue: revenue,
    });

    const dailyVelocity = toNumber(p.inventory?.dailyVelocity);
    const inventoryRemaining = toNumber(p.inventory?.fulfillable);

    rows.push({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      asin: p.asin,
      marketplace: p.marketplace?.code ?? null,
      status: p.status,
      sellingPrice: toNumber(p.sellingPrice),
      revenue,
      unitsSold,
      avgSellingPrice: unitsSold > 0 ? revenue / unitsSold : toNumber(p.sellingPrice),
      landingCost,
      amazonFees,
      advertising,
      refundsPromotions,
      operatingCost,
      cm1: waterfall.cm1,
      cm2: waterfall.cm2,
      cm3: waterfall.cm3,
      cm4: waterfall.cm4,
      netProfit: waterfall.netProfit,
      netMargin: waterfall.netMargin,
      acos: ad.acos,
      tacos: ad.tacos,
      roas: ad.roas,
      inventoryRemaining,
      daysOfInventory: dailyVelocity > 0 ? Math.round(inventoryRemaining / dailyVelocity) : null,
      waterfall,
    });
  }

  rows.sort((a, b) => b.revenue - a.revenue);

  // Business-level aggregation across the filtered SKUs.
  const totals = rows.reduce(
    (acc, r) => {
      acc.revenue += r.revenue;
      acc.unitsSold += r.unitsSold;
      acc.landingCost += r.landingCost;
      acc.amazonFees += r.amazonFees;
      acc.advertising += r.advertising;
      acc.refundsPromotions += r.refundsPromotions;
      acc.operatingExpenses += r.operatingCost;
      return acc;
    },
    { revenue: 0, unitsSold: 0, landingCost: 0, amazonFees: 0, advertising: 0, refundsPromotions: 0, operatingExpenses: 0 },
  );

  const business = computeWaterfall(totals);

  const adBreakdown = adsByType
    .map((a) => ({ name: AD_TYPE_LABEL[a.adType] ?? a.adType, value: toNumber(a._sum.spend) }))
    .filter((a) => a.value > 0);

  return { rows, business, adBreakdown, totals };
}
