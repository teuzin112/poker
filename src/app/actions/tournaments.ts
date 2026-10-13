"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { inputToDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { readRulesField } from "@/lib/forms";
import { parseBRL } from "@/lib/money";
import { calcPayouts, calcPot, parsePrizeRules } from "@/lib/prize";
import type { FormState } from "./auth";

function readTournamentForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Informe o nome do torneio." } as const;
  const date = inputToDate(String(formData.get("date") ?? ""));
  if (!date) return { error: "Data inválida." } as const;
  const buyIn = parseBRL(String(formData.get("buyIn") ?? ""));
  if (buyIn == null || buyIn <= 0) return { error: "Buy-in inválido." } as const;
  const rebuyRaw = String(formData.get("rebuyPrice") ?? "").trim();
  const rebuyPrice = rebuyRaw === "" ? buyIn : parseBRL(rebuyRaw);
  if (rebuyPrice == null || rebuyPrice < 0) return { error: "Valor do rebuy inválido." } as const;
  const maxRaw = String(formData.get("maxRebuys") ?? "").trim();
  const maxRebuys = maxRaw === "" ? null : Number(maxRaw);
  if (maxRebuys != null && (!Number.isInteger(maxRebuys) || maxRebuys < 0)) {
    return { error: "Limite de rebuys inválido." } as const;
  }
  const rules = readRulesField(formData);
  if ("error" in rules) return rules;
  return {
    data: {
      name: name.slice(0, 80),
      date,
      location: String(formData.get("location") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      buyIn,
      rebuyPrice,
      maxRebuys,
      prizeRules: rules.rules,
    },
  } as const;
}

export async function saveTournament(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = readTournamentForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  const id = Number(formData.get("id")) || null;
  let tournamentId: number;
  if (id) {
    const t = await db.tournament.findUniqueOrThrow({ where: { id }, include: { entries: true } });
    const { maxRebuys } = parsed.data;
    if (maxRebuys != null && t.entries.some((e) => e.rebuys > maxRebuys)) {
      return { error: "Já há jogadores com mais rebuys do que o novo limite." };
    }
    await db.tournament.update({ where: { id }, data: parsed.data });
    tournamentId = id;
  } else {
    tournamentId = (await db.tournament.create({ data: parsed.data })).id;
  }
  revalidatePath("/", "layout");
  redirect(`/torneios/${tournamentId}`);
}

export async function deleteTournament(formData: FormData) {
  await requireAdmin();
  await db.tournament.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/", "layout");
  redirect("/torneios");
}

async function getOpenTournament(id: number) {
  const t = await db.tournament.findUniqueOrThrow({ where: { id } });
  if (t.status !== "OPEN") throw new Error("Torneio finalizado: reabra para editar.");
  return t;
}

export async function addEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const tournamentId = Number(formData.get("tournamentId"));
  await getOpenTournament(tournamentId);

  let playerId = Number(formData.get("playerId")) || null;
  const newName = String(formData.get("newPlayer") ?? "").trim();
  if (!playerId && newName) {
    const existing = await db.player.findFirst({ where: { name: { equals: newName, mode: "insensitive" } } });
    playerId = existing?.id ?? (await db.player.create({ data: { name: newName.slice(0, 60) } })).id;
  }
  if (!playerId) return { error: "Escolha um jogador ou digite um nome." };

  try {
    await db.entry.create({ data: { tournamentId, playerId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Esse jogador já está no torneio." };
    }
    throw e;
  }
  revalidatePath("/", "layout");
  return {};
}

export async function removeEntry(formData: FormData) {
  await requireAdmin();
  const entry = await db.entry.findUniqueOrThrow({ where: { id: Number(formData.get("entryId")) } });
  await getOpenTournament(entry.tournamentId);
  await db.entry.delete({ where: { id: entry.id } });
  revalidatePath("/", "layout");
}

export async function changeRebuys(formData: FormData) {
  await requireAdmin();
  const delta = Number(formData.get("delta")) === -1 ? -1 : 1;
  const entry = await db.entry.findUniqueOrThrow({ where: { id: Number(formData.get("entryId")) } });
  const t = await getOpenTournament(entry.tournamentId);
  const rebuys = entry.rebuys + delta;
  if (rebuys < 0) return;
  if (t.maxRebuys != null && rebuys > t.maxRebuys) return;
  await db.entry.update({ where: { id: entry.id }, data: { rebuys } });
  revalidatePath("/", "layout");
}

const positionsSchema = z.array(z.object({ entryId: z.number().int(), position: z.number().int().min(1).nullable() }));

export async function finishTournament(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("tournamentId"));
  const t = await getOpenTournament(id);
  const entries = await db.entry.findMany({ where: { tournamentId: id } });
  if (entries.length < 2) return { error: "O torneio precisa de pelo menos 2 jogadores." };

  const positions = positionsSchema.parse(
    entries.map((e) => {
      const raw = String(formData.get(`pos_${e.id}`) ?? "");
      return { entryId: e.id, position: raw ? Number(raw) : null };
    }),
  );
  const used = positions.flatMap((p) => (p.position ? [p.position] : []));
  if (new Set(used).size !== used.length) return { error: "Duas pessoas estão com a mesma colocação." };
  if (used.some((p) => p > entries.length)) return { error: "Colocação maior que o número de jogadores." };

  const pot = calcPot(t.buyIn, t.rebuyPrice, entries);
  const { payouts, errors } = calcPayouts(pot, t.buyIn, parsePrizeRules(t.prizeRules), entries.length);
  if (errors.length > 0) return { error: errors[0] };
  const missing = payouts.filter((p) => !used.includes(p.position)).map((p) => `${p.position}º`);
  if (missing.length > 0) return { error: `Defina quem ficou em: ${missing.join(", ")}.` };

  const prizeByPosition = new Map(payouts.map((p) => [p.position, p.amount]));
  await db.$transaction([
    ...positions.map((p) =>
      db.entry.update({
        where: { id: p.entryId },
        data: { position: p.position, prize: p.position ? (prizeByPosition.get(p.position) ?? 0) : 0 },
      }),
    ),
    db.tournament.update({ where: { id }, data: { status: "FINISHED" } }),
  ]);
  revalidatePath("/", "layout");
  return {};
}

export async function reopenTournament(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.$transaction([
    db.entry.updateMany({ where: { tournamentId: id }, data: { prize: 0 } }),
    db.tournament.update({ where: { id }, data: { status: "OPEN" } }),
  ]);
  revalidatePath("/", "layout");
}
