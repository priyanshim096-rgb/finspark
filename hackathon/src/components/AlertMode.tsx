import { AlertTriangle, X } from "lucide-react";

interface Props {
  active: boolean;
  event?: { title: string; user: string; risk: number } | null;
  onDismiss: () => void;
}

export function AlertMode({ active, event, onDismiss }: Props) {
  if (!active) return null;
  return (
    <>
      {/* Subtle top edge indicator */}
      <div className="fixed inset-x-0 top-0 z-[90] h-0.5 pulse-glow pointer-events-none" style={{ background: "var(--danger)" }} />
      {/* Slide-in banner (top-right, non-blocking) */}
      <div className="fixed top-16 right-4 z-[100] w-[360px] max-w-[calc(100vw-2rem)] pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300">
        <div className="panel border-danger overflow-hidden" style={{ borderColor: "var(--danger)", boxShadow: "0 10px 40px oklch(0.65 0.26 25 / 0.35)" }}>
          <div className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest" style={{ background: "oklch(0.65 0.26 25 / 0.15)", color: "var(--danger)" }}>
            <span className="h-2 w-2 rounded-full pulse-glow" style={{ background: "var(--danger)" }} />
            <AlertTriangle className="h-3.5 w-3.5" /> Critical Risk
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
              className="mt-3 w-full rounded border border-danger/60 px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-danger/10"
              style={{ color: "var(--danger)" }}
            >
              Acknowledge & review
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
