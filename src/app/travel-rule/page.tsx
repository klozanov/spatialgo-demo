import {
  transactions,
  customerById,
  walletsById,
  clustersById,
} from "@/lib/dataStore";
import type { TravelRuleRow } from "@/types";
import { TravelRuleClient } from "./TravelRuleClient";

export default function TravelRulePage() {
  const onchainTxs = transactions.filter((t) => t.type === "ONCHAIN");

  const rows: TravelRuleRow[] = onchainTxs.map((tx) => {
    const customer = customerById.get(tx.fromCustomerId);
    const wallet = tx.walletId ? walletsById.get(tx.walletId) : null;
    const cluster = tx.clusterId ? clustersById.get(tx.clusterId) : null;

    let status: TravelRuleRow["status"] = "COMPLIANT";
    let reason = "Originator data present, low-risk destination";

    if (!customer) {
      status = "NON_COMPLIANT";
      reason = "Missing originator data — customer not resolved";
    } else if (cluster?.riskLevel === "HIGH") {
      status = "NON_COMPLIANT";
      reason = `Beneficiary wallet linked to HIGH-risk cluster: ${cluster.tag}`;
    } else if (!wallet) {
      status = "UNKNOWN";
      reason = "Wallet data missing — cannot verify beneficiary";
    } else if (cluster?.riskLevel === "MEDIUM") {
      status = "UNKNOWN";
      reason = `Beneficiary wallet linked to MEDIUM-risk cluster: ${cluster.tag}`;
    }

    return {
      txId: tx.id,
      customerId: tx.fromCustomerId,
      customerName: customer?.name ?? "Unknown",
      amount: tx.amount,
      walletAddress: wallet?.address ?? "N/A",
      clusterId: tx.clusterId ?? null,
      clusterTag: cluster?.tag ?? null,
      clusterRisk: cluster?.riskLevel ?? null,
      status,
      reason,
    };
  });

  const total = rows.length;
  const compliant = rows.filter((r) => r.status === "COMPLIANT").length;
  const nonCompliant = rows.filter((r) => r.status === "NON_COMPLIANT").length;
  const unknown = rows.filter((r) => r.status === "UNKNOWN").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Travel Rule Compliance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          FATF Travel Rule evaluation for all on-chain transactions ·{" "}
          {total} records
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-foreground">{total}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Total ONCHAIN Txs
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-emerald-400">{compliant}</div>
          <div className="text-xs text-muted-foreground mt-1">Compliant</div>
          <div className="text-xs text-emerald-400 mt-0.5">
            {total > 0 ? Math.round((compliant / total) * 100) : 0}%
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-red-400">{nonCompliant}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Non-Compliant
          </div>
          <div className="text-xs text-red-400 mt-0.5">
            {total > 0 ? Math.round((nonCompliant / total) * 100) : 0}%
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-amber-400">{unknown}</div>
          <div className="text-xs text-muted-foreground mt-1">Unknown</div>
          <div className="text-xs text-amber-400 mt-0.5">
            {total > 0 ? Math.round((unknown / total) * 100) : 0}%
          </div>
        </div>
      </div>

      <TravelRuleClient rows={rows} />
    </div>
  );
}
