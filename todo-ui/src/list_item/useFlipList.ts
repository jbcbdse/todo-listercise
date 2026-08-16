import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

export function useFlipList(
  keys: readonly string[],
): RefObject<HTMLUListElement | null> {
  const ref = useRef<HTMLUListElement>(null);
  const previous = useRef(new Map<string, number>());
  const signature = keys.join("\0");

  useLayoutEffect(() => {
    const parent = ref.current;
    if (parent === null) {
      return;
    }
    const reduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    for (const node of parent.children) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      const key = node.dataset.flipKey;
      if (key === undefined) {
        continue;
      }
      const top = node.getBoundingClientRect().top;
      next.set(key, top);
      const first = previous.current.get(key);
      if (first === undefined || reduced || typeof node.animate !== "function") {
        continue;
      }
      const dy = first - top;
      if (dy === 0) {
        continue;
      }
      node.animate(
        [{ transform: `translateY(${String(dy)}px)` }, { transform: "none" }],
        { duration: 240, easing: "ease-out" },
      );
    }
    previous.current = next;
  }, [signature]);

  return ref;
}
