import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/ui/Button";
import { TextField } from "@/ui/TextField";

interface TodoComposerProps {
  onSubmit: (title: string) => void;
  disabled?: boolean;
}

export function TodoComposer({ onSubmit, disabled = false }: TodoComposerProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const next = title.trim();
    if (next.length === 0) {
      return;
    }
    onSubmit(next);
    setTitle("");
  }

  return (
    <form className="flex items-end gap-2" onSubmit={handleSubmit}>
      <div className="flex-1">
        <TextField
          label="Title"
          name="title"
          value={title}
          disabled={disabled}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </div>
      <Button type="submit" disabled={disabled || title.trim().length === 0}>
        Add
      </Button>
    </form>
  );
}
