import type { InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <input type="checkbox" className="size-4" {...props} />
      {label}
    </label>
  );
}
