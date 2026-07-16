// SentinelX Quantum Intelligence — synthetic entity / twin / story / quantum data engine.
// Client-side only. Deterministic seeds where possible so the demo replays consistently.

export type EntityKind =
  | "customer" | "employee" | "device" | "server" | "account" | "merchant"
  | "ip" | "certificate" | "threat_actor" | "application" | "branch";

export interface Entity {
  id: string;
  kind: EntityKind;
  label: string;
  trust: number;      // 0-100
  risk: number;       // 0-100
  quantumRisk?: number;
  tags?: string[];
}

export interface Edge {
  from: string;
  to: string;
  kind: "auth" | "txn" | "network" | "exec" | "trust" | "encrypts" | "owns" | "attack";
  weight?: number;
  compromised?: boolean;
}

export interface DigitalTwin {
  entityId: string;
  baseline: { label: string; value: number; unit?: string }[];
  current:  { label: string; value: number; unit?: string }[];
  drift: number;               // 0-100
  narrative: string;
}

export interface StoryStep {
  t: string;                   // relative time e.g. "T+00:02"
  actor: string;               // entity id
  action: string;
  evidence: string;
  mitre: string;               // e.g. T1059.001
  confidence: number;          // 0-100
  scores: Partial<Scores>;
}

export interface AttackStory {
  id: string;
  title: string;
  kind: "insider" | "apt" | "fraud-ring" | "hndl";
  severity: "critical" | "high" | "medium";
  opened: string;
  entities: string[];          // entity ids implicated
  steps: StoryStep[];
  counterfactual: string;
  predictedNext: string;
  remediation: string[];
  businessImpact: string;
}

export interface Scores {
  trust: number;
  threat: number;
  fraud: number;
  quantum: number;
  identity: number;
  business: number;
  operational: number;
}

export interface CryptoAsset {
  id: string;
  service: string;
  algo: "RSA-2048" | "RSA-4096" | "ECC-P256" | "ECC-P384" | "AES-256-GCM" | "3DES" | "TLS 1.0" | "TLS 1.2" | "TLS 1.3" | "Kyber-1024" | "Dilithium-3";
  keyAgeDays: number;
  expiresInDays: number;
  pqcReady: boolean;
  harvestRisk: number;       // 0-100
  volumeGBpm: number;        // encrypted volume per month
}

// ---------- Entities ----------

export const ENTITIES: Entity[] = [
  { id: "cust:priya",   kind: "customer", label: "priya.sharma",   trust: 88, risk: 12 },
  { id: "cust:arjun",   kind: "customer", label: "arjun.mehta",    trust: 72, risk: 34 },
  { id: "cust:ananya",  kind: "customer", label: "ananya.iyer",    trust: 91, risk: 8 },
  { id: "cust:rohan",   kind: "customer", label: "rohan.kapoor",   trust: 41, risk: 78, tags: ["watchlist"] },
  { id: "emp:kunal",    kind: "employee", label: "kunal.rao · SRE", trust: 62, risk: 66, tags: ["drift↑"] },
  { id: "emp:meera",    kind: "employee", label: "meera.das · Ops", trust: 89, risk: 14 },
  { id: "dev:kunal-lt", kind: "device",   label: "LT-KUNAL-04",     trust: 33, risk: 82, tags: ["EDR alert"] },
  { id: "dev:priya-mb", kind: "device",   label: "priya-macbook",   trust: 90, risk: 10 },
  { id: "srv:corebank", kind: "server",   label: "corebank-prod-14", trust: 78, risk: 42 },
  { id: "srv:vault",    kind: "server",   label: "hsm-vault-01",    trust: 95, risk: 22, quantumRisk: 71 },
  { id: "app:netbank",  kind: "application", label: "netbanking-web", trust: 84, risk: 24 },
  { id: "app:swift",    kind: "application", label: "swift-gateway",  trust: 80, risk: 40, quantumRisk: 88 },
  { id: "acc:9001",     kind: "account",  label: "AC-****9001",    trust: 70, risk: 40 },
  { id: "acc:mule-77",  kind: "account",  label: "AC-****7712",    trust: 12, risk: 94, tags: ["mule"] },
  { id: "mer:amznin",   kind: "merchant", label: "AMZ India",       trust: 92, risk: 8 },
  { id: "mer:offshore", kind: "merchant", label: "OFFSHORE-FX-14",  trust: 22, risk: 87, tags: ["darkweb"] },
  { id: "ip:tor-exit",  kind: "ip",       label: "185.220.101.5",   trust: 8,  risk: 96, tags: ["TOR exit"] },
  { id: "ip:corp-vpn",  kind: "ip",       label: "10.42.13.7",      trust: 82, risk: 20 },
  { id: "cert:web-old", kind: "certificate", label: "*.bank.in RSA-2048", trust: 55, risk: 60, quantumRisk: 92 },
  { id: "cert:web-pqc", kind: "certificate", label: "swift.bank.in Dilithium-3", trust: 96, risk: 8, quantumRisk: 4 },
  { id: "ta:lazarus",   kind: "threat_actor", label: "Lazarus Group", trust: 0, risk: 100, tags: ["APT38", "N.Korea"] },
  { id: "br:mumbai",    kind: "branch",   label: "Mumbai BKC",      trust: 90, risk: 10 },
];

