import type { Case, CaseStatus, TypologyLabel } from "@/types";

const STORAGE_KEY = "spatialgo-cases";

export function loadCases(): Case[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Case[];
  } catch {
    return [];
  }
}

export function saveCases(cases: Case[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export function createCase(
  data: Omit<Case, "id" | "createdAt">
): Case {
  const newCase: Case = {
    ...data,
    id: `CASE-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existing = loadCases();
  saveCases([...existing, newCase]);
  return newCase;
}

export function updateCase(id: string, updates: Partial<Case>): void {
  const cases = loadCases().map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveCases(cases);
}

export function getCaseByCustomerId(customerId: string): Case | undefined {
  return loadCases().find((c) => c.customerId === customerId);
}

export function getStatusLabel(status: CaseStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "reviewing":
      return "Reviewing";
    case "escalated":
      return "Escalated";
    case "dismissed":
      return "Dismissed";
  }
}

export function getStatusColors(status: CaseStatus): string {
  switch (status) {
    case "open":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "reviewing":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "escalated":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "dismissed":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

export { type CaseStatus, type TypologyLabel };
