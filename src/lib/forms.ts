import { parsePrizeRules, validateRules, type PrizeRule } from "./prize";

/** Lê e valida o campo oculto "prizeRules" (JSON) enviado pelo PrizeRulesEditor. */
export function readRulesField(formData: FormData): { rules: PrizeRule[] } | { error: string } {
  let rules: PrizeRule[];
  try {
    rules = parsePrizeRules(JSON.parse(String(formData.get("prizeRules") ?? "[]")));
  } catch {
    return { error: "Regras de premiação inválidas: confira posições e valores." };
  }
  const errors = validateRules(rules);
  if (errors.length > 0) return { error: errors[0] };
  return { rules: [...rules].sort((a, b) => a.position - b.position) };
}
