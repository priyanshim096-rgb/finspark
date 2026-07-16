import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { NavRail } from "@/components/NavRail";
import { STORIES, getEntity } from "@/lib/sentinelx";
import { CheckCircle2, XCircle, ShieldOff, KeyRound, UserX, Ban, Siren, FileWarning, Radio, MailWarning, Eye, LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/response")({
  validateSearch: (s: Record<string, unknown>) => ({
    entity: typeof s.entity === "string" ? s.entity : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Autonomous Response · Kairos" },
      { name: "description", content: "Explainable, approval-gated response playbooks executed by the Kairos autonomous engine." },
      { property: "og:title", content: "Kairos · Autonomous Response" },
      { property: "og:description", content: "Freeze accounts, rotate certs, revoke sessions and file SARs — every action with counterfactual reasoning." },
    ],
  }),
  component: ResponsePage,
});

type ActionStatus = "pending" | "approved" | "denied" | "executed";
type Stage = "pre-attack" | "early" | "in-progress" | "post-breach";
interface PlaybookAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  target: string;
  reasoning: string;
  confidence: number;
  blastRadius: string;
  reversible: boolean;
  latencyMs: number;
  stage: Stage;
  minute: number;
}

const PLAYBOOK: PlaybookAction[] = [
  { id: "act-0a", icon: MailWarning, title: "Auto-quarantine suspicious inbound email",    target: "mailflow:corp",  reasoning: "URL similarity 0.94 to known Lazarus phish kit · headers spoof MX lookalike",  confidence: 91, blastRadius: "1 mailbox",           reversible: true,  latencyMs: 60,   stage: "pre-attack",  minute: -18 },
  { id: "act-0b", icon: Eye,         title: "Elevate telemetry on target user + endpoint", target: "emp:kunal",      reasoning: "Twin drift crossing 55 · click-through predicted in 3–5 min",                 confidence: 87, blastRadius: "1 user · sensor only", reversible: true, latencyMs: 40,   stage: "pre-attack",  minute: -14 },
  { id: "act-0c", icon: LockKeyhole, title: "Force step-up MFA on next auth attempt",      target: "emp:kunal",      reasoning: "Pre-emptive challenge blocks 96% of harvested-credential replays",            confidence: 93, blastRadius: "1 user · 1 session",  reversible: true,  latencyMs: 80,   stage: "early",       minute: -6  },
  { id: "act-1",  icon: UserX,       title: "Revoke Kerberos + force MFA re-enrol",         target: "emp:kunal",      reasoning: "Behavioural drift 79 · after-hours privilege escalation · maps to APT38 dwell", confidence: 96, blastRadius: "1 employee · 0 customers", reversible: true, latencyMs: 320, stage: "in-progress", minute: 2 },
  { id: "act-2",  icon: ShieldOff,   title: "Quarantine endpoint (EDR containment)",        target: "dev:kunal-lt",   reasoning: "Reflective DLL injection + 940 MB/h egress to known Lazarus C2",              confidence: 97, blastRadius: "1 device",           reversible: true,  latencyMs: 180,  stage: "in-progress", minute: 4 },
  { id: "act-3",  icon: KeyRound,    title: "Rotate cert → Dilithium-3 (PQC)",              target: "cert:web-old",   reasoning: "RSA-2048 encrypting staged 1.7 GB archive — direct HNDL exposure",            confidence: 88, blastRadius: "swift-gateway · 6-min window", reversible: false, latencyMs: 4200, stage: "in-progress", minute: 7 },
  { id: "act-4",  icon: Ban,         title: "Block C2 range at perimeter",                  target: "ip:tor-exit",    reasoning: "185.220.101.0/24 attributed to Lazarus infra, 47 sightings in 30d",           confidence: 99, blastRadius: "perimeter",          reversible: true,  latencyMs: 90,   stage: "in-progress", minute: 8 },
  { id: "act-5",  icon: Siren,       title: "Freeze mule cluster payouts",                  target: "acc:mule-77",    reasoning: "Fraud score 94 · funds concentrating to offshore-fx-14 · velocity 5.6× baseline", confidence: 92, blastRadius: "3 accounts",       reversible: true,  latencyMs: 240,  stage: "post-breach", minute: 12 },
  { id: "act-6",  icon: FileWarning, title: "Draft SAR to FIU-IND",                          target: "STORY-HNDL-014", reasoning: "Staged 1.8 GB customer ledger export triggers PMLA §12 reporting",            confidence: 84, blastRadius: "compliance",         reversible: true,  latencyMs: 900,  stage: "post-breach", minute: 18 },
];

