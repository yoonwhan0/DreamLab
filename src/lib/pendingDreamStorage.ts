const STORAGE_KEY = "dreamlab:pendingDream";
const LEGACY_KEY = "pendingDream";

/** Google redirect 등 세션 유실 대비 — localStorage + sessionStorage */
export function savePendingDream(data: unknown): void {
  const json = JSON.stringify(data);
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    /* quota / private mode */
  }
  try {
    sessionStorage.setItem(LEGACY_KEY, json);
  } catch {
    /* ignore */
  }
}

export function getPendingDreamRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(LEGACY_KEY);
  } catch {
    return sessionStorage.getItem(LEGACY_KEY);
  }
}

export function clearPendingDream(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
