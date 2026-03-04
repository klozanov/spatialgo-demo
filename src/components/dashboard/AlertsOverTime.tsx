"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DailyAlertCount } from "@/types";

interface Props {
  data: DailyAlertCount[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border px-3 py-2 text-sm" style={{ background: "#1F2937", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="font-medium text-white">{label}</div>
        <div className="text-red-400">{payload[0].value} alerts</div>
      </div>
    );
  }
  return null;
};

export function AlertsOverTime({ data }: Props) {
  return (
    <div className="rounded-2xl p-5 border h-64" style={{ background: "#111827", borderColor: "rgba(255,255,255,0.07)" }}>
      <h3 className="text-sm font-semibold text-gray-300 mb-4">High-Risk Alerts Over Time</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6B7280", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#EF4444" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
