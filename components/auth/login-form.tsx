"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type AuthActionState } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthActionState = {
  status: "idle"
};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5 font-sans">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="email">
          Alamat Email
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-sans outline-none ring-brand/10 transition-all placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4"
          id="email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="password">
          Kata Sandi
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-sans outline-none ring-brand/10 transition-all placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4"
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <div className="mt-2 text-right">
          <Link className="text-xs font-semibold text-brand transition hover:underline" href="/forgot-password">
            Lupa password?
          </Link>
        </div>
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
        <SubmitButton icon={<LogIn aria-hidden="true" size={16} />}>Masuk</SubmitButton>
      </div>
    </form>
  );
}
