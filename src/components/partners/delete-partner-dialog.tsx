"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { deletePartner } from "@/app/(app)/partners/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeletePartnerDialog({
  id,
  name,
  isDefault,
  hasHistory,
}: {
  id: string;
  name: string;
  isDefault: boolean;
  hasHistory: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function onConfirm() {
    setPending(true);
    const res = await deletePartner(id);
    setPending(false);
    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Delete partner" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-amber-500" /> Delete {name}?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              {isDefault && (
                <span className="block rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-400">
                  <strong>{name}</strong> is one of the four default partners. Please confirm you really
                  want to remove them.
                </span>
              )}
              {hasHistory
                ? "This partner has recorded transactions, so they'll be deactivated (hidden) rather than deleted — their financial history stays intact."
                : "This partner has no transactions and will be permanently deleted."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={pending}>
              {pending ? "Working…" : hasHistory ? "Deactivate" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
