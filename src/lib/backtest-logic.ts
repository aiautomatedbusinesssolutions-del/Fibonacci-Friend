import {
  detectSwingPoints,
  detectTrend,
  calculateFibLevels,
  type HistoricalPrice,
  type TrendDirection,
} from "./fibonacci-logic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoldenTouch {
  date: string;
  touchPrice: number;
  goldenLevelPrice: number;
  trend: TrendDirection;
  priceAfter30: number;
  percentChange: number;
  outcome: "success" | "fail";
}

export interface BacktestResult {
  ticker: string;
  totalBars: number;
  touches: GoldenTouch[];
  successes: number;
  failures: number;
  winRate: number;
  summary: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** How many bars the rolling window uses to find swing points. */
const SWING_WINDOW = 120;

/** Bars to look back on each side when detecting a swing. */
const SWING_LOOKBACK = 10;

/**
 * How close price must get to the 61.8 % level to count as a "touch."
 * 1.5 % of the swing range defines a realistic "zone" rather than a
 * single pixel — the way a real trader would eyeball it on a chart.
 */
const TOUCH_TOLERANCE = 0.015;

/** How many trading days ahead to measure the outcome. */
const OUTCOME_HORIZON = 30;

/**
 * Minimum bars between two recorded touches to avoid double-counting
 * when price hovers around the level for several days.
 */
const COOLDOWN_BARS = 10;

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * Walk through 5 years of price data with a rolling window, and every time
 * the closing price "touches" the 61.8 % (Sweet Spot) retracement level,
 * check what happened 30 trading days later.
 *
 * A touch counts as a **success** if price moved in the favourable direction
 * (up in an uptrend retracement, down in a downtrend retracement) and a
 * **fail** otherwise.
 */
export function backtestGoldenZone(
  ticker: string,
  prices: HistoricalPrice[]
): BacktestResult {
  const touches: GoldenTouch[] = [];
  let lastTouchIndex = -Infinity;

  // We need at least SWING_WINDOW bars to build the first Fib level set,
  // plus OUTCOME_HORIZON bars of runway to measure the result.
  const startAt = SWING_WINDOW;
  const stopAt = prices.length - OUTCOME_HORIZON;

  for (let i = startAt; i < stopAt; i++) {
    // Cooldown: skip if we just logged a touch
    if (i - lastTouchIndex < COOLDOWN_BARS) continue;

    // Build Fib levels from the trailing window
    const window = prices.slice(i - SWING_WINDOW, i);
    const swing = detectSwingPoints(window, SWING_LOOKBACK);
    const trend = detectTrend(swing);
    const levels = calculateFibLevels(
      swing.swingHigh.price,
      swing.swingLow.price,
      trend
    );

    const goldenLevel = levels.find((l) => l.isGoldenZone);
    if (!goldenLevel) continue;

    // Check if today's close "touches" the Sweet Spot
    const bar = prices[i];
    const range = swing.swingHigh.price - swing.swingLow.price;
    if (range <= 0) continue;

    const distance = Math.abs(bar.close - goldenLevel.price);
    if (distance > range * TOUCH_TOLERANCE) continue;

    // We have a touch — now look 30 days ahead
    const futureBar = prices[i + OUTCOME_HORIZON];
    const pctChange = ((futureBar.close - bar.close) / bar.close) * 100;

    // In an uptrend retracement the 61.8 % is a support — success if price
    // went UP from there. In a downtrend retracement it's resistance —
    // success if price went DOWN.
    const outcome =
      trend === "uptrend"
        ? pctChange > 0
          ? "success"
          : "fail"
        : pctChange < 0
          ? "success"
          : "fail";

    touches.push({
      date: bar.date,
      touchPrice: bar.close,
      goldenLevelPrice: goldenLevel.price,
      trend,
      priceAfter30: futureBar.close,
      percentChange: parseFloat(pctChange.toFixed(2)),
      outcome,
    });

    lastTouchIndex = i;
  }

  const successes = touches.filter((t) => t.outcome === "success").length;
  const failures = touches.length - successes;
  const winRate =
    touches.length > 0
      ? parseFloat(((successes / touches.length) * 100).toFixed(1))
      : 0;

  const summary =
    touches.length > 0
      ? `In the last 5 years, the Golden Zone acted like a trampoline ${successes} times out of ${touches.length} (${winRate}% win rate). It didn't hold ${failures} time${failures === 1 ? "" : "s"}.`
      : `No Golden Zone touches were detected in the last 5 years of ${ticker.toUpperCase()} data.`;

  return {
    ticker: ticker.toUpperCase(),
    totalBars: prices.length,
    touches,
    successes,
    failures,
    winRate,
    summary,
  };
}
