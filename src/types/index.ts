// ─── Domain Entities ──────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  segment: string;
}

export type TransactionType = "SEPA" | "CARD" | "ONCHAIN" | "PAYOUT";
export type TransactionTag = "EXCHANGE_OUT" | "EXCHANGE_TOPUP" | "LAYERING" | "SPEND";

export interface Transaction {
  id: string;
  type: TransactionType;
  fromCustomerId: string;
  toEntityId: string;
  amount: number;
  currency: "EUR";
  timestamp: string;
  tag?: TransactionTag;
  exchangeId?: string;
  walletId?: string;
  clusterId?: string;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Exchange {
  id: string;
  name: string;
  riskLevel: RiskLevel;
}

export interface Wallet {
  id: string;
  exchangeId: string;
  clusterId: string;
  address: string;
}

export interface Cluster {
  id: string;
  tag: string;
  riskLevel: RiskLevel;
}

export interface Beneficiary {
  id: string;
  iban: string;
  label: string;
  linkedCustomerIds: string[];
}

export interface Merchant {
  id: string;
  name: string;
  mcc?: string;
  category?: string;
  riskLevel?: RiskLevel;
}

export interface Device {
  id: string;
  fingerprint: string;
  linkedCustomerIds: string[];
}

// ─── Computed / Analysis Types ─────────────────────────────────────────────────

export type RiskBand = "LOW" | "MEDIUM" | "HIGH";

export interface EvidenceItem {
  id: string;
  customerId: string;
  severity: RiskBand;
  title: string;
  description: string;
  relatedNodeIds: string[];
  relatedTransactionIds: string[];
  timestamp: string;
  type: "EXCHANGE_EXPOSURE" | "CARD_EXCHANGE" | "ONCHAIN_RISK" | "LAYERING" | "NETWORK" | "VELOCITY";
}

export interface RiskDriver {
  label: string;
  points: number;
  description: string;
}

export interface RiskResult {
  customerId: string;
  score: number;
  band: RiskBand;
  evidenceItems: EvidenceItem[];
  primaryDrivers: RiskDriver[];
  exchangeTxCount: number;
  exchangeTxAmount: number;
  cardToExchangeCount: number;
  cardToExchangeAmount: number;
  onchainTxCount: number;
  sharedDeviceCount: number;
  sharedBeneficiaryCount: number;
  velocityFlag: boolean;
  networkSize: number;
  lastSuspiciousActivity: string | null;
  typologies: TypologyLabel[];
}

export interface NetworkComponent {
  id: string;
  customerIds: string[];
  size: number;
  topExchanges: string[];
  highRiskCount: number;
}

// ─── Graph Types ───────────────────────────────────────────────────────────────

export type GraphNodeType =
  | "CUSTOMER"
  | "EXCHANGE"
  | "WALLET"
  | "CLUSTER"
  | "BENEFICIARY"
  | "MERCHANT"
  | "DEVICE";

export interface GraphNodeData extends Record<string, unknown> {
  nodeType: GraphNodeType;
  label: string;
  subLabel?: string;
  riskLevel?: RiskLevel;
  amount?: number;
  suspicious?: boolean;
  entityId: string;
}

export interface GraphEdgeData extends Record<string, unknown> {
  label?: string;
  amount?: number;
  suspicious?: boolean;
  txCount?: number;
}

// ─── Typology Types ───────────────────────────────────────────────────────────

export type TypologyLabel =
  | "Structuring"
  | "Layering"
  | "Trade-Based ML"
  | "Smurfing"
  | "Exchange Arbitrage"
  | "Mixer Laundering"
  | "None";

// ─── Alert Types ──────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  customerId: string;
  customerName: string;
  severity: RiskBand;
  typologyLabels: TypologyLabel[];
  title: string;
  description: string;
  timestamp: string;
  riskScore: number;
}

// ─── Case Management Types ────────────────────────────────────────────────────

export type CaseStatus = "open" | "reviewing" | "escalated" | "dismissed";

export interface Case {
  id: string;
  customerId: string;
  customerName: string;
  status: CaseStatus;
  assignedTo: string;
  notes: string;
  createdAt: string;
  riskScore: number;
  typologyLabels: TypologyLabel[];
}

// ─── Travel Rule Types ────────────────────────────────────────────────────────

export type TravelRuleStatus = "COMPLIANT" | "NON_COMPLIANT" | "UNKNOWN";

export interface TravelRuleRow {
  txId: string;
  customerId: string;
  customerName: string;
  amount: number;
  walletAddress: string;
  clusterId: string | null;
  clusterTag: string | null;
  clusterRisk: RiskLevel | null;
  status: TravelRuleStatus;
  reason: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalCustomers: number;
  totalTransactions: number;
  exchangeExposedCustomers: number;
  highRiskCustomers: number;
  networksDetected: number;
}

export interface RiskHistogramBucket {
  range: string;
  count: number;
}

export interface DailyAlertCount {
  date: string;
  count: number;
}
