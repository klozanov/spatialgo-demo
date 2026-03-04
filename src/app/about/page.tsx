import { Shield, Database, GitMerge, BarChart3, Network } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-6 space-y-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Block({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">About This Demo</h1>
        <p className="text-sm text-muted-foreground mt-1">Architecture, data model, and context for SpatialGO Cross-Rail Intelligence</p>
      </div>

      {/* Pitch */}
      <Section title="What is SpatialGO Cross-Rail Intelligence?">
        <p className="text-sm text-foreground/80 leading-relaxed">
          A correlation layer that connects <strong className="text-blue-400">SEPA</strong> + <strong className="text-teal-400">card rails</strong> with <strong className="text-amber-400">exchange exposure</strong> and <strong className="text-purple-400">on-chain risk clusters</strong> to expose laundering networks and reduce AML false positives.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Traditional banking AML systems are siloed: card fraud engines, SEPA/TM systems, and crypto tools don't talk to each other. Criminals exploit this by moving money across rails — SEPA → Exchange → On-chain (mixer/bridge) → Payout. Each step looks benign in isolation; together, it's clearly suspicious.
        </p>
      </Section>

      {/* Architecture */}
      <Section title="Architecture (Demo)">
        <div className="grid grid-cols-2 gap-3">
          <Block
            icon={<Database className="w-4 h-4" />}
            title="Static Data Layer"
            description="All data loaded from JSON files in /src/data — no database, no external APIs. 250 customers, 8,000+ transactions across SEPA, CARD, ONCHAIN, and PAYOUT rails."
            color="#2563EB"
          />
          <Block
            icon={<GitMerge className="w-4 h-4" />}
            title="Risk Engine v2"
            description="Deterministic, explainable scoring (0–100). Each signal produces an evidence item. Score = sum of weighted signals capped at 100. Bands: LOW (0–39), MEDIUM (40–69), HIGH (70+)."
            color="#8B5CF6"
          />
          <Block
            icon={<Network className="w-4 h-4" />}
            title="Network Analysis"
            description="Union-Find algorithm detects connected components via shared devices and shared beneficiaries. Components of ≥6 nodes are flagged as rings."
            color="#14B8A6"
          />
          <Block
            icon={<BarChart3 className="w-4 h-4" />}
            title="Graph Builder v2"
            description="Builds React Flow graphs per entity: customer → exchanges → wallets → clusters → beneficiaries → devices. Suspicious paths highlighted in red."
            color="#F59E0B"
          />
        </div>
      </Section>

      {/* Architecture diagram */}
      <Section title="Architecture Diagram">
        <div className="rounded-xl p-4 font-mono text-xs text-muted-foreground leading-relaxed" style={{ background: "var(--background)" }}>
          <div className="text-foreground/70 mb-3">[ Data Sources ]</div>
          <div className="flex gap-4 mb-4">
            {["SEPA Transfers", "Card Transactions", "Exchange Data", "Blockchain (on-chain)", "Device Fingerprints"].map((s) => (
              <div key={s} className="px-2 py-1 rounded border text-center text-[10px]" style={{ borderColor: "rgba(37,99,235,0.3)", color: "#60A5FA" }}>{s}</div>
            ))}
          </div>
          <div className="text-center text-muted-foreground/50 my-2">▼ Static JSON → dataStore.ts (indexes)</div>
          <div className="flex gap-4 my-3 justify-center">
            {["networkAnalysis.ts", "riskEngine.v2.ts", "graphBuilder.v2.ts"].map((m) => (
              <div key={m} className="px-3 py-1.5 rounded border text-[10px]" style={{ borderColor: "rgba(139,92,246,0.3)", color: "#A78BFA" }}>{m}</div>
            ))}
          </div>
          <div className="text-center text-muted-foreground/50 my-2">▼ Computed results</div>
          <div className="flex gap-3 justify-center">
            {["/dashboard", "/entities", "/entity/[id]", "/networks", "/evidence"].map((r) => (
              <div key={r} className="px-2 py-1 rounded border text-[10px]" style={{ borderColor: "rgba(20,184,166,0.3)", color: "#34D399" }}>{r}</div>
            ))}
          </div>
        </div>
      </Section>

      {/* Scoring */}
      <Section title="Risk Scoring Signals">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["SEPA → exchange exists", "+15"],
            ["SEPA → exchange count ≥ 3", "+10"],
            ["SEPA → exchange amount ≥ €20k", "+10"],
            ["CARD → exchange exists", "+10"],
            ["CARD → exchange count ≥ 2", "+5"],
            ["CARD → exchange ≥ €5k", "+5"],
            ["ONCHAIN to HIGH-risk cluster", "+20"],
            ["ONCHAIN tx count ≥ 2", "+5"],
            ["PAYOUT ≥ 3 within 72h after exchange", "+10"],
            ["PAYOUT to shared beneficiaries", "+10"],
            ["Shared device ≥ 2 others", "+10"],
            ["Shared beneficiaries ≥ 2 others", "+10"],
            ["Network size ≥ 6", "+10"],
            ["Network has ≥ 3 HIGH entities", "+5"],
            ["Exchange → ONCHAIN within 24h", "+5"],
            ["Exchange → PAYOUT within 48h", "+5"],
          ].map(([signal, pts]) => (
            <div key={signal} className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{ background: "var(--muted)" }}>
              <span className="text-muted-foreground">{signal}</span>
              <span className="text-amber-400 font-bold">{pts}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Data schema */}
      <Section title="Data Schema">
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { name: "Customer", fields: "id, name, segment" },
            { name: "Transaction", fields: "id, type, fromCustomerId, toEntityId, amount, currency, timestamp, tag?, exchangeId?, walletId?, clusterId?" },
            { name: "Exchange", fields: "id, name, riskLevel" },
            { name: "Wallet", fields: "id, exchangeId, clusterId, address" },
            { name: "Cluster", fields: "id, tag, riskLevel" },
            { name: "Beneficiary", fields: "id, iban, label, linkedCustomerIds[]" },
            { name: "Merchant", fields: "id, name, mcc?, category?, riskLevel?" },
            { name: "Device", fields: "id, fingerprint, linkedCustomerIds[]" },
          ].map((schema) => (
            <div key={schema.name} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
              <div className="font-bold text-foreground mb-1">{schema.name}</div>
              <div className="text-muted-foreground leading-relaxed">{schema.fields}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Disclaimer */}
      <div className="rounded-2xl border p-5" style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-red-400 mb-1">Disclaimer — Synthetic Data Only</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              All data in this demo is entirely synthetic and randomly generated. Customer names, IBANs, wallet addresses, transaction amounts, and all other data points are fictional and bear no relation to any real person, organization, or financial entity. This demo is for illustrative and demonstration purposes only. No real AML decisions should be made using this system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
