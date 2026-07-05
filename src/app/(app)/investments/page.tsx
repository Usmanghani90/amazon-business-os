import type { Metadata } from "next";
import { ModuleStub, MODULE_META } from "@/components/module-stub";
import { ImportDialog } from "@/components/import/import-dialog";

const meta = MODULE_META["investments"];
export const metadata: Metadata = { title: meta.title };

export default function Page() {
  return (
    <ModuleStub
      meta={meta}
      action={<ImportDialog moduleKey="investments" label={meta.title} implemented={true} />}
    />
  );
}
