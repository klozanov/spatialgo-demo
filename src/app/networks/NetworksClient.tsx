"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Network, AlertTriangle, Users, ChevronDown, ChevronRight } from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import type { RiskBand } from "@/types";

interface Member {
  id: string;
  name: string;
  score: number;
  band: string;
}

interface NetworkRow {
  id: string;
  size: number;
  highRiskCount: number;
  topScore: number;
  topExchangeNames: string[];
  members: Member[];
  customerIds: string[];
}

interface Props {
  networks: NetworkRow[];
}

function NetworkCard({ network }: { network: NetworkRow }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const isLarge = network.size >= 6;
  const borderColor = network.highRiskCount >= 3
    ? "rgba(239,68,68,0.3)"
    : network.highRiskCount >= 1
    ? "rgba(245,158,11,0.3)"
    : "rgba(255,255,255,0.07)";

  const bgColor = network.highRiskCount >= 3
    ? "rgba(239,68,68,0.05)"
    : "rgba(17,24,39,1)";

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: bgColor, borderColor }}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: isLarge ? "rgba(239,68,68,0.15)" : "rgba(139,92,246,0.15)" }}
            >
              <Network className="w-4 h-4" style={{ color: isLarge ? "#EF4444" : "#8B5CF6" }} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{network.id}</div>
              <div className="text-xs text-gray-500">{network.size} entities</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {network.highRiskCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" />
                {network.highRiskCount} HIGH
              </div>
            )}
            {isLarge && (
              <div className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 font-bold">
                RING
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{network.size}</div>
            <div className="text-[10px] text-gray-500">Members</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-400">{network.highRiskCount}</div>
            <div className="text-[10px] text-gray-500">High Risk</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">{network.topScore}</div>
            <div className="text-[10px] text-gray-500">Top Score</div>
          </div>
        </div>

        {/* Top exchanges */}
        {network.topExchangeNames.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {network.topExchangeNames.map((name) => (
              <span
                key={name}
                className="text-[10px] px-2 py-0.5 rounded-full text-amber-400"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Expand / actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? "Hide" : "Show"} members
          </button>
          <div className="flex-1" />
          <button
            onClick={() => router.push(`/entity/${network.customerIds[0]}`)}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
          >
            Investigate top entity
          </button>
        </div>
      </div>

      {/* Members list */}
      {expanded && (
        <div className="border-t px-5 py-3 space-y-1.5" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          {network.members
            .sort((a, b) => b.score - a.score)
            .map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-white/[0.03] transition-colors"
                onClick={() => router.push(`/entity/${m.id}`)}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-gray-600" />
                  <span className="font-mono text-[10px] text-blue-400">{m.id}</span>
                  <span className="text-xs text-gray-300">{m.name}</span>
                </div>
                <RiskBadge band={m.band as RiskBand} score={m.score} size="sm" />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export function NetworksClient({ networks }: Props) {
  const [filter, setFilter] = useState<"ALL" | "LARGE" | "HIGH">("ALL");

  const filtered = networks.filter((n) => {
    if (filter === "LARGE") return n.size >= 6;
    if (filter === "HIGH") return n.highRiskCount >= 1;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["ALL", "LARGE", "HIGH"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
              filter === f
                ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                : "border-white/10 text-gray-400 hover:text-gray-200"
            }`}
          >
            {f === "ALL" ? "All Networks" : f === "LARGE" ? "Large Rings (≥6)" : "Has High Risk"}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{filtered.length} shown</span>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((n) => (
          <NetworkCard key={n.id} network={n} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">No networks match the current filter</div>
      )}
    </div>
  );
}
