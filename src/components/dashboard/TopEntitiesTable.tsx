"use client";

import { useRouter } from "next/navigation";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatDateTime } from "@/lib/utils";
import type { Customer, RiskResult } from "@/types";

interface Row {
  customer: Customer;
  result: RiskResult;
}

interface Props {
  rows: Row[];
}

export function TopEntitiesTable({ rows }: Props) {
  const router = useRouter();

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "#111827", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <h3 className="text-sm font-semibold text-gray-300">Top 15 Risky Entities</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Customer ID", "Name", "Segment", "Risk Score", "Exchange Exp.", "Network Size", "Last Activity"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ customer, result }) => (
              <tr
                key={customer.id}
                onClick={() => router.push(`/entity/${customer.id}`)}
                className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <td className="px-4 py-3 font-mono text-xs text-blue-400">{customer.id}</td>
                <td className="px-4 py-3 text-gray-200 font-medium">{customer.name}</td>
                <td className="px-4 py-3 text-gray-400">{customer.segment}</td>
                <td className="px-4 py-3">
                  <RiskBadge band={result.band} score={result.score} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <span className={result.exchangeTxCount > 0 ? "text-amber-400" : "text-gray-500"}>
                    {result.exchangeTxCount > 0 ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{result.networkSize}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {result.lastSuspiciousActivity ? formatDateTime(result.lastSuspiciousActivity) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
