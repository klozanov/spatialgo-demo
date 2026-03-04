"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
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
  const isSusp = nodeData.suspicious;
  const color = isSusp ? "#EF4444" : baseColor;

  return (
    <div className="flex flex-col items-center gap-0.5 relative" style={{ minWidth: 80, maxWidth: 110 }}>
      {/* Warning badge — top-right corner */}
      {isSusp && (
        <div
          className="absolute -top-2 -right-2 z-10 flex items-center justify-center rounded-full text-[9px] font-bold"
          style={{
            width: 16,
            height: 16,
            background: "#EF4444",
            color: "#fff",
            boxShadow: "0 0 6px rgba(239,68,68,0.8)",
          }}
        >
          !
        </div>
      )}

      <div
        className={`rounded-lg px-2 py-1.5 text-center transition-all cursor-pointer${isSusp ? " suspicious-node-glow" : ""}`}
        style={{
          background: isSusp
            ? "rgba(239,68,68,0.18)"
            : `${baseColor}14`,
          border: isSusp
            ? "2px solid rgba(239,68,68,0.9)"
            : `1.5px solid ${baseColor}45`,
          boxShadow: selected
            ? `0 0 16px ${color}80, 0 0 32px ${color}30`
            : "none",
          minWidth: 70,
        }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
          style={{ color: isSusp ? "#FCA5A5" : baseColor }}
        >
          {nodeData.nodeType}
        </div>
        <div className="text-[11px] font-medium text-white leading-tight truncate max-w-[90px]">
          {nodeData.label}
        </div>
        {nodeData.subLabel && (
          <div
            className="text-[9px] truncate max-w-[90px] mt-0.5"
            style={{ color: isSusp ? "rgba(252,165,165,0.7)" : "#6B7280" }}
          >
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
  const { theme } = useTheme();
  const normalEdgeStroke = theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)";
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
          stroke: isSuspicious ? "#FF3B30" : normalEdgeStroke,
          strokeWidth: isSuspicious ? 4 : 1.5,
          filter: isSuspicious
            ? "drop-shadow(0 0 5px rgba(255,59,48,0.9)) drop-shadow(0 0 12px rgba(255,59,48,0.45))"
            : "none",
        },
        animated: isSuspicious,
        labelStyle: {
          fill: isSuspicious ? "#FCA5A5" : "#9CA3AF",
          fontSize: 9,
          fontWeight: isSuspicious ? 700 : 400,
        },
        labelBgStyle: {
          fill: isSuspicious ? "rgba(239,68,68,0.15)" : "transparent",
          rx: 3,
        },
      };
    }),
    [initialEdges, highlightSuspicious, suspiciousEdgeSet, normalEdgeStroke]
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
