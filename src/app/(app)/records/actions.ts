"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string> };

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());
const opt = (v: FormDataEntryValue | null) => str(v) || null;
const amt = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/[,$]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

/** Convert an amount in `currency` into the base currency using stored FX. */
async function toBase(amount: number, currency: string) {
  if (!currency || currency.toUpperCase() === "USD") return amount;
  const c = await db.currency.findUnique({ where: { code: currency.toUpperCase() } });
  const rate = c ? Number(c.exchangeRate) : 1;
  return amount * (rate || 1);
}

const done = (paths: string[], message: string): FormState => {
  ["/dashboard", "/profitability", ...paths].forEach((p) => revalidatePath(p));
  return { ok: true, message };
};

// --- Expenses ---------------------------------------------------------------
export async function saveExpense(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd.get("id"));
  const categoryId = str(fd.get("categoryId"));
  const amount = amt(fd.get("amount"));
  if (!categoryId) return { ok: false, message: "Category is required." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Enter a valid amount." };
  const currency = str(fd.get("currency")) || "USD";
  const data = {
    date: new Date(str(fd.get("date")) || Date.now()),
    categoryId,
    amount,
    currency,
    amountBase: await toBase(amount, currency),
    partnerPaidId: opt(fd.get("partnerId")),
    supplierId: opt(fd.get("supplierId")),
    bankAccountId: opt(fd.get("bankAccountId")),
    marketplaceId: opt(fd.get("marketplaceId")),
    paymentMethod: (str(fd.get("paymentMethod")) || "BANK_TRANSFER") as never,
    invoiceNumber: opt(fd.get("invoiceNumber")),
    notes: opt(fd.get("notes")),
  };
  try {
    if (id) await db.expense.update({ where: { id }, data });
    else await db.expense.create({ data });
    return done(["/expenses"], "Expense saved.");
  } catch {
    return { ok: false, message: "Could not save expense." };
  }
}
export async function deleteExpense(id: string): Promise<FormState> {
  try {
    await db.expense.delete({ where: { id } });
    return done(["/expenses"], "Expense deleted.");
  } catch {
    return { ok: false, message: "Could not delete expense." };
  }
}

// --- Investments ------------------------------------------------------------
export async function saveInvestment(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd.get("id"));
  const partnerId = str(fd.get("partnerId"));
  const amount = amt(fd.get("amount"));
  if (!partnerId) return { ok: false, message: "Partner is required." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Enter a valid amount." };
  const currency = str(fd.get("currency")) || "USD";
  const data = {
    date: new Date(str(fd.get("date")) || Date.now()),
    partnerId,
    amount,
    currency,
    amountBase: await toBase(amount, currency),
    paymentMethod: (str(fd.get("paymentMethod")) || "BANK_TRANSFER") as never,
    bankAccountId: opt(fd.get("bankAccountId")),
    referenceNumber: opt(fd.get("referenceNumber")),
    notes: opt(fd.get("notes")),
  };
  try {
    if (id) await db.investment.update({ where: { id }, data });
    else await db.investment.create({ data });
    return done(["/investments", "/partners"], "Investment saved.");
  } catch {
    return { ok: false, message: "Could not save investment." };
  }
}
export async function deleteInvestment(id: string): Promise<FormState> {
  try {
    await db.investment.delete({ where: { id } });
    return done(["/investments", "/partners"], "Investment deleted.");
  } catch {
    return { ok: false, message: "Could not delete investment." };
  }
}

// --- Withdrawals ------------------------------------------------------------
export async function saveWithdrawal(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd.get("id"));
  const partnerId = str(fd.get("partnerId"));
  const amount = amt(fd.get("amount"));
  if (!partnerId) return { ok: false, message: "Partner is required." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Enter a valid amount." };
  const currency = str(fd.get("currency")) || "USD";
  const data = {
    date: new Date(str(fd.get("date")) || Date.now()),
    partnerId,
    amount,
    currency,
    amountBase: await toBase(amount, currency),
    bankAccountId: opt(fd.get("bankAccountId")),
    reason: opt(fd.get("reason")),
    notes: opt(fd.get("notes")),
  };
  try {
    if (id) await db.withdrawal.update({ where: { id }, data });
    else await db.withdrawal.create({ data });
    return done(["/withdrawals", "/partners"], "Withdrawal saved.");
  } catch {
    return { ok: false, message: "Could not save withdrawal." };
  }
}
export async function deleteWithdrawal(id: string): Promise<FormState> {
  try {
    await db.withdrawal.delete({ where: { id } });
    return done(["/withdrawals", "/partners"], "Withdrawal deleted.");
  } catch {
    return { ok: false, message: "Could not delete withdrawal." };
  }
}
