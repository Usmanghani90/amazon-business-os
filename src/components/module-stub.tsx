import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ModuleStubMeta {
  title: string;
  description: string;
  planned: string[];
}

/**
 * Consistent placeholder for modules whose data model is fully seeded but whose
 * dedicated UI ships in a later iteration. Keeps navigation working end-to-end.
 */
export function ModuleStub({ meta, action }: { meta: ModuleStubMeta; action?: React.ReactNode }) {
  return (
    <>
      <PageHeader title={meta.title} description={meta.description}>
        {action}
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> In roadmap
        </Badge>
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            The database, relations, and seed data for this module are already in place. The
            dedicated interface will include:
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {meta.planned.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

export const MODULE_META: Record<string, ModuleStubMeta> = {
  partners: {
    title: "Partners & Capital",
    description: "Per-partner dashboards, ledgers, equity, and settlement statements.",
    planned: ["Partner dashboards", "Capital ledger", "Equity %", "Profit share", "Settlement balance", "Generate statement (PDF)"],
  },
  investments: {
    title: "Investments",
    description: "Track every capital contribution across partners and accounts.",
    planned: ["Investment entry form", "Investment by partner", "Timeline chart", "Receipt uploads", "Current equity roll-up"],
  },
  withdrawals: {
    title: "Withdrawals",
    description: "Partner drawdowns and profit distributions.",
    planned: ["Withdrawal form", "Withdrawals by partner", "History table", "Outstanding balance"],
  },
  expenses: {
    title: "Expenses",
    description: "Complete expense tracking across 19 categories.",
    planned: ["Expense form + validation", "Expense by category", "Expense by partner", "Monthly trend", "Largest expenses", "Receipt uploads"],
  },
  banking: {
    title: "Banking",
    description: "Multi-account cash management: bank, Wise, Payoneer, Mercury, cash.",
    planned: ["Account balances", "Money in / out", "Transfers", "Per-account ledger", "Reconciliation"],
  },
  payouts: {
    title: "Amazon Payouts",
    description: "Settlement tracking from Amazon to your bank.",
    planned: ["Settlement records", "Pending vs completed", "Monthly payout chart", "Average settlement", "Fee & reserve breakdown"],
  },
  products: {
    title: "Products",
    description: "Catalog with SKU, ASIN, FNSKU, cost, price, and dimensions.",
    planned: ["Product table", "Product detail", "Images", "Status pipeline", "Cost/price editor"],
  },
  inventory: {
    title: "Inventory",
    description: "Per-SKU stock health, velocity, and restock forecasting.",
    planned: ["Stock levels", "Days of cover", "Stockout date", "Restock alerts", "Health score", "Forecast"],
  },
  suppliers: {
    title: "Suppliers",
    description: "Supplier profiles, terms, balances, and documents.",
    planned: ["Supplier profile", "Lead time & terms", "Outstanding balance", "Purchase history", "Documents"],
  },
  "purchase-orders": {
    title: "Purchase Orders",
    description: "POs with landed-cost breakdown and payment tracking.",
    planned: ["PO builder", "Line items", "Landed cost", "Status pipeline", "Payments made", "Outstanding balance"],
  },
  sales: {
    title: "Sales",
    description: "Amazon performance: revenue, units, sessions, conversion, buy box.",
    planned: ["Revenue & units", "Conversion rate", "Refund/return %", "Marketplace comparison", "Top & bottom products"],
  },
  profitability: {
    title: "Profitability",
    description: "Per-product CM1 / CM2 / CM3, margins, ROI, and break-even.",
    planned: ["Fee waterfall", "CM1/CM2/CM3", "Contribution margin", "ROI", "Break-even ACOS/ROAS"],
  },
  advertising: {
    title: "Advertising",
    description: "PPC performance: ACOS, TACOS, ROAS, campaigns, keywords.",
    planned: ["Spend vs sales", "ACOS / TACOS / ROAS", "Campaign performance", "Placement & keyword", "Daily/monthly spend"],
  },
  reports: {
    title: "Reports",
    description: "Financial statements and exports (PDF / Excel / CSV).",
    planned: ["Partner statement", "Income statement", "Balance sheet", "Cash flow", "P&L", "Exports"],
  },
  integrations: {
    title: "Integrations",
    description: "Amazon SP-API, Ads API, and future connectors.",
    planned: ["Amazon SP-API", "Amazon Ads API", "Helium10 / Keepa", "Wise / Payoneer", "Slack / Gmail / Sheets"],
  },
  settings: {
    title: "Settings",
    description: "Company, partners, categories, currencies, banks, and users.",
    planned: ["Company info", "Partners & equity", "Expense categories", "Currencies & FX", "Marketplaces", "Users & roles"],
  },
};
