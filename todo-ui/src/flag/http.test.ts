import { describe, expect, it, vi } from "vitest";

import { HttpFlagProvider } from "@/flag/http";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HttpFlagProvider", () => {
  it("treats a missing key as false", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(jsonResponse([{ key: "alpha", enabled: true }])),
    );
    const flags = new HttpFlagProvider("/api/flags", 60_000, fetchImpl);
    await flags.refresh();
    expect(flags.isEnabled("alpha")).toBe(true);
    expect(flags.isEnabled("beta")).toBe(false);
  });

  it("notifies subscribers when values change", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ key: "alpha", enabled: false }]))
      .mockResolvedValueOnce(jsonResponse([{ key: "alpha", enabled: true }]));
    const flags = new HttpFlagProvider("/api/flags", 60_000, fetchImpl);
    const listener = vi.fn();
    flags.subscribe(listener);
    await flags.refresh();
    expect(listener).toHaveBeenCalledOnce();
    await flags.refresh();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
