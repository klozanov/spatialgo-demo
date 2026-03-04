import { getAllRiskResults } from "@/lib/riskEngine.v2";
import { customerById } from "@/lib/dataStore";
import type { Alert } from "@/types";
import { AlertsClient } from "./AlertsClient";

export default function AlertsPage() {
  const allResults = getAllRiskResults();

  const alerts: Alert[] = [];

  for (const result of allResults.values()) {
    const customer = customerById.get(result.customerId);
    if (!customer) continue;

    for (const ev of result.evidenceItems) {
      if (ev.severity === "LOW") continue;
      alerts.push({
        id: ev.id,
        customerId: result.customerId,
        customerName: customer.name,
        severity: ev.severity,
        typologyLabels: result.typologies,
        title: ev.title,
        description: ev.description,
        timestamp: ev.timestamp,
        riskScore: result.score,
      });
    }
  }

  // Sort: HIGH first, then by timestamp descending
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "HIGH" ? -1 : 1;
    }
    return b.timestamp.localeCompare(a.timestamp);
  });

  const highCount = alerts.filter((a) => a.severity === "HIGH").length;
  const mediumCount = alerts.filter((a) => a.severity === "MEDIUM").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Alert Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {alerts.length} active alerts — {highCount} HIGH · {mediumCount} MEDIUM
        </p>
      </div>
      <AlertsClient alerts={alerts} />
    </div>
  );
}
