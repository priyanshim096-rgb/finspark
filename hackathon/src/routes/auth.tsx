import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Radar, Shield, LogIn, Lock } from "lucide-react";
import { signIn } from "@/lib/auth";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Kairos" },
      { name: "description", content: "Sign in to the Kairos cyber-transaction correlation console." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("analyst");
  const [password, setPassword] = useState("sentinel");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Enter username and password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      signIn(username.trim());
      toast.success(`Welcome back, ${username.trim()} · MFA verified`);
      navigate({ to: "/" });
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <Toaster theme="dark" position="bottom-right" richColors />
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle at 30% 20%, var(--cyber) 0%, transparent 40%), radial-gradient(circle at 70% 80%, var(--accent) 0%, transparent 40%)" }} />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyber/15 text-cyber glow-cyber">
            <Radar className="h-6 w-6" />
          </div>
          <h1 className="font-roboto text-2xl font-bold text-glow">Kairos</h1>
          <p className="font-roboto text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Secure SOC Access</p>
        </div>
        <form onSubmit={submit} className="panel p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-md border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:border-cyber" autoComplete="username" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-border bg-input/60 px-3 py-2.5 text-sm outline-none focus:border-cyber" autoComplete="current-password" />
          </div>
          <button disabled={loading} type="submit" className="w-full flex items-center justify-center gap-2 rounded-md bg-cyber px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {loading ? <><Shield className="h-4 w-4 animate-pulse" /> Authenticating…</> : <><LogIn className="h-4 w-4" /> Sign in</>}
          </button>
          <div className="flex items-center gap-2 rounded-md border border-border/50 bg-secondary/30 px-3 py-2 text-[11px] font-mono text-muted-foreground">
            <Lock className="h-3 w-3" /> Demo credentials pre-filled. Any username works.
          </div>
        </form>
      </div>
    </div>
  );
}
