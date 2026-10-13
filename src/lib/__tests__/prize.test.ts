import { describe, expect, it } from "vitest";
import { calcPayouts, calcPot, DEFAULT_PRIZE_RULES, validateRules, type PrizeRule } from "../prize";
import { formatBRL, parseBRL } from "../money";

describe("calcPot", () => {
  it("soma buy-ins e rebuys", () => {
    expect(calcPot(5000, 5000, [{ rebuys: 0 }, { rebuys: 2 }, { rebuys: 1 }])).toBe(30000);
  });
  it("usa preço de rebuy diferente do buy-in", () => {
    expect(calcPot(5000, 3000, [{ rebuys: 1 }, { rebuys: 0 }])).toBe(13000);
  });
});

describe("calcPayouts", () => {
  it("regra padrão: 3º recebe 1 buy-in antes, restante 70/30", () => {
    // pote R$1000, buy-in R$50
    const { payouts, errors } = calcPayouts(100000, 5000, DEFAULT_PRIZE_RULES, 10);
    expect(errors).toEqual([]);
    expect(payouts).toEqual([
      { position: 1, amount: 66500 },
      { position: 2, amount: 28500 },
      { position: 3, amount: 5000 },
    ]);
  });

  it("total pago é sempre igual ao pote", () => {
    for (const pot of [12345, 99999, 100001, 33333]) {
      const { payouts } = calcPayouts(pot, 1000, DEFAULT_PRIZE_RULES, 8);
      expect(payouts.reduce((a, p) => a + p.amount, 0)).toBe(pot);
    }
  });

  it("sobra de arredondamento vai para o 1º", () => {
    const rules: PrizeRule[] = [
      { position: 1, type: "percent", value: 50 },
      { position: 2, type: "percent", value: 50 },
    ];
    const { payouts } = calcPayouts(1001, 100, rules);
    expect(payouts).toEqual([
      { position: 1, amount: 501 },
      { position: 2, amount: 500 },
    ]);
  });

  it("apenas percentuais", () => {
    const rules: PrizeRule[] = [
      { position: 1, type: "percent", value: 50 },
      { position: 2, type: "percent", value: 30 },
      { position: 3, type: "percent", value: 20 },
    ];
    const { payouts } = calcPayouts(100000, 5000, rules);
    expect(payouts.map((p) => p.amount)).toEqual([50000, 30000, 20000]);
  });

  it("valor fixo é descontado antes", () => {
    const rules: PrizeRule[] = [
      { position: 1, type: "percent", value: 100 },
      { position: 2, type: "fixed", value: 10000 },
    ];
    const { payouts } = calcPayouts(50000, 5000, rules);
    expect(payouts).toEqual([
      { position: 1, amount: 40000 },
      { position: 2, amount: 10000 },
    ]);
  });

  it("erro quando o pote não cobre os pagamentos fixos", () => {
    const { payouts, errors } = calcPayouts(4000, 5000, DEFAULT_PRIZE_RULES, 5);
    expect(payouts).toEqual([]);
    expect(errors[0]).toMatch(/não cobre/);
  });

  it("ignora posições acima do número de jogadores", () => {
    const { payouts } = calcPayouts(10000, 5000, DEFAULT_PRIZE_RULES, 2);
    expect(payouts).toEqual([
      { position: 1, amount: 7000 },
      { position: 2, amount: 3000 },
    ]);
  });
});

describe("validateRules", () => {
  it("percentuais precisam somar 100", () => {
    expect(
      validateRules([
        { position: 1, type: "percent", value: 60 },
        { position: 2, type: "percent", value: 30 },
      ]),
    ).toEqual(["Os percentuais somam 90%, mas precisam somar 100%."]);
  });
  it("posições repetidas", () => {
    expect(
      validateRules([
        { position: 1, type: "percent", value: 50 },
        { position: 1, type: "percent", value: 50 },
      ]),
    ).toContain("Há posições repetidas.");
  });
  it("regra padrão é válida", () => {
    expect(validateRules(DEFAULT_PRIZE_RULES)).toEqual([]);
  });
});

describe("money", () => {
  it("parseBRL aceita formatos comuns", () => {
    expect(parseBRL("50")).toBe(5000);
    expect(parseBRL("50,5")).toBe(5050);
    expect(parseBRL("1.234,56")).toBe(123456);
    expect(parseBRL("R$ 20")).toBe(2000);
    expect(parseBRL("20.5")).toBe(2050);
    expect(parseBRL("abc")).toBeNull();
    expect(parseBRL("")).toBeNull();
  });
  it("formatBRL", () => {
    expect(formatBRL(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });
});
