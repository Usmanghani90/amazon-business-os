# Amazon Business OS

An enterprise operating system for a multi-partner Amazon FBA business — finance,
partner accounting, inventory, profitability (CM1/CM2/CM3), advertising, suppliers,
purchase orders, and executive reporting.

Built to the quality bar of Stripe Dashboard, Ramp, Linear, and Notion.

---

## Tech stack

| Layer        | Choice                                                           |
| ------------ | ---------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, RSC) · React 19 · TypeScript             |
| Styling / UI | Tailwind CSS v4 · shadcn/ui (base-nova) · Framer Motion · Lucide |
| Data viz     | Recharts                                                         |
| Forms        | React Hook Form · Zod                                            |
| Tables       | TanStack Table                                                   |
| ORM / DB     | Prisma 6 · PostgreSQL                                            |
| Auth         | Clerk (scaffolded; demo mode runs without keys)                 |
| Storage      | AWS S3 (receipts & documents)                                   |
| Deploy       | Vercel-ready                                                     |

> **Local database with zero setup.** Development uses `embedded-postgres` — a real
> PostgreSQL 18 server that runs from `node_modules`, no Docker or admin rights needed.
> Data lives in `./.pgdata`.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the local Postgres server (keep this terminal running)
npm run db:start

# 3. In a second terminal: apply schema + seed demo data
npm run db:migrate      # applies migrations
npm run db:seed         # ~90 days of sales/ads + partners, expenses, POs, payouts…

# 4. Run the app
npm run dev             # http://localhost:3000  → redirects to /dashboard
```

If the embedded Postgres ports ever change, they're printed by `npm run db:start`;
update `DATABASE_URL` in `.env` to match.

### Scripts

| Script               | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Next.js dev server                          |
| `npm run build`      | Production build (type-checked)             |
| `npm run db:start`   | Start local embedded PostgreSQL (port 5433) |
| `npm run db:migrate` | `prisma migrate dev`                        |
| `npm run db:seed`    | Seed reproducible demo data                 |
| `npm run db:studio`  | Prisma Studio (visual DB browser)           |
| `npm run db:reset`   | Drop, re-migrate, and re-seed               |

---

## Architecture

```
src/
├─ app/
│  ├─ (app)/                 # authenticated shell (sidebar + topbar)
│  │  ├─ layout.tsx          # SidebarProvider + Topbar (force-dynamic)
│  │  ├─ dashboard/          # ✅ Executive dashboard (fully built)
│  │  └─ <module>/           # partners, expenses, inventory, … (data-ready stubs)
│  ├─ layout.tsx             # root: fonts, ThemeProvider, Toaster
│  └─ page.tsx               # → redirects to /dashboard
├─ components/
│  ├─ ui/                    # shadcn/ui primitives (base-nova, base-ui powered)
│  ├─ charts/                # reusable Recharts wrappers (Area/Line/Bar/Donut)
│  ├─ layout/                # app-sidebar, topbar, notifications, user-menu
│  └─ stat-card, page-header, empty-state, module-stub, command-palette, …
└─ lib/
   ├─ db.ts                  # Prisma singleton
   ├─ finance.ts             # CM1/CM2/CM3, margins, ACOS/TACOS/ROAS, break-even
   ├─ format.ts              # currency / number / date formatters (client-safe)
   ├─ nav.ts                 # sidebar + command-palette navigation config
   └─ dashboard-data.ts      # server-side KPI + chart aggregation
prisma/
├─ schema.prisma            # 30+ normalized models covering every module
├─ migrations/              # committed SQL migrations
└─ seed.ts                  # deterministic demo seed
```

### Data model (Prisma)

Normalized schema with proper relations and indexes across:

- **Org & access** — Company, User (roles: Admin/Partner/Accountant/Manager/Viewer), Partner
- **Reference** — Currency, Marketplace, ExpenseCategory, Setting
- **Capital** — Investment, Withdrawal, PartnerLedgerEntry
- **Finance** — Expense, BankAccount, BankTransaction, AmazonPayout
- **Catalog / supply** — Product, ProductEconomics, Inventory, InventorySnapshot,
  Supplier, PurchaseOrder, PurchaseOrderItem, POPayment, Document
- **Analytics** — Sale (daily), AdMetric (daily)
- **Platform** — Notification, Report, ActivityLog
- **Future-ready** — `Integration` (SP-API, Ads API, Helium10, Keepa, Wise…) and
  `AiInsight` (profit recs, forecasting, anomaly detection) tables are already modeled.

### Profitability convention

```
Revenue
  − COGS (landed: product + freight + inspection + packaging)     → CM1
  − Amazon fees (referral + FBA + storage) − refunds/returns       → CM2
  − Advertising (PPC) − promotions − coupons                       → CM3
  − allocated operating overhead                                   → Net Profit
```

Implemented in `src/lib/finance.ts` and aggregated in `src/lib/dashboard-data.ts`.

---

## What's built vs. roadmap

**✅ Foundation (this milestone)**

- Full Next.js + Tailwind + shadcn scaffold, dark/light theme, responsive shell
- Collapsible sidebar, command palette (⌘K), notifications, toasts
- Complete Prisma schema + migration + reproducible seed
- **Executive dashboard**: 23 KPI cards (sales windows, revenue, gross/net profit,
  margin, CM1–3, balances, inventory value, PPC, ACOS/TACOS/ROAS) + 8 charts
  (daily sales & ad spend, profit, inventory, payouts, expenses, cash flow, expense
  mix) + recent-activity feeds — all from live aggregated data
- Every module route resolves (data-ready placeholders)

**⏭️ Next iterations (schema + seed already in place)**

Per-module UIs: Partners (ledgers/statements), Investments, Withdrawals, Expenses,
Banking, Amazon Payouts, Products, Inventory, Suppliers, Purchase Orders, Sales,
Profitability, Advertising, Reports (PDF/Excel/CSV), Settings — plus Clerk auth
enforcement, S3 receipt uploads, and the Amazon SP-API / Ads API sync jobs.

---

## Authentication

Clerk is installed and env-wired but **not enforced**, so the app runs immediately in
demo mode. To enable: add your Clerk keys to `.env`, wrap the root layout in
`<ClerkProvider>`, add `middleware.ts`, and gate the `(app)` segment.

## Deployment

Vercel-ready. Set `DATABASE_URL` to a managed Postgres (Neon / Supabase / RDS), add
Clerk + AWS keys, and run `prisma migrate deploy` on release.
