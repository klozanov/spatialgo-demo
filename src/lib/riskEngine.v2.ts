import type { EvidenceItem, RiskBand, RiskDriver, RiskResult } from "@/types";
import { detectTypologies } from "@/lib/typologyEngine";
import {
  customers,
  transactionsByCustomerId,
  clustersById,
  exchangesById,
  beneficiariesByCustomerId,
  devicesByCustomerId,
  beneficiaries,
} from "@/lib/dataStore";
import {
  getNetworkSize,
  getSharedDeviceCount,
  getSharedBeneficiaryCount,
  networkComponents,
  componentByCustomerId,
} from "@/lib/networkAnalysis";

function riskBand(score: number): RiskBand {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function evidenceSeverity(points: number): RiskBand {
  if (points >= 15) return "HIGH";
  if (points >= 8) return "MEDIUM";
  return "LOW";
}

// ─── Core scoring function ────────────────────────────────────────────────────

export function computeRiskScore(customerId: string): RiskResult {
  const txs = transactionsByCustomerId.get(customerId) ?? [];
  const evidenceItems: EvidenceItem[] = [];
  const primaryDrivers: RiskDriver[] = [];
  let score = 0;
  let evidenceIdx = 1;

  function addEvidence(
    type: EvidenceItem["type"],
    severity: RiskBand,
    title: string,
    description: string,
    relatedNodeIds: string[],
    relatedTransactionIds: string[],
    timestamp: string
  ) {
    evidenceItems.push({
      id: `EV-${customerId}-${String(evidenceIdx).padStart(3, "0")}`,
      customerId,
      severity,
      title,
      description,
      relatedNodeIds,
      relatedTransactionIds,
      timestamp,
      type,
    });
    evidenceIdx++;
  }

  // ─── Exchange exposure signals ──────────────────────────────────────────────

  const sepaTxs = txs.filter((t) => t.type === "SEPA");
  const sepaToExchange = sepaTxs.filter(
    (t) => t.toEntityId.startsWith("EX-") || t.exchangeId
  );
  const sepaExchangeAmount = sepaToExchange.reduce((s, t) => s + t.amount, 0);

  // CARD to exchange
  const cardTxs = txs.filter((t) => t.type === "CARD");
  const cardToExchange = cardTxs.filter(
    (t) => t.toEntityId.startsWith("EX-") || t.exchangeId
  );
  const cardExchangeAmount = cardToExchange.reduce((s, t) => s + t.amount, 0);

  // ONCHAIN txs
  const onchainTxs = txs.filter((t) => t.type === "ONCHAIN");

  // Exchange exposure: SEPA → exchange exists
  if (sepaToExchange.length > 0) {
    score += 15;
    const exIds = [...new Set(sepaToExchange.map((t) => t.exchangeId ?? t.toEntityId))];
    addEvidence(
      "EXCHANGE_EXPOSURE",
      "MEDIUM",
      "SEPA payments to crypto exchange",
      `Customer sent ${sepaToExchange.length} SEPA transfer(s) totalling €${sepaExchangeAmount.toFixed(0)} to ${exIds.length} exchange(s).`,
      exIds,
      sepaToExchange.map((t) => t.id),
      sepaToExchange[sepaToExchange.length - 1].timestamp
    );
    primaryDrivers.push({ label: "SEPA→Exchange", points: 15, description: `${sepaToExchange.length} SEPA transfers to exchanges` });
  }

  if (sepaToExchange.length >= 3) {
    score += 10;
    addEvidence(
      "EXCHANGE_EXPOSURE",
      "HIGH",
      "High frequency SEPA-to-exchange transfers",
      `${sepaToExchange.length} separate SEPA transfers to exchanges detected — indicates structured layering pattern.`,
      [...new Set(sepaToExchange.map((t) => t.exchangeId ?? t.toEntityId))],
      sepaToExchange.map((t) => t.id),
      sepaToExchange[sepaToExchange.length - 1].timestamp
    );
    primaryDrivers.push({ label: "SEPA frequency ≥3", points: 10, description: "Repeated SEPA-to-exchange transfers" });
  }

  if (sepaExchangeAmount >= 20000) {
    score += 10;
    addEvidence(
      "EXCHANGE_EXPOSURE",
      "HIGH",
      `Large SEPA-to-exchange volume (€${sepaExchangeAmount.toFixed(0)})`,
      `Total SEPA amount sent to exchanges exceeds €20,000 threshold.`,
      [...new Set(sepaToExchange.map((t) => t.exchangeId ?? t.toEntityId))],
      sepaToExchange.map((t) => t.id),
      sepaToExchange[sepaToExchange.length - 1].timestamp
    );
    primaryDrivers.push({ label: `SEPA amount ≥€20k`, points: 10, description: `€${sepaExchangeAmount.toFixed(0)} to exchanges` });
  }

  // ─── Card-to-exchange signals ───────────────────────────────────────────────

  if (cardToExchange.length > 0) {
    score += 10;
    const exIds = [...new Set(cardToExchange.map((t) => t.exchangeId ?? t.toEntityId))];
    addEvidence(
      "CARD_EXCHANGE",
      "MEDIUM",
      "Card payments to crypto exchange",
      `${cardToExchange.length} card transaction(s) directed to crypto exchange(s). Total: €${cardExchangeAmount.toFixed(0)}.`,
      exIds,
      cardToExchange.map((t) => t.id),
      cardToExchange[cardToExchange.length - 1].timestamp
    );
    primaryDrivers.push({ label: "CARD→Exchange", points: 10, description: `${cardToExchange.length} card txs to exchanges` });
  }

  if (cardToExchange.length >= 2) {
    score += 5;
    addEvidence(
      "CARD_EXCHANGE",
      "MEDIUM",
      "Repeated card-to-exchange activity",
      `${cardToExchange.length} card-to-exchange transactions detected.`,
      [...new Set(cardToExchange.map((t) => t.exchangeId ?? t.toEntityId))],
      cardToExchange.map((t) => t.id),
      cardToExchange[cardToExchange.length - 1].timestamp
    );
  }

  if (cardExchangeAmount >= 5000) {
    score += 5;
    addEvidence(
      "CARD_EXCHANGE",
      "MEDIUM",
      `Large card-to-exchange volume (€${cardExchangeAmount.toFixed(0)})`,
      `Card payments to exchanges exceed €5,000 threshold.`,
      [...new Set(cardToExchange.map((t) => t.exchangeId ?? t.toEntityId))],
      cardToExchange.map((t) => t.id),
      cardToExchange[cardToExchange.length - 1].timestamp
    );
    primaryDrivers.push({ label: `CARD amount ≥€5k`, points: 5, description: `€${cardExchangeAmount.toFixed(0)} via card to exchanges` });
  }

  // ─── On-chain risk signals ──────────────────────────────────────────────────

  const highRiskOnchain = onchainTxs.filter((t) => {
    if (!t.clusterId) return false;
    const cluster = clustersById.get(t.clusterId);
    return cluster?.riskLevel === "HIGH";
  });

  if (highRiskOnchain.length > 0) {
    score += 20;
    const clusterIds = [...new Set(highRiskOnchain.map((t) => t.clusterId!))];
    const clusterTags = clusterIds.map((cid) => clustersById.get(cid)?.tag ?? cid).join(", ");
    addEvidence(
      "ONCHAIN_RISK",
      "HIGH",
      "On-chain exposure to high-risk cluster",
      `${highRiskOnchain.length} ONCHAIN transaction(s) linked to HIGH-risk cluster(s): ${clusterTags}. Direct exposure to mixer/ransomware infrastructure.`,
      [...clusterIds, ...highRiskOnchain.map((t) => t.walletId ?? t.toEntityId)],
      highRiskOnchain.map((t) => t.id),
      highRiskOnchain[highRiskOnchain.length - 1].timestamp
    );
    primaryDrivers.push({ label: "High-risk cluster", points: 20, description: `Exposure to: ${clusterTags}` });
  }

  if (onchainTxs.length >= 2) {
    score += 5;
    addEvidence(
      "ONCHAIN_RISK",
      "LOW",
      "Multiple on-chain transactions",
      `${onchainTxs.length} on-chain transactions detected — elevated blockchain activity.`,
      [...new Set(onchainTxs.map((t) => t.walletId ?? t.toEntityId))],
      onchainTxs.map((t) => t.id),
      onchainTxs[onchainTxs.length - 1].timestamp
    );
  }

  // ─── Layering / payout behavior ────────────────────────────────────────────

  const payoutTxs = txs.filter((t) => t.type === "PAYOUT");

  // PAYOUT count ≥ 3 within 72h after any exchange out
  const exchangeOutTimestamps = [...sepaToExchange, ...onchainTxs].map((t) =>
    new Date(t.timestamp).getTime()
  );

  if (exchangeOutTimestamps.length > 0) {
    const sortedExOutTs = exchangeOutTimestamps.sort((a, b) => a - b);
    for (const exOutTs of sortedExOutTs) {
      const payoutsAfter = payoutTxs.filter((t) => {
        const ts = new Date(t.timestamp).getTime();
        return ts >= exOutTs && ts <= exOutTs + 72 * 3600 * 1000;
      });
      if (payoutsAfter.length >= 3) {
        score += 10;
        const benIds = [...new Set(payoutsAfter.map((t) => t.toEntityId))];
        addEvidence(
          "LAYERING",
          "HIGH",
          "Rapid payout distribution after exchange activity",
          `${payoutsAfter.length} PAYOUT transactions within 72 hours of exchange activity — classic layering pattern.`,
          benIds,
          payoutsAfter.map((t) => t.id),
          payoutsAfter[payoutsAfter.length - 1].timestamp
        );
        primaryDrivers.push({ label: "Layering pattern", points: 10, description: `${payoutsAfter.length} payouts within 72h of exchange out` });
        break;
      }
    }
  }

  // PAYOUT to beneficiaries shared by ≥ 3 customers
  const customerBeneficiaries = beneficiariesByCustomerId.get(customerId) ?? [];
  const sharedBeneficiaries = customerBeneficiaries.filter(
    (b) => b.linkedCustomerIds.length >= 3
  );

  if (sharedBeneficiaries.length > 0) {
    score += 10;
    addEvidence(
      "LAYERING",
      "HIGH",
      "Payments to shared beneficiary accounts",
      `${sharedBeneficiaries.length} beneficiary account(s) shared with ≥3 customers — indicates mule network.`,
      sharedBeneficiaries.map((b) => b.id),
      payoutTxs
        .filter((t) => sharedBeneficiaries.some((b) => b.id === t.toEntityId))
        .map((t) => t.id),
      payoutTxs.length > 0 ? payoutTxs[payoutTxs.length - 1].timestamp : new Date().toISOString()
    );
    primaryDrivers.push({ label: "Shared beneficiaries", points: 10, description: `${sharedBeneficiaries.length} beneficiary(s) shared with ≥3 customers` });
  }

  // ─── Network signals ────────────────────────────────────────────────────────

  const sharedDeviceCount = getSharedDeviceCount(customerId);
  if (sharedDeviceCount >= 2) {
    score += 10;
    const deviceList = devicesByCustomerId.get(customerId) ?? [];
    addEvidence(
      "NETWORK",
      "HIGH",
      "Shared device fingerprint with multiple customers",
      `Device shared with ${sharedDeviceCount} other customer(s) — strong indicator of coordinated mule operation.`,
      deviceList.map((d) => d.id),
      [],
      txs.length > 0 ? txs[txs.length - 1].timestamp : new Date().toISOString()
    );
    primaryDrivers.push({ label: "Shared device", points: 10, description: `Device shared with ${sharedDeviceCount} other customers` });
  }

  const sharedBenCount = getSharedBeneficiaryCount(customerId);
  if (sharedBenCount >= 2) {
    score += 10;
    const sharedBens = customerBeneficiaries.filter(
      (b) => b.linkedCustomerIds.length >= 3
    );
    addEvidence(
      "NETWORK",
      "HIGH",
      "Shared beneficiary overlap with ≥2 other customers",
      `${sharedBenCount} beneficiary account(s) overlap with ≥2 other customers — indicates network coordination.`,
      sharedBens.map((b) => b.id),
      [],
      txs.length > 0 ? txs[txs.length - 1].timestamp : new Date().toISOString()
    );
  }

  const networkSize = getNetworkSize(customerId);
  if (networkSize >= 6) {
    score += 10;
    addEvidence(
      "NETWORK",
      "HIGH",
      `Member of large network (${networkSize} nodes)`,
      `Customer belongs to a connected network of ${networkSize} entities — high-confidence mule ring indicator.`,
      [],
      [],
      txs.length > 0 ? txs[txs.length - 1].timestamp : new Date().toISOString()
    );
    primaryDrivers.push({ label: `Network size ${networkSize}`, points: 10, description: `Member of ${networkSize}-node ring` });
  }

  // Component has ≥ 3 HIGH entities — computed post-hoc; skip for now to avoid circular dep

  // ─── Velocity signals ───────────────────────────────────────────────────────

  let velocityFlag = false;

  // Exchange out → ONCHAIN within 24h
  for (const exTx of sepaToExchange) {
    const exTs = new Date(exTx.timestamp).getTime();
    const onchainSoon = onchainTxs.filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return ts >= exTs && ts <= exTs + 24 * 3600 * 1000;
    });
    if (onchainSoon.length > 0) {
      score += 5;
      velocityFlag = true;
      addEvidence(
        "VELOCITY",
        "MEDIUM",
        "Rapid exchange-out to on-chain within 24h",
        `On-chain transaction detected within 24 hours of SEPA exchange transfer — velocity indicator.`,
        onchainSoon.map((t) => t.walletId ?? t.toEntityId),
        [exTx.id, ...onchainSoon.map((t) => t.id)],
        onchainSoon[0].timestamp
      );
      break;
    }
  }

  // Exchange out → PAYOUT within 48h
  for (const exTx of [...sepaToExchange, ...onchainTxs]) {
    const exTs = new Date(exTx.timestamp).getTime();
    const payoutsSoon = payoutTxs.filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return ts >= exTs && ts <= exTs + 48 * 3600 * 1000;
    });
    if (payoutsSoon.length > 0) {
      score += 5;
      velocityFlag = true;
      addEvidence(
        "VELOCITY",
        "MEDIUM",
        "Rapid payout after exchange activity (within 48h)",
        `${payoutsSoon.length} payout(s) within 48 hours of exchange transaction — fast-moving funds.`,
        payoutsSoon.map((t) => t.toEntityId),
        [exTx.id, ...payoutsSoon.map((t) => t.id)],
        payoutsSoon[payoutsSoon.length - 1].timestamp
      );
      break;
    }
  }

  // ─── Finalize ───────────────────────────────────────────────────────────────

  score = Math.min(100, score);

  // Sort evidence by severity
  const severityOrder: Record<RiskBand, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  evidenceItems.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  // Last suspicious activity
  const suspiciousTs = evidenceItems
    .flatMap((e) => e.relatedTransactionIds)
    .map((tid) => {
      const tx = txs.find((t) => t.id === tid);
      return tx ? tx.timestamp : null;
    })
    .filter(Boolean) as string[];

  const lastSuspiciousActivity =
    suspiciousTs.length > 0
      ? suspiciousTs.sort((a, b) => b.localeCompare(a))[0]
      : null;

  // Top 5 primary drivers by points
  const topDrivers = primaryDrivers
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  return {
    customerId,
    score,
    band: riskBand(score),
    evidenceItems,
    primaryDrivers: topDrivers,
    exchangeTxCount: sepaToExchange.length + cardToExchange.length,
    exchangeTxAmount: sepaExchangeAmount + cardExchangeAmount,
    cardToExchangeCount: cardToExchange.length,
    cardToExchangeAmount: cardExchangeAmount,
    onchainTxCount: onchainTxs.length,
    sharedDeviceCount,
    sharedBeneficiaryCount: sharedBenCount,
    velocityFlag,
    networkSize,
    lastSuspiciousActivity,
    typologies: [], // populated in getAllRiskResults second pass
  };
}

