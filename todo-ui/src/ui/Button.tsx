import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-500 disabled:bg-sky-600",
  secondary:
    "bg-white text-zinc-800 ring-1 ring-zinc-300 hover:bg-zinc-50",
  danger:
    "bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  type,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
