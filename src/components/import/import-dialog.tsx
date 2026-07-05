"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileSpreadsheet, CircleCheck, CircleX, TriangleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PreviewResult, CommitResult } from "@/lib/import/server";
import { previewAction, commitAction } from "@/app/(app)/import/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS = {
  valid: { color: "text-emerald-500", icon: CircleCheck },
  duplicate: { color: "text-amber-500", icon: TriangleAlert },
  error: { color: "text-rose-500", icon: CircleX },
} as const;

export function ImportDialog({
  moduleKey,
  label,
  implemented = true,
}: {
  moduleKey: string;
  label: string;
  implemented?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const [base64, setBase64] = React.useState("");
  const [preview, setPreview] = React.useState<PreviewResult | null>(null);
  const [result, setResult] = React.useState<CommitResult | null>(null);

  function reset() {
    setBusy(false);
    setFileName("");
    setBase64("");
    setPreview(null);
    setResult(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setBusy(true);
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    setBase64(data);
    try {
      const p = await previewAction(moduleKey, data);
      setPreview(p);
    } catch {
      toast.error("Could not read that file. Use the provided template.");
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    setBusy(true);
    const res = await commitAction(moduleKey, base64);
    setResult(res);
    setBusy(false);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" /> Import
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import {label}</DialogTitle>
            <DialogDescription>Upload a CSV or Excel file. Download the template for the exact columns.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-sm text-muted-foreground">Need the format?</span>
            <a href={`/api/import-template/${moduleKey}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Download className="h-4 w-4" /> Download template (.xlsx)
            </a>
          </div>

          {/* Upload */}
          {implemented ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-center transition-colors hover:bg-muted/40">
              <FileSpreadsheet className="h-7 w-7 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName || "Choose a .csv or .xlsx file"}</span>
              <span className="text-xs text-muted-foreground">Click to browse</span>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFile} disabled={busy} />
            </label>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Direct import for {label} is coming in the next release. Download the template above to
              prepare your data now — it will match the importer exactly.
            </p>
          )}

          {busy && !preview && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading file…
            </div>
          )}

          {/* Preview */}
          {preview && !result && (
            <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{preview.counts.total} rows</Badge>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">{preview.counts.valid} valid</Badge>
                {preview.counts.duplicate > 0 && <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">{preview.counts.duplicate} duplicate</Badge>}
                {preview.counts.error > 0 && <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400">{preview.counts.error} error</Badge>}
              </div>
              <div className="max-h-64 overflow-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">Row</th>
                      <th className="px-2 py-1.5 text-left font-medium">Status</th>
                      {preview.columns.slice(0, 4).map((c) => (
                        <th key={c.field} className="px-2 py-1.5 text-left font-medium">{c.header}</th>
                      ))}
                      <th className="px-2 py-1.5 text-left font-medium">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 100).map((r) => {
                      const S = STATUS[r.status];
                      return (
                        <tr key={r.index} className="border-t">
                          <td className="px-2 py-1 text-muted-foreground">{r.index}</td>
                          <td className={cn("px-2 py-1", S.color)}>
                            <S.icon className="inline h-3.5 w-3.5" />
                          </td>
                          {preview.columns.slice(0, 4).map((c) => (
                            <td key={c.field} className="max-w-28 truncate px-2 py-1">{r.data[c.header]}</td>
                          ))}
                          <td className="px-2 py-1 text-rose-500">{r.errors[0] ?? ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {preview.rows.length > 100 && <p className="text-xs text-muted-foreground">Showing first 100 of {preview.rows.length} rows.</p>}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={cn("rounded-lg border p-4 text-sm", result.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5")}>
              <p className="font-medium">{result.message}</p>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-32 list-inside list-disc space-y-0.5 overflow-auto text-xs text-muted-foreground">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            {result ? (
              <Button onClick={() => { setOpen(false); reset(); }}>Done</Button>
            ) : !implemented ? (
              <Button onClick={() => setOpen(false)}>Close</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={onImport} disabled={busy || !preview || preview.counts.valid === 0}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Import {preview ? preview.counts.valid : 0} valid
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
