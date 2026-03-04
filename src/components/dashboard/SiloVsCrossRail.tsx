interface Props {
  siloAlerts: number;
  crossRailAlerts: number;
  falsePositivesAvoided: number;
}

export function SiloVsCrossRail({ siloAlerts, crossRailAlerts, falsePositivesAvoided }: Props) {
  return (
    <div
      className="rounded-2xl p-5 border h-64 flex flex-col gap-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <h3 className="text-sm font-semibold text-foreground">Silo vs Cross-Rail</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Silo-only alerts</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" style={{ width: `${Math.min(100, (siloAlerts / (siloAlerts + 10)) * 120)}px` }} />
            <span className="text-sm font-bold text-foreground w-10 text-right">{siloAlerts}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Cross-rail alerts</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, (crossRailAlerts / (siloAlerts + 10)) * 120)}px` }} />
            <span className="text-sm font-bold text-blue-400 w-10 text-right">{crossRailAlerts}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">False positives avoided</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (falsePositivesAvoided / (siloAlerts + 10)) * 120)}px` }} />
            <span className="text-sm font-bold text-emerald-400 w-10 text-right">{falsePositivesAvoided}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto p-3 rounded-lg" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
        <p className="text-xs text-blue-400 leading-relaxed">
          Cross-rail correlation reduces noise by <strong>{siloAlerts > 0 ? Math.round((falsePositivesAvoided / siloAlerts) * 100) : 0}%</strong> while surfacing hidden rings invisible to silo systems.
        </p>
      </div>
    </div>
  );
}
