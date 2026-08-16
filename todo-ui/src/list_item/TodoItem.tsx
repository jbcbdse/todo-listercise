import { useCallback, useState } from "react";

import type { Todo } from "@/api/todo";
import { FlagKey } from "@/flag/keys";
import { useFlag } from "@/flag/use_flag";
import { SparkleBurst } from "@/list_item/SparkleBurst";
import { Button } from "@/ui/Button";
import { Checkbox } from "@/ui/Checkbox";

interface TodoItemProps {
  item: Todo;
  onCompletedChange: (completed: boolean) => void;
  onDelete: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function TodoItem({ item, onCompletedChange, onDelete }: TodoItemProps) {
  const sparklesOn = useFlag(FlagKey.CompletedSparkles);
  const [burst, setBurst] = useState(false);
  const clearBurst = useCallback(() => {
    setBurst(false);
  }, []);

  return (
    <li
      data-flip-key={item.id}
      className="relative flex items-center justify-between gap-3 py-2"
    >
      {burst ? <SparkleBurst onDone={clearBurst} /> : null}
      <Checkbox
        label={item.title}
        checked={item.completed}
        className={item.completed ? "text-zinc-400 line-through" : ""}
        onChange={(event) => {
          const completed = event.target.checked;
          if (completed && sparklesOn && !prefersReducedMotion()) {
            setBurst(true);
          }
          onCompletedChange(completed);
        }}
      />
      <Button variant="danger" onClick={onDelete}>
        Delete
      </Button>
    </li>
  );
}
