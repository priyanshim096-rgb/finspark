import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { NavRail } from "@/components/NavRail";
import { STORIES, getEntity, type StoryStep } from "@/lib/sentinelx";
import { AlertOctagon, ArrowRight, ShieldAlert, Waves, Zap } from "lucide-react";

export const Route = createFileRoute("/stories")({
  validateSearch: (s: Record<string, unknown>) => ({
    entity: typeof s.entity === "string" ? s.entity : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Attack Stories · Kairos" },
      { name: "description", content: "Composed incident timelines with MITRE mappings, counterfactuals and remediation." },
      { property: "og:title", content: "Kairos · Attack Stories" },
      { property: "og:description", content: "One explainable timeline per correlated attack, with counterfactual and predicted next move." },
    ],
  }),
  component: StoriesPage,
});

function StoriesPage() {
  const { entity } = Route.useSearch();
  const initialId = useMemo(() => {
    if (entity) {
      const match = STORIES.find(s => s.entities.includes(entity));
      if (match) return match.id;
    }
    return STORIES[0].id;
  }, [entity]);
  const [storyId, setStoryId] = useState(initialId);
  useEffect(() => { setStoryId(initialId); }, [initialId]);
  const story = STORIES.find(s => s.id === storyId)!;
  const [cursor, setCursor] = useState(story.steps.length);
  useEffect(() => { setCursor(story.steps.length); }, [story.steps.length, storyId]);

  const visible = story.steps.slice(0, cursor);
  const running = useMemo(() => {
    const s = { trust: 71, threat: 40, fraud: 30, quantum: 78, identity: 82, business: 50, operational: 88 };
    visible.forEach(v => Object.entries(v.scores).forEach(([k, dv]) => (s[k as keyof typeof s] = Math.max(0, Math.min(100, (s[k as keyof typeof s] as number) + (dv as number))))));
    return s;
  }, [visible]);

  return (
    <div className="min-h-screen">
      <NavRail />
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-4 px-6 py-6">
        <aside className="col-span-3 space-y-2">
          <div className="panel p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Open incidents</div>
            <div className="mt-2 space-y-2">
              {STORIES.map(s => (
                <button key={s.id} onClick={() => { setStoryId(s.id); setCursor(s.steps.length); }}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    storyId === s.id ? "border-primary/60 bg-primary/10" : "border-border/60 hover:bg-muted/40"
                  }`}>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5" style={{ color: "var(--danger)" }} />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.id}</span>
                    <span className="ml-auto rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest" style={{ color: "var(--danger)" }}>{s.severity}</span>
                  </div>
                  <div className="mt-1 text-xs font-medium leading-snug">{s.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">{s.kind.toUpperCase()} · opened {s.opened}</div>
                </button>
              ))}
              <PlaceholderIncident title="Insider drift · dormant DBA account" id="STORY-INS-021" />
              <PlaceholderIncident title="Fraud ring · synthetic identity cluster" id="STORY-FRD-118" />
            </div>
          </div>
        </aside>

        <section className="col-span-6">
          <div className="panel p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-destructive/15" style={{ color: "var(--danger)" }}>
                <AlertOctagon />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{story.kind} · {story.id}</div>
                <h1 className="text-lg font-semibold leading-tight">{story.title}</h1>
                <p className="mt-1 text-xs text-muted-foreground">{story.businessImpact}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Replay</span>
              <input type="range" min={1} max={story.steps.length} value={cursor}
                onChange={e => setCursor(Number(e.target.value))} className="flex-1 accent-[color:var(--cyber)]" />
              <span className="font-mono text-[10px] text-muted-foreground">{cursor}/{story.steps.length}</span>
            </div>

            <ol className="mt-5 space-y-3">
              {visible.map((s, i) => <StepCard key={i} step={s} last={i === visible.length - 1} />)}
            </ol>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Callout icon={<Waves className="h-3.5 w-3.5" />} title="Counterfactual" body={story.counterfactual} />
              <Callout icon={<Zap className="h-3.5 w-3.5" />} title="Predicted next action" body={story.predictedNext} tone="warn" />
            </div>

            <div className="mt-4 rounded-md border border-border/60 bg-card/40 p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Recommended remediation · explainable approval</div>
              <ul className="mt-2 space-y-1.5">
                {story.remediation.map((r, i) => (
                  <li key={i} className="flex items-center justify-between rounded border border-border/50 bg-background/40 px-3 py-2 text-xs">
                    <span className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-primary" />{r}</span>
                    <span className="flex gap-1">
                      <button className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary hover:bg-primary/30">approve</button>
                      <button className="rounded bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/60">defer</button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <aside className="col-span-3 space-y-3">
          <div className="panel p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Running score deltas</div>
            <div className="mt-3 space-y-2">
              {Object.entries(running).map(([k,v]) => (
                <div key={k} className="text-[11px]">
                  <div className="flex justify-between font-mono">
                    <span className="uppercase tracking-widest text-muted-foreground">{k}</span>
                    <span className="text-foreground">{v}</span>
                  </div>
                  <div className="mt-0.5 h-1 rounded bg-muted/50"><div className="h-full rounded bg-primary/70" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Implicated entities</div>
            <ul className="mt-2 space-y-1 text-xs">
              {story.entities.map(id => {
                const e = getEntity(id);
                if (!e) return null;
                return (
                  <li key={id} className="flex items-center justify-between rounded px-1 py-0.5">
                    <span>{e.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{e.kind}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepCard({ step, last }: { step: StoryStep; last: boolean }) {
  const ent = getEntity(step.actor);
  return (
    <li className="relative rounded-md border border-border/60 bg-card/40 p-3">
      {last && <span className="absolute -left-1 top-4 h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: "var(--danger)" }} />}
      <div className="flex items-center gap-2">
        <span className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-muted-foreground">{step.t}</span>
        <span className="text-xs text-muted-foreground">{ent?.label ?? step.actor}</span>
        <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-primary">{step.mitre}</span>
        <span className="font-mono text-[10px] text-muted-foreground">conf {step.confidence}%</span>
      </div>
      <div className="mt-1 text-sm">{step.action}</div>
      <div className="mt-1 font-mono text-[11px] text-muted-foreground">↳ {step.evidence}</div>
    </li>
  );
}

function Callout({ icon, title, body, tone = "cyber" }: { icon: React.ReactNode; title: string; body: string; tone?: "cyber" | "warn" }) {
  const color = tone === "warn" ? "var(--warn)" : "var(--cyber)";
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest" style={{ color }}>
        {icon}{title}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
function PlaceholderIncident({ title, id }: { title: string; id: string }) {
  return (
    <div className="w-full rounded-md border border-dashed border-border/50 p-3 opacity-60">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{id}</div>
      <div className="mt-0.5 text-xs">{title}</div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">correlating…</div>
    </div>
  );
}
