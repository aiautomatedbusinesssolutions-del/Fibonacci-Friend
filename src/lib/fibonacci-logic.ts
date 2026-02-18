import type { ThemeStatus } from "./ThemeConfig";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TrendDirection = "uptrend" | "downtrend";

export interface SwingPoints {
  swingHigh: { price: number; date: string };
  swingLow: { price: number; date: string };
}

/**
 * Traffic Light palette applied to each Fibonacci level:
 *
 *   23.6 %  → Emerald-400  (Success / Likely Buy)   — shallow pullback, momentum strong
 *   38.2 %  → Emerald-400  (Success / Likely Buy)   — healthy pullback, trend intact
 *   50.0 %  → Amber-400    (Warning / Wait)          — halfway point, decision zone
 *   61.8 %  → Amber-400    (Warning / Wait)          — the Sweet Spot, make-or-break
 *   78.6 %  → Rose-400     (Danger / Likely Sell)     — deep pullback, energy fading
 */
export interface FibLevel {
  ratio: number;
  label: string;
  friendlyName: string;
  price: number;
  isGoldenZone: boolean;
  trafficLight: ThemeStatus; // Emerald / Amber / Rose
}

export interface FibLevels {
  ticker: string;
  trend: TrendDirection;
  trendFriendly: string;
  high: { price: number; date: string };
  low: { price: number; date: string };
  range: number;
  levels: FibLevel[];
  currentPrice: number;
  signal: ThemeStatus;
  signalReason: string;
  narrative: string;
}

// Re-export for backtest engine compatibility
export type FibResult = FibLevels;

// ---------------------------------------------------------------------------
// 1. Trend Detection — find The Peak (maxHigh) and The Floor (minLow)
// ---------------------------------------------------------------------------

/**
 * Scan all bars to find the absolute highest high (The Peak) and
 * the absolute lowest low (The Floor), plus their dates.
 *
 * Also used by the backtest engine with rolling windows, so the
 * optional `lookback` parameter is preserved for that use-case.
 */
export function detectSwingPoints(
  prices: HistoricalPrice[],
  lookback?: number
): SwingPoints {
  if (prices.length === 0) {
    throw new Error("Price data is empty — cannot detect swings.");
  }

  // When lookback is provided (backtest rolling window), use the original
  // rolling-window algorithm so the backtest engine still works.
  if (lookback !== undefined) {
    return detectSwingPointsRolling(prices, lookback);
  }

  // Default: scan the full dataset for the absolute max high and min low.
  let swingHigh = { price: -Infinity, date: "" };
  let swingLow = { price: Infinity, date: "" };

  for (const bar of prices) {
    if (bar.high > swingHigh.price) {
      swingHigh = { price: bar.high, date: bar.date };
    }
    if (bar.low < swingLow.price) {
      swingLow = { price: bar.low, date: bar.date };
    }
  }

  return { swingHigh, swingLow };
}

/** Rolling-window swing detection (used by backtest engine). */
function detectSwingPointsRolling(
  prices: HistoricalPrice[],
  lookback: number
): SwingPoints {
  let swingHigh = { price: -Infinity, date: "" };
  let swingLow = { price: Infinity, date: "" };

  for (let i = lookback; i < prices.length - lookback; i++) {
    const bar = prices[i];
    const window = prices.slice(i - lookback, i + lookback + 1);

    if (window.every((b) => bar.high >= b.high) && bar.high > swingHigh.price) {
      swingHigh = { price: bar.high, date: bar.date };
    }
    if (window.every((b) => bar.low <= b.low) && bar.low < swingLow.price) {
      swingLow = { price: bar.low, date: bar.date };
    }
  }

  // Fallback to absolute high/low
  if (swingHigh.price === -Infinity) {
    const best = prices.reduce((a, b) => (b.high > a.high ? b : a));
    swingHigh = { price: best.high, date: best.date };
  }
  if (swingLow.price === Infinity) {
    const best = prices.reduce((a, b) => (b.low < a.low ? b : a));
    swingLow = { price: best.low, date: best.date };
  }

  return { swingHigh, swingLow };
}

