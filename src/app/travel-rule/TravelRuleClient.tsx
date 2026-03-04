"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { TravelRuleRow, TravelRuleStatus } from "@/types";
import { cn, formatCurrency, truncate } from "@/lib/utils";

const STATUS_STYLES: Record<TravelRuleStatus, string> = {
  COMPLIANT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  NON_COMPLIANT: "bg-red-500/20 text-red-400 border-red-500/30",
  UNKNOWN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const CLUSTER_RISK_COLOR: Record<string, string> = {
  HIGH: "text-red-400",
  MEDIUM: "text-amber-400",
  LOW: "text-emerald-400",
};

interface Props {
  rows: TravelRuleRow[];
}

export function TravelRuleClient({ rows }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<TravelRuleStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.txId.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerId.toLowerCase().includes(q) ||
          r.walletAddress.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filter, search]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {(["ALL", "COMPLIANT", "NON_COMPLIANT", "UNKNOWN"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  filter === s
                    ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                    : "text-muted-foreground border-border hover:border-blue-500/30"
                )}
              >
                {s.replace("_", " ")}
              </button>
            )
          )}
        </div>
        <input
          type="text"
          placeholder="Search by ID, customer, wallet…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto px-3 py-1.5 text-xs rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {rows.length} transactions
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                TX ID
              </th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                Customer
              </th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                Amount
              </th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                Wallet
              </th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                Cluster
              </th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">
                Status
              </th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((row, i) => (
              <tr
                key={row.txId}
                className={cn(
                  "border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors",
                  i % 2 === 0 ? "" : "bg-muted/10"
                )}
                onClick={() => router.push(`/entity/${row.customerId}`)}
              >
                <td className="px-4 py-2.5 font-mono text-muted-foreground">
                  {row.txId}
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-foreground font-medium">
                    {row.customerName}
                  </div>
                  <div className="text-muted-foreground font-mono">
                    {row.customerId}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-foreground font-medium">
                  {formatCurrency(row.amount)}
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground max-w-[120px]">
                  <span title={row.walletAddress}>
                    {row.walletAddress !== "N/A"
                      ? `${row.walletAddress.slice(0, 8)}…`
                      : "N/A"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {row.clusterTag ? (
                    <div>
                      <span
                        className={
                          CLUSTER_RISK_COLOR[row.clusterRisk ?? "LOW"]
                        }
                      >
                        {row.clusterTag}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        ({row.clusterRisk})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                      STATUS_STYLES[row.status]
                    )}
                  >
                    {row.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground max-w-[200px]">
                  {truncate(row.reason, 60)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No records match the current filters.
          </div>
        )}
        {filtered.length > 200 && (
          <div className="text-center py-3 text-muted-foreground text-xs border-t">
            Showing first 200 of {filtered.length} records
          </div>
        )}
      </div>
    </div>
  );
}
