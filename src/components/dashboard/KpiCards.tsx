"use client";

import { useEffect, useState } from "react";
import { Users, ArrowLeftRight, Shuffle, AlertTriangle, Network } from "lucide-react";
import type { DashboardKPIs } from "@/types";

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}

function KpiCard({ label, value, icon, color, suffix }: KpiCardProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplayed(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3"
      style={{ background: "#111827", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-white">{displayed.toLocaleString()}</span>
        {suffix && <span className="text-sm text-gray-500 mb-1">{suffix}</span>}
      </div>
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: DashboardKPIs }) {
  const cards = [
    {
      label: "Total Customers",
      value: kpis.totalCustomers,
      icon: <Users className="w-4 h-4" />,
      color: "#2563EB",
    },
    {
      label: "Transactions (30d)",
      value: kpis.totalTransactions,
      icon: <ArrowLeftRight className="w-4 h-4" />,
      color: "#14B8A6",
    },
    {
      label: "Exchange Exposed",
      value: kpis.exchangeExposedCustomers,
      icon: <Shuffle className="w-4 h-4" />,
      color: "#F59E0B",
    },
    {
      label: "High-Risk Entities",
      value: kpis.highRiskCustomers,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "#EF4444",
    },
    {
      label: "Networks Detected",
      value: kpis.networksDetected,
      icon: <Network className="w-4 h-4" />,
      color: "#8B5CF6",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} />
      ))}
    </div>
  );
}
