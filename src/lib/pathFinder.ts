import { transactions, customerById, exchangesById, walletsById, beneficiariesById, merchantsById } from "@/lib/dataStore";
import type { Transaction } from "@/types";

export interface PathNode {
  id: string;
  type: "CUSTOMER" | "EXCHANGE" | "WALLET" | "BENEFICIARY" | "MERCHANT" | "OTHER";
  label: string;
}

export interface PathEdge {
  from: string;
  to: string;
  txType: string;
  amount: number;
}

export interface PathResult {
  found: boolean;
  path: PathNode[];
  edges: PathEdge[];
  hops: number;
}

function getEntityLabel(id: string): { label: string; type: PathNode["type"] } {
  if (id.startsWith("C-")) {
    const c = customerById.get(id);
    return { label: c?.name ?? id, type: "CUSTOMER" };
  }
  if (id.startsWith("EX-")) {
    const e = exchangesById.get(id);
    return { label: e?.name ?? id, type: "EXCHANGE" };
  }
  if (id.startsWith("W-")) {
    const w = walletsById.get(id);
    return { label: w ? `${w.address.slice(0, 8)}…` : id, type: "WALLET" };
  }
  if (id.startsWith("B-")) {
    const b = beneficiariesById.get(id);
    return { label: b?.label ?? id, type: "BENEFICIARY" };
  }
  if (id.startsWith("M-")) {
    const m = merchantsById.get(id);
    return { label: m?.name ?? id, type: "MERCHANT" };
  }
  return { label: id, type: "OTHER" };
}

// Build bipartite adjacency maps at call time (memoized)
let _customerToEntities: Map<string, Map<string, Transaction>> | null = null;
let _entityToCustomers: Map<string, Map<string, Transaction>> | null = null;

function getAdjacency() {
  if (_customerToEntities && _entityToCustomers) {
    return { customerToEntities: _customerToEntities, entityToCustomers: _entityToCustomers };
  }

  _customerToEntities = new Map();
  _entityToCustomers = new Map();

  for (const tx of transactions) {
    const cid = tx.fromCustomerId;
    const eid = tx.toEntityId;

    // customer → entity
    const cMap = _customerToEntities.get(cid) ?? new Map<string, Transaction>();
    if (!cMap.has(eid)) cMap.set(eid, tx);
    _customerToEntities.set(cid, cMap);

    // entity → customer
    const eMap = _entityToCustomers.get(eid) ?? new Map<string, Transaction>();
    if (!eMap.has(cid)) eMap.set(cid, tx);
    _entityToCustomers.set(eid, eMap);

    // Also register exchangeId as intermediate node
    if (tx.exchangeId && tx.exchangeId !== eid) {
      const exCMap = _customerToEntities.get(cid) ?? new Map<string, Transaction>();
      if (!exCMap.has(tx.exchangeId)) exCMap.set(tx.exchangeId, tx);
      _customerToEntities.set(cid, exCMap);

      const exEMap = _entityToCustomers.get(tx.exchangeId) ?? new Map<string, Transaction>();
      if (!exEMap.has(cid)) exEMap.set(cid, tx);
      _entityToCustomers.set(tx.exchangeId, exEMap);
    }
  }

  return { customerToEntities: _customerToEntities, entityToCustomers: _entityToCustomers };
}

export function findShortestPath(
  fromCustomerId: string,
  toCustomerId: string
): PathResult {
  if (fromCustomerId === toCustomerId) {
    const { label, type } = getEntityLabel(fromCustomerId);
    return {
      found: true,
      path: [{ id: fromCustomerId, label, type }],
      edges: [],
      hops: 0,
    };
  }

  const { customerToEntities, entityToCustomers } = getAdjacency();
  const MAX_DEPTH = 12; // 6 hops customer↔entity

  // BFS over node IDs (customers + entities)
  // Track path as array of IDs
  type PathState = { path: string[]; edgeTxs: Transaction[] };
  const queue: PathState[] = [
    { path: [fromCustomerId], edgeTxs: [] },
  ];
  const visited = new Set<string>([fromCustomerId]);

  while (queue.length > 0) {
    const { path, edgeTxs } = queue.shift()!;
    if (path.length > MAX_DEPTH) break;

    const current = path[path.length - 1];

    // If current is a customer, explore their entities
    if (current.startsWith("C-")) {
      const entities = customerToEntities.get(current);
      if (!entities) continue;
      for (const [eid, tx] of entities.entries()) {
        if (visited.has(eid)) continue;
        visited.add(eid);
        const newPath = [...path, eid];
        const newEdgeTxs = [...edgeTxs, tx];

        // Check if the entity connects to our target
        const connectedCustomers = entityToCustomers.get(eid);
        if (connectedCustomers?.has(toCustomerId)) {
          const finalTx = connectedCustomers.get(toCustomerId)!;
          const finalPath = [...newPath, toCustomerId];
          const finalEdgeTxs = [...newEdgeTxs, finalTx];
          return buildPathResult(finalPath, finalEdgeTxs);
        }

        queue.push({ path: newPath, edgeTxs: newEdgeTxs });
      }
    } else {
      // current is an entity — explore connected customers
      const customers = entityToCustomers.get(current);
      if (!customers) continue;
      for (const [cid, tx] of customers.entries()) {
        if (visited.has(cid)) continue;
        if (cid === toCustomerId) {
          const finalPath = [...path, cid];
          const finalEdgeTxs = [...edgeTxs, tx];
          return buildPathResult(finalPath, finalEdgeTxs);
        }
        visited.add(cid);
        queue.push({ path: [...path, cid], edgeTxs: [...edgeTxs, tx] });
      }
    }
  }

  return { found: false, path: [], edges: [], hops: 0 };
}

function buildPathResult(pathIds: string[], edgeTxs: Transaction[]): PathResult {
  const path: PathNode[] = pathIds.map((id) => {
    const { label, type } = getEntityLabel(id);
    return { id, label, type };
  });

  const edges: PathEdge[] = edgeTxs.map((tx, i) => ({
    from: pathIds[i],
    to: pathIds[i + 1],
    txType: tx.type,
    amount: tx.amount,
  }));

  // Count customer-to-customer hops (every 2 steps = 1 hop)
  const customerCount = pathIds.filter((id) => id.startsWith("C-")).length;
  const hops = customerCount - 1;

  return { found: true, path, edges, hops };
}
