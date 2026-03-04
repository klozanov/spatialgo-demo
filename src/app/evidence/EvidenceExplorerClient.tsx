"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ExternalLink } from "lucide-react";
import { riskBandBg, formatDateTime } from "@/lib/utils";
import type { RiskBand } from "@/types";

interface EvidenceRow {
  id: string;
  customerId: string;
  customerName: string;
  customerScore: number;
  customerBand: RiskBand;
  severity: RiskBand;
  title: string;
  description: string;
  relatedNodeIds: string[];
  relatedTransactionIds: string[];
  timestamp: string;
  type: string;
}

interface Props {
  evidenceItems: EvidenceRow[];
}

const TYPE_LABELS: Record<string, string> = {
  EXCHANGE_EXPOSURE: "Exchange",
  CARD_EXCHANGE: "Card-Exchange",
  ONCHAIN_RISK: "On-Chain",
  LAYERING: "Layering",
  NETWORK: "Network",
  VELOCITY: "Velocity",
};

const PAGE_SIZE = 30;

export function EvidenceExplorerClient({ evidenceItems }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<RiskBand | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const types = useMemo(() => {
    const s = new Set(evidenceItems.map((e) => e.type));
    return ["ALL", ...Array.from(s).sort()];
  }, [evidenceItems]);

  const filtered = useMemo(() => {
    let result = evidenceItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.customerId.toLowerCase().includes(q) ||
          e.customerName.toLowerCase().includes(q)
      );
    }
    if (severityFilter !== "ALL") {
      result = result.filter((e) => e.severity === severityFilter);
    }
    if (typeFilter !== "ALL") {
      result = result.filter((e) => e.type === typeFilter);
    }
    return result.sort((a, b) => {
      const sev: Record<RiskBand, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const diff = sev[b.severity] - sev[a.severity];
      if (diff !== 0) return diff;
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [evidenceItems, search, severityFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search evidence, customers…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-gray-200 placeholder-gray-500 border outline-none focus:border-blue-500"
            style={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value as RiskBand | "ALL"); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border text-gray-300 outline-none"
          style={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <option value="ALL">All Severities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border text-gray-300 outline-none"
          style={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)" }}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "ALL" ? "All Types" : TYPE_LABELS[t] ?? t}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">{filtered.length} results</span>
      </div>

      {/* Evidence list */}
      <div className="space-y-2">
        {paginated.map((ev) => (
          <div
            key={ev.id}
            className="rounded-xl border p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
            style={{ background: "#111827", borderColor: "rgba(255,255,255,0.07)" }}
            onClick={() => router.push(`/entity/${ev.customerId}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${riskBandBg(ev.severity)}`}>
                    {ev.severity}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border text-gray-500" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    {TYPE_LABELS[ev.type] ?? ev.type}
                  </span>
                  <span className="text-sm font-medium text-white">{ev.title}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{ev.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-[10px] text-blue-400">{ev.customerId}</span>
                  <span className="text-[10px] text-gray-500">{ev.customerName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${riskBandBg(ev.customerBand)}`}>
                    {ev.customerScore} {ev.customerBand}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-600">{formatDateTime(ev.timestamp)}</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border text-gray-400 hover:text-gray-200 disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border text-gray-400 hover:text-gray-200 disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
