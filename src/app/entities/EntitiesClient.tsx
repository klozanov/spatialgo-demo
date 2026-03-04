"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatDateTime } from "@/lib/utils";
import type { Customer, RiskResult, RiskBand } from "@/types";

interface Row {
  customer: Customer;
  result: RiskResult;
  exchangeExposed: boolean;
}

interface Props {
  rows: Row[];
}

const PAGE_SIZE = 25;

type SortKey = "score" | "name" | "networkSize";
type SortDir = "asc" | "desc";

export function EntitiesClient({ rows }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskBand | "ALL">("ALL");
  const [exposureFilter, setExposureFilter] = useState<"ALL" | "YES" | "NO">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const segments = useMemo(() => {
    const s = new Set(rows.map((r) => r.customer.segment));
    return ["ALL", ...Array.from(s).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.customer.name.toLowerCase().includes(q) ||
          r.customer.id.toLowerCase().includes(q)
      );
    }
    if (segmentFilter !== "ALL") {
      result = result.filter((r) => r.customer.segment === segmentFilter);
    }
    if (riskFilter !== "ALL") {
      result = result.filter((r) => r.result.band === riskFilter);
    }
    if (exposureFilter !== "ALL") {
      result = result.filter((r) =>
        exposureFilter === "YES" ? r.exchangeExposed : !r.exchangeExposed
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") cmp = a.result.score - b.result.score;
      else if (sortKey === "name") cmp = a.customer.name.localeCompare(b.customer.name);
      else if (sortKey === "networkSize") cmp = a.result.networkSize - b.result.networkSize;
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [rows, search, segmentFilter, riskFilter, exposureFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-gray-600" />;
    return sortDir === "desc" ? (
      <ChevronDown className="w-3 h-3 text-blue-400" />
    ) : (
      <ChevronUp className="w-3 h-3 text-blue-400" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-gray-200 placeholder-gray-500 border outline-none focus:border-blue-500"
            style={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>

        <select
          value={segmentFilter}
          onChange={(e) => { setSegmentFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border text-gray-300 outline-none"
          style={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)" }}
        >
          {segments.map((s) => <option key={s} value={s}>{s === "ALL" ? "All Segments" : s}</option>)}
        </select>

        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value as RiskBand | "ALL"); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border text-gray-300 outline-none"
          style={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={exposureFilter}
          onChange={(e) => { setExposureFilter(e.target.value as "ALL" | "YES" | "NO"); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm border text-gray-300 outline-none"
          style={{ background: "#111827", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <option value="ALL">All Exposure</option>
          <option value="YES">Exchange Exposed</option>
          <option value="NO">Not Exposed</option>
        </select>

        <span className="text-xs text-gray-500">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#111827", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1">Name <SortIcon col="name" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort("score")}
                >
                  <div className="flex items-center gap-1">Risk Score <SortIcon col="score" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange Exp.</th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300"
                  onClick={() => toggleSort("networkSize")}
                >
                  <div className="flex items-center gap-1">Network <SortIcon col="networkSize" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(({ customer, result, exchangeExposed }) => (
                <tr
                  key={customer.id}
                  onClick={() => router.push(`/entity/${customer.id}`)}
                  className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-400">{customer.id}</td>
                  <td className="px-4 py-3 text-gray-200">{customer.name}</td>
                  <td className="px-4 py-3 text-gray-400">{customer.segment}</td>
                  <td className="px-4 py-3">
                    <RiskBadge band={result.band} score={result.score} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={exchangeExposed ? "text-amber-400" : "text-gray-600"}>
                      {exchangeExposed ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{result.networkSize}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {result.lastSuspiciousActivity ? formatDateTime(result.lastSuspiciousActivity) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} · {filtered.length} entities
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
