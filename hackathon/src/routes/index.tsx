import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Activity, AlertOctagon, Ban, CircleDot, CreditCard, Radar, Shield, ShieldCheck,
  ShieldOff, Users, Zap, Skull, Waves, MailWarning, LogIn, LogOut, LayoutDashboard,
  MessageSquare, FlaskConical, ListOrdered,
} from "lucide-react";
import { AlertMode } from "@/components/AlertMode";
import { Timeline } from "@/components/Timeline";
import { RiskGauge, RiskTrendChart, ThreatBarChart } from "@/components/Charts";
import { Copilot } from "@/components/Copilot";
import { attackScenario, makeEvent, seedEvents, severityFor, type SecurityEvent } from "@/lib/security-data";
import { getUser, signOut, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelAI · Cyber & Transaction Correlation" },
      { name: "description", content: "AI-driven correlation of cybersecurity telemetry and transactional behaviour with live risk scoring, fraud response and explainability." },
      { property: "og:title", content: "SentinelAI · Cyber & Transaction Correlation" },
      { property: "og:description", content: "AI-driven correlation of cybersecurity telemetry and transactional behaviour with live risk scoring, fraud response and explainability." },
    ],
  }),
  component: DashboardGate,
});

type Tab = "overview" | "timeline" | "copilot" | "simulate";

function DashboardGate() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      const u = getUser();
      if (!u) {
        navigate({ to: "/auth" });
      } else {
        setUser(u);
      }
      setReady(true);
    };
    check();
    window.addEventListener("sentinelai-auth", check);
    return () => window.removeEventListener("sentinelai-auth", check);
  }, [navigate]);

  if (!ready || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm font-mono">Authenticating…</div>;
  }
  return <Dashboard user={user} />;
}

