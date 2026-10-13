"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveTemplate } from "@/app/actions/templates";
import { PrizeRulesEditor } from "@/components/PrizeRulesEditor";
import { SubmitButton } from "@/components/SubmitButton";
import { btnSecondary, ErrorText, input, label } from "@/components/ui";
import type { PrizeRule } from "@/lib/prize";

export function TemplateForm({ template }: { template: { id?: number; name: string; rules: PrizeRule[] } }) {
  const [state, action] = useActionState(saveTemplate, undefined);
  const [name, setName] = useState(template.name);
  return (
    <form action={action} className="space-y-4">
      {template.id && <input type="hidden" name="id" value={template.id} />}
      <div>
        <label className={label} htmlFor="tpl-name">
          Nome do modelo
        </label>
        <input id="tpl-name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Ex.: Mesa cheia (top 4)" />
      </div>
      <PrizeRulesEditor
        initialRules={template.rules}
        example={{ pot: 100000, buyIn: 5000, players: 20, label: "Simulação: pote de R$ 1.000 com buy-in de R$ 50" }}
      />
      <ErrorText>{state?.error}</ErrorText>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {template.id && (
          <Link href="/configuracoes/premiacoes" className={btnSecondary}>
            Cancelar
          </Link>
        )}
        <SubmitButton>{template.id ? "Salvar modelo" : "Criar modelo"}</SubmitButton>
      </div>
    </form>
  );
}
