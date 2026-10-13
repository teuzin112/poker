"use client";

import { useActionState, useState } from "react";
import { createPlayer, updatePlayer } from "@/app/actions/players";
import type { FormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { btnSecondary, ErrorText, input } from "@/components/ui";

export function PlayerForm({ player }: { player?: { id: number; name: string; nickname: string | null } }) {
  const [name, setName] = useState(player?.name ?? "");
  const [nickname, setNickname] = useState(player?.nickname ?? "");
  const [state, action] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await (player ? updatePlayer : createPlayer)(prev, formData);
    if (!player && !result?.error) {
      setName("");
      setNickname("");
    }
    return result;
  }, undefined);

  return (
    <form action={action} className="space-y-2">
      {player && <input type="hidden" name="id" value={player.id} />}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" aria-label="Nome" className={input} />
        <input
          name="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Apelido (opcional)"
          aria-label="Apelido"
          className={input}
        />
        <SubmitButton className={`${btnSecondary} shrink-0`}>{player ? "Salvar" : "Cadastrar"}</SubmitButton>
      </div>
      <ErrorText>{state?.error}</ErrorText>
      {player && state && !state.error && <p className="text-sm text-win">Salvo.</p>}
    </form>
  );
}