// ─── Singleton: all risk results ─────────────────────────────────────────────

let _allRiskResults: Map<string, RiskResult> | null = null;

export function getAllRiskResults(): Map<string, RiskResult> {
  if (_allRiskResults) return _allRiskResults;
  _allRiskResults = new Map();
  for (const customer of customers) {
    _allRiskResults.set(customer.id, computeRiskScore(customer.id));
  }

  // Second pass: detect typologies for each result
  for (const [customerId, result] of _allRiskResults.entries()) {
    result.typologies = detectTypologies(customerId, result);
  }

  // Third pass: fill highRiskCount in network components
  for (const comp of networkComponents) {
    let highCount = 0;
    for (const cid of comp.customerIds) {
      const result = _allRiskResults.get(cid);
      if (result?.band === "HIGH") highCount++;
    }
    comp.highRiskCount = highCount;

    // Add network +5 if component has ≥ 3 HIGH entities
    if (highCount >= 3) {
      for (const cid of comp.customerIds) {
        const result = _allRiskResults.get(cid);
        if (result) {
          result.score = Math.min(100, result.score + 5);
          result.band = result.score >= 70 ? "HIGH" : result.score >= 40 ? "MEDIUM" : "LOW";
        }
      }
    }

    // Fill top exchanges for the component
    const exchangeSet = new Set<string>();
    for (const cid of comp.customerIds) {
      const ctxs = transactionsByCustomerId.get(cid) ?? [];
      for (const tx of ctxs) {
        if (tx.exchangeId) exchangeSet.add(tx.exchangeId);
        if (tx.toEntityId.startsWith("EX-")) exchangeSet.add(tx.toEntityId);
      }
    }
    comp.topExchanges = Array.from(exchangeSet).slice(0, 3);
  }

  return _allRiskResults;
}

export function getRiskResult(customerId: string): RiskResult {
  return getAllRiskResults().get(customerId) ?? computeRiskScore(customerId);
}
