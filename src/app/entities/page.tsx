import { getAllRiskResults } from "@/lib/riskEngine.v2";
import { customers, exchangeExposedCustomerIds } from "@/lib/dataStore";
import { EntitiesClient } from "./EntitiesClient";

export default function EntitiesPage() {
  const allResults = getAllRiskResults();

  const rows = customers.map((c) => ({
    customer: c,
    result: allResults.get(c.id)!,
    exchangeExposed: exchangeExposedCustomerIds.has(c.id),
  })).filter((r) => r.result);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Entities</h1>
        <p className="text-sm text-muted-foreground mt-1">All monitored customers — search, filter, and investigate</p>
      </div>
      <EntitiesClient rows={rows} />
    </div>
  );
}
