import Link from "next/link";
import { RankingTable } from "@/components/RankingTable";
import { TournamentList, tournamentListInclude } from "@/components/TournamentList";
import { btnPrimary, Card, PageHeader } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRanking } from "@/lib/queries";

export default async function HomePage() {
  const year = new Date().getFullYear();
  const [admin, ranking, open, recent] = await Promise.all([
    isAdmin(),
    getRanking({ year }),
    db.tournament.findMany({ where: { status: "OPEN" }, orderBy: { date: "desc" }, include: tournamentListInclude }),
    db.tournament.findMany({ where: { status: "FINISHED" }, orderBy: { date: "desc" }, take: 5, include: tournamentListInclude }),
  ]);

  return (
    <>
      <PageHeader
        title="TCLÃ Poker"
        subtitle="Torneios, premiação e ranking da mesa."
        actions={
          admin && (
            <Link href="/torneios/novo" className={btnPrimary}>
              + Novo torneio
            </Link>
          )
        }
      />

      {open.length > 0 && (
        <Card title="Em andamento" className="mb-4 border-gold/40">
          <TournamentList items={open} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card
          title={`Ranking ${year}`}
          actions={
            <Link href="/ranking" className="text-sm text-gold hover:underline">
              Ver completo
            </Link>
          }
        >
          <RankingTable stats={ranking.slice(0, 10)} compact />
        </Card>
        <Card
          title="Últimos torneios"
          className="self-start"
          actions={
            <Link href="/torneios" className="text-sm text-gold hover:underline">
              Todos
            </Link>
          }
        >
          <TournamentList items={recent} empty="Nenhum torneio finalizado." />
        </Card>
      </div>
    </>
  );
}
