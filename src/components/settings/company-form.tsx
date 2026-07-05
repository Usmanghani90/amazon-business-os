"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCompany, type FormState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface CompanyValues {
  name?: string;
  legalName?: string | null;
  baseCurrency?: string;
  country?: string | null;
  taxId?: string | null;
  timezone?: string;
  fiscalYearStart?: number;
  address?: string | null;
}

const initial: FormState = { ok: false };

export function CompanyForm({ company }: { company: CompanyValues }) {
  const router = useRouter();
  const [state, formAction, pending] = React.useActionState(updateCompany, initial);

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  const field = (name: keyof CompanyValues, label: string, opts: { type?: string; placeholder?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={opts.type ?? "text"} placeholder={opts.placeholder} defaultValue={company[name] != null ? String(company[name]) : ""} />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company Information</CardTitle>
        <CardDescription>Legal entity, base currency, and fiscal settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "Company name")}
            {field("legalName", "Legal name")}
            {field("baseCurrency", "Base currency", { placeholder: "USD" })}
            {field("country", "Country")}
            {field("taxId", "Tax ID")}
            {field("timezone", "Timezone", { placeholder: "America/New_York" })}
            {field("fiscalYearStart", "Fiscal year start (month 1–12)", { type: "number" })}
            {field("address", "Address")}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
