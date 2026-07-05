"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

function Dropdown({
  label,
  param,
  value,
  options,
}: {
  label: string;
  param: string;
  value: string;
  options: Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "all" || !e.target.value) params.delete(param);
    else params.set(param, e.target.value);
    router.push(`?${params.toString()}`);
  };

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className={cn(
          "h-9 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm shadow-sm",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProfitabilityFilters({
  marketplaces,
  products,
  current,
}: {
  marketplaces: Option[];
  products: Option[];
  current: { market: string; product: string; period: string };
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Dropdown
        label="Marketplace"
        param="market"
        value={current.market}
        options={[{ value: "all", label: "All marketplaces" }, ...marketplaces]}
      />
      <Dropdown
        label="Product"
        param="product"
        value={current.product}
        options={[{ value: "all", label: "All products" }, ...products]}
      />
      <Dropdown
        label="Period"
        param="period"
        value={current.period}
        options={[
          { value: "30", label: "Last 30 days" },
          { value: "90", label: "Last 90 days" },
          { value: "all", label: "All time" },
        ]}
      />
    </div>
  );
}
