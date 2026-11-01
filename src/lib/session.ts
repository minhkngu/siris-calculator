export const SESSION_STATE_KEY = 'hotel-price-calculator:session:v1';
export const SESSION_SCROLL_KEY = 'hotel-price-calculator:scroll:v1';

export function readSessionState<T>(): T | null {
  try {
    const saved = sessionStorage.getItem(SESSION_STATE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as T;
  } catch {
    return null;
  }
}

export function writeSessionState(value: unknown): void {
  try {
    sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(value));
  } catch {
    // The app remains usable when browser storage is unavailable or full.
  }
}

export function readSessionScroll(): number | null {
  try {
    const saved = sessionStorage.getItem(SESSION_SCROLL_KEY);
    if (saved === null) return null;
    const value = Number(saved);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeSessionScroll(value: number): void {
  try {
    sessionStorage.setItem(SESSION_SCROLL_KEY, String(Math.max(0, Math.round(value))));
  } catch {
    // Ignore storage failures; scroll persistence is best-effort.
  }
}

export interface SessionWriter<T> {
  schedule(value: T): void;
  flush(): void;
}

/**
 * Debounces snapshot writes so typing does not serialise the whole session on
 * every keystroke. `flush` is meant for `pagehide` and must write immediately.
 */
export function createSessionWriter<T>(delayMs = 500): SessionWriter<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest: T | undefined;
  let hasLatest = false;

  const flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (!hasLatest) return;
    const value = latest as T;
    hasLatest = false;
    latest = undefined;
    writeSessionState(value);
  };

  const schedule = (value: T) => {
    latest = value;
    hasLatest = true;
    if (timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      flush();
    }, delayMs);
  };

  return { schedule, flush };
}
