import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { NavRail } from "@/components/NavRail";
import { ENTITIES, EDGES, TWINS, getEntity, type Entity, type EntityKind } from "@/lib/sentinelx";
import { BookOpen, Zap } from "lucide-react";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Knowledge Graph · Kairos" },
      { name: "description", content: "Live entity graph of users, devices, servers, accounts, certs and threat actors correlated by Kairos." },
      { property: "og:title", content: "Kairos · Knowledge Graph" },
      { property: "og:description", content: "Palantir-grade live knowledge graph of the bank's digital trust surface." },
    ],
  }),
  component: GraphPage,
});

// Radial layout by kind — simple, deterministic, Gotham-esque.
const KIND_ORDER: EntityKind[] = [
  "threat_actor","ip","device","employee","customer","account","merchant","application","server","certificate","branch",
];
const KIND_COLOR: Record<EntityKind, string> = {
  threat_actor: "var(--danger)",
  ip: "oklch(0.75 0.15 30)",
  device: "var(--warn)",
  employee: "oklch(0.78 0.14 60)",
  customer: "var(--cyber)",
  account: "oklch(0.75 0.12 220)",
  merchant: "oklch(0.72 0.18 320)",
  application: "oklch(0.80 0.14 180)",
  server: "oklch(0.72 0.12 260)",
  certificate: "oklch(0.85 0.16 90)",
  branch: "var(--safe)",
};

function layout(entities: Entity[]) {
  const cx = 500, cy = 380;
  const positions = new Map<string, { x: number; y: number }>();
  const grouped = new Map<EntityKind, Entity[]>();
  KIND_ORDER.forEach(k => grouped.set(k, []));
  entities.forEach(e => grouped.get(e.kind)!.push(e));
  const kinds = KIND_ORDER.filter(k => grouped.get(k)!.length);
  kinds.forEach((k, ki) => {
    const list = grouped.get(k)!;
    const ringR = 90 + ki * 46;
    const step = (Math.PI * 2) / Math.max(list.length, 3);
    const offset = (ki * 0.37);
    list.forEach((e, i) => {
      const a = i * step + offset;
      positions.set(e.id, { x: cx + Math.cos(a) * ringR, y: cy + Math.sin(a) * ringR });
    });
  });
  return positions;
}

function GraphPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>("cust:rohan");
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "compromised">("all");

  const positions = useMemo(() => layout(ENTITIES), []);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ENTITIES.filter(e =>
      (!t || e.label.toLowerCase().includes(t) || e.kind.includes(t)) &&
      (filter === "all" || EDGES.some(ed => (ed.from === e.id || ed.to === e.id) && ed.compromised))
    );
  }, [q, filter]);
  const shownIds = new Set(shown.map(e => e.id));
  const activeEdges = EDGES.filter(e => shownIds.has(e.from) && shownIds.has(e.to));
  const sel = selected ? getEntity(selected) : null;
  const twin = TWINS.find(t => t.entityId === selected);

  const neighbors = new Set<string>();
  if (selected) activeEdges.forEach(e => {
    if (e.from === selected) neighbors.add(e.to);
    if (e.to === selected) neighbors.add(e.from);
  });

  return (
    <div className="min-h-screen">
      <NavRail />
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-4 px-6 py-6">
        {/* Left column: filters + entity list */}
        <aside className="col-span-3 space-y-3">
          <div className="panel p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Natural query</div>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder='e.g. "compromised devices"'
              className="mt-2 w-full rounded-md border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="mt-3 flex gap-2 text-[11px] font-mono">
              {(["all","compromised"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded px-2 py-1 uppercase tracking-widest transition ${
                    filter === f ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="panel max-h-[520px] overflow-auto p-2">
            <div className="px-2 pt-1 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Entities · {shown.length}
            </div>
            <ul className="space-y-0.5">
              {shown.map(e => (
                <li key={e.id}>
                  <button
                    onClick={() => setSelected(e.id)}
                    onMouseEnter={() => setHover(e.id)}
                    onMouseLeave={() => setHover(null)}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition ${
                      selected === e.id ? "bg-primary/15 text-primary" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: KIND_COLOR[e.kind] }} />
                      <span>{e.label}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{e.risk}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Center: SVG graph */}
        <section className="col-span-6">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dynamic Knowledge Graph · realtime</div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                <Legend color="var(--danger)" label="attack" />
                <Legend color="var(--warn)" label="drift" />
                <Legend color="var(--cyber)" label="trust" />
              </div>
            </div>
            <svg viewBox="0 0 1000 760" className="h-[720px] w-full">
              <defs>
                <radialGradient id="halo" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="oklch(0.82 0.17 195 / 0.5)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <filter id="softGlow"><feGaussianBlur stdDeviation="2.5" /></filter>
              </defs>
              {/* concentric rings */}
              {[130,180,230,280,330,380,430].map(r => (
                <circle key={r} cx="500" cy="380" r={r} fill="none" stroke="oklch(0.35 0.05 260 / 0.35)" strokeDasharray="3 6" />
              ))}
              {/* edges */}
              {activeEdges.map((e, i) => {
                const a = positions.get(e.from)!;
                const b = positions.get(e.to)!;
                const mid = { x: (a.x+b.x)/2, y: (a.y+b.y)/2 - 24 };
                const isSel = selected && (e.from === selected || e.to === selected);
                const stroke = e.compromised ? "var(--danger)" : isSel ? "var(--cyber)" : "oklch(0.5 0.05 260 / 0.35)";
                return (
                  <g key={i} opacity={selected && !isSel ? 0.25 : 1}>
                    <path
                      d={`M ${a.x} ${a.y} Q ${mid.x} ${mid.y} ${b.x} ${b.y}`}
                      fill="none" stroke={stroke} strokeWidth={e.compromised ? 1.4 : 0.8}
                      strokeDasharray={e.kind === "encrypts" ? "4 3" : undefined}
                    />
                    {e.compromised && (
                      <circle r="2.4" fill="var(--danger)" filter="url(#softGlow)">
                        <animateMotion dur={`${2 + (i%3)}s`} repeatCount="indefinite"
                          path={`M ${a.x} ${a.y} Q ${mid.x} ${mid.y} ${b.x} ${b.y}`} />
                      </circle>
                    )}
                  </g>
                );
              })}
              {/* nodes */}
              {shown.map(e => {
                const p = positions.get(e.id)!;
                const isSel = selected === e.id;
                const isNeighbor = neighbors.has(e.id);
                const isHover = hover === e.id;
                const r = 6 + (e.risk / 100) * 6;
                const dim = selected && !isSel && !isNeighbor;
                return (
                  <g key={e.id} transform={`translate(${p.x},${p.y})`} opacity={dim ? 0.25 : 1}
                     className="cursor-pointer" onClick={() => setSelected(e.id)}
                     onMouseEnter={() => setHover(e.id)} onMouseLeave={() => setHover(null)}>
                    {(isSel || isHover) && <circle r={r + 12} fill="url(#halo)" />}
                    <circle r={r} fill={KIND_COLOR[e.kind]} stroke={isSel ? "var(--cyber)" : "oklch(0.1 0 0 / 0.6)"} strokeWidth={isSel ? 2 : 1} />
                    {(isSel || isHover) && (
                      <text y={-r - 8} textAnchor="middle" className="fill-foreground" style={{ font: "500 10px ui-monospace" }}>
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        {/* Right column: entity detail + twin */}
        <aside className="col-span-3 space-y-3">
          {sel && (
            <div className="panel p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: KIND_COLOR[sel.kind] }} />
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{sel.kind}</div>
              </div>
              <div className="mt-1 text-lg font-semibold">{sel.label}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Trust" value={sel.trust} tone="safe" />
                <Stat label="Risk" value={sel.risk} tone="danger" />
                <Stat label="Q-Risk" value={sel.quantumRisk ?? 0} tone="warn" />
              </div>
              {sel.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {sel.tags.map(t => (
                    <span key={t} className="rounded bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t}</span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  to="/stories"
                  search={{ entity: sel.id }}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary hover:bg-primary/20"
                >
                  <BookOpen className="h-3 w-3" /> Story
                </Link>
                <Link
                  to="/response"
                  search={{ entity: sel.id }}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-[color:var(--warn)]/50 bg-[color:var(--warn)]/10 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--warn)] hover:bg-[color:var(--warn)]/20"
                >
                  <Zap className="h-3 w-3" /> Response
                </Link>
              </div>

              <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Neighbors</div>
              <ul className="mt-1 space-y-0.5 text-xs">
                {[...neighbors].slice(0, 8).map(n => {
                  const ent = getEntity(n)!;
                  return (
                    <li key={n}>
                      <button className="w-full rounded px-1 py-0.5 text-left hover:bg-muted/40" onClick={() => setSelected(n)}>
                        <span className="text-muted-foreground">→</span> {ent.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {twin && (
            <div className="panel p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Behavioural Digital Twin</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-2xl font-semibold" style={{ color: "var(--danger)" }}>{twin.drift}</div>
                <div className="text-xs text-muted-foreground">/ 100 drift</div>
              </div>
              <div className="mt-3 space-y-1.5">
                {twin.baseline.map((b, i) => {
                  const c = twin.current[i];
                  const pct = Math.min(100, (c.value / Math.max(b.value, c.value, 1)) * 100);
                  return (
                    <div key={i} className="text-[11px]">
                      <div className="flex justify-between font-mono text-muted-foreground">
                        <span>{b.label}</span>
                        <span><span className="text-foreground">{c.value}</span> <span className="text-muted-foreground">/ {b.value}{b.unit ?? ""}</span></span>
                      </div>
                      <div className="mt-0.5 h-1 rounded bg-muted/50">
                        <div className="h-full rounded" style={{ width: `${pct}%`, background: "linear-gradient(90deg,var(--cyber),var(--danger))" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{twin.narrative}</p>
            </div>
          )}
          {sel && <NextBestAction entity={sel} />}
        </aside>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>
  );
}
function Stat({ label, value, tone }: { label: string; value: number; tone: "safe"|"danger"|"warn" }) {
  const color = tone === "safe" ? "var(--safe)" : tone === "warn" ? "var(--warn)" : "var(--danger)";
  return (
    <div className="rounded border border-border/60 bg-card/40 py-2">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

function NextBestAction({ entity }: { entity: Entity }) {
  // Choose an action based on entity kind + risk profile
  const highRisk = entity.risk >= 70;
  const suggestions: Record<string, { title: string; why: string; blast: string; confidence: number; tone: "danger"|"warn"|"cyber"|"safe" }> = {
    threat_actor: { title: "Block attributed C2 ranges at perimeter", why: "Cluster overlap with active kill-chain · 47 sightings in 30d", blast: "perimeter · 0 users", confidence: 97, tone: "danger" },
    ip:           { title: `Sinkhole ${entity.label} for 24h`,           why: "Repeated auth failures + geo mismatch on 3 accounts",       blast: "1 IP · reversible",    confidence: 92, tone: "warn"   },
    device:       { title: "Isolate endpoint via EDR containment",       why: "Reflective DLL injection + outbound to known bad ASN",     blast: "1 device",             confidence: 95, tone: "danger" },
    employee:     { title: "Force MFA re-enrol + review privileges",     why: "Twin drift ≥ 55 · after-hours access to sensitive shares", blast: "1 employee · 0 cust",  confidence: highRisk ? 94 : 78, tone: highRisk ? "danger" : "warn" },
    customer:     { title: "Step-up auth on next high-value txn",        why: "New device + geo mismatch · velocity 3.1× baseline",       blast: "1 customer",           confidence: 88, tone: "warn"   },
    account:      { title: "Freeze outbound payouts pending review",     why: "Fraud score elevated · funds converging on mule cluster",  blast: "1 account · escrow",   confidence: 91, tone: "danger" },
    merchant:     { title: "Flag MCC for chargeback anomaly review",     why: "Chargeback ratio 5.4× peer baseline this week",            blast: "1 merchant",           confidence: 84, tone: "warn"   },
    application:  { title: "Roll app secret + rotate signing keys",      why: "Repo-leak canary matched · unusual scope grants",          blast: "1 app · brief 401s",   confidence: 89, tone: "warn"   },
    server:       { title: "Snapshot + patch to latest hardened image",  why: "CVSS≥8 unpatched · lateral movement path from twin",       blast: "1 server · 90s reboot",confidence: 86, tone: "warn"   },
    certificate:  { title: "Rotate cert → Dilithium-3 (PQC)",            why: "RSA-2048 exposed to HNDL · encrypts sensitive session",     blast: "1 cert · 6-min window",confidence: 90, tone: "cyber"  },
    branch:       { title: "Elevate branch monitoring to Tier-1",        why: "Insider-risk cluster + physical access anomalies",         blast: "1 branch",             confidence: 80, tone: "warn"   },
  };
  const s = suggestions[entity.kind];
  if (!s) return null;
  const color = s.tone === "danger" ? "var(--danger)" : s.tone === "warn" ? "var(--warn)" : s.tone === "cyber" ? "var(--cyber)" : "var(--safe)";
  return (
    <div className="panel p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Suggested next best action</div>
        <span className="rounded border px-1.5 py-0.5 font-mono text-[9px]" style={{ color, borderColor: `color-mix(in oklab, ${color} 40%, transparent)`, background: `color-mix(in oklab, ${color} 10%, transparent)` }}>
          {s.confidence}% conf
        </span>
      </div>
      <div className="text-sm font-medium" style={{ color }}>{s.title}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{s.why}</p>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>Blast · <span className="text-foreground">{s.blast}</span></span>
        <a href="/response" className="rounded border border-border/60 px-2 py-0.5 hover:border-cyber hover:text-cyber">Open playbook →</a>
      </div>
    </div>
  );
}
