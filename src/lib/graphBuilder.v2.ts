import type { Node, Edge } from "@xyflow/react";
import type { GraphNodeData, GraphEdgeData } from "@/types";
import {
  transactionsByCustomerId,
  exchangesById,
  walletsById,
  clustersById,
  beneficiariesById,
  beneficiaries,
  merchantsById,
  devicesByCustomerId,
} from "@/lib/dataStore";
import { getRiskResult } from "@/lib/riskEngine.v2";

type FlowNode = Node<GraphNodeData>;
type FlowEdge = Edge<GraphEdgeData>;

// ─── Node color helpers ───────────────────────────────────────────────────────

export const NODE_COLORS: Record<string, string> = {
  CUSTOMER: "#2563EB",
  EXCHANGE: "#F59E0B",
  WALLET: "#8B5CF6",
  CLUSTER: "#EF4444",
  CLUSTER_LOW: "#6B7280",
  BENEFICIARY: "#14B8A6",
  MERCHANT: "#6B7280",
  DEVICE: "#EC4899",
};

// ─── Simple grid layout ───────────────────────────────────────────────────────

function assignPositions(nodes: FlowNode[]): FlowNode[] {
  // Group nodes by type for layout
  const typeOrder = ["CUSTOMER", "DEVICE", "EXCHANGE", "WALLET", "CLUSTER", "BENEFICIARY", "MERCHANT"];
  const groups: Record<string, FlowNode[]> = {};
  for (const node of nodes) {
    const t = node.data.nodeType;
    groups[t] = groups[t] ?? [];
    groups[t].push(node);
  }

  const positioned: FlowNode[] = [];
  const colWidth = 220;
  const rowHeight = 120;

  for (let col = 0; col < typeOrder.length; col++) {
    const type = typeOrder[col];
    const group = groups[type] ?? [];
    for (let row = 0; row < group.length; row++) {
      positioned.push({
        ...group[row],
        position: {
          x: col * colWidth,
          y: row * rowHeight - ((group.length - 1) * rowHeight) / 2,
        },
      });
    }
  }
  return positioned;
}

// ─── Main graph builder ───────────────────────────────────────────────────────