const idMap = new Map(ENTITIES.map(e => [e.id, e]));
export const getEntity = (id: string) => idMap.get(id);

// ---------- Edges (base topology; story edges added dynamically) ----------

export const EDGES: Edge[] = [
  { from: "cust:priya",   to: "dev:priya-mb",  kind: "owns" },
  { from: "cust:priya",   to: "app:netbank",   kind: "auth" },
  { from: "cust:priya",   to: "acc:9001",      kind: "owns" },
  { from: "cust:arjun",   to: "app:netbank",   kind: "auth" },
  { from: "cust:rohan",   to: "acc:mule-77",   kind: "txn", weight: 3, compromised: true },
  { from: "acc:mule-77",  to: "mer:offshore",  kind: "txn", weight: 5, compromised: true },
  { from: "ip:tor-exit",  to: "cust:rohan",    kind: "network", compromised: true },
  { from: "emp:kunal",    to: "dev:kunal-lt",  kind: "owns" },
  { from: "dev:kunal-lt", to: "ip:corp-vpn",   kind: "network" },
  { from: "dev:kunal-lt", to: "srv:corebank",  kind: "exec", compromised: true },
  { from: "srv:corebank", to: "srv:vault",     kind: "encrypts" },
  { from: "srv:corebank", to: "app:swift",     kind: "trust" },
  { from: "app:swift",    to: "cert:web-old",  kind: "encrypts" },
  { from: "app:netbank",  to: "cert:web-pqc",  kind: "encrypts" },
  { from: "emp:meera",    to: "srv:corebank",  kind: "auth" },
  { from: "br:mumbai",    to: "emp:kunal",     kind: "owns" },
  { from: "ta:lazarus",   to: "ip:tor-exit",   kind: "attack", compromised: true },
  { from: "ta:lazarus",   to: "dev:kunal-lt",  kind: "attack", compromised: true },
];

// ---------- Global composite scores ----------

export const SCORES: Scores = {
  trust: 71,
  threat: 68,
  fraud: 54,
  quantum: 82,
  identity: 77,
  business: 61,
  operational: 84,
};

export const SCORE_META: Record<keyof Scores, { label: string; hue: string; hint: string; trend: number[] }> = {
  trust:       { label: "Trust",        hue: "safe",  hint: "Composite organisational trust",  trend: [66,68,70,72,71,73,71] },
  threat:      { label: "Threat",       hue: "danger",hint: "Active adversary pressure",       trend: [40,45,52,60,64,66,68] },
  fraud:       { label: "Fraud",        hue: "warn",  hint: "Anomalous transactional intent",  trend: [30,32,40,50,48,52,54] },
  quantum:     { label: "Quantum Risk", hue: "danger",hint: "HNDL & PQC-migration exposure",   trend: [78,80,79,81,80,82,82] },
  identity:    { label: "Identity",     hue: "cyber", hint: "Auth & behavioural confidence",   trend: [80,79,78,77,78,77,77] },
  business:    { label: "Business",     hue: "warn",  hint: "Blast-radius weighted risk",      trend: [50,52,55,58,60,62,61] },
  operational: { label: "Operational",  hue: "safe",  hint: "Control health & SLA integrity",  trend: [85,86,84,85,84,84,84] },
};

// ---------- Digital Twins ----------

