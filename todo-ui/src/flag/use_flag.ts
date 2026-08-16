import { useEffect, useReducer } from "react";

import { useFlagProvider } from "@/flag/context";

export function useFlag(key: string): boolean {
  const flags = useFlagProvider();
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  useEffect(() => flags.subscribe(rerender), [flags]);
  return flags.isEnabled(key);
}
