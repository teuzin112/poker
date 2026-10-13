import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { changeRebuys, removeEntry, reopenTournament } from "@/app/actions/tournaments";
import { SubmitButton } from "@/components/SubmitButton";
import {
  Badge,
  btnIcon,
  btnSecondary,
  Card,
  Empty,
  Money,
  PageHeader,
  Position,
  Stat,
  table,
  td,
  tdRight,
  th,
  thRight,
} from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatBRL, plural } from "@/lib/money";
import { calcPayouts, calcPot, describeRule, entryCost, parsePrizeRules } from "@/lib/prize";
import { AddPlayerForm } from "./AddPlayerForm";
import { FinishForm } from "./FinishForm";

async function load(id: string) {
  return db.tournament.findUnique({
    where: { id: Number(id) || 0 },
    include: { entries: { include: { player: true } } },
  });
}

export async function generateMetadata({ params }: PageProps<"/torneios/[id]">): Promise<Metadata> {
  const t = await load((await params).id);
  return { title: t?.name ?? "Torneio" };
}

export default async function TournamentPage({ params }: PageProps<"/torneios/[id]">) {
  const t = await load((await params).id);
  if (!t) notFound();
  const admin = await isAdmin();
  const open = t.status === "OPEN";
  const canEdit = admin && open;

  const entries = [...t.entries].sort(
    (a, b) => (a.position ?? Infinity) - (b.position ?? Infinity) || a.player.name.localeCompare(b.player.name),
  );
  const rules = parsePrizeRules(t.prizeRules);
  const pot = calcPot(t.buyIn, t.rebuyPrice, entries);
  const totalRebuys = entries.reduce((acc, e) => acc + e.rebuys, 0);
  const preview = calcPayouts(pot, t.buyIn, rules, Math.max(entries.length, 1));
  const byPosition = new Map(entries.filter((e) => e.position).map((e) => [e.position!, e]));

  const available = open
    ? await db.player.findMany({
        where: { active: true, id: { notIn: entries.map((e) => e.playerId) } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {t.name}
            {open ? <Badge tone="gold">Em andamento</Badge> : <Badge tone="win">Finalizado</Badge>}
          </span>
        }
        subtitle={
          <>
            {formatDate(t.date)}
            {t.location && ` · ${t.location}`} · Buy-in {formatBRL(t.buyIn)} · Rebuy {formatBRL(t.rebuyPrice)}
            {t.maxRebuys != null && ` (máx. ${t.maxRebuys})`}
          </>
        }
        actions={
          admin && (
            <Link href={`/torneios/${t.id}/editar`} className={btnSecondary}>
              Editar
            </Link>
          )
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 sm:order-last sm:col-span-1">
          <Stat label="Pote" value={formatBRL(pot)} />
        </div>
        <Stat label="Jogadores" value={entries.length} />
        <Stat label="Rebuys" value={totalRebuys} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {open ? (
            <Card title="Jogadores">
              {canEdit && (
                <div className="mb-4">
                  <AddPlayerForm tournamentId={t.id} available={available} />
                </div>
              )}
              {entries.length === 0 ? (
                <Empty>Nenhum jogador ainda.</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {entries.map((e) => {
                    const atMax = t.maxRebuys != null && e.rebuys >= t.maxRebuys;
                    return (
                      <li key={e.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{e.player.name}</div>
                          <div className="text-xs text-muted">
                            Investido <Money cents={entryCost(t.buyIn, t.rebuyPrice, e.rebuys)} />
                          </div>
                        </div>
                        {canEdit ? (
                          <div className="flex items-center gap-1.5">
                            <form action={changeRebuys}>
                              <input type="hidden" name="entryId" value={e.id} />
                              <input type="hidden" name="delta" value="-1" />
                              <button className={`${btnIcon} size-10 sm:size-8`} disabled={e.rebuys === 0} aria-label={`Remover rebuy de ${e.player.name}`}>
                                −
                              </button>
                            </form>
                            <div className="w-12 text-center">
                              <div className="tabular text-lg leading-none font-semibold">{e.rebuys}</div>
                              <div className="text-[10px] uppercase text-muted">rebuys</div>
                            </div>
                            <form action={changeRebuys}>
                              <input type="hidden" name="entryId" value={e.id} />
                              <input type="hidden" name="delta" value="1" />
                              <button
                                className={`${btnIcon} size-10 border-gold/50 text-gold sm:size-8`}
                                disabled={atMax}
                                aria-label={`Adicionar rebuy para ${e.player.name}`}
                              >
                                +
                              </button>
                            </form>
                            <form action={removeEntry} className="ml-1">
                              <input type="hidden" name="entryId" value={e.id} />
                              <SubmitButton
                                className="px-1 text-lg text-muted hover:text-loss"
                                confirm={`Remover ${e.player.name} do torneio?`}
                              >
                                <span aria-label={`Remover ${e.player.name}`}>×</span>
                              </SubmitButton>
                            </form>
                          </div>
                        ) : (
                          <span className="text-sm text-muted">{plural(e.rebuys, "rebuy")}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          ) : (
            <Card title="Resultado">
              <table className={table}>
                <thead>
                  <tr>
                    <th className={`${th} w-14`}>Pos.</th>
                    <th className={th}>Jogador</th>
                    <th className={`${thRight} hidden sm:table-cell`}>Rebuys</th>
                    <th className={`${thRight} hidden sm:table-cell`}>Investido</th>
                    <th className={`${thRight} hidden sm:table-cell`}>Prêmio</th>
                    <th className={thRight}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const cost = entryCost(t.buyIn, t.rebuyPrice, e.rebuys);
                    return (
                      <tr key={e.id}>
                        <td className={td}>
                          <Position value={e.position} />
                        </td>
                        <td className={td}>
                          <Link href={`/jogadores/${e.playerId}`} className="font-medium hover:text-gold">
                            {e.player.name}
                          </Link>
                          <div className="text-xs text-muted sm:hidden">
                            {plural(e.rebuys, "rebuy")}{e.prize > 0 && <> · prêmio {formatBRL(e.prize)}</>}
                          </div>
                        </td>
                        <td className={`${tdRight} hidden sm:table-cell`}>{e.rebuys}</td>
                        <td className={`${tdRight} hidden sm:table-cell`}>
                          <Money cents={cost} />
                        </td>
                        <td className={`${tdRight} hidden sm:table-cell`}>{e.prize > 0 ? <Money cents={e.prize} /> : "—"}</td>
                        <td className={tdRight}>
                          <Money cents={e.prize - cost} signed />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {admin && (
                <form action={reopenTournament} className="mt-4 flex justify-end">
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton className={btnSecondary} confirm="Reabrir o torneio para corrigir? Os prêmios serão recalculados ao finalizar de novo.">
                    Reabrir torneio
                  </SubmitButton>
                </form>
              )}
            </Card>
          )}

          {canEdit && entries.length >= 2 && (
            <Card title="Finalizar">
              <FinishForm
                tournamentId={t.id}
                paidPositions={preview.payouts.length}
                entries={entries.map((e) => ({ id: e.id, name: e.player.name, position: e.position }))}
              />
            </Card>
          )}
        </div>

        <Card title="Premiação" className="self-start">
          <ul className="space-y-2.5">
            {(preview.errors.length === 0 ? preview.payouts : []).map((p) => {
              const rule = rules.find((r) => r.position === p.position);
              const winner = open ? undefined : byPosition.get(p.position);
              return (
                <li key={p.position} className="flex items-start justify-between gap-3">
                  <div>
                    <Position value={p.position} />
                    <div className="text-xs text-muted">
                      {winner ? winner.player.name : rule ? describeRule(rule) : ""}
                    </div>
                  </div>
                  <span className="tabular font-semibold text-gold">{formatBRL(open ? p.amount : (winner?.prize ?? p.amount))}</span>
                </li>
              );
            })}
          </ul>
          {preview.errors.length > 0 && <p className="text-sm text-loss">{preview.errors[0]}</p>}
          {open && <p className="mt-4 text-xs text-muted">Prévia com o pote atual — atualiza a cada jogador ou rebuy.</p>}
          {t.notes && <p className="mt-4 border-t border-line pt-3 text-sm text-muted">{t.notes}</p>}
        </Card>
      </div>
    </>
  );
}
