import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { deleteTournament } from "@/app/actions/tournaments";
import { SubmitButton } from "@/components/SubmitButton";
import { TournamentForm } from "@/components/TournamentForm";
import { btnDanger, Card, PageHeader } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { dateToInput } from "@/lib/dates";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/money";
import { calcPot, parsePrizeRules } from "@/lib/prize";
import { getTemplates } from "@/lib/templates";

export const metadata: Metadata = { title: "Editar torneio" };

export default async function EditTournamentPage({ params }: PageProps<"/torneios/[id]/editar">) {
  const { id } = await params;
  if (!(await isAdmin())) redirect(`/login?next=/torneios/${id}/editar`);
  const t = await db.tournament.findUnique({ where: { id: Number(id) || 0 }, include: { entries: true } });
  if (!t) notFound();
  const templates = await getTemplates();

  return (
    <>
      <PageHeader title="Editar torneio" subtitle={t.name} />
      {t.status === "FINISHED" && (
        <p className="mb-4 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
          Este torneio já foi finalizado. Mudanças em valores ou premiação só recalculam os prêmios se você reabrir e finalizar de novo.
        </p>
      )}
      <TournamentForm
        templates={templates}
        current={{ pot: calcPot(t.buyIn, t.rebuyPrice, t.entries), players: t.entries.length }}
        defaults={{
          id: t.id,
          name: t.name,
          date: dateToInput(t.date),
          location: t.location ?? "",
          buyIn: centsToInput(t.buyIn),
          rebuyPrice: centsToInput(t.rebuyPrice),
          maxRebuys: t.maxRebuys != null ? String(t.maxRebuys) : "",
          notes: t.notes ?? "",
          prizeRules: parsePrizeRules(t.prizeRules),
        }}
      />
      <Card title="Zona de perigo" className="mt-8 border-loss/30">
        <form action={deleteTournament} className="flex flex-wrap items-center justify-between gap-3">
          <input type="hidden" name="id" value={t.id} />
          <p className="text-sm text-muted">Excluir o torneio apaga também os resultados dele do ranking.</p>
          <SubmitButton className={btnDanger} confirm="Excluir este torneio definitivamente?">
            Excluir torneio
          </SubmitButton>
        </form>
      </Card>
    </>
  );
}
