import type { SiloSimulationResult } from "@/lib/siloSimulation";
import type { RiskResult } from "@/types";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Props {
  siloResult: SiloSimulationResult;
  riskResult: RiskResult;
}

export function SiloComparison({ siloResult, riskResult }: Props) {
  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Silo vs Cross-Rail Detection
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-xs text-gray-500 mb-1">Silo-only alerts</div>
          <div className="text-2xl font-black text-gray-300">{siloResult.amlAlerts + siloResult.cardFraudAlerts}</div>
          <div className="text-[10px] text-gray-600">AML + Card fraud</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
          <div className="text-xs text-blue-400 mb-1">Cross-Rail score</div>
          <div className="text-2xl font-black text-blue-400">{riskResult.score}</div>
          <div className="text-[10px] text-blue-600">{riskResult.band} risk</div>
        </div>
      </div>

      {/* Detection detail */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          {siloResult.cardFraudAlerts > 0
            ? <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            : <XCircle className="w-3 h-3 text-gray-600 shrink-0" />}
          <span className={siloResult.cardFraudAlerts > 0 ? "text-amber-400" : "text-gray-600"}>
            Card fraud engine: {siloResult.cardFraudAlerts > 0 ? `${siloResult.cardFraudAlerts} low-priority alert(s)` : "No alert"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {siloResult.amlAlerts > 1
            ? <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            : <XCircle className="w-3 h-3 text-gray-600 shrink-0" />}
          <span className={siloResult.amlAlerts > 1 ? "text-amber-400" : "text-gray-600"}>
            AML/TM engine: {siloResult.amlAlerts} alert(s)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {siloResult.crossRailAlerts > 0
            ? <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />
            : <XCircle className="w-3 h-3 text-gray-600 shrink-0" />}
          <span className={siloResult.crossRailAlerts > 0 ? "text-blue-400" : "text-gray-600"}>
            Cross-rail: {siloResult.crossRailAlerts > 0 ? "HIGH-confidence alert" : "No alert"}
          </span>
        </div>
      </div>

      {/* What silos miss */}
      {siloResult.missedRisks > 0 && (
        <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="text-xs font-semibold text-red-400 mb-2">
            {siloResult.missedRisks} risk signal(s) invisible to silo systems
          </div>
          <div className="text-xs text-red-300/70">
            On-chain exposure, shared devices, and ring membership are only detectable via cross-rail graph correlation.
          </div>
        </div>
      )}

      {/* False positives */}
      {siloResult.falsePositivesAvoided > 0 && (
        <div className="rounded-lg p-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            {siloResult.falsePositivesAvoided} false positive(s) avoided
          </div>
          <div className="text-xs text-emerald-300/70">
            Cross-rail correlation replaces noisy, low-quality silo alerts with a single high-confidence composite signal.
          </div>
        </div>
      )}

      {/* Explanation items */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Detection Detail</div>
        <div className="space-y-2">
          {siloResult.explanation.map((line, i) => (
            <div key={i} className="text-xs text-gray-400 leading-relaxed pl-3 border-l" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
