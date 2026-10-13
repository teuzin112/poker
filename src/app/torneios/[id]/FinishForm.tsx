"use client";

import { useActionState, useState } from "react";
import { finishTournament } from "@/app/actions/tournaments";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorText, input } from "@/components/ui";

export function FinishForm({
  tournamentId,
  entries,
  paidPositions,
}: {
  tournamentId: number;
  entries: { id: number; name: string; position: number | null }[];
  paidPositions: number;
}) {
  const [state, action] = useActionState(finishTournament, undefined);
  // Controlado: o React limpa campos não controlados após cada envio, e um erro de validação
  // não deve apagar as colocações já escolhidas.
  const [positions, setPositions] = useState<Record<number, string>>(() =>
    Object.fromEntries(entries.map((e) => [e.id, e.position ? String(e.position) : ""])),
  );
  const options = Array.from({ length: entries.length }, (_, i) => i + 1);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <p className="text-sm text-muted">
        Defina a colocação final. Obrigatório até o {paidPositions}º lugar (posições premiadas); as demais são opcionais.
      </p>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1 truncate">{e.name}</span>
            <select
              name={`pos_${e.id}`}
              value={positions[e.id] ?? ""}
              onChange={(ev) => setPositions((ps) => ({ ...ps, [e.id]: ev.target.value }))}
              className={`${input.replace("w-full", "w-24")} shrink-0`} aria-label={`Colocação de ${e.name}`}>
              <option value="">—</option>
              {options.map((n) => (
                <option key={n} value={n}>
                  {n}º
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <ErrorText>{state?.error}</ErrorText>
      <SubmitButton className="w-full rounded-lg bg-gold px-5 py-3 font-medium text-black" confirm="Finalizar o torneio e gravar os prêmios?">
        Finalizar torneio
      </SubmitButton>
    </form>
  );
}
