"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function SubmitButton({ children, icon, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={cn(
        "h-12 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white transition duration-300 hover:bg-brandHover active:scale-[0.98] focus:ring-4 focus:ring-brand/20",
        className
      )}
      type="submit"
      disabled={pending}
    >
      {icon}
      {pending ? "Memproses..." : children}
    </Button>
  );
}
