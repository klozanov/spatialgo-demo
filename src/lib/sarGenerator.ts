import type { Customer, RiskResult, Transaction, TypologyLabel } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export function generateSARText(
  customer: Customer,
  result: RiskResult,
  txs: Transaction[],
  typologies: TypologyLabel[]
): string {
  const lines: string[] = [];

  const sortedTxs = [...txs].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
  const earliestTs =
    sortedTxs.length > 0 ? sortedTxs[0].timestamp : new Date().toISOString();
  const latestTs =
    sortedTxs.length > 0
      ? sortedTxs[sortedTxs.length - 1].timestamp
      : new Date().toISOString();

  const highEvidence = result.evidenceItems.filter(
    (e) => e.severity === "HIGH"
  );
  const typologyStr = typologies.filter((t) => t !== "None").join(", ") || "None detected";

  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("         SUSPICIOUS ACTIVITY REPORT — DRAFT");
  lines.push("         SpatialGO Cross-Rail Intelligence Platform");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("SECTION 1 — SUBJECT INFORMATION");
  lines.push("─────────────────────────────────────────────────────────");
  lines.push(`Subject ID        : ${customer.id}`);
  lines.push(`Full Name         : ${customer.name}`);
  lines.push(`Customer Segment  : ${customer.segment}`);
  lines.push(`Report Generated  : ${formatDateTime(new Date().toISOString())}`);
  lines.push("");
  lines.push("SECTION 2 — SUSPICIOUS ACTIVITY SUMMARY");
  lines.push("─────────────────────────────────────────────────────────");
  lines.push(`Risk Score        : ${result.score}/100 (${result.band} RISK)`);
  lines.push(`Typology          : ${typologyStr}`);
  lines.push(`Activity Period   : ${formatDate(earliestTs)} → ${formatDate(latestTs)}`);
  lines.push(`Velocity Flag     : ${result.velocityFlag ? "YES — rapid fund movement detected" : "No"}`);
  lines.push(`Network Size      : ${result.networkSize} connected entities`);
  lines.push("");
  lines.push("SECTION 3 — TRANSACTION SUMMARY");
  lines.push("─────────────────────────────────────────────────────────");
  lines.push(`Total Transactions         : ${txs.length}`);
  lines.push(`Exchange Transactions      : ${result.exchangeTxCount} (${formatCurrency(result.exchangeTxAmount)})`);
  lines.push(`  of which Card→Exchange  : ${result.cardToExchangeCount} (${formatCurrency(result.cardToExchangeAmount)})`);
  lines.push(`On-Chain Transactions      : ${result.onchainTxCount}`);
  lines.push(`Shared Device Exposure     : ${result.sharedDeviceCount} co-linked customer(s)`);
  lines.push(`Shared Beneficiary Accts   : ${result.sharedBeneficiaryCount}`);
  lines.push("");
  lines.push("SECTION 4 — EVIDENCE NARRATIVE (HIGH SEVERITY)");
  lines.push("─────────────────────────────────────────────────────────");

  if (highEvidence.length === 0) {
    lines.push("No HIGH severity evidence items recorded.");
  } else {
    for (const ev of highEvidence) {
      lines.push(`[${ev.severity}] ${ev.type}`);
      lines.push(`  Title   : ${ev.title}`);
      lines.push(`  Detail  : ${ev.description}`);
      lines.push(`  Date    : ${formatDateTime(ev.timestamp)}`);
      if (ev.relatedNodeIds.length > 0) {
        lines.push(
          `  Related : ${ev.relatedNodeIds.slice(0, 5).join(", ")}${ev.relatedNodeIds.length > 5 ? " …" : ""}`
        );
      }
      lines.push("");
    }
  }

  lines.push("SECTION 5 — PRIMARY RISK DRIVERS");
  lines.push("─────────────────────────────────────────────────────────");
  for (const driver of result.primaryDrivers) {
    lines.push(`  [+${String(driver.points).padStart(2, " ")} pts] ${driver.label} — ${driver.description}`);
  }
  lines.push("");
  lines.push("SECTION 6 — NETWORK INDICATORS");
  lines.push("─────────────────────────────────────────────────────────");
  lines.push(`Network Membership : ${result.networkSize > 1 ? `YES — part of ${result.networkSize}-entity network` : "No network connection detected"}`);
  lines.push(`Shared Devices     : ${result.sharedDeviceCount}`);
  lines.push(`Shared Beneficiaries: ${result.sharedBeneficiaryCount}`);
  lines.push(
    `Last Suspicious Activity: ${result.lastSuspiciousActivity ? formatDateTime(result.lastSuspiciousActivity) : "N/A"}`
  );
  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("  ⚠  SYNTHETIC DEMO DOCUMENT — NOT A REAL SAR FILING");
  lines.push("  This document was generated from synthetic test data.");
  lines.push("  Do not submit to any regulatory authority.");
  lines.push("═══════════════════════════════════════════════════════════");

  return lines.join("\n");
}
