"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import {
  forgotPasswordAction,
  type AuthActionState
} from "@/lib/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthActionState = {
  status: "idle"
};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="email">
          Alamat Email
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm outline-none ring-brand/10 transition-all placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4"
          id="email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
      </div>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 border border-rose-100"
              : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-100"
          }
        >
          {state.message}
        </p>
      ) : null}
      <div className="pt-2">
        <SubmitButton icon={<Mail aria-hidden="true" size={16} />}>
          Kirim Link Reset
        </SubmitButton>
      </div>
    </form>
  );
}
