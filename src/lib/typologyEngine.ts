import type { RiskResult, TypologyLabel } from "@/types";
import {
  transactionsByCustomerId,
  clustersById,
  beneficiariesByCustomerId,
} from "@/lib/dataStore";
import { componentByCustomerId } from "@/lib/networkAnalysis";

export function detectTypologies(
  customerId: string,
  riskResult: RiskResult
): TypologyLabel[] {
  const typologies: TypologyLabel[] = [];
  const txs = transactionsByCustomerId.get(customerId) ?? [];

  // ── Rule 1: Structuring ───────────────────────────────────────────────────
  // ≥3 SEPA transfers to exchanges, each < €10,000
  const sepaToExchangeSmall = txs.filter(
    (t) =>
      t.type === "SEPA" &&
      (t.toEntityId.startsWith("EX-") || t.exchangeId) &&
      t.amount < 10_000
  );
  if (sepaToExchangeSmall.length >= 3) {
    typologies.push("Structuring");
  }

  // ── Rule 2: Layering ──────────────────────────────────────────────────────
  // LAYERING evidence type present
  const hasLayering = riskResult.evidenceItems.some(
    (e) => e.type === "LAYERING"
  );
  if (hasLayering) {
    typologies.push("Layering");
  }

  // ── Rule 3: Smurfing ──────────────────────────────────────────────────────
  // Shared beneficiary (linkedCustomerIds ≥ 3) AND in a network component
  const bens = beneficiariesByCustomerId.get(customerId) ?? [];
  const hasHighlySharedBen = bens.some((b) => b.linkedCustomerIds.length >= 3);
  const inNetwork = componentByCustomerId.has(customerId);
  if (hasHighlySharedBen && inNetwork) {
    typologies.push("Smurfing");
  }

  // ── Rule 4: Exchange Arbitrage ────────────────────────────────────────────
  // Both CARD_EXCHANGE and EXCHANGE_EXPOSURE evidence types present
  const evidenceTypes = new Set(riskResult.evidenceItems.map((e) => e.type));
  if (
    evidenceTypes.has("CARD_EXCHANGE") &&
    evidenceTypes.has("EXCHANGE_EXPOSURE")
  ) {
    typologies.push("Exchange Arbitrage");
  }

  // ── Rule 5: Mixer Laundering ──────────────────────────────────────────────
  // ONCHAIN tx to cluster with Mixer tag (MEDIUM or HIGH risk)
  const mixerOnchain = txs.filter((t) => {
    if (t.type !== "ONCHAIN" || !t.clusterId) return false;
    const cluster = clustersById.get(t.clusterId);
    return (
      cluster?.tag === "Mixer" &&
      (cluster.riskLevel === "HIGH" || cluster.riskLevel === "MEDIUM")
    );
  });
  if (mixerOnchain.length > 0) {
    typologies.push("Mixer Laundering");
  }

  // ── Rule 6: Trade-Based ML ────────────────────────────────────────────────
  // Total SEPA volume > €20,000 AND has PAYOUT to a beneficiary
  const sepaVolume = txs
    .filter((t) => t.type === "SEPA")
    .reduce((sum, t) => sum + t.amount, 0);
  const hasPayoutToBeneficiary = txs.some(
    (t) => t.type === "PAYOUT" && t.toEntityId.startsWith("B-")
  );
  if (sepaVolume > 20_000 && hasPayoutToBeneficiary) {
    typologies.push("Trade-Based ML");
  }

  return typologies.length > 0 ? typologies : ["None"];
}
