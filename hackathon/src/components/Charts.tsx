import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import type { SecurityEvent } from "@/lib/security-data";

const cyber = "oklch(0.82 0.17 195)";
const danger = "oklch(0.65 0.26 25)";

export function RiskTrendChart({ events }: { events: SecurityEvent[] }) {
  const data = events.slice(-20).map((e, i) => ({ i, risk: e.risk, time: e.time }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={cyber} stopOpacity={0.6} />
            <stop offset="100%" stopColor={cyber} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(0.3 0.04 260 / 30%)" strokeDasharray="3 3" />
        <XAxis dataKey="time" stroke="oklch(0.7 0.03 240)" fontSize={10} />
        <YAxis stroke="oklch(0.7 0.03 240)" fontSize={10} domain={[0, 100]} />
        <Tooltip
          contentStyle={{ background: "oklch(0.20 0.035 260)", border: "1px solid oklch(0.35 0.05 260)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "oklch(0.96 0.01 220)" }}
        />
        <Area type="monotone" dataKey="risk" stroke={cyber} strokeWidth={2} fill="url(#riskGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ThreatBarChart({ events }: { events: SecurityEvent[] }) {
  const counts: Record<string, number> = {};
  events.forEach((e) => { counts[e.type] = (counts[e.type] ?? 0) + 1; });
  const data = Object.entries(counts).map(([k, v]) => ({ type: k, count: v }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="oklch(0.3 0.04 260 / 30%)" strokeDasharray="3 3" />
        <XAxis dataKey="type" stroke="oklch(0.7 0.03 240)" fontSize={10} />
        <YAxis stroke="oklch(0.7 0.03 240)" fontSize={10} />
        <Tooltip
          contentStyle={{ background: "oklch(0.20 0.035 260)", border: "1px solid oklch(0.35 0.05 260)", borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="count" fill={cyber} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RiskGauge({ value }: { value: number }) {
  const data = [{ name: "risk", value, fill: value > 70 ? danger : cyber }];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={220} endAngle={-40}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar background={{ fill: "oklch(0.28 0.04 260)" }} dataKey="value" cornerRadius={12} />
        <text x="50%" y="55%" textAnchor="middle" fill="oklch(0.96 0.01 220)" fontSize={38} fontWeight={700}>
          {value}
        </text>
        <text x="50%" y="72%" textAnchor="middle" fill="oklch(0.7 0.03 240)" fontSize={11} letterSpacing={2}>
          RISK INDEX
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
