import { describe, expect, it } from "vitest";
import { calcRanking, type RankingRow } from "../ranking";

const row = (playerId: number, playerName: string, rebuys: number, position: number | null, prize: number): RankingRow => ({
  playerId,
  playerName,
  buyIn: 5000,
  rebuyPrice: 5000,
  rebuys,
  position,
  prize,
});

describe("calcRanking", () => {
  it("ordena por lucro líquido e calcula estatísticas", () => {
    const rows: RankingRow[] = [
      // torneio 1
      row(1, "Ana", 1, 1, 15000),
      row(2, "Bruno", 0, 2, 5000),
      row(3, "Caio", 2, 3, 0),
      // torneio 2
      row(1, "Ana", 0, 3, 5000),
      row(2, "Bruno", 0, 1, 10000),
      row(3, "Caio", 0, 2, 5000),
    ];
    const ranking = calcRanking(rows);
    expect(ranking.map((r) => r.name)).toEqual(["Bruno", "Ana", "Caio"]);

    const bruno = ranking[0];
    expect(bruno).toMatchObject({ games: 2, wins: 1, itm: 2, invested: 10000, won: 15000, profit: 5000 });
    expect(bruno.roi).toBeCloseTo(0.5);

    const ana = ranking[1];
    expect(ana).toMatchObject({ games: 2, wins: 1, rebuys: 1, invested: 15000, won: 20000, profit: 5000 });

    const caio = ranking[2];
    expect(caio).toMatchObject({ games: 2, wins: 0, itm: 1, invested: 20000, won: 5000, profit: -15000 });
  });

  it("desempata por vitórias", () => {
    const ranking = calcRanking([row(1, "Ana", 0, 2, 5000), row(2, "Bruno", 0, 1, 5000)]);
    expect(ranking[0].name).toBe("Bruno");
  });
});
