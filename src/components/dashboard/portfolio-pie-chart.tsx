"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  green: number;
  yellow: number;
  red: number;
}

const COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

export function PortfolioPieChart({ green, yellow, red }: Props) {
  const data = [
    { name: "Healthy", value: green, color: COLORS.green },
    { name: "At Risk", value: yellow, color: COLORS.yellow },
    { name: "Critical", value: red, color: COLORS.red },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
        No accounts yet
      </div>
    );
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={55}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
