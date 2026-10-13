"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorText, input, label } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className={label}>
          Senha de administrador
        </label>
        <input id="password" name="password" type="password" autoFocus required className={input} />
      </div>
      <ErrorText>{state?.error}</ErrorText>
      <SubmitButton className="w-full rounded-lg bg-gold px-4 py-2.5 font-medium text-black">Entrar</SubmitButton>
    </form>
  );
}
