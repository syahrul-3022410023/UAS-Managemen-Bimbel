"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import {
  forgotPasswordAction,
  type AuthActionState
} from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthActionState = {
  status: "idle"
};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
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
      {state.message ? (
        <Alert className="rounded-xl" variant={state.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="pt-2">
        <SubmitButton icon={<Mail aria-hidden="true" size={16} />}>
          Kirim Link Reset
        </SubmitButton>
      </div>
    </form>
  );
}
