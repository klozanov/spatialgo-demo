"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  exposed: number;
  notExposed: number;
}

const COLORS = ["#F59E0B", "#1F2937"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border px-3 py-2 text-sm" style={{ background: "#1F2937", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="font-medium text-white">{payload[0].name}</div>
        <div className="text-gray-400">{payload[0].value} customers</div>
      </div>
    );
  }
  return null;
};

export function ExposurePie({ exposed, notExposed }: Props) {
  const data = [
    { name: "Exchange Exposed", value: exposed },
    { name: "Not Exposed", value: notExposed },
  ];

  return (
    <div className="rounded-2xl p-5 border h-64" style={{ background: "#111827", borderColor: "rgba(255,255,255,0.07)" }}>
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Exchange Exposure</h3>
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
            formatter={(value) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
