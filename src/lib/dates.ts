// Datas de torneio são salvas ao meio-dia UTC para não "pular" de dia por fuso horário.

export function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function dateToInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function inputToDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayInput(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
