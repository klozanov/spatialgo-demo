import type { Customer, RiskResult } from "@/types";
import { riskBandColor, formatCurrency } from "@/lib/utils";

interface Props {
  customer: Customer;
  result: RiskResult;
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-300 text-right">{value}</span>
    </div>
  );
}

export function EntitySummary({ customer, result }: Props) {
  const color = riskBandColor(result.band);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-1 pt-2">
        <div className="text-xs text-gray-500 font-mono">{customer.id}</div>
        <div className="text-base font-bold text-white leading-tight">{customer.name}</div>
        <div className="text-xs text-gray-400">{customer.segment}</div>
      </div>

      {/* Score badge */}
      <div
        className="rounded-xl p-4 text-center"
        style={{ background: `${color}12`, border: `1px solid ${color}30` }}
      >
        <div className="text-4xl font-black" style={{ color }}>{result.score}</div>
        <div className="text-xs font-bold mt-1" style={{ color }}>{result.band} RISK</div>
        <div className="text-xs text-gray-500 mt-1">Cross-Rail Score</div>
      </div>

      {/* Primary drivers */}
      {result.primaryDrivers.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Top Drivers</div>
          <div className="space-y-1.5">
            {result.primaryDrivers.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 truncate">{d.label}</span>
                <span className="text-xs font-bold text-amber-400 shrink-0">+{d.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key stats */}
      <div>
        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Key Stats</div>
        <StatRow
          label="Exchange txs"
          value={`${result.exchangeTxCount} (${formatCurrency(result.exchangeTxAmount)})`}
        />
        <StatRow
          label="Card→Exchange"
          value={`${result.cardToExchangeCount} (${formatCurrency(result.cardToExchangeAmount)})`}
        />
        <StatRow label="On-chain txs" value={result.onchainTxCount} />
        <StatRow label="Shared devices" value={result.sharedDeviceCount} />
        <StatRow label="Shared beneficiaries" value={result.sharedBeneficiaryCount} />
        <StatRow
          label="Velocity flag"
          value={
            <span className={result.velocityFlag ? "text-red-400" : "text-gray-600"}>
              {result.velocityFlag ? "YES" : "No"}
            </span>
          }
        />
        <StatRow label="Network size" value={result.networkSize} />
      </div>
    </div>
  );
}
