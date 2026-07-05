"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "TAZU Ventures";
export const BRAND_LEGAL = "TAZU Ventures LLC";
export const BRAND_TAGLINE = "THINK · ACT · ZOOM · UPSCALE";

/**
 * TAZU logo mark. Renders /logo.png if present (drop your exact logo there),
 * otherwise falls back to a built-in monochrome "TAZU" lightning monogram that
 * works on both light and dark themes.
 */
export function BrandMark({ className }: { className?: string }) {
  const [useFallback, setUseFallback] = React.useState(false);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-950 text-white shadow-sm ring-1 ring-white/10",
        className,
      )}
    >
      {useFallback ? (
        <TazuMonogram className="h-[70%] w-[70%]" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="TAZU Ventures"
          className="h-full w-full object-contain p-0.5"
          onError={() => setUseFallback(true)}
        />
      )}
    </div>
  );
}

/** Geometric TAZU monogram — a "T" crossed by the signature lightning "Z". */
export function TazuMonogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* T — top bar + stem */}
      <path d="M11 9h26v5H26.5v9.5h-5V14H11z" fill="currentColor" />
      {/* Lightning Z bolt through the lower half */}
      <path
        d="M31 21 17 33h7l-3 6 14-12h-7l3-6z"
        fill="currentColor"
        opacity="0.92"
      />
    </svg>
  );
}
