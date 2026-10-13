import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Empty, Money, PageHeader } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { plural } from "@/lib/money";
import { getRanking } from "@/lib/queries";
import { PlayerForm } from "./PlayerForm";

export const metadata: Metadata = { title: "Jogadores" };

export default async function PlayersPage() {
  const [players, ranking, admin] = await Promise.all([
    db.player.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    getRanking(),
    isAdmin(),
  ]);
  const stats = new Map(ranking.map((s) => [s.playerId, s]));

  return (
    <>
      <PageHeader title="Jogadores" subtitle={`${players.filter((p) => p.active).length} ativos`} />
      {admin && (
        <Card title="Cadastrar jogador" className="mb-4">
          <PlayerForm />
        </Card>
      )}
      <Card>
        {players.length === 0 ? (
          <Empty>Nenhum jogador cadastrado.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {players.map((p) => {
              const s = stats.get(p.id);
              return (
                <li key={p.id}>
                  <Link href={`/jogadores/${p.id}`} className={`-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2/60 ${p.active ? "" : "opacity-60"}`}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-felt font-semibold">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        {!p.active && <Badge>Inativo</Badge>}
                      </span>
                      <span className="block text-xs text-muted">
                        {p.nickname ? `"${p.nickname}" · ` : ""}
                        {s ? `${plural(s.games, "jogo")} · ${plural(s.wins, "vitória")}` : "Sem jogos finalizados"}
                      </span>
                    </span>
                    {s && (
                      <span className="text-sm font-semibold">
                        <Money cents={s.profit} signed />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
