"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";

interface Props {
  exposed: number;
  notExposed: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border px-3 py-2 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="font-medium text-foreground">{payload[0].name}</div>
        <div className="text-muted-foreground">{payload[0].value} customers</div>
      </div>
    );
  }
  return null;
};

export function ExposurePie({ exposed, notExposed }: Props) {
  const { theme } = useTheme();
  const notExposedColor = theme === "dark" ? "#374151" : "#CBD5E1";

  const data = [
    { name: "Exchange Exposed", value: exposed },
    { name: "Not Exposed", value: notExposed },
  ];

  const COLORS = ["#F59E0B", notExposedColor];

  return (
    <div className="rounded-2xl p-5 border h-64" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Exchange Exposure</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
