"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { RiskHistogramBucket } from "@/types";
import { useTheme } from "@/components/providers/ThemeProvider";

interface Props {
  data: RiskHistogramBucket[];
}

function bucketColor(range: string): string {
  const start = parseInt(range.split("–")[0]);
  if (start >= 70) return "#EF4444";
  if (start >= 40) return "#F59E0B";
  return "#10B981";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border px-3 py-2 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="font-medium text-foreground">Score {label}</div>
        <div className="text-muted-foreground">{payload[0].value} entities</div>
      </div>
    );
  }
  return null;
};

export function RiskHistogram({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#9CA3AF" : "#6B7280";

  return (
    <div className="rounded-2xl p-5 border h-64" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Risk Score Distribution</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="range"
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.range} fill={bucketColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
