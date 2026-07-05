"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { createPartner, updatePartner, type PartnerFormState } from "@/app/(app)/partners/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PartnerInput {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  equityPct: number;
  joinedDate: Date | string;
  active?: boolean;
  notes?: string | null;
}

const initial: PartnerFormState = { ok: false };

export function PartnerFormDialog({ partner }: { partner?: PartnerInput }) {
  const isEdit = !!partner;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const action = isEdit ? updatePartner.bind(null, partner!.id) : createPartner;
  const [state, formAction, pending] = React.useActionState(action, initial);

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      setOpen(false);
      router.refresh();
    } else if (state.message && !state.errors) {
      toast.error(state.message);
    }
  }, [state, router]);

  const dateValue =
    partner?.joinedDate
      ? new Date(partner.joinedDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  return (
    <>
      {isEdit ? (
        <Button variant="ghost" size="icon-sm" aria-label="Edit partner" onClick={() => setOpen(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Partner
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit partner" : "Add partner"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update this partner's details and equity." : "Create a new business partner."}
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={partner?.name} placeholder="Full name" required />
              {state.errors?.name && <p className="text-xs text-destructive">{state.errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={partner?.email ?? ""} placeholder="name@company.com" />
                {state.errors?.email && <p className="text-xs text-destructive">{state.errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={partner?.phone ?? ""} placeholder="+1 555 000 0000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="equityPct">Equity %</Label>
                <Input id="equityPct" name="equityPct" type="number" step="0.001" min="0" max="100" defaultValue={partner?.equityPct ?? 25} required />
                {state.errors?.equityPct && <p className="text-xs text-destructive">{state.errors.equityPct}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="joinedDate">Joined date</Label>
                <Input id="joinedDate" name="joinedDate" type="date" defaultValue={dateValue} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" defaultValue={partner?.notes ?? ""} placeholder="Optional" />
            </div>

            {isEdit && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={partner?.active ?? true} className="h-4 w-4 rounded border-input" />
                Active
              </label>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save changes" : "Add partner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
