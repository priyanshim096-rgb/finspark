import { useEffect, useRef, useState } from "react";
import type { SecurityEvent } from "@/lib/security-data";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askCopilot } from "@/lib/copilot.functions";
import { toast } from "sonner";

interface Msg { role: "user" | "ai"; text: string }

function buildContext(ctx: SecurityEvent | null, all: SecurityEvent[]): string {
  const summary = `Total events: ${all.length}. High-risk: ${all.filter(e => e.risk >= 65).length}. Blocked: ${all.filter(e => e.type === "block").length}.`;
  if (!ctx) return summary;
  return `${summary}\nSelected event: ${ctx.id} · ${ctx.title} · user=${ctx.user} · country=${ctx.country} · device=${ctx.device} · ip=${ctx.ip} · risk=${ctx.risk}${ctx.amount ? ` · amount=₹${ctx.amount.toLocaleString("en-IN")}` : ""}\nReasons: ${ctx.reasons.join("; ")}`;
}

export function Copilot({ selected, all }: { selected: SecurityEvent | null; all: SecurityEvent[] }) {
  const ask = useServerFn(askCopilot);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "I'm your Security Copilot. Ask me why an event was flagged, or request a summary of today's activity." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { question: t, context: buildContext(selected, all) } });
      setMsgs((m) => [...m, { role: "ai", text: res.reply }]);
    } catch (e) {
      const err = e instanceof Error ? e.message : "Copilot request failed";
      toast.error(err);
      setMsgs((m) => [...m, { role: "ai", text: "⚠️ I couldn't reach the assistant. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-0">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${m.role === "ai" ? "bg-cyber/20 text-cyber" : "bg-secondary text-foreground"}`}>
              {m.role === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${m.role === "ai" ? "bg-secondary/60 text-foreground" : "bg-cyber/15 text-foreground"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyber/20 text-cyber">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg bg-secondary/60 px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Why was this flagged?", "Summarise today's activity", "What should I do next?"].map((s) => (
          <button key={s} disabled={loading} onClick={() => send(s)} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-cyber hover:text-cyber disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the Copilot…"
          className="flex-1 rounded-md border border-border bg-input/60 px-3 py-2 text-sm outline-none focus:border-cyber disabled:opacity-50"
        />
        <button onClick={() => send()} disabled={loading} className="rounded-md bg-cyber px-3 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