function Dashboard({ user }: { user: AuthUser }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selected, setSelected] = useState<SecurityEvent | null>(null);
  const [alertEvt, setAlertEvt] = useState<SecurityEvent | null>(null);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const seenIds = useRef(new Set<string>());
  const seeded = useRef(false);

  // Seed on client only (avoid SSR hydration mismatch)
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setEvents(seedEvents());
  }, []);

  // Ambient stream
  useEffect(() => {
    const t = setInterval(() => {
      setEvents((prev) => [...prev, makeEvent()].slice(-40));
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // Alerts
  useEffect(() => {
    const latest = events[events.length - 1];
    if (!latest || seenIds.current.has(latest.id)) return;
    seenIds.current.add(latest.id);
    const sev = severityFor(latest.risk);
    if (sev === "critical") {
      setAlertEvt(latest);
      setSelected(latest);
    } else if (sev === "high") {
      toast.warning(`High-risk: ${latest.title} (${latest.user}) · ${latest.risk}`);
    }
  }, [events]);

  const addEvents = useCallback((batch: SecurityEvent[]) => {
    setEvents((prev) => [...prev, ...batch].slice(-50));
  }, []);

  const simulate = (kind: "phishing" | "malware" | "takeover") => {
    const batch = attackScenario(kind);
    toast(`⚡ Simulating ${kind} attack…`, { description: "Injecting synthetic telemetry into the risk engine" });
    batch.forEach((e, i) => setTimeout(() => addEvents([e]), i * 800));
    setTab("timeline");
  };

  const ack = (title: string, description: string, tone: "success" | "error" | "info" = "success") => {
    const fn = tone === "success" ? toast.success : tone === "error" ? toast.error : toast;
    fn(title, { description });
  };

  const stopPayment = (evt: SecurityEvent) => {
    addEvents([makeEvent({ type: "block", user: evt.user, country: evt.country, device: evt.device, title: "Payment stopped by SOC", detail: "Wire transfer halted pre-settlement", risk: 92, reasons: ["Manual response by analyst", ...evt.reasons] })]);
    ack("✅ Payment stopped", `Funds for ${evt.user} held in escrow · ref ${evt.id}`);
    setAlertEvt(null);
  };
  const blockUser = (evt: SecurityEvent) => {
    setBlocked((b) => Array.from(new Set([...b, evt.user])));
    addEvents([makeEvent({ type: "block", user: evt.user, country: evt.country, device: evt.device, title: `User ${evt.user} blocked`, detail: "Session terminated, tokens revoked", risk: 95, reasons: ["Full account lockdown triggered", ...evt.reasons] })]);
    ack(`🔒 ${evt.user} blocked`, "Sessions terminated · tokens revoked · IT notified", "error");
    setAlertEvt(null);
  };
  const alertTeam = (evt: SecurityEvent) => {
    ack("🚨 SOC team paged", `Playbook attached to ${evt.id} · avg response 4 min`, "info");
    setAlertEvt(null);
  };

  const handleLogout = () => {
    signOut();
    toast("👋 Signed out", { description: "Session ended securely" });
    navigate({ to: "/auth" });
  };

  const stats = useMemo(() => {
    const highRisk = events.filter((e) => e.risk >= 65).length;
    const blockedCount = events.filter((e) => e.type === "block").length;
    const active = new Set(events.map((e) => e.user)).size;
    const txns = events.filter((e) => e.type === "transaction").length;
    const currentRisk = events.length ? Math.round(events.slice(-5).reduce((a, e) => a + e.risk, 0) / Math.min(5, events.length)) : 0;
    return { highRisk, blockedCount, active, txns, currentRisk };
  }, [events]);

  const activeSel = selected ?? events[events.length - 1] ?? null;
  const criticalActive = alertEvt !== null;

  const tabs: { id: Tab; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "timeline", label: "Threat Timeline", icon: ListOrdered },
    { id: "copilot", label: "AI Copilot", icon: MessageSquare },
    { id: "simulate", label: "Simulate", icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="bottom-right" richColors />
      <AlertMode active={criticalActive} event={alertEvt} onDismiss={() => setAlertEvt(null)} />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-cyber/15 text-cyber glow-cyber">
                <Radar className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full pulse-glow" style={{ background: "var(--safe)" }} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-glow">SentinelAI</h1>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  Cyber × Transaction Correlation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label={criticalActive ? "CRITICAL" : stats.currentRisk >= 65 ? "ELEVATED" : "NORMAL"} state={criticalActive ? "critical" : stats.currentRisk >= 65 ? "warn" : "online"} />
              <div className="hidden md:flex items-center gap-2 rounded-md border border-border/50 px-2.5 py-1.5">
                <div className="h-6 w-6 rounded-full bg-cyber/20 text-cyber flex items-center justify-center text-[10px] font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-mono text-muted-foreground">{user.username}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:border-danger hover:text-danger" style={{}}>
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="mt-3 flex gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${active ? "bg-cyber/15 text-cyber border border-cyber/60" : "text-muted-foreground border border-transparent hover:text-foreground hover:bg-secondary/40"}`}>
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6 space-y-4">
        {/* KPI row — always visible */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Kpi icon={Activity} label="Live Risk" value={String(stats.currentRisk)} tone={stats.currentRisk >= 65 ? "danger" : "cyber"} />
          <Kpi icon={AlertOctagon} label="Fraud Today" value={String(stats.highRisk)} tone="warn" />
          <Kpi icon={ShieldOff} label="Blocked" value={String(stats.blockedCount)} tone="danger" />
          <Kpi icon={Users} label="Active Users" value={String(stats.active)} tone="cyber" />
          <Kpi icon={CreditCard} label="Transactions" value={String(stats.txns)} tone="safe" />
        </section>

        {tab === "overview" && (
          <section className="grid gap-4 lg:grid-cols-3">
            <Panel title="Live Risk Score" icon={Waves}><RiskGauge value={stats.currentRisk} /></Panel>
            <Panel title="Risk Trend" icon={Activity}><RiskTrendChart events={events} /></Panel>
            <Panel title="Threat Vectors" icon={Shield}><ThreatBarChart events={events} /></Panel>
            <Panel title="Recent Highlights" icon={CircleDot} className="lg:col-span-2">
              <RecentList events={events} onOpen={(e) => { setSelected(e); setTab("timeline"); }} />
            </Panel>
            <Panel title="Selected Event" icon={ShieldCheck}>
              {activeSel ? <MiniExplain event={activeSel} onOpen={() => setTab("timeline")} /> : <Empty />}
            </Panel>
          </section>
        )}

        {tab === "timeline" && (
          <section className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Panel title="Threat Timeline" icon={CircleDot} subtitle="Grouped by user">
                <div className="max-h-[720px] overflow-y-auto pr-2">
                  <Timeline events={events} onSelect={setSelected} selectedId={activeSel?.id} />
                </div>
              </Panel>
            </div>
            <div className="lg:col-span-2">
              <Panel title="AI Explanation" icon={ShieldCheck}>
                {activeSel ? <Explanation event={activeSel} onRespond={{ stopPayment, blockUser, alertTeam, setAlert: setAlertEvt }} blockedUsers={blocked} /> : <Empty />}
              </Panel>
            </div>
          </section>
        )}

        {tab === "copilot" && (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel title="AI Copilot" icon={Radar} className="h-[70vh]">
                <Copilot selected={activeSel} all={events} />
              </Panel>
            </div>
            <Panel title="Context" icon={ShieldCheck}>
              {activeSel ? <MiniExplain event={activeSel} onOpen={() => setTab("timeline")} /> : <div className="text-sm text-muted-foreground">Copilot has full access to all {events.length} live events. Select an event in the Timeline tab for focused Q&A.</div>}
            </Panel>
          </section>
        )}

        {tab === "simulate" && (
          <section className="space-y-4">
            <Panel title="Attack Simulation" icon={Zap} subtitle="Test the AI risk engine">
              <p className="text-sm text-muted-foreground mb-4">Inject synthetic threats and watch the AI catch them live. Simulations jump you to the timeline.</p>
              <div className="grid gap-3 md:grid-cols-3">
                <SimCard icon={MailWarning} title="Phishing" desc="Cloned portal harvests credentials from a corp inbox." onClick={() => simulate("phishing")} />
                <SimCard icon={Skull} title="Malware" desc="Trojan lands on endpoint and attempts lateral movement." onClick={() => simulate("malware")} />
                <SimCard icon={LogIn} title="Account Takeover" desc="New geo login, password rotated, wire transfer initiated." onClick={() => simulate("takeover")} />
              </div>
            </Panel>
          </section>
        )}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          <span>SentinelAI · demo build · v1.1</span>
          <span>Feeds: Auth · Endpoint · Network · Payments · HR</span>
        </footer>
      </main>
    </div>
  );
}

function RecentList({ events, onOpen }: { events: SecurityEvent[]; onOpen: (e: SecurityEvent) => void }) {
  const top = [...events].sort((a, b) => b.risk - a.risk).slice(0, 6);
  if (!top.length) return <Empty />;
  return (
    <div className="space-y-2">
      {top.map((e) => {
        const sev = severityFor(e.risk);
        const color = sev === "low" ? "var(--safe)" : sev === "medium" ? "var(--warn)" : "var(--danger)";
        return (
          <button key={e.id} onClick={() => onOpen(e)} className="w-full flex items-center gap-3 rounded-md border border-border/40 px-3 py-2 hover:border-cyber/60 text-left">
            <div className="text-lg font-bold w-10 text-right" style={{ color }}>{e.risk}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{e.title}</div>
              <div className="text-[11px] font-mono text-muted-foreground truncate">{e.user} · {e.country} · {e.time}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MiniExplain({ event, onOpen }: { event: SecurityEvent; onOpen: () => void }) {
  const sev = severityFor(event.risk);
  const color = sev === "low" ? "var(--safe)" : sev === "medium" ? "var(--warn)" : "var(--danger)";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold truncate">{event.title}</div>
        <div className="text-xs font-mono" style={{ color }}>{sev} · {event.risk}</div>
      </div>
      <div className="text-[11px] font-mono text-muted-foreground">{event.user} · {event.country} · {event.time}</div>
      <ul className="space-y-1">
        {event.reasons.slice(0, 3).map((r, i) => (
          <li key={i} className="flex gap-2 text-xs"><span className="mt-1 h-1 w-1 rounded-full shrink-0" style={{ background: "var(--cyber)" }} />{r}</li>
        ))}
      </ul>
      <button onClick={onOpen} className="mt-2 w-full rounded-md border border-cyber/60 px-3 py-1.5 text-xs font-mono text-cyber hover:bg-cyber/10">Open in Timeline →</button>
    </div>
  );
}

function Explanation({ event, onRespond, blockedUsers }: {
  event: SecurityEvent;
  onRespond: { stopPayment: (e: SecurityEvent) => void; blockUser: (e: SecurityEvent) => void; alertTeam: (e: SecurityEvent) => void; setAlert: (e: SecurityEvent) => void };
  blockedUsers: string[];
}) {
  const sev = severityFor(event.risk);
  const isBlocked = blockedUsers.includes(event.user);
  const highRisk = event.risk >= 65;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{event.id} · {event.time}</div>
          <div className="text-base font-semibold">{event.title}</div>
        </div>
        <div className="rounded-md border px-2.5 py-1 text-xs font-mono uppercase"
          style={{ color: sev === "low" ? "var(--safe)" : sev === "medium" ? "var(--warn)" : "var(--danger)",
                   borderColor: sev === "low" ? "var(--safe)" : sev === "medium" ? "var(--warn)" : "var(--danger)" }}>
          {sev} · {event.risk}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-y-1 text-xs font-mono">
        <dt className="text-muted-foreground">User</dt><dd>{event.user}{isBlocked && <span className="ml-1" style={{ color: "var(--danger)" }}>· blocked</span>}</dd>
        <dt className="text-muted-foreground">Device</dt><dd>{event.device}</dd>
        <dt className="text-muted-foreground">Country</dt><dd>{event.country}</dd>
        <dt className="text-muted-foreground">IP</dt><dd>{event.ip}</dd>
        {event.amount ? (<><dt className="text-muted-foreground">Amount</dt><dd>₹{event.amount.toLocaleString("en-IN")}</dd></>) : null}
      </dl>
      <div>
        <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Why the AI flagged this</div>
        <ul className="space-y-1">
          {event.reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--cyber)" }} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
      {highRisk && (
        <div className="space-y-2 rounded-md border p-3" style={{ borderColor: "var(--danger)", background: "oklch(0.65 0.26 25 / 0.08)" }}>
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--danger)" }}>Recommended Response</div>
          <div className="grid gap-2">
            <button onClick={() => onRespond.stopPayment(event)} className="flex items-center justify-between rounded-md bg-warn/20 px-3 py-2 text-sm font-medium hover:bg-warn/30" style={{ color: "var(--warn)" }}>
              <span className="flex items-center gap-2"><Ban className="h-4 w-4" /> Stop payment</span>
              <span className="text-[10px] font-mono opacity-70">HOLD FUNDS</span>
            </button>
            <button onClick={() => onRespond.blockUser(event)} className="flex items-center justify-between rounded-md bg-danger/25 px-3 py-2 text-sm font-medium hover:bg-danger/40" style={{ color: "var(--danger)" }}>
              <span className="flex items-center gap-2"><ShieldOff className="h-4 w-4" /> Block user</span>
              <span className="text-[10px] font-mono opacity-70">LOCKDOWN</span>
            </button>
            <button onClick={() => onRespond.alertTeam(event)} className="flex items-center justify-between rounded-md bg-cyber/15 px-3 py-2 text-sm font-medium hover:bg-cyber/25" style={{ color: "var(--cyber)" }}>
              <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Alert security team</span>
              <span className="text-[10px] font-mono opacity-70">PAGE SOC</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return <div className="py-6 text-center text-sm text-muted-foreground">Select an event to see details.</div>;
}

function Panel({ title, icon: Icon, subtitle, children, className = "" }: { title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`panel p-4 flex flex-col ${className}`}>
      <div className="mb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: "var(--cyber)" }} />
          <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        </div>
        {subtitle && <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string; value: string; tone: "cyber" | "warn" | "danger" | "safe" }) {
  const color = `var(--${tone})`;
  return (
    <div className="panel relative overflow-hidden px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-bold" style={{ color }}>{value}</div>
        </div>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: color, opacity: 0.7 }} />
    </div>
  );
}

function StatusBadge({ label, state }: { label: string; state: "online" | "warn" | "critical" }) {
  const color = state === "online" ? "var(--safe)" : state === "warn" ? "var(--warn)" : "var(--danger)";
  return (
    <span className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-widest" style={{ borderColor: color, color }}>
      <span className="h-1.5 w-1.5 rounded-full pulse-glow" style={{ background: color }} />
      {label}
    </span>
  );
}

function SimCard({ icon: Icon, title, desc, onClick }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-4 text-left transition-all hover:border-cyber hover:bg-cyber/5">
      <Icon className="h-6 w-6 text-cyber" />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
      <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-cyber opacity-0 group-hover:opacity-100 transition">Run simulation →</div>
    </button>
  );
}
