import type { Metadata } from "next";
import { ModuleStub, MODULE_META } from "@/components/module-stub";
import { ImportDialog } from "@/components/import/import-dialog";
import { DocumentsPanel } from "@/components/documents/documents-panel";

const meta = MODULE_META["expenses"];
export const metadata: Metadata = { title: meta.title };

export default function Page() {
  return (
    <>
      <ModuleStub
        meta={meta}
        action={<ImportDialog moduleKey="expenses" label={meta.title} implemented={true} />}
      />
      <DocumentsPanel entityType="expenses" title="Expense Documents" description="Receipts, invoices, and PDFs" />
    </>
  );
}
