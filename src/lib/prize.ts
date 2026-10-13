import { z } from "zod";
import { formatBRL } from "./money";

/**
 * Regras de premiação por posição:
 * - "buyins": N × buy-in, pago antes da divisão percentual.
 * - "fixed":  valor fixo em centavos, pago antes da divisão percentual.
 * - "percent": % do que sobrar do pote depois dos pagamentos acima.
 */
export type PrizeRuleType = "percent" | "buyins" | "fixed";
export type PrizeRule = { position: number; type: PrizeRuleType; value: number };
export type Payout = { position: number; amount: number };

export const DEFAULT_PRIZE_RULES: PrizeRule[] = [
  { position: 1, type: "percent", value: 70 },
  { position: 2, type: "percent", value: 30 },
  { position: 3, type: "buyins", value: 1 },
];

export const prizeRulesSchema = z
  .array(
    z.object({
      position: z.number().int().min(1, "Posição deve ser 1 ou maior"),
      type: z.enum(["percent", "buyins", "fixed"]),
      value: z.number().positive("Valor deve ser maior que zero"),
    }),
  )
  .min(1, "Defina ao menos uma posição premiada");

export function parsePrizeRules(raw: unknown): PrizeRule[] {
  return prizeRulesSchema.parse(raw);
}

/** Erros estruturais das regras, independentes do pote. */
export function validateRules(rules: PrizeRule[]): string[] {
  const errors: string[] = [];
  if (rules.length === 0) errors.push("Defina ao menos uma posição premiada.");

  const positions = rules.map((r) => r.position);
  if (new Set(positions).size !== positions.length) {
    errors.push("Há posições repetidas.");
  }

  const percents = rules.filter((r) => r.type === "percent");
  const sum = percents.reduce((acc, r) => acc + r.value, 0);
  if (percents.length === 0) {
    errors.push("Ao menos uma posição precisa receber % do pote (para distribuir o restante).");
  } else if (Math.abs(sum - 100) > 1e-9) {
    errors.push(`Os percentuais somam ${sum}%, mas precisam somar 100%.`);
  }
  return errors;
}

export function entryCost(buyIn: number, rebuyPrice: number, rebuys: number): number {
  return buyIn + rebuys * rebuyPrice;
}

export function calcPot(buyIn: number, rebuyPrice: number, entries: { rebuys: number }[]): number {
  return entries.reduce((acc, e) => acc + entryCost(buyIn, rebuyPrice, e.rebuys), 0);
}

/**
 * Calcula quanto cada posição recebe.
 * Pagamentos fixos/em buy-ins saem primeiro; o restante é dividido pelos percentuais.
 * Sobra de arredondamento (centavos) vai para a melhor posição percentual.
 * Se `players` for informado, posições acima do número de jogadores são ignoradas.
 */
export function calcPayouts(
  pot: number,
  buyIn: number,
  rules: PrizeRule[],
  players?: number,
): { payouts: Payout[]; errors: string[] } {
  const errors = validateRules(rules);
  if (errors.length > 0) return { payouts: [], errors };

  const active = rules
    .filter((r) => players === undefined || r.position <= players)
    .sort((a, b) => a.position - b.position);

  const amounts = new Map<number, number>();
  let remaining = pot;
  for (const r of active) {
    if (r.type === "percent") continue;
    const amount = r.type === "buyins" ? Math.round(r.value * buyIn) : Math.round(r.value);
    amounts.set(r.position, amount);
    remaining -= amount;
  }

  if (remaining < 0) {
    return {
      payouts: [],
      errors: [`O pote (${formatBRL(pot)}) não cobre os pagamentos fixos.`],
    };
  }

  const percents = active.filter((r) => r.type === "percent");
  if (percents.length === 0) {
    return { payouts: [], errors: ["Nenhuma posição percentual se aplica a este número de jogadores."] };
  }
  // Se alguma posição percentual ficou de fora (poucos jogadores), redistribui proporcionalmente.
  const pctSum = percents.reduce((acc, r) => acc + r.value, 0);
  let distributed = 0;
  for (const r of percents) {
    const amount = Math.floor((remaining * r.value) / pctSum);
    amounts.set(r.position, amount);
    distributed += amount;
  }
  const top = percents[0].position;
  amounts.set(top, amounts.get(top)! + (remaining - distributed));

  const payouts = [...amounts.entries()]
    .map(([position, amount]) => ({ position, amount }))
    .sort((a, b) => a.position - b.position);
  return { payouts, errors: [] };
}

export function describeRule(rule: PrizeRule): string {
  switch (rule.type) {
    case "percent":
      return `${rule.value}% do restante`;
    case "buyins":
      return rule.value === 1 ? "1 buy-in" : `${rule.value} buy-ins`;
    case "fixed":
      return formatBRL(rule.value);
  }
}
