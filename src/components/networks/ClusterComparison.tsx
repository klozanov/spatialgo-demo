"use client";

import { useState } from "react";
import type { NetworkComponent, RiskResult } from "@/types";
import { computeClusterStats, type ClusterStats } from "@/lib/clusterAnalysis";
import { cn } from "@/lib/utils";
import { GitCompare } from "lucide-react";

interface Network {
  id: string;
  size: number;
  members: { id: string; name: string; score: number; band: string }[];
}

interface Props {
  networks: Network[];
  allResultsEntries: [string, { score: number; band: string; typologies: string[] }][];
  networkComponents: NetworkComponent[];
}

function StatRow({
  label,
  valueA,
  valueB,
}: {
  label: string;
  valueA: React.ReactNode;
  valueB: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 py-2 border-b border-border/30 items-center">
      <div className="text-right">{valueA}</div>
      <div className="text-xs text-muted-foreground text-center px-2 min-w-[100px]">
        {label}
      </div>
      <div className="text-left">{valueB}</div>
    </div>
  );
}

function RiskBar({
  high,
  medium,
  low,
}: {
  high: number;
  medium: number;
  low: number;
}) {
  const total = high + medium + low;
  if (total === 0) return <div className="text-xs text-muted-foreground">—</div>;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {high > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">
          {high} HIGH
        </span>
      )}
      {medium > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
          {medium} MED
        </span>
      )}
      {low > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
          {low} LOW
        </span>
      )}
    </div>
  );
}

export function ClusterComparison({
  networks,
  networkComponents,
  allResultsEntries,
}: Props) {
  const [networkAId, setNetworkAId] = useState("");
  const [networkBId, setNetworkBId] = useState("");
  const [statsA, setStatsA] = useState<ClusterStats | null>(null);
  const [statsB, setStatsB] = useState<ClusterStats | null>(null);

  function handleCompare() {
    const compA = networkComponents.find((c) => c.id === networkAId);
    const compB = networkComponents.find((c) => c.id === networkBId);
    if (!compA || !compB) return;

    // Rebuild allResults map from serialized entries
    const allResults = new Map<string, RiskResult>(
      allResultsEntries.map(([k, v]) => [k, v as unknown as RiskResult])
    );

    setStatsA(computeClusterStats(compA, allResults));
    setStatsB(computeClusterStats(compB, allResults));
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <GitCompare className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Network Cluster Comparison
        </h2>
      </div>

      {/* Network selectors */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Network A
            </label>
            <select
              value={networkAId}
              onChange={(e) => setNetworkAId(e.target.value)}
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a network…</option>
              {networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id} — {n.size} entities
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Network B
            </label>
            <select
              value={networkBId}
              onChange={(e) => setNetworkBId(e.target.value)}
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a network…</option>
              {networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id} — {n.size} entities
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={
            !networkAId ||
            !networkBId ||
            networkAId === networkBId
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <GitCompare className="w-3.5 h-3.5" />
          Compare Networks
        </button>

        {/* Comparison results */}
        {statsA && statsB && (
          <div className="mt-4 space-y-3">
            {/* Headers */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <div className="text-center">
                <span className="text-sm font-bold text-foreground">
                  {statsA.networkId}
                </span>
              </div>
              <div className="min-w-[100px]" />
              <div className="text-center">
                <span className="text-sm font-bold text-foreground">
                  {statsB.networkId}
                </span>
              </div>
            </div>

            <StatRow
              label="Size"
              valueA={
                <span className="text-sm font-bold text-foreground">
                  {statsA.size}
                </span>
              }
              valueB={
                <span className="text-sm font-bold text-foreground">
                  {statsB.size}
                </span>
              }
            />

            <StatRow
              label="Risk Distribution"
              valueA={
                <div className="flex justify-end">
                  <RiskBar
                    high={statsA.highCount}
                    medium={statsA.mediumCount}
                    low={statsA.lowCount}
                  />
                </div>
              }
              valueB={
                <RiskBar
                  high={statsB.highCount}
                  medium={statsB.mediumCount}
                  low={statsB.lowCount}
                />
              }
            />

            <StatRow
              label="Shared Devices"
              valueA={
                <span
                  className={cn(
                    "text-sm font-bold",
                    statsA.sharedDeviceCount > 0 ? "text-red-400" : "text-muted-foreground"
                  )}
                >
                  {statsA.sharedDeviceCount}
                </span>
              }
              valueB={
                <span
                  className={cn(
                    "text-sm font-bold",
                    statsB.sharedDeviceCount > 0 ? "text-red-400" : "text-muted-foreground"
                  )}
                >
                  {statsB.sharedDeviceCount}
                </span>
              }
            />

            <StatRow
              label="Shared Beneficiaries"
              valueA={
                <span
                  className={cn(
                    "text-sm font-bold",
                    statsA.sharedBeneficiaryCount > 0 ? "text-amber-400" : "text-muted-foreground"
                  )}
                >
                  {statsA.sharedBeneficiaryCount}
                </span>
              }
              valueB={
                <span
                  className={cn(
                    "text-sm font-bold",
                    statsB.sharedBeneficiaryCount > 0 ? "text-amber-400" : "text-muted-foreground"
                  )}
                >
                  {statsB.sharedBeneficiaryCount}
                </span>
              }
            />

            <StatRow
              label="On-Chain Clusters"
              valueA={
                <span className="text-sm font-bold text-foreground">
                  {statsA.onchainClusterIds.length}
                </span>
              }
              valueB={
                <span className="text-sm font-bold text-foreground">
                  {statsB.onchainClusterIds.length}
                </span>
              }
            />

            <StatRow
              label="Top Exchanges"
              valueA={
                <div className="flex flex-wrap gap-1 justify-end">
                  {statsA.topExchangeNames.length > 0 ? (
                    statsA.topExchangeNames.map((e) => (
                      <span
                        key={e}
                        className="text-[10px] px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-400 border-amber-500/30"
                      >
                        {e}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              }
              valueB={
                <div className="flex flex-wrap gap-1">
                  {statsB.topExchangeNames.length > 0 ? (
                    statsB.topExchangeNames.map((e) => (
                      <span
                        key={e}
                        className="text-[10px] px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-400 border-amber-500/30"
                      >
                        {e}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              }
            />

            <StatRow
              label="Typologies"
              valueA={
                <div className="flex flex-wrap gap-1 justify-end">
                  {statsA.topTypologies.length > 0 ? (
                    statsA.topTypologies.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/30"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">None</span>
                  )}
                </div>
              }
              valueB={
                <div className="flex flex-wrap gap-1">
                  {statsB.topTypologies.length > 0 ? (
                    statsB.topTypologies.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/30"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">None</span>
                  )}
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
