import { customers } from "@/lib/dataStore";
import { PathFinderClient } from "./PathFinderClient";

export default function PathFinderPage() {
  const customerList = customers.map((c) => ({
    id: c.id,
    name: c.name,
    segment: c.segment,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Path Finder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find the shortest connection between two entities through the
          transaction graph — reveals fund flow paths and indirect exposure
        </p>
      </div>
      <PathFinderClient customerList={customerList} />
    </div>
  );
}
