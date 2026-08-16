import type { FlagProvider } from "@/flag/provider";

export const FLAG_POLL_MS = 5_000;

type FetchLike = typeof fetch;

function isFlagRow(row: unknown): row is { key: string; enabled: boolean } {
  return (
    typeof row === "object" &&
    row != null &&
    "key" in row &&
    "enabled" in row &&
    typeof (row as { key: unknown }).key === "string" &&
    typeof (row as { enabled: unknown }).enabled === "boolean"
  );
}
function mapsEqual(
  left: Map<string, boolean>,
  right: Map<string, boolean>,
): boolean {
  if (left.size !== right.size) {
    return false;
  }
  for (const [key, value] of left) {
    if (right.get(key) !== value) {
      return false;
    }
  }
  return true;
}

export class HttpFlagProvider implements FlagProvider {
  private cache = new Map<string, boolean>();
  private readonly listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly url: string;
  private readonly intervalMs: number;
  private readonly fetchImpl: FetchLike;

  constructor(
    url = "/api/flags",
    intervalMs = FLAG_POLL_MS,
    fetchImpl: FetchLike = (...args: Parameters<typeof fetch>) => fetch(...args),
  ) {
    this.url = url;
    this.intervalMs = intervalMs;
    this.fetchImpl = fetchImpl;
  }

  start(): void {
    void this.refresh();
    this.timer = setInterval(() => {
      void this.refresh();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  isEnabled(key: string): boolean {
    return this.cache.get(key) ?? false;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async refresh(): Promise<void> {
    const response = await this.fetchImpl(this.url);
    if (!response.ok) {
      return;
    }
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return;
    }
    const next = new Map<string, boolean>();
    for (const row of payload) {
      if (isFlagRow(row)) {
        next.set(row.key, row.enabled);
      }
    }
    if (mapsEqual(this.cache, next)) {
      return;
    }
    this.cache = next;
    for (const listener of this.listeners) {
      listener();
    }
  }
}
