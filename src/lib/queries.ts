import "server-only";
import { db } from "./db";
import { calcRanking, type RankingRow } from "./ranking";

function yearRange(year: number) {
  return { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
}

/** Ranking por lucro líquido considerando só torneios finalizados. */
export async function getRanking(opts: { year?: number; playerId?: number } = {}) {
  const entries = await db.entry.findMany({
    where: {
      playerId: opts.playerId,
      tournament: {
        status: "FINISHED",
        date: opts.year ? yearRange(opts.year) : undefined,
      },
    },
    include: {
      player: { select: { name: true } },
      tournament: { select: { buyIn: true, rebuyPrice: true } },
    },
  });
  const rows: RankingRow[] = entries.map((e) => ({
    playerId: e.playerId,
    playerName: e.player.name,
    buyIn: e.tournament.buyIn,
    rebuyPrice: e.tournament.rebuyPrice,
    rebuys: e.rebuys,
    position: e.position,
    prize: e.prize,
  }));
  return calcRanking(rows);
}

/** Anos que têm torneios finalizados, do mais recente ao mais antigo. */
export async function getYears(): Promise<number[]> {
  const ts = await db.tournament.findMany({ where: { status: "FINISHED" }, select: { date: true } });
  return [...new Set(ts.map((t) => t.date.getUTCFullYear()))].sort((a, b) => b - a);
}