/**
 * Detect the dominant trend direction.
 *
 *   Uptrend:   The Floor (minLow) came BEFORE The Peak (maxHigh) in time.
 *              → price moved low → high → (now) = Growth Era
 *
 *   Downtrend: The Peak (maxHigh) came BEFORE The Floor (minLow) in time.
 *              → price moved high → low → (now) = Cooling Off
 */
export function detectTrend(swing: SwingPoints): TrendDirection {
  return swing.swingLow.date < swing.swingHigh.date ? "uptrend" : "downtrend";
}

// ---------------------------------------------------------------------------
// 2. Fibonacci Math
// ---------------------------------------------------------------------------

/**
 * Fibonacci ratios with Traffic Light assignments:
 *
 *   Emerald-400  (success) → 23.6 %, 38.2 %  — momentum likely intact
 *   Amber-400    (warning) → 50.0 %, 61.8 %  — decision zone, wait for confirmation
 *   Rose-400     (danger)  → 78.6 %           — deep pullback, energy likely fading
 */
const FIB_RATIOS = [
  { ratio: 0.236, label: "23.6%", friendlyName: "Shallow Pullback",  trafficLight: "success" as ThemeStatus },
  { ratio: 0.382, label: "38.2%", friendlyName: "Moderate Pullback", trafficLight: "success" as ThemeStatus },
  { ratio: 0.5,   label: "50.0%", friendlyName: "Halfway Point",     trafficLight: "warning" as ThemeStatus },
  { ratio: 0.618, label: "61.8%", friendlyName: "The Sweet Spot",    trafficLight: "warning" as ThemeStatus },
  { ratio: 0.786, label: "78.6%", friendlyName: "Deep Pullback",     trafficLight: "danger"  as ThemeStatus },
] as const;

/**
 * Calculate Fibonacci retracement levels.
 *
 *   Uptrend formula:   Level = High - ( (High - Low) * Ratio )
 *   Downtrend formula: Level = Low  + ( (High - Low) * Ratio )
 */
export function calculateFibLevels(
  high: number,
  low: number,
  trend: TrendDirection
): FibLevel[] {
  const diff = high - low;

  return FIB_RATIOS.map(({ ratio, label, friendlyName, trafficLight }) => ({
    ratio,
    label,
    friendlyName,
    price: parseFloat(
      (trend === "uptrend"
        ? high - diff * ratio   // Uptrend: pullback from The Peak
        : low + diff * ratio    // Downtrend: bounce from The Floor
      ).toFixed(2)
    ),
    isGoldenZone: ratio === 0.618,
    trafficLight,
  }));
}

// ---------------------------------------------------------------------------
// 3. Traffic Light Signal
// ---------------------------------------------------------------------------

/**
 * Determine the traffic-light signal based on where the current price sits
 * relative to the Fibonacci levels.
 *
 * Uses probability language — never says "guaranteed."
 */
export function determineSignal(
  currentPrice: number,
  levels: FibLevel[],
  trend: TrendDirection
): { signal: ThemeStatus; reason: string } {
  const shallow = levels[0];  // 23.6 %
  const golden = levels.find((l) => l.isGoldenZone)!; // 61.8 %

  if (trend === "uptrend") {
    if (currentPrice >= shallow.price) {
      return {
        signal: "success",
        reason:
          "Price is holding above the shallow pullback — momentum is historically strong here.",
      };
    }
    if (currentPrice >= golden.price) {
      return {
        signal: "warning",
        reason:
          "Price is near the Sweet Spot (61.8 %). Historically, this is a make-or-break level — wait for confirmation.",
      };
    }
    return {
      signal: "danger",
      reason:
        "Price has dropped past the Sweet Spot — the pullback is deep and momentum is likely fading.",
    };
  }

  // Downtrend
  if (currentPrice <= shallow.price) {
    return {
      signal: "danger",
      reason:
        "Price is still near The Floor with weak bounce energy — the downtrend is likely continuing.",
    };
  }
  if (currentPrice <= golden.price) {
    return {
      signal: "warning",
      reason:
        "Price is bouncing toward the Sweet Spot. Historically, sellers often step back in here — wait and watch.",
    };
  }
  return {
    signal: "success",
    reason:
      "Price has bounced strongly past the Sweet Spot — momentum is shifting and a reversal is likely forming.",
  };
}

