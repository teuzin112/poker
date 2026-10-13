"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/auth";
import { addEntry } from "@/app/actions/tournaments";
import { SubmitButton } from "@/components/SubmitButton";
import { btnSecondary, ErrorText, input } from "@/components/ui";

export function AddPlayerForm({ tournamentId, available }: { tournamentId: number; available: { id: number; name: string }[] }) {
  const [playerId, setPlayerId] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const [state, action] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await addEntry(prev, formData);
    if (!result?.error) {
      setPlayerId("");
      setNewPlayer("");
    }
    return result;
  }, undefined);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="playerId" className={input} value={playerId} onChange={(e) => setPlayerId(e.target.value)} aria-label="Jogador cadastrado">
          <option value="">{available.length > 0 ? "Escolher jogador cadastrado…" : "Todos já estão no torneio"}</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          name="newPlayer"
          className={input}
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="…ou nome de um novo jogador"
          aria-label="Novo jogador"
        />
        <SubmitButton className={`${btnSecondary} shrink-0`}>Adicionar</SubmitButton>
      </div>
      <ErrorText>{state?.error}</ErrorText>
    </form>
  );
}
