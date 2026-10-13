import { describe, expect, it } from "vitest";
import { loginBlockState, MAX_FAILURES } from "../loginLimit";

const now = new Date("2026-10-12T20:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);

describe("loginBlockState", () => {
  it("libera abaixo do limite e informa tentativas restantes", () => {
    expect(loginBlockState([minutesAgo(1), minutesAgo(2)], now)).toEqual({ blocked: false, retryInMinutes: 0, remaining: 3 });
  });

  it("bloqueia ao atingir o limite", () => {
    const failures = Array.from({ length: MAX_FAILURES }, (_, i) => minutesAgo(i + 1)); // 1..5 min atrás
    expect(loginBlockState(failures, now)).toMatchObject({ blocked: true, retryInMinutes: 10 });
  });

  it("ignora falhas fora da janela de 15 minutos", () => {
    const failures = [minutesAgo(16), minutesAgo(20), minutesAgo(30), minutesAgo(1), minutesAgo(2)];
    expect(loginBlockState(failures, now)).toMatchObject({ blocked: false, remaining: 3 });
  });

  it("sem falhas, nunca bloqueia", () => {
    expect(loginBlockState([], now).blocked).toBe(false);
  });
});