export function buildEntityGraph(customerId: string): {
  nodes: FlowNode[];
  edges: FlowEdge[];
  suspiciousNodeIds: Set<string>;
  suspiciousEdgeIds: Set<string>;
} {
  const txs = transactionsByCustomerId.get(customerId) ?? [];
  const riskResult = getRiskResult(customerId);

  const nodesMap = new Map<string, FlowNode>();
  const edgesMap = new Map<string, FlowEdge>();
  const suspiciousNodeIds = new Set<string>();
  const suspiciousEdgeIds = new Set<string>();

  // ─── Customer node ────────────────────────────────────────────────────────
  const customerNodeId = customerId;
  nodesMap.set(customerNodeId, {
    id: customerNodeId,
    type: "custom",
    position: { x: 0, y: 0 },
    data: {
      nodeType: "CUSTOMER",
      label: customerId,
      subLabel: riskResult.band,
      riskLevel: riskResult.band,
      suspicious: riskResult.band === "HIGH",
      entityId: customerId,
    },
  });
  if (riskResult.band === "HIGH") suspiciousNodeIds.add(customerNodeId);

  // ─── Process transactions ─────────────────────────────────────────────────

  // Track exchange → wallet → cluster chains for suspicious path detection
  const exchangeHasHighCluster = new Set<string>();

  // First pass: find exchanges connected to HIGH clusters
  for (const tx of txs) {
    if (tx.type === "ONCHAIN" && tx.clusterId) {
      const cluster = clustersById.get(tx.clusterId);
      if (cluster?.riskLevel === "HIGH" && tx.exchangeId) {
        exchangeHasHighCluster.add(tx.exchangeId);
      }
    }
  }

  // Second pass: build nodes + edges
  for (const tx of txs) {
    const txAmount = tx.amount;

    // ── ONCHAIN tx ──────────────────────────────────────────────────────────
    if (tx.type === "ONCHAIN" && tx.walletId) {
      const wallet = walletsById.get(tx.walletId);
      const walletNodeId = tx.walletId;

      if (!nodesMap.has(walletNodeId)) {
        nodesMap.set(walletNodeId, {
          id: walletNodeId,
          type: "custom",
          position: { x: 0, y: 0 },
          data: {
            nodeType: "WALLET",
            label: tx.walletId,
            subLabel: wallet?.address?.slice(0, 10) + "...",
            suspicious: false,
            entityId: tx.walletId,
          },
        });
      }

      // Exchange node (if applicable)
      if (tx.exchangeId) {
        const exchange = exchangesById.get(tx.exchangeId);
        const exchangeNodeId = tx.exchangeId;
        const isSuspiciousEx = exchangeHasHighCluster.has(tx.exchangeId);

        if (!nodesMap.has(exchangeNodeId)) {
          nodesMap.set(exchangeNodeId, {
            id: exchangeNodeId,
            type: "custom",
            position: { x: 0, y: 0 },
            data: {
              nodeType: "EXCHANGE",
              label: exchange?.name ?? tx.exchangeId,
              subLabel: exchange?.riskLevel,
              riskLevel: exchange?.riskLevel,
              suspicious: isSuspiciousEx,
              entityId: tx.exchangeId,
            },
          });
        }
        if (isSuspiciousEx) suspiciousNodeIds.add(exchangeNodeId);

        // CUSTOMER → EXCHANGE edge
        const edgeId1 = `${customerId}->${exchangeNodeId}`;
        if (!edgesMap.has(edgeId1)) {
          const isSusp = isSuspiciousEx;
          edgesMap.set(edgeId1, {
            id: edgeId1,
            source: customerId,
            target: exchangeNodeId,
            data: { label: "exchange", suspicious: isSusp, amount: txAmount },
          });
          if (isSusp) suspiciousEdgeIds.add(edgeId1);
        }

        // EXCHANGE → WALLET edge
        const edgeId2 = `${exchangeNodeId}->${walletNodeId}`;
        if (!edgesMap.has(edgeId2)) {
          edgesMap.set(edgeId2, {
            id: edgeId2,
            source: exchangeNodeId,
            target: walletNodeId,
            data: { label: "ONCHAIN", suspicious: isSuspiciousEx, amount: txAmount },
          });
          if (isSuspiciousEx) suspiciousEdgeIds.add(edgeId2);
        }
      } else {
        // Direct CUSTOMER → WALLET edge (no exchange)
        const edgeId = `${customerId}->${walletNodeId}`;
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            id: edgeId,
            source: customerId,
            target: walletNodeId,
            data: { label: "ONCHAIN", suspicious: false, amount: txAmount },
          });
        }
      }

      // Cluster node
      if (tx.clusterId) {
        const cluster = clustersById.get(tx.clusterId);
        const clusterNodeId = tx.clusterId;
        const isHighRisk = cluster?.riskLevel === "HIGH";

        if (!nodesMap.has(clusterNodeId)) {
          nodesMap.set(clusterNodeId, {
            id: clusterNodeId,
            type: "custom",
            position: { x: 0, y: 0 },
            data: {
              nodeType: "CLUSTER",
              label: cluster?.tag ?? tx.clusterId,
              subLabel: cluster?.riskLevel,
              riskLevel: cluster?.riskLevel,
              suspicious: isHighRisk,
              entityId: tx.clusterId,
            },
          });
        }
        if (isHighRisk) suspiciousNodeIds.add(clusterNodeId);

        // WALLET → CLUSTER edge
        const edgeId3 = `${walletNodeId}->${clusterNodeId}`;
        if (!edgesMap.has(edgeId3)) {
          edgesMap.set(edgeId3, {
            id: edgeId3,
            source: walletNodeId,
            target: clusterNodeId,
            data: { label: "attribution", suspicious: isHighRisk },
          });
          if (isHighRisk) {
            suspiciousEdgeIds.add(edgeId3);
            suspiciousNodeIds.add(walletNodeId);
          }
        }
      }
    }

    // ── SEPA tx → Beneficiary or Exchange ──────────────────────────────────
    if (tx.type === "SEPA") {
      const toId = tx.toEntityId;
      if (toId.startsWith("EX-")) {
        // SEPA to exchange
        const exchange = exchangesById.get(toId);
        const isSusp = exchangeHasHighCluster.has(toId);
        if (!nodesMap.has(toId)) {
          nodesMap.set(toId, {
            id: toId,
            type: "custom",
            position: { x: 0, y: 0 },
            data: {
              nodeType: "EXCHANGE",
              label: exchange?.name ?? toId,
              subLabel: exchange?.riskLevel,
              riskLevel: exchange?.riskLevel,
              suspicious: isSusp,
              entityId: toId,
            },
          });
        }
        const edgeId = `${customerId}->${toId}-SEPA`;
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            id: edgeId,
            source: customerId,
            target: toId,
            data: { label: "SEPA", suspicious: isSusp, amount: txAmount },
          });
          if (isSusp) suspiciousEdgeIds.add(edgeId);
        }
      } else if (toId.startsWith("B-")) {
        // SEPA to beneficiary
        const ben = beneficiariesById.get(toId);
        if (!ben) continue;
        const isShared = ben.linkedCustomerIds.length >= 3;

        if (!nodesMap.has(toId)) {
          nodesMap.set(toId, {
            id: toId,
            type: "custom",
            position: { x: 0, y: 0 },
            data: {
              nodeType: "BENEFICIARY",
              label: ben.label,
              subLabel: ben.iban.slice(-6),
              suspicious: isShared,
              entityId: toId,
            },
          });
        }
        if (isShared) suspiciousNodeIds.add(toId);

        const edgeId = `${customerId}->${toId}-SEPA`;
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            id: edgeId,
            source: customerId,
            target: toId,
            data: { label: "SEPA", suspicious: isShared, amount: txAmount },
          });
          if (isShared) suspiciousEdgeIds.add(edgeId);
        }
      }
    }

    // ── PAYOUT tx → Beneficiary or Merchant ────────────────────────────────
    if (tx.type === "PAYOUT") {
      const toId = tx.toEntityId;
      if (toId.startsWith("B-")) {
        const ben = beneficiariesById.get(toId);
        if (!ben) continue;
        const isShared = ben.linkedCustomerIds.length >= 3;

        if (!nodesMap.has(toId)) {
          nodesMap.set(toId, {
            id: toId,
            type: "custom",
            position: { x: 0, y: 0 },
            data: {
              nodeType: "BENEFICIARY",
              label: ben.label,
              subLabel: ben.iban.slice(-6),
              suspicious: isShared,
              entityId: toId,
            },
          });
        }
        if (isShared) suspiciousNodeIds.add(toId);

        const edgeId = `${customerId}->${toId}-PAYOUT`;
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            id: edgeId,
            source: customerId,
            target: toId,
            data: { label: "PAYOUT", suspicious: isShared, amount: txAmount },
          });
          if (isShared) suspiciousEdgeIds.add(edgeId);
        }
      } else if (toId.startsWith("M-")) {
        const merchant = merchantsById.get(toId);
        if (!nodesMap.has(toId)) {
          nodesMap.set(toId, {
            id: toId,
            type: "custom",
            position: { x: 0, y: 0 },
            data: {
              nodeType: "MERCHANT",
              label: merchant?.name ?? toId,
              subLabel: merchant?.category,
              suspicious: false,
              entityId: toId,
            },
          });
        }
        const edgeId = `${customerId}->${toId}-PAYOUT`;
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            id: edgeId,
            source: customerId,
            target: toId,
            data: { label: "PAYOUT", suspicious: false, amount: txAmount },
          });
        }
      }
    }

    // ── CARD tx → Merchant ─────────────────────────────────────────────────
    if (tx.type === "CARD") {
      const toId = tx.toEntityId;
      const merchant = merchantsById.get(toId);
      // Only show first few merchants to avoid clutter
      if (!nodesMap.has(toId) && nodesMap.size < 30) {
        nodesMap.set(toId, {
          id: toId,
          type: "custom",
          position: { x: 0, y: 0 },
          data: {
            nodeType: "MERCHANT",
            label: merchant?.name ?? toId,
            subLabel: merchant?.category,
            suspicious: false,
            entityId: toId,
          },
        });
        const edgeId = `${customerId}->${toId}-CARD`;
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            id: edgeId,
            source: customerId,
            target: toId,
            data: { label: "CARD", suspicious: false, amount: txAmount },
          });
        }
      }
    }
  }

  // ── Device nodes ──────────────────────────────────────────────────────────
  const customerDevices = devicesByCustomerId.get(customerId) ?? [];
  for (const device of customerDevices) {
    const deviceNodeId = device.id;
    const isShared = device.linkedCustomerIds.length >= 2;

    if (!nodesMap.has(deviceNodeId)) {
      nodesMap.set(deviceNodeId, {
        id: deviceNodeId,
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          nodeType: "DEVICE",
          label: device.id,
          subLabel: `${device.linkedCustomerIds.length} customers`,
          suspicious: isShared,
          entityId: deviceNodeId,
        },
      });
    }
    if (isShared) suspiciousNodeIds.add(deviceNodeId);

    const edgeId = `${customerId}->${deviceNodeId}`;
    if (!edgesMap.has(edgeId)) {
      edgesMap.set(edgeId, {
        id: edgeId,
        source: customerId,
        target: deviceNodeId,
        data: { label: "device", suspicious: isShared },
      });
      if (isShared) suspiciousEdgeIds.add(edgeId);
    }
  }

  // ── Assign positions ──────────────────────────────────────────────────────
  const nodesArr = assignPositions(Array.from(nodesMap.values()));

  return {
    nodes: nodesArr,
    edges: Array.from(edgesMap.values()),
    suspiciousNodeIds,
    suspiciousEdgeIds,
  };
}
