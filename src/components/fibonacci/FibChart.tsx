"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";
import { theme } from "@/lib/ThemeConfig";
import type { HistoricalPrice, FibLevel } from "@/lib/fibonacci-logic";

// ---------------------------------------------------------------------------
// Colors — our Traffic Light palette
// ---------------------------------------------------------------------------

const EMERALD = theme.success.color; // #34d399  — up candles
const ROSE = theme.danger.color;     // #fb7185  — down candles
const AMBER = theme.warning.color;   // #fbbf24
const GOLDEN = "#eab308";            // yellow-500 — The Sweet Spot
const GRID = "#1e293b";              // slate-800
const TEXT = "#64748b";              // slate-500

// ---------------------------------------------------------------------------
// Fib level → line color
// ---------------------------------------------------------------------------

function fibColor(level: FibLevel): string {
  if (level.isGoldenZone) return GOLDEN;
  switch (level.ratio) {
    case 0.236:
    case 0.382:
      return EMERALD;
    case 0.5:
      return AMBER;
    case 0.786:
      return ROSE;
    default:
      return TEXT;
  }
}

// ---------------------------------------------------------------------------
// Convert our data to lightweight-charts format
// ---------------------------------------------------------------------------

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

function toCandleData(prices: HistoricalPrice[]): CandleData[] {
  return prices.map((p) => ({
    time: p.date,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FibChartProps {
  prices: HistoricalPrice[];
  fibLevels: FibLevel[];
}

export function FibChart({ prices, fibLevels }: FibChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  const candleData = useMemo(() => toCandleData(prices), [prices]);

  // ── Create chart, load full 5-year dataset, destroy on unmount ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 520,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: TEXT,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: GRID },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(148,163,184,0.3)",
          labelBackgroundColor: "#1e293b",
        },
        horzLine: {
          color: "rgba(148,163,184,0.3)",
          labelBackgroundColor: "#1e293b",
        },
      },
      rightPriceScale: {
        borderColor: GRID,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: GRID,
        timeVisible: false,
        rightOffset: 5,
        minBarSpacing: 1,
      },
      handleScroll: { vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true },
    });

    // v5 API: addSeries(SeriesType, options)
    const series = chart.addSeries(CandlestickSeries, {
      upColor: EMERALD,
      downColor: ROSE,
      borderUpColor: EMERALD,
      borderDownColor: ROSE,
      wickUpColor: EMERALD,
      wickDownColor: ROSE,
    });

    series.setData(candleData);

    // Start at the most recent bars — user can scroll/pan back through all 5 years
    chart.timeScale().scrollToPosition(0, false);

    chartRef.current = chart;
    seriesRef.current = series;

    // ── Responsive resize ──
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [candleData]);

  // ── Fibonacci price lines — add/remove when levels change ──
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const lines = fibLevels.map((level) => {
      const color = fibColor(level);
      return series.createPriceLine({
        price: level.price,
        color,
        lineWidth: level.isGoldenZone ? 2 : 1,
        lineStyle: level.isGoldenZone ? LineStyle.Solid : LineStyle.Dashed,
        axisLabelVisible: true,
        title: `${level.friendlyName}  ${level.label}`,
        lineVisible: true,
      });
    });

    return () => {
      for (const line of lines) {
        try {
          series.removePriceLine(line);
        } catch {
          // series may already be removed
        }
      }
    };
  }, [fibLevels]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ minHeight: 520 }}
    />
  );
}
