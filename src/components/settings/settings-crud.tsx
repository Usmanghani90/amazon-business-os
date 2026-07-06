"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { FormState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface CrudField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "color" | "date";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  step?: string;
  defaultValue?: string | number | boolean;
  /** Span both columns in the two-column grid. */
  full?: boolean;
}

export type CrudCellFormat = "text" | "yesno" | "active" | "badge" | "colorName";

export interface CrudColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  format?: CrudCellFormat;
  /** For the "colorName" format — key holding the colour value. */
  colorKey?: string;
}

function Cell({ item, col }: { item: Record<string, unknown>; col: CrudColumn }) {
  const value = item[col.key];
  switch (col.format) {
    case "yesno":
      return value ? <Badge variant="secondary" className="text-[10px]">Yes</Badge> : <span className="text-muted-foreground">—</span>;
    case "active":
      return value ? (
        <Badge className="bg-emerald-500/15 text-[10px] text-emerald-600 dark:text-emerald-400">Active</Badge>
      ) : (
        <Badge variant="outline" className="text-[10px]">Inactive</Badge>
      );
    case "badge":
      return <Badge variant="outline" className="text-[10px]">{String(value ?? "")}</Badge>;
    case "colorName":
      return (
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: String(item[col.colorKey ?? "color"] ?? "#888") }} />
          {String(value ?? "")}
        </span>
      );
    default:
      return <>{String(value ?? "—")}</>;
  }
}

const initial: FormState = { ok: false };

export function SettingsCrud({
  title,
  description,
  addLabel,
  fields,
  columns,
  items,
  saveAction,
  deleteAction,
}: {
  title: string;
  description?: string;
  addLabel: string;
  fields: CrudField[];
  columns: CrudColumn[];
  items: Record<string, unknown>[];
  saveAction: (prev: FormState, fd: FormData) => Promise<FormState>;
  deleteAction: (id: string) => Promise<FormState>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Record<string, unknown> | null>(null);
  const [state, formAction, pending] = React.useActionState(saveAction, initial);

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      setOpen(false);
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(item: Record<string, unknown>) {
    setEditing(item);
    setOpen(true);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> {addLabel}
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.align === "right" ? "text-right" : ""}>{c.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="py-8 text-center text-sm text-muted-foreground">
                    Nothing here yet — click “{addLabel}”.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={String(item.id)}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className={c.align === "right" ? "text-right tabular-nums" : ""}>
                        <Cell item={item} col={c} />
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton id={String(item.id)} deleteAction={deleteAction} onDone={() => router.refresh()} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title.replace(/s$/, "")}` : addLabel}</DialogTitle>
            <DialogDescription>Fill in the details and save.</DialogDescription>
          </DialogHeader>
          <form key={editing ? String(editing.id) : "new"} action={formAction} className="space-y-3">
            {editing && <input type="hidden" name="id" value={String(editing.id)} />}
            {fields.map((f) => {
              const current = editing ? editing[f.name] : f.defaultValue;
              if (f.type === "checkbox") {
                return (
                  <label key={f.name} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name={f.name} defaultChecked={editing ? Boolean(current) : Boolean(f.defaultValue)} className="h-4 w-4 rounded border-input" />
                    {f.label}
                  </label>
                );
              }
              if (f.type === "select") {
                return (
                  <div key={f.name} className="space-y-1.5">
                    <Label htmlFor={f.name}>{f.label}</Label>
                    <select
                      id={f.name}
                      name={f.name}
                      defaultValue={current != null ? String(current) : ""}
                      className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              return (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={f.name}>{f.label}</Label>
                  <Input
                    id={f.name}
                    name={f.name}
                    type={f.type === "number" ? "number" : f.type === "color" ? "color" : f.type === "date" ? "date" : "text"}
                    step={f.step}
                    required={f.required}
                    placeholder={f.placeholder}
                    defaultValue={current != null ? String(current) : ""}
                    className={f.type === "color" ? "h-9 w-16 p-1" : ""}
                  />
                </div>
              );
            })}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DeleteButton({
  id,
  deleteAction,
  onDone,
}: {
  id: string;
  deleteAction: (id: string) => Promise<FormState>;
  onDone: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function run() {
    setBusy(true);
    const res = await deleteAction(id);
    setBusy(false);
    setConfirming(false);
    if (res.ok) {
      toast.success(res.message ?? "Deleted");
      onDone();
    } else {
      toast.error(res.message ?? "Could not delete");
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="destructive" size="xs" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
        </Button>
        <Button variant="ghost" size="xs" onClick={() => setConfirming(false)}>Cancel</Button>
      </div>
    );
  }
  return (
    <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
