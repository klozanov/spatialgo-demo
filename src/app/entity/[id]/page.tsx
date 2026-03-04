import { notFound } from "next/navigation";
import { customerById } from "@/lib/dataStore";
import { getRiskResult, getAllRiskResults } from "@/lib/riskEngine.v2";
import { buildEntityGraph } from "@/lib/graphBuilder.v2";
import { computeBlastRadius } from "@/lib/riskPropagation";
import { EntityInvestigationClient } from "./EntityInvestigationClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EntityPage({ params }: Props) {
  const { id } = await params;
  const customer = customerById.get(id);
  if (!customer) notFound();

  const allResults = getAllRiskResults();
  const riskResult = allResults.get(id) ?? getRiskResult(id);
  const graphData = buildEntityGraph(id);
  const blastRadiusRows = computeBlastRadius(id, allResults);

  return (
    <EntityInvestigationClient
      customer={customer}
      riskResult={riskResult}
      graphNodes={graphData.nodes}
      graphEdges={graphData.edges}
      suspiciousNodeIds={Array.from(graphData.suspiciousNodeIds)}
      suspiciousEdgeIds={Array.from(graphData.suspiciousEdgeIds)}
      blastRadiusRows={blastRadiusRows}
    />
  );
}