const STAGE_LABEL: Record<Stage, { label: string; color: string }> = {
  "pre-attack":  { label: "Pre-attack",  color: "var(--safe)"   },
  "early":       { label: "Early stage", color: "var(--cyber)"  },
  "in-progress": { label: "In progress", color: "var(--warn)"   },
  "post-breach": { label: "Post-breach", color: "var(--danger)" },
};

export function ResponsePage() {
  const { entity } = Route.useSearch();
  const focusEntity = entity ? getEntity(entity) : null;
  const story = STORIES[0];
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>({});
  const set = (id: string, s: ActionStatus) => setStatuses(prev => ({ ...prev, [id]: s }));
  const counts = useMemo(() => {
    let approved = 0, denied = 0, pending = 0;
    for (const a of PLAYBOOK) {
      const s = statuses[a.id] ?? "pending";
      if (s === "approved" || s === "executed") approved++;
      else if (s === "denied") denied++;
      else pending++;
    }
    return { approved, denied, pending };
  }, [statuses]);

  const orderedPlaybook = useMemo(() => {
    if (!entity) return PLAYBOOK;
    const match = PLAYBOOK.filter(a => a.target === entity);
    const rest = PLAYBOOK.filter(a => a.target !== entity);
    return [...match, ...rest];
  }, [entity]);

  return (
    <div className="min-h-screen">
      <NavRail />
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {focusEntity && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs">
            <span className="font-mono uppercase tracking-widest text-primary">Focused on</span>
            <span className="font-medium">{focusEntity.label}</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{focusEntity.kind}</span>
          </div>
        )}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Autonomous Response · {story.id}
            </div>
            <h1 className="text-glow text-2xl font-semibold">{story.title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              The Executive Decision Agent has assembled a 6-step playbook. Every action carries a signed
              reasoning trace, blast-radius estimate and reversibility guarantee. Nothing executes without an
              explainable approval.
            </p>
          </div>
          <div className="flex gap-2">
            <Stat label="Approved" value={counts.approved} tone="safe" />
            <Stat label="Pending"  value={counts.pending}  tone="warn" />
            <Stat label="Denied"   value={counts.denied}   tone="danger" />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-3">
            {orderedPlaybook.map(a => (
              <ActionCard
                key={a.id}
                action={a}
                status={statuses[a.id] ?? "pending"}
                onApprove={() => set(a.id, "approved")}
                onDeny={() => set(a.id, "denied")}
              />
            ))}
          </div>

          <div className="col-span-4 space-y-4">
            <div className="panel p-4">
              <div className="mb-2 flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-primary" />
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Live response feed</div>
              </div>
              <div className="space-y-2 font-mono text-[11px]">
                <FeedLine time="T+00:41" text="Playbook assembled · 6 actions · confidence 93" tone="cyber" />
                <FeedLine time="T+00:41" text="Awaiting SOC L2 approval on 6 actions" tone="warn" />
                <FeedLine time="T-02:12" text="Twin drift(emp:kunal) crossed 75 threshold" tone="warn" />
                <FeedLine time="T-04:33" text="GNN detected new edge dev:kunal-lt → ip:tor-exit" tone="danger" />
                <FeedLine time="T-08:10" text="Baseline snapshot rotated · TFT v1.7 online" tone="safe" />
              </div>
            </div>

            <div className="panel p-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Guardrails</div>
              <ul className="space-y-1.5 text-xs text-foreground/80">
                <li>· Actions above blast-radius=1000 require dual approval</li>
                <li>· Irreversible actions require CISO signature</li>
                <li>· All approvals cryptographically signed (Dilithium-3)</li>
                <li>· 15-minute automatic rollback window on reversible actions</li>
                <li>· Full evidence chain shipped to WORM audit ledger</li>
              </ul>
            </div>

            <div className="panel p-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Predicted next attacker action</div>
              <div className="text-sm text-foreground/80">{story.predictedNext}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  action, status, onApprove, onDeny,
}: {
  action: PlaybookAction; status: ActionStatus;
  onApprove: () => void; onDeny: () => void;
}) {
  const target = getEntity(action.target);
  const Icon = action.icon;
  const badge =
    status === "approved" ? { text: "APPROVED", color: "var(--safe)" } :
    status === "denied"   ? { text: "DENIED",   color: "var(--danger)" } :
    status === "executed" ? { text: "EXECUTED", color: "var(--cyber)" } :
                             { text: "PENDING",  color: "var(--warn)" };

  return (
    <div className="panel p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium">{action.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                target · {target?.label ?? action.target}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="rounded-md border px-2 py-0.5 font-mono text-[10px]"
                style={{ color: STAGE_LABEL[action.stage].color, borderColor: `color-mix(in oklab, ${STAGE_LABEL[action.stage].color} 40%, transparent)`, background: `color-mix(in oklab, ${STAGE_LABEL[action.stage].color} 10%, transparent)` }}
                title={`Intervention window: T${action.minute >= 0 ? "+" : ""}${action.minute} min`}
              >
                {STAGE_LABEL[action.stage].label} · T{action.minute >= 0 ? "+" : ""}{action.minute}m
              </span>
              <span
                className="rounded-md border px-2 py-0.5 font-mono text-[10px]"
                style={{ color: badge.color, borderColor: `color-mix(in oklab, ${badge.color} 40%, transparent)`, background: `color-mix(in oklab, ${badge.color} 10%, transparent)` }}
              >
                {badge.text}
              </span>
            </div>
          </div>

          <div className="mt-2 text-sm text-foreground/80">{action.reasoning}</div>

          <div className="mt-3 grid grid-cols-4 gap-2 font-mono text-[10px]">
            <Meta k="Confidence" v={`${action.confidence}%`} />
            <Meta k="Blast radius" v={action.blastRadius} />
            <Meta k="Reversible" v={action.reversible ? "yes · 15min" : "no · CISO"} tone={action.reversible ? undefined : "danger"} />
            <Meta k="ETA" v={`${action.latencyMs} ms`} />
          </div>

          {status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onApprove}
                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--safe)]/40 bg-[color:var(--safe)]/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-[color:var(--safe)] hover:bg-[color:var(--safe)]/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve & execute
              </button>
              <button
                onClick={onDeny}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-3.5 w-3.5" /> Deny
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ k, v, tone }: { k: string; v: string; tone?: "danger" }) {
  const color = tone === "danger" ? "var(--danger)" : "var(--foreground)";
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div style={{ color }}>{v}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "safe" | "warn" | "danger" }) {
  const color = tone === "danger" ? "var(--danger)" : tone === "warn" ? "var(--warn)" : "var(--safe)";
  return (
    <div className="rounded-md border border-border/60 bg-card/60 px-3 py-1.5 text-center">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

function FeedLine({ time, text, tone }: { time: string; text: string; tone: "cyber" | "safe" | "warn" | "danger" }) {
  const color = tone === "danger" ? "var(--danger)" : tone === "warn" ? "var(--warn)" : tone === "safe" ? "var(--safe)" : "var(--cyber)";
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground">{time}</span>
      <span style={{ color }}>■</span>
      <span className="text-foreground/80">{text}</span>
    </div>
  );
}
