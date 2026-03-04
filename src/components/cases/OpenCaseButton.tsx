"use client";

import { useRouter } from "next/navigation";
import type { RiskResult } from "@/types";
import type { Customer } from "@/types";
import { useCases } from "@/hooks/useCases";
import { Briefcase, ExternalLink } from "lucide-react";

interface Props {
  customer: Customer;
  riskResult: RiskResult;
}

export function OpenCaseButton({ customer, riskResult }: Props) {
  const router = useRouter();
  const { create, getCaseByCustomerId } = useCases();

  function handleClick() {
    const existing = getCaseByCustomerId(customer.id);
    if (existing) {
      router.push(`/cases?highlight=${existing.id}`);
    } else {
      const newCase = create({
        customerId: customer.id,
        customerName: customer.name,
        status: "open",
        assignedTo: "",
        notes: "",
        riskScore: riskResult.score,
        typologyLabels: riskResult.typologies,
      });
      router.push(`/cases?highlight=${newCase.id}`);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-muted-foreground border border-border hover:border-blue-500/30 hover:text-foreground transition-colors text-xs font-medium justify-center"
    >
      <Briefcase className="w-3.5 h-3.5" />
      Open Case
      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
    </button>
  );
}
