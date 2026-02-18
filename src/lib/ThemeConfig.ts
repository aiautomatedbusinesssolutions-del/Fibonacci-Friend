/**
 * Traffic Light palette for Trend Friend.
 *
 * Each status carries two labels:
 *   - `label`  → generic UI (Success / Warning / Danger)
 *   - `signal` → trading context (Buy / Wait / Sell)
 *
 * Colors:
 *   Emerald-400 → price is holding above key levels (likely bullish)
 *   Amber-400   → price is near a decision zone (wait for confirmation)
 *   Rose-400    → price has broken below support (likely bearish)
 */
export const theme = {
  success: {
    label: "Success",
    signal: "Likely Buy",
    color: "#34d399", // Emerald-400
    tw: "text-emerald-400",
    bg: "bg-emerald-400",
    border: "border-emerald-400/30",
    bgFaint: "bg-emerald-400/10",
  },
  warning: {
    label: "Warning",
    signal: "Wait",
    color: "#fbbf24", // Amber-400
    tw: "text-amber-400",
    bg: "bg-amber-400",
    border: "border-amber-400/30",
    bgFaint: "bg-amber-400/10",
  },
  danger: {
    label: "Danger",
    signal: "Likely Sell",
    color: "#fb7185", // Rose-400
    tw: "text-rose-400",
    bg: "bg-rose-400",
    border: "border-rose-400/30",
    bgFaint: "bg-rose-400/10",
  },
} as const;

export type ThemeStatus = keyof typeof theme;
