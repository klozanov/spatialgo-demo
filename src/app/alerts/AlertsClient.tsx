"use client";

import { useState, useMemo } from "react";
import type { Alert, TypologyLabel } from "@/types";
import { AlertCard } from "@/components/alerts/AlertCard";
import { cn } from "@/lib/utils";

const TYPOLOGIES: TypologyLabel[] = [
  "Structuring",
  "Layering",
  "Trade-Based ML",
  "Smurfing",
  "Exchange Arbitrage",
  "Mixer Laundering",
];

type SeverityFilter = "ALL" | "HIGH" | "MEDIUM";

interface Props {
  alerts: Alert[];
}

export function AlertsClient({ alerts }: Props) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [typologyFilter, setTypologyFilter] = useState<TypologyLabel | "ALL">(
    "ALL"
  );

  const highCount = alerts.filter((a) => a.severity === "HIGH").length;
  const mediumCount = alerts.filter((a) => a.severity === "MEDIUM").length;

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== "ALL" && a.severity !== severityFilter)
        return false;
      if (
        typologyFilter !== "ALL" &&
        !a.typologyLabels.includes(typologyFilter)
      )
        return false;
      return true;
    });
  }, [alerts, severityFilter, typologyFilter]);

  // Get active typologies from the data
  const activeTypologies = useMemo(() => {
    const seen = new Set<TypologyLabel>();
    for (const a of alerts) {
      for (const t of a.typologyLabels) {
        if (t !== "None") seen.add(t);
      }
    }
    return TYPOLOGIES.filter((t) => seen.has(t));
  }, [alerts]);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-foreground">
            {alerts.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total Alerts</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-red-400">{highCount}</div>
          <div className="text-xs text-muted-foreground mt-1">HIGH Severity</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-amber-400">{mediumCount}</div>
          <div className="text-xs text-muted-foreground mt-1">
            MEDIUM Severity
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">
          Severity:
        </span>
        {(["ALL", "HIGH", "MEDIUM"] as SeverityFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              severityFilter === s
                ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                : "text-muted-foreground border-border hover:border-blue-500/30"
            )}
          >
            {s}
          </button>
        ))}
        <span className="text-xs text-muted-foreground font-medium ml-2">
          Typology:
        </span>
        <button
          onClick={() => setTypologyFilter("ALL")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            typologyFilter === "ALL"
              ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
              : "text-muted-foreground border-border hover:border-blue-500/30"
          )}
        >
          ALL
        </button>
        {activeTypologies.map((t) => (
          <button
            key={t}
            onClick={() => setTypologyFilter(t)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              typologyFilter === t
                ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                : "text-muted-foreground border-border hover:border-blue-500/30"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {alerts.length} alerts
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No alerts match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
