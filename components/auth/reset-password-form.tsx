"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { resetPasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthActionState = {
  status: "idle"
};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label className="text-xs font-semibold uppercase text-slate-500" htmlFor="password">
          Password Baru
        </Label>
        <Input
          className="mt-2 h-auto rounded-xl border-slate-100 bg-slate-50/50 px-4 py-3 ring-brand/10 placeholder:text-slate-400 focus-visible:border-brand focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-brand/10 focus-visible:ring-offset-0"
          id="password"
          name="password"
          type="password"
          placeholder="********"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state.message ? (
        <Alert className="rounded-xl" variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
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
