"use client";

import { useState, useCallback } from "react";
import { Activity } from "lucide-react";
import { TickerSearch } from "./TickerSearch";
import { FibChart } from "./FibChart";
import { Status } from "./Status";
import {
  analyzeTicker,
  type HistoricalPrice,
  type FibLevels,
} from "@/lib/fibonacci-logic";
import { theme } from "@/lib/ThemeConfig";
import { disclaimer } from "@/lib/Content";

export function Dashboard() {
  const [fibData, setFibData] = useState<FibLevels | null>(null);
  const [prices, setPrices] = useState<HistoricalPrice[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (ticker: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/historical?symbol=${encodeURIComponent(ticker)}`);
      const json = await res.json();

      if (json.error || !json.data) {
        setError(json.error ?? "No data returned.");
        setFibData(null);
        setPrices(null);
        return;
      }

      const priceData: HistoricalPrice[] = json.data;
      const currentPrice = priceData[priceData.length - 1].close;
      const result = analyzeTicker(ticker, priceData, currentPrice);

      setPrices(priceData);
      setFibData(result);
    } catch {
      setError("Something went wrong — check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      {/* ── Header ── */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Trend Friend
          </h1>
          <span className="hidden text-sm text-slate-500 sm:inline">
            Fibonacci Retracement Tool Meter
          </span>
        </div>
        <TickerSearch onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!fibData && !error && !isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg text-slate-400">
            Enter a ticker above to see the Fibonacci levels and traffic light signal.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Likely Buy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Wait
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Likely Sell
            </span>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {fibData && prices && (
        <>
          {/* Signal banner */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="text-3xl font-bold"
                style={{ color: theme[fibData.signal].color }}
              >
                {fibData.ticker}
              </span>
              <Status status={fibData.signal} />
              <span className="text-sm text-slate-400">
                ${fibData.currentPrice.toFixed(2)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 sm:max-w-md sm:text-right">
              {fibData.signalReason}
            </p>
          </div>

          {/* Narrative */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-medium text-slate-300">
              {fibData.trendFriendly}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {fibData.narrative}
            </p>
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <FibChart prices={prices} fibLevels={fibData.levels} />
          </div>

          {/* Levels table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-3 text-sm font-medium text-slate-300">
              Fibonacci Levels
            </h2>
            <div className="space-y-2">
              {fibData.levels.map((level) => (
                <div
                  key={level.ratio}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: level.isGoldenZone
                          ? "#eab308"
                          : theme[level.trafficLight].color,
                      }}
                    />
                    <span className="text-slate-400">{level.label}</span>
                    <span className="text-slate-500">
                      {level.friendlyName}
                    </span>
                  </div>
                  <span
                    className="font-mono font-medium"
                    style={{
                      color: level.isGoldenZone
                        ? "#eab308"
                        : theme[level.trafficLight].color,
                    }}
                  >
                    ${level.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-slate-600">{disclaimer}</p>
        </>
      )}
    </main>
  );
}
