"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { resetPasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthActionState = {
  status: "idle"
};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="password">
          Password Baru
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm outline-none ring-brand/10 transition-all placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4"
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={8}
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
        <SubmitButton icon={<KeyRound aria-hidden="true" size={16} />}>
          Simpan Password
        </SubmitButton>
      </div>
      {state.status === "success" ? (
        <Link className="block text-center text-sm font-bold text-brand transition hover:underline" href="/login">
          Kembali ke login
        </Link>
      ) : null}
    </form>
  );
}
