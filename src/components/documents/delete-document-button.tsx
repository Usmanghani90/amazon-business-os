"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDocument } from "@/app/(app)/documents/actions";
import { Button } from "@/components/ui/button";

export function DeleteDocumentButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function onDelete() {
    setBusy(true);
    const res = await deleteDocument(id);
    setBusy(false);
    if (res.ok) {
      toast.success("Document removed");
      router.refresh();
    } else {
      toast.error("Could not remove document");
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" aria-label="Delete document" onClick={onDelete} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
    </Button>
  );
}
