import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { NavRail } from "@/components/NavRail";
import { getUser, signOut, type AuthUser } from "@/lib/auth";
import { Eye, EyeOff, Shield, Award, Clock, CheckCircle2, AlertTriangle, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Analyst Profile · Kairos" },
      { name: "description", content: "Analyst account, credentials and performance metrics for the signed-in SOC operator." },
      { property: "og:title", content: "Kairos · Analyst Profile" },
      { property: "og:description", content: "Credentials, response performance and playbook history." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) navigate({ to: "/auth" });
    else setUser(u);
    setReady(true);
  }, [navigate]);

  // Deterministic mock performance derived from username so it "belongs" to the analyst.
  const perf = useMemo(() => {
    if (!user) return null;
    const seed = [...user.username].reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (n: number, min: number, max: number) => min + ((seed * (n + 7)) % 1000) / 1000 * (max - min);
    return {
      alertsHandled: Math.round(rand(1, 120, 480)),
      avgResponseSec: Math.round(rand(2, 45, 240)),
      accuracy: Math.round(rand(3, 88, 99)),
      escalationsCorrect: Math.round(rand(4, 82, 98)),
      shiftsCompleted: Math.round(rand(5, 12, 60)),
      rank: ["Analyst I", "Analyst II", "Senior Analyst", "SOC Lead"][Math.floor(rand(6, 0, 3.99))],
      streak: Math.round(rand(7, 3, 21)),
      badges: ["Phish Hunter", "Zero-Day First", "PQC Migrator", "Insider Sentinel"].filter((_, i) => (seed + i) % 2 === 0),
    };
  }, [user]);

  if (!ready || !user || !perf) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm font-mono">Loading profile…</div>;
  }

  const password = `Sx-${user.username}-${(user.loggedInAt % 10000).toString().padStart(4, "0")}!`;

  const logout = () => {
    signOut();
    toast("Signed out");
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen">
      <NavRail />
      <div className="mx-auto max-w-[1200px] px-6 py-6 space-y-4">
        <header className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Analyst Profile</div>
            <h1 className="text-2xl font-semibold text-glow">{user.username}</h1>
            <div className="mt-1 text-sm text-muted-foreground">{perf.rank} · SOC Tier-2 · Bengaluru</div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:border-danger hover:text-danger">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="panel p-4 md:col-span-1">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyber" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Credentials</div>
            </div>
            <div className="space-y-3">
              <Field label="Username" value={user.username} />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Password</div>
                <div className="mt-1 flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
                  <span className="flex-1 font-mono text-sm">{showPw ? password : "•".repeat(password.length)}</span>
                  <button onClick={() => setShowPw(s => !s)} className="text-muted-foreground hover:text-foreground" aria-label="toggle password">
                    {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">Rotated every 30 days · MFA enforced</div>
              </div>
              <Field label="Session started" value={new Date(user.loggedInAt).toLocaleString()} />
              <Field label="Clearance" value="TS/SCI-equivalent · Tier-2" />
            </div>
          </div>

          <div className="panel p-4 md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-cyber" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Performance · rolling 30 days</div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Alerts handled" value={perf.alertsHandled.toString()} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="safe" />
              <Stat label="Avg response" value={`${perf.avgResponseSec}s`} icon={<Clock className="h-3.5 w-3.5" />} tone="cyber" />
              <Stat label="Triage accuracy" value={`${perf.accuracy}%`} icon={<Award className="h-3.5 w-3.5" />} tone="safe" />
              <Stat label="Escalation precision" value={`${perf.escalationsCorrect}%`} icon={<AlertTriangle className="h-3.5 w-3.5" />} tone="warn" />
            </div>

            <div className="mt-4 space-y-2">
              <Bar label="Response speed" value={Math.min(100, Math.round((240 - perf.avgResponseSec) / 200 * 100))} />
              <Bar label="Triage accuracy" value={perf.accuracy} />
              <Bar label="Escalation precision" value={perf.escalationsCorrect} />
              <Bar label="Playbook coverage" value={Math.min(100, perf.shiftsCompleted * 3)} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {perf.badges.map(b => (
                <span key={b} className="rounded-md border border-cyber/40 bg-cyber/10 px-2 py-0.5 text-[11px] font-mono uppercase tracking-widest text-cyber">
                  {b}
                </span>
              ))}
              <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {perf.streak}-shift streak
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 font-mono text-sm">{value}</div>
    </div>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: "safe" | "warn" | "cyber" }) {
  const color = tone === "safe" ? "var(--safe)" : tone === "warn" ? "var(--warn)" : "var(--cyber)";
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest" style={{ color }}>{icon}{label}</div>
      <div className="mt-1 text-xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-xs">
      <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
        <span>{label}</span><span className="text-foreground">{value}%</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-muted/40">
        <div className="h-full" style={{ width: `${value}%`, background: "linear-gradient(90deg, var(--cyber), var(--safe))" }} />
      </div>
    </div>
  );
}
