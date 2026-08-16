import { renderHook } from "@testing-library/react";
import { act, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { FlagProviderHost } from "@/flag/context";
import { FakeFlagProvider } from "@/flag/fake";
import { useFlag } from "@/flag/use_flag";

describe("useFlag", () => {
  it("is false for an unknown key", () => {
    const flags = new FakeFlagProvider();
    function Wrapper({ children }: { children: ReactNode }) {
      return <FlagProviderHost value={flags}>{children}</FlagProviderHost>;
    }
    const { result } = renderHook(() => useFlag("alpha"), { wrapper: Wrapper });
    expect(result.current).toBe(false);
  });

  it("rerenders when a key is enabled", () => {
    const flags = new FakeFlagProvider({ alpha: false });
    function Wrapper({ children }: { children: ReactNode }) {
      return <FlagProviderHost value={flags}>{children}</FlagProviderHost>;
    }
    const { result } = renderHook(() => useFlag("alpha"), { wrapper: Wrapper });
    act(() => {
      flags.set("alpha", true);
    });
    expect(result.current).toBe(true);
  });
});
