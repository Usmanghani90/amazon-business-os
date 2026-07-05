import { NextResponse } from "next/server";
import { buildTemplate } from "@/lib/import/server";
import { MODULES } from "@/lib/import/registry";

export async function GET(_req: Request, { params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!MODULES[module]) return new NextResponse("Unknown module", { status: 404 });

  const buffer = buildTemplate(module);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${module}-import-template.xlsx"`,
    },
  });
}
