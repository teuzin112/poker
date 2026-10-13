import { entryCost } from "./prize";

export type RankingRow = {
  playerId: number;
  playerName: string;
  buyIn: number;
  rebuyPrice: number;
  rebuys: number;
  position: number | null;
  prize: number;
};

export type PlayerStats = {
  playerId: number;
  name: string;
  games: number;
  wins: number;
  itm: number; // vezes que ganhou prêmio
  rebuys: number;
  invested: number;
  won: number;
  profit: number;
  roi: number; // lucro / investido (0..n), 0 se nada investido
};

/** Agrega resultados de torneios finalizados por jogador. Ordem: lucro, ROI, vitórias. */
export function calcRanking(rows: RankingRow[]): PlayerStats[] {
  const byPlayer = new Map<number, PlayerStats>();
  for (const r of rows) {
    let s = byPlayer.get(r.playerId);
    if (!s) {
      s = {
        playerId: r.playerId,
        name: r.playerName,
        games: 0,
        wins: 0,
        itm: 0,
        rebuys: 0,
        invested: 0,
        won: 0,
        profit: 0,
        roi: 0,
      };
      byPlayer.set(r.playerId, s);
    }
    s.games += 1;
    s.rebuys += r.rebuys;
    s.invested += entryCost(r.buyIn, r.rebuyPrice, r.rebuys);
    s.won += r.prize;
    if (r.position === 1) s.wins += 1;
    if (r.prize > 0) s.itm += 1;
  }

  const stats = [...byPlayer.values()];
  for (const s of stats) {
    s.profit = s.won - s.invested;
    s.roi = s.invested > 0 ? s.profit / s.invested : 0;
  }
  return stats.sort(
    (a, b) => b.profit - a.profit || b.roi - a.roi || b.wins - a.wins || a.name.localeCompare(b.name),
  );
}
