"use client";

import type { Transaction } from "@/types";
import { formatDateTime, formatCurrency } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
}

const TYPE_COLORS: Record<string, string> = {
  SEPA: "#2563EB",
  CARD: "#14B8A6",
  ONCHAIN: "#8B5CF6",
  PAYOUT: "#F59E0B",
};

const TYPE_BG: Record<string, string> = {
  SEPA: "rgba(37,99,235,0.15)",
  CARD: "rgba(20,184,166,0.15)",
  ONCHAIN: "rgba(139,92,246,0.15)",
  PAYOUT: "rgba(245,158,11,0.15)",
};

export function Timeline({ transactions }: Props) {
  // Group by date
  const sorted = [...transactions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const groups = new Map<string, Transaction[]>();
  for (const tx of sorted) {
    const date = tx.timestamp.slice(0, 10);
    const list = groups.get(date) ?? [];
    list.push(tx);
    groups.set(date, list);
  }

  const groupEntries = Array.from(groups.entries());

  return (
    <div className="p-4 space-y-5">
      {groupEntries.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-8">No transactions found</div>
      )}
      {groupEntries.map(([date, txs]) => (
        <div key={date}>
          <div className="text-xs font-semibold text-gray-500 mb-2 sticky top-0 py-1" style={{ background: "var(--background)" }}>
            {new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            <span className="ml-2 text-gray-600">({txs.length} txs)</span>
          </div>
          <div className="relative pl-4 space-y-2">
            <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ background: "var(--border)" }} />
            {txs.map((tx) => {
              const color = TYPE_COLORS[tx.type] ?? "#6B7280";
              const bg = TYPE_BG[tx.type] ?? "rgba(107,114,128,0.15)";
              return (
                <div key={tx.id} className="relative flex gap-3">
                  <div
                    className="absolute -left-4 top-2 w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <div
                    className="flex-1 rounded-lg p-2.5"
                    style={{ background: bg, border: `1px solid ${color}20` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                        {tx.type}
                      </span>
                      {tx.tag && (
                        <span className="text-[9px] text-gray-500 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                          {tx.tag}
                        </span>
                      )}
                      <span className="text-xs font-bold text-foreground ml-auto">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 truncate">
                      → {tx.toEntityId}
                    </div>
                    <div className="text-[9px] text-gray-600 mt-0.5">
                      {formatDateTime(tx.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
