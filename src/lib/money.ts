const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata centavos como "R$ 1.234,56". */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/** Formata centavos com sinal explícito para lucro/prejuízo. */
export function formatSignedBRL(cents: number): string {
  if (cents > 0) return "+" + formatBRL(cents);
  return formatBRL(cents);
}

/**
 * Converte texto digitado pelo usuário em centavos.
 * Aceita "50", "50,5", "50,50", "1.234,56", "R$ 50" e "50.5".
 * Retorna null se não for um número válido.
 */
export function parseBRL(input: string | null | undefined): number | null {
  if (input == null) return null;
  let s = String(input).replace(/R\$/i, "").replace(/\s/g, "");
  if (s === "") return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** Centavos -> texto para preencher um input ("50" ou "50,50"). */
export function centsToInput(cents: number): string {
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** "1 jogo", "2 jogos". */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
