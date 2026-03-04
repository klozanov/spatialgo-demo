import type { RiskResult } from "@/types";

export interface SiloSimulationResult {
  cardFraudAlerts: number;
  amlAlerts: number;
  crossRailAlerts: number;
  falsePositivesAvoided: number;
  missedRisks: number;
  explanation: string[];
}

export function simulateSiloDetection(riskResult: RiskResult): SiloSimulationResult {
  const { score, band, exchangeTxCount, onchainTxCount, velocityFlag, sharedDeviceCount, networkSize } = riskResult;

  // Simulate what silo systems would generate
  // Card fraud: only triggers on high card-to-exchange volume or anomalous amounts
  const cardFraudAlerts = riskResult.cardToExchangeCount >= 2 ? 1 : 0;

  // AML TM: triggers on SEPA volume + basic velocity, often low quality
  let amlAlerts = 0;
  if (exchangeTxCount >= 3) amlAlerts += 2; // threshold breach alerts
  if (riskResult.exchangeTxAmount >= 10000) amlAlerts += 1;
  if (velocityFlag) amlAlerts += 1;

  // Cross-rail alerts (derived from cross-rail score)
  const crossRailAlerts = band === "HIGH" ? 1 : band === "MEDIUM" ? 1 : 0;

  // False positives avoided: AML would generate low-quality alerts that cross-rail filters
  const falsePositivesAvoided = Math.max(0, amlAlerts - crossRailAlerts);

  // Missed risks: things cross-rail catches that silos wouldn't
  let missedRisks = 0;
  if (onchainTxCount > 0 && cardFraudAlerts === 0) missedRisks++; // on-chain risk missed
  if (sharedDeviceCount >= 2) missedRisks++; // network signal missed
  if (networkSize >= 6) missedRisks++; // ring membership missed

  const explanation: string[] = [];

  if (cardFraudAlerts === 0) {
    explanation.push("Card fraud engine: no alert — individual card transactions appear benign.");
  } else {
    explanation.push(`Card fraud engine: ${cardFraudAlerts} low-priority alert(s) — card-to-exchange detected but not escalated.`);
  }

  if (amlAlerts <= 1) {
    explanation.push("AML/TM engine: minimal alert(s) — SEPA activity below individual thresholds.");
  } else {
    explanation.push(`AML/TM engine: ${amlAlerts} alert(s) — mostly low quality, no correlation with on-chain or network data.`);
  }

  if (onchainTxCount > 0) {
    explanation.push("On-chain risk: no silo coverage — crypto transactions not monitored in traditional AML systems.");
  }

  if (sharedDeviceCount >= 2) {
    explanation.push(`Shared device (${sharedDeviceCount} co-users): invisible to silo systems — requires cross-entity correlation.`);
  }

  if (networkSize >= 6) {
    explanation.push(`Ring membership (${networkSize} nodes): network signal only visible via graph analysis — missed by silo engines.`);
  }

  if (band === "HIGH" || band === "MEDIUM") {
    explanation.push(`Cross-rail correlation: unified score ${score}/100 (${band}) — exposes full risk picture invisible in silos.`);
  }

  return {
    cardFraudAlerts,
    amlAlerts,
    crossRailAlerts,
    falsePositivesAvoided,
    missedRisks,
    explanation,
  };
}
