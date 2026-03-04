"use client";

import { useEffect, useRef, useState } from "react";
import type { Customer, RiskResult, Transaction, TypologyLabel } from "@/types";
import { generateSARText } from "@/lib/sarGenerator";
import { X, Copy, Check } from "lucide-react";

interface Props {
  customer: Customer;
  result: RiskResult;
  transactions: Transaction[];
  typologies: TypologyLabel[];
  onClose: () => void;
}

export function SARModal({
  customer,
  result,
  transactions,
  typologies,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const sarText = generateSARText(customer, result, transactions, typologies);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleCopy() {
    await navigator.clipboard.writeText(sarText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl border shadow-2xl flex flex-col"
        style={{ background: "var(--card)", borderColor: "var(--border)", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-sm font-bold text-foreground">
              SAR Draft — {customer.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Suspicious Activity Report · {customer.id} · Risk {result.score}/100
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <pre className="font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
            {sarText}
          </pre>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 border-t shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-xs text-muted-foreground">
            Press Esc to close
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-xs font-medium"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
