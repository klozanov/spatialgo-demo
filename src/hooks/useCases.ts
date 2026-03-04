"use client";

import { useState, useCallback, useEffect } from "react";
import type { Case, CaseStatus } from "@/types";
import {
  loadCases,
  createCase as storeCreate,
  updateCase as storeUpdate,
} from "@/lib/caseStore";

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    setCases(loadCases());
  }, []);

  const create = useCallback(
    (data: Omit<Case, "id" | "createdAt">) => {
      const newCase = storeCreate(data);
      setCases(loadCases());
      return newCase;
    },
    []
  );

  const update = useCallback(
    (id: string, updates: Partial<Case>) => {
      storeUpdate(id, updates);
      setCases(loadCases());
    },
    []
  );

  const getCaseByCustomerId = useCallback(
    (customerId: string) => {
      return cases.find((c) => c.customerId === customerId);
    },
    [cases]
  );

  return { cases, create, update, getCaseByCustomerId };
}

export type { CaseStatus };
