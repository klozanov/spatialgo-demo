import { networkComponents } from "@/lib/networkAnalysis";
import { getAllRiskResults } from "@/lib/riskEngine.v2";
import { customerById, exchangesById } from "@/lib/dataStore";
import { NetworksClient } from "./NetworksClient";
import { ClusterComparison } from "@/components/networks/ClusterComparison";

export default function NetworksPage() {
  const allResults = getAllRiskResults();

  const networks = networkComponents.map((comp) => {
    const highRiskCount = comp.customerIds.filter(
      (cid) => allResults.get(cid)?.band === "HIGH"
    ).length;
    const topScore = Math.max(
      ...comp.customerIds.map((cid) => allResults.get(cid)?.score ?? 0)
    );
    const topExchangeNames = comp.topExchanges
      .map((eid) => exchangesById.get(eid)?.name ?? eid)
      .slice(0, 3);
    const members = comp.customerIds.map((cid) => ({
      id: cid,
      name: customerById.get(cid)?.name ?? cid,
      score: allResults.get(cid)?.score ?? 0,
      band: allResults.get(cid)?.band ?? "LOW",
    }));

    return {
      ...comp,
      highRiskCount,
      topScore,
      topExchangeNames,
      members,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Detected Networks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connected components identified via shared devices, beneficiary overlap, and exchange linkages
        </p>
      </div>
      <div className="flex gap-4 text-sm">
        <div className="rounded-xl px-4 py-3 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <span className="text-muted-foreground">Total networks: </span>
          <span className="text-foreground font-bold">{networks.length}</span>
        </div>
        <div className="rounded-xl px-4 py-3 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <span className="text-muted-foreground">Large rings (≥6): </span>
          <span className="text-red-400 font-bold">{networks.filter((n) => n.size >= 6).length}</span>
        </div>
        <div className="rounded-xl px-4 py-3 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <span className="text-muted-foreground">Entities in rings: </span>
          <span className="text-amber-400 font-bold">
            {networks.reduce((s, n) => s + n.size, 0)}
          </span>
        </div>
      </div>
      <NetworksClient networks={networks} />

      <ClusterComparison
        networks={networks}
        networkComponents={networkComponents}
        allResultsEntries={Array.from(allResults.entries()).map(([k, v]) => [
          k,
          {
            score: v.score,
            band: v.band,
            typologies: v.typologies,
          },
        ])}
      />
    </div>
  );
}
