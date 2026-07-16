import type { SecurityEvent } from "@/lib/security-data";
import { severityFor } from "@/lib/security-data";
import { CreditCard, Fingerprint, Globe, KeyRound, LogIn, Mail, ShieldAlert, ShieldOff, UserCog, Bug, ChevronDown } from "lucide-react";
import { useState } from "react";

const iconFor: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  login: LogIn, transaction: CreditCard, device: Fingerprint, ip: Globe,
  malware: Bug, employee: UserCog, password: KeyRound, block: ShieldOff, phishing: Mail,
};

const sevColor: Record<string, string> = {
  low: "var(--safe)", medium: "var(--warn)", high: "var(--danger)", critical: "var(--danger)",
};

interface Cluster { user: string; events: SecurityEvent[]; maxRisk: number; latestTs: number }

export function Timeline({ events, onSelect, selectedId }: { events: SecurityEvent[]; onSelect: (e: SecurityEvent) => void; selectedId?: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const grouped = events.reduce<Record<string, Cluster>>((acc, e) => {
    const c = acc[e.user] ?? { user: e.user, events: [], maxRisk: 0, latestTs: 0 };
    c.events.push(e);
    c.maxRisk = Math.max(c.maxRisk, e.risk);
    c.latestTs = Math.max(c.latestTs, e.timestamp);
    acc[e.user] = c;
    return acc;
  }, {});

  const clusters = Object.values(grouped).sort((a, b) => b.latestTs - a.latestTs);

  return (
    <div className="space-y-2.5">
      {clusters.map((c) => {
        const sev = severityFor(c.maxRisk);
        const color = sevColor[sev];
        const isOpen = expanded[c.user] ?? c.maxRisk >= 65;
        const sorted = [...c.events].sort((a, b) => b.timestamp - a.timestamp);
        const latest = sorted[0];
        const LatestIcon = iconFor[latest.type] ?? ShieldAlert;

        return (
          <div key={c.user} className="panel overflow-hidden" style={{ borderColor: sev === "high" || sev === "critical" ? color : undefined }}>
            <button
              onClick={() => setExpanded((s) => ({ ...s, [c.user]: !isOpen }))}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary" style={{ color }}>
                <LatestIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{c.user}</span>
                  <span className="rounded-full bg-secondary/70 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{c.events.length} events</span>
                </div>
                <div className="text-xs text-muted-foreground truncate font-mono">
                  Latest: {latest.title} · {latest.time}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color }}>{sev}</div>
                <div className="text-lg font-bold" style={{ color }}>{c.maxRisk}</div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="border-t border-border/50 bg-background/30 px-2 py-2 space-y-1">
                {sorted.map((e) => {
                  const Icon = iconFor[e.type] ?? ShieldAlert;
                  const s = severityFor(e.risk);
                  const ec = sevColor[s];
                  const isSel = e.id === selectedId;
                  return (
                    <button
                      key={e.id}
                      onClick={() => onSelect(e)}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${isSel ? "bg-cyber/10 border border-cyber/60" : "hover:bg-secondary/40 border border-transparent"}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" style={{ color: ec }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-muted-foreground">{e.time}</span>
                          <span className="text-xs font-medium truncate">{e.title}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate font-mono">
                          {e.country} · {e.device}{e.amount ? ` · ₹${e.amount.toLocaleString("en-IN")}` : ""}
                        </div>
                      </div>
                      <div className="text-sm font-bold" style={{ color: ec }}>{e.risk}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {clusters.length === 0 && (
        <div className="py-10 text-center text-sm text-muted-foreground">No events yet. Simulate an attack to see the timeline populate.</div>
      )}
    </div>
  );
}
