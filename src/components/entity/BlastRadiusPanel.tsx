"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PropagatedEntity, PropagationType } from "@/lib/riskPropagation";
import { cn, riskBandBg } from "@/lib/utils";

const PROP_TYPE_LABELS: Record<PropagationType, string> = {
  SHARED_DEVICE: "Shared Device",
  SHARED_BENEFICIARY: "Shared Beneficiary",
  NETWORK: "Network",
  EXCHANGE_OVERLAP: "Exchange Overlap",
};

const PROP_TYPE_COLORS: Record<PropagationType, string> = {
  SHARED_DEVICE: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  SHARED_BENEFICIARY: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  NETWORK: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EXCHANGE_OVERLAP: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

interface Props {
  rows: PropagatedEntity[];
}

export function BlastRadiusPanel({ rows }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<PropagationType | "ALL">("ALL");

  const filtered = rows.filter(
    (r) => filter === "ALL" || r.propagationType === filter
  );

  // Count by type
  const typeCounts = rows.reduce(
    (acc, r) => {
      acc[r.propagationType] = (acc[r.propagationType] ?? 0) + 1;
      return acc;
    },
    {} as Record<PropagationType, number>
  );

  if (rows.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No connected entities found.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Summary */}
      <div
        className="rounded-lg border p-3"
        style={{ borderColor: "var(--border)", background: "var(--muted)" }}
      >
        <div className="text-sm font-semibold text-foreground mb-1">
          {rows.length} entities elevated by association
        </div>
        <div className="text-xs text-muted-foreground">
          These entities share risk exposure with this customer through direct
          connections in the transaction network.
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("ALL")}
          className={cn(
            "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
            filter === "ALL"
              ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
              : "text-muted-foreground border-border hover:border-blue-500/30"
          )}
        >
          All ({rows.length})
        </button>
        {(Object.entries(PROP_TYPE_LABELS) as [PropagationType, string][])
          .filter(([type]) => typeCounts[type] > 0)
          .map(([type, label]) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
                filter === type
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                  : "text-muted-foreground border-border hover:border-blue-500/30"
              )}
            >
              {label} ({typeCounts[type]})
            </button>
          ))}
      </div>

      {/* Entity list */}
      <div className="space-y-2">
        {filtered.map((entity) => (
          <button
            key={entity.customerId}
            onClick={() => router.push(`/entity/${entity.customerId}`)}
            className="w-full rounded-lg border p-3 text-left hover:border-blue-500/40 transition-colors space-y-1.5"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground truncate">
                {entity.customerName}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs px-1.5 py-0.5 rounded border font-bold",
                  riskBandBg(entity.band)
                )}
              >
                {entity.riskScore}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">
                {entity.customerId}
              </span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border",
                  PROP_TYPE_COLORS[entity.propagationType]
                )}
              >
                {PROP_TYPE_LABELS[entity.propagationType]}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {entity.reason}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
