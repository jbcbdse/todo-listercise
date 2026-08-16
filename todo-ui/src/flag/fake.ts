import type { FlagProvider } from "@/flag/provider";

export class FakeFlagProvider implements FlagProvider {
  private readonly listeners = new Set<() => void>();
  private values: Record<string, boolean>;

  constructor(values: Record<string, boolean> = {}) {
    this.values = values;
  }

  set(key: string, enabled: boolean): void {
    this.values = { ...this.values, [key]: enabled };
    for (const listener of this.listeners) {
      listener();
    }
  }

  isEnabled(key: string): boolean {
    return this.values[key] ?? false;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
