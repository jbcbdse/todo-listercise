import { createContext, useContext } from "react";

import type { FlagProvider } from "@/flag/provider";

const FlagProviderContext = createContext<FlagProvider | null>(null);

export const FlagProviderHost = FlagProviderContext.Provider;

export function useFlagProvider(): FlagProvider {
  const flags = useContext(FlagProviderContext);
  if (flags == null) {
    throw new Error("FlagProvider is not configured");
  }
  return flags;
}