export const TWINS: DigitalTwin[] = [
  {
    entityId: "cust:rohan",
    baseline: [
      { label: "Login geo", value: 92, unit: "% India" },
      { label: "Txn velocity", value: 3, unit: "/day" },
      { label: "Avg txn", value: 4200, unit: "₹" },
      { label: "Merchant diversity", value: 12 },
      { label: "Device trust", value: 90 },
    ],
    current: [
      { label: "Login geo", value: 20, unit: "% India" },
      { label: "Txn velocity", value: 17, unit: "/day" },
      { label: "Avg txn", value: 187000, unit: "₹" },
      { label: "Merchant diversity", value: 2 },
      { label: "Device trust", value: 32 },
    ],
    drift: 87,
    narrative:
      "Account behaviour diverged sharply in the last 36h — logins shifted to a TOR exit, transaction velocity is 5.6× baseline, funds concentrate to a single offshore merchant. Consistent with a coordinated account takeover feeding a mule cluster.",
  },
  {
    entityId: "emp:kunal",
    baseline: [
      { label: "VPN hours", value: 9, unit: "-18" },
      { label: "SQL export MB", value: 12 },
      { label: "PowerShell events", value: 2 },
      { label: "Cert requests", value: 0 },
      { label: "After-hours %", value: 5 },
    ],
    current: [
      { label: "VPN hours", value: 22, unit: "-04" },
      { label: "SQL export MB", value: 1840 },
      { label: "PowerShell events", value: 47 },
      { label: "Cert requests", value: 6 },
      { label: "After-hours %", value: 71 },
    ],
    drift: 79,
    narrative:
      "Insider behavioural drift: after-hours VPN spikes, PowerShell execution above 20σ, unusually large SQL exports staged into an RSA-encrypted archive. Pattern maps to APT38 dwell tactics.",
  },
  {
    entityId: "dev:kunal-lt",
    baseline: [
      { label: "Processes", value: 84 },
      { label: "Outbound MB/h", value: 12 },
      { label: "EDR score", value: 92 },
      { label: "Patched CVEs", value: 100, unit: "%" },
      { label: "Unusual DLLs", value: 0 },
    ],
    current: [
      { label: "Processes", value: 173 },
      { label: "Outbound MB/h", value: 940 },
      { label: "EDR score", value: 34 },
      { label: "Patched CVEs", value: 78, unit: "%" },
      { label: "Unusual DLLs", value: 4 },
    ],
    drift: 84,
    narrative: "Endpoint compromised — reflective DLL injection detected, encrypted egress to known Lazarus C2 infrastructure.",
  },
];

// ---------- Attack story (the flagship HNDL kill-chain) ----------

export const STORIES: AttackStory[] = [
  {
    id: "STORY-HNDL-014",
    title: "Harvest-Now-Decrypt-Later staging via compromised SRE laptop",
    kind: "hndl",
    severity: "critical",
    opened: "T-42m",
    entities: ["ta:lazarus", "emp:kunal", "dev:kunal-lt", "ip:corp-vpn", "srv:corebank", "srv:vault", "app:swift", "cert:web-old", "ip:tor-exit"],
    steps: [
      { t: "T+00:00", actor: "dev:kunal-lt", action: "Spear-phish payload executed",     evidence: "EDR: powershell.exe -enc <b64>; parent=outlook.exe",         mitre: "T1566.001 / T1059.001", confidence: 96, scores: { threat: +12 } },
      { t: "T+00:03", actor: "dev:kunal-lt", action: "Reflective DLL injection",         evidence: "CrowdStrike: unsigned module in lsass.exe",                mitre: "T1055.001", confidence: 92, scores: { threat: +8 } },
      { t: "T+00:07", actor: "emp:kunal",    action: "VPN login at 03:42 IST",           evidence: "Identity provider: unusual-hours anomaly, 22σ",             mitre: "T1078.002", confidence: 88, scores: { identity: -14 } },
      { t: "T+00:12", actor: "emp:kunal",    action: "Privilege escalation to db_ro",    evidence: "AD audit: group change without CR ticket",                  mitre: "T1068",     confidence: 84, scores: { trust: -10 } },
      { t: "T+00:19", actor: "srv:corebank", action: "1.8 GB SQL export to /tmp",        evidence: "DB proxy log: SELECT * FROM txn_ledger LIMIT 8M",           mitre: "T1005",     confidence: 91, scores: { fraud: +9 } },
      { t: "T+00:24", actor: "dev:kunal-lt", action: "RSA-2048 archive built",           evidence: "File watcher: archive.enc, algo=RSA-2048, size=1.7GB",       mitre: "T1560.001", confidence: 95, scores: { quantum: +11 } },
      { t: "T+00:31", actor: "dev:kunal-lt", action: "Encrypted egress to TOR exit",     evidence: "NetFlow: 940 MB/h → 185.220.101.5 (Lazarus C2 cluster)",    mitre: "T1041",     confidence: 97, scores: { threat: +14, business: +9 } },
      { t: "T+00:38", actor: "app:swift",    action: "Cert rotation attempt on RSA-2048", evidence: "PKI service: manual CSR by kunal.rao out-of-band",         mitre: "T1552.004", confidence: 78, scores: { quantum: +6 } },
    ],
    counterfactual:
      "If cert:web-old had been migrated to Dilithium-3 in the Q3 PQC wave, the exfiltrated ledger would remain undecryptable even under a future CRQC, reducing 10-year business impact by ~₹420 Cr.",
    predictedNext:
      "Attacker expected to attempt SWIFT payload injection using harvested creds within 6-12h (65% confidence, ATT&CK T1071.001 pattern).",
    remediation: [
      "Freeze emp:kunal session, revoke Kerberos tickets, force MFA re-enrollment",
      "Quarantine dev:kunal-lt, snapshot for IR forensics",
      "Rotate cert:web-old → Dilithium-3, invalidate archive key",
      "Block 185.220.101.5/24 at perimeter + notify FinCERT",
      "Trigger SAR filing for staged 1.8GB customer ledger",
    ],
    businessImpact: "Potential ₹420 Cr HNDL exposure · SWIFT reputational risk · RBI 6-hour breach clock started",
  },
];

