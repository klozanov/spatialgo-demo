"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { findShortestPath, type PathResult } from "@/lib/pathFinder";
import { formatCurrency } from "@/lib/utils";
import { Search, ArrowRight } from "lucide-react";

const NODE_COLORS: Record<string, string> = {
  CUSTOMER: "#2563EB",
  EXCHANGE: "#F59E0B",
  WALLET: "#8B5CF6",
  BENEFICIARY: "#14B8A6",
  MERCHANT: "#6B7280",
  OTHER: "#6B7280",
};

interface Customer {
  id: string;
  name: string;
  segment: string;
}

interface Props {
  customerList: Customer[];
}

export function PathFinderClient({ customerList }: Props) {
  const router = useRouter();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [result, setResult] = useState<PathResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fromFiltered = useMemo(() => {
    if (!fromSearch) return customerList.slice(0, 20);
    const q = fromSearch.toLowerCase();
    return customerList
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [fromSearch, customerList]);

  const toFiltered = useMemo(() => {
    if (!toSearch) return customerList.slice(0, 20);
    const q = toSearch.toLowerCase();
    return customerList
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [toSearch, customerList]);

  function handleFind() {
    if (!fromId || !toId) return;
    setLoading(true);
    // Run BFS in a microtask to not block the UI
    setTimeout(() => {
      const r = findShortestPath(fromId, toId);
      setResult(r);
      setLoading(false);
    }, 0);
  }

  const fromCustomer = customerList.find((c) => c.id === fromId);
  const toCustomer = customerList.find((c) => c.id === toId);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* From selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Entity A (From)
            </label>
            <div className="relative">
              <input
                type="text"
                value={fromCustomer ? fromCustomer.name : fromSearch}
                onChange={(e) => {
                  setFromSearch(e.target.value);
                  setFromId("");
                  setFromOpen(true);
                }}
                onFocus={() => setFromOpen(true)}
                onBlur={() => setTimeout(() => setFromOpen(false), 150)}
                placeholder="Search customer…"
                className="w-full px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {fromOpen && fromFiltered.length > 0 && (
                <div className="absolute z-20 w-full mt-1 rounded-lg border bg-card shadow-lg max-h-48 overflow-y-auto"
                  style={{ borderColor: "var(--border)" }}>
                  {fromFiltered.map((c) => (
                    <button
                      key={c.id}
                      onMouseDown={() => {
                        setFromId(c.id);
                        setFromSearch("");
                        setFromOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted/30 transition-colors"
                    >
                      <span className="font-mono text-muted-foreground">{c.id}</span>
                      <span className="text-foreground">{c.name}</span>
                      <span className="ml-auto text-muted-foreground">{c.segment}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {fromId && (
              <div className="text-xs text-blue-400 font-mono">{fromId} selected</div>
            )}
          </div>

          {/* To selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Entity B (To)
            </label>
            <div className="relative">
              <input
                type="text"
                value={toCustomer ? toCustomer.name : toSearch}
                onChange={(e) => {
                  setToSearch(e.target.value);
                  setToId("");
                  setToOpen(true);
                }}
                onFocus={() => setToOpen(true)}
                onBlur={() => setTimeout(() => setToOpen(false), 150)}
                placeholder="Search customer…"
                className="w-full px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {toOpen && toFiltered.length > 0 && (
                <div className="absolute z-20 w-full mt-1 rounded-lg border bg-card shadow-lg max-h-48 overflow-y-auto"
                  style={{ borderColor: "var(--border)" }}>
                  {toFiltered.map((c) => (
                    <button
                      key={c.id}
                      onMouseDown={() => {
                        setToId(c.id);
                        setToSearch("");
                        setToOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted/30 transition-colors"
                    >
                      <span className="font-mono text-muted-foreground">{c.id}</span>
                      <span className="text-foreground">{c.name}</span>
                      <span className="ml-auto text-muted-foreground">{c.segment}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {toId && (
              <div className="text-xs text-blue-400 font-mono">{toId} selected</div>
            )}
          </div>
        </div>

        <button
          onClick={handleFind}
          disabled={!fromId || !toId || loading || fromId === toId}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Search className="w-4 h-4" />
          {loading ? "Searching…" : "Find Path"}
        </button>
      </div>

      {/* Result */}
      {result !== null && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          {!result.found ? (
            <div className="text-center py-6 space-y-2">
              <div className="text-3xl">🔍</div>
              <div className="text-foreground font-semibold">No connection found</div>
              <p className="text-muted-foreground text-sm">
                No path found between the two entities within 6 transaction hops.
                They operate in separate parts of the network.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-foreground">
                  Path found — {result.hops} hop{result.hops !== 1 ? "s" : ""} between entities
                </div>
                <span className="text-xs px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {result.path.length} nodes
                </span>
              </div>

              {/* Path visualization */}
              <div className="flex items-center gap-2 flex-wrap">
                {result.path.map((node, i) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <div
                      className="flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => {
                        if (node.type === "CUSTOMER") {
                          router.push(`/entity/${node.id}`);
                        }
                      }}
                    >
                      <div
                        className="px-3 py-2 rounded-lg text-xs font-medium text-white text-center min-w-[80px] max-w-[120px] truncate"
                        style={{
                          background: NODE_COLORS[node.type] ?? "#6B7280",
                          cursor: node.type === "CUSTOMER" ? "pointer" : "default",
                        }}
                        title={node.label}
                      >
                        {node.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {node.type.toLowerCase()}
                      </div>
                    </div>
                    {i < result.path.length - 1 && (
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        {result.edges[i] && (
                          <div className="text-[10px] text-muted-foreground text-center">
                            <div>{result.edges[i].txType}</div>
                            <div>{formatCurrency(result.edges[i].amount)}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Path summary table */}
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">
                        From
                      </th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">
                        To
                      </th>
                      <th className="text-center px-3 py-2 text-muted-foreground font-medium">
                        Type
                      </th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.edges.map((edge, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/50"
                      >
                        <td className="px-3 py-2 font-mono text-muted-foreground">
                          {edge.from}
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">
                          {edge.to}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-1.5 py-0.5 rounded border text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {edge.txType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-foreground font-medium">
                          {formatCurrency(edge.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
