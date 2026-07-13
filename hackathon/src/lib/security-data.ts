export type Severity = "low" | "medium" | "high" | "critical";

export type EventType =
  | "login"
  | "transaction"
  | "device"
  | "ip"
  | "malware"
  | "employee"
  | "password"
  | "block"
  | "phishing";

export interface SecurityEvent {
  id: string;
  time: string; // HH:MM
  timestamp: number;
  type: EventType;
  title: string;
  detail: string;
  user: string;
  ip: string;
  device: string;
  country: string;
  amount?: number;
  risk: number; // 0-100
  reasons: string[];
}

export const severityFor = (risk: number): Severity => {
  if (risk >= 85) return "critical";
  if (risk >= 65) return "high";
  if (risk >= 40) return "medium";
  return "low";
};

const users = ["priya.sharma", "arjun.mehta", "rohan.kapoor", "ananya.iyer", "vikram.singh"];
const devices = ["MacBook Pro", "iPhone 15", "Windows 11 PC", "Android Pixel", "Unknown Device"];
const countries = ["India", "Singapore", "USA", "Russia", "Nigeria", "Germany"];
const ips = ["103.24.11.44", "45.128.90.12", "185.220.101.5", "8.8.8.8", "192.168.1.24"];

const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function scoreEvent(partial: Omit<SecurityEvent, "id" | "time" | "timestamp" | "risk" | "reasons">): { risk: number; reasons: string[] } {
  let risk = 10;
  const reasons: string[] = [];
  if (partial.country !== "India") { risk += 30; reasons.push(`Login from new country (${partial.country})`); }
  if (partial.device === "Unknown Device") { risk += 25; reasons.push("New / unrecognised device fingerprint"); }
  if (partial.type === "malware") { risk += 45; reasons.push("Malware signature detected on endpoint"); }
  if (partial.type === "phishing") { risk += 40; reasons.push("Phishing pattern matched in email traffic"); }
  if (partial.type === "password") { risk += 20; reasons.push("Credentials changed outside usual pattern"); }
  if (partial.type === "employee") { risk += 15; reasons.push("Insider activity flagged by behavioural model"); }
  if (partial.amount && partial.amount > 100000) { risk += 25; reasons.push(`Large transaction (₹${partial.amount.toLocaleString("en-IN")}) above baseline`); }
  if (["Russia", "Nigeria"].includes(partial.country)) { risk += 15; reasons.push("Source region flagged in threat intel feed"); }
  risk = Math.min(100, risk + Math.floor(Math.random() * 8));
  if (!reasons.length) reasons.push("Normal behavioural pattern");
  return { risk, reasons };
}

let idCounter = 1000;
export function makeEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  const now = new Date();
  const type = overrides.type ?? rnd(["login", "transaction", "device", "ip"] as EventType[]);
  const base = {
    user: overrides.user ?? rnd(users),
    ip: overrides.ip ?? rnd(ips),
    device: overrides.device ?? rnd(devices),
    country: overrides.country ?? rnd(countries),
    type,
    title: overrides.title ?? typeTitle(type),
    detail: overrides.detail ?? "",
    amount: overrides.amount,
  };
  const { risk, reasons } = scoreEvent(base);
  return {
    id: `EVT-${++idCounter}`,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    timestamp: now.getTime(),
    risk: overrides.risk ?? risk,
    reasons: overrides.reasons ?? reasons,
    ...base,
    ...overrides,
  } as SecurityEvent;
}

function typeTitle(type: EventType): string {
  switch (type) {
    case "login": return "Login attempt";
    case "transaction": return "Transaction initiated";
    case "device": return "New device registered";
    case "ip": return "IP address change";
    case "malware": return "Malware alert";
    case "employee": return "Employee anomaly";
    case "password": return "Password changed";
    case "block": return "AI blocked activity";
    case "phishing": return "Phishing attempt";
  }
}

export function seedEvents(): SecurityEvent[] {
  const now = Date.now();
  const seeds: Partial<SecurityEvent>[] = [
    { type: "login", user: "priya.sharma", country: "India", device: "MacBook Pro", ip: "103.24.11.44" },
    { type: "transaction", user: "priya.sharma", amount: 4500, country: "India", device: "MacBook Pro" },
    { type: "login", user: "arjun.mehta", country: "Singapore", device: "iPhone 15" },
    { type: "device", user: "rohan.kapoor", device: "Unknown Device", country: "Russia" },
    { type: "transaction", user: "rohan.kapoor", amount: 250000, country: "Russia", device: "Unknown Device" },
  ];
  return seeds.map((s, i) => {
    const e = makeEvent(s);
    e.timestamp = now - (seeds.length - i) * 60_000;
    const d = new Date(e.timestamp);
    e.time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return e;
  });
}

export function attackScenario(kind: "phishing" | "malware" | "takeover"): SecurityEvent[] {
  const user = rnd(users);
  const country = kind === "takeover" ? "Russia" : "Nigeria";
  const device = "Unknown Device";
  const ip = "185.220.101.5";
  const base = { user, country, device, ip };
  const stamp = (offset: number) => {
    const d = new Date(Date.now() + offset);
    return { timestamp: d.getTime(), time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` };
  };
  if (kind === "phishing") {
    return [
      { ...makeEvent({ ...base, type: "phishing", detail: "Suspicious email link clicked from corp inbox" }), ...stamp(0) },
      { ...makeEvent({ ...base, type: "login", detail: "Credentials harvested via cloned portal" }), ...stamp(1000) },
    ];
  }
  if (kind === "malware") {
    return [
      { ...makeEvent({ ...base, type: "malware", detail: "Trojan.Win32.Agent detected on endpoint" }), ...stamp(0) },
      { ...makeEvent({ ...base, type: "employee", detail: "Endpoint attempted lateral movement" }), ...stamp(1500) },
    ];
  }
  return [
    { ...makeEvent({ ...base, type: "login", detail: "Successful login from new geography" }), ...stamp(0) },
    { ...makeEvent({ ...base, type: "password", detail: "Password rotated within 3 minutes" }), ...stamp(1200) },
    { ...makeEvent({ ...base, type: "device", detail: "Unknown device registered as trusted" }), ...stamp(2400) },
    { ...makeEvent({ ...base, type: "transaction", amount: 300000, detail: "High-value wire transfer initiated" }), ...stamp(3600) },
  ];
}
