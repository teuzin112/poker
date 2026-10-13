import "server-only";
import { db } from "./db";
import { DEFAULT_PRIZE_RULES, parsePrizeRules } from "./prize";

export async function getTemplates() {
  const templates = await db.prizeTemplate.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
  return templates.map((t) => ({ id: t.id, name: t.name, isDefault: t.isDefault, rules: parsePrizeRules(t.rules) }));
}

export async function getDefaultRules() {
  const t = await db.prizeTemplate.findFirst({ where: { isDefault: true } });
  return t ? parsePrizeRules(t.rules) : DEFAULT_PRIZE_RULES;
}
