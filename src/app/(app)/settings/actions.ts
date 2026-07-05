"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type FormState = { ok: boolean; message?: string };

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());
const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true" || v === "1";
const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/[,$]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const done = (paths: string[], message: string): FormState => {
  paths.forEach((p) => revalidatePath(p));
  return { ok: true, message };
};
const friendlyError = (e: unknown, fallback: string): FormState => {
  const msg = e instanceof Error ? e.message : "";
  if (msg.includes("Foreign key") || msg.includes("violates") || msg.includes("still referenced"))
    return { ok: false, message: "Can't delete — this record is in use elsewhere. Deactivate it instead." };
  if (msg.includes("Unique") || msg.includes("unique")) return { ok: false, message: "That code/name already exists." };
  return { ok: false, message: fallback };
};

// --- Company ----------------------------------------------------------------
export async function updateCompany(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd.get("name"));
  if (!name) return { ok: false, message: "Company name is required." };
  try {
    const existing = await db.company.findFirst();
    const data = {
      name,
      legalName: str(fd.get("legalName")) || null,
      baseCurrency: str(fd.get("baseCurrency")) || "USD",
      country: str(fd.get("country")) || null,
      taxId: str(fd.get("taxId")) || null,
      timezone: str(fd.get("timezone")) || "UTC",
      fiscalYearStart: Math.min(12, Math.max(1, num(fd.get("fiscalYearStart")) || 1)),
      address: str(fd.get("address")) || null,
    };
    if (existing) await db.company.update({ where: { id: existing.id }, data });
    else await db.company.create({ data });
    return done(["/settings", "/dashboard"], "Company details saved.");
  } catch (e) {
    return friendlyError(e, "Could not save company details.");
  }
}

// --- Expense categories -----------------------------------------------------
export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd.get("id"));
  const name = str(fd.get("name"));
  if (!name) return { ok: false, message: "Name is required." };
  const data = {
    name,
    group: str(fd.get("group")) || "Operating",
    color: str(fd.get("color")) || null,
    isCogs: bool(fd.get("isCogs")),
    active: fd.get("active") == null ? true : bool(fd.get("active")),
  };
  try {
    if (id) await db.expenseCategory.update({ where: { id }, data });
    else await db.expenseCategory.create({ data });
    return done(["/settings", "/expenses"], "Category saved.");
  } catch (e) {
    return friendlyError(e, "Could not save category.");
  }
}
export async function deleteCategory(id: string): Promise<FormState> {
  try {
    await db.expenseCategory.delete({ where: { id } });
    return done(["/settings"], "Category deleted.");
  } catch (e) {
    return friendlyError(e, "Could not delete category.");
  }
}

// --- Currencies -------------------------------------------------------------
export async function saveCurrency(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd.get("id"));
  const code = str(fd.get("code")).toUpperCase();
  if (!code) return { ok: false, message: "Currency code is required." };
  const data = {
    code,
    name: str(fd.get("name")) || code,
    symbol: str(fd.get("symbol")) || code,
    exchangeRate: num(fd.get("exchangeRate")) || 1,
    isBase: bool(fd.get("isBase")),
    active: fd.get("active") == null ? true : bool(fd.get("active")),
  };
  try {
    if (data.isBase) await db.currency.updateMany({ data: { isBase: false } });
    if (id) await db.currency.update({ where: { id }, data });
    else await db.currency.create({ data });
    return done(["/settings"], "Currency saved.");
  } catch (e) {
    return friendlyError(e, "Could not save currency.");
  }
}
export async function deleteCurrency(id: string): Promise<FormState> {
  try {
    await db.currency.delete({ where: { id } });
    return done(["/settings"], "Currency deleted.");
  } catch (e) {
    return friendlyError(e, "Could not delete currency.");
  }
}

// --- Marketplaces -----------------------------------------------------------
export async function saveMarketplace(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd.get("id"));
  const code = str(fd.get("code")).toUpperCase();
  if (!code) return { ok: false, message: "Marketplace code is required." };
  const data = {
    code,
    name: str(fd.get("name")) || code,
    countryCode: str(fd.get("countryCode")) || code,
    currency: str(fd.get("currency")) || "USD",
    domain: str(fd.get("domain")) || null,
    active: fd.get("active") == null ? true : bool(fd.get("active")),
  };
  try {
    if (id) await db.marketplace.update({ where: { id }, data });
    else await db.marketplace.create({ data });
    return done(["/settings"], "Marketplace saved.");
  } catch (e) {
    return friendlyError(e, "Could not save marketplace.");
  }
}
export async function deleteMarketplace(id: string): Promise<FormState> {
  try {
    await db.marketplace.delete({ where: { id } });
    return done(["/settings"], "Marketplace deleted.");
  } catch (e) {
    return friendlyError(e, "Could not delete marketplace.");
  }
}

// --- Users & roles ----------------------------------------------------------
const ROLES = ["ADMIN", "PARTNER", "ACCOUNTANT", "MANAGER", "VIEWER"];
export async function saveUser(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd.get("id"));
  const email = str(fd.get("email")).toLowerCase();
  const name = str(fd.get("name"));
  if (!email || !name) return { ok: false, message: "Name and email are required." };
  const roleRaw = str(fd.get("role")).toUpperCase();
  const role = (ROLES.includes(roleRaw) ? roleRaw : "VIEWER") as never;
  const data = { email, name, role, active: fd.get("active") == null ? true : bool(fd.get("active")) };
  try {
    if (id) await db.user.update({ where: { id }, data });
    else await db.user.create({ data });
    return done(["/settings"], "User saved.");
  } catch (e) {
    return friendlyError(e, "Could not save user.");
  }
}
export async function deleteUser(id: string): Promise<FormState> {
  try {
    await db.user.delete({ where: { id } });
    return done(["/settings"], "User removed.");
  } catch (e) {
    return friendlyError(e, "Could not remove user.");
  }
}
