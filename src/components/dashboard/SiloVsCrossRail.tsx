interface Props {
  siloAlerts: number;
  crossRailAlerts: number;
  falsePositivesAvoided: number;
}

export function SiloVsCrossRail({ siloAlerts, crossRailAlerts, falsePositivesAvoided }: Props) {
  return (
    <div
      className="rounded-2xl p-5 border h-64 flex flex-col gap-4"
      style={{ background: "#111827", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <h3 className="text-sm font-semibold text-gray-300">Silo vs Cross-Rail</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Silo-only alerts</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-gray-600" style={{ width: `${Math.min(100, (siloAlerts / (siloAlerts + 10)) * 120)}px` }} />
            <span className="text-sm font-bold text-gray-300 w-10 text-right">{siloAlerts}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Cross-rail alerts</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, (crossRailAlerts / (siloAlerts + 10)) * 120)}px` }} />
            <span className="text-sm font-bold text-blue-400 w-10 text-right">{crossRailAlerts}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">False positives avoided</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (falsePositivesAvoided / (siloAlerts + 10)) * 120)}px` }} />
            <span className="text-sm font-bold text-emerald-400 w-10 text-right">{falsePositivesAvoided}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto p-3 rounded-lg" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
        <p className="text-xs text-blue-300 leading-relaxed">
          Cross-rail correlation reduces noise by <strong>{siloAlerts > 0 ? Math.round((falsePositivesAvoided / siloAlerts) * 100) : 0}%</strong> while surfacing hidden rings invisible to silo systems.
        </p>
      </div>
    </div>
  );
}
