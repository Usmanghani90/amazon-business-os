"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ACCEPTED_MIME, MAX_UPLOAD_BYTES, isS3Configured, presignUpload, objectPublicUrl, deleteObject, keyFromUrl } from "@/lib/s3";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export async function requestUpload(input: {
  entityType: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<{ ok: true; url: string; publicUrl: string } | { ok: false; error: string }> {
  if (!isS3Configured()) return { ok: false, error: "AWS S3 is not configured yet." };
  if (!ACCEPTED_MIME[input.contentType]) return { ok: false, error: "Only PDF, PNG, JPG, and WEBP files are allowed." };
  if (input.sizeBytes > MAX_UPLOAD_BYTES) return { ok: false, error: "File exceeds the 15MB limit." };

  const key = `${input.entityType}/${crypto.randomUUID()}-${safeName(input.fileName)}`;
  try {
    const url = await presignUpload(key, input.contentType);
    return { ok: true, url, publicUrl: objectPublicUrl(key) };
  } catch {
    return { ok: false, error: "Could not create the upload link." };
  }
}

export async function saveDocument(input: {
  entityType: string;
  entityId?: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}) {
  await db.document.create({
    data: {
      name: input.name,
      url: input.url,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      supplierId: input.entityType === "suppliers" ? input.entityId ?? null : null,
    },
  });
  revalidatePath(`/${input.entityType}`);
  return { ok: true };
}

export async function deleteDocument(id: string) {
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { ok: false };
  if (isS3Configured()) {
    const key = keyFromUrl(doc.url);
    if (key) {
      try {
        await deleteObject(key);
      } catch {
        /* best effort — still remove the DB record */
      }
    }
  }
  await db.document.delete({ where: { id } });
  if (doc.entityType) revalidatePath(`/${doc.entityType}`);
  return { ok: true };
}
