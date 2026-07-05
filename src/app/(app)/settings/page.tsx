import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getPartnersWithStats } from "@/lib/partners-data";
import { toNumber, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyForm } from "@/components/settings/company-form";
import { SettingsCrud } from "@/components/settings/settings-crud";
import { PartnerFormDialog } from "@/components/partners/partner-form-dialog";
import { DeletePartnerDialog } from "@/components/partners/delete-partner-dialog";
import {
  saveCategory,
  deleteCategory,
  saveCurrency,
  deleteCurrency,
  saveMarketplace,
  deleteMarketplace,
  saveUser,
  deleteUser,
} from "@/app/(app)/settings/actions";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const activeBadge = (v: unknown) =>
  v ? (
    <Badge className="bg-emerald-500/15 text-[10px] text-emerald-600 dark:text-emerald-400">Active</Badge>
  ) : (
    <Badge variant="outline" className="text-[10px]">Inactive</Badge>
  );

export default async function SettingsPage() {
  const [company, partners, categories, currencies, marketplaces, users] = await Promise.all([
    db.company.findFirst(),
    getPartnersWithStats(),
    db.expenseCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.currency.findMany({ orderBy: { isBase: "desc" } }),
    db.marketplace.findMany({ orderBy: { code: "asc" } }),
    db.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your company, partners, categories, currencies, marketplaces, and users." />

      <Tabs defaultValue="company">
        <TabsList className="flex-wrap">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <CompanyForm
            company={{
              name: company?.name,
              legalName: company?.legalName,
              baseCurrency: company?.baseCurrency,
              country: company?.country,
              taxId: company?.taxId,
              timezone: company?.timezone,
              fiscalYearStart: company?.fiscalYearStart,
              address: company?.address,
            }}
          />
        </TabsContent>

        <TabsContent value="partners" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">Partners & Equity</CardTitle>
                <CardDescription>Ownership split and partner details.</CardDescription>
              </div>
              <PartnerFormDialog />
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Equity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatPercent(p.equityPct)}</TableCell>
                        <TableCell>{activeBadge(p.active)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            <PartnerFormDialog partner={{ id: p.id, name: p.name, email: p.email, phone: p.phone, equityPct: p.equityPct, joinedDate: p.joinedDate, active: p.active }} />
                            <DeletePartnerDialog id={p.id} name={p.name} isDefault={p.isDefault} hasHistory={p.txnCount > 0} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <SettingsCrud
            title="Expense Categories"
            description="Categories used across expenses and profitability."
            addLabel="Add category"
            items={categories.map((c) => ({ id: c.id, name: c.name, group: c.group, color: c.color ?? "#6366f1", isCogs: c.isCogs, active: c.active }))}
            fields={[
              { name: "name", label: "Name", type: "text", required: true },
              { name: "group", label: "Group", type: "select", defaultValue: "Operating", options: ["COGS", "Operating", "Marketing", "Admin"].map((g) => ({ value: g, label: g })) },
              { name: "color", label: "Colour", type: "color", defaultValue: "#6366f1" },
              { name: "isCogs", label: "Counts as COGS", type: "checkbox" },
              { name: "active", label: "Active", type: "checkbox", defaultValue: true },
            ]}
            columns={[
              { key: "name", label: "Name", format: "colorName", colorKey: "color" },
              { key: "group", label: "Group" },
              { key: "isCogs", label: "COGS", format: "yesno" },
              { key: "active", label: "Status", format: "active" },
            ]}
            saveAction={saveCategory}
            deleteAction={deleteCategory}
          />
        </TabsContent>

        <TabsContent value="currencies" className="mt-4">
          <SettingsCrud
            title="Currencies & FX"
            description="Exchange rates are relative to your base currency."
            addLabel="Add currency"
            items={currencies.map((c) => ({ id: c.id, code: c.code, name: c.name, symbol: c.symbol, exchangeRate: toNumber(c.exchangeRate), isBase: c.isBase, active: c.active }))}
            fields={[
              { name: "code", label: "Code (ISO)", type: "text", required: true, placeholder: "GBP" },
              { name: "name", label: "Name", type: "text" },
              { name: "symbol", label: "Symbol", type: "text", placeholder: "£" },
              { name: "exchangeRate", label: "Exchange rate (→ base)", type: "number", step: "0.000001", defaultValue: 1 },
              { name: "isBase", label: "Base currency", type: "checkbox" },
              { name: "active", label: "Active", type: "checkbox", defaultValue: true },
            ]}
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Name" },
              { key: "symbol", label: "Symbol" },
              { key: "exchangeRate", label: "Rate", align: "right" },
              { key: "isBase", label: "Base", format: "yesno" },
            ]}
            saveAction={saveCurrency}
            deleteAction={deleteCurrency}
          />
        </TabsContent>

        <TabsContent value="marketplaces" className="mt-4">
          <SettingsCrud
            title="Marketplaces"
            description="Amazon marketplaces you sell in."
            addLabel="Add marketplace"
            items={marketplaces.map((m) => ({ id: m.id, code: m.code, name: m.name, countryCode: m.countryCode, currency: m.currency, domain: m.domain ?? "", active: m.active }))}
            fields={[
              { name: "code", label: "Code", type: "text", required: true, placeholder: "US" },
              { name: "name", label: "Name", type: "text", placeholder: "Amazon.com" },
              { name: "countryCode", label: "Country code", type: "text", placeholder: "US" },
              { name: "currency", label: "Currency", type: "text", placeholder: "USD" },
              { name: "domain", label: "Domain", type: "text", placeholder: "amazon.com" },
              { name: "active", label: "Active", type: "checkbox", defaultValue: true },
            ]}
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Name" },
              { key: "countryCode", label: "Country" },
              { key: "currency", label: "Currency" },
              { key: "active", label: "Status", format: "active" },
            ]}
            saveAction={saveMarketplace}
            deleteAction={deleteMarketplace}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <SettingsCrud
            title="Users & Roles"
            description="Who can access the workspace and at what permission level."
            addLabel="Add user"
            items={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active }))}
            fields={[
              { name: "name", label: "Name", type: "text", required: true },
              { name: "email", label: "Email", type: "text", required: true },
              { name: "role", label: "Role", type: "select", defaultValue: "VIEWER", options: ["ADMIN", "PARTNER", "ACCOUNTANT", "MANAGER", "VIEWER"].map((r) => ({ value: r, label: r[0] + r.slice(1).toLowerCase() })) },
              { name: "active", label: "Active", type: "checkbox", defaultValue: true },
            ]}
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role", format: "badge" },
              { key: "active", label: "Status", format: "active" },
            ]}
            saveAction={saveUser}
            deleteAction={deleteUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
