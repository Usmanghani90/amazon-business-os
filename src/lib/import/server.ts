import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { MODULES, type ColumnDef, type ModuleDef } from "@/lib/import/registry";

export interface PreviewRow {
  index: number;
  status: "valid" | "error" | "duplicate";
  data: Record<string, string>;
  errors: string[];
}

export interface PreviewResult {
  module: string;
  label: string;
  columns: ColumnDef[];
  rows: PreviewRow[];
  counts: { total: number; valid: number; error: number; duplicate: number };
}

export interface CommitResult {
  ok: boolean;
  inserted: number;
  skipped: number;
  errors: string[];
  message: string;
}

// ---------------------------------------------------------------------------
// Parsing & coercion
// ---------------------------------------------------------------------------

function parseFile(base64: string): Record<string, string>[] {
  const buf = Buffer.from(base64.split(",").pop() ?? base64, "base64");
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
}

function coerceRow(def: ModuleDef, raw: Record<string, string>) {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const col of def.columns) {
    const s = (raw[col.header] ?? "").toString().trim();
    if (!s) {
      if (col.required) errors.push(`${col.header} is required`);
      data[col.field] = null;
      continue;
    }
    if (col.type === "number") {
      const n = Number(s.replace(/[,$]/g, ""));
      if (Number.isNaN(n)) errors.push(`${col.header} must be a number`);
      else data[col.field] = n;
    } else if (col.type === "date") {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) errors.push(`${col.header} must be a valid date`);
      else data[col.field] = d;
    } else if (col.type === "enum") {
      const up = s.toUpperCase().replace(/\s+/g, "_");
      if (col.enumValues && !col.enumValues.includes(up)) errors.push(`${col.header} must be one of: ${col.enumValues.join(", ")}`);
      else data[col.field] = up;
    } else {
      data[col.field] = s;
    }
  }
  return { data, errors };
}

// ---------------------------------------------------------------------------
// Per-module handlers (FK resolution, dedup, insert)
// ---------------------------------------------------------------------------

interface Handler {
  buildContext(): Promise<Record<string, Map<string, string>>>;
  mapRow(data: Record<string, unknown>, ctx: Record<string, Map<string, string>>):
    | { ok: true; record: Record<string, unknown>; key: string }
    | { ok: false; error: string };
  existingKeys(): Promise<Set<string>>;
  insert(records: Record<string, unknown>[]): Promise<void>;
}

const lc = (s: unknown) => String(s ?? "").toLowerCase().trim();
const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? ""));

async function nameMap(rows: { id: string; name: string | null }[]) {
  return new Map(rows.filter((r) => r.name).map((r) => [lc(r.name), r.id]));
}

