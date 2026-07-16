import { Link, useRouterState } from "@tanstack/react-router";
import { NAV, SCORES, SCORE_META, type Scores } from "@/lib/sentinelx";
import { ShieldCheck } from "lucide-react";

export function NavRail() {
  const path = useRouterState({ select: s => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-primary glow-cyber">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-roboto text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Kairos</div>
            <div className="font-roboto text-sm font-bold text-glow">Quantum Intelligence</div>
          </div>
        </Link>
        <nav className="ml-6 flex items-center gap-1">
          {NAV.filter(n => n.to !== "/profile").map(n => {
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={[
                  "rounded-md px-3 py-1.5 font-roboto text-[11px] font-medium uppercase tracking-[0.18em] transition",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                ].join(" ")}
              >
                {n.short}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <TrustPulse />
        </div>
      </div>
    </header>
  );
}

function TrustPulse() {
  const order: (keyof Scores)[] = ["trust","threat","fraud","quantum","identity","business","operational"];
  return (
    <div className="hidden md:flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5">
      {order.map(k => {
        const meta = SCORE_META[k];
        const v = SCORES[k];
        const color =
          meta.hue === "danger" ? "var(--danger)" :
          meta.hue === "warn"   ? "var(--warn)"   :
          meta.hue === "safe"   ? "var(--safe)"   : "var(--cyber)";
        return (
          <div key={k} className="group relative flex flex-col items-center leading-none" title={`${meta.label} · ${meta.hint}`}>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{meta.label.slice(0,4)}</div>
            <div className="mt-0.5 font-mono text-[12px] font-semibold" style={{ color }}>{v}</div>
            <Spark data={meta.trend} color={color} />
          </div>
        );
      })}
    </div>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 34, h = 10;
  const max = Math.max(...data), min = Math.min(...data);
  const range = Math.max(1, max - min);
  const pts = data.map((v,i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="mt-0.5">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
