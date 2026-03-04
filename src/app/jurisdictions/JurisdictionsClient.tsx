"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { JurisdictionRow } from "./page";
import { cn, formatCurrency } from "@/lib/utils";

interface Props {
  rows: JurisdictionRow[];
  top5: JurisdictionRow[];
}

type SortKey = "totalAmount" | "txCount" | "beneficiaryCount";

const HIGH_RISK_COLOR = "#EF4444";
const NORMAL_COLOR = "#2563EB";

export function JurisdictionsClient({ rows, top5 }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("totalAmount");
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);

  const chartData = top5.map((r) => ({
    name: r.countryCode,
    amount: Math.round(r.totalAmount),
    isHighRisk: r.isHighRisk,
  }));

  const sorted = [...rows]
    .filter((r) => !showHighRiskOnly || r.isHighRisk)
    .sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="space-y-6">
      {/* Bar chart — top jurisdictions */}
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Top Jurisdictions by Transaction Volume
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Red bars indicate high-risk jurisdictions (FATF blacklist / greylist)
          </p>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: number | undefined) => [formatCurrency(val ?? 0), "Volume"]}
                contentStyle={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isHighRisk ? HIGH_RISK_COLOR : NORMAL_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
            No jurisdiction data available
          </div>
        )}
      </div>

      {/* Note about dataset */}
      {rows.length === 1 && rows[0].countryCode === "AT" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
          <strong>Dataset Note:</strong> This synthetic demo uses Austria-only
          beneficiary IBANs (AT prefix). In a production deployment, beneficiary
          IBANs would span multiple jurisdictions, enabling cross-border risk
          exposure analysis.
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold text-foreground">
            All Jurisdictions
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showHighRiskOnly}
                onChange={(e) => setShowHighRiskOnly(e.target.checked)}
                className="rounded"
              />
              High-risk only
            </label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="text-xs bg-card border border-border rounded px-2 py-1 text-foreground"
            >
              <option value="totalAmount">Sort by Volume</option>
              <option value="txCount">Sort by TX Count</option>
              <option value="beneficiaryCount">Sort by Beneficiaries</option>
            </select>
          </div>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                Jurisdiction
              </th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">
                Risk
              </th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                Total Volume
              </th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                Transactions
              </th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                Beneficiaries
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.countryCode}
                className={cn(
                  "border-b border-border/50",
                  i % 2 === 0 ? "" : "bg-muted/10",
                  row.isHighRisk && "bg-red-500/5"
                )}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">
                      {row.countryCode}
                    </span>
                    <span className="text-muted-foreground">
                      {row.countryName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  {row.isHighRisk ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-red-500/20 text-red-400 border-red-500/30">
                      HIGH RISK
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-foreground font-medium">
                  {formatCurrency(row.totalAmount)}
                </td>
                <td className="px-4 py-2.5 text-right text-foreground">
                  {row.txCount.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right text-foreground">
                  {row.beneficiaryCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No jurisdiction data found.
          </div>
        )}
      </div>
    </div>
  );
}
