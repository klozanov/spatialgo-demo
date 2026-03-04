import type { NetworkComponent } from "@/types";
import {
  customers,
  devices,
  beneficiaries,
  exchangeExposedCustomerIds,
} from "@/lib/dataStore";

// ─── Union-Find (Disjoint Set Union) ─────────────────────────────────────────

class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  add(id: string) {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(id: string): string {
    this.add(id);
    let root = this.parent.get(id)!;
    if (root !== id) {
      root = this.find(root);
      this.parent.set(id, root); // path compression
    }
    return root;
  }

  union(a: string, b: string) {
    this.add(a);
    this.add(b);
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra) ?? 0;
    const rankB = this.rank.get(rb) ?? 0;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }

  getComponents(): Map<string, string[]> {
    const components = new Map<string, string[]>();
    for (const [id] of this.parent) {
      const root = this.find(id);
      const list = components.get(root) ?? [];
      list.push(id);
      components.set(root, list);
    }
    return components;
  }
}

// ─── Build connected components ───────────────────────────────────────────────

function buildNetworkComponents(): NetworkComponent[] {
  const uf = new UnionFind();

  // Initialize all customers
  for (const c of customers) {
    uf.add(c.id);
  }

  // Rule 1: Shared device (device linked to ≥2 customers)
  for (const device of devices) {
    const linked = device.linkedCustomerIds.filter((cid) =>
      customers.some((c) => c.id === cid)
    );
    if (linked.length >= 2) {
      for (let i = 1; i < linked.length; i++) {
        uf.union(linked[0], linked[i]);
      }
    }
  }

  // Rule 2: Shared beneficiary (beneficiary linked to ≥2 customers)
  for (const ben of beneficiaries) {
    const linked = ben.linkedCustomerIds.filter((cid) =>
      customers.some((c) => c.id === cid)
    );
    if (linked.length >= 2) {
      for (let i = 1; i < linked.length; i++) {
        uf.union(linked[0], linked[i]);
      }
    }
  }

  const components = uf.getComponents();
  const result: NetworkComponent[] = [];
  let networkIdx = 1;

  for (const [, memberIds] of components) {
    if (memberIds.length < 2) continue; // skip singletons

    // Find top exchanges in this component
    const exchangeCounts = new Map<string, number>();
    for (const cid of memberIds) {
      if (exchangeExposedCustomerIds.has(cid)) {
        // We'll fill top exchanges post-risk-engine; use placeholder for now
        exchangeCounts.set("exchange", (exchangeCounts.get("exchange") ?? 0) + 1);
      }
    }

    result.push({
      id: `NET-${String(networkIdx).padStart(3, "0")}`,
      customerIds: memberIds,
      size: memberIds.length,
      topExchanges: [],
      highRiskCount: 0, // filled after risk engine runs
    });
    networkIdx++;
  }

  // Sort by size descending
  result.sort((a, b) => b.size - a.size);

  return result;
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const networkComponents: NetworkComponent[] = buildNetworkComponents();

export const componentByCustomerId = new Map<string, NetworkComponent>();
for (const comp of networkComponents) {
  for (const cid of comp.customerIds) {
    componentByCustomerId.set(cid, comp);
  }
}

export function getNetworkComponent(customerId: string): NetworkComponent | null {
  return componentByCustomerId.get(customerId) ?? null;
}

export function getNetworkSize(customerId: string): number {
  return componentByCustomerId.get(customerId)?.size ?? 1;
}

export function getSharedDeviceCount(customerId: string): number {
  let count = 0;
  // How many OTHER customers share a device with this customer
  const seen = new Set<string>();
  for (const device of devices) {
    if (device.linkedCustomerIds.includes(customerId) && device.linkedCustomerIds.length >= 2) {
      for (const otherId of device.linkedCustomerIds) {
        if (otherId !== customerId && !seen.has(otherId)) {
          seen.add(otherId);
          count++;
        }
      }
    }
  }
  return count;
}

export function getSharedBeneficiaryCount(customerId: string): number {
  // How many beneficiaries this customer shares with ≥2 OTHER customers
  let count = 0;
  for (const ben of beneficiaries) {
    if (
      ben.linkedCustomerIds.includes(customerId) &&
      ben.linkedCustomerIds.length >= 3 // includes this customer + 2 others
    ) {
      count++;
    }
  }
  return count;
}
