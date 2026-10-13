import type { Metadata } from "next";
import Link from "next/link";
import { TournamentList, tournamentListInclude } from "@/components/TournamentList";
import { btnPrimary, Card, PageHeader } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Torneios" };

export default async function TournamentsPage() {
  const [tournaments, admin] = await Promise.all([
    db.tournament.findMany({ orderBy: [{ date: "desc" }, { id: "desc" }], include: tournamentListInclude }),
    isAdmin(),
  ]);
  return (
    <>
      <PageHeader
        title="Torneios"
        subtitle={`${tournaments.length} registrados`}
        actions={
          admin && (
            <Link href="/torneios/novo" className={btnPrimary}>
              + Novo torneio
            </Link>
          )
        }
      />
      <Card>
        <TournamentList items={tournaments} />
      </Card>
    </>
  );
}
