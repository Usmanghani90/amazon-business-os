"use server";

import { revalidatePath } from "next/cache";
import { previewImport, commitImport, type PreviewResult, type CommitResult } from "@/lib/import/server";

export async function previewAction(moduleKey: string, base64: string): Promise<PreviewResult> {
  return previewImport(moduleKey, base64);
}

export async function commitAction(moduleKey: string, base64: string): Promise<CommitResult> {
  const result = await commitImport(moduleKey, base64);
  if (result.ok) {
    revalidatePath(`/${moduleKey}`);
    revalidatePath("/dashboard");
  }
  return result;
}
