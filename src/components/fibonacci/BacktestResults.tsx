"use client";

import { useMemo } from "react";
import { History, TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";
import { theme } from "@/lib/ThemeConfig";
import {
  backtestGoldenZone,
  type BacktestResult,
  type GoldenTouch,
} from "@/lib/backtest-logic";
import type { HistoricalPrice } from "@/lib/fibonacci-logic";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function TouchRow({ touch }: { touch: GoldenTouch }) {
  const isSuccess = touch.outcome === "success";
  const color = isSuccess ? theme.success.color : theme.danger.color;
  const Icon = isSuccess ? TrendingUp : TrendingDown;

  const friendlyDate = new Date(touch.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-800/30 px-4 py-3 text-sm">
      {/* Icon */}
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />

      {/* Date */}
      <span className="w-28 shrink-0 text-slate-400">{friendlyDate}</span>

      {/* Touch price */}
      <span className="hidden w-24 shrink-0 text-slate-500 sm:block">
        ${touch.touchPrice.toFixed(2)}
      </span>

      {/* Arrow → 30-day price */}
      <span className="text-slate-600">&rarr;</span>
      <span className="w-24 shrink-0 font-mono" style={{ color }}>
        ${touch.priceAfter30.toFixed(2)}
      </span>

      {/* Percent change */}
      <span className="font-mono font-medium" style={{ color }}>
        {touch.percentChange > 0 ? "+" : ""}
        {touch.percentChange}%
      </span>

      {/* Trend tag */}
      <span className="ml-auto hidden rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-500 md:inline-block">
        {touch.trend === "uptrend" ? "Growth Era" : "Cooling Off"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BacktestResultsProps {
  ticker: string;
  prices: HistoricalPrice[];
}

export function BacktestResults({ ticker, prices }: BacktestResultsProps) {
  const result: BacktestResult = useMemo(
    () => backtestGoldenZone(ticker, prices),
    [ticker, prices]
  );

  const avgBounce = useMemo(() => {
    const successTouches = result.touches.filter(
      (t) => t.outcome === "success"
    );
    if (successTouches.length === 0) return 0;
    const total = successTouches.reduce(
      (sum, t) => sum + Math.abs(t.percentChange),
      0
    );
    return parseFloat((total / successTouches.length).toFixed(2));
  }, [result]);

  const winColor =
    result.winRate >= 50
      ? theme.success.color
      : result.winRate >= 30
        ? theme.warning.color
        : theme.danger.color;

  return (
    <section className="flex flex-col gap-5">
      {/* ── Section separator ── */}
      <div className="flex items-center gap-3 pt-4">
        <div className="h-px flex-1 bg-slate-800" />
        <div className="flex items-center gap-2 text-slate-400">
          <History className="h-4 w-4" />
          <h2 className="text-sm font-semibold tracking-wide">
            Bar Friend&apos;s Historical Review
          </h2>
        </div>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      {/* ── Summary sentence ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-sm leading-relaxed text-slate-400">
          {result.summary}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Golden Zone Touches"
          value={String(result.touches.length)}
          sub="over 5 years"
          color="#94a3b8"
        />
        <StatCard
          label="Win Rate"
          value={`${result.winRate}%`}
          sub={`${result.successes} bounces`}
          color={winColor}
        />
        <StatCard
          label="Avg Bounce"
          value={avgBounce > 0 ? `+${avgBounce}%` : "—"}
          sub="on successful touches"
          color={theme.success.color}
        />
        <StatCard
          label="Didn't Hold"
          value={String(result.failures)}
          sub={`${result.failures} time${result.failures === 1 ? "" : "s"}`}
          color={theme.danger.color}
        />
      </div>

      {/* ── Touch log ── */}
      {result.touches.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Target className="h-4 w-4 text-amber-400" />
              Every Golden Zone Touch
            </h3>
            <span className="text-xs text-slate-600">
              30-day outcome after each touch
            </span>
          </div>

          {/* Column headers */}
          <div className="mb-2 flex items-center gap-3 px-4 text-xs text-slate-600">
            <span className="w-4 shrink-0" />
            <span className="w-28 shrink-0">Date</span>
            <span className="hidden w-24 shrink-0 sm:block">Touch Price</span>
            <span className="w-4" />
            <span className="w-24 shrink-0">30-Day Price</span>
            <span>Change</span>
          </div>

          <div className="space-y-1.5">
            {result.touches.map((touch) => (
              <TouchRow key={touch.date} touch={touch} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {result.touches.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 py-12 text-center">
          <BarChart3 className="h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-500">
            No Golden Zone touches detected in 5 years of {result.ticker} data.
          </p>
        </div>
      )}
    </section>
  );
}
