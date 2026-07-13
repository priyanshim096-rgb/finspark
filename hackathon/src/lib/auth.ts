const KEY = "sentinelai_user";

export interface AuthUser { username: string; loggedInAt: number }

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

export function signIn(username: string) {
  const u: AuthUser = { username, loggedInAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(u));
  window.dispatchEvent(new Event("sentinelai-auth"));
  return u;
}

export function signOut() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("sentinelai-auth"));
}
