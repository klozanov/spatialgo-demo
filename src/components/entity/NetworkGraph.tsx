"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeProps,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphNodeData, GraphEdgeData } from "@/types";
import { NODE_COLORS } from "@/lib/graphBuilder.v2";

type FlowNode = Node<GraphNodeData>;
type FlowEdge = Edge<GraphEdgeData>;

// ─── Custom node ──────────────────────────────────────────────────────────────

function CustomNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as GraphNodeData;
  const baseColor = NODE_COLORS[nodeData.nodeType] ?? "#6B7280";
  const color = nodeData.suspicious ? (nodeData.nodeType === "CLUSTER" ? "#EF4444" : baseColor) : baseColor;

  return (
    <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 80, maxWidth: 110 }}>
      <div
        className="rounded-lg px-2 py-1.5 text-center transition-all cursor-pointer"
        style={{
          background: `${color}18`,
          border: `2px solid ${nodeData.suspicious ? color : `${color}50`}`,
          boxShadow: selected
            ? `0 0 12px ${color}60`
            : nodeData.suspicious
            ? `0 0 6px ${color}30`
            : "none",
          minWidth: 70,
        }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color }}>
          {nodeData.nodeType}
        </div>
        <div className="text-[11px] font-medium text-white leading-tight truncate max-w-[90px]">
          {nodeData.label}
        </div>
        {nodeData.subLabel && (
          <div className="text-[9px] text-gray-500 truncate max-w-[90px] mt-0.5">
            {nodeData.subLabel}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

// ─── Inner graph component ─────────────────────────────────────────────────────

interface InnerProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  suspiciousNodeIds: string[];
  suspiciousEdgeIds: string[];
  highlightSuspicious: boolean;
  selectedNodeId: string | null;
  onNodeSelect: (id: string | null) => void;
  focusNodeId: string | null;
}

function GraphInner({
  nodes: initialNodes,
  edges: initialEdges,
  suspiciousNodeIds,
  suspiciousEdgeIds,
  highlightSuspicious,
  selectedNodeId,
  onNodeSelect,
  focusNodeId,
}: InnerProps) {
  const suspiciousSet = useMemo(() => new Set(suspiciousNodeIds), [suspiciousNodeIds]);
  const suspiciousEdgeSet = useMemo(() => new Set(suspiciousEdgeIds), [suspiciousEdgeIds]);

  const styledNodes: FlowNode[] = useMemo(() =>
    initialNodes.map((n) => ({
      ...n,
      selected: n.id === selectedNodeId,
      data: {
        ...n.data,
        suspicious: highlightSuspicious && suspiciousSet.has(n.id),
      },
    })),
    [initialNodes, selectedNodeId, highlightSuspicious, suspiciousSet]
  );

  const styledEdges: FlowEdge[] = useMemo(() =>
    initialEdges.map((e) => {
      const isSuspicious = highlightSuspicious && suspiciousEdgeSet.has(e.id);
      return {
        ...e,
        style: {
          stroke: isSuspicious ? "#EF4444" : "rgba(255,255,255,0.15)",
          strokeWidth: isSuspicious ? 3 : 1.5,
        },
        animated: isSuspicious,
        labelStyle: { fill: "#9CA3AF", fontSize: 9 },
        labelBgStyle: { fill: "transparent" },
      };
    }),
    [initialEdges, highlightSuspicious, suspiciousEdgeSet]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(styledNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(styledEdges);
  const { fitView, setCenter } = useReactFlow();

  // Sync when highlight toggle changes
  useEffect(() => { setNodes(styledNodes); }, [styledNodes, setNodes]);
  useEffect(() => { setEdges(styledEdges); }, [styledEdges, setEdges]);

  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 150);
  }, [fitView]);

  useEffect(() => {
    if (focusNodeId) {
      const node = nodes.find((n) => n.id === focusNodeId);
      if (node) {
        setCenter(node.position.x + 55, node.position.y + 30, { zoom: 1.5, duration: 500 });
      }
    }
  }, [focusNodeId, nodes, setCenter]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => { onNodeSelect(node.id); },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => { onNodeSelect(null); }, [onNodeSelect]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={3}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="rgba(255,255,255,0.05)"
      />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => {
          const d = n.data as unknown as GraphNodeData;
          return NODE_COLORS[d?.nodeType] ?? "#6B7280";
        }}
        maskColor="rgba(11,15,26,0.85)"
        style={{ width: 120, height: 80 }}
      />
    </ReactFlow>
  );
}

// ─── Exported wrapper ─────────────────────────────────────────────────────────

interface Props {
  nodes: FlowNode[];
  edges: FlowEdge[];
  suspiciousNodeIds: string[];
  suspiciousEdgeIds: string[];
  highlightSuspicious: boolean;
  selectedNodeId: string | null;
  onNodeSelect: (id: string | null) => void;
  focusNodeId: string | null;
}

export function NetworkGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
        <GraphInner {...props} />
      </div>
    </ReactFlowProvider>
  );
}
