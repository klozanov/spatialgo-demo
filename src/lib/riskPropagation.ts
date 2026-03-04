import type { RiskResult, RiskBand } from "@/types";
import {
  devices,
  beneficiaries,
  customerById,
  transactionsByCustomerId,
} from "@/lib/dataStore";
import { componentByCustomerId } from "@/lib/networkAnalysis";

export type PropagationType =
  | "SHARED_DEVICE"
  | "SHARED_BENEFICIARY"
  | "NETWORK"
  | "EXCHANGE_OVERLAP";

export interface PropagatedEntity {
  customerId: string;
  customerName: string;
  riskScore: number;
  band: RiskBand;
  reason: string;
  propagationType: PropagationType;
}

export function computeBlastRadius(
  sourceCustomerId: string,
  allResults: Map<string, RiskResult>
): PropagatedEntity[] {
  const elevated = new Map<string, PropagatedEntity>();

  // 1. Shared device customers
  for (const device of devices) {
    if (!device.linkedCustomerIds.includes(sourceCustomerId)) continue;
    for (const cid of device.linkedCustomerIds) {
      if (cid === sourceCustomerId || elevated.has(cid)) continue;
      const result = allResults.get(cid);
      if (!result) continue;
      elevated.set(cid, {
        customerId: cid,
        customerName: customerById.get(cid)?.name ?? cid,
        riskScore: result.score,
        band: result.band,
        reason: `Shares device fingerprint (${device.id})`,
        propagationType: "SHARED_DEVICE",
      });
    }
  }

  // 2. Shared beneficiary customers
  for (const ben of beneficiaries) {
    if (!ben.linkedCustomerIds.includes(sourceCustomerId)) continue;
    for (const cid of ben.linkedCustomerIds) {
      if (cid === sourceCustomerId || elevated.has(cid)) continue;
      const result = allResults.get(cid);
      if (!result) continue;
      elevated.set(cid, {
        customerId: cid,
        customerName: customerById.get(cid)?.name ?? cid,
        riskScore: result.score,
        band: result.band,
        reason: `Shares beneficiary account ${ben.id} (${ben.label})`,
        propagationType: "SHARED_BENEFICIARY",
      });
    }
  }

  // 3. Network component membership
  const sourceComponent = componentByCustomerId.get(sourceCustomerId);
  if (sourceComponent) {
    for (const cid of sourceComponent.customerIds) {
      if (cid === sourceCustomerId || elevated.has(cid)) continue;
      const result = allResults.get(cid);
      if (!result) continue;
      elevated.set(cid, {
        customerId: cid,
        customerName: customerById.get(cid)?.name ?? cid,
        riskScore: result.score,
        band: result.band,
        reason: `Network member of ${sourceComponent.id} (${sourceComponent.size} entities)`,
        propagationType: "NETWORK",
      });
    }
  }

  // 4. Exchange overlap (other customers using the same exchange)
  const sourceTxs = transactionsByCustomerId.get(sourceCustomerId) ?? [];
  const sourceExchanges = new Set(
    sourceTxs.filter((t) => t.exchangeId).map((t) => t.exchangeId!)
  );

  if (sourceExchanges.size > 0) {
    for (const [cid, result] of allResults.entries()) {
      if (cid === sourceCustomerId || elevated.has(cid)) continue;
      const cTxs = transactionsByCustomerId.get(cid) ?? [];
      const sharedExchanges = [
        ...new Set(
          cTxs
            .filter((t) => t.exchangeId && sourceExchanges.has(t.exchangeId))
            .map((t) => t.exchangeId!)
        ),
      ];
      if (sharedExchanges.length > 0) {
        elevated.set(cid, {
          customerId: cid,
          customerName: customerById.get(cid)?.name ?? cid,
          riskScore: result.score,
          band: result.band,
          reason: `Shared exchange exposure: ${sharedExchanges.join(", ")}`,
          propagationType: "EXCHANGE_OVERLAP",
        });
      }
    }
  }

  return Array.from(elevated.values())
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 20);
}
