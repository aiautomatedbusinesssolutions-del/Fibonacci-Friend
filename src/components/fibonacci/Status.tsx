"use client";

import { theme, type ThemeStatus } from "@/lib/ThemeConfig";
import { cn } from "@/lib/utils";

/**
 * Status — traffic-light badge showing the current market signal.
 * Displays the trading signal (Likely Buy / Wait / Likely Sell).
 */
export function Status({ status = "success" }: { status?: ThemeStatus }) {
  const t = theme[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        t.tw,
        t.border,
        t.bgFaint
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t.bg)} />
      {t.signal}
    </span>
  );
}
