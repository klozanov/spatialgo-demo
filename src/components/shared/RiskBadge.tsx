import { cn, riskBandBg } from "@/lib/utils";
import type { RiskBand } from "@/types";

interface Props {
  band: RiskBand;
  score?: number;
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({ band, score, size = "md" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        riskBandBg(band),
        size === "sm" && "text-[10px] px-2 py-0.5",
        size === "md" && "text-xs px-2.5 py-1",
        size === "lg" && "text-sm px-3 py-1.5"
      )}
    >
      {score !== undefined && <span>{score}</span>}
      <span>{band}</span>
    </span>
  );
}
