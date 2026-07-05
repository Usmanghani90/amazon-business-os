"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Loader2, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { requestUpload, saveDocument } from "@/app/(app)/documents/actions";
import { Button } from "@/components/ui/button";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

export function DocumentUploader({
  entityType,
  entityId,
  configured,
}: {
  entityType: string;
  entityId?: string;
  configured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  if (!configured) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
        <CloudOff className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Document storage not connected</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Add your AWS S3 bucket and keys to the environment to enable receipt, invoice, and image
          uploads. See{" "}
          <Link href="/integrations" className="text-primary hover:underline">
            Integrations
          </Link>
          .
        </p>
      </div>
    );
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const signed = await requestUpload({
        entityType,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      if (!signed.ok) {
        toast.error(signed.error);
        return;
      }
      const put = await fetch(signed.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) {
        toast.error("Upload to storage failed.");
        return;
      }
      await saveDocument({
        entityType,
        entityId,
        name: file.name,
        url: signed.publicUrl,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      toast.success(`Uploaded ${file.name}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong during upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" disabled={busy} className="relative overflow-hidden">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {busy ? "Uploading…" : "Upload document"}
      {!busy && (
        <input
          type="file"
          accept={ACCEPT}
          onChange={onFile}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Upload document"
        />
      )}
    </Button>
  );
}
