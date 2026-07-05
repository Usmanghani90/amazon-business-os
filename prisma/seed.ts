/**
 * Amazon Business OS — demo seed.
 * Reproducible (deterministic PRNG) so charts look the same on every reseed.
 * Run with:  npm run db:seed   (wraps `prisma db seed`)
 */
import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();

// -- deterministic PRNG (mulberry32) so demo data is stable ------------------
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(42);
const rand = (min: number, max: number) => min + rng() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

const DAY = 24 * 60 * 60 * 1000;
const today = new Date();
today.setHours(0, 0, 0, 0);
const daysAgo = (n: number) => new Date(today.getTime() - n * DAY);
const D = (n: number) => new Prisma.Decimal(n.toFixed(2));

async function main() {
  console.log("🌱  Seeding Amazon Business OS…");

  // Wipe (order respects FKs) -------------------------------------------------
  await db.$transaction([
    db.aiInsight.deleteMany(),
    db.notification.deleteMany(),
    db.activityLog.deleteMany(),
    db.report.deleteMany(),
    db.document.deleteMany(),
    db.adMetric.deleteMany(),
    db.sale.deleteMany(),
    db.inventorySnapshot.deleteMany(),
    db.inventory.deleteMany(),
    db.productEconomics.deleteMany(),
    db.pOPayment.deleteMany(),
    db.purchaseOrderItem.deleteMany(),
    db.purchaseOrder.deleteMany(),
    db.amazonPayout.deleteMany(),
    db.expense.deleteMany(),
    db.withdrawal.deleteMany(),
    db.investment.deleteMany(),
    db.partnerLedgerEntry.deleteMany(),
    db.bankTransaction.deleteMany(),
    db.product.deleteMany(),
    db.supplier.deleteMany(),
    db.bankAccount.deleteMany(),
    db.expenseCategory.deleteMany(),
    db.marketplace.deleteMany(),
    db.currency.deleteMany(),
    db.integration.deleteMany(),
    db.setting.deleteMany(),
    db.user.deleteMany(),
    db.partner.deleteMany(),
    db.company.deleteMany(),
  ]);

  // Company -------------------------------------------------------------------
  await db.company.create({
    data: {
      name: "Amazon Business OS",
      legalName: "FBA Ventures LLC",
      baseCurrency: "USD",
      country: "United States",
      timezone: "America/New_York",
      taxId: "88-1234567",
    },
  });

  // Currencies ----------------------------------------------------------------
  await db.currency.createMany({
    data: [
      { code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1, isBase: true },
      { code: "GBP", name: "British Pound", symbol: "£", exchangeRate: 1.27 },
      { code: "EUR", name: "Euro", symbol: "€", exchangeRate: 1.08 },
      { code: "CAD", name: "Canadian Dollar", symbol: "C$", exchangeRate: 0.73 },
      { code: "AED", name: "UAE Dirham", symbol: "د.إ", exchangeRate: 0.27 },
      { code: "PKR", name: "Pakistani Rupee", symbol: "₨", exchangeRate: 0.0036 },
    ],
  });

  // Marketplaces --------------------------------------------------------------
  const marketData = [
    { code: "US", name: "Amazon.com", countryCode: "US", currency: "USD", domain: "amazon.com" },
    { code: "UK", name: "Amazon.co.uk", countryCode: "GB", currency: "GBP", domain: "amazon.co.uk" },
    { code: "DE", name: "Amazon.de", countryCode: "DE", currency: "EUR", domain: "amazon.de" },
    { code: "CA", name: "Amazon.ca", countryCode: "CA", currency: "CAD", domain: "amazon.ca" },
  ];
  const markets = await Promise.all(
    marketData.map((m) => db.marketplace.create({ data: m })),
  );
  const usMarket = markets[0];

  // Expense categories --------------------------------------------------------
  const categoryData: { name: string; group: string; isCogs: boolean; color: string }[] = [
    { name: "Inventory Purchase", group: "COGS", isCogs: true, color: "#6366f1" },
    { name: "Shipping", group: "COGS", isCogs: true, color: "#8b5cf6" },
    { name: "Freight", group: "COGS", isCogs: true, color: "#a855f7" },
    { name: "Inspection", group: "COGS", isCogs: true, color: "#ec4899" },
    { name: "Packaging", group: "COGS", isCogs: true, color: "#f43f5e" },
    { name: "Amazon PPC", group: "Marketing", isCogs: false, color: "#f97316" },
    { name: "Amazon Fees", group: "COGS", isCogs: false, color: "#eab308" },
    { name: "Storage Fees", group: "COGS", isCogs: false, color: "#84cc16" },
    { name: "Warehouse", group: "Operating", isCogs: false, color: "#22c55e" },
    { name: "Software", group: "Operating", isCogs: false, color: "#14b8a6" },
    { name: "Trademark", group: "Admin", isCogs: false, color: "#06b6d4" },
    { name: "LLC", group: "Admin", isCogs: false, color: "#0ea5e9" },
    { name: "Photography", group: "Marketing", isCogs: false, color: "#3b82f6" },
    { name: "Video", group: "Marketing", isCogs: false, color: "#6366f1" },
    { name: "Salary", group: "Operating", isCogs: false, color: "#8b5cf6" },
    { name: "Virtual Assistants", group: "Operating", isCogs: false, color: "#7c3aed" },
    { name: "Utilities", group: "Operating", isCogs: false, color: "#a855f7" },
    { name: "Office", group: "Operating", isCogs: false, color: "#d946ef" },
    { name: "Accounting", group: "Admin", isCogs: false, color: "#c026d3" },
    { name: "Insurance", group: "Admin", isCogs: false, color: "#db2777" },
    { name: "Samples", group: "Operating", isCogs: false, color: "#f43f5e" },
    { name: "Miscellaneous", group: "Operating", isCogs: false, color: "#64748b" },
  ];
  const categories = await Promise.all(
    categoryData.map((c, i) => db.expenseCategory.create({ data: { ...c, sortOrder: i } })),
  );
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));

  // Partners ------------------------------------------------------------------
  const partnerNames = ["Tahseen", "Usman", "Ali Nisar", "Zubair"];
  const partners = await Promise.all(
    partnerNames.map((name, i) =>
      db.partner.create({
        data: {
          name,
          email: `${name.split(" ")[0].toLowerCase()}@fbaventures.com`,
          equityPct: 25,
          joinedDate: daysAgo(365 - i * 5),
        },
      }),
    ),
  );

  // Admin user ----------------------------------------------------------------
  await db.user.create({
    data: { email: "admin@fbaventures.com", name: "Operations Admin", role: "ADMIN" },
  });

  // Bank accounts -------------------------------------------------------------
  const bankData: { name: string; type: any; openingBalance: number; provider?: string }[] = [
    { name: "Business Checking", type: "BUSINESS_BANK", openingBalance: 25000, provider: "Chase" },
    { name: "Wise Multi-Currency", type: "WISE", openingBalance: 12000, provider: "Wise" },
    { name: "Payoneer", type: "PAYONEER", openingBalance: 8000, provider: "Payoneer" },
    { name: "Mercury", type: "MERCURY", openingBalance: 40000, provider: "Mercury" },
    { name: "Petty Cash", type: "CASH", openingBalance: 2000 },
  ];
  const banks = await Promise.all(
    bankData.map((b) => db.bankAccount.create({ data: { ...b, openingBalance: D(b.openingBalance) } })),
  );

  // Suppliers -----------------------------------------------------------------
  const supplierData = [
    { companyName: "Shenzhen Prime Manufacturing", country: "China", contactPerson: "Lucy Chen", email: "lucy@szprime.cn", phone: "+86 755 1234 5678", leadTimeDays: 35, paymentTerms: "30% deposit / 70% before shipping" },
    { companyName: "Guangzhou Home Goods Co.", country: "China", contactPerson: "David Wu", email: "david@gzhome.cn", phone: "+86 20 8765 4321", leadTimeDays: 28, paymentTerms: "50% / 50%" },
    { companyName: "Istanbul Textile Works", country: "Turkey", contactPerson: "Mehmet Yilmaz", email: "mehmet@istextile.tr", phone: "+90 212 555 0100", leadTimeDays: 21, paymentTerms: "Net 30" },
    { companyName: "Vietnam Pack Solutions", country: "Vietnam", contactPerson: "Anh Nguyen", email: "anh@vnpack.vn", phone: "+84 28 3822 0000", leadTimeDays: 40, paymentTerms: "40% / 60%" },
  ];
  const suppliers = await Promise.all(supplierData.map((s) => db.supplier.create({ data: s })));

  // Products ------------------------------------------------------------------
  const productDefs = [
    { name: "Bamboo Cutting Board Set", brand: "KitchenNest", category: "Kitchen", cost: 6.2, price: 34.99, fba: 5.4, launch: 300 },
    { name: "Ceramic Coffee Mug 16oz", brand: "MorningCo", category: "Kitchen", cost: 2.8, price: 18.99, fba: 4.1, launch: 260 },
    { name: "Yoga Mat Non-Slip 6mm", brand: "FlexFit", category: "Sports", cost: 7.5, price: 39.99, fba: 6.8, launch: 220 },
    { name: "LED Desk Lamp Dimmable", brand: "LumiWork", category: "Office", cost: 9.9, price: 49.99, fba: 6.2, launch: 180 },
    { name: "Stainless Water Bottle 32oz", brand: "HydroPeak", category: "Sports", cost: 4.6, price: 26.99, fba: 5.0, launch: 150 },
    { name: "Bath Towel Set Turkish Cotton", brand: "SpaLux", category: "Home", cost: 11.2, price: 54.99, fba: 8.4, launch: 120 },
    { name: "Silicone Food Storage Bags", brand: "EcoSeal", category: "Kitchen", cost: 3.4, price: 22.99, fba: 4.6, launch: 90 },
    { name: "Memory Foam Pillow", brand: "DreamRest", category: "Home", cost: 8.7, price: 44.99, fba: 7.9, launch: 60 },
  ];

  const products = [];
  for (let i = 0; i < productDefs.length; i++) {
    const p = productDefs[i];
    const supplier = suppliers[i % suppliers.length];
    const product = await db.product.create({
      data: {
        name: p.name,
        sku: `SKU-${1000 + i}`,
        asin: `B0${randInt(10, 99)}${String.fromCharCode(65 + i)}${randInt(1000, 9999)}`,
        fnsku: `X00${randInt(100000, 999999)}`,
        marketplaceId: usMarket.id,
        brand: p.brand,
        category: p.category,
        supplierId: supplier.id,
        launchDate: daysAgo(p.launch),
        status: "ACTIVE",
        costPrice: D(p.cost),
        sellingPrice: D(p.price),
        weightKg: D(rand(0.2, 1.5)),
        lengthCm: D(rand(10, 40)),
        widthCm: D(rand(8, 30)),
        heightCm: D(rand(3, 20)),
        images: [],
        economics: {
          create: {
            referralFeePct: D(15),
            fbaFee: D(p.fba),
            storageFeePerUnit: D(rand(0.2, 0.6)),
            freightPerUnit: D(rand(0.8, 2.2)),
            shippingPerUnit: D(rand(0.3, 1.0)),
            customsPerUnit: D(rand(0.2, 0.9)),
            inspectionPerUnit: D(rand(0.1, 0.4)),
            packagingPerUnit: D(rand(0.2, 0.7)),
            prepPerUnit: D(rand(0.15, 0.5)),
            labelingPerUnit: D(rand(0.05, 0.2)),
            otherLandedPerUnit: D(rand(0.0, 0.3)),
            removalPerUnit: D(rand(0.0, 0.1)),
            disposalPerUnit: D(rand(0.0, 0.08)),
            refundAdminPerUnit: D(rand(0.0, 0.15)),
            otherAmazonPerUnit: D(rand(0.0, 0.2)),
          },
        },
      },
    });

    const velocity = rand(6, 45);
    const fulfillable = randInt(200, 2500);
    await db.inventory.create({
      data: {
        productId: product.id,
        fulfillable,
        inbound: randInt(0, 1500),
        receiving: randInt(0, 400),
        reserved: randInt(10, 120),
        unfulfillable: randInt(0, 30),
        dailyVelocity: D(velocity),
        weeklyVelocity: D(velocity * 7),
        monthlyVelocity: D(velocity * 30),
        reorderPoint: Math.round(velocity * 45),
        restockQty: randInt(500, 3000),
      },
    });

    products.push({ ...product, velocity, price: p.price, cost: p.cost, fba: p.fba });
  }

  // Sales + Ads + Inventory snapshots (90 days) -------------------------------
  const salesRows: Prisma.SaleCreateManyInput[] = [];
  const adRows: Prisma.AdMetricCreateManyInput[] = [];
  const invSnaps: Prisma.InventorySnapshotCreateManyInput[] = [];

  for (const product of products) {
    let stock = 3000;
    for (let d = 89; d >= 0; d--) {
      const date = daysAgo(d);
      // seasonality + slight growth + noise
      const growth = 1 + (89 - d) * 0.004;
      const weekend = [0, 6].includes(date.getDay()) ? 1.15 : 1;
      const units = Math.max(0, Math.round(product.velocity * growth * weekend * rand(0.6, 1.4)));
      const revenue = units * product.price * rand(0.97, 1.02);
      const sessions = Math.round(units * rand(12, 28));
      const orders = Math.max(units - randInt(0, 2), 0);

      salesRows.push({
        date,
        productId: product.id,
        marketplaceId: usMarket.id,
        units,
        orders,
        revenue: D(revenue),
        sessions,
        pageViews: Math.round(sessions * rand(1.1, 1.6)),
        buyBoxPct: D(rand(88, 99)),
        refundUnits: randInt(0, Math.max(1, Math.round(units * 0.03))),
        refundAmount: D(revenue * rand(0, 0.03)),
        returnUnits: randInt(0, 2),
        promoCost: D(revenue * rand(0, 0.02)),
        couponCost: D(revenue * rand(0, 0.015)),
      });

      const impressions = Math.round(units * rand(60, 140));
      const clicks = Math.round(impressions * rand(0.004, 0.012));
      const spend = clicks * rand(0.6, 1.8);
      const adSales = spend * rand(2.5, 5.5);
      adRows.push({
        date,
        productId: product.id,
        marketplaceId: usMarket.id,
        adType: "SPONSORED_PRODUCTS",
        campaignName: `${product.brand} - Auto`,
        placement: pick(["Top of Search", "Product Pages", "Rest of Search"]),
        impressions,
        clicks,
        spend: D(spend),
        adSales: D(adSales),
        adOrders: Math.round(adSales / product.price),
        adUnits: Math.round(adSales / product.price),
      });

      stock = Math.max(0, stock - units + (d % 30 === 0 ? 2500 : 0));
      if (d % 3 === 0) {
        invSnaps.push({
          date,
          productId: product.id,
          fulfillable: stock,
          inbound: d % 30 < 15 ? randInt(0, 1500) : 0,
          reserved: randInt(10, 80),
          totalValue: D(stock * product.cost),
        });
      }
    }
  }
  await db.sale.createMany({ data: salesRows });
  await db.adMetric.createMany({ data: adRows });
  await db.inventorySnapshot.createMany({ data: invSnaps });
  console.log(`   • ${salesRows.length} sales, ${adRows.length} ad rows`);

  // Investments (initial capital) --------------------------------------------
  for (const partner of partners) {
    for (const [idx, amount] of [50000, 25000].entries()) {
      await db.investment.create({
        data: {
          date: daysAgo(360 - idx * 120),
          partnerId: partner.id,
          amount: D(amount),
          currency: "USD",
          amountBase: D(amount),
          paymentMethod: "BANK_TRANSFER",
          bankAccountId: banks[0].id,
          referenceNumber: `INV-${randInt(10000, 99999)}`,
          notes: idx === 0 ? "Initial capital contribution" : "Follow-on funding",
        },
      });
    }
  }

  // Expenses ------------------------------------------------------------------
  const expenseCatalogue: { cat: string; min: number; max: number; count: number }[] = [
    { cat: "Inventory Purchase", min: 8000, max: 30000, count: 8 },
    { cat: "Freight", min: 1500, max: 6000, count: 6 },
    { cat: "Amazon PPC", min: 2000, max: 9000, count: 10 },
    { cat: "Amazon Fees", min: 3000, max: 12000, count: 6 },
    { cat: "Inspection", min: 200, max: 800, count: 4 },
    { cat: "Packaging", min: 400, max: 2000, count: 4 },
    { cat: "Software", min: 99, max: 599, count: 6 },
    { cat: "Photography", min: 300, max: 1200, count: 3 },
    { cat: "Salary", min: 1500, max: 4000, count: 6 },
    { cat: "Virtual Assistants", min: 400, max: 1200, count: 5 },
    { cat: "Accounting", min: 300, max: 900, count: 3 },
    { cat: "Insurance", min: 200, max: 700, count: 3 },
    { cat: "Trademark", min: 250, max: 1000, count: 2 },
    { cat: "Storage Fees", min: 400, max: 1800, count: 4 },
    { cat: "Miscellaneous", min: 100, max: 900, count: 4 },
  ];
  for (const e of expenseCatalogue) {
    for (let k = 0; k < e.count; k++) {
      const amount = rand(e.min, e.max);
      const cat = catByName[e.cat];
      await db.expense.create({
        data: {
          date: daysAgo(randInt(1, 120)),
          partnerPaidId: pick(partners).id,
          categoryId: cat.id,
          amount: D(amount),
          currency: "USD",
          amountBase: D(amount),
          supplierId: cat.isCogs ? pick(suppliers).id : null,
          bankAccountId: pick(banks).id,
          paymentMethod: pick(["BANK_TRANSFER", "WISE", "CREDIT_CARD", "PAYONEER"]) as any,
          invoiceNumber: `INV-${randInt(10000, 99999)}`,
          marketplaceId: e.cat.includes("Amazon") ? usMarket.id : null,
          productId: cat.isCogs ? pick(products).id : null,
          notes: null,
        },
      });
    }
  }

  // Withdrawals ---------------------------------------------------------------
  for (const partner of partners) {
    const n = randInt(1, 3);
    for (let k = 0; k < n; k++) {
      const amount = rand(3000, 12000);
      await db.withdrawal.create({
        data: {
          date: daysAgo(randInt(5, 100)),
          partnerId: partner.id,
          amount: D(amount),
          currency: "USD",
          amountBase: D(amount),
          bankAccountId: banks[0].id,
          reason: pick(["Profit distribution", "Personal draw", "Quarterly payout"]),
        },
      });
    }
  }

  // Amazon payouts (biweekly) -------------------------------------------------
  for (let i = 0; i < 12; i++) {
    const end = daysAgo(i * 14 + 1);
    const start = daysAgo(i * 14 + 14);
    const gross = rand(28000, 65000);
    const fees = gross * rand(0.28, 0.34);
    const refunds = gross * rand(0.01, 0.04);
    const reserve = i < 2 ? gross * rand(0.05, 0.12) : 0;
    const amount = gross - fees - refunds - reserve;
    await db.amazonPayout.create({
      data: {
        marketplaceId: usMarket.id,
        settlementId: `SETTLE-${20000 + i}`,
        startDate: start,
        endDate: end,
        depositDate: i < 2 ? null : daysAgo(i * 14 - 1),
        grossSales: D(gross),
        amazonFees: D(fees),
        refunds: D(refunds),
        reserve: D(reserve),
        amount: D(amount),
        bankReceived: i < 2 ? null : D(amount),
        status: i < 2 ? "PENDING" : "COMPLETED",
        bankAccountId: banks[0].id,
      },
    });
  }

  // Purchase orders -----------------------------------------------------------
  const poStatuses = ["RECEIVED", "IN_TRANSIT", "IN_PRODUCTION", "SHIPPED", "ORDERED"] as const;
  for (let i = 0; i < 6; i++) {
    const supplier = suppliers[i % suppliers.length];
    const status = poStatuses[i % poStatuses.length];
    const items = products.slice(i % 3, (i % 3) + 2);
    const shipping = rand(800, 3000);
    const po = await db.purchaseOrder.create({
      data: {
        poNumber: `PO-${2024000 + i}`,
        supplierId: supplier.id,
        status,
        orderDate: daysAgo(randInt(20, 120)),
        expectedDelivery: daysAgo(randInt(-40, 20)),
        shippingCost: D(shipping),
        inspectionCost: D(rand(200, 600)),
        packagingCost: D(rand(300, 1200)),
        freightCost: D(rand(500, 2500)),
        items: {
          create: items.map((p) => {
            const qty = randInt(500, 3000);
            return { productId: p.id, quantity: qty, unitCost: D(p.cost), receivedQty: status === "RECEIVED" ? qty : 0 };
          }),
        },
      },
      include: { items: true },
    });
    const total = po.items.reduce((s, it) => s + Number(it.unitCost) * it.quantity, 0) + shipping;
    // one or two payments
    await db.pOPayment.create({
      data: { purchaseOrderId: po.id, date: po.orderDate, amount: D(total * 0.3), bankAccountId: banks[0].id, notes: "Deposit" },
    });
    if (status === "RECEIVED" || status === "IN_TRANSIT") {
      await db.pOPayment.create({
        data: { purchaseOrderId: po.id, date: daysAgo(randInt(5, 40)), amount: D(total * 0.7), bankAccountId: banks[0].id, notes: "Balance" },
      });
    }
  }

  // Partner ledger (derived running balances) ---------------------------------
  for (const partner of partners) {
    const invs = await db.investment.findMany({ where: { partnerId: partner.id } });
    const wds = await db.withdrawal.findMany({ where: { partnerId: partner.id } });
    const exps = await db.expense.findMany({ where: { partnerPaidId: partner.id } });
    const entries = [
      ...invs.map((x) => ({ date: x.date, type: "INVESTMENT" as const, amount: Number(x.amountBase), refType: "Investment", refId: x.id })),
      ...exps.map((x) => ({ date: x.date, type: "EXPENSE_PAID" as const, amount: Number(x.amountBase), refType: "Expense", refId: x.id })),
      ...wds.map((x) => ({ date: x.date, type: "WITHDRAWAL" as const, amount: -Number(x.amountBase), refType: "Withdrawal", refId: x.id })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
    let balance = 0;
    for (const e of entries) {
      balance += e.amount;
      await db.partnerLedgerEntry.create({
        data: { partnerId: partner.id, date: e.date, type: e.type, amount: D(e.amount), balance: D(balance), refType: e.refType, refId: e.refId },
      });
    }
  }

  // Notifications -------------------------------------------------------------
  await db.notification.createMany({
    data: [
      { type: "LOW_INVENTORY", severity: "WARNING", title: "Low inventory alert", message: "Silicone Food Storage Bags will stock out in 12 days at current velocity." },
      { type: "AMAZON_PAYOUT_RECEIVED", severity: "SUCCESS", title: "Payout received", message: "Settlement SETTLE-20009 of $38,420 deposited to Business Checking." },
      { type: "LARGE_EXPENSE", severity: "INFO", title: "Large expense logged", message: "Inventory Purchase of $28,500 recorded by Tahseen." },
      { type: "PURCHASE_ORDER_ARRIVAL", severity: "INFO", title: "PO arriving soon", message: "PO-2024003 from Shenzhen Prime is expected within 5 days." },
      { type: "PARTNER_WITHDRAWAL", severity: "INFO", title: "Withdrawal processed", message: "Usman withdrew $8,000 as profit distribution." },
    ],
  });

  // Integrations (architecture-ready placeholders) ----------------------------
  await db.integration.createMany({
    data: [
      { provider: "AMAZON_SP_API", status: "DISCONNECTED" },
      { provider: "AMAZON_ADS_API", status: "DISCONNECTED" },
      { provider: "HELIUM10", status: "DISCONNECTED" },
      { provider: "KEEPA", status: "DISCONNECTED" },
      { provider: "WISE", status: "DISCONNECTED" },
      { provider: "SLACK", status: "DISCONNECTED" },
    ],
  });

  // Settings ------------------------------------------------------------------
  await db.setting.createMany({
    data: [
      { key: "notifications", value: { lowInventory: true, payoutReceived: true, largeExpenseThreshold: 5000 } },
      { key: "profit.opexAllocationPct", value: 8 },
    ],
  });

  console.log("✅  Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