// ---------------------------------------------------------------------------
// 4. Bar Friend Narrative
// ---------------------------------------------------------------------------

/** Format a date string like "Jan 3, 2022". */
function friendlyDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Return a plain-English "Bar Friend" explanation of the current setup.
 *
 * Example (Uptrend):
 *   "The stock is in a Growth Era. It hit The Floor at $128.50 on
 *    Jan 3, 2023 and has been climbing since, reaching The Peak at
 *    $198.23 on Dec 14, 2024. We're now looking for where it might
 *    catch its breath (pull back) before the next push."
 *
 * Example (Downtrend):
 *   "The stock is in a Cooling Off phase. It hit The Peak at $198.23
 *    on Dec 14, 2024 and has been sliding since, dropping to The Floor
 *    at $152.00 on Mar 9, 2025. We're watching for where it might
 *    find its footing and bounce."
 */
export function getTrendNarrative(
  trend: TrendDirection,
  high: { price: number; date: string },
  low: { price: number; date: string }
): string {
  const peakDate = friendlyDate(high.date);
  const floorDate = friendlyDate(low.date);
  const peakPrice = `$${high.price.toFixed(2)}`;
  const floorPrice = `$${low.price.toFixed(2)}`;

  if (trend === "uptrend") {
    return (
      `The stock is in a Growth Era. ` +
      `It hit The Floor at ${floorPrice} on ${floorDate} and has been climbing since, ` +
      `reaching The Peak at ${peakPrice} on ${peakDate}. ` +
      `We're now looking for where it might catch its breath (pull back) before the next push.`
    );
  }

  return (
    `The stock is in a Cooling Off phase. ` +
    `It hit The Peak at ${peakPrice} on ${peakDate} and has been sliding since, ` +
    `dropping to The Floor at ${floorPrice} on ${floorDate}. ` +
    `We're watching for where it might find its footing and bounce.`
  );
}

// ---------------------------------------------------------------------------
// 5. Main Entry Point — full pipeline
// ---------------------------------------------------------------------------

/**
 * Full pipeline: 1,250 days of prices in → fibLevels object out.
 *
 * 1. Find The Peak (maxHigh) and The Floor (minLow)
 * 2. Detect Trend Direction (Growth Era vs Cooling Off)
 * 3. Calculate Fibonacci levels with Traffic Light colors
 * 4. Determine the signal
 * 5. Generate the Bar Friend narrative
 */
export function analyzeTicker(
  ticker: string,
  prices: HistoricalPrice[],
  currentPrice: number
): FibLevels {
  const swing = detectSwingPoints(prices);
  const trend = detectTrend(swing);
  const levels = calculateFibLevels(swing.swingHigh.price, swing.swingLow.price, trend);
  const { signal, reason } = determineSignal(currentPrice, levels, trend);
  const narrative = getTrendNarrative(trend, swing.swingHigh, swing.swingLow);

  return {
    ticker: ticker.toUpperCase(),
    trend,
    trendFriendly: trend === "uptrend" ? "Growth Era" : "Cooling Off",
    high: swing.swingHigh,
    low: swing.swingLow,
    range: parseFloat((swing.swingHigh.price - swing.swingLow.price).toFixed(2)),
    levels,
    currentPrice,
    signal,
    signalReason: reason,
    narrative,
  };
}
