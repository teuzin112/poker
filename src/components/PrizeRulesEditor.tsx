"use client";

import { useState } from "react";
import { centsToInput, formatBRL, parseBRL } from "@/lib/money";
import { calcPayouts, validateRules, type PrizeRule, type PrizeRuleType } from "@/lib/prize";
import { btnIcon, btnSecondary, input } from "./ui";

type Row = { key: number; position: string; type: PrizeRuleType; value: string };
export type TemplateOption = { id: number; name: string; rules: PrizeRule[] };

let nextKey = 0;
function toRows(rules: PrizeRule[]): Row[] {
  return rules.map((r) => ({
    key: nextKey++,
    position: String(r.position),
    type: r.type,
    value: r.type === "fixed" ? centsToInput(r.value) : String(r.value).replace(".", ","),
  }));
}

function toRules(rows: Row[]): PrizeRule[] | null {
  const rules: PrizeRule[] = [];
  for (const row of rows) {
    const position = Number(row.position);
    const value = row.type === "fixed" ? parseBRL(row.value) : Number(row.value.replace(",", "."));
    if (!Number.isInteger(position) || position < 1 || value == null || !(value > 0)) return null;
    rules.push({ position, type: row.type, value });
  }
  return rules;
}

const typeLabels: Record<PrizeRuleType, string> = {
  percent: "% do restante",
  buyins: "Buy-ins",
  fixed: "Valor fixo (R$)",
};

/**
 * Edita a lista de regras de premiação e envia como JSON no campo oculto "prizeRules".
 * Se `example` for informado, mostra uma simulação da divisão.
 */
export function PrizeRulesEditor({
  initialRules,
  templates,
  example,
}: {
  initialRules: PrizeRule[];
  templates?: TemplateOption[];
  example?: { pot: number; buyIn: number; players: number; label: string };
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initialRules));
  const rules = toRules(rows);
  const errors = rules ? validateRules(rules) : ["Preencha posição e valor de todas as linhas."];
  const percentSum = rows
    .filter((r) => r.type === "percent")
    .reduce((acc, r) => acc + (Number(r.value.replace(",", ".")) || 0), 0);

  function update(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    const maxPos = rows.reduce((m, r) => Math.max(m, Number(r.position) || 0), 0);
    setRows((rs) => [...rs, { key: nextKey++, position: String(maxPos + 1), type: "percent", value: "" }]);
  }

  const preview = rules && errors.length === 0 && example ? calcPayouts(example.pot, example.buyIn, rules, example.players) : null;

  return (
    <div className="space-y-3">
      <input type="hidden" name="prizeRules" value={JSON.stringify(rules ?? [])} />

      {templates && templates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Carregar modelo:</span>
          {templates.map((t) => (
            <button key={t.id} type="button" className="rounded-full border border-line px-3 py-1 hover:border-gold" onClick={() => setRows(toRows(t.rules))}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="grid grid-cols-[3.5rem_1fr_5.5rem_2rem] gap-2 text-xs uppercase tracking-wide text-muted">
          <span>Posição</span>
          <span>Tipo</span>
          <span>Valor</span>
          <span />
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[3.5rem_1fr_5.5rem_2rem] items-center gap-2">
            <input
              aria-label="Posição"
              inputMode="numeric"
              className={`${input} text-center`}
              value={row.position}
              onChange={(e) => update(row.key, { position: e.target.value.replace(/\D/g, "") })}
            />
            <select aria-label="Tipo" className={input} value={row.type} onChange={(e) => update(row.key, { type: e.target.value as PrizeRuleType })}>
              {Object.entries(typeLabels).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
            <input
              aria-label="Valor"
              inputMode="decimal"
              className={`${input} text-right`}
              value={row.value}
              placeholder={row.type === "percent" ? "%" : row.type === "buyins" ? "1" : "R$"}
              onChange={(e) => update(row.key, { value: e.target.value })}
            />
            <button type="button" aria-label="Remover posição" className={btnIcon} onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}>
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className={btnSecondary} onClick={addRow}>
          + Posição
        </button>
        <span className={`text-sm tabular ${Math.abs(percentSum - 100) < 1e-9 ? "text-win" : "text-loss"}`}>Soma dos %: {percentSum}%</span>
      </div>

      <p className="text-xs text-muted">
        Buy-ins e valores fixos são pagos primeiro; o que sobra do pote é dividido pelos percentuais (que devem somar 100%).
      </p>

      {errors.length > 0 && <p className="text-sm text-loss">{errors[0]}</p>}

      {preview && preview.errors.length === 0 && example && (
        <div className="rounded-lg border border-line bg-bg p-3 text-sm">
          <div className="mb-2 text-xs text-muted">{example.label}</div>
          <ul className="space-y-1">
            {preview.payouts.map((p) => (
              <li key={p.position} className="flex justify-between">
                <span>{p.position}º lugar</span>
                <span className="tabular">{formatBRL(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
