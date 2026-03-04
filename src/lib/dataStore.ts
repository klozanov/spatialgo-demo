import type {
  Customer,
  Transaction,
  Exchange,
  Wallet,
  Cluster,
  Beneficiary,
  Merchant,
  Device,
} from "@/types";

import customersRaw from "@/data/customers.json";
import transactionsRaw from "@/data/transactions.json";
import exchangesRaw from "@/data/exchanges.json";
import walletsRaw from "@/data/wallets.json";
import clustersRaw from "@/data/clusters.json";
import beneficiariesRaw from "@/data/beneficiaries.json";
import merchantsRaw from "@/data/merchants.json";
import devicesRaw from "@/data/devices.json";

// ─── Raw data as typed arrays ─────────────────────────────────────────────────

export const customers: Customer[] = customersRaw as Customer[];
export const transactions: Transaction[] = transactionsRaw as Transaction[];
export const exchanges: Exchange[] = exchangesRaw as Exchange[];
export const wallets: Wallet[] = walletsRaw as Wallet[];
export const clusters: Cluster[] = clustersRaw as Cluster[];
export const beneficiaries: Beneficiary[] = beneficiariesRaw as Beneficiary[];
export const merchants: Merchant[] = merchantsRaw as Merchant[];
export const devices: Device[] = devicesRaw as Device[];

// ─── Indexes (computed once at module load) ───────────────────────────────────

export const customerById = new Map<string, Customer>(
  customers.map((c) => [c.id, c])
);

export const exchangesById = new Map<string, Exchange>(
  exchanges.map((e) => [e.id, e])
);

export const walletsById = new Map<string, Wallet>(
  wallets.map((w) => [w.id, w])
);

export const clustersById = new Map<string, Cluster>(
  clusters.map((c) => [c.id, c])
);

export const beneficiariesById = new Map<string, Beneficiary>(
  beneficiaries.map((b) => [b.id, b])
);

export const merchantsById = new Map<string, Merchant>(
  merchants.map((m) => [m.id, m])
);

export const devicesById = new Map<string, Device>(
  devices.map((d) => [d.id, d])
);

// transactionsByCustomerId
export const transactionsByCustomerId = new Map<string, Transaction[]>();
for (const tx of transactions) {
  const list = transactionsByCustomerId.get(tx.fromCustomerId) ?? [];
  list.push(tx);
  transactionsByCustomerId.set(tx.fromCustomerId, list);
}

// devicesByCustomerId: customerId → Device[]
export const devicesByCustomerId = new Map<string, Device[]>();
for (const device of devices) {
  for (const cid of device.linkedCustomerIds) {
    const list = devicesByCustomerId.get(cid) ?? [];
    list.push(device);
    devicesByCustomerId.set(cid, list);
  }
}

// beneficiariesByCustomerId: customerId → Beneficiary[]
export const beneficiariesByCustomerId = new Map<string, Beneficiary[]>();
for (const ben of beneficiaries) {
  for (const cid of ben.linkedCustomerIds) {
    const list = beneficiariesByCustomerId.get(cid) ?? [];
    list.push(ben);
    beneficiariesByCustomerId.set(cid, list);
  }
}

// exchangeExposedCustomerIds: set of customerIds with any exchange-related tx
export const exchangeExposedCustomerIds = new Set<string>();
for (const tx of transactions) {
  if (tx.exchangeId || tx.walletId || tx.clusterId) {
    exchangeExposedCustomerIds.add(tx.fromCustomerId);
  }
  if (tx.type === "SEPA" && tx.toEntityId.startsWith("EX-")) {
    exchangeExposedCustomerIds.add(tx.fromCustomerId);
  }
}

// Also detect exchange exposure via ONCHAIN transactions
for (const tx of transactions) {
  if (tx.type === "ONCHAIN") {
    exchangeExposedCustomerIds.add(tx.fromCustomerId);
  }
}

// ─── Daily buckets for charts ─────────────────────────────────────────────────

export interface DailyBucket {
  date: string; // YYYY-MM-DD
  txCount: number;
  totalAmount: number;
}

export const dailyTransactionBuckets: DailyBucket[] = (() => {
  const map = new Map<string, DailyBucket>();
  for (const tx of transactions) {
    const date = tx.timestamp.slice(0, 10);
    const existing = map.get(date) ?? { date, txCount: 0, totalAmount: 0 };
    existing.txCount++;
    existing.totalAmount += tx.amount;
    map.set(date, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
})();

// ─── Helper getters ───────────────────────────────────────────────────────────

export function getCustomerTransactions(customerId: string): Transaction[] {
  return transactionsByCustomerId.get(customerId) ?? [];
}

export function getCustomerDevices(customerId: string): Device[] {
  return devicesByCustomerId.get(customerId) ?? [];
}

export function getCustomerBeneficiaries(customerId: string): Beneficiary[] {
  return beneficiariesByCustomerId.get(customerId) ?? [];
}
