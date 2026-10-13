"use client";

import { useActionState, useState } from "react";
import { saveTournament } from "@/app/actions/tournaments";
import { parseBRL } from "@/lib/money";
import type { PrizeRule } from "@/lib/prize";
import { PrizeRulesEditor, type TemplateOption } from "./PrizeRulesEditor";
import { SubmitButton } from "./SubmitButton";
import { Card, ErrorText, input, label } from "./ui";

export type TournamentDefaults = {
  id?: number;
  name: string;
  date: string;
  location: string;
  buyIn: string;
  rebuyPrice: string;
  maxRebuys: string;
  notes: string;
  prizeRules: PrizeRule[];
};

type Fields = Omit<TournamentDefaults, "id" | "prizeRules">;

export function TournamentForm({
  defaults,
  templates,
  current,
}: {
  defaults: TournamentDefaults;
  templates: TemplateOption[];
  /** Quando editando um torneio com jogadores, simula com o pote real. */
  current?: { pot: number; players: number };
}) {
  const [state, action] = useActionState(saveTournament, undefined);
  // Campos controlados para não perder o que foi digitado quando o servidor devolve um erro.
  const [fields, setFields] = useState<Fields>(defaults);
  const bind = (name: keyof Fields) => ({
    id: name,
    name,
    value: fields[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields((f) => ({ ...f, [name]: e.target.value })),
  });
  const buyInCents = parseBRL(fields.buyIn) ?? 0;

  const example =
    current && current.players > 0
      ? { pot: current.pot, buyIn: buyInCents, players: current.players, label: `Com o pote atual (${current.players} jogadores):` }
      : buyInCents > 0
        ? { pot: buyInCents * 10, buyIn: buyInCents, players: 10, label: "Simulação: 10 jogadores, sem rebuys" }
        : undefined;

  return (
    <form action={action} className="space-y-4">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <Card title="Dados do torneio">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="name">
              Nome
            </label>
            <input {...bind("name")} required className={input} placeholder="Ex.: Home Game #12" />
          </div>
          <div>
            <label className={label} htmlFor="date">
              Data
            </label>
            <input {...bind("date")} type="date" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="location">
              Local
            </label>
            <input {...bind("location")} className={input} placeholder="Casa do fulano" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="buyIn">
                Buy-in (R$)
              </label>
              <input {...bind("buyIn")} required inputMode="decimal" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="rebuyPrice">
                Rebuy (R$)
              </label>
              <input {...bind("rebuyPrice")} inputMode="decimal" className={input} placeholder="= buy-in" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={label} htmlFor="maxRebuys">
                Limite de rebuys por jogador
              </label>
              <input {...bind("maxRebuys")} inputMode="numeric" className={input} placeholder="Sem limite" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="notes">
              Observações
            </label>
            <textarea {...bind("notes")} rows={2} className={input} />
          </div>
        </div>
      </Card>

      <Card title="Premiação">
        <PrizeRulesEditor initialRules={defaults.prizeRules} templates={templates} example={example} />
      </Card>

      <ErrorText>{state?.error}</ErrorText>
      <div className="flex justify-end">
        <SubmitButton className="w-full rounded-lg bg-gold px-5 py-3 font-medium text-black sm:w-auto">
          {defaults.id ? "Salvar alterações" : "Criar torneio"}
        </SubmitButton>
      </div>
    </form>
  );
}
