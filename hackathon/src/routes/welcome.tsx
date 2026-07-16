import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Radar, ArrowRight, ShieldCheck, Activity, Atom, Waves } from "lucide-react";
import { signOut } from "@/lib/auth";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome · Kairos" },
      { name: "description", content: "Kairos correlates cyber, identity and transaction signals into a single live view of organisational trust." },
      { property: "og:title", content: "Kairos · Quantum Intelligence Platform" },
      { property: "og:description", content: "Behavioural digital twins, knowledge graph, attack stories, quantum risk and autonomous response." },
    ],
  }),
  component: WelcomePage,
});

const TICKER = [
  "TLS-1.3 handshake · London core",
  "Behavioural drift · Treasury desk",
  "Quantum posture · CRYSTALS-Kyber",
  "Anomaly cluster · Wire velocity",
  "Identity twin · Session harmonic",
  "Graph propagation · 3 hops",
];

function WelcomePage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTick((t) => (t + 1) % TICKER.length), 2200);
    return () => clearInterval(id);
  }, []);

  const goSignIn = () => {
    try { localStorage.setItem("sentinelx_welcomed", "1"); } catch {}
    signOut();
    navigate({ to: "/auth" });
  };

  const rings = useMemo(() => [180, 260, 360, 480, 620], []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Ambient gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 18% 12%, oklch(0.88 0.22 130 / 55%) 0%, transparent 45%), radial-gradient(ellipse at 88% 88%, oklch(0.22 0.02 140 / 30%) 0%, transparent 55%)",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.20 0.02 140 / 40%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.20 0.02 140 / 40%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      {/* Orbital rings on the right */}
      <div className="absolute -right-40 top-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
        <div className="relative h-[720px] w-[720px]">
          {rings.map((size, i) => (
            <div
              key={size}
              className="absolute left-1/2 top-1/2 rounded-full border border-secondary/25"
              style={{
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                animation: `spin ${20 + i * 8}s linear ${i % 2 ? "reverse" : "normal"} infinite`,
              }}
            >
              <span
                className="absolute h-2 w-2 rounded-full bg-primary glow-cyber"
                style={{ top: -4, left: "50%", transform: "translateX(-50%)" }}
              />
            </div>
          ))}
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/90 flex items-center justify-center glow-cyber">
            <Radar className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }`}</style>

      <div className="relative mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground glow-cyber">
              <Radar className="h-5 w-5" />
            </div>
            <div>
              <div className="font-roboto text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Kairos</div>
              <div className="font-roboto text-sm font-bold">Quantum Intelligence</div>
            </div>
          </div>
          <button
            onClick={goSignIn}
            className="rounded-full border border-secondary/60 px-4 py-1.5 text-xs font-medium hover:bg-secondary hover:text-secondary-foreground transition-colors"
          >
            Sign in
          </button>
        </header>

        {/* Hero */}
        <section
          className={`mt-20 md:mt-24 max-w-2xl transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-[11px] font-mono uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-glow" />
            Live · v2026.7
          </div>

          <h1 className="mt-5 font-roboto text-5xl md:text-7xl font-black leading-[1.02] tracking-tight">
            See every threat.
            <br />
            <span className="relative inline-block mt-3">
              <span className="rounded-2xl bg-primary text-primary-foreground px-4 py-1">Before it moves.</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Kairos fuses cyber telemetry, identity signals, transactional behaviour and quantum-crypto
            posture into one continuously learning understanding of organisational trust.
          </p>

          {/* Signal ticker */}
          <div className="mt-6 flex items-center gap-3 rounded-full border border-secondary/40 bg-card/60 backdrop-blur px-4 py-2 max-w-md">
            <span className="h-2 w-2 rounded-full bg-primary pulse-glow" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">signal</span>
            <span key={tick} className="font-mono text-xs text-foreground truncate animate-in fade-in slide-in-from-right-2 duration-500">
              {TICKER[tick]}
            </span>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={goSignIn}
              className="group inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Sign in to continue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 rounded-full border border-secondary/50 px-6 py-3 text-sm font-semibold hover:bg-secondary/10 transition-colors"
            >
              What Kairos does
            </a>
          </div>
        </section>

        {/* Capability strip */}
        <section id="capabilities" className="relative mt-20 md:mt-28 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Activity, label: "Behavioural twins", sub: "Per-entity baselines" },
            { icon: ShieldCheck, label: "Autonomous response", sub: "Playbooks in seconds" },
            { icon: Waves, label: "Knowledge graph", sub: "Every hop, every edge" },
            { icon: Atom, label: "Quantum posture", sub: "PQC readiness" },
          ].map(({ icon: Icon, label, sub }, i) => (
            <div
              key={label}
              className="panel p-4 transition-all duration-500 hover:-translate-y-0.5"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <Icon className="h-4 w-4 text-primary" />
              <div className="mt-3 font-roboto text-sm font-bold">{label}</div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-16 flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          <span>© Kairos · Quantum Intelligence</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-glow" />
            Systems nominal
          </span>
        </footer>
      </div>
    </div>
  );
}
