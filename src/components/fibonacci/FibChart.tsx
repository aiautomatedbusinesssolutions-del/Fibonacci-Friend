"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { theme } from "@/lib/ThemeConfig";
import type { HistoricalPrice, FibLevel } from "@/lib/fibonacci-logic";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMERALD = theme.success.color; // #34d399
const ROSE = theme.danger.color;     // #fb7185
const AMBER = theme.warning.color;   // #fbbf24
const GOLDEN = "#eab308";            // yellow-500 — thicker stroke for 61.8 %
const GRID = "#1e293b";              // slate-800
const AXIS_TICK = "#64748b";         // slate-500
const TOOLTIP_BG = "#0f172a";        // slate-900

/** How many recent bars to show (keeps chart readable). */
const VISIBLE_BARS = 120;

// ---------------------------------------------------------------------------
// Fib level → line style mapping
// ---------------------------------------------------------------------------

function fibLineStyle(level: FibLevel): {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
} {
  if (level.isGoldenZone) {
    return { stroke: GOLDEN, strokeWidth: 2 };
  }
  switch (level.ratio) {
    case 0.236:
    case 0.382:
      return { stroke: EMERALD, strokeWidth: 1, strokeDasharray: "6 3" };
    case 0.5:
      return { stroke: AMBER, strokeWidth: 1, strokeDasharray: "6 3" };
    case 0.786:
      return { stroke: ROSE, strokeWidth: 1, strokeDasharray: "6 3" };
    default:
      return { stroke: AXIS_TICK, strokeWidth: 1, strokeDasharray: "4 4" };
  }
}

// ---------------------------------------------------------------------------
// Custom candle shapes
// ---------------------------------------------------------------------------

interface CandlePayload {
  open: number;
  close: number;
  high: number;
  low: number;
}

/** Thin vertical line from low to high (the wick). */
function WickShape(props: Record<string, unknown>) {
  const { x, y, width, height, payload } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    payload: CandlePayload;
  };
  if (!payload) return null;

  const isGreen = payload.close >= payload.open;
  const color = isGreen ? EMERALD : ROSE;
  const cx = x + width / 2;

  return (
    <line
      x1={cx}
      y1={y}
      x2={cx}
      y2={y + height}
      stroke={color}
      strokeWidth={1}
    />
  );
}

/** Rectangular body from open to close. */
function BodyShape(props: Record<string, unknown>) {
  const { x, y, width, height, payload } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    payload: CandlePayload;
  };
  if (!payload) return null;

  const isGreen = payload.close >= payload.open;
  const color = isGreen ? EMERALD : ROSE;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={Math.max(height, 1)}
      fill={color}
      rx={1}
    />
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CandlePayload & { date: string } }[];
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const isGreen = d.close >= d.open;

  return (
    <div
      className="rounded-lg border border-slate-700 px-3 py-2 text-xs shadow-xl"
      style={{ backgroundColor: TOOLTIP_BG }}
    >
      <p className="mb-1 font-medium text-slate-300">{d.date}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-400">
        <span>Open</span>  <span className="text-right">${d.open.toFixed(2)}</span>
        <span>High</span>  <span className="text-right">${d.high.toFixed(2)}</span>
        <span>Low</span>   <span className="text-right">${d.low.toFixed(2)}</span>
        <span>Close</span>
        <span
          className="text-right font-medium"
          style={{ color: isGreen ? EMERALD : ROSE }}
        >
          ${d.close.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart data prep
// ---------------------------------------------------------------------------

interface ChartRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** [low, high] — wick range */
  wick: [number, number];
  /** [min(open,close), max(open,close)] — body range */
  body: [number, number];
}

function prepareData(prices: HistoricalPrice[]): ChartRow[] {
  const slice = prices.slice(-VISIBLE_BARS);

  return slice.map((p) => ({
    date: p.date,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    wick: [p.low, p.high],
    body: [Math.min(p.open, p.close), Math.max(p.open, p.close)],
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
  const data = useMemo(() => prepareData(prices), [prices]);

  // Y-axis domain: pad slightly beyond the visible data range
  const [yMin, yMax] = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const d of data) {
      if (d.low < lo) lo = d.low;
      if (d.high > hi) hi = d.high;
    }
    // Also include fib lines that fall within view
    for (const fl of fibLevels) {
      if (fl.price < lo) lo = fl.price;
      if (fl.price > hi) hi = fl.price;
    }
    const pad = (hi - lo) * 0.04;
    return [Math.floor(lo - pad), Math.ceil(hi + pad)];
  }, [data, fibLevels]);

  return (
    <ResponsiveContainer width="100%" height={500}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 80, bottom: 0, left: 8 }}
      >
        {/* Subtle grid on bg-slate-950 */}
        <CartesianGrid
          stroke={GRID}
          strokeDasharray="3 3"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: AXIS_TICK, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
          tickFormatter={(v: string) => {
            const d = new Date(v + "T00:00:00");
            return d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }}
        />

        <YAxis
          domain={[yMin, yMax]}
          tick={{ fill: AXIS_TICK, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={56}
        />

        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "rgba(148,163,184,0.06)" }}
        />

        {/* ── Wicks (thin lines from low → high) ── */}
        <Bar
          dataKey="wick"
          barSize={1}
          shape={<WickShape />}
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={`w-${i}`} />
          ))}
        </Bar>

        {/* ── Bodies (open → close rectangles) ── */}
        <Bar
          dataKey="body"
          barSize={6}
          shape={<BodyShape />}
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={`b-${i}`} />
          ))}
        </Bar>

        {/* ── Fibonacci Reference Lines ── */}
        {fibLevels.map((level) => {
          const style = fibLineStyle(level);
          return (
            <ReferenceLine
              key={level.ratio}
              y={level.price}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              strokeDasharray={style.strokeDasharray}
              label={{
                value: `${level.friendlyName}  $${level.price.toFixed(2)}`,
                position: "right",
                fill: style.stroke,
                fontSize: 11,
                fontWeight: level.isGoldenZone ? 700 : 400,
              }}
            />
          );
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
