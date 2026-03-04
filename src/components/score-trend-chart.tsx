"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  score: number;
}

interface Props {
  data: Array<DataPoint>;
  height?: number;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green-500
  if (score >= 40) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: DataPoint;
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const color = getScoreColor(payload.score);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
    />
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DataPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0];
  const score = point.value;
  const date = point.payload.date;
  const color = getScoreColor(score);

  let label = "Healthy";
  if (score < 40) label = "Critical";
  else if (score < 70) label = "At Risk";

  const formattedDate = (() => {
    try {
      return format(parseISO(date), "MMM d, yyyy");
    } catch {
      return date;
    }
  })();

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{formattedDate}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-semibold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">— {label}</span>
      </div>
    </div>
  );
}

interface GradientLineProps {
  data: DataPoint[];
}

function getStrokeColor(data: DataPoint[]): string {
  if (data.length === 0) return "#6b7280";
  const latest = data[data.length - 1];
  return getScoreColor(latest.score);
}

function ScoreLine({ data }: GradientLineProps) {
  // This is rendered inside the recharts context via the Line component
  // The actual color logic is handled by CustomDot + stroke
  const strokeColor = getStrokeColor(data);
  return (
    <Line
      type="monotone"
      dataKey="score"
      stroke={strokeColor}
      strokeWidth={2}
      dot={<CustomDot />}
      activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
      isAnimationActive={true}
      animationDuration={600}
    />
  );
}

export function ScoreTrendChart({ data, height = 240 }: Props) {
  const formattedData = React.useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: (() => {
        try {
          return format(parseISO(d.date), "MMM d");
        } catch {
          return d.date;
        }
      })(),
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={formattedData}
        margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        {/* Reference bands */}
        <ReferenceLine
          y={70}
          stroke="#22c55e"
          strokeDasharray="4 4"
          strokeWidth={1}
          strokeOpacity={0.5}
        />
        <ReferenceLine
          y={40}
          stroke="#eab308"
          strokeDasharray="4 4"
          strokeWidth={1}
          strokeOpacity={0.5}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
        <ScoreLine data={formattedData} />
      </LineChart>
    </ResponsiveContainer>
  );
}
