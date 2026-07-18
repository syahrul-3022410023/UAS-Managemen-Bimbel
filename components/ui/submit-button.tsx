"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function SubmitButton({ children, icon, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={
        className ||
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition duration-300 hover:bg-brandHover active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-70"
      }
      type="submit"
      disabled={pending}
    >
      {icon}
      {pending ? "Memproses..." : children}
    </button>
  );
}
