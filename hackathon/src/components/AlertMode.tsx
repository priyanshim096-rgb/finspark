import { AlertTriangle, X, ExternalLink } from "lucide-react";

export type AlertTone = "phishing" | "malware" | "takeover" | "insider" | "fraud" | "critical";

interface Props {
  active: boolean;
  event?: { title: string; user: string; risk: number; type?: string } | null;
  tone?: AlertTone;
  onDismiss: () => void;
}

const TONE_MAP: Record<AlertTone, { color: string; label: string; bg: string }> = {
  phishing: { color: "oklch(0.78 0.16 60)",  label: "Phishing Attempt",    bg: "oklch(0.78 0.16 60 / 0.15)" },
  malware:  { color: "oklch(0.72 0.18 320)", label: "Malware Detected",    bg: "oklch(0.72 0.18 320 / 0.15)" },
  takeover: { color: "oklch(0.65 0.26 25)",  label: "Account Takeover",    bg: "oklch(0.65 0.26 25 / 0.15)" },
  insider:  { color: "oklch(0.72 0.15 30)",  label: "Insider Anomaly",     bg: "oklch(0.72 0.15 30 / 0.15)" },
  fraud:    { color: "oklch(0.78 0.18 350)", label: "Fraudulent Transfer", bg: "oklch(0.78 0.18 350 / 0.15)" },
  critical: { color: "oklch(0.65 0.26 25)",  label: "Critical Risk",       bg: "oklch(0.65 0.26 25 / 0.15)" },
};

export function AlertMode({ active, event, tone = "critical", onDismiss }: Props) {
  if (!active) return null;
  const t = TONE_MAP[tone];
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[90] h-0.5 pulse-glow pointer-events-none" style={{ background: t.color }} />
      <div className="fixed top-16 right-4 z-[100] w-[380px] max-w-[calc(100vw-2rem)] pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300">
        <div className="panel overflow-hidden" style={{ borderColor: t.color, boxShadow: `0 10px 40px ${t.color}55` }}>
          <div className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest" style={{ background: t.bg, color: t.color }}>
            <span className="h-2 w-2 rounded-full pulse-glow" style={{ background: t.color }} />
            <AlertTriangle className="h-3.5 w-3.5" /> {t.label}
            <button onClick={onDismiss} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="px-4 py-3">
            <div className="text-sm font-semibold text-foreground">{event?.title ?? "High risk activity"}</div>
            <div className="mt-0.5 text-xs text-muted-foreground font-mono">
              {event?.user} · Risk {event?.risk ?? "--"}/100
            </div>
            <button
              onClick={onDismiss}
              className="mt-3 w-full rounded border px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-white/5"
              style={{ color: t.color, borderColor: `${t.color}88` }}
            >
              Acknowledge & review
            </button>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 rounded border border-border/60 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-cyber/60"
            >
              <ExternalLink className="h-3 w-3" /> Report on cybercrime.gov.in
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
