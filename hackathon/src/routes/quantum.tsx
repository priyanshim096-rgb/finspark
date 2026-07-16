import { createFileRoute } from "@tanstack/react-router";
import { NavRail } from "@/components/NavRail";
import { CRYPTO_ASSETS, quantumReadiness } from "@/lib/sentinelx";
import { KeyRound, ShieldAlert, Atom, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/quantum")({
  head: () => ({
    meta: [
      { title: "Quantum Risk Center · Kairos" },
      { name: "description", content: "Post-quantum readiness, Harvest-Now-Decrypt-Later exposure and crypto asset inventory." },
      { property: "og:title", content: "Kairos · Quantum Risk Center" },
      { property: "og:description", content: "Track PQC migration priority, harvest risk, cert lifecycle and encryption hotspots." },
    ],
  }),
  component: QuantumPage,
});

function QuantumPage() {
  const { readiness, harvestRisk, migrationPriority } = quantumReadiness();
  return (
    <div className="min-h-screen">
      <NavRail />
      <div className="mx-auto max-w-[1600px] space-y-4 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ScoreDial title="Quantum Readiness" value={readiness} tone="safe" icon={<Atom className="h-4 w-4" />} hint="% of encrypted volume protected by PQC-ready algorithms" />
          <ScoreDial title="Harvest Risk Index" value={harvestRisk} tone="danger" icon={<ShieldAlert className="h-4 w-4" />} hint="Volume-weighted HNDL exposure across the crypto estate" />
          <ScoreDial title="Migration Priority" value={migrationPriority} tone="warn" icon={<TrendingDown className="h-4 w-4" />} hint="Share of assets that must be migrated in next PQC wave" />
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="panel col-span-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Crypto Asset Inventory</div>
              <div className="font-mono text-[10px] text-muted-foreground">{CRYPTO_ASSETS.length} assets · 41.1 TB/mo encrypted</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-2 text-left">Service</th>
                    <th className="px-4 py-2 text-left">Algorithm</th>
                    <th className="px-4 py-2 text-right">Key age</th>
                    <th className="px-4 py-2 text-right">Expires</th>
                    <th className="px-4 py-2 text-right">Volume</th>
                    <th className="px-4 py-2 text-left">PQC</th>
                    <th className="px-4 py-2 text-left">Harvest</th>
                  </tr>
                </thead>
                <tbody>
                  {CRYPTO_ASSETS.map(a => (
                    <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium">{a.service}</td>
                      <td className="px-4 py-2"><code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px]">{a.algo}</code></td>
                      <td className="px-4 py-2 text-right font-mono">{a.keyAgeDays}d</td>
                      <td className="px-4 py-2 text-right font-mono" style={{ color: a.expiresInDays < 60 ? "var(--danger)" : undefined }}>{a.expiresInDays}d</td>
                      <td className="px-4 py-2 text-right font-mono">{a.volumeGBpm.toLocaleString()} GB</td>
                      <td className="px-4 py-2">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${a.pqcReady ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15"}`}
                          style={a.pqcReady ? undefined : { color: "var(--danger)" }}>
                          {a.pqcReady ? "ready" : "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded bg-muted/50">
                            <div className="h-full rounded" style={{ width: `${a.harvestRisk}%`, background: `linear-gradient(90deg, var(--cyber), var(--danger))` }} />
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">{a.harvestRisk}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="col-span-4 space-y-4">
            <div className="panel p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Harvest-Now-Decrypt-Later hotspot</div>
              <div className="mt-2 flex items-baseline gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <div className="text-lg font-semibold">swift-gateway · RSA-2048</div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                2.4 TB/mo of SWIFT payloads flow through a 812-day RSA-2048 keypair. Encrypted archive exfiltrated during
                <span className="mx-1 text-foreground">STORY-HNDL-014</span> would remain decipherable to a fault-tolerant quantum adversary post-2030.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="rounded bg-primary/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary hover:bg-primary/30">
                  Migrate → Dilithium-3
                </button>
                <button className="rounded bg-muted/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/60">
                  Schedule wave
                </button>
              </div>
            </div>

            <div className="panel p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Certificate lifecycle · next 90 days</div>
              <ul className="mt-2 space-y-1.5 text-xs">
                {CRYPTO_ASSETS.filter(a => a.expiresInDays <= 90).sort((a,b)=>a.expiresInDays-b.expiresInDays).map(a => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span>{a.service}</span>
                    <span className="font-mono text-[10px]" style={{ color: a.expiresInDays < 30 ? "var(--danger)" : "var(--warn)" }}>{a.expiresInDays}d · {a.algo}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ScoreDial({ title, value, tone, icon, hint }: { title: string; value: number; tone: "safe"|"warn"|"danger"; icon: React.ReactNode; hint: string }) {
  const color = tone === "safe" ? "var(--safe)" : tone === "warn" ? "var(--warn)" : "var(--danger)";
  const r = 42, c = 2 * Math.PI * r;
  const dash = c * (value / 100);
  return (
    <div className="panel flex items-center gap-4 p-5">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="oklch(0.30 0.04 260 / 0.6)" strokeWidth="8" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 55 55)" />
        <text x="55" y="60" textAnchor="middle" style={{ font: "600 22px ui-monospace", fill: "var(--color-foreground)" }}>{value}</text>
      </svg>
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {icon}{title}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
