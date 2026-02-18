import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { HistoricalPrice } from "./fibonacci-logic";

interface FMPHistoricalEntry {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ---------------------------------------------------------------------------
// Cache helpers (local dev only — Vercel has a read-only filesystem)
// ---------------------------------------------------------------------------

const CACHE_DIR = resolve(process.cwd(), ".cache");

function readCache(symbol: string): HistoricalPrice[] | null {
  try {
    const file = resolve(CACHE_DIR, `${symbol.toUpperCase()}.json`);
    if (!existsSync(file)) return null;
    const raw = readFileSync(file, "utf-8");
    return JSON.parse(raw) as HistoricalPrice[];
  } catch {
    return null;
  }
}

function writeCache(symbol: string, prices: HistoricalPrice[]): void {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(
      resolve(CACHE_DIR, `${symbol.toUpperCase()}.json`),
      JSON.stringify(prices, null, 2)
    );
  } catch {
    // Silently skip — filesystem is likely read-only (Vercel)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch ~1250 trading days (roughly 5 years) of daily price history
 * from Financial Modeling Prep (stable API).
 *
 * Checks `.cache/<TICKER>.json` first to save API credits (local dev).
 * On Vercel the cache is skipped gracefully — every request hits FMP.
 * Returns the data sorted oldest → newest.
 */
export async function getHistoricalPrices(
  symbol: string
): Promise<{ data: HistoricalPrice[] | null; error: string | null }> {
  // ── Cache check (safe — returns null on read-only fs) ────────────
  const cached = readCache(symbol);
  if (cached) {
    console.log("🪙 Bar Friend found the data in the vault!");
    return { data: cached, error: null };
  }

  // ── API key guard ────────────────────────────────────────────────
  const apiKey = process.env.NEXT_PUBLIC_FMP_API_KEY;

  if (!apiKey) {
    return {
      data: null,
      error:
        "We're missing the API key — add NEXT_PUBLIC_FMP_API_KEY to your .env.local file (or Vercel Environment Variables) and redeploy.",
    };
  }

  // ── Fetch from FMP ───────────────────────────────────────────────
  console.log("🚀 First time seeing this ticker! Fetching 5 years...");

  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 5);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url =
    `https://financialmodelingprep.com/stable/historical-price-eod/full` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&from=${fmt(from)}&to=${fmt(to)}` +
    `&apikey=${apiKey}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return {
        data: null,
        error: `Couldn't reach the data provider (status ${res.status}). Try again in a moment — sometimes the server just needs a breather.`,
      };
    }

    const json: FMPHistoricalEntry[] = await res.json();

    if (!Array.isArray(json) || json.length === 0) {
      return {
        data: null,
        error: `No price history found for "${symbol.toUpperCase()}". Double-check the ticker — maybe it's spelled differently than you think.`,
      };
    }

    // FMP stable endpoint returns newest-first; reverse so index 0 = oldest
    const prices: HistoricalPrice[] = json
      .map((entry) => ({
        date: entry.date,
        open: entry.open,
        high: entry.high,
        low: entry.low,
        close: entry.close,
        volume: entry.volume,
      }))
      .reverse();

    // ── Write to cache (safe — silently skips on Vercel) ───────────
    writeCache(symbol, prices);

    return { data: prices, error: null };
  } catch {
    return {
      data: null,
      error:
        "Something went wrong fetching the data — check your internet connection and give it another shot.",
    };
  }
}
