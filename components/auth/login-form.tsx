"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type AuthActionState } from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthActionState = {
  status: "idle"
};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5 font-sans">
      <div>
        <Label className="text-xs font-semibold uppercase text-slate-500" htmlFor="email">
          Alamat Email
        </Label>
        <Input
          className="mt-2 h-auto rounded-xl border-slate-100 bg-slate-50/50 px-4 py-3 ring-brand/10 placeholder:text-slate-400 focus-visible:border-brand focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand/10 focus-visible:ring-offset-0"
          id="email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase text-slate-500" htmlFor="password">
          Kata Sandi
        </Label>
        <Input
          className="mt-2 h-auto rounded-xl border-slate-100 bg-slate-50/50 px-4 py-3 ring-brand/10 placeholder:text-slate-400 focus-visible:border-brand focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand/10 focus-visible:ring-offset-0"
          id="password"
          name="password"
          type="password"
          placeholder="********"
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
        <Alert className="rounded-xl" variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="pt-2">
        <SubmitButton icon={<LogIn aria-hidden="true" size={16} />}>Masuk</SubmitButton>
      </div>
    </form>
  );
}
