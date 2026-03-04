import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskBand } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function riskBandColor(band: RiskBand): string {
  switch (band) {
    case "HIGH":
      return "#EF4444";
    case "MEDIUM":
      return "#F59E0B";
    case "LOW":
      return "#10B981";
  }
}

export function riskBandBg(band: RiskBand): string {
  switch (band) {
    case "HIGH":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "MEDIUM":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "LOW":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
