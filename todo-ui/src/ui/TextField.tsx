import { useId, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({
  label,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={inputId}>
      <span className="font-medium text-zinc-700">{label}</span>
      <input
        id={inputId}
        className={`rounded-md border border-zinc-300 px-3 py-1.5 ${className}`}
        {...props}
      />
    </label>
  );
}
