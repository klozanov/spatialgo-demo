import { Suspense } from "react";
import { CasesClient } from "./CasesClient";

export default function CasesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Case Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Investigator workflow — track, review, and escalate suspicious entity
          cases
        </p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading cases…</div>}>
        <CasesClient />
      </Suspense>
    </div>
  );
}