// ---------- Quantum Crypto Asset Inventory ----------

export const CRYPTO_ASSETS: CryptoAsset[] = [
  { id: "CA-001", service: "swift-gateway",       algo: "RSA-2048",   keyAgeDays: 812, expiresInDays: 91,  pqcReady: false, harvestRisk: 94, volumeGBpm: 2400 },
  { id: "CA-002", service: "core-banking DB TDE", algo: "AES-256-GCM",keyAgeDays: 210, expiresInDays: 520, pqcReady: true,  harvestRisk: 22, volumeGBpm: 18000 },
  { id: "CA-003", service: "netbanking-web",      algo: "TLS 1.3",    keyAgeDays: 46,  expiresInDays: 320, pqcReady: false, harvestRisk: 41, volumeGBpm: 9800 },
  { id: "CA-004", service: "netbanking-mobile",   algo: "ECC-P256",   keyAgeDays: 610, expiresInDays: 60,  pqcReady: false, harvestRisk: 78, volumeGBpm: 5200 },
  { id: "CA-005", service: "hsm-vault-01",        algo: "Kyber-1024", keyAgeDays: 12,  expiresInDays: 720, pqcReady: true,  harvestRisk: 6,  volumeGBpm: 700 },
  { id: "CA-006", service: "loan-origination",    algo: "RSA-4096",   keyAgeDays: 340, expiresInDays: 240, pqcReady: false, harvestRisk: 71, volumeGBpm: 900 },
  { id: "CA-007", service: "atm-network",         algo: "3DES",       keyAgeDays: 2100,expiresInDays: 30,  pqcReady: false, harvestRisk: 98, volumeGBpm: 220 },
  { id: "CA-008", service: "swift-gateway-pqc",   algo: "Dilithium-3",keyAgeDays: 8,   expiresInDays: 720, pqcReady: true,  harvestRisk: 4,  volumeGBpm: 2400 },
  { id: "CA-009", service: "b2b-partner-api",     algo: "TLS 1.2",    keyAgeDays: 190, expiresInDays: 140, pqcReady: false, harvestRisk: 62, volumeGBpm: 1400 },
  { id: "CA-010", service: "legacy-mainframe",    algo: "TLS 1.0",    keyAgeDays: 3200,expiresInDays: 14,  pqcReady: false, harvestRisk: 96, volumeGBpm: 80 },
];

export function quantumReadiness() {
  const total = CRYPTO_ASSETS.reduce((s,a) => s + a.volumeGBpm, 0);
  const ready = CRYPTO_ASSETS.filter(a => a.pqcReady).reduce((s,a) => s + a.volumeGBpm, 0);
  const readiness = Math.round((ready / total) * 100);
  const harvestRisk = Math.round(
    CRYPTO_ASSETS.reduce((s,a) => s + a.harvestRisk * a.volumeGBpm, 0) / total
  );
  const migrationPriority = Math.round(
    CRYPTO_ASSETS.filter(a => !a.pqcReady && a.harvestRisk > 60).length /
    CRYPTO_ASSETS.length * 100
  );
  return { readiness, harvestRisk, migrationPriority };
}

// ---------- Nav ----------

export const NAV = [
  { to: "/",          label: "Command Deck",   short: "DECK"  },
  { to: "/graph",     label: "Knowledge Graph",short: "GRAPH" },
  { to: "/stories",   label: "Attack Stories", short: "STORY" },
  { to: "/response",  label: "Auto Response",  short: "RESP"  },
  { to: "/quantum",   label: "Quantum Center", short: "QNTM"  },
  { to: "/executive", label: "Executive Brief",short: "EXEC"  },
  { to: "/profile",   label: "Analyst Profile",short: "PROF"  },
] as const;

