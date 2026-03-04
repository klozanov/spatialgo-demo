"use client";

import { useState, useMemo, useEffect } from "react";
import type { Transaction } from "@/types";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

const TX_TYPE_COLORS: Record<string, string> = {
  SEPA: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CARD: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ONCHAIN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PAYOUT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

interface Props {
  transactions: Transaction[];
  onFocusNode: (nodeId: string) => void;
}

export function PlaybackPanel({ transactions, onFocusNode }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);

  const sortedTxs = useMemo(
    () => [...transactions].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [transactions]
  );

  const total = sortedTxs.length;
  const current = sortedTxs[currentIndex];

  // Notify graph of current node when index changes
  useEffect(() => {
    if (current) {
      onFocusNode(current.toEntityId);
    }
  }, [currentIndex, current, onFocusNode]);

  // Playback interval
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => {
        if (i >= total - 1) {
          setIsPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, total]);

  function restart() {
    setIsPlaying(false);
    setCurrentIndex(0);
  }

  function goToEnd() {
    setIsPlaying(false);
    setCurrentIndex(total - 1);
  }

  if (total === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No transactions to play back.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Transaction {currentIndex + 1} of {total}</span>
          <span>{Math.round(((currentIndex + 1) / total) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={total - 1}
          value={currentIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(Number(e.target.value));
          }}
          className="w-full accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Current transaction */}
      {current && (
        <div
          className="rounded-lg border p-3 space-y-2"
          style={{ borderColor: "var(--border)", background: "var(--muted)" }}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded border font-medium",
                TX_TYPE_COLORS[current.type] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"
              )}
            >
              {current.type}
            </span>
            <span className="text-xs font-bold text-foreground">
              {formatCurrency(current.amount)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {current.id}
          </div>
          <div className="text-xs text-muted-foreground">
            → {current.toEntityId}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDateTime(current.timestamp)}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={restart}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          title="Restart"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() =>
            setCurrentIndex((i) => Math.max(0, i - 1))
          }
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsPlaying((v) => !v)}
          className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() =>
            setCurrentIndex((i) => Math.min(total - 1, i + 1))
          }
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={goToEnd}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          title="Go to end"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Speed:</span>
        {([1, 2, 4] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
              speed === s
                ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                : "text-muted-foreground border-border hover:border-blue-500/30"
            )}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Mini transaction list */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          All Transactions
        </div>
        {sortedTxs.map((tx, i) => (
          <button
            key={tx.id}
            onClick={() => {
              setIsPlaying(false);
              setCurrentIndex(i);
            }}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left",
              i === currentIndex
                ? "bg-blue-600/20 text-blue-400"
                : "text-muted-foreground hover:bg-muted/30"
            )}
          >
            <span
              className={cn(
                "shrink-0 px-1.5 py-0.5 rounded border text-[10px]",
                TX_TYPE_COLORS[tx.type] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"
              )}
            >
              {tx.type}
            </span>
            <span className="flex-1 truncate font-mono">{tx.toEntityId}</span>
            <span className="shrink-0">{formatCurrency(tx.amount)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
