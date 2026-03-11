import { getAllRiskResults } from "@/lib/riskEngine.v2";
import { customers, exchangeExposedCustomerIds, dailyTransactionBuckets, transactions } from "@/lib/dataStore";
import { networkComponents } from "@/lib/networkAnalysis";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { RiskHistogram } from "@/components/dashboard/RiskHistogram";
import { ExposurePie } from "@/components/dashboard/ExposurePie";
import { AlertsOverTime } from "@/components/dashboard/AlertsOverTime";
import { SiloVsCrossRail } from "@/components/dashboard/SiloVsCrossRail";
import { TopEntitiesTable } from "@/components/dashboard/TopEntitiesTable";
import type { DashboardKPIs, RiskHistogramBucket, DailyAlertCount } from "@/types";

export default function DashboardPage() {
  const allResults = getAllRiskResults();

  // KPIs
  const highRiskCustomers = Array.from(allResults.values()).filter((r) => r.band === "HIGH").length;
  const largeNetworks = networkComponents.filter((n) => n.size >= 6).length;

  const kpis: DashboardKPIs = {
    totalCustomers: customers.length,
    totalTransactions: transactions.length,
    exchangeExposedCustomers: exchangeExposedCustomerIds.size,
    highRiskCustomers,
    networksDetected: largeNetworks,
  };

  // Risk histogram (10-point buckets)
  const bucketMap = new Map<number, number>();
  for (let i = 0; i <= 90; i += 10) bucketMap.set(i, 0);
  for (const r of allResults.values()) {
    const bucket = Math.floor(r.score / 10) * 10;
    bucketMap.set(Math.min(bucket, 90), (bucketMap.get(Math.min(bucket, 90)) ?? 0) + 1);
  }
  const histogram: RiskHistogramBucket[] = Array.from(bucketMap.entries()).map(([start, count]) => ({
    range: `${start}–${start + 9}`,
    count,
  }));

  // Exposure pie
  const exposed = exchangeExposedCustomerIds.size;
  const notExposed = customers.length - exposed;

  // Alerts over time: daily count of HIGH evidence items
  const dailyAlertMap = new Map<string, number>();
  for (const result of allResults.values()) {
    if (result.band !== "HIGH") continue;
    for (const ev of result.evidenceItems) {
      if (ev.severity !== "HIGH") continue;
      const date = ev.timestamp.slice(0, 10);
      dailyAlertMap.set(date, (dailyAlertMap.get(date) ?? 0) + 1);
    }
  }
  const alertsOverTime: DailyAlertCount[] = Array.from(dailyAlertMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count })); // MM-DD format

  // Silo vs cross-rail widget (aggregate)
  const totalCrossRailAlerts = highRiskCustomers;
  const totalSiloAlerts = Math.round(highRiskCustomers * 3.2); // simulated: 3.2x more false positives
  const falsePositivesAvoided = totalSiloAlerts - totalCrossRailAlerts;

  // Top 15 risky entities
  const topEntities = Array.from(allResults.entries())
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 15)
    .map(([id, result]) => ({
      customer: customers.find((c) => c.id === id)!,
      result,
    }))
    .filter((row) => row.customer);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Investigation Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-rail correlation overview — {customers.length} entities · {transactions.length.toLocaleString()} transactions
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <RiskHistogram data={histogram} />
        <ExposurePie exposed={exposed} notExposed={notExposed} />
        <SiloVsCrossRail
          siloAlerts={totalSiloAlerts}
          crossRailAlerts={totalCrossRailAlerts}
          falsePositivesAvoided={falsePositivesAvoided}
        />
      </div>

      {/* Alerts over time */}
      <AlertsOverTime data={alertsOverTime} />

      {/* Top entities */}
      <TopEntitiesTable rows={topEntities} />
    </div>
  );
}
