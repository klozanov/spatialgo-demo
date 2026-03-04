"use client";

import { useState } from "react";
import type { EvidenceItem, RiskBand } from "@/types";
import { riskBandBg, formatDateTime } from "@/lib/utils";
import { ChevronDown, ChevronRight, Focus } from "lucide-react";

interface Props {
  evidenceItems: EvidenceItem[];
  onJumpToNode: (nodeId: string) => void;
}

const SEVERITY_ORDER: Record<RiskBand, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function EvidenceCard({
  item,
  onJumpToNode,
}: {
  item: EvidenceItem;
  onJumpToNode: (nodeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      <button
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="pt-0.5 shrink-0">
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${riskBandBg(item.severity)}`}>
              {item.severity}
            </span>
            <span className="text-xs text-gray-300 font-medium leading-tight">{item.title}</span>
          </div>
          <div className="text-[9px] text-gray-600 mt-1">{formatDateTime(item.timestamp)}</div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs text-gray-400 leading-relaxed pt-2">{item.description}</p>

          {item.relatedNodeIds.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 mb-1">Related nodes</div>
              <div className="flex flex-wrap gap-1">
                {item.relatedNodeIds.map((nodeId) => (
                  <button
                    key={nodeId}
                    onClick={() => onJumpToNode(nodeId)}
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border text-blue-400 hover:bg-blue-500/10 transition-colors"
                    style={{ borderColor: "rgba(37,99,235,0.3)" }}
                  >
                    <Focus className="w-2.5 h-2.5" />
                    {nodeId}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.relatedTransactionIds.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 mb-1">
                {item.relatedTransactionIds.length} related transaction(s)
              </div>
              <div className="font-mono text-[9px] text-gray-600">
                {item.relatedTransactionIds.slice(0, 5).join(", ")}
                {item.relatedTransactionIds.length > 5 && " …"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EvidenceList({ evidenceItems, onJumpToNode }: Props) {
  const [sortBy, setSortBy] = useState<"severity" | "time">("severity");

  const sorted = [...evidenceItems].sort((a, b) => {
    if (sortBy === "severity") return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    return b.timestamp.localeCompare(a.timestamp);
  });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{evidenceItems.length} evidence items</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "severity" | "time")}
          className="text-xs border rounded px-2 py-1 text-gray-400 outline-none"
          style={{ background: "#1F2937", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <option value="severity">Sort: Severity</option>
          <option value="time">Sort: Time</option>
        </select>
      </div>

      {sorted.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-8">No evidence items</div>
      )}

      <div className="space-y-2">
        {sorted.map((item) => (
          <EvidenceCard key={item.id} item={item} onJumpToNode={onJumpToNode} />
        ))}
      </div>
    </div>
  );
}
