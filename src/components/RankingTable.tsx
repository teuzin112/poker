import Link from "next/link";
import type { PlayerStats } from "@/lib/ranking";
import { plural } from "@/lib/money";
import { Empty, Money, table, td, tdRight, th, thRight } from "./ui";

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${Math.round(n * 100)}%`;
}

function Rank({ i }: { i: number }) {
  const colors = ["text-gold", "text-zinc-300", "text-amber-600"];
  return <span className={`tabular font-semibold ${colors[i] ?? "text-muted"}`}>{i + 1}</span>;
}

export function RankingTable({ stats, compact = false }: { stats: PlayerStats[]; compact?: boolean }) {
  if (stats.length === 0) return <Empty>Nenhum torneio finalizado ainda.</Empty>;
  return (
    <>
      {/* Celular: lista em cartões */}
      <ol className="-mx-1 space-y-1 sm:hidden">
        {stats.map((s, i) => (
          <li key={s.playerId}>
            <Link href={`/jogadores/${s.playerId}`} className="flex items-center gap-3 rounded-lg px-1 py-2 active:bg-surface-2">
              <span className="w-6 text-center">
                <Rank i={i} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{s.name}</span>
                <span className="block text-xs text-muted">
                  {plural(s.games, "jogo")} · {plural(s.wins, "vitória")} · ROI {pct(s.roi)}
                </span>
              </span>
              <span className="text-right font-semibold">
                <Money cents={s.profit} signed />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Telas maiores: tabela */}
      <table className={`${table} hidden sm:table`}>
        <thead>
          <tr>
            <th className={`${th} w-10`}>#</th>
            <th className={th}>Jogador</th>
            <th className={thRight}>Jogos</th>
            <th className={thRight}>Vitórias</th>
            {!compact && <th className={thRight}>ITM</th>}
            {!compact && <th className={thRight}>Investido</th>}
            {!compact && <th className={thRight}>Prêmios</th>}
            <th className={thRight}>ROI</th>
            <th className={thRight}>Lucro</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => (
            <tr key={s.playerId} className="hover:bg-surface-2/60">
              <td className={td}>
                <Rank i={i} />
              </td>
              <td className={td}>
                <Link href={`/jogadores/${s.playerId}`} className="font-medium hover:text-gold">
                  {s.name}
                </Link>
              </td>
              <td className={tdRight}>{s.games}</td>
              <td className={tdRight}>{s.wins}</td>
              {!compact && <td className={tdRight}>{s.itm}</td>}
              {!compact && (
                <td className={tdRight}>
                  <Money cents={s.invested} />
                </td>
              )}
              {!compact && (
                <td className={tdRight}>
                  <Money cents={s.won} />
                </td>
              )}
              <td className={tdRight}>{pct(s.roi)}</td>
              <td className={`${tdRight} font-semibold`}>
                <Money cents={s.profit} signed />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
