import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePlayer, togglePlayerActive } from "@/app/actions/players";
import { SubmitButton } from "@/components/SubmitButton";
import { Badge, btnDanger, btnSecondary, Card, Empty, Money, PageHeader, Position, Stat, table, td, tdRight, th, thRight } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { plural } from "@/lib/money";
import { entryCost } from "@/lib/prize";
import { getRanking } from "@/lib/queries";
import { PlayerForm } from "../PlayerForm";

async function load(id: string) {
  return db.player.findUnique({
    where: { id: Number(id) || 0 },
    include: { entries: { include: { tournament: true }, orderBy: { tournament: { date: "desc" } } } },
  });
}

export async function generateMetadata({ params }: PageProps<"/jogadores/[id]">): Promise<Metadata> {
  const p = await load((await params).id);
  return { title: p?.name ?? "Jogador" };
}

export default async function PlayerPage({ params }: PageProps<"/jogadores/[id]">) {
  const player = await load((await params).id);
  if (!player) notFound();
  const [admin, [stats]] = await Promise.all([isAdmin(), getRanking({ playerId: player.id })]);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {player.name}
            {!player.active && <Badge>Inativo</Badge>}
          </span>
        }
        subtitle={player.nickname ? `"${player.nickname}"` : undefined}
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        <Stat label="Lucro" value={<Money cents={stats?.profit ?? 0} signed />} hint={stats ? `ROI ${Math.round(stats.roi * 100)}%` : undefined} />
        <Stat label="Jogos" value={stats?.games ?? 0} hint={stats ? plural(stats.rebuys, "rebuy") : undefined} />
        <Stat label="Vitórias" value={stats?.wins ?? 0} />
        <Stat label="Premiado" value={stats?.itm ?? 0} hint={stats && stats.games > 0 ? `${Math.round((stats.itm / stats.games) * 100)}% dos jogos` : undefined} />
      </div>

      <Card title="Histórico">
        {player.entries.length === 0 ? (
          <Empty>Ainda não jogou nenhum torneio.</Empty>
        ) : (
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Torneio</th>
                <th className={`${th} w-14`}>Pos.</th>
                <th className={`${thRight} hidden sm:table-cell`}>Rebuys</th>
                <th className={`${thRight} hidden sm:table-cell`}>Prêmio</th>
                <th className={thRight}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {player.entries.map((e) => {
                const t = e.tournament;
                const finished = t.status === "FINISHED";
                return (
                  <tr key={e.id}>
                    <td className={td}>
                      <Link href={`/torneios/${t.id}`} className="font-medium hover:text-gold">
                        {t.name}
                      </Link>
                      <div className="text-xs text-muted">
                        {formatDate(t.date)}
                        <span className="sm:hidden"> · {plural(e.rebuys, "rebuy")}</span>
                      </div>
                    </td>
                    <td className={td}>{finished ? <Position value={e.position} /> : <Badge tone="gold">Aberto</Badge>}</td>
                    <td className={`${tdRight} hidden sm:table-cell`}>{e.rebuys}</td>
                    <td className={`${tdRight} hidden sm:table-cell`}>{e.prize > 0 ? <Money cents={e.prize} /> : "—"}</td>
                    <td className={tdRight}>
                      {finished ? <Money cents={e.prize - entryCost(t.buyIn, t.rebuyPrice, e.rebuys)} signed /> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {admin && (
        <Card title="Editar jogador" className="mt-4">
          <PlayerForm player={player} />
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <form action={togglePlayerActive}>
              <input type="hidden" name="id" value={player.id} />
              <SubmitButton className={btnSecondary}>{player.active ? "Inativar" : "Reativar"}</SubmitButton>
            </form>
            {player.entries.length === 0 && (
              <form action={deletePlayer}>
                <input type="hidden" name="id" value={player.id} />
                <SubmitButton className={btnDanger} confirm={`Excluir ${player.name}?`}>
                  Excluir
                </SubmitButton>
              </form>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">Jogadores inativos somem da lista ao montar um torneio, mas continuam no ranking.</p>
        </Card>
      )}
    </>
  );
}
