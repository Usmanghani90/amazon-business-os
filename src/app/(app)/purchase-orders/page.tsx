import type { Metadata } from "next";
import { ModuleStub, MODULE_META } from "@/components/module-stub";
import { ImportDialog } from "@/components/import/import-dialog";
import { DocumentsPanel } from "@/components/documents/documents-panel";

const meta = MODULE_META["purchase-orders"];
export const metadata: Metadata = { title: meta.title };

export default function Page() {
  return (
    <>
      <ModuleStub
        meta={meta}
        action={<ImportDialog moduleKey="purchase-orders" label={meta.title} implemented={false} />}
      />
      <DocumentsPanel entityType="purchase-orders" title="Purchase Order Documents" description="Invoices and shipping documents" />
    </>
  );
}