const HANDLERS: Record<string, Handler> = {
  expenses: {
    async buildContext() {
      const [cats, partners, suppliers, banks, markets] = await Promise.all([
        db.expenseCategory.findMany({ select: { id: true, name: true } }),
        db.partner.findMany({ select: { id: true, name: true } }),
        db.supplier.findMany({ select: { id: true, companyName: true } }),
        db.bankAccount.findMany({ select: { id: true, name: true } }),
        db.marketplace.findMany({ select: { id: true, code: true } }),
      ]);
      return {
        categories: await nameMap(cats),
        partners: await nameMap(partners),
        suppliers: new Map(suppliers.map((s) => [lc(s.companyName), s.id])),
        banks: await nameMap(banks),
        markets: new Map(markets.map((m) => [lc(m.code), m.id])),
      };
    },
    mapRow(d, ctx) {
      const categoryId = ctx.categories.get(lc(d.category));
      if (!categoryId) return { ok: false, error: `Unknown category "${d.category}"` };
      const record = {
        date: d.date,
        amount: d.amount,
        amountBase: d.amount,
        currency: (d.currency as string) || "USD",
        categoryId,
        partnerPaidId: d.partner ? ctx.partners.get(lc(d.partner)) ?? null : null,
        supplierId: d.supplier ? ctx.suppliers.get(lc(d.supplier)) ?? null : null,
        bankAccountId: d.bank ? ctx.banks.get(lc(d.bank)) ?? null : null,
        marketplaceId: d.marketplace ? ctx.markets.get(lc(d.marketplace)) ?? null : null,
        paymentMethod: (d.paymentMethod as string) || "BANK_TRANSFER",
        invoiceNumber: (d.invoiceNumber as string) || null,
        notes: (d.notes as string) || null,
      };
      return { ok: true, record, key: `${iso(d.date)}|${d.amount}|${categoryId}|${record.partnerPaidId ?? ""}` };
    },
    async existingKeys() {
      const rows = await db.expense.findMany({ select: { date: true, amount: true, categoryId: true, partnerPaidId: true } });
      return new Set(rows.map((r) => `${iso(r.date)}|${Number(r.amount)}|${r.categoryId}|${r.partnerPaidId ?? ""}`));
    },
    async insert(records) {
      await db.expense.createMany({ data: records as never });
    },
  },

  investments: {
    async buildContext() {
      const [partners, banks] = await Promise.all([
        db.partner.findMany({ select: { id: true, name: true } }),
        db.bankAccount.findMany({ select: { id: true, name: true } }),
      ]);
      return { partners: await nameMap(partners), banks: await nameMap(banks) };
    },
    mapRow(d, ctx) {
      const partnerId = ctx.partners.get(lc(d.partner));
      if (!partnerId) return { ok: false, error: `Unknown partner "${d.partner}"` };
      const record = {
        date: d.date,
        partnerId,
        amount: d.amount,
        amountBase: d.amount,
        currency: (d.currency as string) || "USD",
        paymentMethod: (d.paymentMethod as string) || "BANK_TRANSFER",
        bankAccountId: d.bank ? ctx.banks.get(lc(d.bank)) ?? null : null,
        referenceNumber: (d.referenceNumber as string) || null,
        notes: (d.notes as string) || null,
      };
      return { ok: true, record, key: `${iso(d.date)}|${partnerId}|${d.amount}|${record.referenceNumber ?? ""}` };
    },
    async existingKeys() {
      const rows = await db.investment.findMany({ select: { date: true, partnerId: true, amount: true, referenceNumber: true } });
      return new Set(rows.map((r) => `${iso(r.date)}|${r.partnerId}|${Number(r.amount)}|${r.referenceNumber ?? ""}`));
    },
    async insert(records) {
      await db.investment.createMany({ data: records as never });
    },
  },

  withdrawals: {
    async buildContext() {
      const [partners, banks] = await Promise.all([
        db.partner.findMany({ select: { id: true, name: true } }),
        db.bankAccount.findMany({ select: { id: true, name: true } }),
      ]);
      return { partners: await nameMap(partners), banks: await nameMap(banks) };
    },
    mapRow(d, ctx) {
      const partnerId = ctx.partners.get(lc(d.partner));
      if (!partnerId) return { ok: false, error: `Unknown partner "${d.partner}"` };
      const record = {
        date: d.date,
        partnerId,
        amount: d.amount,
        amountBase: d.amount,
        currency: (d.currency as string) || "USD",
        bankAccountId: d.bank ? ctx.banks.get(lc(d.bank)) ?? null : null,
        reason: (d.reason as string) || null,
        notes: (d.notes as string) || null,
      };
      return { ok: true, record, key: `${iso(d.date)}|${partnerId}|${d.amount}` };
    },
    async existingKeys() {
      const rows = await db.withdrawal.findMany({ select: { date: true, partnerId: true, amount: true } });
      return new Set(rows.map((r) => `${iso(r.date)}|${r.partnerId}|${Number(r.amount)}`));
    },
    async insert(records) {
      await db.withdrawal.createMany({ data: records as never });
    },
  },

  suppliers: {
    async buildContext() {
      return {};
    },
    mapRow(d) {
      const record = {
        companyName: d.companyName,
        country: (d.country as string) || null,
        contactPerson: (d.contactPerson as string) || null,
        phone: (d.phone as string) || null,
        email: (d.email as string) || null,
        leadTimeDays: d.leadTimeDays != null ? Math.round(Number(d.leadTimeDays)) : null,
        paymentTerms: (d.paymentTerms as string) || null,
        notes: (d.notes as string) || null,
      };
      return { ok: true, record, key: lc(d.companyName) };
    },
    async existingKeys() {
      const rows = await db.supplier.findMany({ select: { companyName: true } });
      return new Set(rows.map((r) => lc(r.companyName)));
    },
    async insert(records) {
      await db.supplier.createMany({ data: records as never });
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function previewImport(moduleKey: string, base64: string): Promise<PreviewResult> {
  const def = MODULES[moduleKey];
  if (!def) throw new Error("Unknown module");
  const handler = HANDLERS[moduleKey];
  const raws = parseFile(base64);
  const [ctx, existing] = handler ? await Promise.all([handler.buildContext(), handler.existingKeys()]) : [{}, new Set<string>()];

  const seen = new Set<string>();
  const rows: PreviewRow[] = raws.map((raw, i) => {
    const { data, errors } = coerceRow(def, raw);
    if (errors.length) return { index: i + 2, status: "error", data: raw, errors };
    if (handler) {
      const mapped = handler.mapRow(data, ctx);
      if (!mapped.ok) return { index: i + 2, status: "error", data: raw, errors: [mapped.error] };
      if (existing.has(mapped.key) || seen.has(mapped.key))
        return { index: i + 2, status: "duplicate", data: raw, errors: ["Duplicate of an existing record"] };
      seen.add(mapped.key);
    }
    return { index: i + 2, status: "valid", data: raw, errors: [] };
  });

  const counts = {
    total: rows.length,
    valid: rows.filter((r) => r.status === "valid").length,
    error: rows.filter((r) => r.status === "error").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
  };
  return { module: moduleKey, label: def.label, columns: def.columns, rows, counts };
}

export async function commitImport(moduleKey: string, base64: string): Promise<CommitResult> {
  const def = MODULES[moduleKey];
  const handler = HANDLERS[moduleKey];
  if (!def || !handler) return { ok: false, inserted: 0, skipped: 0, errors: ["Import not supported for this module yet"], message: "Not supported" };

  const raws = parseFile(base64);
  const [ctx, existing] = await Promise.all([handler.buildContext(), handler.existingKeys()]);
  const seen = new Set<string>();
  const records: Record<string, unknown>[] = [];
  const errors: string[] = [];
  let skipped = 0;

  raws.forEach((raw, i) => {
    const { data, errors: cErr } = coerceRow(def, raw);
    if (cErr.length) {
      errors.push(`Row ${i + 2}: ${cErr.join("; ")}`);
      return;
    }
    const mapped = handler.mapRow(data, ctx);
    if (!mapped.ok) {
      errors.push(`Row ${i + 2}: ${mapped.error}`);
      return;
    }
    if (existing.has(mapped.key) || seen.has(mapped.key)) {
      skipped++;
      return;
    }
    seen.add(mapped.key);
    records.push(mapped.record);
  });

  if (records.length === 0) {
    return { ok: false, inserted: 0, skipped, errors, message: "Nothing to import — all rows were invalid or duplicates." };
  }

  try {
    // Rollback-on-failure: a single createMany is atomic; wrap for safety.
    await db.$transaction(async () => {
      await handler.insert(records);
    });
  } catch (e) {
    return { ok: false, inserted: 0, skipped, errors: [...errors, e instanceof Error ? e.message : "Insert failed"], message: "Import failed — no rows were saved (rolled back)." };
  }

  return {
    ok: true,
    inserted: records.length,
    skipped,
    errors,
    message: `Imported ${records.length} record${records.length === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : ""}.`,
  };
}

export function buildTemplate(moduleKey: string): Buffer {
  const def = MODULES[moduleKey];
  if (!def) throw new Error("Unknown module");
  const headers = def.columns.map((c) => c.header);
  const example = def.columns.map((c) => c.example);
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = def.columns.map((c) => ({ wch: Math.max(c.header.length + 2, 14) }));

  const notes = [
    ["Column", "Required", "Type", "Notes"],
    ...def.columns.map((c) => [c.header, c.required ? "Yes" : "No", c.type, c.note ?? ""]),
  ];
  const wsNotes = XLSX.utils.aoa_to_sheet(notes);
  wsNotes["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 44 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, def.label.slice(0, 28));
  XLSX.utils.book_append_sheet(wb, wsNotes, "Instructions");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
