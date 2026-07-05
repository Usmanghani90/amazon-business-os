import type { Metadata } from "next";
import { ModuleStub, MODULE_META } from "@/components/module-stub";
import { ImportDialog } from "@/components/import/import-dialog";
import { DocumentsPanel } from "@/components/documents/documents-panel";

const meta = MODULE_META["products"];
export const metadata: Metadata = { title: meta.title };

export default function Page() {
  return (
    <>
      <ModuleStub
        meta={meta}
        action={<ImportDialog moduleKey="products" label={meta.title} implemented={false} />}
      />
      <DocumentsPanel entityType="products" title="Product Documents" description="Product images and specification sheets" />
    </>
  );
}
