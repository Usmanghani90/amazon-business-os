// Structural type so this module stays client-safe (no @prisma/client import).
type DecimalLike = { toString(): string };
type Numeric = number | string | DecimalLike | null | undefined;

/** Coerce Prisma.Decimal | string | number into a plain JS number. */
export function toNumber(value: Numeric): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  // Prisma.Decimal
  return Number(value.toString()) || 0;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  PKR: "₨",
  AED: "د.إ",
  CAD: "C$",
};

export function currencySymbol(code = "USD") {
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

/** $1,234.56 — precise money formatting. */
export function formatCurrency(value: Numeric, currency = "USD", opts?: Intl.NumberFormatOptions) {
  const n = toNumber(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(n);
}

/** $1.2M / $890.5K / $1,234 — compact money for KPI cards. */
export function formatCompactCurrency(value: Numeric, currency = "USD") {
  const n = toNumber(value);
  const abs = Math.abs(n);
  const sym = currencySymbol(currency);
  if (abs >= 1_000_000) return `${n < 0 ? "-" : ""}${sym}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${n < 0 ? "-" : ""}${sym}${(abs / 1_000).toFixed(1)}K`;
  return formatCurrency(n, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** 12,345 */
export function formatNumber(value: Numeric, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", opts).format(toNumber(value));
}

export function formatCompactNumber(value: Numeric) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    toNumber(value),
  );
}

/** 12.3% — expects a percentage value already (e.g. 12.3 not 0.123). */
export function formatPercent(value: Numeric, digits = 1) {
  return `${toNumber(value).toFixed(digits)}%`;
}

export function formatDate(value: Date | string | null | undefined, style: "short" | "medium" | "long" = "medium") {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { month: "short", day: "numeric" }
      : style === "long"
        ? { year: "numeric", month: "long", day: "numeric" }
        : { year: "numeric", month: "short", day: "numeric" };
  return new Intl.DateTimeFormat("en-US", options).format(d);
}

/** "3 days ago" style relative time. */
export function formatRelative(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d, "medium");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
