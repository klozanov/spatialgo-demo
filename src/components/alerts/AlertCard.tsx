"use client";

import { useRouter } from "next/navigation";
import type { Alert } from "@/types";
import { cn, formatDateTime, riskBandBg, truncate } from "@/lib/utils";

const TYPOLOGY_COLORS: Record<string, string> = {
  Structuring: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Layering: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Trade-Based ML": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Smurfing: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Exchange Arbitrage": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Mixer Laundering": "bg-red-600/20 text-red-300 border-red-600/30",
  None: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface Props {
  alert: Alert;
}

export function AlertCard({ alert }: Props) {
  const router = useRouter();

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 hover:border-blue-500/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
              riskBandBg(alert.severity)
            )}
          >
            {alert.severity}
          </span>
          {alert.typologyLabels
            .filter((t) => t !== "None")
            .map((t) => (
              <span
                key={t}
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs border",
                  TYPOLOGY_COLORS[t] ?? TYPOLOGY_COLORS["None"]
                )}
              >
                {t}
              </span>
            ))}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDateTime(alert.timestamp)}
        </span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">
            {alert.title}
          </span>
          <span className="text-xs text-muted-foreground">
            · Risk {alert.riskScore}/100
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {truncate(alert.description, 140)}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {alert.customerName} ·{" "}
          <span className="font-mono">{alert.customerId}</span>
        </span>
        <button
          onClick={() => router.push(`/entity/${alert.customerId}`)}
          className="text-xs px-3 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors font-medium"
        >
          Investigate →
        </button>
      </div>
    </div>
  );
}
