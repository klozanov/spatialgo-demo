"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Case, CaseStatus } from "@/types";
import { useCases } from "@/hooks/useCases";
import { getStatusColors, getStatusLabel } from "@/lib/caseStore";
import { cn, formatDate } from "@/lib/utils";
import { ExternalLink, Trash2 } from "lucide-react";

const ALL_STATUSES: CaseStatus[] = ["open", "reviewing", "escalated", "dismissed"];

export function CasesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { cases, update } = useCases();

  const [statusFilter, setStatusFilter] = useState<CaseStatus | "ALL">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(highlightId);

  // Auto-scroll to highlighted case
  useEffect(() => {
    if (highlightId) {
      setExpandedId(highlightId);
      setTimeout(() => {
        document.getElementById(`case-${highlightId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [highlightId]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return cases;
    return cases.filter((c) => c.status === statusFilter);
  }, [cases, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<CaseStatus | "ALL", number> = {
      ALL: cases.length,
      open: 0,
      reviewing: 0,
      escalated: 0,
      dismissed: 0,
    };
    for (const c of cases) counts[c.status]++;
    return counts;
  }, [cases]);

  if (cases.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center space-y-3">
        <div className="text-4xl">📋</div>
        <div className="text-foreground font-semibold">No cases yet</div>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Open a case from any entity investigation page using the "Open Case"
          button in the left panel.
        </p>
        <button
          onClick={() => router.push("/entities")}
          className="mt-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-sm font-medium"
        >
          Browse Entities →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {(["ALL", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              statusFilter === s
                ? "border-blue-500/40 bg-blue-600/10"
                : "bg-card hover:border-blue-500/20"
            )}
          >
            <div className="text-xl font-bold text-foreground">
              {statusCounts[s]}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 capitalize">
              {s === "ALL" ? "All Cases" : getStatusLabel(s)}
            </div>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} case(s)
      </div>

      {/* Cases list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground text-sm">
            No {statusFilter} cases.
          </div>
        ) : (
          filtered.map((c) => (
            <CaseRow
              key={c.id}
              case_={c}
              isExpanded={expandedId === c.id}
              isHighlighted={highlightId === c.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === c.id ? null : c.id))
              }
              onUpdate={(updates) => update(c.id, updates)}
              onNavigate={() => router.push(`/entity/${c.customerId}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CaseRowProps {
  case_: Case;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Case>) => void;
  onNavigate: () => void;
}

function CaseRow({
  case_: c,
  isExpanded,
  isHighlighted,
  onToggle,
  onUpdate,
  onNavigate,
}: CaseRowProps) {
  const [notes, setNotes] = useState(c.notes);
  const [assignee, setAssignee] = useState(c.assignedTo);

  return (
    <div
      id={`case-${c.id}`}
      className={cn(
        "rounded-lg border bg-card transition-colors",
        isHighlighted && "border-blue-500/50 shadow-lg shadow-blue-500/10"
      )}
    >
      {/* Row header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors rounded-lg"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">
              {c.id}
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded border font-medium",
                getStatusColors(c.status)
              )}
            >
              {getStatusLabel(c.status)}
            </span>
            {c.typologyLabels.filter((t) => t !== "None").map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/30"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="text-sm font-semibold text-foreground mt-0.5">
            {c.customerName}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-bold text-foreground">
            Score {c.riskScore}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {formatDate(c.createdAt)}
          </div>
        </div>
        <span className="text-muted-foreground text-xs ml-1">
          {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div
          className="px-4 pb-4 space-y-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="grid grid-cols-2 gap-4 pt-4">
            {/* Status selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={c.status}
                onChange={(e) =>
                  onUpdate({ status: e.target.value as CaseStatus })
                }
                className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {getStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Assigned To
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                onBlur={() => onUpdate({ assignedTo: assignee })}
                placeholder="Analyst name…"
                className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Investigation Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onUpdate({ notes })}
              placeholder="Add investigation notes here…"
              rows={3}
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-xs font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Open Investigation
            </button>
            <button
              onClick={() => onUpdate({ status: "dismissed" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground border border-border hover:border-red-500/30 hover:text-red-400 transition-colors text-xs font-medium ml-auto"
            >
              <Trash2 className="w-3 h-3" />
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
