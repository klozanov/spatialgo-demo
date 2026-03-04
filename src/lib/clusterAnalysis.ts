import type { NetworkComponent, RiskResult, TypologyLabel } from "@/types";
import {
  devices,
  beneficiaries,
  exchangesById,
  transactionsByCustomerId,
} from "@/lib/dataStore";

export interface ClusterStats {
  networkId: string;
  size: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  topExchangeNames: string[];
  sharedDeviceCount: number;
  sharedBeneficiaryCount: number;
  topTypologies: TypologyLabel[];
  onchainClusterIds: string[];
}

export function computeClusterStats(
  component: NetworkComponent,
  allResults: Map<string, RiskResult>
): ClusterStats {
  let high = 0,
    medium = 0,
    low = 0;
  const typologyCounts = new Map<TypologyLabel, number>();
  const onchainClusters = new Set<string>();
  const memberSet = new Set(component.customerIds);

  for (const cid of component.customerIds) {
    const result = allResults.get(cid);
    if (!result) continue;

    if (result.band === "HIGH") high++;
    else if (result.band === "MEDIUM") medium++;
    else low++;

    for (const t of result.typologies ?? []) {
      if (t !== "None") {
        typologyCounts.set(t, (typologyCounts.get(t) ?? 0) + 1);
      }
    }

    const txs = transactionsByCustomerId.get(cid) ?? [];
    for (const tx of txs) {
      if (tx.clusterId) onchainClusters.add(tx.clusterId);
    }
  }

  // Shared devices: devices where ≥2 linkedCustomerIds are in this component
  const sharedDevices = devices.filter(
    (d) => d.linkedCustomerIds.filter((cid) => memberSet.has(cid)).length >= 2
  );

  // Shared beneficiaries: beneficiaries where ≥2 linkedCustomerIds are in this component
  const sharedBeneficiaries = beneficiaries.filter(
    (b) => b.linkedCustomerIds.filter((cid) => memberSet.has(cid)).length >= 2
  );

  const topTypologies = Array.from(typologyCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  const topExchangeNames = component.topExchanges
    .map((eid) => exchangesById.get(eid)?.name ?? eid)
    .slice(0, 3);

  return {
    networkId: component.id,
    size: component.size,
    highCount: high,
    mediumCount: medium,
    lowCount: low,
    topExchangeNames,
    sharedDeviceCount: sharedDevices.length,
    sharedBeneficiaryCount: sharedBeneficiaries.length,
    topTypologies,
    onchainClusterIds: Array.from(onchainClusters),
  };
}
