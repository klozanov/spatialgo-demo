import { getAllRiskResults } from "@/lib/riskEngine.v2";
import { customerById } from "@/lib/dataStore";
import { EvidenceExplorerClient } from "./EvidenceExplorerClient";

export default function EvidencePage() {
  const allResults = getAllRiskResults();

  const allEvidence = Array.from(allResults.values()).flatMap((r) =>
    r.evidenceItems.map((ev) => ({
      ...ev,
      customerName: customerById.get(ev.customerId)?.name ?? ev.customerId,
      customerScore: r.score,
      customerBand: r.band,
    }))
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Evidence Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {allEvidence.length} evidence items across all entities — search, filter, and investigate
        </p>
      </div>
      <EvidenceExplorerClient evidenceItems={allEvidence} />
    </div>
  );
}
