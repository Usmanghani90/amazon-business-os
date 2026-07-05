import type { Metadata } from "next";
import { ModuleStub, MODULE_META } from "@/components/module-stub";

const meta = MODULE_META["investments"];
export const metadata: Metadata = { title: meta.title };

export default function Page() {
  return <ModuleStub meta={meta} />;
}
