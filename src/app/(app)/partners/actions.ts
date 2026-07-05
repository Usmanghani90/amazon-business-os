"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

const partnerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  equityPct: z.coerce.number().min(0, "Min 0").max(100, "Max 100"),
  joinedDate: z.string().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  active: z.coerce.boolean().optional(),
});

export type PartnerFormState = { ok: boolean; message?: string; errors?: Record<string, string> };

function parse(formData: FormData) {
  return partnerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    equityPct: formData.get("equityPct") ?? 0,
    joinedDate: formData.get("joinedDate") ?? undefined,
    notes: formData.get("notes") ?? "",
    active: formData.get("active") ?? undefined,
  });
}

export async function createPartner(_prev: PartnerFormState, formData: FormData): Promise<PartnerFormState> {
  const result = parse(formData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
    return { ok: false, message: "Please fix the errors below.", errors };
  }
  const d = result.data;
  try {
    await db.partner.create({
      data: {
        name: d.name,
        email: d.email || null,
        phone: d.phone || null,
        equityPct: d.equityPct,
        joinedDate: d.joinedDate ? new Date(d.joinedDate) : new Date(),
        notes: d.notes || null,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error && e.message.includes("Unique") ? "A partner with that email already exists." : "Could not create partner.";
    return { ok: false, message: msg };
  }
  revalidatePath("/partners");
  return { ok: true, message: `${d.name} added.` };
}

export async function updatePartner(id: string, _prev: PartnerFormState, formData: FormData): Promise<PartnerFormState> {
  const result = parse(formData);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) errors[issue.path[0] as string] = issue.message;
    return { ok: false, message: "Please fix the errors below.", errors };
  }
  const d = result.data;
  try {
    await db.partner.update({
      where: { id },
      data: {
        name: d.name,
        email: d.email || null,
        phone: d.phone || null,
        equityPct: d.equityPct,
        joinedDate: d.joinedDate ? new Date(d.joinedDate) : undefined,
        notes: d.notes || null,
        ...(d.active !== undefined ? { active: d.active } : {}),
      },
    });
  } catch {
    return { ok: false, message: "Could not update partner." };
  }
  revalidatePath("/partners");
  revalidatePath(`/partners/${id}`);
  return { ok: true, message: `${d.name} updated.` };
}

/**
 * Deletes a partner. If the partner has any linked transactions, it is
 * deactivated instead of hard-deleted (to preserve financial history).
 */
export async function deletePartner(id: string): Promise<{ ok: boolean; message: string; deactivated?: boolean }> {
  const [invs, exps, wds, partner] = await Promise.all([
    db.investment.count({ where: { partnerId: id } }),
    db.expense.count({ where: { partnerPaidId: id } }),
    db.withdrawal.count({ where: { partnerId: id } }),
    db.partner.findUnique({ where: { id } }),
  ]);
  if (!partner) return { ok: false, message: "Partner not found." };

  const hasHistory = invs + exps + wds > 0;
  try {
    if (hasHistory) {
      await db.partner.update({ where: { id }, data: { active: false } });
      revalidatePath("/partners");
      return { ok: true, deactivated: true, message: `${partner.name} has transactions, so was deactivated (history preserved).` };
    }
    await db.partnerLedgerEntry.deleteMany({ where: { partnerId: id } });
    await db.partner.delete({ where: { id } });
    revalidatePath("/partners");
    return { ok: true, message: `${partner.name} deleted.` };
  } catch {
    return { ok: false, message: "Could not delete partner." };
  }
}
