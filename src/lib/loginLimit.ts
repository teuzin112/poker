export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const FAILURE_DELAY_MS = 1000;

/**
 * Decide se um IP está bloqueado a partir das falhas recentes (dentro da janela).
 * Bloqueia ao atingir MAX_FAILURES; libera quando a falha mais antiga sai da janela.
 */
export function loginBlockState(failures: Date[], now: Date): { blocked: boolean; retryInMinutes: number; remaining: number } {
  const recent = failures.filter((d) => now.getTime() - d.getTime() < WINDOW_MS).sort((a, b) => a.getTime() - b.getTime());
  if (recent.length < MAX_FAILURES) {
    return { blocked: false, retryInMinutes: 0, remaining: MAX_FAILURES - recent.length };
  }
  // Libera quando restarem menos de MAX_FAILURES falhas dentro da janela.
  const unlockAt = recent[recent.length - MAX_FAILURES].getTime() + WINDOW_MS;
  return { blocked: true, retryInMinutes: Math.max(1, Math.ceil((unlockAt - now.getTime()) / 60000)), remaining: 0 };
}
