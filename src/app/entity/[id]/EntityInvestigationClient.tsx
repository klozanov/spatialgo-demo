"use client";

import { useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Customer, RiskResult, GraphNodeData, GraphEdgeData } from "@/types";
import { EntitySummary } from "@/components/entity/EntitySummary";
import { NetworkGraph } from "@/components/entity/NetworkGraph";
import { Timeline } from "@/components/entity/Timeline";
import { EvidenceList } from "@/components/entity/EvidenceList";
import { SiloComparison } from "@/components/entity/SiloComparison";
import { SARModal } from "@/components/entity/SARModal";
import { PlaybackPanel } from "@/components/entity/PlaybackPanel";
import { BlastRadiusPanel } from "@/components/entity/BlastRadiusPanel";
import { simulateSiloDetection } from "@/lib/siloSimulation";
import { getCustomerTransactions } from "@/lib/dataStore";
import type { PropagatedEntity } from "@/lib/riskPropagation";
import { FileText } from "lucide-react";
import { OpenCaseButton } from "@/components/cases/OpenCaseButton";

interface Props {
  customer: Customer;
  riskResult: RiskResult;
  graphNodes: Node<GraphNodeData>[];
  graphEdges: Edge<GraphEdgeData>[];
  suspiciousNodeIds: string[];
  suspiciousEdgeIds: string[];
  blastRadiusRows: PropagatedEntity[];
}

type TabKey = "timeline" | "evidence" | "silo" | "playback" | "blastradius";

export function EntityInvestigationClient({
  customer,
  riskResult,
  graphNodes,
  graphEdges,
  suspiciousNodeIds,
  suspiciousEdgeIds,
  blastRadiusRows,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");
  const [highlightSuspicious, setHighlightSuspicious] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [showSAR, setShowSAR] = useState(false);

  const txs = getCustomerTransactions(customer.id);
  const siloResult = simulateSiloDetection(riskResult);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "timeline", label: "Timeline" },
    { key: "evidence", label: `Evidence (${riskResult.evidenceItems.length})` },
    { key: "playback", label: "Playback" },
    { key: "blastradius", label: `Blast Radius (${blastRadiusRows.length})` },
    { key: "silo", label: "Silo" },
  ];

  return (
    <>
      <div className="flex overflow-hidden" style={{ height: "100vh" }}>
        {/* Left: Summary */}
        <div
          className="w-64 shrink-0 border-r overflow-y-auto"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
        >
          <EntitySummary customer={customer} result={riskResult} />

          {/* Typologies section */}
          {riskResult.typologies.filter((t) => t !== "None").length > 0 && (
            <div className="px-4 pb-3">
              <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Typologies
              </div>
              <div className="flex flex-wrap gap-1.5">
                {riskResult.typologies
                  .filter((t) => t !== "None")
                  .map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/30"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4 space-y-2">
            <button
              onClick={() => setShowSAR(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-xs font-medium justify-center"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate SAR Draft
            </button>
            <OpenCaseButton customer={customer} riskResult={riskResult} />
          </div>
        </div>

        {/* Center: Graph */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Graph toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}
          >
            <span className="text-sm font-medium text-gray-300">Entity Graph</span>
            <div className="flex-1" />
            <button
              onClick={() => setHighlightSuspicious((v) => !v)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                highlightSuspicious
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : "border-white/10 text-gray-400 hover:text-gray-200"
              }`}
            >
              {highlightSuspicious ? "● Suspicious Path ON" : "○ Suspicious Path OFF"}
            </button>
            <span className="text-xs text-gray-600">
              {graphNodes.length} nodes · {graphEdges.length} edges
            </span>
          </div>

          <div className="flex-1">
            <NetworkGraph
              nodes={graphNodes}
              edges={graphEdges}
              suspiciousNodeIds={suspiciousNodeIds}
              suspiciousEdgeIds={suspiciousEdgeIds}
              highlightSuspicious={highlightSuspicious}
              selectedNodeId={selectedNodeId}
              onNodeSelect={setSelectedNodeId}
              focusNodeId={focusNodeId}
            />
          </div>
        </div>

        {/* Right: Tabs */}
        <div
          className="w-80 shrink-0 border-l flex flex-col"
          style={{ borderColor: "var(--border)", background: "var(--background)" }}
        >
          {/* Tab headers — pill style, wraps to 2 rows */}
          <div
            className="flex flex-wrap gap-1 px-2 py-2 border-b shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "timeline" && (
              <Timeline transactions={txs} />
            )}
            {activeTab === "evidence" && (
              <EvidenceList
                evidenceItems={riskResult.evidenceItems}
                onJumpToNode={(nodeId) => {
                  setSelectedNodeId(nodeId);
                  setFocusNodeId(nodeId);
                }}
              />
            )}
            {activeTab === "playback" && (
              <PlaybackPanel
                transactions={txs}
                onFocusNode={(nodeId) => {
                  setFocusNodeId(nodeId);
                  setSelectedNodeId(nodeId);
                }}
              />
            )}
            {activeTab === "blastradius" && (
              <BlastRadiusPanel rows={blastRadiusRows} />
            )}
            {activeTab === "silo" && (
              <SiloComparison siloResult={siloResult} riskResult={riskResult} />
            )}
          </div>
        </div>
      </div>

      {/* SAR Modal */}
      {showSAR && (
        <SARModal
          customer={customer}
          result={riskResult}
          transactions={txs}
          typologies={riskResult.typologies}
          onClose={() => setShowSAR(false)}
        />
      )}
    </>
  );
}
