import { beneficiaries, transactions } from "@/lib/dataStore";
import { JurisdictionsClient } from "./JurisdictionsClient";

// FATF / internationally recognised high-risk jurisdictions
const HIGH_RISK_CODES = new Set([
  "IR",
  "KP",
  "RU",
  "CN",
  "BY",
  "SY",
  "MM",
  "CU",
  "VE",
  "YE",
  "SO",
  "LY",
]);

const COUNTRY_NAMES: Record<string, string> = {
  AT: "Austria",
  DE: "Germany",
  FR: "France",
  GB: "United Kingdom",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  ES: "Spain",
  IT: "Italy",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  RO: "Romania",
  HR: "Croatia",
  SK: "Slovakia",
  SI: "Slovenia",
  LU: "Luxembourg",
  IE: "Ireland",
  PT: "Portugal",
  GR: "Greece",
  IR: "Iran",
  KP: "North Korea",
  RU: "Russia",
  CN: "China",
  BY: "Belarus",
  SY: "Syria",
  MM: "Myanmar",
  CU: "Cuba",
  VE: "Venezuela",
  YE: "Yemen",
  SO: "Somalia",
  LY: "Libya",
  US: "United States",
  AE: "United Arab Emirates",
  SG: "Singapore",
  HK: "Hong Kong",
  MT: "Malta",
  CY: "Cyprus",
};

export interface JurisdictionRow {
  countryCode: string;
  countryName: string;
  txCount: number;
  totalAmount: number;
  beneficiaryCount: number;
  isHighRisk: boolean;
}

export default function JurisdictionsPage() {
  // Build a map of toEntityId → total transactions for beneficiaries
  const benTxMap = new Map<string, { count: number; amount: number }>();
  for (const tx of transactions) {
    if (!tx.toEntityId.startsWith("B-")) continue;
    const existing = benTxMap.get(tx.toEntityId) ?? { count: 0, amount: 0 };
    existing.count++;
    existing.amount += tx.amount;
    benTxMap.set(tx.toEntityId, existing);
  }

  // Aggregate by country code from IBAN
  const jurisdictionMap = new Map<string, JurisdictionRow>();

  for (const ben of beneficiaries) {
    const cc = ben.iban.slice(0, 2).toUpperCase();
    const benTxs = benTxMap.get(ben.id) ?? { count: 0, amount: 0 };

    const existing = jurisdictionMap.get(cc) ?? {
      countryCode: cc,
      countryName: COUNTRY_NAMES[cc] ?? cc,
      txCount: 0,
      totalAmount: 0,
      beneficiaryCount: 0,
      isHighRisk: HIGH_RISK_CODES.has(cc),
    };
    existing.txCount += benTxs.count;
    existing.totalAmount += benTxs.amount;
    existing.beneficiaryCount++;
    jurisdictionMap.set(cc, existing);
  }

  const rows = Array.from(jurisdictionMap.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );

  const highRiskRows = rows.filter((r) => r.isHighRisk);
  const top5 = rows.slice(0, 5);
  const totalAmount = rows.reduce((s, r) => s + r.totalAmount, 0);
  const highRiskAmount = highRiskRows.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Jurisdiction Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fund flows by jurisdiction extracted from beneficiary IBAN prefixes ·{" "}
          {rows.length} jurisdiction(s) detected
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-foreground">
            {rows.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Jurisdictions
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-foreground">
            {rows.reduce((s, r) => s + r.txCount, 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total Transactions
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-red-400">
            {highRiskRows.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            High-Risk Jurisdictions
          </div>
          <div className="text-xs text-red-400 mt-0.5">
            {totalAmount > 0
              ? `${((highRiskAmount / totalAmount) * 100).toFixed(1)}% of volume`
              : "0%"}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-foreground">
            {rows.reduce((s, r) => s + r.beneficiaryCount, 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Beneficiary Accounts
          </div>
        </div>
      </div>

      <JurisdictionsClient rows={rows} top5={top5} />
    </div>
  );
}
