import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Line, LineChart } from "recharts";
import type { SecurityEvent } from "@/lib/security-data";

const cyber = "oklch(0.55 0.20 140)";
const danger = "oklch(0.62 0.24 25)";
const warn = "oklch(0.78 0.18 75)";
const safe = "oklch(0.88 0.22 130)";

/** Risk trend chart — split by severity band so the user sees when things get bad. */
export function RiskTrendChart({ events }: { events: SecurityEvent[] }) {
  const window = events.slice(-24);
  const data = window.map((e, i) => ({
    i,
    time: e.time,
    high: e.risk >= 65 ? e.risk : null,
    medium: e.risk >= 35 && e.risk < 65 ? e.risk : null,
    low: e.risk < 35 ? e.risk : null,
    risk: e.risk,
  }));
  const avg = window.length ? Math.round(window.reduce((a, e) => a + e.risk, 0) / window.length) : 0;
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>Rolling risk · last {window.length} events</span>
        <span>avg <span className="text-foreground">{avg}</span> / 100</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={cyber} stopOpacity={0.55} />
              <stop offset="100%" stopColor={cyber} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="oklch(0.75 0.05 130 / 50%)" strokeDasharray="3 3" />
          <XAxis dataKey="time" stroke="oklch(0.45 0.03 140)" fontSize={10} />
          <YAxis stroke="oklch(0.45 0.03 140)" fontSize={10} domain={[0, 100]} />
          <Tooltip contentStyle={{ background: "oklch(0.18 0.02 140)", border: "1px solid oklch(0.30 0.02 140)", borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="risk" stroke={cyber} strokeWidth={2} fill="url(#riskGrad)" />
          <Line type="monotone" dataKey="high" stroke={danger} strokeWidth={2} dot={{ r: 3, fill: danger }} isAnimationActive={false} />
          <Line type="monotone" dataKey="medium" stroke={warn} strokeWidth={0} dot={{ r: 2.5, fill: warn }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grouped bar chart — count per type × severity so it's not just a single count. */
export function ThreatBarChart({ events }: { events: SecurityEvent[] }) {
  const map = new Map<string, { type: string; low: number; medium: number; high: number }>();
  events.forEach((e) => {
    const row = map.get(e.type) ?? { type: e.type, low: 0, medium: 0, high: 0 };
    if (e.risk >= 65) row.high++;
    else if (e.risk >= 35) row.medium++;
    else row.low++;
    map.set(e.type, row);
  });
  const data = [...map.values()];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="oklch(0.75 0.05 130 / 50%)" strokeDasharray="3 3" />
        <XAxis dataKey="type" stroke="oklch(0.45 0.03 140)" fontSize={10} />
        <YAxis stroke="oklch(0.45 0.03 140)" fontSize={10} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "oklch(0.18 0.02 140)", border: "1px solid oklch(0.30 0.02 140)", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey="low" stackId="s" fill={safe} radius={[0, 0, 0, 0]} name="Low" />
        <Bar dataKey="medium" stackId="s" fill={warn} radius={[0, 0, 0, 0]} name="Medium" />
        <Bar dataKey="high" stackId="s" fill={danger} radius={[6, 6, 0, 0]} name="High" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Actual 0-100 threat meter with tick marks. */
export function RiskGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 75 ? danger : v >= 45 ? warn : v >= 20 ? cyber : safe;
  const label = v >= 75 ? "CRITICAL" : v >= 45 ? "ELEVATED" : v >= 20 ? "GUARDED" : "LOW";
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-1 py-2">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Threat Meter · 0–100</div>
        <div className="font-mono text-[10px]" style={{ color }}>{label}</div>
      </div>
      <div className="relative">
        <div className="h-6 w-full overflow-hidden rounded-md border border-border/60 bg-muted/40">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${v}%`,
              background: `linear-gradient(90deg, ${safe} 0%, ${cyber} 25%, ${warn} 55%, ${danger} 90%)`,
              boxShadow: `0 0 20px ${color}66`,
            }}
          />
        </div>
        {/* Ticks */}
        <div className="mt-1 flex justify-between px-0.5 text-[9px] font-mono text-muted-foreground">
          {[0, 20, 40, 60, 80, 100].map(n => (
            <span key={n} className="flex flex-col items-center gap-0.5">
              <span className="h-1 w-px bg-border" />
              {n}
            </span>
          ))}
        </div>
        {/* Needle marker */}
        <div
          className="pointer-events-none absolute -top-1 h-8 w-0.5 rounded-full"
          style={{ left: `calc(${v}% - 1px)`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-bold tabular-nums" style={{ color }}>{v}</div>
        <div className="text-xs text-muted-foreground font-mono">/ 100 threat index</div>
      </div>
    </div>
  );
}
